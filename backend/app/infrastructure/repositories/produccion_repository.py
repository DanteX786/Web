from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.produccion import (
    Asignacion, EmpleadoDisponibilidad, FaltantePaso, LineaRemision, MaquinaDisponibilidad, NuevaAsignacion,
    NuevoPaso, PasoProduccion, Produccion, RemisionDisponible, SeguimientoProduccion,
)
from app.domain.interfaces.produccion_repository import IProduccionRepository
from app.infrastructure.database.produccion_models import DetalleProduccionModel, ProduccionModel
from app.infrastructure.database.sesion import fijar_responsable

# Tarea con su avance + los ids necesarios para editarla
_SQL_ASIGNACIONES = """
    SELECT a.id_detalle_de_produccion, a.id_produccion, a.id_remision, a.estado_produccion,
           a.id_empleado, a.empleado,
           d.id_tipo_pieza, a.pieza,
           d.id_tipo_maquina, a.maquina,
           d.id_detalle_de_remision, a.prenda, a.talla,
           d.id_insumos, d.id_insumos_enviados_x_cliente, d.cantidad_insumo,
           a.cantidad_asignada, a.cantidad_realizada, a.cantidad_pendiente, a.fecha_asignada,
           a.id_proceso, a.proceso, a.id_paso, a.paso
      FROM vw_asignaciones a
      JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
"""


