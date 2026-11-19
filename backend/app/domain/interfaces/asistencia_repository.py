from abc import ABC, abstractmethod
from datetime import date

from app.domain.entities.asistencia import Asistencia


class IAsistenciaRepository(ABC):
    @abstractmethod
    def hoy(self) -> date:
        """Fecha de hoy en Colombia (la calcula la base de datos)."""

    @abstractmethod
    def abrir_dia(self, fecha: date) -> None:
        """Crea la lista del día con los empleados Activos en 'No presente' (los que falten)."""

    @abstractmethod
    def listar(self, fecha: date) -> list[Asistencia]: ...

    @abstractmethod
    def obtener(self, id_asistencia: str) -> Asistencia | None: ...

    @abstractmethod
    def marcar(self, id_asistencia: str, estado: str, observacion: str | None, id_responsable: str) -> None: ...

    @abstractmethod
    def marcar_todos(self, fecha: date, estado: str, id_responsable: str) -> None: ...
