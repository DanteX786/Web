from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.usuario import CodigoRecuperacion, NuevoCliente, PerfilCliente, TipoUsuario, Usuario
from app.domain.interfaces.auth_repository import IAuthRepository

# Empleados y clientes con la misma forma, para buscar por correo o por id.
_SQL_USUARIOS = """
    SELECT * FROM (
        SELECT e.id_empleados AS id, 'Empleado' AS tipo, e.nombre, e.correo,
               e.contrasena AS contrasena_hash, e.estado, e.id_rol,
               r.descripcion_rol AS rol, e.version_token, e.telefono, e.direccion,
               e.identificacion AS documento, NULL AS tipo_documento, NULL AS tipo_telefono
          FROM empleados e LEFT JOIN roles r ON r.id_rol = e.id_rol
        UNION ALL
        SELECT c.nit, 'Cliente', c.nombre, c.correo,
               c.contrasena, c.estado, c.id_rol,
               COALESCE(r.descripcion_rol, 'Cliente'), c.version_token, c.telefono, c.direccion,
               c.nit, c.tipo_documento, c.tipo_telefono
          FROM tb_clientes c LEFT JOIN roles r ON r.id_rol = c.id_rol
    ) u
"""

# Tabla y columna de id según el tipo de usuario
_TABLAS = {
    "Empleado": ("empleados", "id_empleados"),
    "Cliente": ("tb_clientes", "nit"),
}


