from datetime import date

from fastapi import APIRouter, Depends

from app.application.asistencia_service import AsistenciaService
from app.presentation.dependencies.auth_dependencies import get_id_empleado_actual
from app.presentation.dependencies.produccion_dependencies import get_asistencia_service
from app.presentation.schemas.asistencia_schema import (
    AsistenciaMarcar, AsistenciaRespuesta, EntradaRegistrar, EntradaTodos,
    MarcacionEditar, MarcacionRespuesta, SalidaRegistrar,
)

router = APIRouter(prefix="/api/asistencia", tags=["Producción - Asistencia"])


@router.get("", response_model=list[AsistenciaRespuesta],
            summary="Asistencia de un día (vacío = hoy) con las horas de entrada y salida")
def del_dia(fecha: date | None = None, service: AsistenciaService = Depends(get_asistencia_service)):
    return service.del_dia(fecha)


# OJO: estas rutas van ANTES de /{id_asistencia}
@router.get("/sin-salida", response_model=list[MarcacionRespuesta],
            summary="Entradas de días anteriores que quedaron sin salida (para corregir)")
def sin_salida(service: AsistenciaService = Depends(get_asistencia_service)):
    return service.sin_salida()


@router.post("/entrada-todos", response_model=list[AsistenciaRespuesta],
             summary="Registrar la entrada de todos los que están 'No presente' ese día")
def entrada_todos(datos: EntradaTodos,
                  id_empleado: str = Depends(get_id_empleado_actual),
                  service: AsistenciaService = Depends(get_asistencia_service)):
    return service.entrada_todos(datos.fecha, datos.hora, id_empleado)


@router.put("/marcaciones/{id_marcacion}", response_model=AsistenciaRespuesta,
            summary="Corregir un tramo (hora de entrada, salida, tipo y motivo)")
def editar_marcacion(id_marcacion: str, datos: MarcacionEditar,
                     id_empleado: str = Depends(get_id_empleado_actual),
                     service: AsistenciaService = Depends(get_asistencia_service)):
    return service.editar_marcacion(id_marcacion, datos.hora_entrada, datos.hora_salida,
                                    datos.tipo_salida, datos.motivo, id_empleado)


@router.delete("/marcaciones/{id_marcacion}", response_model=AsistenciaRespuesta,
               summary="Eliminar un tramo mal registrado")
def eliminar_marcacion(id_marcacion: str, service: AsistenciaService = Depends(get_asistencia_service)):
    return service.eliminar_marcacion(id_marcacion)


@router.post("/{id_asistencia}/entrada", response_model=AsistenciaRespuesta,
             summary="Registrar entrada (llega o vuelve al taller)")
def entrada(id_asistencia: str, datos: EntradaRegistrar,
            id_empleado: str = Depends(get_id_empleado_actual),
            service: AsistenciaService = Depends(get_asistencia_service)):
    return service.entrada(id_asistencia, datos.hora, id_empleado)


@router.post("/{id_asistencia}/salida", response_model=AsistenciaRespuesta,
             summary="Registrar salida (fin de jornada o permiso con motivo)")
def salida(id_asistencia: str, datos: SalidaRegistrar,
           id_empleado: str = Depends(get_id_empleado_actual),
           service: AsistenciaService = Depends(get_asistencia_service)):
    return service.salida(id_asistencia, datos.hora, datos.tipo_salida, datos.motivo, id_empleado)


@router.patch("/{id_asistencia}", response_model=AsistenciaRespuesta,
              summary="Novedad del día completo (Permiso / Incapacidad / Vacaciones / No presente) y observación")
def marcar(id_asistencia: str, datos: AsistenciaMarcar,
           id_empleado: str = Depends(get_id_empleado_actual),
           service: AsistenciaService = Depends(get_asistencia_service)):
    return service.marcar(id_asistencia, datos.estado, datos.observacion, id_empleado)
