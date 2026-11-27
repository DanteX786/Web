from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

TipoUsuario = Literal["Empleado", "Cliente"]


@dataclass
class Usuario:
    """Cuenta que puede iniciar sesión: un empleado (incluye al admin) o un cliente."""
    id: str                      # id_empleados o nit
    tipo: TipoUsuario
    nombre: str
    correo: str
    contrasena_hash: str | None          # None = cliente creado por el taller que aún no activa su cuenta
    estado: str
    id_rol: str | None
    rol: str | None
    version_token: int
    telefono: str | None = None
    direccion: str | None = None
    documento: str | None = None          # NIT/cédula del cliente o identificación del empleado
    tipo_documento: str | None = None     # NIT | CC | CE | PA | PPT (solo clientes)
    nombre_contacto: str | None = None    # persona a contactar cuando el cliente es empresa (NIT)
    tipo_telefono: str | None = None      # Empresarial | Personal (solo clientes)
    debe_cambiar_contrasena: bool = False # empleado con contraseña temporal: debe crear la suya
    # De la tabla maestra tb_usuarios (script 21)
    id_usuario: str | None = None
    estado_cuenta: str = "Activa"         # Sin acceso | Invitado | Activa
    fecha_invitacion: datetime | None = None
    permisos: list[str] = field(default_factory=list)

    @property
    def es_administrador(self) -> bool:
        return self.rol == "Administrador"

    @property
    def activo(self) -> bool:
        return self.estado == "Activo"

    @property
    def tiene_cuenta(self) -> bool:
        """False si es un cliente que el taller registró y todavía no activa su cuenta."""
        return bool(self.contrasena_hash)


@dataclass
class NuevoCliente:
    """Datos del formulario de registro de clientes."""
    tipo_documento: Literal["NIT", "CC", "CE", "PA", "PPT"]
    numero_documento: str
    nombre: str
    correo: str
    tipo_telefono: Literal["Empresarial", "Personal"]
    telefono: str
    direccion: str | None
    contrasena_hash: str
    nombre_contacto: str | None = None


@dataclass
class PerfilCliente:
    """Datos que el cliente puede editar en Mi perfil (el documento no se cambia)."""
    nombre: str
    correo: str
    tipo_telefono: Literal["Empresarial", "Personal"]
    telefono: str
    direccion: str | None
    nombre_contacto: str | None = None


@dataclass
class CodigoRecuperacion:
    id_codigo: str
    correo: str
    tipo_usuario: TipoUsuario
    codigo_hash: str
    intentos: int
    usado: bool
    fecha_creacion: datetime
    fecha_expiracion: datetime
