from contextlib import contextmanager
from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.entrega import Entrega, RemisionPorEntregar
from app.domain.interfaces.entrega_repository import IEntregaRepository
from app.infrastructure.database.sesion import fijar_responsable

# La base de datos hace sola (triggers de tb_remision_entrega):
#   * trg_entrega_validar: solo remisiones Terminadas, no pasarse del total de prendas,
#     y si no llega precio_total lo calcula = cantidad_entregada x costo_prenda.
#   * trg_entrega_cerrar_remision: cuando se entrega todo, la remisión pasa a "Entregada"
#     (por eso se fija el responsable antes de insertar: el cambio de estado queda en
#     el historial de seguimiento).
#   * ck_entrega_pagada: no deja marcar "Pagada" sin comprobante.

SELECT_ENTREGAS = """
    SELECT en.id_entrega, en.id_remision, r.nit_cliente, c.nombre AS cliente,
           en.cantidad_entregada, en.precio_total, en.fecha_finalizacion,
           en.remision_firmada_url, en.comprobante_pago_url, en.estado
      FROM tb_remision_entrega en
      JOIN tb_remision r ON r.id_remision = en.id_remision
      JOIN tb_clientes c ON c.nit = r.nit_cliente
"""

# Solo estas columnas se pueden actualizar con guardar_url (evita SQL armado con texto libre)
CAMPOS_URL = {"remision_firmada_url", "comprobante_pago_url"}


class EntregaRepository(IEntregaRepository):
    def __init__(self, db: Session):
        self.db = db

    @contextmanager
    def _transaccion(self):
        try:
            yield
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    @staticmethod
    def _entrega(f) -> Entrega:
        return Entrega(**{**f, "precio_total": float(f["precio_total"])})

    def listar(self, estado: str | None = None, id_remision: str | None = None) -> list[Entrega]:
        condiciones, params = [], {}
        if estado:
            condiciones.append("en.estado = :estado")
            params["estado"] = estado
        if id_remision:
            condiciones.append("en.id_remision = :rem")
            params["rem"] = id_remision
        sql = SELECT_ENTREGAS
        if condiciones:
            sql += " WHERE " + " AND ".join(condiciones)
        sql += " ORDER BY en.fecha_finalizacion DESC, en.id_entrega DESC"
        return [self._entrega(f) for f in self.db.execute(text(sql), params).mappings()]

    def obtener(self, id_entrega: str) -> Entrega | None:
        fila = self.db.execute(
            text(SELECT_ENTREGAS + " WHERE en.id_entrega = :id"), {"id": id_entrega}
        ).mappings().first()
        return self._entrega(fila) if fila else None

    def remisiones_por_entregar(self) -> list[RemisionPorEntregar]:
        sql = """
            SELECT r.id_remision, r.nit_cliente, c.nombre AS cliente, r.ficha_tecnica_nombre,
                   r.total_prendas, r.costo_prenda, r.costo_total, r.fecha_entrega
              FROM tb_remision r
              JOIN tb_clientes c ON c.nit = r.nit_cliente
             WHERE r.estado = 'Terminada'
               AND NOT EXISTS (SELECT 1 FROM tb_remision_entrega e WHERE e.id_remision = r.id_remision)
             ORDER BY r.fecha_entrega NULLS LAST, r.id_remision
        """
        return [
            RemisionPorEntregar(**{**f, "costo_prenda": float(f["costo_prenda"]),
                                   "costo_total": float(f["costo_total"])})
            for f in self.db.execute(text(sql)).mappings()
        ]

    def existe_entrega_de(self, id_remision: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_remision_entrega WHERE id_remision = :id)"),
            {"id": id_remision},
        ).scalar())

    def crear(self, id_remision: str, cantidad: int, fecha: date | None,
              precio_total: float | None, id_responsable: str) -> str:
        with self._transaccion():
            fijar_responsable(self.db, id_responsable)
            nuevo_id = self.db.execute(
                text("""
                    INSERT INTO tb_remision_entrega
                           (id_remision, cantidad_entregada, precio_total, fecha_finalizacion)
                    VALUES (:rem, :cantidad, :precio, COALESCE(:fecha, CURRENT_DATE))
                    RETURNING id_entrega
                """),
                {"rem": id_remision, "cantidad": cantidad, "precio": precio_total, "fecha": fecha},
            ).scalar_one()
        return nuevo_id

    def actualizar(self, id_entrega: str, datos: dict) -> None:
        campos = [c for c in ("fecha_finalizacion", "precio_total") if c in datos]
        if not campos:
            return
        with self._transaccion():
            params = {c: datos[c] for c in campos}
            params["id"] = id_entrega
            self.db.execute(
                text(f"""UPDATE tb_remision_entrega
                            SET {", ".join(f"{c} = :{c}" for c in campos)}
                          WHERE id_entrega = :id"""),
                params,
            )

    def guardar_url(self, id_entrega: str, campo: str, url: str) -> None:
        if campo not in CAMPOS_URL:
            raise ValueError(f"Campo no permitido: {campo}")
        with self._transaccion():
            self.db.execute(
                text(f"UPDATE tb_remision_entrega SET {campo} = :url WHERE id_entrega = :id"),
                {"url": url, "id": id_entrega},
            )

    def marcar_pagada(self, id_entrega: str) -> None:
        with self._transaccion():
            self.db.execute(
                text("UPDATE tb_remision_entrega SET estado = 'Pagada' WHERE id_entrega = :id"),
                {"id": id_entrega},
            )
