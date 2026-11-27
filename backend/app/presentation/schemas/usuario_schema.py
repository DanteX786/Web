from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

TipoUsuario = Literal["Empleado", "Cliente"]
EstadoCuenta = Literal["Sin acceso", "Invitado", "Activa"]


class UsuarioMaestroRespuesta(BaseModel):
    """Nunca incluye contraseñas (tb_usuarios no las tiene)."""
    model_config = ConfigDict(from_attributes=True)

    id_usuario: str
    tipo_usuario: TipoUsuario
    id_origen: str
    tipo_documento: str | None
    documento: str
    nombre: str
    correo: str
    telefono: str | None
    direccion: str | None
    id_rol: str
    rol: str
    estado: str
    estado_cuenta: EstadoCuenta
    origen: str
    creado_por: str | None
    creado_por_nombre: str | None
    fecha_creacion: datetime
    fecha_invitacion: datetime | None
    fecha_activacion: datetime | None
    acepto_tratamiento_datos: bool
    fecha_aceptacion_datos: datetime | None
