from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.seguimiento import Seguimiento
from app.domain.interfaces.seguimiento_repository import ISeguimientoRepository

# Historial + cliente dueño de la remisión
_SQL = """
    SELECT s.id_seguimiento, s.id_remision, s.estado_anterior, s.estado_nuevo,
           s.responsable, s.tipo_responsable, s.fecha_hora, c.nombre AS cliente
      FROM vw_seguimiento_remision s
      JOIN tb_remision r ON r.id_remision = s.id_remision
      LEFT JOIN tb_clientes c ON c.nit = r.nit_cliente
"""


class SeguimientoRepository(ISeguimientoRepository):
    """Solo lectura: los registros los crea el trigger de tb_remision automáticamente."""

    def __init__(self, db: Session):
        self.db = db

    def existe_remision(self, id_remision: str, nit_cliente: str | None = None) -> bool:
        sql = "SELECT EXISTS (SELECT 1 FROM tb_remision WHERE id_remision = :id"
        params = {"id": id_remision}
        if nit_cliente:
            sql += " AND nit_cliente = :nit"
            params["nit"] = nit_cliente
        return bool(self.db.execute(text(sql + ")"), params).scalar())

    def listar_por_remision(self, id_remision: str) -> list[Seguimiento]:
        sql = _SQL + " WHERE s.id_remision = :id ORDER BY s.fecha_hora, s.id_seguimiento"
        return [Seguimiento(**f) for f in self.db.execute(text(sql), {"id": id_remision}).mappings()]

    def listar(self, estado_nuevo: str | None = None, desde: date | None = None,
               hasta: date | None = None, nit_cliente: str | None = None) -> list[Seguimiento]:
        condiciones, params = [], {}
        if estado_nuevo:
            condiciones.append("s.estado_nuevo = :estado")
            params["estado"] = estado_nuevo
        if desde:
            condiciones.append("s.fecha_hora::date >= :desde")
            params["desde"] = desde
        if hasta:
            condiciones.append("s.fecha_hora::date <= :hasta")
            params["hasta"] = hasta
        if nit_cliente:
            condiciones.append("r.nit_cliente = :nit")
            params["nit"] = nit_cliente
        sql = _SQL
        if condiciones:
            sql += " WHERE " + " AND ".join(condiciones)
        sql += " ORDER BY s.fecha_hora DESC, s.id_seguimiento DESC"
        return [Seguimiento(**f) for f in self.db.execute(text(sql), params).mappings()]
