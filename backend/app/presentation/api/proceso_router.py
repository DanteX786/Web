from fastapi import APIRouter, Depends, status

from app.application.proceso_service import ProcesoService
from app.presentation.dependencies.parametros_dependencies import get_proceso_service
from app.presentation.schemas.proceso_schema import (
    EstadoTipo, ProcesoActualizar, ProcesoCrear, ProcesoEstado, ProcesoRespuesta,
)

router = APIRouter(prefix="/api/procesos", tags=["Parámetros - Procesos"])


@router.get("", response_model=list[ProcesoRespuesta], summary="Listar procesos (filtro opcional por estado)")
def listar(estado: EstadoTipo | None = None, service: ProcesoService = Depends(get_proceso_service)):
    return service.listar(estado)


@router.get("/{id_proceso}", response_model=ProcesoRespuesta, summary="Detalle de un proceso")
def obtener(id_proceso: str, service: ProcesoService = Depends(get_proceso_service)):
    return service.obtener(id_proceso)


@router.post("", response_model=ProcesoRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar proceso (el ID PRC00001... lo genera la base de datos)")
def crear(datos: ProcesoCrear, service: ProcesoService = Depends(get_proceso_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_proceso}", response_model=ProcesoRespuesta, summary="Editar proceso (solo los campos enviados)")
def actualizar(id_proceso: str, datos: ProcesoActualizar, service: ProcesoService = Depends(get_proceso_service)):
    return service.actualizar(id_proceso, datos.model_dump(exclude_unset=True))


@router.patch("/{id_proceso}/estado", response_model=ProcesoRespuesta, summary="Cambiar estado (Activo / Inactivo)")
def cambiar_estado(id_proceso: str, datos: ProcesoEstado, service: ProcesoService = Depends(get_proceso_service)):
    return service.cambiar_estado(id_proceso, datos.estado)


@router.delete("/{id_proceso}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar proceso (solo si no se ha usado en producción)")
def eliminar(id_proceso: str, service: ProcesoService = Depends(get_proceso_service)):
    service.eliminar(id_proceso)
