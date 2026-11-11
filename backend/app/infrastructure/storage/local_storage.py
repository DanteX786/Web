import uuid
from pathlib import Path

from app.domain.interfaces.archivo_storage import IArchivoStorage

# backend/uploads  (main.py la publica en la URL /uploads)
CARPETA_UPLOADS = Path(__file__).resolve().parents[3] / "uploads"
URL_UPLOADS = "/uploads"


class LocalArchivoStorage(IArchivoStorage):
    """Guarda los archivos en la carpeta backend/uploads del servidor.

    OJO: en servidores gratuitos (Render, Railway...) el disco se borra al reiniciar.
    Para producción conviene cambiar a un servicio en la nube creando otra clase
    que implemente IArchivoStorage.
    """

    def __init__(self, base: Path = CARPETA_UPLOADS, url_base: str = URL_UPLOADS):
        self.base = base
        self.url_base = url_base.rstrip("/")

    def guardar(self, contenido: bytes, extension: str, carpeta: str, prefijo: str) -> str:
        destino = self.base / carpeta
        destino.mkdir(parents=True, exist_ok=True)
        # Nombre único: así no se pisan archivos con el mismo nombre y no se usa
        # el nombre que manda el usuario (evita rutas raras como ../../)
        nombre = f"{prefijo}_{uuid.uuid4().hex[:10]}{extension}"
        (destino / nombre).write_bytes(contenido)
        return f"{self.url_base}/{carpeta}/{nombre}"

    def eliminar(self, url: str | None) -> None:
        if not url or not url.startswith(self.url_base + "/"):
            return
        ruta = (self.base / url[len(self.url_base) + 1:]).resolve()
        # Solo se borra si de verdad está dentro de la carpeta de uploads
        if self.base.resolve() in ruta.parents and ruta.is_file():
            ruta.unlink()
