from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.usuario_maestro import UsuarioMaestro
from app.domain.interfaces.usuario_repository import IUsuarioRepository


class UsuarioRepository(IUsuarioRepository):
    """Solo lectura: tb_usuarios la llenan los triggers de empleados y clientes (vista vw_usuarios)."""

    def __init__(self, db: Session):
        self.db = db

    def listar(self, tipo: str | None = None, estado_cuenta: str | None = None) -> list[UsuarioMaestro]:
        sql = "SELECT * FROM vw_usuarios WHERE TRUE"
        params: dict = {}
        if tipo:
            sql += " AND tipo_usuario = :tipo"
            params["tipo"] = tipo
        if estado_cuenta:
            sql += " AND estado_cuenta = :cuenta"
            params["cuenta"] = estado_cuenta
        sql += " ORDER BY tipo_usuario DESC, nombre"
        return [UsuarioMaestro(**f) for f in self.db.execute(text(sql), params).mappings()]
