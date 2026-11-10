from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.tipo_insumo import TipoInsumo
from app.domain.interfaces.tipo_insumo_repository import ITipoInsumoRepository

SELECT_TIPOS = """
    SELECT id_tipo_insumos AS id, nombre, descripcion, estado
      FROM tb_tipo_insumos
"""

# Campo que llega desde la API -> columna real en la tabla (el id lo genera la base de datos)
CAMPOS_EDITABLES = {
    "nombre": "nombre",
    "descripcion": "descripcion",
    "estado": "estado",
}


class TipoInsumoRepository(ITipoInsumoRepository):
    def __init__(self, db: Session):
        self.db = db

    def listar(self) -> list[TipoInsumo]:
        filas = self.db.execute(text(SELECT_TIPOS + " ORDER BY id_tipo_insumos")).mappings()
        return [TipoInsumo(**f) for f in filas]

    def obtener(self, id_tipo: str) -> TipoInsumo | None:
        fila = self.db.execute(
            text(SELECT_TIPOS + " WHERE id_tipo_insumos = :id"), {"id": id_tipo}
        ).mappings().first()
        return TipoInsumo(**fila) if fila else None

    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool:
        sql = "SELECT EXISTS (SELECT 1 FROM tb_tipo_insumos WHERE LOWER(nombre) = LOWER(:nombre)"
        params = {"nombre": nombre}
        if excluir_id:
            sql += " AND id_tipo_insumos <> :excluir"
            params["excluir"] = excluir_id
        sql += ")"
        return bool(self.db.execute(text(sql), params).scalar())

    def esta_en_uso(self, id_tipo: str) -> bool:
        """True si algún insumo tiene asignado este tipo."""
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_insumos WHERE id_tipo_insumo = :id)"),
            {"id": id_tipo},
        ).scalar())

    def crear(self, datos: dict) -> TipoInsumo:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        sql = f"""
            INSERT INTO tb_tipo_insumos ({", ".join(CAMPOS_EDITABLES[c] for c in campos)})
            VALUES ({", ".join(f":{c}" for c in campos)})
            RETURNING id_tipo_insumos
        """
        id_tipo = self.db.execute(text(sql), {c: datos[c] for c in campos}).scalar_one()
        self.db.commit()
        return self.obtener(id_tipo)

    def actualizar(self, id_tipo: str, datos: dict) -> TipoInsumo | None:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        if not campos:
            return self.obtener(id_tipo)
        sql = f"""
            UPDATE tb_tipo_insumos
               SET {", ".join(f"{CAMPOS_EDITABLES[c]} = :{c}" for c in campos)}
             WHERE id_tipo_insumos = :id
            RETURNING id_tipo_insumos
        """
        params = {c: datos[c] for c in campos}
        params["id"] = id_tipo
        fila = self.db.execute(text(sql), params).first()
        self.db.commit()
        return self.obtener(id_tipo) if fila else None

    def eliminar(self, id_tipo: str) -> bool:
        fila = self.db.execute(
            text("DELETE FROM tb_tipo_insumos WHERE id_tipo_insumos = :id RETURNING id_tipo_insumos"),
            {"id": id_tipo},
        ).first()
        self.db.commit()
        return fila is not None
