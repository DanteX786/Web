from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.domain.entities.rol import Permiso, Rol
from app.domain.interfaces.rol_repository import IRolRepository

# id_rol y descripcion_rol se entregan como "id" y "descripcion", que son los nombres que usa el frontend
COLUMNAS = "id_rol AS id, descripcion_rol AS descripcion, estado"

# Únicos campos de la tabla roles que se pueden escribir desde la API (el id lo genera la base de datos)
CAMPOS_EDITABLES = ("descripcion_rol", "estado")


class RolRepository(IRolRepository):
    def __init__(self, db: Session):
        self.db = db

    # ---------- Lectura ----------

    def _permisos_de(self, ids_roles: list[str]) -> dict[str, list[Permiso]]:
        """Devuelve los permisos de varios roles en una sola consulta: {id_rol: [Permiso, ...]}."""
        resultado: dict[str, list[Permiso]] = {i: [] for i in ids_roles}
        if not ids_roles:
            return resultado
        sql = text("""
            SELECT rp.id_rol, p.id_permiso AS id, p.descripcion
              FROM rol_x_permiso rp
              JOIN permisos p ON p.id_permiso = rp.id_permiso
             WHERE rp.id_rol IN :ids
             ORDER BY p.id_permiso
        """).bindparams(bindparam("ids", expanding=True))
        for f in self.db.execute(sql, {"ids": ids_roles}).mappings():
            resultado[f["id_rol"]].append(Permiso(id=f["id"], descripcion=f["descripcion"]))
        return resultado

    def listar(self, estado: str | None = None) -> list[Rol]:
        sql = f"SELECT {COLUMNAS} FROM roles"
        params = {}
        if estado:
            sql += " WHERE estado = :estado"
            params["estado"] = estado
        sql += " ORDER BY id_rol"
        filas = list(self.db.execute(text(sql), params).mappings())
        permisos = self._permisos_de([f["id"] for f in filas])
        return [Rol(**f, permisos=permisos[f["id"]]) for f in filas]

    def obtener(self, id_rol: str) -> Rol | None:
        fila = self.db.execute(
            text(f"SELECT {COLUMNAS} FROM roles WHERE id_rol = :id"),
            {"id": id_rol},
        ).mappings().first()
        if not fila:
            return None
        return Rol(**fila, permisos=self._permisos_de([id_rol])[id_rol])

    def listar_permisos(self) -> list[Permiso]:
        filas = self.db.execute(
            text("SELECT id_permiso AS id, descripcion FROM permisos ORDER BY id_permiso")
        ).mappings()
        return [Permiso(**f) for f in filas]

    def permisos_existen(self, ids_permisos: list[str]) -> bool:
        sql = text("SELECT COUNT(*) FROM permisos WHERE id_permiso IN :ids").bindparams(
            bindparam("ids", expanding=True)
        )
        encontrados = self.db.execute(sql, {"ids": ids_permisos}).scalar()
        return encontrados == len(set(ids_permisos))

    def existe_descripcion(self, descripcion: str, excluir_id: str | None = None) -> bool:
        sql = "SELECT EXISTS (SELECT 1 FROM roles WHERE LOWER(descripcion_rol) = LOWER(:desc)"
        params = {"desc": descripcion}
        if excluir_id:
            sql += " AND id_rol <> :excluir"
            params["excluir"] = excluir_id
        sql += ")"
        return bool(self.db.execute(text(sql), params).scalar())

    def tiene_empleados(self, id_rol: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM empleados WHERE id_rol = :id)"),
            {"id": id_rol},
        ).scalar())

    # ---------- Escritura ----------

    def _guardar_permisos(self, id_rol: str, ids_permisos: list[str]) -> None:
        """Reemplaza los permisos del rol en la tabla rol_x_permiso. NO hace commit."""
        self.db.execute(text("DELETE FROM rol_x_permiso WHERE id_rol = :id"), {"id": id_rol})
        for id_permiso in dict.fromkeys(ids_permisos):  # quita repetidos sin cambiar el orden
            self.db.execute(
                text("INSERT INTO rol_x_permiso (id_rol, id_permiso) VALUES (:rol, :permiso)"),
                {"rol": id_rol, "permiso": id_permiso},
            )

    def crear(self, datos: dict, ids_permisos: list[str]) -> Rol:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        sql = f"""
            INSERT INTO roles ({", ".join(campos)})
            VALUES ({", ".join(f":{c}" for c in campos)})
            RETURNING id_rol
        """
        try:
            id_rol = self.db.execute(text(sql), {c: datos[c] for c in campos}).scalar_one()
            self._guardar_permisos(id_rol, ids_permisos)
            self.db.commit()  # rol y permisos se guardan juntos o no se guarda nada
        except Exception:
            self.db.rollback()
            raise
        return self.obtener(id_rol)

    def actualizar(self, id_rol: str, datos: dict, ids_permisos: list[str] | None) -> Rol | None:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        try:
            if campos:
                params = {c: datos[c] for c in campos}
                params["id"] = id_rol
                self.db.execute(
                    text(f"UPDATE roles SET {', '.join(f'{c} = :{c}' for c in campos)} WHERE id_rol = :id"),
                    params,
                )
            if ids_permisos is not None:
                self._guardar_permisos(id_rol, ids_permisos)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return self.obtener(id_rol)

    def eliminar(self, id_rol: str) -> bool:
        try:
            self.db.execute(text("DELETE FROM rol_x_permiso WHERE id_rol = :id"), {"id": id_rol})
            fila = self.db.execute(
                text("DELETE FROM roles WHERE id_rol = :id RETURNING id_rol"),
                {"id": id_rol},
            ).first()
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        return fila is not None