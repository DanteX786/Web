-- =====================================================================
-- 11 - Procesos de cada producción
--   Antes de asignar tareas, la administradora mira la ficha técnica y marca
--   qué procesos lleva esa prenda (tabla tb_produccion_x_proceso).
--   * Las tareas solo pueden usar los procesos elegidos.
--   * No se quita un proceso que ya tiene tareas.
--   * Para iniciar, cada talla debe tener todas sus unidades asignadas en
--     cada uno de los procesos elegidos.
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 10).
-- =====================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS tb_produccion_x_proceso (
    id_produccion VARCHAR(10) NOT NULL REFERENCES tb_produccion(id_produccion) ON DELETE CASCADE,
    id_proceso    VARCHAR(10) NOT NULL REFERENCES tb_procesos(id_proceso),
    PRIMARY KEY (id_produccion, id_proceso)
);

-- Producciones que ya existían: sus procesos son los que ya tienen en sus tareas
INSERT INTO tb_produccion_x_proceso (id_produccion, id_proceso)
SELECT DISTINCT id_produccion, id_proceso FROM tb_detalle_de_produccion WHERE id_proceso IS NOT NULL
ON CONFLICT DO NOTHING;

-- Cambios en la lista de procesos: no en producciones finalizadas ni quitando uno con tareas
CREATE OR REPLACE FUNCTION fn_produccion_x_proceso_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_produccion VARCHAR := COALESCE(NEW.id_produccion, OLD.id_produccion);
    v_estado     VARCHAR;
BEGIN
    SELECT estado INTO v_estado FROM tb_produccion WHERE id_produccion = v_produccion;
    -- v_estado es NULL cuando se borra la producción completa (cascada)
    IF v_estado = 'Finalizada' THEN
        RAISE EXCEPTION 'La producción está Finalizada: no se pueden cambiar sus procesos.';
    END IF;
    IF TG_OP IN ('DELETE', 'UPDATE') AND v_estado IS NOT NULL AND EXISTS (
        SELECT 1 FROM tb_detalle_de_produccion
         WHERE id_produccion = OLD.id_produccion AND id_proceso = OLD.id_proceso) THEN
        RAISE EXCEPTION 'No se puede quitar el proceso: ya tiene tareas asignadas. Elimine primero esas tareas.';
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') AND NOT EXISTS (
        SELECT 1 FROM tb_procesos WHERE id_proceso = NEW.id_proceso AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El proceso % no existe o está inactivo.', NEW.id_proceso;
    END IF;
    RETURN COALESCE(NEW, OLD);
END $function$;

DROP TRIGGER IF EXISTS trg_produccion_x_proceso_validar ON tb_produccion_x_proceso;
CREATE TRIGGER trg_produccion_x_proceso_validar
    BEFORE INSERT OR UPDATE OR DELETE ON tb_produccion_x_proceso
    FOR EACH ROW EXECUTE FUNCTION fn_produccion_x_proceso_validar();

-- La tarea solo puede usar un proceso elegido para su producción
CREATE OR REPLACE FUNCTION fn_tarea_proceso_elegido()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.id_proceso IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tb_produccion_x_proceso
         WHERE id_produccion = NEW.id_produccion AND id_proceso = NEW.id_proceso) THEN
        RAISE EXCEPTION 'Ese proceso no está entre los procesos elegidos para la producción %. Agréguelo primero.', NEW.id_produccion;
    END IF;
    RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_tarea_proceso_elegido ON tb_detalle_de_produccion;
CREATE TRIGGER trg_tarea_proceso_elegido
    BEFORE INSERT OR UPDATE OF id_proceso, id_produccion ON tb_detalle_de_produccion
    FOR EACH ROW EXECUTE FUNCTION fn_tarea_proceso_elegido();

