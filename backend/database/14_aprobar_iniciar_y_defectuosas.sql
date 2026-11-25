-- =====================================================================
-- 14 - Correcciones de la instructora (revisión del 23/11)
--   1. Aprobar una remisión la envía sola a producción ("Por asignar").
--      Las remisiones que ya estaban Aprobadas sin producción se envían aquí.
--   2. Para iniciar una producción basta con UNA tarea asignada (no todo).
--      Para finalizar sí debe estar todo asignado y reportado.
--   3. Editar una tarea: no se puede bajar de lo ya reportado, ni cambiar
--      el empleado / talla / paso / pieza si ya tiene reportes.
--   4. Piezas defectuosas: el registro diario guarda "cantidad terminada"
--      (columna cantidad) y "cantidad defectuosa" con su motivo.
--      Una tarea queda completa cuando terminadas + defectuosas = asignadas.
--      Las piezas perdidas en un paso ya no se exigen en los demás pasos.
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 13).
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 4. Registro diario: terminadas + defectuosas
-- ---------------------------------------------------------------------
ALTER TABLE tb_registro_diario
    ADD COLUMN IF NOT EXISTS cantidad_defectuosa INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS motivo_defecto VARCHAR(200);

ALTER TABLE tb_registro_diario DROP CONSTRAINT IF EXISTS tb_registro_diario_cantidad_check;
ALTER TABLE tb_registro_diario DROP CONSTRAINT IF EXISTS ck_registro_cantidades;
ALTER TABLE tb_registro_diario ADD CONSTRAINT ck_registro_cantidades
    CHECK (cantidad >= 0 AND cantidad_defectuosa >= 0 AND cantidad + cantidad_defectuosa > 0);

COMMENT ON COLUMN tb_registro_diario.cantidad IS 'Unidades terminadas (buenas) en este reporte';
COMMENT ON COLUMN tb_registro_diario.cantidad_defectuosa IS 'Unidades que salieron defectuosas en este reporte';

CREATE OR REPLACE FUNCTION fn_registro_diario_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado_prod VARCHAR;
    v_asignada    INT;
    v_reportado   INT;
    v_empleado    VARCHAR;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT p.estado INTO v_estado_prod
          FROM tb_detalle_de_produccion d JOIN tb_produccion p USING (id_produccion)
         WHERE d.id_detalle_de_produccion = OLD.id_detalle_de_produccion;
        IF v_estado_prod = 'Finalizada' THEN
            RAISE EXCEPTION 'No se pueden borrar reportes de una producción Finalizada.';
        END IF;
        RETURN OLD;
    END IF;

    SELECT p.estado, d.cantidad_asignada, d.id_empleado INTO v_estado_prod, v_asignada, v_empleado
      FROM tb_detalle_de_produccion d JOIN tb_produccion p USING (id_produccion)
     WHERE d.id_detalle_de_produccion = NEW.id_detalle_de_produccion;

    IF v_estado_prod = 'Por asignar' THEN
        RAISE EXCEPTION 'La producción aún no ha iniciado: no se aceptan reportes diarios.';
    ELSIF v_estado_prod <> 'En producción' THEN
        RAISE EXCEPTION 'La producción está Finalizada: no se aceptan más reportes diarios.';
    END IF;

    -- Un reporte nuevo solo lo puede hacer un empleado que asistió hoy
    -- (las correcciones de reportes anteriores sí se permiten)
    IF TG_OP = 'INSERT' AND NOT EXISTS (
        SELECT 1 FROM tb_asistencia
         WHERE id_empleado = v_empleado AND fecha = fn_hoy() AND estado = 'Presente') THEN
        RAISE EXCEPTION 'El empleado no está marcado como Presente en la asistencia de hoy: no puede reportar avance.';
    END IF;

    -- El motivo solo tiene sentido si hay defectuosas
    IF NEW.cantidad_defectuosa = 0 THEN
        NEW.motivo_defecto := NULL;
    ELSE
        NEW.motivo_defecto := NULLIF(btrim(NEW.motivo_defecto), '');
    END IF;

    SELECT COALESCE(sum(cantidad + cantidad_defectuosa), 0) INTO v_reportado
      FROM tb_registro_diario
     WHERE id_detalle_de_produccion = NEW.id_detalle_de_produccion
       AND id_registro_diario <> NEW.id_registro_diario;

    IF v_reportado + NEW.cantidad + NEW.cantidad_defectuosa > v_asignada THEN
        RAISE EXCEPTION 'Supera lo asignado: asignado %, ya reportado %, intenta reportar % (% terminadas + % defectuosas).',
            v_asignada, v_reportado, NEW.cantidad + NEW.cantidad_defectuosa, NEW.cantidad, NEW.cantidad_defectuosa;
    END IF;
    RETURN NEW;
