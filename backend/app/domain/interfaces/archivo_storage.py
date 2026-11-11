from abc import ABC, abstractmethod


class IArchivoStorage(ABC):
    """Dónde se guardan los archivos subidos (fichas técnicas, remisiones firmadas,
    comprobantes de pago).

    Hoy se usa una carpeta local (LocalArchivoStorage). Si después se pasa a la nube
    (Cloudinary, S3...), solo se crea otra clase que cumpla esta interfaz y se cambia
    en las dependencias; los servicios y routers no cambian.
    """

    @abstractmethod
    def guardar(self, contenido: bytes, extension: str, carpeta: str, prefijo: str) -> str:
        """Guarda el archivo y devuelve la URL pública (relativa) para la BD."""

    @abstractmethod
    def eliminar(self, url: str | None) -> None:
        """Borra un archivo guardado antes (si existe). No falla si no está."""
