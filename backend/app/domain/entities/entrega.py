from dataclasses import dataclass
from datetime import date


@dataclass
class Entrega:
    """Remisión de entrega: cierre de la venta (tabla tb_remision_entrega).

    Regla del taller: cada remisión se entrega UNA sola vez y completa.
    """
    id_entrega: str
    id_remision: str
    nit_cliente: str
    cliente: str
    cantidad_entregada: int
    precio_total: float
    fecha_finalizacion: date
    remision_firmada_url: str | None
    comprobante_pago_url: str | None
    estado: str  # 'Pendiente de pago' | 'Pagada'


@dataclass
class RemisionPorEntregar:
    """Remisión Terminada que todavía no tiene remisión de entrega."""
    id_remision: str
    nit_cliente: str
    cliente: str
    ficha_tecnica_nombre: str
    total_prendas: int
    costo_prenda: float
    costo_total: float
    fecha_entrega: date | None
