from contextlib import contextmanager

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.domain.entities.compra import Compra, DetalleCompra
from app.domain.interfaces.compra_repository import ICompraRepository

# IMPORTANTE: la base de datos ya hace dos cosas solas con el trigger
# trg_detalle_compra_stock de tb_detalle_compras:
#   1. Suma / resta el stock de tb_insumos al insertar, editar o borrar una línea
#      (y rechaza la operación si lo comprado ya se usó en producción).
#   2. Recalcula tb_compras.total_compra (la columna subtotal se calcula sola).
# Por eso este repositorio NO toca el stock ni el total: si lo hiciera, se sumaría dos veces.

SELECT_COMPRAS = """
    SELECT c.id_compras AS id, c.fecha_compra AS fecha, c.id_proveedor,
           p.nombre AS nombre_proveedor, c.descripcion, c.total_compra AS total
      FROM tb_compras c
      LEFT JOIN proveedores p ON p.id_proveedores = c.id_proveedor
"""

SELECT_DETALLES = text("""
    SELECT d.id_compras AS id_compra, d.id_insumos AS id_insumo, i.nombre AS nombre_insumo,
           d.cantidad, d.valor_unitario
      FROM tb_detalle_compras d
      LEFT JOIN tb_insumos i ON i.id_insumos = d.id_insumos
     WHERE d.id_compras IN :ids
     ORDER BY d.id_compras, i.nombre
""").bindparams(bindparam("ids", expanding=True))

CAMPOS_CABECERA = {
    "fecha": "fecha_compra",
    "id_proveedor": "id_proveedor",
    "descripcion": "descripcion",
}


class CompraRepository(ICompraRepository):
    """Las operaciones que tocan la compra y su detalle se hacen en una sola
    transacción: o se guarda todo o no se guarda nada."""

    def __init__(self, db: Session):
        self.db = db

    # ---------- utilidades internas ----------
    @contextmanager
    def _transaccion(self):
        try:
            yield
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def _con_detalles(self, filas) -> list[Compra]:
        compras = [Compra(**{**f, "total": float(f["total"])}, detalles=[]) for f in filas]
        if not compras:
            return []
        por_id = {c.id: c for c in compras}
        for d in self.db.execute(SELECT_DETALLES, {"ids": list(por_id)}).mappings():
            por_id[d["id_compra"]].detalles.append(DetalleCompra(
                id_insumo=d["id_insumo"],
                nombre_insumo=d["nombre_insumo"],
                cantidad=d["cantidad"],
                valor_unitario=float(d["valor_unitario"]),
            ))
        return compras

    def _insertar_detalle(self, id_compra: str, d: dict) -> None:
        self.db.execute(
            text("""
                INSERT INTO tb_detalle_compras (id_compras, id_insumos, cantidad, valor_unitario)
                VALUES (:compra, :insumo, :cantidad, :valor)
            """),
            {"compra": id_compra, "insumo": d["id_insumo"],
             "cantidad": d["cantidad"], "valor": d["valor_unitario"]},
        )

    # ---------- consultas ----------
    def listar(self, id_proveedor: str | None = None) -> list[Compra]:
        sql = SELECT_COMPRAS
        params = {}
        if id_proveedor:
            sql += " WHERE c.id_proveedor = :proveedor"
            params["proveedor"] = id_proveedor
        sql += " ORDER BY c.fecha_compra DESC, c.id_compras DESC"
        return self._con_detalles(self.db.execute(text(sql), params).mappings().all())

    def obtener(self, id_compra: str) -> Compra | None:
        filas = self.db.execute(
            text(SELECT_COMPRAS + " WHERE c.id_compras = :id"), {"id": id_compra}
        ).mappings().all()
        compras = self._con_detalles(filas)
        return compras[0] if compras else None

    def existe_proveedor(self, id_proveedor: str) -> bool:
        """Solo cuenta proveedores activos (igual que el trigger trg_compra_proveedor_activo)."""
        return bool(self.db.execute(
            text("""SELECT EXISTS (SELECT 1 FROM proveedores
                                    WHERE id_proveedores = :id AND estado = 'Activo')"""),
            {"id": id_proveedor},
        ).scalar())

    def insumos_inexistentes(self, ids_insumos: list[str]) -> list[str]:
        if not ids_insumos:
            return []
        existentes = set(self.db.execute(
            text("SELECT id_insumos FROM tb_insumos WHERE id_insumos IN :ids")
            .bindparams(bindparam("ids", expanding=True)),
            {"ids": ids_insumos},
        ).scalars())
        return [i for i in ids_insumos if i not in existentes]

    # ---------- escritura ----------
    def crear(self, cabecera: dict, detalles: list[dict]) -> Compra:
        with self._transaccion():
            campos = [c for c in CAMPOS_CABECERA if c in cabecera]
            id_compra = self.db.execute(
                text(f"""
                    INSERT INTO tb_compras ({", ".join(CAMPOS_CABECERA[c] for c in campos)})
                    VALUES ({", ".join(f":{c}" for c in campos)})
                    RETURNING id_compras
                """),
                {c: cabecera[c] for c in campos},
            ).scalar_one()
            for d in detalles:
                self._insertar_detalle(id_compra, d)
        return self.obtener(id_compra)

    def actualizar_cabecera(self, id_compra: str, datos: dict) -> Compra | None:
        campos = [c for c in CAMPOS_CABECERA if c in datos]
        if campos:
            with self._transaccion():
                params = {c: datos[c] for c in campos}
                params["id"] = id_compra
                self.db.execute(
                    text(f"""
                        UPDATE tb_compras
                           SET {", ".join(f"{CAMPOS_CABECERA[c]} = :{c}" for c in campos)}
                         WHERE id_compras = :id
                    """),
                    params,
                )
        return self.obtener(id_compra)

    def agregar_detalle(self, id_compra: str, detalle: dict) -> Compra:
        with self._transaccion():
            self._insertar_detalle(id_compra, detalle)
        return self.obtener(id_compra)

    def reemplazar_detalle(self, id_compra: str, id_insumo_actual: str, detalle: dict) -> Compra:
        """Cambia insumo, cantidad o valor de una línea. El trigger devuelve el stock
        de lo anterior y suma el de lo nuevo."""
        with self._transaccion():
            self.db.execute(
                text("""
                    UPDATE tb_detalle_compras
                       SET id_insumos = :insumo, cantidad = :cantidad, valor_unitario = :valor
                     WHERE id_compras = :compra AND id_insumos = :actual
                """),
                {"compra": id_compra, "actual": id_insumo_actual, "insumo": detalle["id_insumo"],
                 "cantidad": detalle["cantidad"], "valor": detalle["valor_unitario"]},
            )
        return self.obtener(id_compra)

    def eliminar_detalle(self, id_compra: str, id_insumo: str) -> Compra:
        with self._transaccion():
            self.db.execute(
                text("DELETE FROM tb_detalle_compras WHERE id_compras = :compra AND id_insumos = :insumo"),
                {"compra": id_compra, "insumo": id_insumo},
            )
        return self.obtener(id_compra)

    def eliminar(self, id_compra: str) -> bool:
        """Primero se borran las líneas (el trigger descuenta el stock) y luego la compra."""
        with self._transaccion():
            self.db.execute(
                text("DELETE FROM tb_detalle_compras WHERE id_compras = :id"), {"id": id_compra}
            )
            fila = self.db.execute(
                text("DELETE FROM tb_compras WHERE id_compras = :id RETURNING id_compras"),
                {"id": id_compra},
            ).first()
        return fila is not None
