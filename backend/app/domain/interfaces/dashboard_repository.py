from abc import ABC, abstractmethod
from datetime import date


class IDashboardRepository(ABC):
    """Consultas de solo lectura para el dashboard. Devuelven filas como diccionarios."""

    # ----- Estado actual (no depende del periodo) -----
    @abstractmethod
    def remisiones_pendientes(self) -> list[dict]: ...

    @abstractmethod
    def producciones_en_curso(self) -> list[dict]: ...

    @abstractmethod
    def remisiones_abiertas(self) -> list[dict]: ...

    @abstractmethod
    def entregas_por_cobrar(self) -> list[dict]: ...

    @abstractmethod
    def insumos_stock_bajo(self) -> list[dict]: ...

    # ----- Por rango de fechas -----
    @abstractmethod
    def entregas_por_dia(self, desde: date, hasta: date) -> list[dict]: ...

    @abstractmethod
    def compras_por_dia(self, desde: date, hasta: date) -> list[dict]: ...

    @abstractmethod
    def unidades_por_dia(self, desde: date, hasta: date) -> list[dict]: ...

    @abstractmethod
    def unidades_por_empleado(self, desde: date, hasta: date, limite: int) -> list[dict]: ...

    @abstractmethod
    def cumplimiento_entregas(self, desde: date, hasta: date) -> dict: ...

    @abstractmethod
    def top_clientes(self, desde: date, hasta: date, limite: int) -> list[dict]: ...

    @abstractmethod
    def remisiones_por_estado(self, desde: date, hasta: date) -> list[dict]: ...

    # ----- Historial -----
    @abstractmethod
    def ultimos_movimientos(self, limite: int) -> list[dict]: ...
