-- =====================================================================
-- 09 - Empleado ocupado (corrección)
--   Un empleado con una tarea que todavía tiene unidades pendientes (en una
--   producción no finalizada) no se puede asignar a otra tarea hasta que termine.
--   Igual que las máquinas.
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 08).
-- =====================================================================
BEGIN;

CREATE OR REPLACE FUNCTION fn_detalle_produccion_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_remision     VARCHAR;
    v_estado_prod  VARCHAR;
    v_cant_pieza   INT;
    v_ya_asignado  INT;
    v_ocupada      RECORD;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT estado INTO v_estado_prod FROM tb_produccion WHERE id_produccion = OLD.id_produccion;
        IF v_estado_prod = 'Finalizada' THEN
            RAISE EXCEPTION 'No se pueden borrar asignaciones de una producción Finalizada.';
        END IF;
        RETURN OLD;
    END IF;

    SELECT id_remision, estado INTO v_remision, v_estado_prod
      FROM tb_produccion WHERE id_produccion = NEW.id_produccion;

    IF v_estado_prod NOT IN ('Por asignar', 'En producción') THEN
        RAISE EXCEPTION 'La producción está Finalizada: no se pueden asignar ni editar tareas.';
    END IF;

    IF NEW.id_proceso IS NULL OR NOT EXISTS (
        SELECT 1 FROM tb_procesos WHERE id_proceso = NEW.id_proceso AND estado = 'Activo') THEN
        RAISE EXCEPTION 'Elija un proceso activo para la tarea.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM empleados WHERE id_empleados = NEW.id_empleado AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El empleado % no existe o está inactivo.', NEW.id_empleado;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_pieza WHERE id_tipo_de_pieza = NEW.id_tipo_pieza AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El tipo de pieza % no existe o está inactivo.', NEW.id_tipo_pieza;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_maquina WHERE id_tipo_de_maquina = NEW.id_tipo_maquina AND estado = 'Activo') THEN
        RAISE EXCEPTION 'La máquina % no existe o está inactiva.', NEW.id_tipo_maquina;
    END IF;

    -- La máquina no puede estar ocupada por otra tarea con unidades pendientes
    -- en una producción que no esté finalizada.
    SELECT a.id_detalle_de_produccion, a.empleado, a.id_produccion INTO v_ocupada
      FROM tb_detalle_de_produccion d
      JOIN vw_asignaciones a ON a.id_detalle_de_produccion = d.id_detalle_de_produccion
     WHERE d.id_tipo_maquina = NEW.id_tipo_maquina
       AND d.id_detalle_de_produccion <> NEW.id_detalle_de_produccion
       AND a.estado_produccion <> 'Finalizada'
       AND a.cantidad_pendiente > 0
     LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'La máquina está ocupada por % (tarea %, producción %). Elija otra o espere a que termine.',
            v_ocupada.empleado, v_ocupada.id_detalle_de_produccion, v_ocupada.id_produccion;
    END IF;

    -- El empleado tampoco puede tener otra tarea con unidades pendientes:
    -- primero termina lo que tiene y después se le asigna otra.
    SELECT a.id_detalle_de_produccion, a.id_produccion, a.proceso, a.cantidad_pendiente INTO v_ocupada
      FROM vw_asignaciones a
     WHERE a.id_empleado = NEW.id_empleado
       AND a.id_detalle_de_produccion <> NEW.id_detalle_de_produccion
       AND a.estado_produccion <> 'Finalizada'
       AND a.cantidad_pendiente > 0
     LIMIT 1;
    IF FOUND THEN
        RAISE EXCEPTION 'El empleado está ocupado: tiene % unidades pendientes en la tarea % (producción %). Asígnele otra cuando termine.',
            v_ocupada.cantidad_pendiente, v_ocupada.id_detalle_de_produccion, v_ocupada.id_produccion;
    END IF;

    -- La línea de la remisión (prenda + talla) debe ser de la misma remisión
    SELECT cantidad INTO v_cant_pieza FROM tb_detalle_rem
     WHERE id_detalle_de_remision = NEW.id_detalle_de_remision AND id_remision = v_remision;
    IF v_cant_pieza IS NULL THEN
        RAISE EXCEPTION 'El detalle de remisión % no pertenece a la remisión %.', NEW.id_detalle_de_remision, v_remision;
    END IF;

    -- No asignar más unidades que las pedidas para el mismo proceso y pieza de esa
    -- talla. Así una talla se reparte entre varios empleados sin pasarse.
    SELECT COALESCE(sum(cantidad_asignada), 0) INTO v_ya_asignado
      FROM tb_detalle_de_produccion
     WHERE id_detalle_de_remision = NEW.id_detalle_de_remision
       AND id_proceso = NEW.id_proceso
       AND id_tipo_pieza = NEW.id_tipo_pieza
       AND id_detalle_de_produccion <> NEW.id_detalle_de_produccion;
    IF v_ya_asignado + NEW.cantidad_asignada > v_cant_pieza THEN
        RAISE EXCEPTION 'Se exceden las unidades de esa talla para ese proceso y pieza: pedidas %, ya asignadas %, intenta asignar %.',
            v_cant_pieza, v_ya_asignado, NEW.cantidad_asignada;
    END IF;

    -- Insumo del cliente: debe ser de esta misma remisión
    IF NEW.id_insumos_enviados_x_cliente IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tb_insumos_enviados_x_cliente
         WHERE id_insumo_enviado = NEW.id_insumos_enviados_x_cliente AND id_remision = v_remision) THEN
        RAISE EXCEPTION 'El insumo enviado % no pertenece a la remisión %.', NEW.id_insumos_enviados_x_cliente, v_remision;
    END IF;

    -- Insumo del taller: debe estar activo
    IF NEW.id_insumos IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tb_insumos WHERE id_insumos = NEW.id_insumos AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El insumo % no existe o está inactivo.', NEW.id_insumos;
    END IF;

    RETURN NEW;
END $function$;

-- Empleados activos con su disponibilidad (si está ocupado: en qué tarea y producción)
CREATE OR REPLACE VIEW vw_empleados_disponibilidad AS
 SELECT e.id_empleados AS id_empleado,
    e.nombre,
    o.id_detalle_de_produccion AS ocupado_en_tarea,
    o.id_produccion AS ocupado_en_produccion,
    o.cantidad_pendiente AS unidades_pendientes,
    (o.id_detalle_de_produccion IS NULL) AS disponible
   FROM empleados e
   LEFT JOIN LATERAL (
        SELECT a.id_detalle_de_produccion, a.id_produccion, a.cantidad_pendiente
          FROM vw_asignaciones a
         WHERE a.id_empleado = e.id_empleados
           AND a.estado_produccion <> 'Finalizada'
           AND a.cantidad_pendiente > 0
         ORDER BY a.fecha_asignada
         LIMIT 1) o ON TRUE
  WHERE e.estado = 'Activo';

COMMIT;

-- Verificación: empleados que hoy tienen más de una tarea pendiente (hay que dejarles una sola)
SELECT empleado, COUNT(*) AS tareas_pendientes
  FROM vw_asignaciones
 WHERE estado_produccion <> 'Finalizada' AND cantidad_pendiente > 0
 GROUP BY empleado HAVING COUNT(*) > 1;