-- Talla x proceso elegido que todavía no tiene todas sus unidades asignadas
CREATE OR REPLACE VIEW vw_produccion_faltantes AS
SELECT p.id_produccion,
       dr.id_detalle_de_remision,
       dr.nombre_de_la_pieza,
       dr.talla,
       pp.id_proceso,
       pr.nombre AS proceso,
       dr.cantidad,
       COALESCE((SELECT sum(d.cantidad_asignada) FROM tb_detalle_de_produccion d
                  WHERE d.id_produccion = p.id_produccion
                    AND d.id_detalle_de_remision = dr.id_detalle_de_remision
                    AND d.id_proceso = pp.id_proceso), 0)::int AS asignado
  FROM tb_produccion p
  JOIN tb_produccion_x_proceso pp ON pp.id_produccion = p.id_produccion
  JOIN tb_procesos pr ON pr.id_proceso = pp.id_proceso
  JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision
 WHERE COALESCE((SELECT sum(d.cantidad_asignada) FROM tb_detalle_de_produccion d
                  WHERE d.id_produccion = p.id_produccion
                    AND d.id_detalle_de_remision = dr.id_detalle_de_remision
                    AND d.id_proceso = pp.id_proceso), 0) < dr.cantidad;

-- Iniciar: procesos elegidos y todas las tallas cubiertas en cada proceso
CREATE OR REPLACE FUNCTION fn_produccion_antes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_pendiente INT;
    v_falta     RECORD;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.estado <> 'Por asignar' THEN
            RAISE EXCEPTION 'Una producción nueva debe iniciar en estado Por asignar.';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM tb_remision
                       WHERE id_remision = NEW.id_remision AND estado = 'Aprobada') THEN
            RAISE EXCEPTION 'Solo se puede enviar a producir una remisión en estado Aprobada.';
        END IF;
        NEW.fecha_estado := now();
        RETURN NEW;
    END IF;

    IF NEW.id_remision <> OLD.id_remision THEN
        RAISE EXCEPTION 'No se puede cambiar la remisión de una producción.';
    END IF;

    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF NOT (
            (OLD.estado = 'Por asignar'   AND NEW.estado = 'En producción') OR
            (OLD.estado = 'En producción' AND NEW.estado = 'Finalizada')
        ) THEN
            RAISE EXCEPTION 'Cambio de estado no permitido en la producción: % -> %', OLD.estado, NEW.estado;
        END IF;
        IF NEW.estado = 'En producción' THEN
            IF NOT EXISTS (SELECT 1 FROM tb_produccion_x_proceso WHERE id_produccion = NEW.id_produccion) THEN
                RAISE EXCEPTION 'Elija los procesos de la producción antes de iniciarla.';
            END IF;
            SELECT * INTO v_falta FROM vw_produccion_faltantes WHERE id_produccion = NEW.id_produccion LIMIT 1;
            IF FOUND THEN
                RAISE EXCEPTION 'Falta asignar % de % unidades de % talla % en el proceso %.',
                    v_falta.cantidad - v_falta.asignado, v_falta.cantidad, v_falta.nombre_de_la_pieza,
                    v_falta.talla, v_falta.proceso;
            END IF;
        END IF;
        IF NEW.estado = 'Finalizada' THEN
            -- Solo se finaliza cuando todas las tareas están completas
            SELECT COALESCE(sum(cantidad_pendiente), 0) INTO v_pendiente
              FROM vw_asignaciones WHERE id_produccion = NEW.id_produccion;
            IF v_pendiente > 0 THEN
                RAISE EXCEPTION 'No se puede finalizar: faltan % unidades por reportar en las tareas.', v_pendiente;
            END IF;
            NEW.fecha_entrega := COALESCE(NEW.fecha_entrega, CURRENT_DATE);
        END IF;
        NEW.fecha_estado := now();
    END IF;
    RETURN NEW;
END $function$;

COMMIT;

-- Verificación: procesos elegidos por producción
SELECT pp.id_produccion, string_agg(pr.nombre, ', ' ORDER BY pr.id_proceso) AS procesos
  FROM tb_produccion_x_proceso pp JOIN tb_procesos pr USING (id_proceso)
 GROUP BY pp.id_produccion ORDER BY pp.id_produccion;
