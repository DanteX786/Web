from abc import ABC, abstractmethod

from app.domain.entities.rol import Permiso, Rol


class IRolRepository(ABC):
    @abstractmethod
    def listar(self, estado: str | None = None) -> list[Rol]: ...

    @abstractmethod
    def obtener(self, id_rol: str) -> Rol | None: ...

    @abstractmethod
    def listar_permisos(self) -> list[Permiso]: ...

    @abstractmethod
    def permisos_existen(self, ids_permisos: list[str]) -> bool: ...

    @abstractmethod
    def existe_descripcion(self, descripcion: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def tiene_empleados(self, id_rol: str) -> bool: ...

    @abstractmethod
    def crear(self, datos: dict, ids_permisos: list[str]) -> Rol: ...

    @abstractmethod
    def actualizar(self, id_rol: str, datos: dict, ids_permisos: list[str] | None) -> Rol | None: ...

    @abstractmethod
    def eliminar(self, id_rol: str) -> bool: ...
