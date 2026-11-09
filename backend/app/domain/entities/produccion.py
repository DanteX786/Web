from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass
class Produccion:
    """Producción con su avance (vista vw_avance_produccion)."""
    id_produccion: str
    id_remision: str
    cliente: str
    estado: str
    fecha_inicio: date
    fecha_entrega: date | None
    total_asignado: int
    total_realizado: int
    porcentaje_avance: Decimal


@dataclass
class Asignacion:
    """Una asignación de trabajo (fila de tb_detalle_de_produccion) con su avance."""
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


@dataclass
class NuevaAsignacion:
    """Datos para crear o editar una asignación."""
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
    """Remisión Aprobada que todavía no tiene producción."""
    id_remision: str
    cliente: str
    ficha_tecnica_nombre: str
    total_prendas: int
    fecha_entrega: date | None


@dataclass
class LineaRemision:
    """Línea del detalle de la remisión (prenda + talla) para armar las asignaciones."""
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    cantidad: int
