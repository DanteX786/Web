from dataclasses import dataclass, field
from datetime import date, datetime


@dataclass
class Marcacion:
    """Un tramo del día: entrada -> salida (vista vw_asistencia_marcacion)."""
    id_marcacion: str
    id_asistencia: str
    id_empleado: str
    empleado: str
    fecha: date
    hora_entrada: datetime
    hora_salida: datetime | None       # None = sigue en el taller (o se olvidó marcar la salida)
    tipo_salida: str | None            # Fin de jornada | Permiso
    motivo: str | None                 # motivo del permiso
    minutos: int
    sin_salida: bool                   # día anterior sin salida: hay que corregirlo
    registrado_por: str | None
    registrado_por_nombre: str | None
    fecha_registro: datetime


@dataclass
class Asistencia:
    """Asistencia de un empleado en un día (vista vw_asistencia)."""
    id_asistencia: str
    fecha: date
    id_empleado: str
    empleado: str
    identificacion: str
    rol: str | None
    estado: str                    # No presente | Presente | Permiso | Incapacidad | Vacaciones
    observacion: str | None
    fecha_registro: datetime
    registrado_por: str | None
    registrado_por_nombre: str | None
    en_taller: bool = False        # tiene una entrada de hoy sin salida
    minutos_trabajados: int = 0
    marcaciones: list[Marcacion] = field(default_factory=list)
