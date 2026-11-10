from fastapi import APIRouter, Depends, status

from app.application.empleado_service import EmpleadoService
from app.presentation.dependencies.usuarios_dependencies import get_empleado_service
from app.presentation.schemas.empleado_schema import (
    EmpleadoActualizar,
    EmpleadoCrear,
    EmpleadoEstado,
    EmpleadoRespuesta,
    EstadoEmpleado,
)

router = APIRouter(prefix="/api/empleados", tags=["Empleados"])


@router.get("", response_model=list[EmpleadoRespuesta],
            summary="Listar empleados (filtro opcional por estado)")
def listar(estado: EstadoEmpleado | None = None,
           service: EmpleadoService = Depends(get_empleado_service)):
    return service.listar(estado)


@router.get("/{id_empleado}", response_model=EmpleadoRespuesta, summary="Detalle de un empleado")
def obtener(id_empleado: str, service: EmpleadoService = Depends(get_empleado_service)):
    return service.obtener(id_empleado)


@router.post("", response_model=EmpleadoRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar empleado (el ID lo genera la base de datos; la contraseña se encripta)")
def crear(datos: EmpleadoCrear, service: EmpleadoService = Depends(get_empleado_service)):
    return service.crear(datos.model_dump())


@router.put("/{id_empleado}", response_model=EmpleadoRespuesta,
            summary="Editar empleado (solo cambia los campos enviados; sin contraseña se conserva la actual)")
def actualizar(id_empleado: str, datos: EmpleadoActualizar,
               service: EmpleadoService = Depends(get_empleado_service)):
    return service.actualizar(id_empleado, datos.model_dump(exclude_unset=True))


@router.patch("/{id_empleado}/estado", response_model=EmpleadoRespuesta,
              summary="Cambiar estado (Activo / Inactivo)")
def cambiar_estado(id_empleado: str, datos: EmpleadoEstado,
                   service: EmpleadoService = Depends(get_empleado_service)):
    return service.cambiar_estado(id_empleado, datos.estado)


@router.delete("/{id_empleado}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar empleado (solo si no tiene asignaciones de producción)")
def eliminar(id_empleado: str, service: EmpleadoService = Depends(get_empleado_service)):
    service.eliminar(id_empleado)
