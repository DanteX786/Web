from dataclasses import dataclass, field
from datetime import date


@dataclass
class DetalleRemision:
    """Una línea de la remisión: prenda + talla + cantidad (tabla tb_detalle_rem)."""
    id_detalle_de_remision: str
    nombre_de_la_pieza: str
    talla: str
    cantidad: int


@dataclass
class InsumoEnviado:
    """Insumo que el cliente manda junto con la remisión (tabla tb_insumos_enviados_x_cliente).

    cantidad_disponible la maneja la base de datos: arranca igual a cantidad y baja
    cuando el insumo se asigna a producción (trigger trg_detalle_produccion_stock).
    """
    id_insumo_enviado: str
    id_remision: str
    nombre: str
    cantidad: int
    cantidad_disponible: int
    unidad: str
    cliente: str | None = None          # viene de un JOIN, útil para el listado general
    estado_remision: str | None = None  # viene de un JOIN

    @property
    def cantidad_usada(self) -> int:
        return self.cantidad - self.cantidad_disponible


@dataclass
class Remision:
    """Remisión que manda el cliente con las telas cortadas (tabla tb_remision)."""
    id_remision: str
    nit_cliente: str
    cliente: str  # viene de un JOIN con tb_clientes
    ficha_tecnica_nombre: str
    ficha_tecnica_url: str | None
    fecha_recibo: date
    fecha_entrega: date | None
    costo_prenda: float
    total_prendas: int   # lo calcula la BD con el detalle (trigger trg_detalle_rem_total)
    costo_total: float   # columna calculada: costo_prenda * total_prendas
    estado: str
    insumos_enviados: bool
    observaciones: str | None
    detalles: list[DetalleRemision] = field(default_factory=list)
    insumos: list[InsumoEnviado] = field(default_factory=list)
