from fastapi import APIRouter, Depends, status

from app.application.tipo_insumo_service import TipoInsumoService
from app.presentation.dependencies.compras_dependencies import get_tipo_insumo_service
from app.presentation.schemas.tipo_insumo_schema import (
    TipoInsumoActualizar,
    TipoInsumoCompletoRespuesta,
    TipoInsumoCrear,
)

# Nota: /api/insumos/tipos (del módulo de insumos) sigue existiendo para el formulario
# de insumos. Este router es el CRUD completo de la pantalla "Tipos de insumo".
router = APIRouter(prefix="/api/tipos-insumo", tags=["Tipos de insumo"])


@router.get("", response_model=list[TipoInsumoCompletoRespuesta], summary="Listar tipos de insumo")
def listar(service: TipoInsumoService = Depends(get_tipo_insumo_service)):
    return service.listar()


@router.get("/{id_tipo}", response_model=TipoInsumoCompletoRespuesta, summary="Detalle de un tipo de insumo")
def obtener(id_tipo: str, service: TipoInsumoService = Depends(get_tipo_insumo_service)):
    return service.obtener(id_tipo)


@router.post("", response_model=TipoInsumoCompletoRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Crear tipo de insumo (el ID lo genera la base de datos)")
def crear(datos: TipoInsumoCrear, service: TipoInsumoService = Depends(get_tipo_insumo_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_tipo}", response_model=TipoInsumoCompletoRespuesta, summary="Editar tipo de insumo")
def actualizar(id_tipo: str, datos: TipoInsumoActualizar,
               service: TipoInsumoService = Depends(get_tipo_insumo_service)):
    return service.actualizar(id_tipo, datos.model_dump(exclude_unset=True))


@router.delete("/{id_tipo}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar tipo de insumo (solo si ningún insumo lo usa)")
def eliminar(id_tipo: str, service: TipoInsumoService = Depends(get_tipo_insumo_service)):
    service.eliminar(id_tipo)
