import re
import secrets
import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from app.application.validaciones import (
    normalizar_correo, normalizar_documento, problema_contacto, problema_correo, problema_direccion,
    problema_documento, problema_nombre, problema_telefono, problemas_contrasena,
)
from app.domain.entities.usuario import NuevoCliente, PerfilCliente, Usuario
from app.domain.exceptions.errors import (
    AuthError, ConflictError, DemasiadosIntentosError, ForbiddenError,
    TokenInvalidoError, ValidacionError,
)
from app.domain.interfaces.auth_repository import IAuthRepository
from app.domain.interfaces.seguridad import IEmailService, IHasher, ITokenService, IVerificadorCorreo

# Hash bcrypt "de relleno": se verifica cuando el correo no existe para que la
# respuesta tarde lo mismo y no se pueda adivinar qué correos están registrados.
_HASH_RELLENO = "$2a$12$OIKVxWkPfrhee9SqSSfD4uIXgRLpg9F4PoqWKa2LdYs7raRcpwAU6"

MENSAJE_CODIGO_ENVIADO = (
    "Si el correo está registrado, te enviamos un código de 6 dígitos. Revisa también la carpeta de spam."
)


# Verificación en vivo de la contraseña actual (Mi perfil): máximo de consultas por
# usuario en una ventana de tiempo, para que no se pueda usar para adivinar contraseñas.
VERIFICACIONES_MAXIMAS = 10
VENTANA_VERIFICACION_SEG = 60
_verificaciones: dict[str, deque] = defaultdict(deque)
_candado_verificaciones = threading.Lock()


@dataclass
class ConfigAuth:
    minutos_sesion: int
    minutos_restablecer: int
    minutos_codigo: int
    segundos_reenvio: int
    max_intentos: int
    frontend_url: str = "http://localhost:5173"   # para armar el enlace de activación
    horas_invitacion: int = 72                    # vigencia del enlace para activar la cuenta


def _ocultar_correo(correo: str) -> str:
    """juan.perez@gmail.com -> ju*******@gmail.com (para avisar a dónde llegó el correo sin revelarlo)."""
    usuario, _, dominio = correo.partition("@")
    return f"{usuario[:2]}{'*' * max(len(usuario) - 2, 3)}@{dominio}"


@dataclass
class Sesion:
    token: str
    usuario: Usuario


