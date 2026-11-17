from abc import ABC, abstractmethod
from datetime import date

from app.domain.entities.seguimiento import Seguimiento


class ISeguimientoRepository(ABC):
    @abstractmethod
    def existe_remision(self, id_remision: str, nit_cliente: str | None = None) -> bool:
        """Si llega nit_cliente, además verifica que la remisión sea de ese cliente."""

    @abstractmethod
    def listar_por_remision(self, id_remision: str) -> list[Seguimiento]: ...

    @abstractmethod
    def listar(self, estado_nuevo: str | None = None, desde: date | None = None,
               hasta: date | None = None, nit_cliente: str | None = None) -> list[Seguimiento]: ...
