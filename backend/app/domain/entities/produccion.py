from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal


@dataclass
class Produccion:
    """Producción con su avance (vista vw_avance_produccion).

    Estados: Por asignar -> En producción -> Finalizada.
    """
    id_produccion: str
    id_remision: str
    cliente: str
    estado: str
    fecha_inicio: date
    fecha_entrega: date | None
    total_asignado: int
    total_realizado: int
    porcentaje_avance: Decimal
    fecha_estado: datetime            # último cambio de estado
    total_prendas: int                # unidades pedidas en la remisión
    ficha_tecnica_nombre: str
    # Prendas completas: las que ya pasaron por todos los procesos asignados de su talla
    prendas_terminadas: int = 0
    total_defectuoso: int = 0         # piezas reportadas como defectuosas
    total_pendiente: int = 0          # unidades asignadas que faltan por reportar
    defectuosas_disponibles: int = 0  # defectuosas que todavía se pueden reprocesar
    reproceso_activo: bool = False    # tiene un reproceso abierto (Por asignar / En curso)


@dataclass
class Asignacion:
    """Una tarea de la producción (fila de tb_detalle_de_produccion) con su avance."""
    id_detalle_de_produccion: str
    id_produccion: str
    id_remision: str
    estado_produccion: str
    id_empleado: str
    empleado: str
    id_tipo_pieza: str
    pieza: str
    id_tipo_maquina: str              # la máquina física (tabla tipo_de_maquina)
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
    id_proceso: str | None            # las tareas antiguas no tienen proceso
    proceso: str | None
    id_paso: str | None
    paso: str | None                  # ej. "Bordado — logo en el pecho"
    cantidad_defectuosa: int = 0      # piezas que salieron defectuosas (cuentan como reportadas)
    id_reproceso: str | None = None   # tarea de un reproceso (None = producción normal)


@dataclass
class NuevaAsignacion:
    """Datos para crear o editar una tarea (el proceso sale del paso)."""
    id_paso: str
    id_empleado: str
    id_tipo_pieza: str
    id_tipo_maquina: str
    id_detalle_de_remision: str
    cantidad_asignada: int
    id_insumos: str | None = None
    id_insumos_enviados_x_cliente: str | None = None
    cantidad_insumo: int | None = None


@dataclass
class RemisionDisponible:
    """Remisión Aprobada que todavía no se ha enviado a producir."""
    id_remision: str
    cliente: str
    ficha_tecnica_nombre: str
    total_prendas: int
    fecha_entrega: date | None


@dataclass
class LineaRemision:
    """Prenda + talla de la remisión con lo que ya se asignó (cada talla se trabaja aparte)."""
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    cantidad: int
    total_asignado: int
    total_realizado: int
    total_defectuoso: int = 0
    terminadas: int = 0   # prendas de esta talla que ya pasaron por todos sus procesos
    recuperadas: int = 0  # de las terminadas, las que salieron de un reproceso
    defectuosas_disponibles: int = 0   # defectuosas que todavía se pueden reprocesar


@dataclass
class PasoProduccion:
    """Paso de la producción: un proceso que lleva la prenda según la ficha técnica.

    El mismo proceso puede ir varias veces con distinta descripción
    (ej. Bordado — logo en el pecho / Bordado — nombre en la manga).
    veces = cuántas veces se hace el proceso a cada prenda: el tope del paso en una
    talla es prendas × veces (la pieza no abre cupo nuevo).
    """
    id_paso: str
    id_proceso: str
    proceso: str
    descripcion: str | None
    paso: str                                          # nombre que se muestra
    maquinas: list[str] = field(default_factory=list)  # máquinas que sirven (vacío = cualquiera)
    id_reproceso: str | None = None                    # paso de un reproceso (None = producción normal)
    veces: int = 1                                     # veces que se hace a cada prenda


@dataclass
class NuevoPaso:
    """Paso que se guarda: id_paso vacío = nuevo."""
    id_proceso: str
    descripcion: str | None = None
    id_paso: str | None = None
    veces: int = 1


@dataclass
class FaltantePaso:
    """Talla que todavía no tiene todas sus unidades asignadas en un paso."""
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    id_paso: str
    paso: str
    cantidad: int                     # lo que se exige en el paso (sin las perdidas en otros pasos)
    asignado: int
    defectuosas_otros_pasos: int = 0


@dataclass
class PiezaDefectuosa:
    """Reporte diario con piezas defectuosas (para el control de la producción y la entrega)."""
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


@dataclass
class ReprocesoTalla:
    """Piezas de una talla que entran al reproceso."""
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    cantidad: int


@dataclass
class InsumoReproceso:
    """Insumo que el cliente envió para el reproceso (queda en la remisión, marcado)."""
    id_insumo_enviado: str
    nombre: str
    cantidad: int
    cantidad_disponible: int
    unidad: str


@dataclass
class Reproceso:
    """Reproceso de piezas defectuosas dentro de la misma producción.

    situacion: Por asignar (sin tareas) | En curso | Terminado | Cancelado.
    """
    id_reproceso: str
    id_produccion: str
    numero: int
    estado: str                       # Abierto | Cancelado (lo guardado)
    situacion: str
    observacion: str | None
    creado_por: str | None
    creado_por_nombre: str | None
    fecha_creacion: datetime
    fecha_estado: datetime
    total_piezas: int
    tareas: int
    pendiente: int
    sin_asignar: int
    tallas: list[ReprocesoTalla] = field(default_factory=list)
    pasos: list[PasoProduccion] = field(default_factory=list)
    faltantes: list[FaltantePaso] = field(default_factory=list)
    insumos: list[InsumoReproceso] = field(default_factory=list)


@dataclass
class NuevoInsumoReproceso:
    nombre: str
    cantidad: int
    unidad: str


@dataclass
class NuevoReproceso:
    """Lo que se elige al reprocesar: piezas por talla, procesos e insumos (opcionales)."""
    tallas: dict[str, int]                         # id_detalle_de_remision -> piezas
    pasos: list[NuevoPaso]
    insumos: list[NuevoInsumoReproceso] = field(default_factory=list)
    observacion: str | None = None


@dataclass
class SeguimientoProduccion:
    """Cambio de estado de una producción (vista vw_seguimiento_produccion)."""
    id_seguimiento_produccion: str
    id_produccion: str
    id_remision: str
    estado_anterior: str | None
    estado_nuevo: str
    responsable: str
    tipo_responsable: str
    fecha_hora: datetime


@dataclass
class EmpleadoDisponibilidad:
    """Empleado activo con su disponibilidad (vista vw_empleados_disponibilidad)."""
    id_empleado: str
    nombre: str
    ocupado_en_tarea: str | None
    ocupado_en_produccion: str | None
    unidades_pendientes: int | None
    disponible: bool                  # sin tareas pendientes Y en el taller ahora
    presente_hoy: bool = True         # vino hoy (tiene entrada registrada)
    en_taller: bool = True            # está en el taller ahora (entrada sin salida)
    estado_asistencia: str = "Presente"   # No presente | Presente | Permiso | Incapacidad | Vacaciones


@dataclass
class MaquinaDisponibilidad:
    """Máquina con su disponibilidad (vista vw_maquinas_disponibilidad)."""
    id_maquina: str
    nombre: str
    descripcion: str | None
    estado: str
    ocupada_por_tarea: str | None
    ocupada_por_empleado: str | None
    ocupada_en_produccion: str | None
    disponible: bool
