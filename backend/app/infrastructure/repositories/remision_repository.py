from contextlib import contextmanager

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from app.domain.entities.remision import DetalleRemision, InsumoEnviado, Remision
from app.domain.interfaces.remision_repository import IRemisionRepository
from app.infrastructure.database.sesion import fijar_responsable

# IMPORTANTE: la base de datos ya hace estas cosas sola con triggers, por eso aquí NO se hacen:
#   * trg_detalle_rem_total ......... recalcula tb_remision.total_prendas con el detalle
#                                     (costo_total es columna calculada).
#   * trg_iec_antes ................. pone cantidad_disponible = cantidad al registrar un insumo.
#   * trg_iec_marcar_remision ....... marca tb_remision.insumos_enviados = TRUE.
#   * trg_validar_estado_remision ... valida el flujo de estados y que el cliente esté activo.
#   * trg_seguimiento_remision ...... guarda el historial en tb_seguimiento_remision.
#   * trg_detalle_rem_validar ....... solo deja tocar el detalle mientras está Pendiente.

SELECT_REMISIONES = """
    SELECT r.id_remision, r.nit_cliente, c.nombre AS cliente,
           r.ficha_tecnica_nombre, r.ficha_tecnica_url,
           r.fecha_recibo, r.fecha_entrega, r.costo_prenda, r.total_prendas,
           r.costo_total, r.estado, r.insumos_enviados, r.observaciones
      FROM tb_remision r
      JOIN tb_clientes c ON c.nit = r.nit_cliente
"""

SELECT_DETALLES = text("""
    SELECT id_remision, id_detalle_de_remision, nombre_de_la_pieza, talla, cantidad
      FROM tb_detalle_rem
     WHERE id_remision IN :ids
     ORDER BY id_remision, nombre_de_la_pieza, talla
""").bindparams(bindparam("ids", expanding=True))

SELECT_INSUMOS = text("""
    SELECT id_insumo_enviado, id_remision, nombre, cantidad, cantidad_disponible, unidad
      FROM tb_insumos_enviados_x_cliente
     WHERE id_remision IN :ids
     ORDER BY id_remision, nombre
""").bindparams(bindparam("ids", expanding=True))

# Campo que llega desde la API -> columna real
CAMPOS_CABECERA = {
    "nit_cliente": "nit_cliente",
    "ficha_tecnica_nombre": "ficha_tecnica_nombre",
    "fecha_recibo": "fecha_recibo",
    "fecha_entrega": "fecha_entrega",
    "costo_prenda": "costo_prenda",
    "observaciones": "observaciones",
}


