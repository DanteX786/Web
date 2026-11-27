from app.domain.entities.usuario_maestro import UsuarioMaestro
from app.domain.interfaces.usuario_repository import IUsuarioRepository


class UsuarioService:
    """Módulo Usuarios: todos los empleados y clientes en un solo listado (tabla maestra).

    Aquí no se crea ni se edita nada: los empleados se gestionan en Empleados y los clientes
    en Clientes, y la base de datos los copia sola a tb_usuarios.
    """

    def __init__(self, repo: IUsuarioRepository):
        self.repo = repo

    def listar(self, tipo: str | None = None, estado_cuenta: str | None = None) -> list[UsuarioMaestro]:
        return self.repo.listar(tipo, estado_cuenta)
