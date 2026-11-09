from abc import ABC, abstractmethod
from datetime import date

from app.domain.entities.produccion import (
    Asignacion, LineaRemision, NuevaAsignacion, Produccion, RemisionDisponible,
)


class IProduccionRepository(ABC):
    # ----- Producción -----
    @abstractmethod
    def listar(self, estado: str | None = None) -> list[Produccion]: ...

    @abstractmethod
    def obtener(self, id_produccion: str) -> Produccion | None: ...

    @abstractmethod
    def remisiones_disponibles(self) -> list[RemisionDisponible]: ...

    @abstractmethod
    def lineas_remision(self, id_produccion: str) -> list[LineaRemision]: ...

    @abstractmethod
    def crear(self, id_remision: str, fecha_entrega: date | None, id_responsable: str) -> str: ...

    @abstractmethod
    def finalizar(self, id_produccion: str, id_responsable: str) -> None: ...

    # ----- Asignaciones -----
    @abstractmethod
    def listar_asignaciones(self, id_produccion: str | None = None, id_empleado: str | None = None,
                            solo_en_proceso: bool = False) -> list[Asignacion]: ...

    @abstractmethod
    def obtener_asignacion(self, id_detalle: str) -> Asignacion | None: ...

    @abstractmethod
    def crear_asignacion(self, id_produccion: str, datos: NuevaAsignacion) -> str: ...

    @abstractmethod
    def actualizar_asignacion(self, id_detalle: str, datos: NuevaAsignacion) -> None: ...

    @abstractmethod
    def eliminar_asignacion(self, id_detalle: str) -> None: ...
