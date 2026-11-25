from datetime import date, time

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.asistencia import Asistencia, Marcacion
from app.domain.interfaces.asistencia_repository import IAsistenciaRepository

# Fecha del día + hora escrita (hora de Colombia) -> timestamp; sin hora = ahora
_HORA = ("CASE WHEN CAST(:{h} AS time) IS NULL THEN now() "
         "ELSE (a.fecha + CAST(:{h} AS time)) AT TIME ZONE 'America/Bogota' END")


class AsistenciaRepository(IAsistenciaRepository):
    """Asistencia diaria. Las reglas (no cruzar horarios, no horas futuras, estado del día
    según las horas, novedades sin horas) las valida la base de datos con triggers."""

    def __init__(self, db: Session):
        self.db = db

    def hoy(self) -> date:
        return self.db.execute(text("SELECT fn_hoy()")).scalar()

    def abrir_dia(self, fecha: date) -> None:
        self.db.execute(text("SELECT fn_abrir_asistencia(:fecha)"), {"fecha": fecha})
        self.db.commit()

    def _marcaciones(self, condicion: str, params: dict) -> list[Marcacion]:
        sql = f"SELECT * FROM vw_asistencia_marcacion WHERE {condicion} ORDER BY hora_entrada"
        return [Marcacion(**f) for f in self.db.execute(text(sql), params).mappings()]

    def listar(self, fecha: date) -> list[Asistencia]:
        sql = "SELECT * FROM vw_asistencia WHERE fecha = :fecha ORDER BY empleado"
        lista = [Asistencia(**f) for f in self.db.execute(text(sql), {"fecha": fecha}).mappings()]
        por_dia: dict[str, list[Marcacion]] = {}
        for m in self._marcaciones("fecha = :fecha", {"fecha": fecha}):
            por_dia.setdefault(m.id_asistencia, []).append(m)
        for a in lista:
            a.marcaciones = por_dia.get(a.id_asistencia, [])
        return lista

    def obtener(self, id_asistencia: str) -> Asistencia | None:
        fila = self.db.execute(
            text("SELECT * FROM vw_asistencia WHERE id_asistencia = :id"), {"id": id_asistencia}
        ).mappings().first()
        if not fila:
            return None
        asistencia = Asistencia(**fila)
        asistencia.marcaciones = self._marcaciones("id_asistencia = :id", {"id": id_asistencia})
        return asistencia

    def marcar(self, id_asistencia: str, estado: str, observacion: str | None, id_responsable: str) -> None:
        self.db.execute(
            text("""UPDATE tb_asistencia
                       SET estado = :estado, observacion = :obs, registrado_por = :resp
                     WHERE id_asistencia = :id"""),
            {"estado": estado, "obs": observacion, "resp": id_responsable, "id": id_asistencia},
        )
        self.db.commit()

    # ------------------------------------------------------------------ Horas
    def registrar_entrada(self, id_asistencia: str, hora: time | None, id_responsable: str) -> None:
        self.db.execute(
            text(f"""INSERT INTO tb_asistencia_marcacion (id_asistencia, hora_entrada, registrado_por)
                     SELECT a.id_asistencia, {_HORA.format(h='hora')}, :resp
                       FROM tb_asistencia a WHERE a.id_asistencia = :id"""),
            {"id": id_asistencia, "hora": hora, "resp": id_responsable},
        )
        self.db.commit()

    def tramo_abierto(self, id_asistencia: str) -> Marcacion | None:
        abiertos = self._marcaciones("id_asistencia = :id AND hora_salida IS NULL", {"id": id_asistencia})
        return abiertos[-1] if abiertos else None

    def registrar_salida(self, id_marcacion: str, hora: time | None, tipo_salida: str,
                         motivo: str | None, id_responsable: str) -> None:
        self.db.execute(
            text(f"""UPDATE tb_asistencia_marcacion m
                        SET hora_salida = {_HORA.format(h='hora')}, tipo_salida = :tipo, motivo = :motivo,
                            registrado_por = :resp, fecha_registro = now()
                       FROM tb_asistencia a
                      WHERE a.id_asistencia = m.id_asistencia AND m.id_marcacion = :id"""),
            {"id": id_marcacion, "hora": hora, "tipo": tipo_salida, "motivo": motivo, "resp": id_responsable},
        )
        self.db.commit()

    def entrada_todos(self, fecha: date, hora: time | None, id_responsable: str) -> int:
        resultado = self.db.execute(
            text(f"""INSERT INTO tb_asistencia_marcacion (id_asistencia, hora_entrada, registrado_por)
                     SELECT a.id_asistencia, {_HORA.format(h='hora')}, :resp
                       FROM tb_asistencia a
                      WHERE a.fecha = :fecha AND a.estado = 'No presente'"""),
            {"fecha": fecha, "hora": hora, "resp": id_responsable},
        )
        self.db.commit()
        return resultado.rowcount or 0

    def obtener_marcacion(self, id_marcacion: str) -> Marcacion | None:
        lista = self._marcaciones("id_marcacion = :id", {"id": id_marcacion})
        return lista[0] if lista else None

    def actualizar_marcacion(self, id_marcacion: str, hora_entrada: time, hora_salida: time | None,
                             tipo_salida: str | None, motivo: str | None, id_responsable: str) -> None:
        self.db.execute(
            text("""UPDATE tb_asistencia_marcacion m
                       SET hora_entrada = (a.fecha + CAST(:entrada AS time)) AT TIME ZONE 'America/Bogota',
                           hora_salida = CASE WHEN CAST(:salida AS time) IS NULL THEN NULL
                                              ELSE (a.fecha + CAST(:salida AS time)) AT TIME ZONE 'America/Bogota' END,
                           tipo_salida = :tipo, motivo = :motivo,
                           registrado_por = :resp, fecha_registro = now()
                      FROM tb_asistencia a
                     WHERE a.id_asistencia = m.id_asistencia AND m.id_marcacion = :id"""),
            {"id": id_marcacion, "entrada": hora_entrada, "salida": hora_salida,
             "tipo": tipo_salida, "motivo": motivo, "resp": id_responsable},
        )
        self.db.commit()

    def eliminar_marcacion(self, id_marcacion: str) -> None:
        self.db.execute(text("DELETE FROM tb_asistencia_marcacion WHERE id_marcacion = :id"), {"id": id_marcacion})
        self.db.commit()

    def sin_salida(self) -> list[Marcacion]:
        return self._marcaciones("sin_salida", {})
