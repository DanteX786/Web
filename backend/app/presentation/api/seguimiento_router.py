from datetime import date

from fastapi import APIRouter, Depends

from app.application.seguimiento_service import SeguimientoService
from app.domain.entities.usuario import Usuario
from app.presentation.dependencies.auth_dependencies import get_usuario_actual
from app.presentation.dependencies.produccion_dependencies import get_seguimiento_service
from app.presentation.schemas.seguimiento_schema import SeguimientoRespuesta

router = APIRouter(prefix="/api/seguimiento", tags=["Seguimiento de remisión"])


@router.get("", response_model=list[SeguimientoRespuesta],
            summary="Todos los cambios de estado (el cliente solo ve los de sus remisiones)")
def listar(estado_nuevo: str | None = None,
           desde: date | None = None,
           hasta: date | None = None,
           usuario: Usuario = Depends(get_usuario_actual),
           service: SeguimientoService = Depends(get_seguimiento_service)):
    return service.listar(estado_nuevo, desde, hasta, usuario)


@router.get("/remision/{id_remision}", response_model=list[SeguimientoRespuesta],
            summary="Línea de tiempo de estados de una remisión")
def historial_remision(id_remision: str,
                       usuario: Usuario = Depends(get_usuario_actual),
                       service: SeguimientoService = Depends(get_seguimiento_service)):
    return service.historial_remision(id_remision, usuario)
