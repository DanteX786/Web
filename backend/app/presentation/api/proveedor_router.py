from fastapi import APIRouter, Depends, status

from app.application.proveedor_service import ProveedorService
from app.presentation.dependencies.compras_dependencies import get_proveedor_service
from app.presentation.schemas.proveedor_schema import (
    EstadoProveedor,
    ProveedorActualizar,
    ProveedorCrear,
    ProveedorEstado,
    ProveedorRespuesta,
)

router = APIRouter(prefix="/api/proveedores", tags=["Proveedores"])


@router.get("", response_model=list[ProveedorRespuesta],
            summary="Listar proveedores (filtro opcional por estado)")
def listar(estado: EstadoProveedor | None = None,
           service: ProveedorService = Depends(get_proveedor_service)):
    return service.listar(estado)


@router.get("/{id_proveedor}", response_model=ProveedorRespuesta,
            summary="Detalle de un proveedor")
def obtener(id_proveedor: str, service: ProveedorService = Depends(get_proveedor_service)):
    return service.obtener(id_proveedor)


@router.post("", response_model=ProveedorRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar proveedor (el ID PRV00001... lo genera la base de datos)")
def crear(datos: ProveedorCrear, service: ProveedorService = Depends(get_proveedor_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_proveedor}", response_model=ProveedorRespuesta,
            summary="Editar proveedor (solo cambia los campos enviados)")
def actualizar(id_proveedor: str, datos: ProveedorActualizar,
               service: ProveedorService = Depends(get_proveedor_service)):
    return service.actualizar(id_proveedor, datos.model_dump(exclude_unset=True))


@router.patch("/{id_proveedor}/estado", response_model=ProveedorRespuesta,
              summary="Cambiar estado (Activo / Inactivo)")
def cambiar_estado(id_proveedor: str, datos: ProveedorEstado,
                   service: ProveedorService = Depends(get_proveedor_service)):
    return service.cambiar_estado(id_proveedor, datos.estado)


@router.delete("/{id_proveedor}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar proveedor (solo si no tiene compras)")
def eliminar(id_proveedor: str, service: ProveedorService = Depends(get_proveedor_service)):
    service.eliminar(id_proveedor)
    