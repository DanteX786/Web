from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EstadoAsistencia = Literal["No presente", "Presente", "Permiso", "Incapacidad", "Vacaciones"]
TipoSalida = Literal["Fin de jornada", "Permiso"]


class AsistenciaMarcar(BaseModel):
    """Novedad del día completo (Permiso / Incapacidad / Vacaciones / No presente) y observación."""
    estado: EstadoAsistencia
    observacion: str | None = Field(default=None, max_length=150)


class EntradaRegistrar(BaseModel):
    hora: time | None = Field(default=None, description="HH:MM (hora de Colombia). Vacío = ahora (solo hoy)")


class SalidaRegistrar(BaseModel):
    hora: time | None = Field(default=None, description="HH:MM (hora de Colombia). Vacío = ahora (solo hoy)")
    tipo_salida: TipoSalida = "Fin de jornada"
    motivo: str | None = Field(default=None, max_length=150, description="Obligatorio si es Permiso")


class EntradaTodos(BaseModel):
    fecha: date | None = Field(default=None, description="Vacío = hoy (hora de Colombia)")
    hora: time | None = Field(default=None, description="HH:MM. Vacío = ahora (solo hoy)")


class MarcacionEditar(BaseModel):
    hora_entrada: time
    hora_salida: time | None = None
    tipo_salida: TipoSalida | None = None
    motivo: str | None = Field(default=None, max_length=150)


class MarcacionRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_marcacion: str
    id_asistencia: str
    id_empleado: str
    empleado: str
    fecha: date
    hora_entrada: datetime
    hora_salida: datetime | None
    tipo_salida: TipoSalida | None
    motivo: str | None
    minutos: int
    sin_salida: bool
    registrado_por: str | None
    registrado_por_nombre: str | None


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
    en_taller: bool
    minutos_trabajados: int
    marcaciones: list[MarcacionRespuesta]
