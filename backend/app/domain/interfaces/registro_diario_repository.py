from abc import ABC, abstractmethod
from datetime import date

from app.domain.entities.registro_diario import RegistroDiario


class IRegistroDiarioRepository(ABC):
    @abstractmethod
    def listar(self, id_empleado: str | None = None, id_produccion: str | None = None,
               desde: date | None = None, hasta: date | None = None) -> list[RegistroDiario]: ...

    @abstractmethod
    def obtener(self, id_registro: str) -> RegistroDiario | None: ...

    @abstractmethod
    def crear(self, id_detalle_de_produccion: str, cantidad: int) -> str: ...

    @abstractmethod
    def eliminar(self, id_registro: str) -> None: ...

    @abstractmethod
    def empleado_de_asignacion(self, id_detalle_de_produccion: str) -> str | None: ...

    @abstractmethod
    def es_administrador(self, id_empleado: str) -> bool: ...
