from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.interfaces.dashboard_repository import IDashboardRepository

# Solo lectura. Usa las vistas que ya trae la base de datos:
#   vw_avance_produccion, vw_inventario, vw_ventas, vw_seguimiento_remision.


class DashboardRepository(IDashboardRepository):
    def __init__(self, db: Session):
        self.db = db

    def _filas(self, sql: str, params: dict | None = None) -> list[dict]:
        return [dict(f) for f in self.db.execute(text(sql), params or {}).mappings()]

    # ------------------------------------------------------------------ estado actual
    def remisiones_pendientes(self) -> list[dict]:
        return self._filas("""
            SELECT r.id_remision, c.nombre AS cliente, r.fecha_recibo, r.total_prendas
              FROM tb_remision r JOIN tb_clientes c ON c.nit = r.nit_cliente
             WHERE r.estado = 'Pendiente'
             ORDER BY r.fecha_recibo, r.id_remision
        """)

    def producciones_en_curso(self) -> list[dict]:
        return self._filas("""
            SELECT a.id_produccion, a.id_remision, a.cliente, a.porcentaje_avance,
                   a.total_asignado, a.total_realizado, r.total_prendas, r.fecha_entrega
              FROM vw_avance_produccion a
              JOIN tb_remision r ON r.id_remision = a.id_remision
             WHERE a.estado = 'En proceso'
             ORDER BY a.fecha_inicio
        """)

    def remisiones_abiertas(self) -> list[dict]:
        """Aprobadas, en producción o terminadas (todavía no entregadas)."""
        return self._filas("""
            SELECT r.id_remision, c.nombre AS cliente, r.estado, r.fecha_entrega, r.total_prendas
              FROM tb_remision r JOIN tb_clientes c ON c.nit = r.nit_cliente
             WHERE r.estado IN ('Aprobada', 'En producción', 'Terminada')
             ORDER BY r.fecha_entrega NULLS LAST, r.id_remision
        """)

    def entregas_por_cobrar(self) -> list[dict]:
        return self._filas("""
            SELECT id_entrega, id_remision, cliente, precio_total, fecha_finalizacion
              FROM vw_ventas
             WHERE estado = 'Pendiente de pago'
             ORDER BY fecha_finalizacion, id_entrega
        """)

    def insumos_stock_bajo(self) -> list[dict]:
        return self._filas("""
            SELECT id, nombre, disponible, stock_minimo, unidad
              FROM vw_inventario
             WHERE origen = 'Taller' AND estado = 'Activo' AND alerta_stock_minimo
             ORDER BY disponible - stock_minimo, nombre
        """)

    # ------------------------------------------------------------------ por rango
    def entregas_por_dia(self, desde: date, hasta: date) -> list[dict]:
        return self._filas("""
            SELECT fecha_finalizacion AS fecha,
                   SUM(precio_total) AS facturado,
                   SUM(CASE WHEN estado = 'Pagada' THEN precio_total ELSE 0 END) AS cobrado,
                   SUM(cantidad_entregada) AS prendas,
                   COUNT(*) AS entregas
              FROM vw_ventas
             WHERE fecha_finalizacion BETWEEN :desde AND :hasta
             GROUP BY fecha_finalizacion
        """, {"desde": desde, "hasta": hasta})

    def compras_por_dia(self, desde: date, hasta: date) -> list[dict]:
        return self._filas("""
            SELECT fecha_compra AS fecha, SUM(total_compra) AS total, COUNT(*) AS compras
              FROM tb_compras
             WHERE fecha_compra BETWEEN :desde AND :hasta
             GROUP BY fecha_compra
        """, {"desde": desde, "hasta": hasta})

    def unidades_por_dia(self, desde: date, hasta: date) -> list[dict]:
        return self._filas("""
            SELECT fecha::date AS fecha, SUM(cantidad) AS unidades
              FROM tb_registro_diario
             WHERE fecha::date BETWEEN :desde AND :hasta
             GROUP BY fecha::date
        """, {"desde": desde, "hasta": hasta})

    def unidades_por_empleado(self, desde: date, hasta: date, limite: int) -> list[dict]:
        return self._filas("""
            SELECT empleado, SUM(cantidad) AS unidades
              FROM vw_historial_registro_diario
             WHERE fecha::date BETWEEN :desde AND :hasta
             GROUP BY id_empleado, empleado
             ORDER BY unidades DESC, empleado
             LIMIT :limite
        """, {"desde": desde, "hasta": hasta, "limite": limite})

    # ------------------------------------------------------------------ empleados
    def empleados_hoy(self) -> dict:
        """Foto de hoy de los empleados activos (vista de disponibilidad del módulo de asistencia)."""
        fila = self.db.execute(text("""
            SELECT COUNT(*)                                                     AS activos,
                   COUNT(*) FILTER (WHERE presente_hoy)                         AS presentes,
                   COUNT(*) FILTER (WHERE en_taller)                            AS en_taller,
                   COUNT(*) FILTER (WHERE ocupado_en_tarea IS NOT NULL)         AS con_tarea,
                   COUNT(*) FILTER (WHERE estado_asistencia IN ('Permiso', 'Incapacidad', 'Vacaciones')) AS con_novedad
              FROM vw_empleados_disponibilidad
        """)).mappings().one()
        return dict(fila)

    def asistencia_por_dia(self, desde: date, hasta: date) -> list[dict]:
        return self._filas("""
            SELECT fecha,
                   COUNT(*)                                                     AS registros,
                   COUNT(*) FILTER (WHERE estado = 'Presente')                  AS presentes,
                   COUNT(*) FILTER (WHERE estado = 'No presente')               AS faltas,
                   COUNT(*) FILTER (WHERE estado IN ('Permiso', 'Incapacidad', 'Vacaciones')) AS novedades,
                   COALESCE(SUM(minutos_trabajados), 0)                         AS minutos
              FROM vw_asistencia
             WHERE fecha BETWEEN :desde AND :hasta
             GROUP BY fecha
        """, {"desde": desde, "hasta": hasta})

    def desempeno_empleados(self, desde: date, hasta: date) -> list[dict]:
        """Por empleado activo: lo que produjo (buenas / defectuosas), su asistencia y horas,
        y el proceso en el que más unidades hizo. Solo salen los que tienen datos en el periodo."""
        return self._filas("""
            WITH prod AS (
                SELECT id_empleado,
                       SUM(cantidad)                 AS unidades,
                       SUM(cantidad_defectuosa)      AS defectuosas,
                       COUNT(DISTINCT fecha::date)   AS dias_produccion
                  FROM vw_historial_registro_diario
                 WHERE fecha::date BETWEEN :desde AND :hasta
                 GROUP BY id_empleado
            ), asis AS (
                SELECT id_empleado,
                       COUNT(*)                                        AS registros,
                       COUNT(*) FILTER (WHERE estado = 'Presente')     AS dias_presente,
                       COUNT(*) FILTER (WHERE estado = 'No presente')  AS faltas,
                       COALESCE(SUM(minutos_trabajados), 0)            AS minutos
                  FROM vw_asistencia
                 WHERE fecha BETWEEN :desde AND :hasta
                 GROUP BY id_empleado
            ), proceso_principal AS (
                SELECT DISTINCT ON (id_empleado) id_empleado, proceso
                  FROM (SELECT id_empleado, COALESCE(proceso, 'Sin proceso') AS proceso, SUM(cantidad) AS u
                          FROM vw_historial_registro_diario
                         WHERE fecha::date BETWEEN :desde AND :hasta
                         GROUP BY id_empleado, COALESCE(proceso, 'Sin proceso')) x
                 ORDER BY id_empleado, u DESC, proceso
            )
            SELECT e.id_empleados AS id_empleado, e.nombre AS empleado, r.descripcion_rol AS rol,
                   COALESCE(p.unidades, 0)        AS unidades,
                   COALESCE(p.defectuosas, 0)     AS defectuosas,
                   COALESCE(p.dias_produccion, 0) AS dias_produccion,
                   COALESCE(a.registros, 0)       AS registros_asistencia,
                   COALESCE(a.dias_presente, 0)   AS dias_presente,
                   COALESCE(a.faltas, 0)          AS faltas,
                   COALESCE(a.minutos, 0)         AS minutos,
                   pp.proceso                     AS proceso_principal
              FROM empleados e
              LEFT JOIN roles r ON r.id_rol = e.id_rol
              LEFT JOIN prod p ON p.id_empleado = e.id_empleados
              LEFT JOIN asis a ON a.id_empleado = e.id_empleados
              LEFT JOIN proceso_principal pp ON pp.id_empleado = e.id_empleados
             WHERE e.estado = 'Activo' AND (p.id_empleado IS NOT NULL OR a.id_empleado IS NOT NULL)
        """, {"desde": desde, "hasta": hasta})

    def produccion_por_proceso_empleado(self, desde: date, hasta: date) -> list[dict]:
        return self._filas("""
            SELECT COALESCE(proceso, 'Sin proceso')  AS proceso,
                   id_empleado, empleado,
                   SUM(cantidad)                     AS unidades,
                   SUM(cantidad_defectuosa)          AS defectuosas,
                   COUNT(DISTINCT fecha::date)       AS dias
              FROM vw_historial_registro_diario
             WHERE fecha::date BETWEEN :desde AND :hasta
             GROUP BY COALESCE(proceso, 'Sin proceso'), id_empleado, empleado
        """, {"desde": desde, "hasta": hasta})

    def anios_con_datos(self) -> list[int]:
        filas = self.db.execute(text("""
            SELECT DISTINCT EXTRACT(YEAR FROM f)::int AS anio FROM (
                SELECT fecha_recibo AS f FROM tb_remision
                UNION ALL SELECT fecha_finalizacion FROM tb_remision_entrega
                UNION ALL SELECT fecha_compra FROM tb_compras
                UNION ALL SELECT fecha::date FROM tb_registro_diario
                UNION ALL SELECT fecha FROM tb_asistencia
            ) x WHERE f IS NOT NULL
        """)).scalars().all()
        return [int(a) for a in filas]

    def cumplimiento_entregas(self, desde: date, hasta: date) -> dict:
        fila = self.db.execute(text("""
            SELECT COUNT(*) FILTER (WHERE r.fecha_entrega IS NOT NULL
                                      AND e.fecha_finalizacion <= r.fecha_entrega) AS a_tiempo,
                   COUNT(*) FILTER (WHERE e.fecha_finalizacion > r.fecha_entrega)  AS tarde,
                   COUNT(*) FILTER (WHERE r.fecha_entrega IS NULL)                 AS sin_fecha,
                   AVG(e.fecha_finalizacion - r.fecha_recibo)                       AS dias_promedio
              FROM tb_remision_entrega e
              JOIN tb_remision r ON r.id_remision = e.id_remision
             WHERE e.fecha_finalizacion BETWEEN :desde AND :hasta
        """), {"desde": desde, "hasta": hasta}).mappings().one()
        return dict(fila)

    def top_clientes(self, desde: date, hasta: date, limite: int) -> list[dict]:
        return self._filas("""
            SELECT nit, cliente, SUM(precio_total) AS facturado,
                   SUM(cantidad_entregada) AS prendas, COUNT(*) AS entregas
              FROM vw_ventas
             WHERE fecha_finalizacion BETWEEN :desde AND :hasta
             GROUP BY nit, cliente
             ORDER BY facturado DESC, cliente
             LIMIT :limite
        """, {"desde": desde, "hasta": hasta, "limite": limite})

    def remisiones_por_estado(self, desde: date, hasta: date) -> list[dict]:
        return self._filas("""
            SELECT estado, COUNT(*) AS cantidad, COALESCE(SUM(total_prendas), 0) AS prendas
              FROM tb_remision
             WHERE fecha_recibo BETWEEN :desde AND :hasta
             GROUP BY estado
        """, {"desde": desde, "hasta": hasta})

    # ------------------------------------------------------------------ historial
    def ultimos_movimientos(self, limite: int) -> list[dict]:
        # Cambios de estado de remisiones (tabla de seguimiento) + compras + entregas.
        # El paso a "Entregada" no se repite: ya aparece como entrega, con su valor.
        return self._filas("""
            SELECT * FROM (
                SELECT 'remision' AS tipo, s.id_remision AS referencia, s.fecha_hora AS fecha,
                       s.estado_nuevo AS estado, c.nombre AS detalle,
                       s.responsable AS responsable, r.total_prendas::numeric AS valor
                  FROM vw_seguimiento_remision s
                  JOIN tb_remision r ON r.id_remision = s.id_remision
                  JOIN tb_clientes c ON c.nit = r.nit_cliente
                 WHERE s.estado_nuevo <> 'Entregada'
                UNION ALL
                SELECT 'compra', co.id_compras, co.fecha_compra::timestamptz,
                       'Registrada', COALESCE(p.nombre, 'Proveedor'), co.descripcion, co.total_compra
                  FROM tb_compras co
                  LEFT JOIN proveedores p ON p.id_proveedores = co.id_proveedor
                UNION ALL
                SELECT 'entrega', v.id_entrega, v.fecha_finalizacion::timestamptz,
                       v.estado, v.cliente, v.id_remision, v.precio_total
                  FROM vw_ventas v
            ) m
            ORDER BY m.fecha DESC, m.referencia DESC
            LIMIT :limite
        """, {"limite": limite})
