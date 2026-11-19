from app.domain.entities.proceso import Proceso
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.proceso_repository import IProcesoRepository


class ProcesoService:
    """Parámetros: procesos de confección (tabla maestra tb_procesos).

    Reglas de negocio:
    - El nombre no se puede repetir (sin distinguir mayúsculas).
    - Solo los procesos Activos se pueden asignar en una tarea de producción.
    - No se elimina un proceso que ya se usó en producción; se marca Inactivo.
    """

    def __init__(self, repo: IProcesoRepository):
        self.repo = repo

    def listar(self, estado: str | None = None) -> list[Proceso]:
        return self.repo.listar(estado)

    def obtener(self, id_proceso: str) -> Proceso:
        proceso = self.repo.obtener(id_proceso)
        if not proceso:
            raise NotFoundError(f"No existe el proceso {id_proceso}.")
        return proceso

    def crear(self, datos: dict) -> Proceso:
        if self.repo.existe_nombre(datos["nombre"]):
            raise ConflictError(f"Ya existe un proceso llamado '{datos['nombre']}'.")
        return self.repo.crear(datos)

    def actualizar(self, id_proceso: str, datos: dict) -> Proceso:
        self.obtener(id_proceso)
        if "nombre" in datos and self.repo.existe_nombre(datos["nombre"], excluir_id=id_proceso):
            raise ConflictError(f"Ya existe otro proceso llamado '{datos['nombre']}'.")
        return self.repo.actualizar(id_proceso, datos)

    def cambiar_estado(self, id_proceso: str, estado: str) -> Proceso:
        return self.actualizar(id_proceso, {"estado": estado})

    def eliminar(self, id_proceso: str) -> None:
        self.obtener(id_proceso)
        if self.repo.esta_en_uso(id_proceso):
            raise ConflictError(
                "No se puede eliminar el proceso porque ya se usó en producción. Puede marcarlo como Inactivo.")
        self.repo.eliminar(id_proceso)
