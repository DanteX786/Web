from typing import Literal

from fastapi import APIRouter, Depends, status

from app.application.auth_service import AuthService
from app.application.cliente_service import ClienteService
from app.presentation.dependencies.auth_dependencies import get_auth_service, get_id_empleado_actual
from app.presentation.dependencies.usuarios_dependencies import get_cliente_service
from app.presentation.schemas.cliente_schema import (
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


@router.get("/{nit}", response_model=ClienteRespuesta, summary="Detalle de un cliente")
def obtener(nit: str, service: ClienteService = Depends(get_cliente_service)):
    return service.obtener(nit)


@router.post("", response_model=ClienteRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar cliente (el NIT es su identificación; el rol Cliente se asigna solo)")
def crear(datos: ClienteCrear,
          id_empleado: str = Depends(get_id_empleado_actual),
          service: ClienteService = Depends(get_cliente_service)):
    return service.crear(datos.model_dump(exclude_none=True), id_empleado)


@router.post("/{nit}/invitacion", response_model=ClienteRespuesta,
             summary="Enviar / reenviar al cliente el correo para activar su cuenta (anula el enlace anterior)")
def invitar(nit: str,
            auth: AuthService = Depends(get_auth_service),
            service: ClienteService = Depends(get_cliente_service)):
    auth.invitar_cliente_por_nit(nit)
    return service.obtener(nit)


@router.put("/{nit}", response_model=ClienteRespuesta,
            summary="Editar cliente o cambiar su estado (el NIT no se edita)")
def actualizar(nit: str, datos: ClienteActualizar,
               service: ClienteService = Depends(get_cliente_service)):
    return service.actualizar(nit, datos.model_dump(exclude_unset=True))


@router.delete("/{nit}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar cliente (solo si no tiene remisiones)")
def eliminar(nit: str, service: ClienteService = Depends(get_cliente_service)):
    service.eliminar(nit)
