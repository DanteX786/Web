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
    total_realizado: int              # unidades terminadas (buenas)
    total_defectuoso: int = 0         # piezas defectuosas reportadas
    total_pendiente: int = 0          # asignado que falta por reportar
    defectuosas_disponibles: int = 0  # defectuosas que todavía se pueden reprocesar
    reproceso_activo: bool = False
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
    total_defectuoso: int = 0
    terminadas: int
    recuperadas: int = 0
    defectuosas_disponibles: int = 0


class PasoRespuesta(_Respuesta):
    id_paso: str
    id_proceso: str
    proceso: str
    descripcion: str | None
    paso: str
    maquinas: list[str]
    id_reproceso: str | None = None
    veces: int = 1


class PasoGuardar(BaseModel):
    id_paso: str | None = Field(default=None, max_length=10, description="Vacío = paso nuevo")
    id_proceso: str = Field(min_length=1, max_length=10)
    descripcion: str | None = Field(default=None, max_length=100, description="Ej. logo en el pecho")
    veces: int = Field(default=1, ge=1, le=20, description="Veces que se hace el proceso a cada prenda")


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
    defectuosas_otros_pasos: int = 0


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
    en_taller: bool = True
    estado_asistencia: str = "Presente"


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
    cantidad_defectuosa: int = 0
    id_reproceso: str | None = None
    fecha_asignada: date


class PiezaDefectuosaRespuesta(_Respuesta):
    id_registro_diario: str
    fecha: datetime
    id_produccion: str
    id_remision: str
    id_detalle_de_produccion: str
    empleado: str
    prenda: str
    talla: str
    paso: str | None
    pieza: str
    cantidad_defectuosa: int
    motivo_defecto: str | None


class ReprocesoTallaRespuesta(_Respuesta):
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    cantidad: int


class InsumoReprocesoRespuesta(_Respuesta):
    id_insumo_enviado: str
    nombre: str
    cantidad: int
    cantidad_disponible: int
    unidad: str


class ReprocesoRespuesta(_Respuesta):
    id_reproceso: str
    id_produccion: str
    numero: int
    estado: str
    situacion: str                    # Por asignar | En curso | Terminado | Cancelado
    observacion: str | None
    creado_por: str | None
    creado_por_nombre: str | None
    fecha_creacion: datetime
    fecha_estado: datetime
    total_piezas: int
    tareas: int
    pendiente: int
    sin_asignar: int
    tallas: list[ReprocesoTallaRespuesta]
    pasos: list[PasoRespuesta]
    faltantes: list[FaltantePasoRespuesta]
    insumos: list[InsumoReprocesoRespuesta]


class ReprocesoTallaCrear(BaseModel):
    id_detalle_de_remision: str = Field(min_length=1, max_length=10)
    cantidad: int = Field(gt=0)


class ReprocesoPasoCrear(BaseModel):
    id_proceso: str = Field(min_length=1, max_length=10)
    descripcion: str | None = Field(default=None, max_length=100)
    veces: int = Field(default=1, ge=1, le=20)


class ReprocesoInsumoCrear(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    cantidad: int = Field(gt=0)
    unidad: str = Field(default="Unidad", min_length=1, max_length=20)


class ReprocesoCrear(BaseModel):
    tallas: list[ReprocesoTallaCrear] = Field(min_length=1)
    pasos: list[ReprocesoPasoCrear] = Field(min_length=1, description="Solo los procesos que hacen falta")
    insumos: list[ReprocesoInsumoCrear] = Field(default=[], description="Opcional: lo que envió el cliente")
    observacion: str | None = Field(default=None, max_length=200)


class ProduccionDetalleRespuesta(ProduccionRespuesta):
    pasos: list[PasoRespuesta]
    faltantes: list[FaltantePasoRespuesta]
    lineas: list[LineaRemisionRespuesta]
    asignaciones: list[AsignacionRespuesta]
    defectuosas: list[PiezaDefectuosaRespuesta] = []
    reprocesos: list[ReprocesoRespuesta] = []
