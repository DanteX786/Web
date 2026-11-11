from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _no_futura(valor: date | None):
    if valor is not None and valor > date.today():
        raise ValueError("la fecha de entrega no puede ser futura")
    return valor


class EntregaCrear(BaseModel):
    """La cantidad NO se envía: siempre se entregan todas las prendas de la remisión."""
    id_remision: str = Field(min_length=1, max_length=10)
    fecha_finalizacion: date | None = Field(default=None, description="Por defecto, hoy")
    precio_total: Decimal | None = Field(
        default=None, ge=0, max_digits=12, decimal_places=2,
        description="Si no se envía: total de prendas x costo por prenda",
    )

    _fecha = field_validator("fecha_finalizacion")(lambda cls, v: _no_futura(v))


class EntregaActualizar(BaseModel):
    fecha_finalizacion: date | None = None
    precio_total: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)

    @field_validator("fecha_finalizacion")
    @classmethod
    def fecha_valida(cls, valor):
        if valor is None:
            raise ValueError("no puede quedar vacía")
        return _no_futura(valor)


class _Respuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class EntregaRespuesta(_Respuesta):
    id_entrega: str
    id_remision: str
    nit_cliente: str
    cliente: str
    cantidad_entregada: int
    precio_total: float
    fecha_finalizacion: date
    remision_firmada_url: str | None
    comprobante_pago_url: str | None
    estado: Literal["Pendiente de pago", "Pagada"]


class RemisionPorEntregarRespuesta(_Respuesta):
    id_remision: str
    nit_cliente: str
    cliente: str
    ficha_tecnica_nombre: str
    total_prendas: int
    costo_prenda: float
    costo_total: float
    fecha_entrega: date | None
