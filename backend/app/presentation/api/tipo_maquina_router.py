from fastapi import APIRouter, Depends, status

from app.application.tipo_maquina_service import TipoMaquinaService
from app.presentation.dependencies.parametros_dependencies import get_tipo_maquina_service
from app.presentation.schemas.tipo_maquina_schema import (
    EstadoTipo,
    TipoMaquinaActualizar,
    TipoMaquinaCrear,
    TipoMaquinaEstado,
    TipoMaquinaRespuesta,
)

router = APIRouter(prefix="/api/tipos-maquina", tags=["Parámetros - Tipos de máquina"])


@router.get("", response_model=list[TipoMaquinaRespuesta],
            summary="Listar tipos de máquina (filtro opcional por estado)")
def listar(estado: EstadoTipo | None = None,
           service: TipoMaquinaService = Depends(get_tipo_maquina_service)):
    return service.listar(estado)


@router.get("/{id_tipo}", response_model=TipoMaquinaRespuesta,
            summary="Detalle de un tipo de máquina")
def obtener(id_tipo: str, service: TipoMaquinaService = Depends(get_tipo_maquina_service)):
    return service.obtener(id_tipo)


@router.post("", response_model=TipoMaquinaRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar tipo de máquina (el ID TMQ00001... lo genera la base de datos)")
def crear(datos: TipoMaquinaCrear, service: TipoMaquinaService = Depends(get_tipo_maquina_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_tipo}", response_model=TipoMaquinaRespuesta,
            summary="Editar tipo de máquina (solo cambia los campos enviados)")
def actualizar(id_tipo: str, datos: TipoMaquinaActualizar,
               service: TipoMaquinaService = Depends(get_tipo_maquina_service)):
    return service.actualizar(id_tipo, datos.model_dump(exclude_unset=True))


@router.patch("/{id_tipo}/estado", response_model=TipoMaquinaRespuesta,
              summary="Cambiar estado (Activo / Inactivo)")
def cambiar_estado(id_tipo: str, datos: TipoMaquinaEstado,
                   service: TipoMaquinaService = Depends(get_tipo_maquina_service)):
    return service.cambiar_estado(id_tipo, datos.estado)


@router.delete("/{id_tipo}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar tipo de máquina (solo si no se ha usado en producción)")
def eliminar(id_tipo: str, service: TipoMaquinaService = Depends(get_tipo_maquina_service)):
    service.eliminar(id_tipo)

    