from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.tipo_maquina import TipoMaquina
from app.domain.interfaces.tipo_maquina_repository import ITipoMaquinaRepository

# Se devuelven los nombres reales de la tabla, que es lo que usa el frontend
COLUMNAS = "id_tipo_de_maquina, nombre, descripcion, estado"

# Únicos campos que se pueden escribir desde la API (el id lo genera la base de datos)
CAMPOS_EDITABLES = ("nombre", "descripcion", "estado")


class TipoMaquinaRepository(ITipoMaquinaRepository):
    def __init__(self, db: Session):
        self.db = db

    def listar(self, estado: str | None = None) -> list[TipoMaquina]:
        sql = f"SELECT {COLUMNAS} FROM tipo_de_maquina"
        params = {}
        if estado:
            sql += " WHERE estado = :estado"
            params["estado"] = estado
        sql += " ORDER BY id_tipo_de_maquina"
        return [TipoMaquina(**f) for f in self.db.execute(text(sql), params).mappings()]

    def obtener(self, id_tipo: str) -> TipoMaquina | None:
        fila = self.db.execute(
            text(f"SELECT {COLUMNAS} FROM tipo_de_maquina WHERE id_tipo_de_maquina = :id"),
            {"id": id_tipo},
        ).mappings().first()
        return TipoMaquina(**fila) if fila else None

    def existe_nombre(self, nombre: str, excluir_id: str | None = None) -> bool:
        # Se compara sin distinguir mayúsculas: "Plana" y "plana" se consideran el mismo
        sql = "SELECT EXISTS (SELECT 1 FROM tipo_de_maquina WHERE lower(nombre) = lower(:nombre)"
        params = {"nombre": nombre}
        if excluir_id:
            sql += " AND id_tipo_de_maquina <> :excluir"
            params["excluir"] = excluir_id
        sql += ")"
        return bool(self.db.execute(text(sql), params).scalar())

    def esta_en_uso(self, id_tipo: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_tipo_maquina = :id)"),
            {"id": id_tipo},
        ).scalar())

    def crear(self, datos: dict) -> TipoMaquina:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        sql = f"""
            INSERT INTO tipo_de_maquina ({", ".join(campos)})
            VALUES ({", ".join(f":{c}" for c in campos)})
            RETURNING {COLUMNAS}
        """
        fila = self.db.execute(text(sql), {c: datos[c] for c in campos}).mappings().one()
        self.db.commit()
        return TipoMaquina(**fila)

    def actualizar(self, id_tipo: str, datos: dict) -> TipoMaquina | None:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        if not campos:
            return self.obtener(id_tipo)
        sql = f"""
            UPDATE tipo_de_maquina
               SET {", ".join(f"{c} = :{c}" for c in campos)}
             WHERE id_tipo_de_maquina = :id
            RETURNING {COLUMNAS}
        """
        params = {c: datos[c] for c in campos}
        params["id"] = id_tipo
        fila = self.db.execute(text(sql), params).mappings().first()
        self.db.commit()
        return TipoMaquina(**fila) if fila else None

    def eliminar(self, id_tipo: str) -> bool:
        fila = self.db.execute(
            text("DELETE FROM tipo_de_maquina WHERE id_tipo_de_maquina = :id RETURNING id_tipo_de_maquina"),
            {"id": id_tipo},
        ).first()
        self.db.commit()
        return fila is not None
    