class RemisionRepository(IRemisionRepository):
    """Remisión + detalle + insumos del cliente se guardan en UNA sola transacción:
    o se guarda todo o no se guarda nada."""

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

    def _armar(self, filas) -> list[Remision]:
        remisiones = [
            Remision(**{**f, "costo_prenda": float(f["costo_prenda"]),
                        "costo_total": float(f["costo_total"])})
            for f in filas
        ]
        if not remisiones:
            return []
        por_id = {r.id_remision: r for r in remisiones}
        ids = {"ids": list(por_id)}
        for d in self.db.execute(SELECT_DETALLES, ids).mappings():
            por_id[d["id_remision"]].detalles.append(DetalleRemision(
                id_detalle_de_remision=d["id_detalle_de_remision"],
                nombre_de_la_pieza=d["nombre_de_la_pieza"],
                talla=d["talla"],
                cantidad=d["cantidad"],
            ))
        for i in self.db.execute(SELECT_INSUMOS, ids).mappings():
            por_id[i["id_remision"]].insumos.append(InsumoEnviado(**i))
        return remisiones

    def _insertar_detalles(self, id_remision: str, detalles: list[dict]) -> None:
        for d in detalles:
            self.db.execute(
                text("""
                    INSERT INTO tb_detalle_rem (id_remision, nombre_de_la_pieza, talla, cantidad)
                    VALUES (:rem, :pieza, :talla, :cantidad)
                """),
                {"rem": id_remision, "pieza": d["nombre_de_la_pieza"],
                 "talla": d["talla"], "cantidad": d["cantidad"]},
            )

    def _insertar_insumos(self, id_remision: str, insumos: list[dict]) -> None:
        for i in insumos:
            self.db.execute(
                text("""
                    INSERT INTO tb_insumos_enviados_x_cliente (id_remision, nombre, cantidad, unidad)
                    VALUES (:rem, :nombre, :cantidad, :unidad)
                """),
                {"rem": id_remision, "nombre": i["nombre"], "cantidad": i["cantidad"],
                 "unidad": i.get("unidad") or "Unidad"},
            )

    # ---------- consultas ----------
    def listar(self, estado: str | None = None, nit_cliente: str | None = None) -> list[Remision]:
        condiciones, params = [], {}
        if estado:
            condiciones.append("r.estado = :estado")
            params["estado"] = estado
        if nit_cliente:
            condiciones.append("r.nit_cliente = :nit")
            params["nit"] = nit_cliente
        sql = SELECT_REMISIONES
        if condiciones:
            sql += " WHERE " + " AND ".join(condiciones)
        sql += " ORDER BY r.fecha_recibo DESC, r.id_remision DESC"
        return self._armar(self.db.execute(text(sql), params).mappings().all())

    def obtener(self, id_remision: str) -> Remision | None:
        filas = self.db.execute(
            text(SELECT_REMISIONES + " WHERE r.id_remision = :id"), {"id": id_remision}
        ).mappings().all()
        remisiones = self._armar(filas)
        return remisiones[0] if remisiones else None

    def cliente_activo(self, nit: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_clientes WHERE nit = :nit AND estado = 'Activo')"),
            {"nit": nit},
        ).scalar())

    def tiene_produccion(self, id_remision: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM tb_produccion WHERE id_remision = :id)"),
            {"id": id_remision},
        ).scalar())

    # ---------- escritura ----------
    def crear(self, cabecera: dict, detalles: list[dict], insumos: list[dict],
              id_responsable: str | None) -> str:
        with self._transaccion():
            # Si la crea un empleado (admin), queda él como responsable en el historial.
            # Si no se indica, el trigger pone al cliente como responsable.
            if id_responsable:
                fijar_responsable(self.db, id_responsable)
            campos = [c for c in CAMPOS_CABECERA if cabecera.get(c) is not None]
            id_remision = self.db.execute(
                text(f"""
                    INSERT INTO tb_remision ({", ".join(CAMPOS_CABECERA[c] for c in campos)})
                    VALUES ({", ".join(f":{c}" for c in campos)})
                    RETURNING id_remision
                """),
                {c: cabecera[c] for c in campos},
            ).scalar_one()
            self._insertar_detalles(id_remision, detalles)
            self._insertar_insumos(id_remision, insumos)
        return id_remision

    def actualizar(self, id_remision: str, cabecera: dict, detalles: list[dict] | None,
                   insumos: list[dict] | None) -> None:
        """Edita la cabecera y, si llegan, REEMPLAZA el detalle y los insumos.

        Solo se usa mientras la remisión está Pendiente: en ese estado todavía no hay
        producción, así que nadie depende de las líneas viejas y se pueden recrear.
        """
        with self._transaccion():
            campos = [c for c in CAMPOS_CABECERA if c in cabecera and c != "nit_cliente"]
            if campos:
                params = {c: cabecera[c] for c in campos}
                params["id"] = id_remision
                self.db.execute(
                    text(f"""
                        UPDATE tb_remision
                           SET {", ".join(f"{CAMPOS_CABECERA[c]} = :{c}" for c in campos)}
                         WHERE id_remision = :id
                    """),
                    params,
                )
            if detalles is not None:
                self.db.execute(text("DELETE FROM tb_detalle_rem WHERE id_remision = :id"),
                                {"id": id_remision})
                self._insertar_detalles(id_remision, detalles)
            if insumos is not None:
                self.db.execute(
                    text("DELETE FROM tb_insumos_enviados_x_cliente WHERE id_remision = :id"),
                    {"id": id_remision},
                )
                self._insertar_insumos(id_remision, insumos)
                # El trigger solo marca TRUE al insertar; si quedó sin insumos se desmarca aquí.
                self.db.execute(
                    text("UPDATE tb_remision SET insumos_enviados = :hay WHERE id_remision = :id"),
                    {"hay": bool(insumos), "id": id_remision},
                )

    def cambiar_estado(self, id_remision: str, estado: str, id_responsable: str,
                       observaciones: str | None = None) -> None:
        with self._transaccion():
            fijar_responsable(self.db, id_responsable)
            if observaciones is not None:
                self.db.execute(
                    text("""UPDATE tb_remision SET estado = :estado, observaciones = :obs
                             WHERE id_remision = :id"""),
                    {"estado": estado, "obs": observaciones, "id": id_remision},
                )
            else:
                self.db.execute(
                    text("UPDATE tb_remision SET estado = :estado WHERE id_remision = :id"),
                    {"estado": estado, "id": id_remision},
                )

    def guardar_ficha_url(self, id_remision: str, url: str, nombre: str | None) -> None:
        with self._transaccion():
            self.db.execute(
                text("""UPDATE tb_remision
                           SET ficha_tecnica_url = :url,
                               ficha_tecnica_nombre = COALESCE(:nombre, ficha_tecnica_nombre)
                         WHERE id_remision = :id"""),
                {"url": url, "nombre": nombre, "id": id_remision},
            )

    def eliminar(self, id_remision: str) -> None:
        """El detalle, los insumos y el historial se borran en cascada (ON DELETE CASCADE)."""
        with self._transaccion():
            self.db.execute(text("DELETE FROM tb_remision WHERE id_remision = :id"),
                            {"id": id_remision})
