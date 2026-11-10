from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _limpiar(valor):
    """Quita espacios sobrantes y convierte los textos vacíos en None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


TEXTOS = ("nombre", "descripcion")
# Así se guarda en la base de datos (columna estado, default 'Activo')
Estado = Literal["Activo", "Inactivo"]


class TipoInsumoCrear(BaseModel):
    nombre: str = Field(max_length=100)
    descripcion: str | None = Field(default=None, max_length=255)
    estado: Estado = "Activo"

    _limpiar_textos = field_validator(*TEXTOS, mode="before")(lambda cls, v: _limpiar(v))


class TipoInsumoActualizar(BaseModel):
    """Todos los campos son opcionales: solo se cambian los que se envían."""
    nombre: str | None = Field(default=None, max_length=100)
    descripcion: str | None = Field(default=None, max_length=255)
    estado: Estado | None = None

    _limpiar_textos = field_validator(*TEXTOS, mode="before")(lambda cls, v: _limpiar(v))

    @field_validator("nombre", "estado")
    @classmethod
    def no_vacio(cls, valor):
        if valor is None:
            raise ValueError("no puede quedar vacío")
        return valor


class TipoInsumoCompletoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    descripcion: str | None
    estado: str
