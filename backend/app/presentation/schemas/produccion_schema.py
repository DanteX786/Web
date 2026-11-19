from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class _Respuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)


EstadoProduccion = Literal["Por asignar", "En producción", "Finalizada"]


# ---------- Producción ----------
class EnviarAProducir(BaseModel):
    id_remision: str = Field(min_length=1, max_length=10)


class ProduccionRespuesta(_Respuesta):
    id_produccion: str
    id_remision: str
    cliente: str
    estado: EstadoProduccion
    fecha_inicio: date
    fecha_entrega: date | None
    fecha_estado: datetime
    total_prendas: int
    ficha_tecnica_nombre: str
    prendas_terminadas: int
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
    total_asignado: int
    total_realizado: int
    terminadas: int


class PasoRespuesta(_Respuesta):
    id_paso: str
    id_proceso: str
    proceso: str
    descripcion: str | None
    paso: str
    maquinas: list[str]


class PasoGuardar(BaseModel):
    id_paso: str | None = Field(default=None, max_length=10, description="Vacío = paso nuevo")
    id_proceso: str = Field(min_length=1, max_length=10)
    descripcion: str | None = Field(default=None, max_length=100, description="Ej. logo en el pecho")


class GuardarPasos(BaseModel):
    pasos: list[PasoGuardar] = Field(description="Procesos que lleva la prenda según la ficha técnica")


class FaltantePasoRespuesta(_Respuesta):
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    id_paso: str
    paso: str
    cantidad: int
    asignado: int


class SeguimientoProduccionRespuesta(_Respuesta):
    id_seguimiento_produccion: str
    id_produccion: str
    id_remision: str
    estado_anterior: str | None
    estado_nuevo: str
    responsable: str
    tipo_responsable: str
    fecha_hora: datetime


class EmpleadoDisponibilidadRespuesta(_Respuesta):
    id_empleado: str
    nombre: str
    disponible: bool
    ocupado_en_tarea: str | None
    ocupado_en_produccion: str | None
    unidades_pendientes: int | None
    presente_hoy: bool


class MaquinaDisponibilidadRespuesta(_Respuesta):
    id_maquina: str
    nombre: str
    descripcion: str | None
    estado: str
    disponible: bool
    ocupada_por_tarea: str | None
    ocupada_por_empleado: str | None
    ocupada_en_produccion: str | None


# ---------- Tareas ----------
class AsignacionCrear(BaseModel):
    id_paso: str = Field(min_length=1, max_length=10, description="Paso de la producción (proceso que lleva la prenda)")
    id_empleado: str = Field(min_length=1, max_length=10)
    id_tipo_pieza: str = Field(min_length=1, max_length=10)
    id_tipo_maquina: str = Field(min_length=1, max_length=10, description="Máquina física (debe estar libre)")
    id_detalle_de_remision: str = Field(min_length=1, max_length=10, description="Prenda + talla de la remisión")
    cantidad_asignada: int = Field(gt=0)
    id_insumos: str | None = Field(default=None, max_length=10, description="Insumo del taller")
    id_insumos_enviados_x_cliente: str | None = Field(default=None, max_length=10, description="Insumo del cliente")
    cantidad_insumo: int | None = Field(default=None, gt=0)


class AsignacionRespuesta(_Respuesta):
    id_detalle_de_produccion: str
    id_produccion: str
    id_remision: str
    estado_produccion: str
    id_proceso: str | None
    proceso: str | None
    id_paso: str | None
    paso: str | None
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
    pasos: list[PasoRespuesta]
    faltantes: list[FaltantePasoRespuesta]
    lineas: list[LineaRemisionRespuesta]
    asignaciones: list[AsignacionRespuesta]
