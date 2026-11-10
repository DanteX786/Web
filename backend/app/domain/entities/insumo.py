from dataclasses import dataclass


@dataclass
class TipoInsumo:
    """Tipo de insumo (tabla tb_tipo_insumos). Solo se lee para el formulario."""
    id: str
    nombre: str


@dataclass
class Insumo:
    """Insumo del taller (tabla tb_insumos)."""
    id: str
    nombre: str
    descripcion: str | None
    stock: int
    tipo_id: str | None
    tipo_nombre: str | None  # nombre del tipo (viene de un JOIN con tb_tipo_insumos)
