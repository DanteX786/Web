from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.empleado import Empleado
from app.domain.interfaces.empleado_repository import IEmpleadoRepository

# La columna de la contraseña tiene "ñ", por eso va entre comillas dobles.
# Si en Neon se llama distinto (por ejemplo contrasena), solo se cambia aquí.
COL_CONTRASENA = '"contraseña"'

# Nunca se selecciona la contraseña. El rol se trae con un JOIN para mostrar su descripción.
SELECT_EMPLEADOS = """
    SELECT e.id_empleados AS id, e.nombre, e.identificacion, e.correo, e.telefono,
           e.direccion, e.id_rol, r.descripcion_rol AS rol, e.estado
      FROM empleados e
      LEFT JOIN roles r ON r.id_rol = e.id_rol
"""

# Campo que llega desde la API -> columna real en la tabla (el id lo genera la base de datos)
CAMPOS_EDITABLES = {
    "nombre": "nombre",
    "identificacion": "identificacion",
    "correo": "correo",
    "telefono": "telefono",
    "direccion": "direccion",
    "id_rol": "id_rol",
    "estado": "estado",
    "contrasena_hash": COL_CONTRASENA,
}


class EmpleadoRepository(IEmpleadoRepository):
    def __init__(self, db: Session):
        self.db = db

    def listar(self, estado: str | None = None) -> list[Empleado]:
        sql = SELECT_EMPLEADOS
        params = {}
        if estado:
            sql += " WHERE e.estado = :estado"
            params["estado"] = estado
        sql += " ORDER BY e.id_empleados"
        return [Empleado(**f) for f in self.db.execute(text(sql), params).mappings()]

    def obtener(self, id_empleado: str) -> Empleado | None:
        fila = self.db.execute(
            text(SELECT_EMPLEADOS + " WHERE e.id_empleados = :id"),
            {"id": id_empleado},
        ).mappings().first()
        return Empleado(**fila) if fila else None

    def existe_identificacion(self, identificacion: str, excluir_id: str | None = None) -> bool:
        sql = "SELECT EXISTS (SELECT 1 FROM empleados WHERE identificacion = :valor"
        params = {"valor": identificacion}
        if excluir_id:
            sql += " AND id_empleados <> :excluir"
            params["excluir"] = excluir_id
        sql += ")"
        return bool(self.db.execute(text(sql), params).scalar())

    def existe_correo(self, correo: str, excluir_id: str | None = None) -> bool:
        sql = "SELECT EXISTS (SELECT 1 FROM empleados WHERE LOWER(correo) = LOWER(:valor)"
        params = {"valor": correo}
        if excluir_id:
            sql += " AND id_empleados <> :excluir"
            params["excluir"] = excluir_id
        sql += ")"
        return bool(self.db.execute(text(sql), params).scalar())

    def existe_rol(self, id_rol: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM roles WHERE id_rol = :id)"),
            {"id": id_rol},
        ).scalar())

    def tiene_produccion(self, id_empleado: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_empleado = :id)"),
            {"id": id_empleado},
        ).scalar())

    def crear(self, datos: dict) -> Empleado:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        sql = f"""
            INSERT INTO empleados ({", ".join(CAMPOS_EDITABLES[c] for c in campos)})
            VALUES ({", ".join(f":{c}" for c in campos)})
            RETURNING id_empleados
        """
        id_empleado = self.db.execute(text(sql), {c: datos[c] for c in campos}).scalar_one()
        self.db.commit()
        return self.obtener(id_empleado)

    def actualizar(self, id_empleado: str, datos: dict) -> Empleado | None:
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        if not campos:
            return self.obtener(id_empleado)
        sql = f"""
            UPDATE empleados
               SET {", ".join(f"{CAMPOS_EDITABLES[c]} = :{c}" for c in campos)}
             WHERE id_empleados = :id
            RETURNING id_empleados
        """
        params = {c: datos[c] for c in campos}
        params["id"] = id_empleado
        fila = self.db.execute(text(sql), params).first()
        self.db.commit()
        return self.obtener(id_empleado) if fila else None

    def eliminar(self, id_empleado: str) -> bool:
        fila = self.db.execute(
            text("DELETE FROM empleados WHERE id_empleados = :id RETURNING id_empleados"),
            {"id": id_empleado},
        ).first()
        self.db.commit()
        return fila is not None
