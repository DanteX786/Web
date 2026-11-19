from datetime import date

from app.domain.entities.asistencia import Asistencia
from app.domain.exceptions.errors import NotFoundError, ValidacionError
from app.domain.interfaces.asistencia_repository import IAsistenciaRepository

ESTADOS = ("Presente", "No presente")


class AsistenciaService:
    """Asistencia diaria de los empleados (solo el administrador).

    Reglas de negocio:
    - Un registro por empleado por día. Al abrir un día se crea la lista con los
      empleados Activos en "No presente"; el administrador marca a los que vinieron.
    - No se registra asistencia de días futuros.
    - Solo los empleados Presentes hoy reciben tareas y reportan avance diario
      (lo valida también la base de datos).
    """

    def __init__(self, repo: IAsistenciaRepository):
        self.repo = repo

    def _fecha(self, fecha: date | None) -> date:
        hoy = self.repo.hoy()
        fecha = fecha or hoy
        if fecha > hoy:
            raise ValidacionError("No se puede registrar asistencia de un día futuro.")
        return fecha

    def del_dia(self, fecha: date | None = None) -> list[Asistencia]:
        fecha = self._fecha(fecha)
        self.repo.abrir_dia(fecha)
        return self.repo.listar(fecha)

    def marcar(self, id_asistencia: str, estado: str, observacion: str | None, id_responsable: str) -> Asistencia:
        if estado not in ESTADOS:
            raise ValidacionError("El estado debe ser Presente o No presente.")
        if not self.repo.obtener(id_asistencia):
            raise NotFoundError(f"No existe el registro de asistencia {id_asistencia}.")
        observacion = " ".join((observacion or "").split()) or None
        self.repo.marcar(id_asistencia, estado, observacion, id_responsable)
        return self.repo.obtener(id_asistencia)

    def marcar_todos(self, fecha: date | None, estado: str, id_responsable: str) -> list[Asistencia]:
        if estado not in ESTADOS:
            raise ValidacionError("El estado debe ser Presente o No presente.")
        fecha = self._fecha(fecha)
        self.repo.abrir_dia(fecha)
        self.repo.marcar_todos(fecha, estado, id_responsable)
        return self.repo.listar(fecha)
