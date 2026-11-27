from abc import ABC, abstractmethod

from app.domain.entities.usuario_maestro import UsuarioMaestro


class IUsuarioRepository(ABC):
    @abstractmethod
    def listar(self, tipo: str | None = None, estado_cuenta: str | None = None) -> list[UsuarioMaestro]: ...
