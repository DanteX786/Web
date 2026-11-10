from abc import ABC, abstractmethod

from app.domain.entities.tipo_maquina import TipoMaquina


class ITipoMaquinaRepository(ABC):
    @abstractmethod
    def listar(self, estado: str | None = None) -> list[TipoMaquina]: ...

    @abstractmethod
    def obtener(self, id_tipo: str) -> TipoMaquina | None: ...

    @abstractmethod
    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def esta_en_uso(self, id_tipo: str) -> bool: ...

    @abstractmethod
    def crear(self, datos: dict) -> TipoMaquina: ...

    @abstractmethod
    def actualizar(self, id_tipo: str, datos: dict) -> TipoMaquina | None: ...

    @abstractmethod
    def eliminar(self, id_tipo: str) -> bool: ...

    