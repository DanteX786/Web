from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.produccion import (
    Asignacion, LineaRemision, NuevaAsignacion, Produccion, RemisionDisponible,
)
from app.domain.interfaces.produccion_repository import IProduccionRepository
from app.infrastructure.database.produccion_models import DetalleProduccionModel, ProduccionModel
from app.infrastructure.database.sesion import fijar_responsable

# Asignación con su avance + los ids necesarios para editarla
_SQL_ASIGNACIONES = """
    SELECT a.id_detalle_de_produccion, a.id_produccion, a.id_remision, a.estado_produccion,
           a.id_empleado, a.empleado,
           d.id_tipo_pieza, a.pieza,
           d.id_tipo_maquina, a.maquina,
           d.id_detalle_de_remision, a.prenda, a.talla,
           d.id_insumos, d.id_insumos_enviados_x_cliente, d.cantidad_insumo,
           a.cantidad_asignada, a.cantidad_realizada, a.cantidad_pendiente, a.fecha_asignada
      FROM vw_asignaciones a
      JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
"""


class ProduccionRepository(IProduccionRepository):
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------ Producción
    def listar(self, estado: str | None = None) -> list[Produccion]:
        sql = "SELECT * FROM vw_avance_produccion"
        params = {}
        if estado:
            sql += " WHERE estado = :estado"
            params["estado"] = estado
        sql += " ORDER BY fecha_inicio DESC, id_produccion DESC"
        return [Produccion(**fila) for fila in self.db.execute(text(sql), params).mappings()]

    def obtener(self, id_produccion: str) -> Produccion | None:
        fila = self.db.execute(
            text("SELECT * FROM vw_avance_produccion WHERE id_produccion = :id"), {"id": id_produccion}
        ).mappings().first()
        return Produccion(**fila) if fila else None

    def remisiones_disponibles(self) -> list[RemisionDisponible]:
        sql = """
            SELECT r.id_remision, c.nombre AS cliente, r.ficha_tecnica_nombre,
                   r.total_prendas, r.fecha_entrega
              FROM tb_remision r
              JOIN tb_clientes c ON c.nit = r.nit_cliente
             WHERE r.estado = 'Aprobada'
             ORDER BY r.fecha_recibo, r.id_remision
        """
        return [RemisionDisponible(**fila) for fila in self.db.execute(text(sql)).mappings()]

    def lineas_remision(self, id_produccion: str) -> list[LineaRemision]:
        sql = """
            SELECT dr.id_detalle_de_remision, dr.nombre_de_la_pieza, dr.talla, dr.cantidad
              FROM tb_produccion p
              JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision
             WHERE p.id_produccion = :id
             ORDER BY dr.nombre_de_la_pieza, dr.talla
        """
        return [LineaRemision(**f) for f in self.db.execute(text(sql), {"id": id_produccion}).mappings()]

    def crear(self, id_remision: str, fecha_entrega: date | None, id_responsable: str) -> str:
        # Crear la producción cambia la remisión a "En producción" (trigger),
        # por eso se fija el responsable en la misma transacción.
        fijar_responsable(self.db, id_responsable)
        m = ProduccionModel(id_remision=id_remision, fecha_entrega=fecha_entrega)
        self.db.add(m)
        self.db.flush()
        nuevo_id = m.id_produccion
        self.db.commit()
        return nuevo_id

    def finalizar(self, id_produccion: str, id_responsable: str) -> None:
        # Finalizar cambia la remisión a "Terminada" (trigger)
        fijar_responsable(self.db, id_responsable)
        m = self.db.get(ProduccionModel, id_produccion)
        m.estado = "Finalizada"
        self.db.commit()

    # ------------------------------------------------------------------ Asignaciones
    def listar_asignaciones(self, id_produccion: str | None = None, id_empleado: str | None = None,
                            solo_en_proceso: bool = False) -> list[Asignacion]:
        condiciones, params = [], {}
        if id_produccion:
            condiciones.append("a.id_produccion = :id_produccion")
            params["id_produccion"] = id_produccion
        if id_empleado:
            condiciones.append("a.id_empleado = :id_empleado")
            params["id_empleado"] = id_empleado
        if solo_en_proceso:
            condiciones.append("a.estado_produccion = 'En proceso'")
        sql = _SQL_ASIGNACIONES
        if condiciones:
            sql += " WHERE " + " AND ".join(condiciones)
        sql += " ORDER BY a.fecha_asignada DESC, a.id_detalle_de_produccion"
        return [Asignacion(**fila) for fila in self.db.execute(text(sql), params).mappings()]

    def obtener_asignacion(self, id_detalle: str) -> Asignacion | None:
        fila = self.db.execute(
            text(_SQL_ASIGNACIONES + " WHERE a.id_detalle_de_produccion = :id"), {"id": id_detalle}
        ).mappings().first()
        return Asignacion(**fila) if fila else None

    def crear_asignacion(self, id_produccion: str, datos: NuevaAsignacion) -> str:
        m = DetalleProduccionModel(id_produccion=id_produccion, **vars(datos))
        self.db.add(m)
        self.db.flush()
        nuevo_id = m.id_detalle_de_produccion
        self.db.commit()
        return nuevo_id

    def actualizar_asignacion(self, id_detalle: str, datos: NuevaAsignacion) -> None:
        m = self.db.get(DetalleProduccionModel, id_detalle)
        for campo, valor in vars(datos).items():
            setattr(m, campo, valor)
        self.db.commit()

    def eliminar_asignacion(self, id_detalle: str) -> None:
        m = self.db.get(DetalleProduccionModel, id_detalle)
        self.db.delete(m)
        self.db.commit()
