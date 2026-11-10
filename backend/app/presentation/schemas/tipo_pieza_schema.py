from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

EstadoTipo = Literal["Activo", "Inactivo"]


def _limpiar(valor):
    """Quita espacios sobrantes y convierte los textos vacíos en None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


class TipoPiezaCrear(BaseModel):
    nombre: str = Field(max_length=100)
    desc: str | None = Field(default=None, max_length=255)
    estado: EstadoTipo = "Activo"

    _limpiar_textos = field_validator("*", mode="before")(lambda cls, v: _limpiar(v))


class TipoPiezaActualizar(BaseModel):
    """Todos los campos son opcionales: solo se cambian los que se envían."""
    nombre: str | None = Field(default=None, max_length=100)
    desc: str | None = Field(default=None, max_length=255)
    estado: EstadoTipo | None = None

    _limpiar_textos = field_validator("*", mode="before")(lambda cls, v: _limpiar(v))

    @field_validator("nombre", "estado")
    @classmethod
    def no_vacio(cls, valor):
        if valor is None:
            raise ValueError("no puede quedar vacío")
        return valor


class TipoPiezaEstado(BaseModel):
    estado: EstadoTipo


class TipoPiezaRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    desc: str | None
    estado: str

    