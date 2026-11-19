from abc import ABC, abstractmethod

from app.domain.entities.produccion import (
    Asignacion, EmpleadoDisponibilidad, FaltantePaso, LineaRemision, MaquinaDisponibilidad, NuevaAsignacion,
    NuevoPaso, PasoProduccion, Produccion, RemisionDisponible, SeguimientoProduccion,
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
    def produccion_de_remision(self, id_remision: str) -> str | None: ...

    @abstractmethod
    def lineas_remision(self, id_produccion: str) -> list[LineaRemision]: ...

    @abstractmethod
    def crear(self, id_remision: str, id_responsable: str) -> str:
        """Crea la producción en estado Por asignar (la remisión pasa a En producción)."""

    @abstractmethod
    def cambiar_estado(self, id_produccion: str, estado: str, id_responsable: str) -> None: ...

    @abstractmethod
    def seguimiento(self, id_produccion: str) -> list[SeguimientoProduccion]: ...

    @abstractmethod
    def pasos(self, id_produccion: str) -> list[PasoProduccion]: ...

    @abstractmethod
    def guardar_pasos(self, id_produccion: str, pasos: list[NuevoPaso]) -> None:
        """Deja exactamente esos pasos: quita los que no vienen, actualiza y agrega."""

    @abstractmethod
    def faltantes(self, id_produccion: str) -> list[FaltantePaso]: ...

    @abstractmethod
    def maquinas(self) -> list[MaquinaDisponibilidad]: ...

    @abstractmethod
    def empleados(self) -> list[EmpleadoDisponibilidad]: ...

    # ----- Tareas (asignaciones) -----
    @abstractmethod
    def listar_asignaciones(self, id_produccion: str | None = None, id_empleado: str | None = None,
                            solo_en_produccion: bool = False) -> list[Asignacion]: ...

    @abstractmethod
    def obtener_asignacion(self, id_detalle: str) -> Asignacion | None: ...

    @abstractmethod
    def crear_asignacion(self, id_produccion: str, datos: NuevaAsignacion) -> str: ...

    @abstractmethod
    def actualizar_asignacion(self, id_detalle: str, datos: NuevaAsignacion) -> None: ...

    @abstractmethod
    def eliminar_asignacion(self, id_detalle: str) -> None: ...
