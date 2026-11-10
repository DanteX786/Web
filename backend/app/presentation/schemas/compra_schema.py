from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _limpiar(valor):
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


class DetalleCompraCrear(BaseModel):
    id_insumo: str = Field(max_length=10)
    cantidad: int = Field(gt=0)
    valor_unitario: Decimal = Field(gt=0, max_digits=10, decimal_places=2)

    _limpiar_id = field_validator("id_insumo", mode="before")(lambda cls, v: _limpiar(v))


class DetalleCompraActualizar(BaseModel):
    """Campos opcionales: se puede cambiar el insumo, la cantidad o el valor."""
    id_insumo: str | None = Field(default=None, max_length=10)
    cantidad: int | None = Field(default=None, gt=0)
    valor_unitario: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)

    _limpiar_id = field_validator("id_insumo", mode="before")(lambda cls, v: _limpiar(v))


class CompraCrear(BaseModel):
    fecha: date = Field(default_factory=date.today)
    id_proveedor: str = Field(max_length=10)
    descripcion: str | None = Field(default=None, max_length=255)
    detalles: list[DetalleCompraCrear] = Field(min_length=1)

    _limpiar_textos = field_validator("id_proveedor", "descripcion", mode="before")(
        lambda cls, v: _limpiar(v)
    )

    @field_validator("fecha")
    @classmethod
    def no_futura(cls, valor: date):
        if valor > date.today():
            raise ValueError("la fecha de la compra no puede ser futura")
        return valor


class CompraActualizar(BaseModel):
    """Solo la cabecera. Los insumos se editan con los endpoints de /detalles."""
    fecha: date | None = None
    id_proveedor: str | None = Field(default=None, max_length=10)
    descripcion: str | None = Field(default=None, max_length=255)

    _limpiar_textos = field_validator("id_proveedor", "descripcion", mode="before")(
        lambda cls, v: _limpiar(v)
    )

    @field_validator("fecha")
    @classmethod
    def no_futura(cls, valor: date | None):
        if valor is None:
            raise ValueError("no puede quedar vacía")
        if valor > date.today():
            raise ValueError("la fecha de la compra no puede ser futura")
        return valor

    @field_validator("id_proveedor")
    @classmethod
    def no_vacio(cls, valor):
        if valor is None:
            raise ValueError("no puede quedar vacío")
        return valor


class DetalleCompraRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_insumo: str
    nombre_insumo: str | None
    cantidad: int
    valor_unitario: float
    subtotal: float


class CompraRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    fecha: date
    id_proveedor: str | None
    nombre_proveedor: str | None
    descripcion: str | None
    total: float
    detalles: list[DetalleCompraRespuesta]
