from abc import ABC, abstractmethod

from app.domain.entities.remision import Remision


class IRemisionRepository(ABC):
    @abstractmethod
    def listar(self, estado: str | None = None, nit_cliente: str | None = None) -> list[Remision]: ...

    @abstractmethod
    def obtener(self, id_remision: str) -> Remision | None: ...

    @abstractmethod
    def cliente_activo(self, nit: str) -> bool: ...

    @abstractmethod
    def tiene_produccion(self, id_remision: str) -> bool: ...

    @abstractmethod
    def crear(self, cabecera: dict, detalles: list[dict], insumos: list[dict],
              id_responsable: str | None) -> str: ...

    @abstractmethod
    def actualizar(self, id_remision: str, cabecera: dict, detalles: list[dict] | None,
                   insumos: list[dict] | None) -> None: ...

    @abstractmethod
    def cambiar_estado(self, id_remision: str, estado: str, id_responsable: str,
                       observaciones: str | None = None) -> None: ...

    @abstractmethod
    def guardar_ficha_url(self, id_remision: str, url: str, nombre: str | None) -> None: ...

    @abstractmethod
    def eliminar(self, id_remision: str) -> None: ...
