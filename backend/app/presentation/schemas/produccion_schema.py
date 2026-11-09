from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class _Respuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Producción ----------
class ProduccionCrear(BaseModel):
    id_remision: str = Field(min_length=1, max_length=10)
    fecha_entrega: date | None = None


class ProduccionRespuesta(_Respuesta):
    id_produccion: str
    id_remision: str
    cliente: str
    estado: Literal["En proceso", "Finalizada"]
    fecha_inicio: date
    fecha_entrega: date | None
    total_asignado: int
    total_realizado: int
    porcentaje_avance: float


class RemisionDisponibleRespuesta(_Respuesta):
    id_remision: str
    cliente: str
    ficha_tecnica_nombre: str
    total_prendas: int
    fecha_entrega: date | None


class LineaRemisionRespuesta(_Respuesta):
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    cantidad: int


# ---------- Asignaciones ----------
class AsignacionCrear(BaseModel):
    id_empleado: str = Field(min_length=1, max_length=10)
    id_tipo_pieza: str = Field(min_length=1, max_length=10)
    id_tipo_maquina: str = Field(min_length=1, max_length=10)
    id_detalle_de_remision: str = Field(min_length=1, max_length=10)
    cantidad_asignada: int = Field(gt=0)
    id_insumos: str | None = Field(default=None, max_length=10, description="Insumo del taller")
    id_insumos_enviados_x_cliente: str | None = Field(default=None, max_length=10, description="Insumo del cliente")
    cantidad_insumo: int | None = Field(default=None, gt=0)


class AsignacionRespuesta(_Respuesta):
    id_detalle_de_produccion: str
    id_produccion: str
    id_remision: str
    estado_produccion: str
    id_empleado: str
    empleado: str
    id_tipo_pieza: str
    pieza: str
    id_tipo_maquina: str
    maquina: str
    id_detalle_de_remision: str
    prenda: str
    talla: str
    id_insumos: str | None
    id_insumos_enviados_x_cliente: str | None
    cantidad_insumo: int | None
    cantidad_asignada: int
    cantidad_realizada: int
    cantidad_pendiente: int
    fecha_asignada: date


class ProduccionDetalleRespuesta(ProduccionRespuesta):
    asignaciones: list[AsignacionRespuesta]
