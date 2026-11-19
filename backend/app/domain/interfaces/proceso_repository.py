from abc import ABC, abstractmethod

from app.domain.entities.proceso import Proceso


class IProcesoRepository(ABC):
    @abstractmethod
    def listar(self, estado: str | None = None) -> list[Proceso]: ...

    @abstractmethod
    def obtener(self, id_proceso: str) -> Proceso | None: ...

    @abstractmethod
    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def esta_en_uso(self, id_proceso: str) -> bool: ...

    @abstractmethod
    def crear(self, datos: dict) -> Proceso: ...

    @abstractmethod
    def actualizar(self, id_proceso: str, datos: dict) -> Proceso | None: ...

    @abstractmethod
    def eliminar(self, id_proceso: str) -> bool: ...
