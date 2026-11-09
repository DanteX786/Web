from datetime import date

from app.domain.entities.registro_diario import RegistroDiario
from app.domain.exceptions.errors import ForbiddenError, NotFoundError
from app.domain.interfaces.registro_diario_repository import IRegistroDiarioRepository


class RegistroDiarioService:
    """Casos de uso del Registro diario (HU_55 a HU_57)."""

    def __init__(self, repo: IRegistroDiarioRepository):
        self.repo = repo

    def listar(self, id_empleado: str | None = None, id_produccion: str | None = None,
               desde: date | None = None, hasta: date | None = None) -> list[RegistroDiario]:
        return self.repo.listar(id_empleado, id_produccion, desde, hasta)

    def obtener(self, id_registro: str) -> RegistroDiario:
        registro = self.repo.obtener(id_registro)
        if not registro:
            raise NotFoundError(f"No existe el registro diario {id_registro}.")
        return registro

    def registrar(self, id_detalle_de_produccion: str, cantidad: int, id_usuario: str) -> RegistroDiario:
        dueno = self.repo.empleado_de_asignacion(id_detalle_de_produccion)
        if dueno is None:
            raise NotFoundError(f"No existe la asignación {id_detalle_de_produccion}.")
        # El empleado solo reporta SUS asignaciones; el administrador puede reportar cualquiera
        if dueno != id_usuario and not self.repo.es_administrador(id_usuario):
            raise ForbiddenError("Solo puede registrar avance en sus propias asignaciones.")
        # Producción finalizada y "no superar lo asignado" las valida el trigger de la BD
        nuevo_id = self.repo.crear(id_detalle_de_produccion, cantidad)
        return self.obtener(nuevo_id)

    def eliminar(self, id_registro: str, id_usuario: str) -> None:
        registro = self.obtener(id_registro)
        if registro.id_empleado != id_usuario and not self.repo.es_administrador(id_usuario):
            raise ForbiddenError("Solo puede eliminar sus propios registros.")
        self.repo.eliminar(id_registro)
