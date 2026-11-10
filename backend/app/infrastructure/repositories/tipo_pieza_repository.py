from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.tipo_pieza import TipoPieza
from app.domain.interfaces.tipo_pieza_repository import ITipoPiezaRepository

# Se renombran columnas a los nombres que usa el frontend.
# "desc" es palabra reservada en PostgreSQL, por eso va entre comillas dobles.
COLUMNAS = 'id_tipo_de_pieza AS id, nombre, descripcion AS "desc", estado'

# Campo en la API -> columna en la tabla (solo estos se pueden escribir)
COLUMNA_DE = {"nombre": "nombre", "desc": "descripcion", "estado": "estado"}


class TipoPiezaRepository(ITipoPiezaRepository):
    def __init__(self, db: Session):
        self.db = db

    def listar(self, estado: str | None = None) -> list[TipoPieza]:
        sql = f"SELECT {COLUMNAS} FROM tipo_de_pieza"
        params = {}
        if estado:
            sql += " WHERE estado = :estado"
            params["estado"] = estado
        sql += " ORDER BY id_tipo_de_pieza"
        return [TipoPieza(**f) for f in self.db.execute(text(sql), params).mappings()]

    def obtener(self, id_tipo: str) -> TipoPieza | None:
        fila = self.db.execute(
            text(f"SELECT {COLUMNAS} FROM tipo_de_pieza WHERE id_tipo_de_pieza = :id"),
            {"id": id_tipo},
        ).mappings().first()
        return TipoPieza(**fila) if fila else None

    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool:
        # Se compara sin distinguir mayúsculas: "Manga" y "manga" se consideran el mismo
        sql = "SELECT EXISTS (SELECT 1 FROM tipo_de_pieza WHERE lower(nombre) = lower(:nombre)"
        params = {"nombre": nombre}
        if excluir_id:
            sql += " AND id_tipo_de_pieza <> :excluir"
            params["excluir"] = excluir_id
        sql += ")"
        return bool(self.db.execute(text(sql), params).scalar())

    def esta_en_uso(self, id_tipo: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_tipo_pieza = :id)"),
            {"id": id_tipo},
        ).scalar())

    def crear(self, datos: dict) -> TipoPieza:
        campos = [c for c in COLUMNA_DE if c in datos]
        sql = f"""
            INSERT INTO tipo_de_pieza ({", ".join(COLUMNA_DE[c] for c in campos)})
            VALUES ({", ".join(f":p_{c}" for c in campos)})
            RETURNING {COLUMNAS}
        """
        fila = self.db.execute(text(sql), {f"p_{c}": datos[c] for c in campos}).mappings().one()
        self.db.commit()
        return TipoPieza(**fila)

    def actualizar(self, id_tipo: str, datos: dict) -> TipoPieza | None:
        campos = [c for c in COLUMNA_DE if c in datos]
        if not campos:
            return self.obtener(id_tipo)
        sql = f"""
            UPDATE tipo_de_pieza
               SET {", ".join(f"{COLUMNA_DE[c]} = :p_{c}" for c in campos)}
             WHERE id_tipo_de_pieza = :id
            RETURNING {COLUMNAS}
        """
        params = {f"p_{c}": datos[c] for c in campos}
        params["id"] = id_tipo
        fila = self.db.execute(text(sql), params).mappings().first()
        self.db.commit()
        return TipoPieza(**fila) if fila else None

    def eliminar(self, id_tipo: str) -> bool:
        fila = self.db.execute(
            text("DELETE FROM tipo_de_pieza WHERE id_tipo_de_pieza = :id RETURNING id_tipo_de_pieza"),
            {"id": id_tipo},
        ).first()
        self.db.commit()
        return fila is not None

    