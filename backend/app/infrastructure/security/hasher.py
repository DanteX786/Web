import bcrypt

from app.domain.interfaces.seguridad import IHasher


class BcryptHasher(IHasher):
    """Hash de contraseñas y códigos con bcrypt.

    Compatible con los hashes $2a$ que generó el script SQL (pgcrypto).
    bcrypt solo usa los primeros 72 bytes: por eso la API limita la contraseña a 64 caracteres.
    """

    def __init__(self, rondas: int = 12):
        self.rondas = rondas

    def hashear(self, texto: str) -> str:
        return bcrypt.hashpw(texto.encode("utf-8"), bcrypt.gensalt(self.rondas)).decode("utf-8")

    def verificar(self, texto: str, hash_guardado: str | None) -> bool:
        if not hash_guardado:
            return False  # cliente creado por el taller que aún no activa su cuenta
        try:
            return bcrypt.checkpw(texto.encode("utf-8"), hash_guardado.encode("utf-8"))
        except ValueError:
            # Hash mal formado o texto demasiado largo
            return False
