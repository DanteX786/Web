from dataclasses import dataclass


@dataclass
class TipoInsumo:
    """Tipo de insumo (tabla tb_tipo_insumos) con todos sus campos.

    Ojo: insumo.py tiene otra clase TipoInsumo más pequeña (solo id y nombre)
    que usa el formulario de insumos. Esta es la del CRUD completo.
    """
    id: str
    nombre: str
    descripcion: str | None
    estado: str
