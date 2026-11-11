from pydantic import BaseModel, Field, field_validator

from app.presentation.schemas.remision_schema import InsumoEnviadoDatos, InsumoEnviadoRespuesta, _limpiar

__all__ = ["InsumoEnviadoCrear", "InsumoEnviadoActualizar", "InsumoEnviadoRespuesta"]


class InsumoEnviadoCrear(InsumoEnviadoDatos):
    id_remision: str = Field(min_length=1, max_length=10)

    _limpiar_id = field_validator("id_remision", mode="before")(lambda cls, v: _limpiar(v))


class InsumoEnviadoActualizar(BaseModel):
    """Campos opcionales. La cantidad no puede quedar por debajo de lo ya usado en producción."""
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    cantidad: int | None = Field(default=None, gt=0)
    unidad: str | None = Field(default=None, min_length=1, max_length=20)

    _limpiar_textos = field_validator("nombre", "unidad", mode="before")(lambda cls, v: _limpiar(v))
