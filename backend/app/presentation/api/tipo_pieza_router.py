from fastapi import APIRouter, Depends, status

from app.application.tipo_pieza_service import TipoPiezaService
from app.presentation.dependencies.parametros_dependencies import get_tipo_pieza_service
from app.presentation.schemas.tipo_pieza_schema import (
    EstadoTipo,
    TipoPiezaActualizar,
    TipoPiezaCrear,
    TipoPiezaEstado,
    TipoPiezaRespuesta,
)

router = APIRouter(prefix="/api/tipos-pieza", tags=["Parámetros - Tipos de pieza"])


@router.get("", response_model=list[TipoPiezaRespuesta],
            summary="Listar tipos de pieza (filtro opcional por estado)")
def listar(estado: EstadoTipo | None = None,
           service: TipoPiezaService = Depends(get_tipo_pieza_service)):
    return service.listar(estado)


@router.get("/{id_tipo}", response_model=TipoPiezaRespuesta,
            summary="Detalle de un tipo de pieza")
def obtener(id_tipo: str, service: TipoPiezaService = Depends(get_tipo_pieza_service)):
    return service.obtener(id_tipo)


@router.post("", response_model=TipoPiezaRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar tipo de pieza (el ID TPZ00001... lo genera la base de datos)")
def crear(datos: TipoPiezaCrear, service: TipoPiezaService = Depends(get_tipo_pieza_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_tipo}", response_model=TipoPiezaRespuesta,
            summary="Editar tipo de pieza (solo cambia los campos enviados)")
def actualizar(id_tipo: str, datos: TipoPiezaActualizar,
               service: TipoPiezaService = Depends(get_tipo_pieza_service)):
    return service.actualizar(id_tipo, datos.model_dump(exclude_unset=True))


@router.patch("/{id_tipo}/estado", response_model=TipoPiezaRespuesta,
              summary="Cambiar estado (Activo / Inactivo)")
def cambiar_estado(id_tipo: str, datos: TipoPiezaEstado,
                   service: TipoPiezaService = Depends(get_tipo_pieza_service)):
    return service.cambiar_estado(id_tipo, datos.estado)


@router.delete("/{id_tipo}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar tipo de pieza (solo si no se ha usado en producción)")
def eliminar(id_tipo: str, service: TipoPiezaService = Depends(get_tipo_pieza_service)):
    service.eliminar(id_tipo)

    