END $function$;

-- Tareas: realizada = terminadas; pendiente = asignada - terminadas - defectuosas
CREATE OR REPLACE VIEW vw_asignaciones AS
 SELECT d.id_detalle_de_produccion,
    d.id_produccion,
    p.id_remision,
    p.estado AS estado_produccion,
    d.id_empleado,
    e.nombre AS empleado,
    tp.nombre AS pieza,
    tm.nombre AS maquina,
    dr.nombre_de_la_pieza AS prenda,
    dr.talla,
    d.cantidad_asignada,
    COALESCE(sum(rd.cantidad), 0)::integer AS cantidad_realizada,
    (d.cantidad_asignada - COALESCE(sum(rd.cantidad + rd.cantidad_defectuosa), 0))::integer AS cantidad_pendiente,
    d.fecha_asignada,
    d.id_proceso,
    pr.nombre AS proceso,
    d.id_paso,
    pr.nombre::text || COALESCE(' — ' || ps.descripcion::text, '') AS paso,
    COALESCE(sum(rd.cantidad_defectuosa), 0)::integer AS cantidad_defectuosa
   FROM tb_detalle_de_produccion d
     JOIN tb_produccion p ON p.id_produccion = d.id_produccion
     JOIN empleados e ON e.id_empleados = d.id_empleado
     JOIN tipo_de_pieza tp ON tp.id_tipo_de_pieza = d.id_tipo_pieza
     JOIN tipo_de_maquina tm ON tm.id_tipo_de_maquina = d.id_tipo_maquina
     JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision = d.id_detalle_de_remision
     LEFT JOIN tb_procesos pr ON pr.id_proceso = d.id_proceso
     LEFT JOIN tb_pasos_produccion ps ON ps.id_paso = d.id_paso
     LEFT JOIN tb_registro_diario rd ON rd.id_detalle_de_produccion = d.id_detalle_de_produccion
  GROUP BY d.id_detalle_de_produccion, p.id_remision, p.estado, e.nombre, tp.nombre, tm.nombre,
           dr.nombre_de_la_pieza, dr.talla, pr.nombre, ps.descripcion;

CREATE OR REPLACE VIEW vw_historial_registro_diario AS
 SELECT rd.id_registro_diario,
    rd.fecha,
    a.id_empleado,
    a.empleado,
    a.pieza,
    a.maquina,
    a.prenda,
    a.talla,
    rd.cantidad,
    a.id_produccion,
    a.id_remision,
    a.proceso,
    rd.cantidad_defectuosa,
    rd.motivo_defecto,
    a.paso,
    rd.id_detalle_de_produccion
   FROM tb_registro_diario rd
     JOIN vw_asignaciones a ON a.id_detalle_de_produccion = rd.id_detalle_de_produccion;

CREATE OR REPLACE VIEW vw_avance_produccion AS
 SELECT p.id_produccion,
    p.id_remision,
    c.nombre AS cliente,
    p.estado,
    p.fecha_inicio,
    p.fecha_entrega,
    COALESCE(sum(a.cantidad_asignada), 0)::integer AS total_asignado,
    COALESCE(sum(a.cantidad_realizada), 0)::integer AS total_realizado,
        CASE
            WHEN COALESCE(sum(a.cantidad_asignada), 0) = 0 THEN 0::numeric
            ELSE round(100.0 * sum(a.cantidad_realizada + a.cantidad_defectuosa)::numeric / sum(a.cantidad_asignada)::numeric, 1)
        END AS porcentaje_avance,
    p.fecha_estado,
    r.total_prendas,
    r.ficha_tecnica_nombre,
    COALESCE(sum(a.cantidad_defectuosa), 0)::integer AS total_defectuoso,
    COALESCE(sum(a.cantidad_pendiente), 0)::integer AS total_pendiente
   FROM tb_produccion p
     JOIN tb_remision r ON r.id_remision = p.id_remision
     JOIN tb_clientes c ON c.nit = r.nit_cliente
     LEFT JOIN vw_asignaciones a ON a.id_produccion = p.id_produccion
  GROUP BY p.id_produccion, r.id_remision, c.nombre;

