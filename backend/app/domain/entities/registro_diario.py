from dataclasses import dataclass
from datetime import datetime


@dataclass
class RegistroDiario:
    """Reporte diario de un empleado (vista vw_historial_registro_diario)."""
    id_registro_diario: str
    fecha: datetime
    id_empleado: str
    empleado: str
    pieza: str
    maquina: str
    prenda: str
    talla: str
    cantidad: int
    id_produccion: str
    id_remision: str
