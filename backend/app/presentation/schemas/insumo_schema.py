from pydantic import BaseModel, ConfigDict, Field, field_validator


def _limpiar(valor):
    """Quita espacios sobrantes y convierte los textos vacíos en None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


TEXTOS = ("nombre", "descripcion", "tipo_id")


class InsumoCrear(BaseModel):
    nombre: str = Field(max_length=100)
    descripcion: str | None = Field(default=None, max_length=255)
    stock: int = Field(default=0, ge=0, description="Stock inicial")
    tipo_id: str = Field(max_length=10)

    _limpiar_textos = field_validator(*TEXTOS, mode="before")(lambda cls, v: _limpiar(v))


class InsumoActualizar(BaseModel):
    """Todos los campos son opcionales: solo se cambian los que se envían.
    El stock no se edita aquí: lo mueven las compras y la producción."""
    nombre: str | None = Field(default=None, max_length=100)
    descripcion: str | None = Field(default=None, max_length=255)
    tipo_id: str | None = Field(default=None, max_length=10)

    _limpiar_textos = field_validator(*TEXTOS, mode="before")(lambda cls, v: _limpiar(v))

    @field_validator("nombre", "tipo_id")
    @classmethod
    def no_vacio(cls, valor):
        if valor is None:
            raise ValueError("no puede quedar vacío")
        return valor


class TipoInsumoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str


class InsumoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    descripcion: str | None
    stock: int
    tipo_id: str | None
    tipo_nombre: str | None