class AuthService:
    """Gestión de Acceso: login, registro de clientes, recuperación y cambio de contraseña
    (HU_13, HU_14, PBI-13 a PBI-21)."""

    def __init__(self, repo: IAuthRepository, hasher: IHasher, tokens: ITokenService,
                 correo: IEmailService, verificador: IVerificadorCorreo, config: ConfigAuth):
        self.repo = repo
        self.hasher = hasher
        self.tokens = tokens
        self.correo = correo
        self.verificador = verificador
        self.config = config

    # ================================================================ Sesión
    def iniciar_sesion(self, correo: str, contrasena: str) -> Sesion:
        correo = normalizar_correo(correo)
        if problema_correo(correo) or not contrasena:
            raise ValidacionError("Ingresa un correo válido y tu contraseña.")
        usuario = self.repo.buscar_por_correo(correo)
        if usuario is None:
            self.hasher.verificar(contrasena, _HASH_RELLENO)
            raise AuthError("Correo o contraseña incorrectos.")
        if not usuario.tiene_cuenta:  # cliente registrado por el taller que aún no activa su cuenta
            self.hasher.verificar(contrasena, _HASH_RELLENO)
            raise ForbiddenError(
                "Tu cuenta aún no está activada. Usa el enlace que te enviamos al correo, "
                "o «¿Olvidaste tu contraseña?» para crear una.")
        if not self.hasher.verificar(contrasena, usuario.contrasena_hash):
            raise AuthError("Correo o contraseña incorrectos.")
        if not usuario.activo:  # CA_12_01 / CA_23_01
            raise ForbiddenError("Tu cuenta está inactiva. Comunícate con el administrador del taller.")
        return Sesion(self._token_sesion(usuario), usuario)

    def usuario_desde_token(self, token: str) -> Usuario:
        datos = self.tokens.leer(token)
        if datos.get("proposito") != "sesion":
            raise TokenInvalidoError("Sesión inválida. Inicia sesión de nuevo.")
        usuario = self.repo.buscar_por_id(datos["tipo"], datos["sub"])
        if usuario is None or not usuario.activo:
            raise TokenInvalidoError("Tu cuenta ya no está activa.")
        # PBI-21: si la contraseña cambió, version_token subió y este token ya no sirve
        if datos.get("ver") != usuario.version_token:
            raise TokenInvalidoError("Tu sesión se cerró porque la contraseña cambió. Inicia sesión con la nueva contraseña.")
        return usuario

    def _token_sesion(self, usuario: Usuario) -> str:
        return self.tokens.crear(
            {"sub": usuario.id, "tipo": usuario.tipo, "rol": usuario.rol,
             "ver": usuario.version_token, "proposito": "sesion"},
            self.config.minutos_sesion,
        )

    # ================================================================ Registro de clientes (PBI-14/15/16)
    def registrar_cliente(self, tipo_documento: str, numero_documento: str, nombre: str, correo: str,
                          tipo_telefono: str, telefono: str, direccion: str | None,
                          contrasena: str, confirmar: str, nombre_contacto: str | None = None) -> Sesion:
        numero_documento = normalizar_documento(tipo_documento, numero_documento)
        nombre_contacto = " ".join((nombre_contacto or "").split()) or None
        telefono = re.sub(r"[\s\-()+]", "", telefono or "")
        correo = normalizar_correo(correo)
        direccion = (direccion or "").strip() or None

        for problema in (
            problema_documento(tipo_documento, numero_documento),
            problema_nombre(nombre),
            problema_contacto(tipo_documento, nombre_contacto),
            problema_correo(correo),
            problema_telefono(tipo_telefono, telefono),
            problema_direccion(direccion),
        ):
            if problema:
                raise ValidacionError(problema)
        self._validar_contrasena(contrasena)
        if contrasena != confirmar:
            raise ValidacionError("Las contraseñas no coinciden.")

        # ¿El taller ya lo había registrado (cliente sin cuenta)? No se crea otro: se le envía
        # la invitación al correo que el taller tiene guardado (así nadie se queda con una cuenta ajena).
        registrado = self.repo.buscar_por_id("Cliente", numero_documento) or self.repo.buscar_por_correo(correo)
        if registrado is not None and registrado.tipo == "Cliente" and not registrado.tiene_cuenta:
            self.invitar_cliente(registrado)
            raise ConflictError(
                "El taller ya te tenía registrado. Te enviamos un enlace a "
                f"{_ocultar_correo(registrado.correo)} para que actives tu cuenta.")
        if self.repo.existe_documento(numero_documento):  # CA_19_02
            raise ConflictError(f"Ya existe una cuenta con el documento {numero_documento}.")
        if self.repo.existe_correo(correo):
            raise ConflictError("Ese correo ya está registrado. Inicia sesión o usa «¿Olvidaste tu contraseña?».")
        if not self.verificador.dominio_recibe_correo(correo):
            raise ValidacionError(f"El dominio @{correo.split('@')[1]} no existe o no recibe correos. Revisa el correo.")

        usuario = self.repo.crear_cliente(NuevoCliente(
            tipo_documento=tipo_documento, numero_documento=numero_documento,
            nombre=" ".join(nombre.split()), correo=correo,
            tipo_telefono=tipo_telefono, telefono=telefono, direccion=direccion,
            contrasena_hash=self.hasher.hashear(contrasena),
            nombre_contacto=nombre_contacto if tipo_documento == "NIT" else None,
        ))
        return Sesion(self._token_sesion(usuario), usuario)

    # ================================================================ Invitación de clientes (tabla usuarios)
    def invitar_cliente(self, usuario: Usuario) -> None:
        """Envía (o reenvía) el enlace para que un cliente registrado por el taller active su cuenta.
        Cada invitación nueva deja sin efecto el enlace anterior."""
        if usuario.tipo != "Cliente":
            raise ValidacionError("Solo se invitan clientes. A los empleados se les reenvía el acceso desde Empleados.")
        if usuario.tiene_cuenta:
            raise ConflictError(f"{usuario.nombre} ya activó su cuenta.")
        if not usuario.activo:
            raise ConflictError(f"El cliente {usuario.nombre} está inactivo.")
        fecha = self.repo.marcar_invitado(usuario.id_usuario)
        token = self.tokens.crear(
            {"sub": usuario.id, "tipo": "Cliente", "inv": int(fecha.timestamp()), "proposito": "activar"},
            self.config.horas_invitacion * 60,
        )
        enlace = f"{self.config.frontend_url.rstrip('/')}/?activar={token}"
        self.correo.enviar_invitacion_cliente(usuario.correo, usuario.nombre, enlace, self.config.horas_invitacion)

    def invitar_cliente_por_nit(self, nit: str) -> Usuario:
        usuario = self.repo.buscar_por_id("Cliente", nit)
        if usuario is None:
            raise ValidacionError(f"No existe el cliente {nit}.")
        self.invitar_cliente(usuario)
        return self.repo.buscar_por_id("Cliente", nit)

    def invitar_si_corresponde(self, nit: str) -> bool:
        """Al crear su primera remisión: si el cliente nunca ha sido invitado, se le invita."""
        usuario = self.repo.buscar_por_id("Cliente", nit)
        if usuario is None or usuario.tiene_cuenta or not usuario.activo or usuario.estado_cuenta != "Sin acceso":
            return False
        self.invitar_cliente(usuario)
        return True

    def _usuario_de_invitacion(self, token: str) -> Usuario:
        datos = self.tokens.leer(token)
        if datos.get("proposito") != "activar":
            raise TokenInvalidoError("El enlace de activación no es válido.")
        usuario = self.repo.buscar_por_id("Cliente", datos["sub"])
        if usuario is None or not usuario.activo:
            raise ValidacionError("El enlace de activación no es válido. Comunícate con el taller.")
        if usuario.tiene_cuenta:
            raise ConflictError("Tu cuenta ya está activa. Inicia sesión con tu correo y contraseña.")
        # Solo sirve el enlace de la última invitación
        if usuario.fecha_invitacion is None or int(usuario.fecha_invitacion.timestamp()) != datos.get("inv"):
            raise ValidacionError("Este enlace fue reemplazado por uno más reciente. Usa el último correo que te enviamos.")
        return usuario

    def info_invitacion(self, token: str) -> Usuario:
        """Datos que se muestran en la pantalla "Activar cuenta"."""
        return self._usuario_de_invitacion(token)

    def activar_cuenta(self, token: str, contrasena: str, confirmar: str, acepta_datos: bool) -> Sesion:
        """El cliente crea su contraseña desde el enlace del correo y entra de una vez."""
        usuario = self._usuario_de_invitacion(token)
        if not acepta_datos:
            raise ValidacionError("Debes aceptar la política de tratamiento de datos para activar tu cuenta.")
        self._validar_contrasena(contrasena)
        if contrasena != confirmar:
            raise ValidacionError("Las contraseñas no coinciden.")
        self.repo.activar_cliente(usuario.id, self.hasher.hashear(contrasena))
        activo = self.repo.buscar_por_id("Cliente", usuario.id)
        return Sesion(self._token_sesion(activo), activo)

    # ================================================================ Recuperación (PBI-18/19/20)
    def solicitar_codigo(self, correo: str) -> None:
        """Genera y envía un código de 6 dígitos al correo de la cuenta.

        Sirve también para "Reenviar código": el código nuevo invalida al anterior.
        Solo se puede pedir otro después de `segundos_reenvio`.
        """
        correo = normalizar_correo(correo)
        problema = problema_correo(correo)
        if problema:
            raise ValidacionError(problema)

        usuario = self.repo.buscar_por_correo(correo)
        if usuario is None or not usuario.activo:
            return  # respuesta genérica: no se revela si el correo existe

        ultimo = self.repo.ultimo_codigo(correo)
        if ultimo is not None:
            transcurridos = (datetime.now(timezone.utc) - ultimo.fecha_creacion).total_seconds()
            espera = int(self.config.segundos_reenvio - transcurridos + 0.999)
            if espera > 0:
                raise DemasiadosIntentosError(f"Espera {espera} segundos para pedir otro código.")

        codigo = f"{secrets.randbelow(1_000_000):06d}"
        expira = datetime.now(timezone.utc) + timedelta(minutes=self.config.minutos_codigo)
        self.repo.guardar_codigo(usuario.correo, usuario.tipo, self.hasher.hashear(codigo), expira)
        try:
            self.correo.enviar_codigo_recuperacion(usuario.correo, usuario.nombre, codigo, self.config.minutos_codigo)
        except Exception:
            self.repo.marcar_codigos_usados(usuario.correo)  # un código que no llegó no debe servir
            raise

    def verificar_codigo(self, correo: str, codigo: str) -> str:
        """Si el código es correcto devuelve un permiso temporal para escribir la nueva contraseña."""
        correo = normalizar_correo(correo)
        codigo = (codigo or "").strip()
        if not re.fullmatch(r"\d{6}", codigo):
            raise ValidacionError("El código tiene 6 números.")
        registro = self.repo.ultimo_codigo(correo)
        if registro is None or registro.usado:
            raise ValidacionError("El código no es válido. Usa el último código que te enviamos o pide uno nuevo.")
        if datetime.now(timezone.utc) > registro.fecha_expiracion:
            raise ValidacionError(f"El código venció (dura {self.config.minutos_codigo} minutos). Pide uno nuevo.")
        if registro.intentos >= self.config.max_intentos:
            raise DemasiadosIntentosError("Superaste los intentos permitidos. Pide un código nuevo.")

        if not self.hasher.verificar(codigo, registro.codigo_hash):
            self.repo.sumar_intento(registro.id_codigo)
            restantes = self.config.max_intentos - registro.intentos - 1
            if restantes <= 0:
                self.repo.marcar_codigos_usados(correo)
                raise DemasiadosIntentosError("Superaste los intentos permitidos. Pide un código nuevo.")
            raise ValidacionError(f"Código incorrecto. Te quedan {restantes} intento(s).")

        usuario = self.repo.buscar_por_correo(correo)
        if usuario is None or not usuario.activo:
            raise ValidacionError("El código no es válido. Pide uno nuevo.")
        self.repo.marcar_codigos_usados(correo)
        return self.tokens.crear(
            {"sub": usuario.id, "tipo": usuario.tipo, "ver": usuario.version_token, "proposito": "restablecer"},
            self.config.minutos_restablecer,
        )

    def restablecer_contrasena(self, token_restablecer: str, nueva: str, confirmar: str) -> None:
        """Guarda la nueva contraseña y cierra TODAS las sesiones abiertas (PBI-21)."""
        datos = self.tokens.leer(token_restablecer)
        if datos.get("proposito") != "restablecer":
            raise TokenInvalidoError("El permiso para restablecer no es válido. Pide un código nuevo.")
        usuario = self.repo.buscar_por_id(datos["tipo"], datos["sub"])
        # "ver" hace que el permiso sea de un solo uso: después del cambio la versión sube
        if usuario is None or datos.get("ver") != usuario.version_token:
            raise TokenInvalidoError("Este permiso ya se usó o venció. Pide un código nuevo.")
        self._validar_contrasena(nueva)
        if nueva != confirmar:
            raise ValidacionError("Las contraseñas no coinciden.")
        if self.hasher.verificar(nueva, usuario.contrasena_hash):
            raise ValidacionError("La nueva contraseña debe ser diferente a la anterior.")
        self.repo.cambiar_contrasena(usuario.tipo, usuario.id, self.hasher.hashear(nueva))

    # ================================================================ Usuario con sesión
    def verificar_contrasena_actual(self, usuario: Usuario, actual: str) -> bool:
        """Mi perfil: dice si la contraseña actual es correcta mientras el cliente la escribe.

        Tiene límite de consultas por usuario para que no sirva para adivinar contraseñas.
        """
        clave = f"{usuario.tipo}:{usuario.id}"
        ahora = time.monotonic()
        with _candado_verificaciones:
            consultas = _verificaciones[clave]
            while consultas and ahora - consultas[0] > VENTANA_VERIFICACION_SEG:
                consultas.popleft()
            if len(consultas) >= VERIFICACIONES_MAXIMAS:
                espera = int(VENTANA_VERIFICACION_SEG - (ahora - consultas[0])) + 1
                raise DemasiadosIntentosError(f"Demasiados intentos. Espera {espera} segundos e intenta de nuevo.")
            consultas.append(ahora)
        return self.hasher.verificar(actual or "", usuario.contrasena_hash)

    def cambiar_contrasena(self, usuario: Usuario, actual: str, nueva: str, confirmar: str) -> None:
        """Cambio desde Mi perfil (clientes y empleados). Cierra TODAS las sesiones, incluida la actual (PBI-21)."""
        if not self.hasher.verificar(actual or "", usuario.contrasena_hash):
            raise ValidacionError("La contraseña actual no es correcta.")
        self._validar_contrasena(nueva)
        if nueva != confirmar:
            raise ValidacionError("Las contraseñas no coinciden.")
        if actual == nueva:
            raise ValidacionError("La nueva contraseña debe ser diferente a la actual.")
        self.repo.cambiar_contrasena(usuario.tipo, usuario.id, self.hasher.hashear(nueva))

    def primer_cambio(self, usuario: Usuario, temporal: str, nueva: str, confirmar: str) -> Sesion:
        """El empleado entra con la contraseña temporal que le llegó al correo y crea la suya.
        Devuelve una sesión nueva (la anterior se cierra porque la contraseña cambió)."""
        if not usuario.debe_cambiar_contrasena:
            raise ValidacionError("Tu contraseña ya fue creada. Para cambiarla usa Mi perfil.")
        if not self.hasher.verificar(temporal or "", usuario.contrasena_hash):
            raise ValidacionError("La contraseña temporal no es correcta. Usa la que te llegó al correo.")
        self._validar_contrasena(nueva)
        if nueva != confirmar:
            raise ValidacionError("Las contraseñas no coinciden.")
        if nueva == temporal:
            raise ValidacionError("La nueva contraseña debe ser diferente a la temporal.")
        self.repo.cambiar_contrasena(usuario.tipo, usuario.id, self.hasher.hashear(nueva))
        actualizado = self.repo.buscar_por_id(usuario.tipo, usuario.id)
        return Sesion(self._token_sesion(actualizado), actualizado)

    def actualizar_perfil(self, usuario: Usuario, nombre: str, correo: str, tipo_telefono: str,
                          telefono: str, direccion: str | None, nombre_contacto: str | None = None) -> Usuario:
        """Mi perfil: solo el CLIENTE edita sus datos. Los de los empleados son de la empresa."""
        if usuario.tipo != "Cliente":
            raise ForbiddenError("Tus datos los administra el taller. Si algo está mal, avísale al administrador.")
        correo = normalizar_correo(correo)
        telefono = re.sub(r"[\s\-()+]", "", telefono or "")
        direccion = (direccion or "").strip() or None
        es_empresa = usuario.tipo_documento == "NIT"
        nombre_contacto = (" ".join((nombre_contacto or "").split()) or None) if es_empresa else None
        for problema in (problema_nombre(nombre), problema_correo(correo),
                         problema_telefono(tipo_telefono, telefono), problema_direccion(direccion),
                         problema_contacto(usuario.tipo_documento or "", nombre_contacto)):
            if problema:
                raise ValidacionError(problema)
        if correo != usuario.correo.lower():
            if self.repo.existe_correo(correo, excluir_id=usuario.id):
                raise ConflictError("Ese correo ya lo usa otra cuenta.")
            if not self.verificador.dominio_recibe_correo(correo):
                raise ValidacionError(f"El dominio @{correo.split('@')[1]} no existe o no recibe correos.")
        return self.repo.actualizar_perfil_cliente(usuario.id, PerfilCliente(
            nombre=" ".join(nombre.split()), correo=correo, tipo_telefono=tipo_telefono,
            telefono=telefono, direccion=direccion, nombre_contacto=nombre_contacto,
        ))

    def cerrar_todas_las_sesiones(self, usuario: Usuario) -> None:
        self.repo.incrementar_version_token(usuario.tipo, usuario.id)

    # ================================================================ Utilidades
    @staticmethod
    def _validar_contrasena(contrasena: str) -> None:
        problemas = problemas_contrasena(contrasena or "")
        if problemas:
            raise ValidacionError("La contraseña debe tener: " + ", ".join(problemas) + ".")
