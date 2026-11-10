from app.domain.entities.tipo_maquina import TipoMaquina
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.tipo_maquina_repository import ITipoMaquinaRepository


class TipoMaquinaService:
    """Parámetros: tipos de máquina del taller (PB-39).

    Reglas de negocio:
    - El nombre no se puede repetir (sin distinguir mayúsculas).
    - No se elimina un tipo de máquina que ya se usó en producción; en ese caso se debe inactivar.
    """

    def __init__(self, repo: ITipoMaquinaRepository):
        self.repo = repo

    def listar(self, estado: str | None = None) -> list[TipoMaquina]:
        return self.repo.listar(estado)

    def obtener(self, id_tipo: str) -> TipoMaquina:
        tipo = self.repo.obtener(id_tipo)
        if not tipo:
            raise NotFoundError(f"No existe el tipo de máquina {id_tipo}.")
        return tipo

    def crear(self, datos: dict) -> TipoMaquina:
        if self.repo.existe_nombre(datos["nombre"]):
            raise ConflictError(f"Ya existe un tipo de máquina llamado '{datos['nombre']}'.")
        return self.repo.crear(datos)

    def actualizar(self, id_tipo: str, datos: dict) -> TipoMaquina:
        self.obtener(id_tipo)  # lanza 404 si no existe
        if "nombre" in datos and self.repo.existe_nombre(datos["nombre"], excluir_id=id_tipo):
            raise ConflictError(f"Ya existe otro tipo de máquina llamado '{datos['nombre']}'.")
        return self.repo.actualizar(id_tipo, datos)

    def cambiar_estado(self, id_tipo: str, estado: str) -> TipoMaquina:
        return self.actualizar(id_tipo, {"estado": estado})

    def eliminar(self, id_tipo: str) -> None:
        self.obtener(id_tipo)  # lanza 404 si no existe
        if self.repo.esta_en_uso(id_tipo):
            raise ConflictError(
                "No se puede eliminar el tipo de máquina porque ya se usó en producción. "
                "Puede marcarlo como Inactivo."
            )
        self.repo.eliminar(id_tipo)

        