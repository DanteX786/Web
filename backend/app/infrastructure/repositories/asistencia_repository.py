from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.asistencia import Asistencia
from app.domain.interfaces.asistencia_repository import IAsistenciaRepository


class AsistenciaRepository(IAsistenciaRepository):
    def __init__(self, db: Session):
        self.db = db

    def hoy(self) -> date:
        return self.db.execute(text("SELECT fn_hoy()")).scalar()

    def abrir_dia(self, fecha: date) -> None:
        self.db.execute(text("SELECT fn_abrir_asistencia(:fecha)"), {"fecha": fecha})
        self.db.commit()

    def listar(self, fecha: date) -> list[Asistencia]:
        sql = "SELECT * FROM vw_asistencia WHERE fecha = :fecha ORDER BY empleado"
        return [Asistencia(**f) for f in self.db.execute(text(sql), {"fecha": fecha}).mappings()]

    def obtener(self, id_asistencia: str) -> Asistencia | None:
        fila = self.db.execute(
            text("SELECT * FROM vw_asistencia WHERE id_asistencia = :id"), {"id": id_asistencia}
        ).mappings().first()
        return Asistencia(**fila) if fila else None

    def marcar(self, id_asistencia: str, estado: str, observacion: str | None, id_responsable: str) -> None:
        self.db.execute(
            text("""UPDATE tb_asistencia
                       SET estado = :estado, observacion = :obs, registrado_por = :resp
                     WHERE id_asistencia = :id"""),
            {"estado": estado, "obs": observacion, "resp": id_responsable, "id": id_asistencia},
        )
        self.db.commit()

    def marcar_todos(self, fecha: date, estado: str, id_responsable: str) -> None:
        self.db.execute(
            text("""UPDATE tb_asistencia SET estado = :estado, registrado_por = :resp
                     WHERE fecha = :fecha AND estado <> :estado"""),
            {"estado": estado, "resp": id_responsable, "fecha": fecha},
        )
        self.db.commit()
