from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

EstadoRol = Literal["Activo", "Inactivo"]


def _limpiar(valor):
    """Quita espacios sobrantes y convierte los textos vacíos en None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


class RolCrear(BaseModel):
    descripcion: str = Field(max_length=100)
    estado: EstadoRol = "Activo"
    permisos: list[str] = Field(min_length=1, description="IDs de los permisos (tabla permisos)")

    _limpiar_textos = field_validator("descripcion", mode="before")(lambda cls, v: _limpiar(v))


class RolActualizar(BaseModel):
    """Todos los campos son opcionales: solo se cambian los que se envían."""
    descripcion: str | None = Field(default=None, max_length=100)
    estado: EstadoRol | None = None
    permisos: list[str] | None = None  # si se envía, el servicio valida que no venga vacía

    _limpiar_textos = field_validator("descripcion", mode="before")(lambda cls, v: _limpiar(v))

    @field_validator("descripcion", "estado", "permisos")
    @classmethod
    def no_vacio(cls, valor):
        if valor is None:
            raise ValueError("no puede quedar vacío")
        return valor


class RolEstado(BaseModel):
    estado: EstadoRol


class PermisoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    descripcion: str


class RolRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    descripcion: str
    estado: str
    permisos: list[PermisoRespuesta]
