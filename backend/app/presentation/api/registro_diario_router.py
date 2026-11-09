from datetime import date

from fastapi import APIRouter, Depends, status

from app.application.registro_diario_service import RegistroDiarioService
from app.presentation.dependencies.auth_dependencies import get_id_empleado_actual
from app.presentation.dependencies.produccion_dependencies import get_registro_diario_service
from app.presentation.schemas.registro_diario_schema import RegistroDiarioCrear, RegistroDiarioRespuesta

router = APIRouter(prefix="/api/registros-diarios", tags=["Registro diario"])


@router.get("", response_model=list[RegistroDiarioRespuesta],
            summary="Historial de reportes diarios (HU_57)")
def listar(id_empleado: str | None = None,
           id_produccion: str | None = None,
           desde: date | None = None,
           hasta: date | None = None,
           service: RegistroDiarioService = Depends(get_registro_diario_service)):
    return service.listar(id_empleado, id_produccion, desde, hasta)


@router.get("/mios", response_model=list[RegistroDiarioRespuesta], summary="Mis reportes")
def mis_registros(id_empleado: str = Depends(get_id_empleado_actual),
                  service: RegistroDiarioService = Depends(get_registro_diario_service)):
    return service.listar(id_empleado=id_empleado)


@router.get("/{id_registro}", response_model=RegistroDiarioRespuesta)
def obtener(id_registro: str, service: RegistroDiarioService = Depends(get_registro_diario_service)):
    return service.obtener(id_registro)


@router.post("", response_model=RegistroDiarioRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registrar avance del día (HU_56); fecha y hora automáticas")
def registrar(datos: RegistroDiarioCrear,
              id_empleado: str = Depends(get_id_empleado_actual),
              service: RegistroDiarioService = Depends(get_registro_diario_service)):
    return service.registrar(datos.id_detalle_de_produccion, datos.cantidad, id_empleado)


@router.delete("/{id_registro}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Eliminar un reporte (corrección)")
def eliminar(id_registro: str,
             id_empleado: str = Depends(get_id_empleado_actual),
             service: RegistroDiarioService = Depends(get_registro_diario_service)):
    service.eliminar(id_registro, id_empleado)
