from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.insumo import Insumo, TipoInsumo
from app.domain.interfaces.insumo_repository import IInsumoRepository

# En el diagrama el nombre de esta tabla sale cortado ("tb_detalle_compr...").
# Si en Neon se llama distinto, solo se cambia aquí.
TABLA_DETALLE_COMPRAS = "tb_detalle_compras"

# Los nombres se cambian a los que usa el frontend. El tipo se trae con un JOIN para mostrar su nombre.
SELECT_INSUMOS = """
    SELECT i.id_insumos AS id, i.nombre, i.descripcion_insumo AS descripcion, i.stock,
           i.id_tipo_insumo AS tipo_id, t.nombre AS tipo_nombre
      FROM tb_insumos i
      LEFT JOIN tb_tipo_insumos t ON t.id_tipo_insumos = i.id_tipo_insumo
"""

# Campo que llega desde la API -> columna real en la tabla (el id lo genera la base de datos)
CAMPOS_EDITABLES = {
    "nombre": "nombre",
    "descripcion": "descripcion_insumo",
    "stock": "stock",
    "tipo_id": "id_tipo_insumo",
}


class InsumoRepository(IInsumoRepository):
    def __init__(self, db: Session):
        self.db = db

    def listar(self, id_tipo: str | None = None) -> list[Insumo]:
        sql = SELECT_INSUMOS
        params = {}
        if id_tipo:
            sql += " WHERE i.id_tipo_insumo = :tipo"
            params["tipo"] = id_tipo
        sql += " ORDER BY i.id_insumos"
        return [Insumo(**f) for f in self.db.execute(text(sql), params).mappings()]

    def obtener(self, id_insumo: str) -> Insumo | None:
        fila = self.db.execute(
            text(SELECT_INSUMOS + " WHERE i.id_insumos = :id"),
            {"id": id_insumo},
        ).mappings().first()
        return Insumo(**fila) if fila else None

    def listar_tipos(self) -> list[TipoInsumo]:
        filas = self.db.execute(
            text("SELECT id_tipo_insumos AS id, nombre FROM tb_tipo_insumos ORDER BY id_tipo_insumos")
        ).mappings()
        return [TipoInsumo(**f) for f in filas]

    def existe_tipo(self, id_tipo: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_tipo_insumos WHERE id_tipo_insumos = :id)"),
            {"id": id_tipo},
        ).scalar())

    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool:
        sql = "SELECT EXISTS (SELECT 1 FROM tb_insumos WHERE LOWER(nombre) = LOWER(:nombre)"
        params = {"nombre": nombre}
        if excluir_id:
            sql += " AND id_insumos <> :excluir"
            params["excluir"] = excluir_id
        sql += ")"
        return bool(self.db.execute(text(sql), params).scalar())

    def esta_en_uso(self, id_insumo: str) -> bool:
        """True si el insumo aparece en alguna compra o en alguna asignación de producción."""
        return bool(self.db.execute(
            text(f"""
                SELECT EXISTS (SELECT 1 FROM {TABLA_DETALLE_COMPRAS} WHERE id_insumos = :id)
                    OR EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_insumos = :id)
            """),
            {"id": id_insumo},
        ).scalar())

    def crear(self, datos: dict) -> Insumo:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        sql = f"""
            INSERT INTO tb_insumos ({", ".join(CAMPOS_EDITABLES[c] for c in campos)})
            VALUES ({", ".join(f":{c}" for c in campos)})
            RETURNING id_insumos
        """
        id_insumo = self.db.execute(text(sql), {c: datos[c] for c in campos}).scalar_one()
        self.db.commit()
        return self.obtener(id_insumo)

    def actualizar(self, id_insumo: str, datos: dict) -> Insumo | None:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        if not campos:
            return self.obtener(id_insumo)
        sql = f"""
            UPDATE tb_insumos
               SET {", ".join(f"{CAMPOS_EDITABLES[c]} = :{c}" for c in campos)}
             WHERE id_insumos = :id
            RETURNING id_insumos
        """
        params = {c: datos[c] for c in campos}
        params["id"] = id_insumo
        fila = self.db.execute(text(sql), params).first()
        self.db.commit()
        return self.obtener(id_insumo) if fila else None

    def eliminar(self, id_insumo: str) -> bool:
        fila = self.db.execute(
            text("DELETE FROM tb_insumos WHERE id_insumos = :id RETURNING id_insumos"),
            {"id": id_insumo},
        ).first()
        self.db.commit()
        return fila is not None
