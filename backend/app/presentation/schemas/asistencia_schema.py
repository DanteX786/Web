from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EstadoAsistencia = Literal["Presente", "No presente"]


class AsistenciaMarcar(BaseModel):
    estado: EstadoAsistencia
    observacion: str | None = Field(default=None, max_length=150)


class AsistenciaMarcarTodos(BaseModel):
    fecha: date | None = Field(default=None, description="Vacío = hoy (hora de Colombia)")
    estado: EstadoAsistencia = "Presente"


class AsistenciaRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_asistencia: str
    fecha: date
    id_empleado: str
    empleado: str
    identificacion: str
    rol: str | None
    estado: EstadoAsistencia
    observacion: str | None
    fecha_registro: datetime
    registrado_por: str | None
    registrado_por_nombre: str | None
