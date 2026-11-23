from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class EntregaCrear(BaseModel):
    """Solo se envía la remisión. Para evitar fraude, cantidad, precio y fecha NO los
    escribe el usuario: cantidad = total de prendas, precio = prendas x costo por prenda
    (lo calcula la BD) y fecha = hoy."""
    id_remision: str = Field(min_length=1, max_length=10)


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
