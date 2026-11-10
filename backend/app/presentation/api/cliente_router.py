from typing import Literal

from fastapi import APIRouter, Depends, status

from app.application.cliente_service import ClienteService
from app.presentation.dependencies.usuarios_dependencies import get_cliente_service
from app.presentation.schemas.cliente_schema import (
    CategoriaClienteRespuesta,
    ClienteActualizar,
    ClienteCrear,
    ClienteRespuesta,
)

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])


@router.get("", response_model=list[ClienteRespuesta],
            summary="Listar clientes (filtro opcional por estado)")
def listar(estado: Literal["Activo", "Inactivo"] | None = None,
           service: ClienteService = Depends(get_cliente_service)):
    return service.listar(estado)


# Va ANTES de "/{nit}" para que "categorias" no se tome como un NIT
@router.get("/categorias", response_model=list[CategoriaClienteRespuesta],
            summary="Listar categorías de cliente activas (para el formulario)")
def listar_categorias(service: ClienteService = Depends(get_cliente_service)):
    return service.listar_categorias()


@router.get("/{nit}", response_model=ClienteRespuesta, summary="Detalle de un cliente")
def obtener(nit: str, service: ClienteService = Depends(get_cliente_service)):
    return service.obtener(nit)


@router.post("", response_model=ClienteRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar cliente (el NIT es su identificación; el rol Cliente se asigna solo)")
def crear(datos: ClienteCrear, service: ClienteService = Depends(get_cliente_service)):
    return service.crear(datos.model_dump(exclude_none=True))


@router.put("/{nit}", response_model=ClienteRespuesta,
            summary="Editar cliente o cambiar su estado (el NIT no se edita)")
def actualizar(nit: str, datos: ClienteActualizar,
               service: ClienteService = Depends(get_cliente_service)):
    return service.actualizar(nit, datos.model_dump(exclude_unset=True))


@router.delete("/{nit}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar cliente (solo si no tiene remisiones)")
def eliminar(nit: str, service: ClienteService = Depends(get_cliente_service)):
    service.eliminar(nit)
