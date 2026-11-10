from abc import ABC, abstractmethod

from app.domain.entities.cliente import CategoriaCliente, Cliente


class IClienteRepository(ABC):
    @abstractmethod
    def listar(self, estado: str | None = None) -> list[Cliente]: ...

    @abstractmethod
    def obtener(self, nit: str) -> Cliente | None: ...

    @abstractmethod
    def listar_categorias(self) -> list[CategoriaCliente]: ...

    @abstractmethod
    def existe_categoria_activa(self, id_categoria: str) -> bool: ...

    @abstractmethod
    def existe_correo(self, correo: str, excluir_nit: str | None = None) -> bool: ...

    @abstractmethod
    def esta_en_uso(self, nit: str) -> bool: ...

    @abstractmethod
    def crear(self, datos: dict) -> Cliente: ...

    @abstractmethod
    def actualizar(self, nit: str, datos: dict) -> Cliente | None: ...

    @abstractmethod
    def eliminar(self, nit: str) -> bool: ...
