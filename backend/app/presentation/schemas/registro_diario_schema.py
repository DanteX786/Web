from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RegistroDiarioCrear(BaseModel):
    id_detalle_de_produccion: str = Field(min_length=1, max_length=10)
    cantidad: int = Field(ge=0, description="Cantidad terminada (buenas) en este reporte")
    cantidad_defectuosa: int = Field(default=0, ge=0, description="Piezas que salieron defectuosas")
    motivo_defecto: str | None = Field(default=None, max_length=200, description="Ej. le faltaron 2 mm")


class RegistroDiarioCantidad(BaseModel):
    cantidad: int = Field(ge=0, description="Nueva cantidad terminada")
    cantidad_defectuosa: int = Field(default=0, ge=0)
    motivo_defecto: str | None = Field(default=None, max_length=200)


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
    cantidad: int                       # terminadas
    id_produccion: str
    id_remision: str
    proceso: str | None = None
    cantidad_defectuosa: int = 0
    motivo_defecto: str | None = None
    paso: str | None = None
