from abc import ABC, abstractmethod

from app.domain.entities.compra import Compra


class ICompraRepository(ABC):
    @abstractmethod
    def listar(self, id_proveedor: str | None = None) -> list[Compra]: ...

    @abstractmethod
    def obtener(self, id_compra: str) -> Compra | None: ...

    @abstractmethod
    def existe_proveedor(self, id_proveedor: str) -> bool: ...

    @abstractmethod
    def insumos_inexistentes(self, ids_insumos: list[str]) -> list[str]: ...

    @abstractmethod
    def crear(self, cabecera: dict, detalles: list[dict]) -> Compra: ...

    @abstractmethod
    def actualizar_cabecera(self, id_compra: str, datos: dict) -> Compra | None: ...

    @abstractmethod
    def agregar_detalle(self, id_compra: str, detalle: dict) -> Compra: ...

    @abstractmethod
    def reemplazar_detalle(self, id_compra: str, id_insumo_actual: str, detalle: dict) -> Compra: ...

    @abstractmethod
    def eliminar_detalle(self, id_compra: str, id_insumo: str) -> Compra: ...

    @abstractmethod
    def eliminar(self, id_compra: str) -> bool: ...
