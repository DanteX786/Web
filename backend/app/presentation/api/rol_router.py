from fastapi import APIRouter, Depends, status

from app.application.rol_service import RolService
from app.presentation.dependencies.usuarios_dependencies import get_rol_service
from app.presentation.schemas.rol_schema import (
    EstadoRol,
    PermisoRespuesta,
    RolActualizar,
    RolCrear,
    RolEstado,
    RolRespuesta,
)

router = APIRouter(prefix="/api/roles", tags=["Roles"])


@router.get("", response_model=list[RolRespuesta],
            summary="Listar roles con sus permisos (filtro opcional por estado)")
def listar(estado: EstadoRol | None = None, service: RolService = Depends(get_rol_service)):
    return service.listar(estado)


# Va ANTES de "/{id_rol}" para que "permisos" no se tome como un id
@router.get("/permisos", response_model=list[PermisoRespuesta],
            summary="Listar todos los permisos disponibles (para el formulario)")
def listar_permisos(service: RolService = Depends(get_rol_service)):
    return service.listar_permisos()


@router.get("/{id_rol}", response_model=RolRespuesta, summary="Detalle de un rol")
def obtener(id_rol: str, service: RolService = Depends(get_rol_service)):
    return service.obtener(id_rol)


@router.post("", response_model=RolRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar rol con sus permisos (el ID lo genera la base de datos)")
def crear(datos: RolCrear, service: RolService = Depends(get_rol_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_rol}", response_model=RolRespuesta,
            summary="Editar rol (solo cambia los campos enviados; permisos reemplaza la lista completa)")
def actualizar(id_rol: str, datos: RolActualizar, service: RolService = Depends(get_rol_service)):
    return service.actualizar(id_rol, datos.model_dump(exclude_unset=True))


@router.patch("/{id_rol}/estado", response_model=RolRespuesta,
              summary="Cambiar estado (Activo / Inactivo)")
def cambiar_estado(id_rol: str, datos: RolEstado, service: RolService = Depends(get_rol_service)):
    return service.cambiar_estado(id_rol, datos.estado)


@router.delete("/{id_rol}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar rol (no el de administrador, ni si tiene empleados)")
def eliminar(id_rol: str, service: RolService = Depends(get_rol_service)):
    service.eliminar(id_rol)