# Prendas terminadas por talla: una prenda está completa cuando pasó por TODOS los
# pasos de la producción. Se toma el menor avance entre esos pasos (un paso sin
# tareas cuenta 0) sin pasar de las unidades pedidas de la talla.
_SQL_TERMINADAS_POR_TALLA = """
    WITH requeridos AS (      -- cada talla x cada paso de la producción
        SELECT p.id_produccion, dr.id_detalle_de_remision, dr.cantidad, ps.id_paso
          FROM tb_produccion p
          JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision
          JOIN tb_pasos_produccion ps ON ps.id_produccion = p.id_produccion
    ), por_pieza AS (         -- lo hecho en cada paso y pieza de la talla
        SELECT d.id_produccion, d.id_detalle_de_remision, d.id_paso, d.id_tipo_pieza,
               sum(a.cantidad_realizada) AS realizado
          FROM tb_detalle_de_produccion d
          JOIN vw_asignaciones a USING (id_detalle_de_produccion)
         WHERE d.id_paso IS NOT NULL
         GROUP BY d.id_produccion, d.id_detalle_de_remision, d.id_paso, d.id_tipo_pieza
    ), por_paso AS (          -- un paso va tan avanzado como su pieza más atrasada
        SELECT id_produccion, id_detalle_de_remision, id_paso, min(realizado) AS realizado
          FROM por_pieza
         GROUP BY id_produccion, id_detalle_de_remision, id_paso
    )
    SELECT r.id_produccion, r.id_detalle_de_remision,
           LEAST(min(COALESCE(pp.realizado, 0)), r.cantidad)::int AS terminadas
      FROM requeridos r
      LEFT JOIN por_paso pp USING (id_produccion, id_detalle_de_remision, id_paso)
     GROUP BY r.id_produccion, r.id_detalle_de_remision, r.cantidad
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
        sql += " ORDER BY fecha_estado DESC, id_produccion DESC"
        producciones = [Produccion(**fila) for fila in self.db.execute(text(sql), params).mappings()]
        terminadas = self._prendas_terminadas()
        for p in producciones:
            p.prendas_terminadas = terminadas.get(p.id_produccion, 0)
        return producciones

    def obtener(self, id_produccion: str) -> Produccion | None:
        fila = self.db.execute(
            text("SELECT * FROM vw_avance_produccion WHERE id_produccion = :id"), {"id": id_produccion}
        ).mappings().first()
        if not fila:
            return None
        produccion = Produccion(**fila)
        produccion.prendas_terminadas = self._prendas_terminadas(id_produccion).get(id_produccion, 0)
        return produccion

    def _prendas_terminadas(self, id_produccion: str | None = None) -> dict[str, int]:
        """Total de prendas completas por producción (suma de sus tallas)."""
        sql = f"SELECT id_produccion, sum(terminadas)::int AS total FROM ({_SQL_TERMINADAS_POR_TALLA}) t"
        params = {}
        if id_produccion:
            sql += " WHERE id_produccion = :id"
            params["id"] = id_produccion
        sql += " GROUP BY id_produccion"
        return {f["id_produccion"]: f["total"] for f in self.db.execute(text(sql), params).mappings()}

    def remisiones_disponibles(self) -> list[RemisionDisponible]:
        sql = """
            SELECT r.id_remision, c.nombre AS cliente, r.ficha_tecnica_nombre,
                   r.total_prendas, r.fecha_entrega
              FROM tb_remision r
              JOIN tb_clientes c ON c.nit = r.nit_cliente
             WHERE r.estado = 'Aprobada'
               AND NOT EXISTS (SELECT 1 FROM tb_produccion p WHERE p.id_remision = r.id_remision)
             ORDER BY r.fecha_recibo, r.id_remision
        """
        return [RemisionDisponible(**fila) for fila in self.db.execute(text(sql)).mappings()]

    def produccion_de_remision(self, id_remision: str) -> str | None:
        return self.db.execute(
            text("SELECT id_produccion FROM tb_produccion WHERE id_remision = :id"), {"id": id_remision}
        ).scalar()

    def lineas_remision(self, id_produccion: str) -> list[LineaRemision]:
        # Tallas de la remisión con lo asignado y lo hecho (sumando todas sus tareas)
        sql = """
            SELECT dr.id_detalle_de_remision, dr.nombre_de_la_pieza, dr.talla, dr.cantidad,
                   COALESCE(sum(a.cantidad_asignada), 0)::int AS total_asignado,
                   COALESCE(sum(a.cantidad_realizada), 0)::int AS total_realizado
              FROM tb_produccion p
              JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision
              LEFT JOIN tb_detalle_de_produccion d
                     ON d.id_produccion = p.id_produccion
                    AND d.id_detalle_de_remision = dr.id_detalle_de_remision
              LEFT JOIN vw_asignaciones a ON a.id_detalle_de_produccion = d.id_detalle_de_produccion
             WHERE p.id_produccion = :id
             GROUP BY dr.id_detalle_de_remision
             ORDER BY dr.nombre_de_la_pieza, dr.id_detalle_de_remision
        """
        lineas = [LineaRemision(**f) for f in self.db.execute(text(sql), {"id": id_produccion}).mappings()]
        terminadas = {
            f["id_detalle_de_remision"]: f["terminadas"]
            for f in self.db.execute(
                text(f"SELECT * FROM ({_SQL_TERMINADAS_POR_TALLA}) t WHERE id_produccion = :id"), {"id": id_produccion}
            ).mappings()
        }
        for linea in lineas:
            linea.terminadas = terminadas.get(linea.id_detalle_de_remision, 0)
        return lineas

    def crear(self, id_remision: str, id_responsable: str) -> str:
        # Crear la producción cambia la remisión a "En producción" y escribe el
        # seguimiento (triggers): por eso se fija el responsable en la misma transacción.
        fijar_responsable(self.db, id_responsable)
        fecha_entrega = self.db.execute(
            text("SELECT fecha_entrega FROM tb_remision WHERE id_remision = :id"), {"id": id_remision}
        ).scalar()
        m = ProduccionModel(id_remision=id_remision, fecha_entrega=fecha_entrega)
        self.db.add(m)
        self.db.flush()
        nuevo_id = m.id_produccion
        self.db.commit()
        return nuevo_id

    def cambiar_estado(self, id_produccion: str, estado: str, id_responsable: str) -> None:
        # Iniciar / finalizar: el trigger valida el cambio y guarda el seguimiento.
        # Finalizar además deja la remisión "Terminada".
        fijar_responsable(self.db, id_responsable)
        m = self.db.get(ProduccionModel, id_produccion)
        m.estado = estado
        self.db.commit()

    def seguimiento(self, id_produccion: str) -> list[SeguimientoProduccion]:
        sql = """
            SELECT * FROM vw_seguimiento_produccion
             WHERE id_produccion = :id
             ORDER BY fecha_hora, id_seguimiento_produccion
        """
        return [SeguimientoProduccion(**f) for f in self.db.execute(text(sql), {"id": id_produccion}).mappings()]

    def pasos(self, id_produccion: str) -> list[PasoProduccion]:
        sql = """
            SELECT ps.id_paso, ps.id_proceso, ps.proceso, ps.descripcion, ps.paso,
                   COALESCE(array_agg(pm.id_maquina ORDER BY pm.id_maquina)
                            FILTER (WHERE pm.id_maquina IS NOT NULL), '{}') AS maquinas
              FROM vw_pasos_produccion ps
              LEFT JOIN tb_proceso_x_maquina pm ON pm.id_proceso = ps.id_proceso
             WHERE ps.id_produccion = :id
             GROUP BY ps.id_paso, ps.id_proceso, ps.proceso, ps.descripcion, ps.paso
             ORDER BY ps.id_paso
        """
        return [PasoProduccion(**{**f, "maquinas": list(f["maquinas"])})
                for f in self.db.execute(text(sql), {"id": id_produccion}).mappings()]

    def guardar_pasos(self, id_produccion: str, pasos: list[NuevoPaso]) -> None:
        # Todo en una transacción: si un trigger rechaza (ej. quitar un paso con tareas), no cambia nada
        try:
            conservar = [p.id_paso for p in pasos if p.id_paso]
            self.db.execute(
                text("DELETE FROM tb_pasos_produccion WHERE id_produccion = :id AND NOT (id_paso = ANY(:ids))"),
                {"id": id_produccion, "ids": conservar},
            )
            for paso in pasos:
                if paso.id_paso:
                    self.db.execute(
                        text("UPDATE tb_pasos_produccion SET descripcion = :desc "
                             "WHERE id_paso = :paso AND id_produccion = :id"),
                        {"desc": paso.descripcion, "paso": paso.id_paso, "id": id_produccion},
                    )
                else:
                    self.db.execute(
                        text("INSERT INTO tb_pasos_produccion (id_produccion, id_proceso, descripcion) "
                             "VALUES (:id, :proceso, :desc)"),
                        {"id": id_produccion, "proceso": paso.id_proceso, "desc": paso.descripcion},
                    )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def faltantes(self, id_produccion: str) -> list[FaltantePaso]:
        sql = """
            SELECT id_detalle_de_remision, nombre_de_la_pieza, talla, id_paso, paso, cantidad, asignado
              FROM vw_produccion_faltantes
             WHERE id_produccion = :id
             ORDER BY nombre_de_la_pieza, id_detalle_de_remision, id_paso
        """
        return [FaltantePaso(**f) for f in self.db.execute(text(sql), {"id": id_produccion}).mappings()]

    def maquinas(self) -> list[MaquinaDisponibilidad]:
        sql = "SELECT * FROM vw_maquinas_disponibilidad WHERE estado = 'Activo' ORDER BY nombre"
        return [MaquinaDisponibilidad(**f) for f in self.db.execute(text(sql)).mappings()]

    def empleados(self) -> list[EmpleadoDisponibilidad]:
        sql = "SELECT * FROM vw_empleados_disponibilidad ORDER BY nombre"
        return [EmpleadoDisponibilidad(**f) for f in self.db.execute(text(sql)).mappings()]

    # ------------------------------------------------------------------ Tareas
    def listar_asignaciones(self, id_produccion: str | None = None, id_empleado: str | None = None,
                            solo_en_produccion: bool = False) -> list[Asignacion]:
        condiciones, params = [], {}
        if id_produccion:
            condiciones.append("a.id_produccion = :id_produccion")
            params["id_produccion"] = id_produccion
        if id_empleado:
            condiciones.append("a.id_empleado = :id_empleado")
            params["id_empleado"] = id_empleado
        if solo_en_produccion:
            condiciones.append("a.estado_produccion = 'En producción'")
        sql = _SQL_ASIGNACIONES
        if condiciones:
            sql += " WHERE " + " AND ".join(condiciones)
        sql += " ORDER BY a.talla, a.paso, a.fecha_asignada DESC, a.id_detalle_de_produccion"
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
