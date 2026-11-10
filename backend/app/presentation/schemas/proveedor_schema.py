from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

EstadoProveedor = Literal["Activo", "Inactivo"]


def _limpiar(valor):
    """Quita espacios sobrantes y convierte los textos vacíos en None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


class ProveedorCrear(BaseModel):
    nit: str = Field(max_length=30)
    nombre: str = Field(max_length=100)
    contacto: str | None = Field(default=None, max_length=100)
    telefono: str | None = Field(default=None, max_length=20)
    correo: str | None = Field(default=None, max_length=100)
    direccion: str | None = Field(default=None, max_length=150)
    estado: EstadoProveedor = "Activo"

    _limpiar_textos = field_validator("*", mode="before")(lambda cls, v: _limpiar(v))


class ProveedorActualizar(BaseModel):
    """Todos los campos son opcionales: solo se cambian los que se envían."""
    nit: str | None = Field(default=None, max_length=30)
    nombre: str | None = Field(default=None, max_length=100)
    contacto: str | None = Field(default=None, max_length=100)
    telefono: str | None = Field(default=None, max_length=20)
    correo: str | None = Field(default=None, max_length=100)
    direccion: str | None = Field(default=None, max_length=150)
    estado: EstadoProveedor | None = None

    _limpiar_textos = field_validator("*", mode="before")(lambda cls, v: _limpiar(v))

    @field_validator("nit", "nombre", "estado")
    @classmethod
    def no_vacio(cls, valor):
        if valor is None:
            raise ValueError("no puede quedar vacío")
        return valor


class ProveedorEstado(BaseModel):
    estado: EstadoProveedor


class ProveedorRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nit: str
    nombre: str
    contacto: str | None
    telefono: str | None
    correo: str | None
    direccion: str | None
    estado: str
    