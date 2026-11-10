from app.domain.entities.tipo_pieza import TipoPieza
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.tipo_pieza_repository import ITipoPiezaRepository


class TipoPiezaService:
    """Parámetros: tipos de pieza de las prendas (PB-40).

    Reglas de negocio:
    - El nombre no se puede repetir (sin distinguir mayúsculas).
    - No se elimina un tipo de pieza que ya se usó en producción.
    """

    def __init__(self, repo: ITipoPiezaRepository):
        self.repo = repo

    def listar(self, estado: str | None = None) -> list[TipoPieza]:
        return self.repo.listar(estado)

    def obtener(self, id_tipo: str) -> TipoPieza:
        tipo = self.repo.obtener(id_tipo)
        if not tipo:
            raise NotFoundError(f"No existe el tipo de pieza {id_tipo}.")
        return tipo

    def crear(self, datos: dict) -> TipoPieza:
        if self.repo.existe_nombre(datos["nombre"]):
            raise ConflictError(f"Ya existe un tipo de pieza llamado '{datos['nombre']}'.")
        return self.repo.crear(datos)

    def actualizar(self, id_tipo: str, datos: dict) -> TipoPieza:
        self.obtener(id_tipo)  # lanza 404 si no existe
        if "nombre" in datos and self.repo.existe_nombre(datos["nombre"], excluir_id=id_tipo):
            raise ConflictError(f"Ya existe otro tipo de pieza llamado '{datos['nombre']}'.")
        return self.repo.actualizar(id_tipo, datos)

    def cambiar_estado(self, id_tipo: str, estado: str) -> TipoPieza:
        return self.actualizar(id_tipo, {"estado": estado})

    def eliminar(self, id_tipo: str) -> None:
        self.obtener(id_tipo)  # lanza 404 si no existe
        if self.repo.esta_en_uso(id_tipo):
            raise ConflictError(
                "No se puede eliminar el tipo de pieza porque ya se usó en producción. "
                "Puede marcarlo como Inactivo."
            )
        self.repo.eliminar(id_tipo)

        