-- Talla x paso que todavía no tiene todas sus unidades asignadas.
-- "cantidad" = lo que se exige en ese paso: las unidades de la talla menos las
-- piezas que salieron defectuosas en OTROS pasos (esas ya no llegan a este).
CREATE OR REPLACE VIEW vw_produccion_faltantes AS
 WITH base AS (
    SELECT p.id_produccion,
           dr.id_detalle_de_remision,
           dr.nombre_de_la_pieza,
           dr.talla,
           ps.id_paso,
           ps.paso,
           dr.cantidad AS cantidad_talla,
           COALESCE((SELECT sum(d.cantidad_asignada) FROM tb_detalle_de_produccion d
                      WHERE d.id_paso = ps.id_paso
                        AND d.id_detalle_de_remision = dr.id_detalle_de_remision), 0)::int AS asignado,
           COALESCE((SELECT sum(rd.cantidad_defectuosa)
                       FROM tb_registro_diario rd
                       JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
                      WHERE d.id_produccion = p.id_produccion
                        AND d.id_detalle_de_remision = dr.id_detalle_de_remision
                        AND d.id_paso IS DISTINCT FROM ps.id_paso), 0)::int AS defectuosas_otros_pasos
      FROM tb_produccion p
      JOIN vw_pasos_produccion ps ON ps.id_produccion = p.id_produccion
      JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision
 )
 SELECT id_produccion,
        id_detalle_de_remision,
        nombre_de_la_pieza,
        talla,
        id_paso,
        paso,
        GREATEST(cantidad_talla - defectuosas_otros_pasos, 0) AS cantidad,
        asignado,
        defectuosas_otros_pasos
   FROM base
  WHERE asignado < cantidad_talla - defectuosas_otros_pasos;

-- ---------------------------------------------------------------------
-- 2. Iniciar con al menos una tarea; finalizar con todo asignado y reportado
-- ---------------------------------------------------------------------
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
            IF NOT EXISTS (SELECT 1 FROM tb_pasos_produccion WHERE id_produccion = NEW.id_produccion) THEN
                RAISE EXCEPTION 'Elija los procesos de la producción antes de iniciarla.';
            END IF;
            -- Basta con una tarea: el resto se va asignando mientras avanza
            IF NOT EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_produccion = NEW.id_produccion) THEN
                RAISE EXCEPTION 'Asigne al menos una tarea antes de iniciar la producción.';
            END IF;
        END IF;
        IF NEW.estado = 'Finalizada' THEN
            SELECT * INTO v_falta FROM vw_produccion_faltantes WHERE id_produccion = NEW.id_produccion LIMIT 1;
            IF FOUND THEN
                RAISE EXCEPTION 'No se puede finalizar: falta asignar % de % unidades de % talla % en el paso %.',
                    v_falta.cantidad - v_falta.asignado, v_falta.cantidad, v_falta.nombre_de_la_pieza,
                    v_falta.talla, v_falta.paso;
            END IF;
            SELECT COALESCE(sum(cantidad_pendiente), 0) INTO v_pendiente
              FROM vw_asignaciones WHERE id_produccion = NEW.id_produccion;
            IF v_pendiente > 0 THEN
                RAISE EXCEPTION 'No se puede finalizar: faltan % unidades por reportar en las tareas.', v_pendiente;
            END IF;
            NEW.fecha_entrega := COALESCE(NEW.fecha_entrega, CURRENT_DATE);
            IF NEW.fecha_entrega < NEW.fecha_inicio THEN
                NEW.fecha_entrega := CURRENT_DATE;
            END IF;
        END IF;
        NEW.fecha_estado := now();
    END IF;
    RETURN NEW;
