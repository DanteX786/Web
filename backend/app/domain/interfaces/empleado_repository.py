from abc import ABC, abstractmethod

from app.domain.entities.empleado import Empleado


class IEmpleadoRepository(ABC):
    @abstractmethod
    def listar(self, estado: str | None = None) -> list[Empleado]: ...

    @abstractmethod
    def obtener(self, id_empleado: str) -> Empleado | None: ...

    @abstractmethod
    def existe_identificacion(self, identificacion: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def existe_correo(self, correo: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def existe_rol(self, id_rol: str) -> bool: ...

    @abstractmethod
    def tiene_produccion(self, id_empleado: str) -> bool: ...

    @abstractmethod
    def crear(self, datos: dict) -> Empleado: ...

    @abstractmethod
    def actualizar(self, id_empleado: str, datos: dict) -> Empleado | None: ...

    @abstractmethod
    def eliminar(self, id_empleado: str) -> bool: ...
