"""Puertos de seguridad y correo: la aplicación depende de estas interfaces,
no de bcrypt, PyJWT o smtplib directamente."""
from abc import ABC, abstractmethod
from typing import Any


class IHasher(ABC):
    @abstractmethod
    def hashear(self, texto: str) -> str: ...

    @abstractmethod
    def verificar(self, texto: str, hash_guardado: str) -> bool: ...


class ITokenService(ABC):
    @abstractmethod
    def crear(self, datos: dict[str, Any], minutos: int) -> str: ...

    @abstractmethod
    def leer(self, token: str) -> dict[str, Any]:
        """Lanza TokenInvalidoError si expiró o fue alterado."""


class IEmailService(ABC):
    @abstractmethod
    def enviar_codigo_recuperacion(self, correo: str, nombre: str, codigo: str, minutos: int) -> None:
        """Envía el correo. Lanza ServicioNoDisponibleError si no se pudo enviar."""

    @abstractmethod
    def enviar_acceso_empleado(self, correo: str, nombre: str, contrasena_temporal: str, es_nuevo: bool) -> None:
        """Envía al empleado su contraseña temporal. Lanza ServicioNoDisponibleError si no se pudo."""


class IVerificadorCorreo(ABC):
    @abstractmethod
    def dominio_recibe_correo(self, correo: str) -> bool:
        """True si el dominio del correo existe y acepta correos (registro MX/A)."""
