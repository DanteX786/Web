from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.produccion import (
    Asignacion, EmpleadoDisponibilidad, FaltantePaso, LineaRemision, MaquinaDisponibilidad, NuevaAsignacion,
    InsumoReproceso, NuevoPaso, NuevoReproceso, PasoProduccion, PiezaDefectuosa, Produccion, RemisionDisponible,
    Reproceso, ReprocesoTalla, SeguimientoProduccion,
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
           a.id_proceso, a.proceso, a.id_paso, a.paso, a.cantidad_defectuosa, a.id_reproceso
      FROM vw_asignaciones a
      JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
"""


# Prendas terminadas por talla (producción normal + recuperadas en reprocesos): vista vw_terminadas_por_talla


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
        self._completar(producciones)
        return producciones

    def obtener(self, id_produccion: str) -> Produccion | None:
        fila = self.db.execute(
            text("SELECT * FROM vw_avance_produccion WHERE id_produccion = :id"), {"id": id_produccion}
        ).mappings().first()
        if not fila:
            return None
        produccion = Produccion(**fila)
        self._completar([produccion], id_produccion)
        return produccion

    def _completar(self, producciones: list[Produccion], id_produccion: str | None = None) -> None:
        """Prendas terminadas, defectuosas por reprocesar y si tiene un reproceso abierto."""
        filtro, params = ("WHERE id_produccion = :id", {"id": id_produccion}) if id_produccion else ("", {})
        terminadas = {f["id_produccion"]: f["total"] for f in self.db.execute(text(
            f"SELECT id_produccion, sum(terminadas)::int AS total FROM vw_terminadas_por_talla {filtro} GROUP BY id_produccion"
        ), params).mappings()}
        disponibles = {f["id_produccion"]: f["total"] for f in self.db.execute(text(
            f"SELECT id_produccion, sum(GREATEST(defectuosas - en_reproceso, 0))::int AS total "
            f"FROM vw_defectuosas_por_talla {filtro} GROUP BY id_produccion"
        ), params).mappings()}
        activos = {f["id_produccion"] for f in self.db.execute(text(
            f"SELECT id_produccion FROM vw_reprocesos WHERE situacion IN ('Por asignar', 'En curso') "
            f"{'AND id_produccion = :id' if id_produccion else ''}"
        ), params).mappings()}
        for p in producciones:
            p.prendas_terminadas = terminadas.get(p.id_produccion, 0)
            p.defectuosas_disponibles = disponibles.get(p.id_produccion, 0)
            p.reproceso_activo = p.id_produccion in activos

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
                   COALESCE(sum(a.cantidad_realizada), 0)::int AS total_realizado,
                   COALESCE(sum(a.cantidad_defectuosa), 0)::int AS total_defectuoso
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
            f["id_detalle_de_remision"]: f
            for f in self.db.execute(
                text("SELECT * FROM vw_terminadas_por_talla WHERE id_produccion = :id"), {"id": id_produccion}
            ).mappings()
        }
        disponibles = {
            f["id_detalle_de_remision"]: max(f["defectuosas"] - f["en_reproceso"], 0)
            for f in self.db.execute(
                text("SELECT * FROM vw_defectuosas_por_talla WHERE id_produccion = :id"), {"id": id_produccion}
            ).mappings()
        }
        for linea in lineas:
            t = terminadas.get(linea.id_detalle_de_remision)
            linea.terminadas = t["terminadas"] if t else 0
            linea.recuperadas = t["recuperadas"] if t else 0
            linea.defectuosas_disponibles = disponibles.get(linea.id_detalle_de_remision, 0)
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

    def pasos(self, id_produccion: str, id_reproceso: str | None = None,
              todos: bool = False) -> list[PasoProduccion]:
        """Pasos de la producción normal (por defecto), de un reproceso, o todos (todos=True)."""
        if todos:
            filtro, params = "", {"id": id_produccion}
        elif id_reproceso:
            filtro, params = "AND ps.id_reproceso = :rep", {"id": id_produccion, "rep": id_reproceso}
        else:
            filtro, params = "AND ps.id_reproceso IS NULL", {"id": id_produccion}
        sql = f"""
            SELECT ps.id_paso, ps.id_proceso, ps.proceso, ps.descripcion, ps.paso, ps.id_reproceso, ps.veces,
                   COALESCE(array_agg(pm.id_maquina ORDER BY pm.id_maquina)
                            FILTER (WHERE pm.id_maquina IS NOT NULL), '{{}}') AS maquinas
              FROM vw_pasos_produccion ps
              LEFT JOIN tb_proceso_x_maquina pm ON pm.id_proceso = ps.id_proceso
             WHERE ps.id_produccion = :id {filtro}
             GROUP BY ps.id_paso, ps.id_proceso, ps.proceso, ps.descripcion, ps.paso, ps.id_reproceso, ps.veces
             ORDER BY ps.id_paso
        """
        return [PasoProduccion(**{**f, "maquinas": list(f["maquinas"])})
                for f in self.db.execute(text(sql), params).mappings()]

    def guardar_pasos(self, id_produccion: str, pasos: list[NuevoPaso]) -> None:
        # Todo en una transacción: si un trigger rechaza (ej. quitar un paso con tareas), no cambia nada
        try:
            conservar = [p.id_paso for p in pasos if p.id_paso]
            self.db.execute(
                text("DELETE FROM tb_pasos_produccion "
                     "WHERE id_produccion = :id AND id_reproceso IS NULL AND NOT (id_paso = ANY(:ids))"),
                {"id": id_produccion, "ids": conservar},
            )
            for paso in pasos:
                if paso.id_paso:
                    self.db.execute(
                        text("UPDATE tb_pasos_produccion SET descripcion = :desc, veces = :veces "
                             "WHERE id_paso = :paso AND id_produccion = :id"),
                        {"desc": paso.descripcion, "veces": paso.veces, "paso": paso.id_paso, "id": id_produccion},
                    )
                else:
                    self.db.execute(
                        text("INSERT INTO tb_pasos_produccion (id_produccion, id_proceso, descripcion, veces) "
                             "VALUES (:id, :proceso, :desc, :veces)"),
                        {"id": id_produccion, "proceso": paso.id_proceso, "desc": paso.descripcion,
                         "veces": paso.veces},
                    )
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

    def faltantes(self, id_produccion: str) -> list[FaltantePaso]:
        sql = """
            SELECT id_detalle_de_remision, nombre_de_la_pieza, talla, id_paso, paso, cantidad, asignado,
                   defectuosas_otros_pasos
              FROM vw_produccion_faltantes
             WHERE id_produccion = :id
             ORDER BY nombre_de_la_pieza, id_detalle_de_remision, id_paso
        """
        return [FaltantePaso(**f) for f in self.db.execute(text(sql), {"id": id_produccion}).mappings()]

    def defectuosas(self, id_produccion: str | None = None,
                    id_remision: str | None = None) -> list[PiezaDefectuosa]:
        condiciones, params = ["cantidad_defectuosa > 0"], {}
        if id_produccion:
            condiciones.append("id_produccion = :id_produccion")
            params["id_produccion"] = id_produccion
        if id_remision:
            condiciones.append("id_remision = :id_remision")
            params["id_remision"] = id_remision
        sql = f"""
            SELECT id_registro_diario, fecha, id_produccion, id_remision, id_detalle_de_produccion,
                   empleado, prenda, talla, paso, pieza, cantidad_defectuosa, motivo_defecto
              FROM vw_historial_registro_diario
             WHERE {' AND '.join(condiciones)}
             ORDER BY fecha DESC, id_registro_diario DESC
        """
        return [PiezaDefectuosa(**f) for f in self.db.execute(text(sql), params).mappings()]

    # ------------------------------------------------------------------ Reprocesos
    def reprocesos(self, id_produccion: str) -> list[Reproceso]:
        filas = self.db.execute(
            text("SELECT * FROM vw_reprocesos WHERE id_produccion = :id ORDER BY numero"), {"id": id_produccion}
        ).mappings().all()
        lista = [Reproceso(**f) for f in filas]
        for rep in lista:
            p = {"rep": rep.id_reproceso}
            rep.tallas = [ReprocesoTalla(**f) for f in self.db.execute(text("""
                SELECT rt.id_detalle_de_remision, dr.nombre_de_la_pieza, dr.talla, rt.cantidad
                  FROM tb_reproceso_talla rt JOIN tb_detalle_rem dr USING (id_detalle_de_remision)
                 WHERE rt.id_reproceso = :rep ORDER BY dr.nombre_de_la_pieza, rt.id_detalle_de_remision"""), p).mappings()]
            rep.pasos = self.pasos(id_produccion, id_reproceso=rep.id_reproceso)
            rep.faltantes = [FaltantePaso(**f) for f in self.db.execute(text("""
                SELECT id_detalle_de_remision, nombre_de_la_pieza, talla, id_paso, paso, cantidad, asignado,
                       defectuosas_otros_pasos
                  FROM vw_reproceso_faltantes WHERE id_reproceso = :rep
                 ORDER BY nombre_de_la_pieza, id_detalle_de_remision, id_paso"""), p).mappings()]
            rep.insumos = [InsumoReproceso(**f) for f in self.db.execute(text("""
                SELECT id_insumo_enviado, nombre, cantidad, COALESCE(cantidad_disponible, cantidad) AS cantidad_disponible, unidad
                  FROM tb_insumos_enviados_x_cliente WHERE id_reproceso = :rep ORDER BY id_insumo_enviado"""), p).mappings()]
        return lista

    def crear_reproceso(self, id_produccion: str, datos: NuevoReproceso, id_responsable: str) -> str:
        # Todo en una transacción: si un trigger rechaza algo (ej. más piezas que las defectuosas), no queda nada
        try:
            id_rep = self.db.execute(
                text("INSERT INTO tb_reproceso (id_produccion, observacion, creado_por) "
                     "VALUES (:id, :obs, :resp) RETURNING id_reproceso"),
                {"id": id_produccion, "obs": datos.observacion, "resp": id_responsable},
            ).scalar()
            for id_detalle, cantidad in datos.tallas.items():
                self.db.execute(
                    text("INSERT INTO tb_reproceso_talla (id_reproceso, id_detalle_de_remision, cantidad) "
                         "VALUES (:rep, :det, :cant)"),
                    {"rep": id_rep, "det": id_detalle, "cant": cantidad},
                )
            for paso in datos.pasos:
                self.db.execute(
                    text("INSERT INTO tb_pasos_produccion (id_produccion, id_proceso, descripcion, id_reproceso, veces) "
                         "VALUES (:id, :proceso, :desc, :rep, :veces)"),
                    {"id": id_produccion, "proceso": paso.id_proceso, "desc": paso.descripcion, "rep": id_rep,
                     "veces": paso.veces},
                )
            for insumo in datos.insumos:
                self.db.execute(
                    text("""INSERT INTO tb_insumos_enviados_x_cliente (id_remision, nombre, cantidad, unidad, id_reproceso)
                            SELECT id_remision, :nombre, :cant, :unidad, :rep FROM tb_produccion WHERE id_produccion = :id"""),
                    {"id": id_produccion, "nombre": insumo.nombre, "cant": insumo.cantidad,
                     "unidad": insumo.unidad, "rep": id_rep},
                )
            self.db.commit()
            return id_rep
        except Exception:
            self.db.rollback()
            raise

    def reproceso_de(self, id_reproceso: str) -> tuple[str, str] | None:
        """(id_produccion, estado) del reproceso."""
        fila = self.db.execute(
            text("SELECT id_produccion, estado FROM tb_reproceso WHERE id_reproceso = :id"), {"id": id_reproceso}
        ).first()
        return (fila[0], fila[1]) if fila else None

    def cancelar_reproceso(self, id_reproceso: str) -> None:
        # El trigger valida que no tenga tareas y quita sus pasos e insumos sin usar
        self.db.execute(text("UPDATE tb_reproceso SET estado = 'Cancelado' WHERE id_reproceso = :id"), {"id": id_reproceso})
        self.db.commit()

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
