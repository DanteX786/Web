from dataclasses import dataclass


@dataclass
class TipoMaquina:
    """Tipo de máquina del taller (tabla tipo_de_maquina)."""
    id_tipo_de_maquina: str
    nombre: str
    descripcion: str | None
    estado: str