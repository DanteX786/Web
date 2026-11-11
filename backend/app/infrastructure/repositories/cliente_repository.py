import bcrypt
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.cliente import Cliente
from app.domain.interfaces.cliente_repository import IClienteRepository

# Todo cliente se guarda con el rol "Cliente" (tabla roles). Se busca por nombre
# y no por id, para no depender de que siempre sea ROL00003.
ROL_CLIENTE = "Cliente"

SELECT_CLIENTES = """
    SELECT c.nit, c.nombre, c.direccion, c.correo, c.telefono, c.estado
      FROM tb_clientes c
"""

# Campo que llega desde la API -> columna real en la tabla.
# El NIT no está aquí porque es la llave primaria: se fija al crear y no se edita.
CAMPOS_EDITABLES = {
    "nombre": "nombre",
    "direccion": "direccion",
    "correo": "correo",
    "telefono": "telefono",
    "estado": "estado",
    "contrasena": "contrasena",
}


def _hashear(contrasena: str) -> str:
    return bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _preparar(datos: dict) -> dict:
    """Nunca se guarda la contraseña en texto plano."""
    datos = dict(datos)
    if datos.get("contrasena"):
        datos["contrasena"] = _hashear(datos["contrasena"])
    else:
        datos.pop("contrasena", None)
    return datos


class ClienteRepository(IClienteRepository):
    def __init__(self, db: Session):
        self.db = db

    def listar(self, estado: str | None = None) -> list[Cliente]:
        sql = SELECT_CLIENTES
        params = {}
        if estado:
            sql += " WHERE c.estado = :estado"
            params["estado"] = estado
        sql += " ORDER BY c.nombre"
        return [Cliente(**f) for f in self.db.execute(text(sql), params).mappings()]

    def obtener(self, nit: str) -> Cliente | None:
        fila = self.db.execute(
            text(SELECT_CLIENTES + " WHERE c.nit = :nit"), {"nit": nit}
        ).mappings().first()
        return Cliente(**fila) if fila else None

    def existe_correo(self, correo: str, excluir_nit: str | None = None) -> bool:
        sql = "SELECT EXISTS (SELECT 1 FROM tb_clientes WHERE LOWER(correo) = LOWER(:correo)"
        params = {"correo": correo}
        if excluir_nit:
            sql += " AND nit <> :excluir"
            params["excluir"] = excluir_nit
        sql += ")"
        return bool(self.db.execute(text(sql), params).scalar())

    def esta_en_uso(self, nit: str) -> bool:
        """True si el cliente ya tiene remisiones registradas."""
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_remision WHERE nit_cliente = :nit)"),
            {"nit": nit},
        ).scalar())

    def crear(self, datos: dict) -> Cliente:
        datos = _preparar(datos)
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        sql = f"""
            INSERT INTO tb_clientes (nit, id_rol, {", ".join(CAMPOS_EDITABLES[c] for c in campos)})
            VALUES (:nit, (SELECT id_rol FROM roles WHERE descripcion_rol = :rol),
                    {", ".join(f":{c}" for c in campos)})
            RETURNING nit
        """
        params = {c: datos[c] for c in campos}
        params["nit"] = datos["nit"]
        params["rol"] = ROL_CLIENTE
        nit = self.db.execute(text(sql), params).scalar_one()
        self.db.commit()
        return self.obtener(nit)

    def actualizar(self, nit: str, datos: dict) -> Cliente | None:
        datos = _preparar(datos)
        campos = [c for c in CAMPOS_EDITABLES if c in datos]
        if not campos:
            return self.obtener(nit)
        sql = f"""
            UPDATE tb_clientes
               SET {", ".join(f"{CAMPOS_EDITABLES[c]} = :{c}" for c in campos)}
             WHERE nit = :nit
            RETURNING nit
        """
        params = {c: datos[c] for c in campos}
        params["nit"] = nit
        fila = self.db.execute(text(sql), params).first()
        self.db.commit()
        return self.obtener(nit) if fila else None

    def eliminar(self, nit: str) -> bool:
        fila = self.db.execute(
            text("DELETE FROM tb_clientes WHERE nit = :nit RETURNING nit"), {"nit": nit}
        ).first()
        self.db.commit()
        return fila is not None
