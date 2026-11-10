from abc import ABC, abstractmethod

from app.domain.entities.tipo_insumo import TipoInsumo


class ITipoInsumoRepository(ABC):
    @abstractmethod
    def listar(self) -> list[TipoInsumo]: ...

    @abstractmethod
    def obtener(self, id_tipo: str) -> TipoInsumo | None: ...

    @abstractmethod
    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def esta_en_uso(self, id_tipo: str) -> bool: ...

    @abstractmethod
    def crear(self, datos: dict) -> TipoInsumo: ...

    @abstractmethod
    def actualizar(self, id_tipo: str, datos: dict) -> TipoInsumo | None: ...

    @abstractmethod
    def eliminar(self, id_tipo: str) -> bool: ...
