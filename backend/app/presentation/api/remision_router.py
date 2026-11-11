from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from app.application.remision_service import RemisionService
from app.presentation.dependencies.auth_dependencies import (
    get_id_empleado_actual,
    get_id_empleado_opcional,
)
from app.presentation.dependencies.ventas_dependencies import get_remision_service
from app.presentation.schemas.remision_schema import (
    EstadoRemision,
    RemisionActualizar,
    RemisionCrear,
    RemisionRechazar,
    RemisionRespuesta,
)

router = APIRouter(prefix="/api/remisiones", tags=["Remisiones"])


@router.get("", response_model=list[RemisionRespuesta],
            summary="Listar remisiones con prendas e insumos (filtros: estado, cliente)")
def listar(estado: EstadoRemision | None = None, nit_cliente: str | None = None,
           service: RemisionService = Depends(get_remision_service)):
    return service.listar(estado, nit_cliente)


@router.get("/{id_remision}", response_model=RemisionRespuesta, summary="Detalle de una remisión")
def obtener(id_remision: str, service: RemisionService = Depends(get_remision_service)):
    return service.obtener(id_remision)


@router.post("", response_model=RemisionRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar remisión con prendas y, opcional, insumos del cliente (queda Pendiente)")
def crear(datos: RemisionCrear,
          id_empleado: str | None = Depends(get_id_empleado_opcional),
          service: RemisionService = Depends(get_remision_service)):
    return service.crear(datos.model_dump(), id_empleado)


@router.put("/{id_remision}", response_model=RemisionRespuesta,
            summary="Editar remisión Pendiente (si llegan detalles / insumos, se reemplazan)")
def actualizar(id_remision: str, datos: RemisionActualizar,
               service: RemisionService = Depends(get_remision_service)):
    return service.actualizar(id_remision, datos.model_dump(exclude_unset=True))


@router.patch("/{id_remision}/aprobar", response_model=RemisionRespuesta,
              summary="Aprobar remisión Pendiente (queda lista para producción)")
def aprobar(id_remision: str,
            id_empleado: str = Depends(get_id_empleado_actual),
            service: RemisionService = Depends(get_remision_service)):
    return service.aprobar(id_remision, id_empleado)


@router.patch("/{id_remision}/rechazar", response_model=RemisionRespuesta,
              summary="Rechazar remisión Pendiente o Aprobada, con el motivo")
def rechazar(id_remision: str, datos: RemisionRechazar,
             id_empleado: str = Depends(get_id_empleado_actual),
             service: RemisionService = Depends(get_remision_service)):
    return service.rechazar(id_remision, datos.motivo, id_empleado)


@router.post("/{id_remision}/ficha-tecnica", response_model=RemisionRespuesta,
             summary="Subir foto o PDF de la ficha técnica (máx. 5 MB)")
def subir_ficha(id_remision: str,
                archivo: UploadFile = File(...),
                usar_nombre_archivo: bool = Form(False,
                                                 description="Usar el nombre del archivo como nombre de la ficha"),
                service: RemisionService = Depends(get_remision_service)):
    contenido = archivo.file.read()  # endpoint normal (no async): la BD es síncrona
    return service.subir_ficha(id_remision, archivo.filename, contenido, usar_nombre_archivo)


@router.delete("/{id_remision}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar remisión Pendiente o Rechazada")
def eliminar(id_remision: str, service: RemisionService = Depends(get_remision_service)):
    service.eliminar(id_remision)
