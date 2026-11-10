from fastapi import APIRouter, Depends, status

from app.application.compra_service import CompraService
from app.presentation.dependencies.compras_dependencies import get_compra_service
from app.presentation.schemas.compra_schema import (
    CompraActualizar,
    CompraCrear,
    CompraRespuesta,
    DetalleCompraActualizar,
    DetalleCompraCrear,
)

router = APIRouter(prefix="/api/compras", tags=["Compras"])


# ---------- Compra completa ----------
@router.get("", response_model=list[CompraRespuesta],
            summary="Listar compras con sus insumos (filtro opcional por proveedor)")
def listar(id_proveedor: str | None = None, service: CompraService = Depends(get_compra_service)):
    return service.listar(id_proveedor)


@router.get("/{id_compra}", response_model=CompraRespuesta, summary="Detalle de una compra")
def obtener(id_compra: str, service: CompraService = Depends(get_compra_service)):
    return service.obtener(id_compra)


@router.post("", response_model=CompraRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar compra con sus insumos (suma al stock; el total se calcula solo)")
def crear(datos: CompraCrear, service: CompraService = Depends(get_compra_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_compra}", response_model=CompraRespuesta,
            summary="Editar cabecera de la compra (fecha, proveedor, descripción)")
def actualizar(id_compra: str, datos: CompraActualizar,
               service: CompraService = Depends(get_compra_service)):
    return service.actualizar(id_compra, datos.model_dump(exclude_unset=True))


@router.delete("/{id_compra}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar compra (descuenta del stock lo que se había sumado)")
def eliminar(id_compra: str, service: CompraService = Depends(get_compra_service)):
    service.eliminar(id_compra)


# ---------- Líneas de detalle (insumos de la compra) ----------
@router.post("/{id_compra}/detalles", response_model=CompraRespuesta,
             status_code=status.HTTP_201_CREATED, summary="Agregar un insumo a la compra")
def agregar_detalle(id_compra: str, datos: DetalleCompraCrear,
                    service: CompraService = Depends(get_compra_service)):
    return service.agregar_detalle(id_compra, datos.model_dump())


@router.put("/{id_compra}/detalles/{id_insumo}", response_model=CompraRespuesta,
            summary="Editar un insumo de la compra (insumo, cantidad o valor unitario)")
def actualizar_detalle(id_compra: str, id_insumo: str, datos: DetalleCompraActualizar,
                       service: CompraService = Depends(get_compra_service)):
    return service.actualizar_detalle(id_compra, id_insumo, datos.model_dump(exclude_none=True))


@router.delete("/{id_compra}/detalles/{id_insumo}", response_model=CompraRespuesta,
               summary="Quitar un insumo de la compra (la compra debe quedar con al menos uno)")
def eliminar_detalle(id_compra: str, id_insumo: str,
                     service: CompraService = Depends(get_compra_service)):
    return service.eliminar_detalle(id_compra, id_insumo)
