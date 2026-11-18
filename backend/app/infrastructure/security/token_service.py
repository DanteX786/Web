from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from app.domain.exceptions.errors import TokenInvalidoError
from app.domain.interfaces.seguridad import ITokenService


class JwtTokenService(ITokenService):
    def __init__(self, secreto: str, algoritmo: str = "HS256"):
        self.secreto = secreto
        self.algoritmo = algoritmo

    def crear(self, datos: dict[str, Any], minutos: int) -> str:
        ahora = datetime.now(timezone.utc)
        contenido = {**datos, "iat": ahora, "exp": ahora + timedelta(minutes=minutos)}
        return jwt.encode(contenido, self.secreto, algorithm=self.algoritmo)

    def leer(self, token: str) -> dict[str, Any]:
        try:
            return jwt.decode(token, self.secreto, algorithms=[self.algoritmo])
        except jwt.ExpiredSignatureError:
            raise TokenInvalidoError("La sesión expiró. Inicie sesión de nuevo.")
        except jwt.PyJWTError:
            raise TokenInvalidoError("Sesión inválida. Inicie sesión de nuevo.")