END $function$;

-- ---------------------------------------------------------------------
-- 3. Editar / eliminar tareas
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_tarea_editar_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_reportado INT;
BEGIN
    SELECT COALESCE(sum(cantidad + cantidad_defectuosa), 0) INTO v_reportado
      FROM tb_registro_diario WHERE id_detalle_de_produccion = OLD.id_detalle_de_produccion;

    IF TG_OP = 'DELETE' THEN
        IF v_reportado > 0 THEN
            RAISE EXCEPTION 'No se puede eliminar la tarea %: ya tiene % unidades reportadas. Bájele la cantidad en su lugar.',
                OLD.id_detalle_de_produccion, v_reportado;
        END IF;
        RETURN OLD;
    END IF;

    IF NEW.cantidad_asignada < v_reportado THEN
        RAISE EXCEPTION 'La tarea % ya tiene % unidades reportadas: no se le puede asignar menos que eso.',
            OLD.id_detalle_de_produccion, v_reportado;
    END IF;
    IF v_reportado > 0 AND (
        NEW.id_empleado IS DISTINCT FROM OLD.id_empleado OR
        NEW.id_detalle_de_remision IS DISTINCT FROM OLD.id_detalle_de_remision OR
        NEW.id_paso IS DISTINCT FROM OLD.id_paso OR
        NEW.id_tipo_pieza IS DISTINCT FROM OLD.id_tipo_pieza) THEN
        RAISE EXCEPTION 'La tarea % ya tiene reportes: solo se puede cambiar la cantidad, la máquina o el insumo. Para pasar lo que falta a otra persona, bájele la cantidad y cree una tarea nueva.',
            OLD.id_detalle_de_produccion;
    END IF;
    RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_tarea_editar_validar ON tb_detalle_de_produccion;
CREATE TRIGGER trg_tarea_editar_validar
    BEFORE UPDATE OR DELETE ON tb_detalle_de_produccion
    FOR EACH ROW EXECUTE FUNCTION fn_tarea_editar_validar();

-- ---------------------------------------------------------------------
-- 1. Aprobar la remisión = enviarla a producción
--    (el nombre empieza por "trg_t" para correr DESPUÉS de trg_seguimiento_remision,
--     así la línea de tiempo queda: Pendiente -> Aprobada -> En producción)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_tras_aprobar_remision()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.estado = 'Aprobada' AND OLD.estado IS DISTINCT FROM 'Aprobada'
       AND NOT EXISTS (SELECT 1 FROM tb_produccion WHERE id_remision = NEW.id_remision) THEN
        INSERT INTO tb_produccion (id_remision, fecha_entrega)
        VALUES (NEW.id_remision,
                CASE WHEN NEW.fecha_entrega >= CURRENT_DATE THEN NEW.fecha_entrega END);
    END IF;
    RETURN NULL;
END $function$;

DROP TRIGGER IF EXISTS trg_tras_aprobar_remision ON tb_remision;
CREATE TRIGGER trg_tras_aprobar_remision
    AFTER UPDATE OF estado ON tb_remision
    FOR EACH ROW EXECUTE FUNCTION fn_tras_aprobar_remision();

-- Remisiones que ya estaban Aprobadas y nunca se enviaron: se envían ahora
-- (responsable del seguimiento: el primer administrador activo)
SELECT set_config('eslabon.id_empleado',
       (SELECT id_empleados FROM empleados
         WHERE id_rol = 'ROL00001' AND estado = 'Activo' ORDER BY id_empleados LIMIT 1), true);

INSERT INTO tb_produccion (id_remision, fecha_entrega)
SELECT r.id_remision, CASE WHEN r.fecha_entrega >= CURRENT_DATE THEN r.fecha_entrega END
  FROM tb_remision r
 WHERE r.estado = 'Aprobada'
   AND NOT EXISTS (SELECT 1 FROM tb_produccion p WHERE p.id_remision = r.id_remision)
 ORDER BY r.id_remision;

COMMIT;

-- Verificación
SELECT id_produccion, id_remision, estado FROM tb_produccion ORDER BY id_produccion;
