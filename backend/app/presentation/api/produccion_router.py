from dataclasses import asdict

from fastapi import APIRouter, Depends, Query, status

from app.application.produccion_service import ProduccionService
from app.domain.entities.produccion import NuevaAsignacion
from app.presentation.dependencies.auth_dependencies import get_id_empleado_actual
from app.presentation.dependencies.produccion_dependencies import get_produccion_service
from app.presentation.schemas.produccion_schema import (
    AsignacionCrear, AsignacionRespuesta, LineaRemisionRespuesta, ProduccionCrear,
    ProduccionDetalleRespuesta, ProduccionRespuesta, RemisionDisponibleRespuesta,
)

router = APIRouter(prefix="/api/producciones", tags=["Producción"])


@router.get("", response_model=list[ProduccionRespuesta], summary="Listar producciones con su avance (HU_52)")
def listar(estado: str | None = Query(default=None, description="En proceso | Finalizada"),
           service: ProduccionService = Depends(get_produccion_service)):
    return service.listar(estado)


# OJO: esta ruta va ANTES de /{id_produccion} para que no la confunda con un id
@router.get("/remisiones-disponibles", response_model=list[RemisionDisponibleRespuesta],
            summary="Remisiones Aprobadas sin producción (para el formulario de crear)")
def remisiones_disponibles(service: ProduccionService = Depends(get_produccion_service)):
    return service.remisiones_disponibles()


@router.get("/{id_produccion}", response_model=ProduccionDetalleRespuesta,
            summary="Detalle de la producción con sus asignaciones")
def obtener(id_produccion: str, service: ProduccionService = Depends(get_produccion_service)):
    produccion = service.obtener(id_produccion)
    asignaciones = service.listar_asignaciones(id_produccion=id_produccion)
    return {**asdict(produccion), "asignaciones": [asdict(a) for a in asignaciones]}


@router.post("", response_model=ProduccionRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Crear producción para una remisión Aprobada (HU_51)")
def crear(datos: ProduccionCrear,
          id_empleado: str = Depends(get_id_empleado_actual),
          service: ProduccionService = Depends(get_produccion_service)):
    return service.crear(datos.id_remision, datos.fecha_entrega, id_empleado)


@router.patch("/{id_produccion}/finalizar", response_model=ProduccionRespuesta,
              summary="Finalizar la producción (HU_54); la remisión pasa a Terminada")
def finalizar(id_produccion: str,
              id_empleado: str = Depends(get_id_empleado_actual),
              service: ProduccionService = Depends(get_produccion_service)):
    return service.finalizar(id_produccion, id_empleado)


@router.get("/{id_produccion}/lineas-remision", response_model=list[LineaRemisionRespuesta],
            summary="Prendas y tallas de la remisión (para el formulario de asignar)")
def lineas_remision(id_produccion: str, service: ProduccionService = Depends(get_produccion_service)):
    return service.lineas_remision(id_produccion)


@router.get("/{id_produccion}/asignaciones", response_model=list[AsignacionRespuesta])
def listar_asignaciones_produccion(id_produccion: str,
                                   service: ProduccionService = Depends(get_produccion_service)):
    service.obtener(id_produccion)
    return service.listar_asignaciones(id_produccion=id_produccion)


@router.post("/{id_produccion}/asignaciones", response_model=AsignacionRespuesta,
             status_code=status.HTTP_201_CREATED,
             summary="Asignar empleado, pieza, máquina e insumo (descuenta inventario)")
def crear_asignacion(id_produccion: str, datos: AsignacionCrear,
                     service: ProduccionService = Depends(get_produccion_service)):
    return service.crear_asignacion(id_produccion, NuevaAsignacion(**datos.model_dump()))


# ---------------------------------------------------------------------------
asignaciones_router = APIRouter(prefix="/api/asignaciones", tags=["Producción - Asignaciones"])


@asignaciones_router.get("", response_model=list[AsignacionRespuesta],
                         summary="Listar asignaciones (filtrar por empleado - HU_53)")
def listar_asignaciones(id_empleado: str | None = None,
                        solo_en_proceso: bool = False,
                        service: ProduccionService = Depends(get_produccion_service)):
    return service.listar_asignaciones(id_empleado=id_empleado, solo_en_proceso=solo_en_proceso)


@asignaciones_router.get("/mias", response_model=list[AsignacionRespuesta],
                         summary="Mis asignaciones de la producción en curso (HU_55)")
def mis_asignaciones(id_empleado: str = Depends(get_id_empleado_actual),
                     service: ProduccionService = Depends(get_produccion_service)):
    return service.listar_asignaciones(id_empleado=id_empleado, solo_en_proceso=True)


@asignaciones_router.get("/{id_detalle}", response_model=AsignacionRespuesta)
def obtener_asignacion(id_detalle: str, service: ProduccionService = Depends(get_produccion_service)):
    return service.obtener_asignacion(id_detalle)


@asignaciones_router.put("/{id_detalle}", response_model=AsignacionRespuesta)
def actualizar_asignacion(id_detalle: str, datos: AsignacionCrear,
                          service: ProduccionService = Depends(get_produccion_service)):
    return service.actualizar_asignacion(id_detalle, NuevaAsignacion(**datos.model_dump()))


@asignaciones_router.delete("/{id_detalle}", status_code=status.HTTP_204_NO_CONTENT,
                            summary="Eliminar asignación (devuelve el insumo al inventario)")
def eliminar_asignacion(id_detalle: str, service: ProduccionService = Depends(get_produccion_service)):
    service.eliminar_asignacion(id_detalle)
