from abc import ABC, abstractmethod

from app.domain.entities.tipo_pieza import TipoPieza


class ITipoPiezaRepository(ABC):
    @abstractmethod
    def listar(self, estado: str | None = None) -> list[TipoPieza]: ...

    @abstractmethod
    def obtener(self, id_tipo: str) -> TipoPieza | None: ...

    @abstractmethod
    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def esta_en_uso(self, id_tipo: str) -> bool: ...

    @abstractmethod
    def crear(self, datos: dict) -> TipoPieza: ...

    @abstractmethod
    def actualizar(self, id_tipo: str, datos: dict) -> TipoPieza | None: ...

    @abstractmethod
    def eliminar(self, id_tipo: str) -> bool: ...

    