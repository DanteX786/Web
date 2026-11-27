from fastapi import APIRouter, Depends

from app.application.usuario_service import UsuarioService
from app.presentation.dependencies.usuarios_dependencies import get_usuario_service
from app.presentation.schemas.usuario_schema import EstadoCuenta, TipoUsuario, UsuarioMaestroRespuesta

router = APIRouter(prefix="/api/usuarios", tags=["Usuarios"])


@router.get("", response_model=list[UsuarioMaestroRespuesta],
            summary="Todos los usuarios (empleados y clientes) con su rol y estado de cuenta")
def listar(tipo: TipoUsuario | None = None, estado_cuenta: EstadoCuenta | None = None,
           service: UsuarioService = Depends(get_usuario_service)):
    return service.listar(tipo, estado_cuenta)
