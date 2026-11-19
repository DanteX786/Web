from datetime import date

from fastapi import APIRouter, Depends

from app.application.asistencia_service import AsistenciaService
from app.presentation.dependencies.auth_dependencies import get_id_empleado_actual
from app.presentation.dependencies.produccion_dependencies import get_asistencia_service
from app.presentation.schemas.asistencia_schema import (
    AsistenciaMarcar, AsistenciaMarcarTodos, AsistenciaRespuesta,
)

router = APIRouter(prefix="/api/asistencia", tags=["Producción - Asistencia"])


@router.get("", response_model=list[AsistenciaRespuesta],
            summary="Asistencia de un día (vacío = hoy). Crea la lista con los empleados Activos en 'No presente'")
def del_dia(fecha: date | None = None, service: AsistenciaService = Depends(get_asistencia_service)):
    return service.del_dia(fecha)


@router.post("/marcar-todos", response_model=list[AsistenciaRespuesta],
             summary="Marcar a todos los empleados del día como Presente (o No presente)")
def marcar_todos(datos: AsistenciaMarcarTodos,
                 id_empleado: str = Depends(get_id_empleado_actual),
                 service: AsistenciaService = Depends(get_asistencia_service)):
    return service.marcar_todos(datos.fecha, datos.estado, id_empleado)


@router.patch("/{id_asistencia}", response_model=AsistenciaRespuesta,
              summary="Marcar Presente / No presente (con observación opcional)")
def marcar(id_asistencia: str, datos: AsistenciaMarcar,
           id_empleado: str = Depends(get_id_empleado_actual),
           service: AsistenciaService = Depends(get_asistencia_service)):
    return service.marcar(id_asistencia, datos.estado, datos.observacion, id_empleado)
