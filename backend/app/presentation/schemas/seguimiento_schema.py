from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SeguimientoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id_seguimiento: str
    id_remision: str
    estado_anterior: str | None
    estado_nuevo: str
    responsable: str
    tipo_responsable: str
    fecha_hora: datetime
