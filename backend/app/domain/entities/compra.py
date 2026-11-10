from dataclasses import dataclass, field
from datetime import date


@dataclass
class DetalleCompra:
    """Una línea de la compra (tabla tb_detalle_compras).

    La llave es (id_compra, id_insumo): un insumo aparece una sola vez por compra.
    """
    id_insumo: str
    nombre_insumo: str | None  # viene de un JOIN con tb_insumos
    cantidad: int
    valor_unitario: float

    @property
    def subtotal(self) -> float:
        return self.cantidad * self.valor_unitario


@dataclass
class Compra:
    """Compra de insumos a un proveedor (tabla tb_compras)."""
    id: str
    fecha: date
    id_proveedor: str | None
    nombre_proveedor: str | None  # viene de un JOIN con la tabla de proveedores
    descripcion: str | None
    total: float
    detalles: list[DetalleCompra] = field(default_factory=list)
