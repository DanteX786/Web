from abc import ABC, abstractmethod
from datetime import date

from app.domain.entities.seguimiento import Seguimiento


class ISeguimientoRepository(ABC):
    @abstractmethod
    def existe_remision(self, id_remision: str) -> bool: ...

    @abstractmethod
    def listar_por_remision(self, id_remision: str) -> list[Seguimiento]: ...

    @abstractmethod
    def listar(self, estado_nuevo: str | None = None, desde: date | None = None,
               hasta: date | None = None) -> list[Seguimiento]: ...