class AuthRepository(IAuthRepository):
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------ Usuarios
    def _con_permisos(self, fila) -> Usuario:
        permisos = []
        if fila["id_rol"]:
            permisos = self.db.execute(
                text("""SELECT p.descripcion FROM rol_x_permiso rp
                          JOIN permisos p ON p.id_permiso = rp.id_permiso
                         WHERE rp.id_rol = :rol ORDER BY p.descripcion"""),
                {"rol": fila["id_rol"]},
            ).scalars().all()
        return Usuario(**fila, permisos=list(permisos))

    def buscar_por_correo(self, correo: str) -> Usuario | None:
        fila = self.db.execute(
            text(_SQL_USUARIOS + " WHERE lower(u.correo) = lower(:correo) LIMIT 1"),
            {"correo": correo.strip()},
        ).mappings().first()
        return self._con_permisos(fila) if fila else None

    def buscar_por_id(self, tipo: TipoUsuario, id_usuario: str) -> Usuario | None:
        fila = self.db.execute(
            text(_SQL_USUARIOS + " WHERE u.tipo = :tipo AND u.id = :id"),
            {"tipo": tipo, "id": id_usuario},
        ).mappings().first()
        return self._con_permisos(fila) if fila else None

    def existe_correo(self, correo: str, excluir_id: str | None = None) -> bool:
        sql = f"SELECT EXISTS ({_SQL_USUARIOS} WHERE lower(u.correo) = lower(:correo)"
        params = {"correo": correo.strip()}
        if excluir_id:
            sql += " AND u.id <> :excluir"
            params["excluir"] = excluir_id
        return bool(self.db.execute(text(sql + ")"), params).scalar())

    def actualizar_perfil_cliente(self, nit: str, perfil: PerfilCliente) -> Usuario:
        self.db.execute(
            text("""UPDATE tb_clientes
                       SET nombre = :nombre, correo = :correo, tipo_telefono = :tipo_tel,
                           telefono = :telefono, direccion = :direccion
                     WHERE nit = :nit"""),
            {"nombre": perfil.nombre, "correo": perfil.correo.strip().lower(), "tipo_tel": perfil.tipo_telefono,
             "telefono": perfil.telefono, "direccion": perfil.direccion, "nit": nit},
        )
        self.db.commit()
        return self.buscar_por_id("Cliente", nit)

    def existe_documento(self, numero_documento: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_clientes WHERE nit = :doc)"),
            {"doc": numero_documento},
        ).scalar())

    def crear_cliente(self, cliente: NuevoCliente) -> Usuario:
        id_rol = self.db.execute(
            text("SELECT id_rol FROM roles WHERE descripcion_rol = 'Cliente' AND estado = 'Activo'")
        ).scalar()
        if not id_rol:
            raise RuntimeError("Falta el rol 'Cliente' (activo) en la tabla roles.")
        self.db.execute(
            text("""INSERT INTO tb_clientes
                        (nit, tipo_documento, nombre, correo, tipo_telefono, telefono,
                         direccion, contrasena, id_rol)
                    VALUES (:nit, :tipo_doc, :nombre, :correo, :tipo_tel, :telefono,
                            :direccion, :hash, :rol)"""),
            {
                "nit": cliente.numero_documento, "tipo_doc": cliente.tipo_documento,
                "nombre": cliente.nombre, "correo": cliente.correo.strip().lower(),
                "tipo_tel": cliente.tipo_telefono, "telefono": cliente.telefono,
                "direccion": cliente.direccion, "hash": cliente.contrasena_hash, "rol": id_rol,
            },
        )
        self.db.commit()
        return self.buscar_por_id("Cliente", cliente.numero_documento)

    def cambiar_contrasena(self, tipo: TipoUsuario, id_usuario: str, contrasena_hash: str) -> int:
        tabla, columna = _TABLAS[tipo]
        version = self.db.execute(
            text(f"""UPDATE {tabla}
                        SET contrasena = :hash, version_token = version_token + 1
                      WHERE {columna} = :id
                  RETURNING version_token"""),
            {"hash": contrasena_hash, "id": id_usuario},
        ).scalar()
        self.db.commit()
        return version

    def incrementar_version_token(self, tipo: TipoUsuario, id_usuario: str) -> int:
        tabla, columna = _TABLAS[tipo]
        version = self.db.execute(
            text(f"UPDATE {tabla} SET version_token = version_token + 1 "
                 f"WHERE {columna} = :id RETURNING version_token"),
            {"id": id_usuario},
        ).scalar()
        self.db.commit()
        return version

    # ------------------------------------------------------------------ Códigos
    def guardar_codigo(self, correo: str, tipo: TipoUsuario, codigo_hash: str, expira: datetime) -> None:
        # Al reenviar, los códigos anteriores quedan inválidos (usado = TRUE)
        self.db.execute(
            text("UPDATE tb_codigos_recuperacion SET usado = TRUE WHERE lower(correo) = lower(:c) AND NOT usado"),
            {"c": correo},
        )
        self.db.execute(
            text("""INSERT INTO tb_codigos_recuperacion (correo, tipo_usuario, codigo_hash, fecha_expiracion)
                    VALUES (lower(:c), :tipo, :hash, :expira)"""),
            {"c": correo, "tipo": tipo, "hash": codigo_hash, "expira": expira},
        )
        self.db.commit()

    def ultimo_codigo(self, correo: str) -> CodigoRecuperacion | None:
        fila = self.db.execute(
            text("""SELECT id_codigo, correo, tipo_usuario, codigo_hash, intentos, usado,
                           fecha_creacion, fecha_expiracion
                      FROM tb_codigos_recuperacion
                     WHERE lower(correo) = lower(:c)
                     ORDER BY fecha_creacion DESC, id_codigo DESC LIMIT 1"""),
            {"c": correo},
        ).mappings().first()
        return CodigoRecuperacion(**fila) if fila else None

    def sumar_intento(self, id_codigo: str) -> None:
        self.db.execute(
            text("UPDATE tb_codigos_recuperacion SET intentos = intentos + 1 WHERE id_codigo = :id"),
            {"id": id_codigo},
        )
        self.db.commit()

    def marcar_codigos_usados(self, correo: str) -> None:
        self.db.execute(
            text("UPDATE tb_codigos_recuperacion SET usado = TRUE WHERE lower(correo) = lower(:c) AND NOT usado"),
            {"c": correo},
        )
        self.db.commit()
