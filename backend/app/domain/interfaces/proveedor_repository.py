from abc import ABC, abstractmethod

from app.domain.entities.proveedor import Proveedor


class IProveedorRepository(ABC):
    @abstractmethod
    def listar(self, estado: str | None = None) -> list[Proveedor]: ...

    @abstractmethod
    def obtener(self, id_proveedor: str) -> Proveedor | None: ...

    @abstractmethod
    def existe_nit(self, nit: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def tiene_compras(self, id_proveedor: str) -> bool: ...

    @abstractmethod
    def crear(self, datos: dict) -> Proveedor: ...

    @abstractmethod
    def actualizar(self, id_proveedor: str, datos: dict) -> Proveedor | None: ...

    @abstractmethod
    def eliminar(self, id_proveedor: str) -> bool: ...

    