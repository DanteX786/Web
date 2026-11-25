from dataclasses import asdict

from fastapi import APIRouter, Depends, Query, status

from app.application.produccion_service import ProduccionService
from app.domain.entities.produccion import (
    NuevaAsignacion, NuevoInsumoReproceso, NuevoPaso, NuevoReproceso,
)
from app.presentation.dependencies.auth_dependencies import get_id_empleado_actual
from app.presentation.dependencies.produccion_dependencies import get_produccion_service
from app.presentation.schemas.produccion_schema import (
    AsignacionCrear, AsignacionRespuesta, EmpleadoDisponibilidadRespuesta, EnviarAProducir,
    GuardarPasos, PasoRespuesta, LineaRemisionRespuesta,
    MaquinaDisponibilidadRespuesta, PiezaDefectuosaRespuesta, ProduccionDetalleRespuesta, ProduccionRespuesta,
    RemisionDisponibleRespuesta, ReprocesoCrear, ReprocesoRespuesta, SeguimientoProduccionRespuesta,
)

router = APIRouter(prefix="/api/producciones", tags=["Producción"])


@router.get("", response_model=list[ProduccionRespuesta], summary="Listar producciones con su avance")
def listar(estado: str | None = Query(default=None, description="Por asignar | En producción | Finalizada"),
           service: ProduccionService = Depends(get_produccion_service)):
    return service.listar(estado)


# OJO: estas rutas van ANTES de /{id_produccion} para que no las confunda con un id
@router.get("/remisiones-disponibles", response_model=list[RemisionDisponibleRespuesta],
            summary="Remisiones Aprobadas que aún no se envían a producir")
def remisiones_disponibles(service: ProduccionService = Depends(get_produccion_service)):
    return service.remisiones_disponibles()


@router.get("/maquinas", response_model=list[MaquinaDisponibilidadRespuesta],
            summary="Máquinas activas con su disponibilidad (las ocupadas no se pueden asignar)")
def maquinas(service: ProduccionService = Depends(get_produccion_service)):
    return service.maquinas()


@router.get("/empleados", response_model=list[EmpleadoDisponibilidadRespuesta],
            summary="Empleados activos con su disponibilidad (los ocupados no reciben otra tarea)")
def empleados(service: ProduccionService = Depends(get_produccion_service)):
    return service.empleados()


