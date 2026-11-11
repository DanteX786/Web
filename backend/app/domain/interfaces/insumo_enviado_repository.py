from abc import ABC, abstractmethod

from app.domain.entities.remision import InsumoEnviado


class IInsumoEnviadoRepository(ABC):
    @abstractmethod
    def listar(self, id_remision: str | None = None) -> list[InsumoEnviado]: ...

    @abstractmethod
    def obtener(self, id_insumo_enviado: str) -> InsumoEnviado | None: ...

    @abstractmethod
    def estado_remision(self, id_remision: str) -> str | None: ...

    @abstractmethod
    def usado_en_produccion(self, id_insumo_enviado: str) -> bool: ...

    @abstractmethod
    def crear(self, id_remision: str, datos: dict) -> str: ...

    @abstractmethod
    def actualizar(self, id_insumo_enviado: str, datos: dict) -> None: ...

    @abstractmethod
    def eliminar(self, id_insumo_enviado: str) -> None: ...
