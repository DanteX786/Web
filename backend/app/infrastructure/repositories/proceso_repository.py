from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.proceso import Proceso
from app.domain.interfaces.proceso_repository import IProcesoRepository

# "desc" es palabra reservada en PostgreSQL, por eso va entre comillas dobles.
COLUMNAS = 'id_proceso AS id, nombre, descripcion AS "desc", estado'

# Máquinas de cada proceso (tb_proceso_x_maquina)
_SQL_MAQUINAS = """
    SELECT id_proceso, array_agg(id_maquina ORDER BY id_maquina) AS maquinas
      FROM tb_proceso_x_maquina GROUP BY id_proceso
"""

# Campo en la API -> columna en la tabla (solo estos se pueden escribir)
COLUMNA_DE = {"nombre": "nombre", "desc": "descripcion", "estado": "estado"}


class ProcesoRepository(IProcesoRepository):
    def __init__(self, db: Session):
        self.db = db

    def _con_maquinas(self, procesos: list[Proceso]) -> list[Proceso]:
        maquinas = {f["id_proceso"]: list(f["maquinas"]) for f in self.db.execute(text(_SQL_MAQUINAS)).mappings()}
        for p in procesos:
            p.maquinas = maquinas.get(p.id, [])
        return procesos

    def _guardar_maquinas(self, id_proceso: str, maquinas: list[str]) -> None:
        self.db.execute(text("DELETE FROM tb_proceso_x_maquina WHERE id_proceso = :id"), {"id": id_proceso})
        for id_maquina in dict.fromkeys(maquinas):
            self.db.execute(
                text("INSERT INTO tb_proceso_x_maquina (id_proceso, id_maquina) VALUES (:p, :m)"),
                {"p": id_proceso, "m": id_maquina},
            )

    def listar(self, estado: str | None = None) -> list[Proceso]:
        sql = f"SELECT {COLUMNAS} FROM tb_procesos"
        params = {}
        if estado:
            sql += " WHERE estado = :estado"
            params["estado"] = estado
        sql += " ORDER BY id_proceso"
        return self._con_maquinas([Proceso(**f) for f in self.db.execute(text(sql), params).mappings()])

    def obtener(self, id_proceso: str) -> Proceso | None:
        fila = self.db.execute(
            text(f"SELECT {COLUMNAS} FROM tb_procesos WHERE id_proceso = :id"), {"id": id_proceso},
        ).mappings().first()
        return self._con_maquinas([Proceso(**fila)])[0] if fila else None

    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool:
        sql = "SELECT EXISTS (SELECT 1 FROM tb_procesos WHERE lower(nombre) = lower(:nombre)"
        params = {"nombre": nombre}
        if excluir_id:
            sql += " AND id_proceso <> :excluir"
            params["excluir"] = excluir_id
        return bool(self.db.execute(text(sql + ")"), params).scalar())

    def esta_en_uso(self, id_proceso: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_proceso = :id)"),
            {"id": id_proceso},
        ).scalar())

    def crear(self, datos: dict) -> Proceso:
        campos = [c for c in COLUMNA_DE if c in datos]
        sql = f"""
            INSERT INTO tb_procesos ({", ".join(COLUMNA_DE[c] for c in campos)})
            VALUES ({", ".join(f":p_{c}" for c in campos)})
            RETURNING {COLUMNAS}
        """
        fila = self.db.execute(text(sql), {f"p_{c}": datos[c] for c in campos}).mappings().one()
        if datos.get("maquinas") is not None:
            self._guardar_maquinas(fila["id"], datos["maquinas"])
        self.db.commit()
        return self.obtener(fila["id"])

    def actualizar(self, id_proceso: str, datos: dict) -> Proceso | None:
        campos = [c for c in COLUMNA_DE if c in datos]
        if datos.get("maquinas") is not None:
            self._guardar_maquinas(id_proceso, datos["maquinas"])
        if not campos:
            self.db.commit()
            return self.obtener(id_proceso)
        sql = f"""
            UPDATE tb_procesos
               SET {", ".join(f"{COLUMNA_DE[c]} = :p_{c}" for c in campos)}
             WHERE id_proceso = :id
            RETURNING {COLUMNAS}
        """
        params = {f"p_{c}": datos[c] for c in campos}
        params["id"] = id_proceso
        fila = self.db.execute(text(sql), params).mappings().first()
        self.db.commit()
        return self.obtener(id_proceso) if fila else None

    def eliminar(self, id_proceso: str) -> bool:
        fila = self.db.execute(
            text("DELETE FROM tb_procesos WHERE id_proceso = :id RETURNING id_proceso"), {"id": id_proceso},
        ).first()
        self.db.commit()
        return fila is not None
