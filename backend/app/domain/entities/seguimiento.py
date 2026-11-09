from dataclasses import dataclass
from datetime import datetime


@dataclass
class Seguimiento:
    """Cambio de estado de una remisión (vista vw_seguimiento_remision)."""
    id_seguimiento: str
    id_remision: str
    estado_anterior: str | None
    estado_nuevo: str
    responsable: str
    tipo_responsable: str
    fecha_hora: datetime
