from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.proveedor import Proveedor
from app.domain.interfaces.proveedor_repository import IProveedorRepository

# id_proveedores se entrega como "id", que es el nombre que usa el frontend
COLUMNAS = "id_proveedores AS id, nit, nombre, contacto, telefono, correo, direccion, estado"

# Únicos campos que se pueden escribir desde la API (el id lo genera la base de datos)
CAMPOS_EDITABLES = ("nit", "nombre", "contacto", "telefono", "correo", "direccion", "estado")


class ProveedorRepository(IProveedorRepository):
    def __init__(self, db: Session):
        self.db = db

    def listar(self, estado: str | None = None) -> list[Proveedor]:
        sql = f"SELECT {COLUMNAS} FROM proveedores"
        params = {}
        if estado:
            sql += " WHERE estado = :estado"
            params["estado"] = estado
        sql += " ORDER BY id_proveedores"
        return [Proveedor(**f) for f in self.db.execute(text(sql), params).mappings()]

    def obtener(self, id_proveedor: str) -> Proveedor | None:
        fila = self.db.execute(
            text(f"SELECT {COLUMNAS} FROM proveedores WHERE id_proveedores = :id"),
            {"id": id_proveedor},
        ).mappings().first()
        return Proveedor(**fila) if fila else None

    def existe_nit(self, nit: str, excluir_id: str | None = None) -> bool:
        sql = "SELECT EXISTS (SELECT 1 FROM proveedores WHERE nit = :nit"
        params = {"nit": nit}
        if excluir_id:
            sql += " AND id_proveedores <> :excluir"
            params["excluir"] = excluir_id
        sql += ")"
        return bool(self.db.execute(text(sql), params).scalar())

    def tiene_compras(self, id_proveedor: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_compras WHERE id_proveedor = :id)"),
            {"id": id_proveedor},
        ).scalar())

    def crear(self, datos: dict) -> Proveedor:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        sql = f"""
            INSERT INTO proveedores ({", ".join(campos)})
            VALUES ({", ".join(f":{c}" for c in campos)})
            RETURNING {COLUMNAS}
        """
        fila = self.db.execute(text(sql), {c: datos[c] for c in campos}).mappings().one()
        self.db.commit()
        return Proveedor(**fila)

    def actualizar(self, id_proveedor: str, datos: dict) -> Proveedor | None:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        if not campos:
            return self.obtener(id_proveedor)
        sql = f"""
            UPDATE proveedores
               SET {", ".join(f"{c} = :{c}" for c in campos)}
             WHERE id_proveedores = :id
            RETURNING {COLUMNAS}
        """
        params = {c: datos[c] for c in campos}
        params["id"] = id_proveedor
        fila = self.db.execute(text(sql), params).mappings().first()
        self.db.commit()
        return Proveedor(**fila) if fila else None

    def eliminar(self, id_proveedor: str) -> bool:
        fila = self.db.execute(
            text("DELETE FROM proveedores WHERE id_proveedores = :id RETURNING id_proveedores"),
            {"id": id_proveedor},
        ).first()
        self.db.commit()
        return fila is not None

    