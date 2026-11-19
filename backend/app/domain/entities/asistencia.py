from dataclasses import dataclass
from datetime import date, datetime


@dataclass
class Asistencia:
    """Asistencia de un empleado en un día (vista vw_asistencia)."""
    id_asistencia: str
    fecha: date
    id_empleado: str
    empleado: str
    identificacion: str
    rol: str | None
    estado: str                    # Presente | No presente
    observacion: str | None
    fecha_registro: datetime
    registrado_por: str | None
    registrado_por_nombre: str | None
