from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.config import settings
from app.application.auth_service import AuthService, ConfigAuth
from app.domain.entities.usuario import Usuario
from app.domain.exceptions.errors import ForbiddenError, TokenInvalidoError
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.auth_repository import AuthRepository
from app.infrastructure.security.hasher import BcryptHasher
from app.infrastructure.security.token_service import JwtTokenService
from app.infrastructure.services.email_service import SmtpEmailService
from app.infrastructure.services.verificador_correo import DnsVerificadorCorreo

# Muestra el botón "Authorize" en Swagger: se pega el access_token del login
_bearer = HTTPBearer(auto_error=False)

_hasher = BcryptHasher()
_tokens = JwtTokenService(settings.JWT_SECRET, settings.JWT_ALGORITMO)
_correo = SmtpEmailService(settings.SMTP_HOST, settings.SMTP_PUERTO, settings.SMTP_USUARIO,
                           settings.SMTP_CONTRASENA, settings.SMTP_REMITENTE)
_verificador = DnsVerificadorCorreo()
_config = ConfigAuth(
    minutos_sesion=settings.JWT_MINUTOS_SESION,
    minutos_restablecer=settings.JWT_MINUTOS_RESTABLECER,
    minutos_codigo=settings.CODIGO_MINUTOS_VIGENCIA,
    segundos_reenvio=settings.CODIGO_SEGUNDOS_REENVIO,
    max_intentos=settings.CODIGO_MAX_INTENTOS,
)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(AuthRepository(db), _hasher, _tokens, _correo, _verificador, _config)


# Con contraseña temporal solo se puede crear la contraseña propia (o salir)
RUTAS_CON_CONTRASENA_TEMPORAL = {"/api/auth/me", "/api/auth/primer-cambio", "/api/auth/cerrar-sesiones"}


def get_usuario_actual(request: Request,
                       credenciales: HTTPAuthorizationCredentials | None = Depends(_bearer),
                       service: AuthService = Depends(get_auth_service)) -> Usuario:
    """Usuario con sesión (empleado o cliente), a partir del token JWT."""
    if credenciales is None:
        raise TokenInvalidoError("Debes iniciar sesión.")
    usuario = service.usuario_desde_token(credenciales.credentials)
    if usuario.debe_cambiar_contrasena and request.url.path not in RUTAS_CON_CONTRASENA_TEMPORAL:
        raise ForbiddenError("Debes crear tu propia contraseña antes de usar el sistema.")
    return usuario


def get_usuario_opcional(request: Request,
                         credenciales: HTTPAuthorizationCredentials | None = Depends(_bearer),
                         service: AuthService = Depends(get_auth_service)) -> Usuario | None:
    """Igual que get_usuario_actual, pero si no hay token devuelve None.
    Si llega un token inválido o de una sesión cerrada, sí responde 401."""
    if credenciales is None:
        return None
    usuario = service.usuario_desde_token(credenciales.credentials)
    if usuario.debe_cambiar_contrasena and request.url.path not in RUTAS_CON_CONTRASENA_TEMPORAL:
        raise ForbiddenError("Debes crear tu propia contraseña antes de usar el sistema.")
    return usuario


def get_id_empleado_actual(usuario: Usuario = Depends(get_usuario_actual)) -> str:
    """Id del empleado con sesión (antes salía del encabezado X-Empleado-Id; ahora del token).
    Lo usan producción, registro diario, remisiones y entregas."""
    if usuario.tipo != "Empleado":
        raise ForbiddenError("Esta acción es solo para empleados del taller.")
    return usuario.id


def get_id_empleado_opcional(usuario: Usuario | None = Depends(get_usuario_opcional)) -> str | None:
    """Id del empleado si quien opera es un empleado; None si es un cliente.
    Ej.: cuando un cliente crea su remisión, la BD lo deja a él como responsable del seguimiento."""
    return usuario.id if usuario and usuario.tipo == "Empleado" else None


def sesion_requerida(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
    """Cualquier usuario con sesión (empleado o cliente)."""
    return usuario


def solo_empleados(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
    """Solo empleados del taller (incluye al administrador). Los clientes reciben 403."""
    if usuario.tipo != "Empleado":
        raise ForbiddenError("Esta sección es solo para el personal del taller.")
    return usuario


def requiere_permiso(*permisos: str):
    """Exige al menos uno de los permisos (tabla permisos / rol_x_permiso).
    El Administrador pasa siempre. Uso: Depends(requiere_permiso("Gestionar roles y permisos"))"""
    def _dependencia(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
        if usuario.rol == "Administrador" or any(p in usuario.permisos for p in permisos):
            return usuario
        raise ForbiddenError("No tienes permiso para esta sección.")
    return _dependencia


METODOS_LECTURA = {"GET", "HEAD", "OPTIONS"}


def permisos_de_ruta(lectura: tuple[str, ...], escritura: tuple[str, ...],
                     por_metodo: dict[str, tuple[str, ...]] | None = None,
                     solo_personal: bool = True):
    """Nivel 3 de seguridad: cada grupo de endpoints exige su permiso (tabla rol_x_permiso).

    - lectura:    permisos que dejan CONSULTAR (GET). Basta con tener uno.
    - escritura:  permisos que dejan CREAR / EDITAR / ELIMINAR (POST, PUT, PATCH, DELETE).
    - por_metodo: excepciones por método, ej. {"PATCH": (...)} para aprobar/rechazar.
    - solo_personal: si es True, un cliente nunca entra aunque por error tenga el permiso.
    El Administrador pasa siempre.
    """
    def _dependencia(request: Request, usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
        if solo_personal and usuario.tipo != "Empleado":
            raise ForbiddenError("Esta sección es solo para el personal del taller.")
        if usuario.rol == "Administrador":
            return usuario
        metodo = request.method.upper()
        if por_metodo and metodo in por_metodo:
            requeridos = por_metodo[metodo]
        else:
            requeridos = lectura if metodo in METODOS_LECTURA else escritura
        if any(p in usuario.permisos for p in requeridos):
            return usuario
        accion = "consultar" if metodo in METODOS_LECTURA else "modificar"
        raise ForbiddenError(f"No tienes permiso para {accion} esta información.")
    return _dependencia


def requiere_rol(*roles: str):
    """Uso en un router: Depends(requiere_rol("Administrador"))"""
    def _dependencia(usuario: Usuario = Depends(get_usuario_actual)) -> Usuario:
        if usuario.rol not in roles:
            raise ForbiddenError("No tienes permiso para esta acción.")
        return usuario
    return _dependencia
