from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RegistroDiarioCrear(BaseModel):
    id_detalle_de_produccion: str = Field(min_length=1, max_length=10)
    cantidad: int = Field(gt=0, description="Unidades confeccionadas en la jornada")


class RegistroDiarioRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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
