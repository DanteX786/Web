from abc import ABC, abstractmethod
from datetime import date

from app.domain.entities.entrega import Entrega, RemisionPorEntregar


class IEntregaRepository(ABC):
    @abstractmethod
    def listar(self, estado: str | None = None, id_remision: str | None = None) -> list[Entrega]: ...

    @abstractmethod
    def obtener(self, id_entrega: str) -> Entrega | None: ...

    @abstractmethod
    def remisiones_por_entregar(self) -> list[RemisionPorEntregar]: ...

    @abstractmethod
    def existe_entrega_de(self, id_remision: str) -> bool: ...

    @abstractmethod
    def crear(self, id_remision: str, cantidad: int, fecha: date | None,
              precio_total: float | None, id_responsable: str) -> str: ...

    @abstractmethod
    def actualizar(self, id_entrega: str, datos: dict) -> None: ...

    @abstractmethod
    def guardar_url(self, id_entrega: str, campo: str, url: str) -> None: ...

    @abstractmethod
    def marcar_pagada(self, id_entrega: str) -> None: ...
