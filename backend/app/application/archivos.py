"""Reglas para los archivos que se suben (fichas técnicas, remisiones firmadas, comprobantes)."""
from pathlib import PurePath

from app.domain.exceptions.errors import ConflictError

EXTENSIONES_PERMITIDAS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
TAMANO_MAXIMO_MB = 5

# Primeros bytes de cada tipo: así no basta con renombrar un .exe a .pdf
_FIRMAS = {
    ".pdf": [b"%PDF"],
    ".png": [b"\x89PNG"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".webp": [b"RIFF"],
}


def validar_archivo(nombre: str | None, contenido: bytes) -> str:
    """Valida el archivo y devuelve su extensión en minúscula (ej. '.pdf')."""
    extension = PurePath(nombre or "").suffix.lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise ConflictError("Formato no permitido. Suba un PDF o una imagen (JPG, PNG o WEBP).")
    if not contenido:
        raise ConflictError("El archivo está vacío.")
    if len(contenido) > TAMANO_MAXIMO_MB * 1024 * 1024:
        raise ConflictError(f"El archivo supera el máximo de {TAMANO_MAXIMO_MB} MB.")
    if not any(contenido.startswith(firma) for firma in _FIRMAS[extension]):
        raise ConflictError("El contenido del archivo no corresponde a su extensión.")
    return extension
