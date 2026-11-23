from typing import Literal

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.application.entrega_service import EntregaService
from app.presentation.dependencies.auth_dependencies import get_id_empleado_actual
from app.presentation.dependencies.ventas_dependencies import get_entrega_service
from app.presentation.schemas.entrega_schema import (
    EntregaCrear,
    EntregaRespuesta,
    RemisionPorEntregarRespuesta,
)

router = APIRouter(prefix="/api/entregas", tags=["Remisión de entrega"])


@router.get("", response_model=list[EntregaRespuesta],
            summary="Listar remisiones de entrega (filtros: estado, remisión)")
def listar(estado: Literal["Pendiente de pago", "Pagada"] | None = None,
           id_remision: str | None = None,
           service: EntregaService = Depends(get_entrega_service)):
    return service.listar(estado, id_remision)


# OJO: esta ruta va ANTES de /{id_entrega} para que no la confunda con un id
@router.get("/remisiones-por-entregar", response_model=list[RemisionPorEntregarRespuesta],
            summary="Remisiones Terminadas sin entrega (para el formulario de crear)")
def remisiones_por_entregar(service: EntregaService = Depends(get_entrega_service)):
    return service.remisiones_por_entregar()


@router.get("/{id_entrega}", response_model=EntregaRespuesta)
def obtener(id_entrega: str, service: EntregaService = Depends(get_entrega_service)):
    return service.obtener(id_entrega)


@router.post("", response_model=EntregaRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Enviar una remisión Terminada a remisión de entrega (pasa a Entregada)")
def crear(datos: EntregaCrear,
          id_empleado: str = Depends(get_id_empleado_actual),
          service: EntregaService = Depends(get_entrega_service)):
    return service.crear(datos.id_remision, id_empleado)


# No hay PUT: una remisión de entrega NO se edita (evita alterar precios o fechas).


@router.post("/{id_entrega}/remision-firmada", response_model=EntregaRespuesta,
             summary="Subir la remisión firmada por el cliente (una sola vez, máx. 5 MB)")
def subir_remision_firmada(id_entrega: str, archivo: UploadFile = File(...),
                           service: EntregaService = Depends(get_entrega_service)):
    return service.subir_remision_firmada(id_entrega, archivo.filename, archivo.file.read())


@router.post("/{id_entrega}/comprobante", response_model=EntregaRespuesta,
             summary="Subir la factura / comprobante de pago (una sola vez, máx. 5 MB)")
def subir_comprobante(id_entrega: str, archivo: UploadFile = File(...),
                      service: EntregaService = Depends(get_entrega_service)):
    return service.subir_comprobante(id_entrega, archivo.filename, archivo.file.read())


@router.patch("/{id_entrega}/pagar", response_model=EntregaRespuesta,
              summary="Marcar como Pagada (requiere comprobante - CA_29_01)")
def marcar_pagada(id_entrega: str, service: EntregaService = Depends(get_entrega_service)):
    return service.marcar_pagada(id_entrega)
