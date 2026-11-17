from abc import ABC, abstractmethod
from datetime import datetime

from app.domain.entities.usuario import CodigoRecuperacion, NuevoCliente, PerfilCliente, TipoUsuario, Usuario


class IAuthRepository(ABC):
    # ----- Usuarios -----
    @abstractmethod
    def buscar_por_correo(self, correo: str) -> Usuario | None: ...

    @abstractmethod
    def buscar_por_id(self, tipo: TipoUsuario, id_usuario: str) -> Usuario | None: ...

    @abstractmethod
    def existe_correo(self, correo: str, excluir_id: str | None = None) -> bool: ...

    @abstractmethod
    def actualizar_perfil_cliente(self, nit: str, perfil: PerfilCliente) -> Usuario: ...

    @abstractmethod
    def existe_documento(self, numero_documento: str) -> bool: ...

    @abstractmethod
    def crear_cliente(self, cliente: NuevoCliente) -> Usuario: ...

    @abstractmethod
    def cambiar_contrasena(self, tipo: TipoUsuario, id_usuario: str, contrasena_hash: str) -> int:
        """Guarda el nuevo hash e incrementa version_token. Devuelve la nueva versión."""

    @abstractmethod
    def incrementar_version_token(self, tipo: TipoUsuario, id_usuario: str) -> int: ...

    # ----- Códigos de recuperación -----
    @abstractmethod
    def guardar_codigo(self, correo: str, tipo: TipoUsuario, codigo_hash: str, expira: datetime) -> None:
        """Invalida los códigos anteriores del correo y guarda el nuevo."""

    @abstractmethod
    def ultimo_codigo(self, correo: str) -> CodigoRecuperacion | None: ...

    @abstractmethod
    def sumar_intento(self, id_codigo: str) -> None: ...

    @abstractmethod
    def marcar_codigos_usados(self, correo: str) -> None: ...
