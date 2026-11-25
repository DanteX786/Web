from abc import ABC, abstractmethod
from datetime import date, time

from app.domain.entities.asistencia import Asistencia, Marcacion


class IAsistenciaRepository(ABC):
    @abstractmethod
    def hoy(self) -> date:
        """Fecha de hoy en Colombia (la calcula la base de datos)."""

    @abstractmethod
    def abrir_dia(self, fecha: date) -> None:
        """Crea la lista del día con los empleados Activos en 'No presente' (los que falten)."""

    @abstractmethod
    def listar(self, fecha: date) -> list[Asistencia]:
        """Asistencia del día con los tramos (entradas y salidas) de cada empleado."""

    @abstractmethod
    def obtener(self, id_asistencia: str) -> Asistencia | None: ...

    @abstractmethod
    def marcar(self, id_asistencia: str, estado: str, observacion: str | None, id_responsable: str) -> None:
        """Cambia el estado del día (novedades) y la observación."""

    # ----- Horas (tramos entrada -> salida) -----
    @abstractmethod
    def registrar_entrada(self, id_asistencia: str, hora: time | None, id_responsable: str) -> None:
        """hora None = ahora."""

    @abstractmethod
    def tramo_abierto(self, id_asistencia: str) -> Marcacion | None:
        """Tramo del día que todavía no tiene salida."""

    @abstractmethod
    def registrar_salida(self, id_marcacion: str, hora: time | None, tipo_salida: str,
                         motivo: str | None, id_responsable: str) -> None: ...

    @abstractmethod
    def entrada_todos(self, fecha: date, hora: time | None, id_responsable: str) -> int:
        """Registra la entrada de todos los que están 'No presente' ese día. Devuelve cuántos."""

    @abstractmethod
    def obtener_marcacion(self, id_marcacion: str) -> Marcacion | None: ...

    @abstractmethod
    def actualizar_marcacion(self, id_marcacion: str, hora_entrada: time, hora_salida: time | None,
                             tipo_salida: str | None, motivo: str | None, id_responsable: str) -> None: ...

    @abstractmethod
    def eliminar_marcacion(self, id_marcacion: str) -> None: ...

    @abstractmethod
    def sin_salida(self) -> list[Marcacion]:
        """Entradas de días anteriores que quedaron sin salida."""
