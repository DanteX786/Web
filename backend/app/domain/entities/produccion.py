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
    terminadas: int = 0   # prendas de esta talla que ya pasaron por todos sus procesos


@dataclass
class PasoProduccion:
    """Paso de la producción: un proceso que lleva la prenda según la ficha técnica.

    El mismo proceso puede ir varias veces con distinta descripción
    (ej. Bordado — logo en el pecho / Bordado — nombre en la manga).
    """
    id_paso: str
    id_proceso: str
    proceso: str
    descripcion: str | None
    paso: str                                          # nombre que se muestra
    maquinas: list[str] = field(default_factory=list)  # máquinas que sirven (vacío = cualquiera)


@dataclass
class NuevoPaso:
    """Paso que se guarda: id_paso vacío = nuevo."""
    id_proceso: str
    descripcion: str | None = None
    id_paso: str | None = None


@dataclass
class FaltantePaso:
    """Talla que todavía no tiene todas sus unidades asignadas en un paso."""
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    id_paso: str
    paso: str
    cantidad: int
    asignado: int


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
    disponible: bool                  # sin tareas pendientes Y presente hoy
    presente_hoy: bool = True


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
