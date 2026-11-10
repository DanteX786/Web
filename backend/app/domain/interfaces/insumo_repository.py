from abc import ABC, abstractmethod

from app.domain.entities.insumo import Insumo, TipoInsumo


class IInsumoRepository(ABC):
    @abstractmethod
    def listar(self, id_tipo: str | None = None) -> list[Insumo]: ...

    @abstractmethod
    def obtener(self, id_insumo: str) -> Insumo | None: ...

    @abstractmethod
    def listar_tipos(self) -> list[TipoInsumo]: ...

    @abstractmethod
    def existe_tipo(self, id_tipo: str) -> bool: ...

    @abstractmethod
    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def esta_en_uso(self, id_insumo: str) -> bool: ...

    @abstractmethod
    def crear(self, datos: dict) -> Insumo: ...

    @abstractmethod
    def actualizar(self, id_insumo: str, datos: dict) -> Insumo | None: ...

    @abstractmethod
    def eliminar(self, id_insumo: str) -> bool: ...
