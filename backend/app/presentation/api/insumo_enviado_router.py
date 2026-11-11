from fastapi import APIRouter, Depends, status

from app.application.insumo_enviado_service import InsumoEnviadoService
from app.presentation.dependencies.ventas_dependencies import get_insumo_enviado_service
from app.presentation.schemas.insumo_enviado_schema import (
    InsumoEnviadoActualizar,
    InsumoEnviadoCrear,
    InsumoEnviadoRespuesta,
)

router = APIRouter(prefix="/api/insumos-enviados", tags=["Insumos enviados por el cliente"])


@router.get("", response_model=list[InsumoEnviadoRespuesta],
            summary="Listar insumos enviados (filtro opcional por remisión)")
def listar(id_remision: str | None = None,
           service: InsumoEnviadoService = Depends(get_insumo_enviado_service)):
    return service.listar(id_remision)


@router.get("/{id_insumo_enviado}", response_model=InsumoEnviadoRespuesta)
def obtener(id_insumo_enviado: str, service: InsumoEnviadoService = Depends(get_insumo_enviado_service)):
    return service.obtener(id_insumo_enviado)


@router.post("", response_model=InsumoEnviadoRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar un insumo que mandó el cliente para una remisión")
def crear(datos: InsumoEnviadoCrear, service: InsumoEnviadoService = Depends(get_insumo_enviado_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_insumo_enviado}", response_model=InsumoEnviadoRespuesta,
            summary="Editar nombre, unidad o cantidad (no menos de lo ya usado)")
def actualizar(id_insumo_enviado: str, datos: InsumoEnviadoActualizar,
               service: InsumoEnviadoService = Depends(get_insumo_enviado_service)):
    return service.actualizar(id_insumo_enviado, datos.model_dump(exclude_none=True))


@router.delete("/{id_insumo_enviado}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar insumo (solo si no se ha usado en producción)")
def eliminar(id_insumo_enviado: str, service: InsumoEnviadoService = Depends(get_insumo_enviado_service)):
    service.eliminar(id_insumo_enviado)