@router.post("", response_model=ProduccionRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Enviar a producir: crea la producción 'Por asignar' de una remisión Aprobada")
def enviar_a_producir(datos: EnviarAProducir,
                      id_empleado: str = Depends(get_id_empleado_actual),
                      service: ProduccionService = Depends(get_produccion_service)):
    return service.enviar_a_producir(datos.id_remision, id_empleado)


@router.get("/{id_produccion}", response_model=ProduccionDetalleRespuesta,
            summary="Detalle: tallas de la remisión y sus tareas")
def obtener(id_produccion: str, service: ProduccionService = Depends(get_produccion_service)):
    produccion = service.obtener(id_produccion)
    lineas = service.lineas_remision(id_produccion)
    asignaciones = service.listar_asignaciones(id_produccion=id_produccion)
    return {**asdict(produccion),
            "pasos": [asdict(p) for p in service.pasos(id_produccion)],
            "faltantes": [asdict(f) for f in service.faltantes(id_produccion)],
            "lineas": [asdict(linea) for linea in lineas],
            "asignaciones": [asdict(a) for a in asignaciones],
            "defectuosas": [asdict(d) for d in service.defectuosas(id_produccion=id_produccion)],
            "reprocesos": [asdict(r) for r in service.reprocesos(id_produccion)]}


@router.post("/{id_produccion}/reprocesos", response_model=list[ReprocesoRespuesta],
             status_code=status.HTTP_201_CREATED,
             summary="Reprocesar piezas defectuosas (tallas, procesos e insumos opcionales). Uno a la vez")
def crear_reproceso(id_produccion: str, datos: ReprocesoCrear,
                    id_empleado: str = Depends(get_id_empleado_actual),
                    service: ProduccionService = Depends(get_produccion_service)):
    tallas: dict[str, int] = {}
    for t in datos.tallas:
        tallas[t.id_detalle_de_remision] = tallas.get(t.id_detalle_de_remision, 0) + t.cantidad
    nuevo = NuevoReproceso(
        tallas=tallas,
        pasos=[NuevoPaso(id_proceso=p.id_proceso, descripcion=p.descripcion, veces=p.veces) for p in datos.pasos],
        insumos=[NuevoInsumoReproceso(nombre=i.nombre, cantidad=i.cantidad, unidad=i.unidad) for i in datos.insumos],
        observacion=datos.observacion,
    )
    return service.crear_reproceso(id_produccion, nuevo, id_empleado)


@router.patch("/reprocesos/{id_reproceso}/cancelar", response_model=list[ReprocesoRespuesta],
              summary="Cancelar un reproceso abierto por error (solo si no tiene tareas)")
def cancelar_reproceso(id_reproceso: str, service: ProduccionService = Depends(get_produccion_service)):
    return service.cancelar_reproceso(id_reproceso)


@router.get("/{id_produccion}/pasos", response_model=list[PasoRespuesta],
            summary="Pasos (procesos) que lleva la prenda de esta producción")
def pasos(id_produccion: str, service: ProduccionService = Depends(get_produccion_service)):
    return service.pasos(id_produccion)


@router.put("/{id_produccion}/pasos", response_model=list[PasoRespuesta],
            summary="Guardar los pasos de la producción (viendo la ficha técnica); un proceso puede repetirse con otra descripción")
def guardar_pasos(id_produccion: str, datos: GuardarPasos,
                  service: ProduccionService = Depends(get_produccion_service)):
    return service.guardar_pasos(id_produccion, [NuevoPaso(**p.model_dump()) for p in datos.pasos])


@router.patch("/{id_produccion}/iniciar", response_model=ProduccionRespuesta,
              summary="Iniciar: Por asignar -> En producción (requiere al menos una tarea)")
def iniciar(id_produccion: str,
            id_empleado: str = Depends(get_id_empleado_actual),
            service: ProduccionService = Depends(get_produccion_service)):
    return service.iniciar(id_produccion, id_empleado)


@router.patch("/{id_produccion}/finalizar", response_model=ProduccionRespuesta,
              summary="Finalizar: En producción -> Finalizada; la remisión pasa a Terminada")
def finalizar(id_produccion: str,
              id_empleado: str = Depends(get_id_empleado_actual),
              service: ProduccionService = Depends(get_produccion_service)):
    return service.finalizar(id_produccion, id_empleado)


@router.get("/{id_produccion}/seguimiento", response_model=list[SeguimientoProduccionRespuesta],
            summary="Línea de tiempo de estados de la producción")
def seguimiento(id_produccion: str, service: ProduccionService = Depends(get_produccion_service)):
    return service.seguimiento(id_produccion)


@router.get("/{id_produccion}/lineas-remision", response_model=list[LineaRemisionRespuesta],
            summary="Prendas y tallas de la remisión con lo ya asignado")
def lineas_remision(id_produccion: str, service: ProduccionService = Depends(get_produccion_service)):
    return service.lineas_remision(id_produccion)


@router.get("/{id_produccion}/asignaciones", response_model=list[AsignacionRespuesta])
def listar_asignaciones_produccion(id_produccion: str,
                                   service: ProduccionService = Depends(get_produccion_service)):
    service.obtener(id_produccion)
    return service.listar_asignaciones(id_produccion=id_produccion)


@router.post("/{id_produccion}/asignaciones", response_model=AsignacionRespuesta,
             status_code=status.HTTP_201_CREATED,
             summary="Asignar tarea: proceso, pieza, empleado, máquina libre e insumo (descuenta inventario)")
def crear_asignacion(id_produccion: str, datos: AsignacionCrear,
                     service: ProduccionService = Depends(get_produccion_service)):
    return service.crear_asignacion(id_produccion, NuevaAsignacion(**datos.model_dump()))


# ---------------------------------------------------------------------------
asignaciones_router = APIRouter(prefix="/api/asignaciones", tags=["Producción - Tareas"])


@asignaciones_router.get("", response_model=list[AsignacionRespuesta],
                         summary="Listar tareas (filtrar por empleado)")
def listar_asignaciones(id_empleado: str | None = None,
                        solo_en_produccion: bool = False,
                        service: ProduccionService = Depends(get_produccion_service)):
    return service.listar_asignaciones(id_empleado=id_empleado, solo_en_produccion=solo_en_produccion)


@asignaciones_router.get("/mias", response_model=list[AsignacionRespuesta],
                         summary="Mis tareas de las producciones En producción")
def mis_asignaciones(id_empleado: str = Depends(get_id_empleado_actual),
                     service: ProduccionService = Depends(get_produccion_service)):
    return service.listar_asignaciones(id_empleado=id_empleado, solo_en_produccion=True)


@asignaciones_router.get("/{id_detalle}", response_model=AsignacionRespuesta)
def obtener_asignacion(id_detalle: str, service: ProduccionService = Depends(get_produccion_service)):
    return service.obtener_asignacion(id_detalle)


@asignaciones_router.put("/{id_detalle}", response_model=AsignacionRespuesta)
def actualizar_asignacion(id_detalle: str, datos: AsignacionCrear,
                          service: ProduccionService = Depends(get_produccion_service)):
    return service.actualizar_asignacion(id_detalle, NuevaAsignacion(**datos.model_dump()))


@asignaciones_router.delete("/{id_detalle}", status_code=status.HTTP_204_NO_CONTENT,
                            summary="Eliminar tarea (devuelve el insumo al inventario)")
def eliminar_asignacion(id_detalle: str, service: ProduccionService = Depends(get_produccion_service)):
    service.eliminar_asignacion(id_detalle)


# ---------------------------------------------------------------------------
# Piezas defectuosas: solo lectura. Lo usa Producción y también Remisión de
# entrega (para ver qué piezas salieron defectuosas antes de entregar).
# ---------------------------------------------------------------------------
defectuosas_router = APIRouter(prefix="/api/piezas-defectuosas", tags=["Producción"])


@defectuosas_router.get("", response_model=list[PiezaDefectuosaRespuesta],
                        summary="Piezas defectuosas reportadas (por producción o por remisión)")
def piezas_defectuosas(id_produccion: str | None = None,
                       id_remision: str | None = None,
                       service: ProduccionService = Depends(get_produccion_service)):
    return service.defectuosas(id_produccion, id_remision)
