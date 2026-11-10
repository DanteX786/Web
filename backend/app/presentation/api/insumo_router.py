from fastapi import APIRouter, Depends, status

from app.application.insumo_service import InsumoService
from app.presentation.dependencies.compras_dependencies import get_insumo_service
from app.presentation.schemas.insumo_schema import (
    InsumoActualizar,
    InsumoCrear,
    InsumoRespuesta,
    TipoInsumoRespuesta,
)

router = APIRouter(prefix="/api/insumos", tags=["Insumos"])


@router.get("", response_model=list[InsumoRespuesta],
            summary="Listar insumos (filtro opcional por tipo)")
def listar(tipo_id: str | None = None, service: InsumoService = Depends(get_insumo_service)):
    return service.listar(tipo_id)


# Va ANTES de "/{id_insumo}" para que "tipos" no se tome como un id
@router.get("/tipos", response_model=list[TipoInsumoRespuesta],
            summary="Listar tipos de insumo (para el formulario)")
def listar_tipos(service: InsumoService = Depends(get_insumo_service)):
    return service.listar_tipos()


@router.get("/{id_insumo}", response_model=InsumoRespuesta, summary="Detalle de un insumo")
def obtener(id_insumo: str, service: InsumoService = Depends(get_insumo_service)):
    return service.obtener(id_insumo)


@router.post("", response_model=InsumoRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar insumo con stock inicial (el ID lo genera la base de datos)")
def crear(datos: InsumoCrear, service: InsumoService = Depends(get_insumo_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_insumo}", response_model=InsumoRespuesta,
            summary="Editar insumo (nombre, descripción y tipo; el stock no se edita aquí)")
def actualizar(id_insumo: str, datos: InsumoActualizar,
               service: InsumoService = Depends(get_insumo_service)):
    return service.actualizar(id_insumo, datos.model_dump(exclude_unset=True))


@router.delete("/{id_insumo}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar insumo (solo si no aparece en compras ni en producción)")
def eliminar(id_insumo: str, service: InsumoService = Depends(get_insumo_service)):
    service.eliminar(id_insumo)
