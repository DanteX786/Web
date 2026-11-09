from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.seguimiento import Seguimiento
from app.domain.interfaces.seguimiento_repository import ISeguimientoRepository


class SeguimientoRepository(ISeguimientoRepository):
    """Solo lectura: los registros los crea el trigger de tb_remision automáticamente."""

    def __init__(self, db: Session):
        self.db = db

    def existe_remision(self, id_remision: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_remision WHERE id_remision = :id)"), {"id": id_remision}
        ).scalar())

    def listar_por_remision(self, id_remision: str) -> list[Seguimiento]:
        sql = """
            SELECT * FROM vw_seguimiento_remision
             WHERE id_remision = :id
             ORDER BY fecha_hora, id_seguimiento
        """
        return [Seguimiento(**f) for f in self.db.execute(text(sql), {"id": id_remision}).mappings()]

    def listar(self, estado_nuevo: str | None = None, desde: date | None = None,
               hasta: date | None = None) -> list[Seguimiento]:
        condiciones, params = [], {}
        if estado_nuevo:
            condiciones.append("estado_nuevo = :estado")
            params["estado"] = estado_nuevo
        if desde:
            condiciones.append("fecha_hora::date >= :desde")
            params["desde"] = desde
        if hasta:
            condiciones.append("fecha_hora::date <= :hasta")
            params["hasta"] = hasta
        sql = "SELECT * FROM vw_seguimiento_remision"
        if condiciones:
            sql += " WHERE " + " AND ".join(condiciones)
        sql += " ORDER BY fecha_hora DESC, id_seguimiento DESC"
        return [Seguimiento(**f) for f in self.db.execute(text(sql), params).mappings()]
