import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

EstadoEmpleado = Literal["Activo", "Inactivo"]

PATRON_CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _limpiar(valor):
    """Quita espacios sobrantes y convierte los textos vacíos en None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


def _validar_correo(valor):
    if valor is not None and not PATRON_CORREO.match(valor):
        raise ValueError("correo no válido")
    return valor


# Textos que se limpian (la contraseña NO se limpia: los espacios pueden ser parte de ella)
TEXTOS = ("nombre", "identificacion", "correo", "telefono", "direccion", "id_rol")


class EmpleadoCrear(BaseModel):
    nombre: str = Field(max_length=100)
    identificacion: str = Field(max_length=30)
    correo: str = Field(max_length=100)
    telefono: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=150)
    id_rol: str = Field(max_length=10)
    estado: EstadoEmpleado = "Activo"
    contrasena: str = Field(min_length=6, max_length=72)

    _limpiar_textos = field_validator(*TEXTOS, mode="before")(lambda cls, v: _limpiar(v))
    _correo = field_validator("correo")(lambda cls, v: _validar_correo(v))


class EmpleadoActualizar(BaseModel):
    """Todos los campos son opcionales: solo se cambian los que se envían.
    Si no se envía contraseña, se conserva la actual."""
    nombre: str | None = Field(default=None, max_length=100)
    identificacion: str | None = Field(default=None, max_length=30)
    correo: str | None = Field(default=None, max_length=100)
    telefono: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=150)
    id_rol: str | None = Field(default=None, max_length=10)
    estado: EstadoEmpleado | None = None
    contrasena: str | None = Field(default=None, min_length=6, max_length=72)

    _limpiar_textos = field_validator(*TEXTOS, mode="before")(lambda cls, v: _limpiar(v))
    _correo = field_validator("correo")(lambda cls, v: _validar_correo(v))

    @field_validator("nombre", "identificacion", "correo", "id_rol", "estado")
    @classmethod
    def no_vacio(cls, valor):
        if valor is None:
            raise ValueError("no puede quedar vacío")
        return valor


class EmpleadoEstado(BaseModel):
    estado: EstadoEmpleado


class EmpleadoRespuesta(BaseModel):
    """Nunca incluye la contraseña."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    identificacion: str
    correo: str | None
    telefono: str | None
    direccion: str | None
    id_rol: str | None
    rol: str | None
    estado: str
