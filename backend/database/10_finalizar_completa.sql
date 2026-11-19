-- =====================================================================
-- 10 - Finalizar producción solo cuando todo esté terminado (corrección)
--   No se puede finalizar una producción si alguna de sus tareas todavía
--   tiene unidades pendientes por reportar en el registro diario.
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 09).
-- =====================================================================
BEGIN;

CREATE OR REPLACE FUNCTION fn_produccion_antes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_pendiente INT;
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
        IF NEW.estado = 'En producción' AND NOT EXISTS (
            SELECT 1 FROM tb_detalle_de_produccion WHERE id_produccion = NEW.id_produccion) THEN
            RAISE EXCEPTION 'Asigne al menos una tarea antes de iniciar la producción.';
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
