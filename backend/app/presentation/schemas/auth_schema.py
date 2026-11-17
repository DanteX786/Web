"""Los campos se reciben como texto y las reglas se validan en AuthService,
para devolver siempre mensajes claros en español."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class LoginEntrada(BaseModel):
    correo: str = Field(max_length=100)
    contrasena: str = Field(max_length=72)


class RegistroClienteEntrada(BaseModel):
    tipo_documento: Literal["NIT", "Cédula"]
    numero_documento: str = Field(max_length=20)
    nombre: str = Field(max_length=100, description="Razón social o nombre completo")
    correo: str = Field(max_length=100)
    tipo_telefono: Literal["Empresarial", "Personal"]
    telefono: str = Field(max_length=20)
    direccion: str | None = Field(default=None, max_length=150)
    contrasena: str = Field(max_length=72)
    confirmar_contrasena: str = Field(max_length=72)


class CorreoEntrada(BaseModel):
    correo: str = Field(max_length=100)


class VerificarCodigoEntrada(BaseModel):
    correo: str = Field(max_length=100)
    codigo: str = Field(max_length=6)


class RestablecerEntrada(BaseModel):
    token_restablecer: str
    nueva_contrasena: str = Field(max_length=72)
    confirmar_contrasena: str = Field(max_length=72)


class CambiarContrasenaEntrada(BaseModel):
    contrasena_actual: str = Field(max_length=72)
    nueva_contrasena: str = Field(max_length=72)
    confirmar_contrasena: str = Field(max_length=72)


class PerfilEntrada(BaseModel):
    nombre: str = Field(max_length=100)
    correo: str = Field(max_length=100)
    tipo_telefono: Literal["Empresarial", "Personal"]
    telefono: str = Field(max_length=20)
    direccion: str | None = Field(default=None, max_length=150)


class UsuarioRespuesta(BaseModel):
    """Nunca incluye la contraseña."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    tipo: Literal["Empleado", "Cliente"]
    nombre: str
    correo: str
    rol: str | None
    telefono: str | None
    direccion: str | None
    documento: str | None
    tipo_documento: str | None
    tipo_telefono: str | None
    permisos: list[str]


class SesionRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioRespuesta


class MensajeRespuesta(BaseModel):
    mensaje: str


class CodigoEnviadoRespuesta(MensajeRespuesta):
    segundos_reenvio: int
    minutos_vigencia: int


class TokenRestablecerRespuesta(BaseModel):
    token_restablecer: str
    minutos_vigencia: int
