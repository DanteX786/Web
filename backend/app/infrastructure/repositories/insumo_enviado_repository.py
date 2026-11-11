from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.remision import InsumoEnviado
from app.domain.interfaces.insumo_enviado_repository import IInsumoEnviadoRepository

# La base de datos maneja sola:
#   * trg_iec_antes: al registrar, cantidad_disponible = cantidad; y nunca deja que
#     cantidad_disponible supere a cantidad.
#   * trg_iec_marcar_remision: marca tb_remision.insumos_enviados = TRUE.
#   * trg_detalle_produccion_stock: descuenta cantidad_disponible al asignar a producción.

SELECT_INSUMOS = """
    SELECT e.id_insumo_enviado, e.id_remision, e.nombre, e.cantidad,
           e.cantidad_disponible, e.unidad,
           c.nombre AS cliente, r.estado AS estado_remision
      FROM tb_insumos_enviados_x_cliente e
      JOIN tb_remision r ON r.id_remision = e.id_remision
      JOIN tb_clientes c ON c.nit = r.nit_cliente
"""


class InsumoEnviadoRepository(IInsumoEnviadoRepository):
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

    def listar(self, id_remision: str | None = None) -> list[InsumoEnviado]:
        sql, params = SELECT_INSUMOS, {}
        if id_remision:
            sql += " WHERE e.id_remision = :rem"
            params["rem"] = id_remision
        sql += " ORDER BY e.id_remision DESC, e.nombre"
        return [InsumoEnviado(**f) for f in self.db.execute(text(sql), params).mappings()]

    def obtener(self, id_insumo_enviado: str) -> InsumoEnviado | None:
        fila = self.db.execute(
            text(SELECT_INSUMOS + " WHERE e.id_insumo_enviado = :id"), {"id": id_insumo_enviado}
        ).mappings().first()
        return InsumoEnviado(**fila) if fila else None

    def estado_remision(self, id_remision: str) -> str | None:
        return self.db.execute(
            text("SELECT estado FROM tb_remision WHERE id_remision = :id"), {"id": id_remision}
        ).scalar()

    def usado_en_produccion(self, id_insumo_enviado: str) -> bool:
        return bool(self.db.execute(
            text("""SELECT EXISTS (SELECT 1 FROM tb_detalle_de_produccion
                                    WHERE id_insumos_enviados_x_cliente = :id)"""),
            {"id": id_insumo_enviado},
        ).scalar())

    def crear(self, id_remision: str, datos: dict) -> str:
        with self._transaccion():
            nuevo_id = self.db.execute(
                text("""
                    INSERT INTO tb_insumos_enviados_x_cliente (id_remision, nombre, cantidad, unidad)
                    VALUES (:rem, :nombre, :cantidad, :unidad)
                    RETURNING id_insumo_enviado
                """),
                {"rem": id_remision, "nombre": datos["nombre"], "cantidad": datos["cantidad"],
                 "unidad": datos.get("unidad") or "Unidad"},
            ).scalar_one()
        return nuevo_id

    def actualizar(self, id_insumo_enviado: str, datos: dict) -> None:
        """Si cambia la cantidad, lo disponible se mueve lo mismo (lo ya usado se respeta)."""
        with self._transaccion():
            self.db.execute(
                text("""
                    UPDATE tb_insumos_enviados_x_cliente
                       SET nombre = :nombre,
                           unidad = :unidad,
                           cantidad_disponible = cantidad_disponible + (:cantidad - cantidad),
                           cantidad = :cantidad
                     WHERE id_insumo_enviado = :id
                """),
                {"id": id_insumo_enviado, "nombre": datos["nombre"],
                 "unidad": datos["unidad"], "cantidad": datos["cantidad"]},
            )

    def eliminar(self, id_insumo_enviado: str) -> None:
        with self._transaccion():
            id_remision = self.db.execute(
                text("""DELETE FROM tb_insumos_enviados_x_cliente
                         WHERE id_insumo_enviado = :id RETURNING id_remision"""),
                {"id": id_insumo_enviado},
            ).scalar()
            # El trigger solo marca TRUE; si era el último insumo se desmarca la remisión.
            self.db.execute(
                text("""
                    UPDATE tb_remision r SET insumos_enviados = FALSE
                     WHERE r.id_remision = :rem AND r.insumos_enviados
                       AND NOT EXISTS (SELECT 1 FROM tb_insumos_enviados_x_cliente e
                                        WHERE e.id_remision = r.id_remision)
                """),
                {"rem": id_remision},
            )
