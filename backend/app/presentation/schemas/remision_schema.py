from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

EstadoRemision = Literal["Pendiente", "Aprobada", "Rechazada", "En producción", "Terminada", "Entregada"]


def _limpiar(valor):
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


# ---------- Entrada ----------
class DetalleRemisionCrear(BaseModel):
    nombre_de_la_pieza: str = Field(min_length=1, max_length=100, description="Ej. Camisa polo")
    talla: str = Field(min_length=1, max_length=20, description="Ej. S, M, L, 32")
    cantidad: int = Field(gt=0)

    _limpiar_textos = field_validator("nombre_de_la_pieza", "talla", mode="before")(
        lambda cls, v: _limpiar(v)
    )


class InsumoEnviadoDatos(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    cantidad: int = Field(gt=0)
    unidad: str = Field(default="Unidad", min_length=1, max_length=20)

    _limpiar_textos = field_validator("nombre", "unidad", mode="before")(lambda cls, v: _limpiar(v))


class RemisionCrear(BaseModel):
    nit_cliente: str = Field(min_length=1, max_length=30)
    ficha_tecnica_nombre: str = Field(min_length=1, max_length=255,
                                      description="Nombre de la ficha (la foto se sube aparte)")
    fecha_recibo: date = Field(default_factory=date.today)
    fecha_entrega: date | None = None
    costo_prenda: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    observaciones: str | None = None
    detalles: list[DetalleRemisionCrear] = Field(min_length=1)
    insumos: list[InsumoEnviadoDatos] = Field(default_factory=list,
                                              description="Insumos que manda el cliente (opcional)")

    _limpiar_textos = field_validator("nit_cliente", "ficha_tecnica_nombre", "observaciones",
                                      mode="before")(lambda cls, v: _limpiar(v))


class RemisionActualizar(BaseModel):
    """Solo mientras está Pendiente. Si se envían detalles / insumos, REEMPLAZAN a los actuales."""
    ficha_tecnica_nombre: str | None = Field(default=None, min_length=1, max_length=255)
    fecha_recibo: date | None = None
    fecha_entrega: date | None = None
    costo_prenda: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    observaciones: str | None = None
    detalles: list[DetalleRemisionCrear] | None = Field(default=None, min_length=1)
    insumos: list[InsumoEnviadoDatos] | None = None

    _limpiar_textos = field_validator("ficha_tecnica_nombre", "observaciones", mode="before")(
        lambda cls, v: _limpiar(v)
    )

    @field_validator("ficha_tecnica_nombre", "fecha_recibo", "costo_prenda")
    @classmethod
    def no_vacio(cls, valor):
        if valor is None:
            raise ValueError("no puede quedar vacío")
        return valor


class RemisionRechazar(BaseModel):
    motivo: str = Field(min_length=3, max_length=500, description="Se guarda en observaciones")

    _limpiar = field_validator("motivo", mode="before")(lambda cls, v: _limpiar(v))


# ---------- Respuesta ----------
class _Respuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class DetalleRemisionRespuesta(_Respuesta):
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    cantidad: int


class InsumoEnviadoRespuesta(_Respuesta):
    id_insumo_enviado: str
    id_remision: str
    nombre: str
    cantidad: int
    cantidad_disponible: int
    cantidad_usada: int
    unidad: str
    cliente: str | None = None
    estado_remision: str | None = None


class RemisionRespuesta(_Respuesta):
    id_remision: str
    nit_cliente: str
    cliente: str
    ficha_tecnica_nombre: str
    ficha_tecnica_url: str | None
    fecha_recibo: date
    fecha_entrega: date | None
    costo_prenda: float
    total_prendas: int
    costo_total: float
    estado: EstadoRemision
    insumos_enviados: bool
    observaciones: str | None
    detalles: list[DetalleRemisionRespuesta]
    insumos: list[InsumoEnviadoRespuesta]
