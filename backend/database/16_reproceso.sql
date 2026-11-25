-- =====================================================================
-- 16 - Reproceso (corrección de la instructora)
--   Dentro de la MISMA producción y la MISMA remisión, la administradora puede
--   reprocesar piezas que salieron defectuosas:
--     * Elige cuántas piezas de cada talla (máximo las defectuosas disponibles).
--     * Elige SOLO los procesos que necesita (no se repiten todos los de antes).
--     * Opcional: registra insumos que el cliente envió para el reproceso
--       (se suman a los insumos de la remisión, marcados "para reproceso").
--     * Las tareas del reproceso se asignan y reportan igual que las normales
--       (y también pueden salir defectuosas).
--   Reglas:
--     * Puede haber varios reprocesos en una producción, pero UNO A LA VEZ.
--     * Se puede cancelar mientras no tenga tareas (por si fue un error).
--     * La producción sigue "En producción" (se muestra con la etiqueta "En reproceso").
--     * Si hay un reproceso abierto, la producción no se finaliza hasta terminarlo.
--     * Si no se quiere reprocesar, se finaliza normal: las defectuosas quedan registradas.
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 15).
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_reproceso;

CREATE TABLE IF NOT EXISTS tb_reproceso (
    id_reproceso   VARCHAR(10) PRIMARY KEY DEFAULT fn_generar_id('RPR', 'seq_reproceso'),
    id_produccion  VARCHAR(10) NOT NULL REFERENCES tb_produccion(id_produccion) ON DELETE CASCADE,
    numero         INT         NOT NULL,                       -- 1, 2, 3... dentro de la producción
    estado         VARCHAR(20) NOT NULL DEFAULT 'Abierto' CHECK (estado IN ('Abierto', 'Cancelado')),
    observacion    VARCHAR(200),
    creado_por     VARCHAR(10) REFERENCES empleados(id_empleados),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_estado   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_reproceso_numero UNIQUE (id_produccion, numero)
);

-- Piezas a reprocesar por talla
CREATE TABLE IF NOT EXISTS tb_reproceso_talla (
    id_reproceso           VARCHAR(10) NOT NULL REFERENCES tb_reproceso(id_reproceso) ON DELETE CASCADE,
    id_detalle_de_remision VARCHAR(10) NOT NULL REFERENCES tb_detalle_rem(id_detalle_de_remision),
    cantidad               INT         NOT NULL CHECK (cantidad > 0),
    PRIMARY KEY (id_reproceso, id_detalle_de_remision)
);

-- Los procesos del reproceso son pasos de la producción marcados con su reproceso
ALTER TABLE tb_pasos_produccion
    ADD COLUMN IF NOT EXISTS id_reproceso VARCHAR(10) REFERENCES tb_reproceso(id_reproceso) ON DELETE CASCADE;
DROP INDEX IF EXISTS uq_paso_produccion;
CREATE UNIQUE INDEX uq_paso_produccion
    ON tb_pasos_produccion (id_produccion, COALESCE(id_reproceso, ''), id_proceso, lower(COALESCE(descripcion, '')));

-- Las tareas guardan a qué reproceso pertenecen (lo pone el trigger a partir del paso)
ALTER TABLE tb_detalle_de_produccion
    ADD COLUMN IF NOT EXISTS id_reproceso VARCHAR(10) REFERENCES tb_reproceso(id_reproceso);

-- Insumos que el cliente envió para el reproceso (quedan en la remisión, marcados)
ALTER TABLE tb_insumos_enviados_x_cliente
    ADD COLUMN IF NOT EXISTS id_reproceso VARCHAR(10) REFERENCES tb_reproceso(id_reproceso);

-- ---------------------------------------------------------------------
-- Vistas base
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_pasos_produccion AS
 SELECT p.id_paso,
    p.id_produccion,
    p.id_proceso,
    pr.nombre AS proceso,
    p.descripcion,
    pr.nombre::text || COALESCE(' — ' || p.descripcion::text, '') AS paso,
    p.id_reproceso
   FROM tb_pasos_produccion p
     JOIN tb_procesos pr ON pr.id_proceso = p.id_proceso;

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
    COALESCE(sum(rd.cantidad_defectuosa), 0)::integer AS cantidad_defectuosa,
    d.id_reproceso
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

-- Faltantes de la producción normal (sin los pasos de reproceso)
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
                        AND d.id_reproceso IS NULL
                        AND d.id_paso IS DISTINCT FROM ps.id_paso), 0)::int AS defectuosas_otros_pasos
      FROM tb_produccion p
      JOIN vw_pasos_produccion ps ON ps.id_produccion = p.id_produccion AND ps.id_reproceso IS NULL
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

-- Faltantes de cada reproceso abierto (talla x paso del reproceso)
CREATE OR REPLACE VIEW vw_reproceso_faltantes AS
 WITH base AS (
    SELECT r.id_reproceso,
           r.id_produccion,
           rt.id_detalle_de_remision,
           dr.nombre_de_la_pieza,
           dr.talla,
           ps.id_paso,
           ps.paso,
           rt.cantidad AS cantidad_reproceso,
           COALESCE((SELECT sum(d.cantidad_asignada) FROM tb_detalle_de_produccion d
                      WHERE d.id_paso = ps.id_paso
                        AND d.id_detalle_de_remision = rt.id_detalle_de_remision), 0)::int AS asignado,
           COALESCE((SELECT sum(rd.cantidad_defectuosa)
                       FROM tb_registro_diario rd
                       JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
                      WHERE d.id_reproceso = r.id_reproceso
                        AND d.id_detalle_de_remision = rt.id_detalle_de_remision
                        AND d.id_paso <> ps.id_paso), 0)::int AS defectuosas_otros_pasos
      FROM tb_reproceso r
      JOIN tb_reproceso_talla rt ON rt.id_reproceso = r.id_reproceso
      JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision = rt.id_detalle_de_remision
      JOIN vw_pasos_produccion ps ON ps.id_reproceso = r.id_reproceso
     WHERE r.estado = 'Abierto'
 )
 SELECT id_reproceso, id_produccion, id_detalle_de_remision, nombre_de_la_pieza, talla, id_paso, paso,
        GREATEST(cantidad_reproceso - defectuosas_otros_pasos, 0) AS cantidad,
        asignado,
        defectuosas_otros_pasos
   FROM base
  WHERE asignado < cantidad_reproceso - defectuosas_otros_pasos;

-- Prendas terminadas por talla: las de la producción normal + las recuperadas en reprocesos.
-- Una prenda está terminada cuando pasó por TODOS los pasos (de la producción o del reproceso);
-- en cada paso cuenta la pieza más atrasada.
CREATE OR REPLACE VIEW vw_terminadas_por_talla AS
 WITH requeridos AS (       -- grupo = producción normal ('') o cada reproceso no cancelado
    SELECT p.id_produccion, '' AS grupo, dr.id_detalle_de_remision, dr.cantidad, ps.id_paso
      FROM tb_produccion p
      JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision
      JOIN tb_pasos_produccion ps ON ps.id_produccion = p.id_produccion AND ps.id_reproceso IS NULL
    UNION ALL
    SELECT r.id_produccion, r.id_reproceso, rt.id_detalle_de_remision, rt.cantidad, ps.id_paso
      FROM tb_reproceso r
      JOIN tb_reproceso_talla rt ON rt.id_reproceso = r.id_reproceso
      JOIN tb_pasos_produccion ps ON ps.id_reproceso = r.id_reproceso
     WHERE r.estado <> 'Cancelado'
 ), por_pieza AS (
    SELECT d.id_produccion, COALESCE(d.id_reproceso, '') AS grupo, d.id_detalle_de_remision, d.id_paso, d.id_tipo_pieza,
           sum(a.cantidad_realizada) AS realizado
      FROM tb_detalle_de_produccion d
      JOIN vw_asignaciones a USING (id_detalle_de_produccion)
     WHERE d.id_paso IS NOT NULL
     GROUP BY d.id_produccion, COALESCE(d.id_reproceso, ''), d.id_detalle_de_remision, d.id_paso, d.id_tipo_pieza
 ), por_paso AS (
    SELECT id_produccion, grupo, id_detalle_de_remision, id_paso, min(realizado) AS realizado
      FROM por_pieza
     GROUP BY id_produccion, grupo, id_detalle_de_remision, id_paso
 ), por_grupo AS (
    SELECT r.id_produccion, r.grupo, r.id_detalle_de_remision,
           LEAST(min(COALESCE(pp.realizado, 0)), r.cantidad)::int AS terminadas
      FROM requeridos r
      LEFT JOIN por_paso pp USING (id_produccion, grupo, id_detalle_de_remision, id_paso)
     GROUP BY r.id_produccion, r.grupo, r.id_detalle_de_remision, r.cantidad
 )
 SELECT g.id_produccion, g.id_detalle_de_remision,
        LEAST(sum(g.terminadas), dr.cantidad)::int AS terminadas,
        COALESCE(sum(g.terminadas) FILTER (WHERE g.grupo <> ''), 0)::int AS recuperadas
   FROM por_grupo g
   JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision = g.id_detalle_de_remision
  GROUP BY g.id_produccion, g.id_detalle_de_remision, dr.cantidad;

-- Defectuosas por talla y cuántas se pueden reprocesar todavía
CREATE OR REPLACE VIEW vw_defectuosas_por_talla AS
 SELECT p.id_produccion,
        dr.id_detalle_de_remision,
        dr.nombre_de_la_pieza,
        dr.talla,
        COALESCE((SELECT sum(rd.cantidad_defectuosa)
                    FROM tb_registro_diario rd
                    JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
                   WHERE d.id_produccion = p.id_produccion
                     AND d.id_detalle_de_remision = dr.id_detalle_de_remision), 0)::int AS defectuosas,
        COALESCE((SELECT sum(rt.cantidad)
                    FROM tb_reproceso_talla rt
                    JOIN tb_reproceso r ON r.id_reproceso = rt.id_reproceso
                   WHERE r.id_produccion = p.id_produccion AND r.estado <> 'Cancelado'
                     AND rt.id_detalle_de_remision = dr.id_detalle_de_remision), 0)::int AS en_reproceso
   FROM tb_produccion p
   JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision;

-- Reprocesos con su situación:
--   Cancelado | Por asignar (sin tareas) | En curso (falta asignar o reportar) | Terminado
CREATE OR REPLACE VIEW vw_reprocesos AS
 SELECT r.id_reproceso,
        r.id_produccion,
        r.numero,
        r.estado,
        r.observacion,
        r.creado_por,
        e.nombre AS creado_por_nombre,
        r.fecha_creacion,
        r.fecha_estado,
        COALESCE((SELECT sum(cantidad) FROM tb_reproceso_talla WHERE id_reproceso = r.id_reproceso), 0)::int AS total_piezas,
        (SELECT count(*) FROM tb_detalle_de_produccion WHERE id_reproceso = r.id_reproceso)::int AS tareas,
        COALESCE((SELECT sum(cantidad_pendiente) FROM vw_asignaciones WHERE id_reproceso = r.id_reproceso), 0)::int AS pendiente,
        COALESCE((SELECT sum(cantidad - asignado) FROM vw_reproceso_faltantes WHERE id_reproceso = r.id_reproceso), 0)::int AS sin_asignar,
        CASE
            WHEN r.estado = 'Cancelado' THEN 'Cancelado'
            WHEN NOT EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_reproceso = r.id_reproceso) THEN 'Por asignar'
            WHEN EXISTS (SELECT 1 FROM vw_reproceso_faltantes WHERE id_reproceso = r.id_reproceso)
              OR EXISTS (SELECT 1 FROM vw_asignaciones WHERE id_reproceso = r.id_reproceso AND cantidad_pendiente > 0)
                THEN 'En curso'
            ELSE 'Terminado'
        END AS situacion
   FROM tb_reproceso r
   LEFT JOIN empleados e ON e.id_empleados = r.creado_por;

-- ---------------------------------------------------------------------
-- Reglas del reproceso
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_reproceso_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_activo RECORD;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NOT EXISTS (SELECT 1 FROM tb_produccion WHERE id_produccion = NEW.id_produccion AND estado = 'En producción') THEN
            RAISE EXCEPTION 'Solo se puede reprocesar una producción que está En producción.';
        END IF;
        SELECT numero, situacion INTO v_activo FROM vw_reprocesos
         WHERE id_produccion = NEW.id_produccion AND situacion IN ('Por asignar', 'En curso') LIMIT 1;
        IF FOUND THEN
            RAISE EXCEPTION 'Ya hay un reproceso abierto (#%, %): termínelo o cancélelo antes de abrir otro.',
                v_activo.numero, v_activo.situacion;
        END IF;
        NEW.numero := COALESCE((SELECT max(numero) FROM tb_reproceso WHERE id_produccion = NEW.id_produccion), 0) + 1;
        NEW.estado := 'Abierto';
        NEW.observacion := NULLIF(btrim(NEW.observacion), '');
        RETURN NEW;
    END IF;

    IF NEW.id_produccion <> OLD.id_produccion THEN
        RAISE EXCEPTION 'No se puede cambiar la producción de un reproceso.';
    END IF;
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF NOT (OLD.estado = 'Abierto' AND NEW.estado = 'Cancelado') THEN
            RAISE EXCEPTION 'Cambio de estado no permitido en el reproceso: % -> %', OLD.estado, NEW.estado;
        END IF;
        IF EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_reproceso = NEW.id_reproceso) THEN
            RAISE EXCEPTION 'No se puede cancelar el reproceso #%: ya tiene tareas asignadas. Elimínelas primero.', NEW.numero;
        END IF;
        NEW.fecha_estado := now();
    END IF;
    RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_reproceso_validar ON tb_reproceso;
CREATE TRIGGER trg_reproceso_validar
    BEFORE INSERT OR UPDATE ON tb_reproceso
    FOR EACH ROW EXECUTE FUNCTION fn_reproceso_validar();

-- Al cancelar se quitan sus pasos (no tienen tareas) y sus insumos que nadie usó
CREATE OR REPLACE FUNCTION fn_reproceso_cancelado()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.estado = 'Cancelado' AND OLD.estado <> 'Cancelado' THEN
        DELETE FROM tb_pasos_produccion WHERE id_reproceso = NEW.id_reproceso;
        DELETE FROM tb_insumos_enviados_x_cliente
         WHERE id_reproceso = NEW.id_reproceso
           AND NOT EXISTS (SELECT 1 FROM tb_detalle_de_produccion d
                            WHERE d.id_insumos_enviados_x_cliente = tb_insumos_enviados_x_cliente.id_insumo_enviado);
    END IF;
    RETURN NULL;
END $function$;

DROP TRIGGER IF EXISTS trg_reproceso_cancelado ON tb_reproceso;
CREATE TRIGGER trg_reproceso_cancelado
    AFTER UPDATE OF estado ON tb_reproceso
    FOR EACH ROW EXECUTE FUNCTION fn_reproceso_cancelado();

-- Piezas por talla: de la misma remisión y sin pasar de las defectuosas disponibles
CREATE OR REPLACE FUNCTION fn_reproceso_talla_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_rep   RECORD;
    v_def   RECORD;
    v_otros INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF EXISTS (SELECT 1 FROM tb_detalle_de_produccion
                    WHERE id_reproceso = OLD.id_reproceso AND id_detalle_de_remision = OLD.id_detalle_de_remision) THEN
            RAISE EXCEPTION 'No se puede quitar esa talla del reproceso: ya tiene tareas.';
        END IF;
        RETURN OLD;
    END IF;

    SELECT r.id_produccion, r.estado, r.numero, p.id_remision INTO v_rep
      FROM tb_reproceso r JOIN tb_produccion p USING (id_produccion)
     WHERE r.id_reproceso = NEW.id_reproceso;
    IF v_rep.estado <> 'Abierto' THEN
        RAISE EXCEPTION 'El reproceso #% está cancelado.', v_rep.numero;
    END IF;

    SELECT * INTO v_def FROM vw_defectuosas_por_talla
     WHERE id_produccion = v_rep.id_produccion AND id_detalle_de_remision = NEW.id_detalle_de_remision;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La talla % no pertenece a la remisión %.', NEW.id_detalle_de_remision, v_rep.id_remision;
    END IF;

    -- Lo que ya está en reprocesos (sin contar esta misma fila)
    SELECT COALESCE(sum(rt.cantidad), 0) INTO v_otros
      FROM tb_reproceso_talla rt JOIN tb_reproceso r ON r.id_reproceso = rt.id_reproceso
     WHERE r.id_produccion = v_rep.id_produccion AND r.estado <> 'Cancelado'
       AND rt.id_detalle_de_remision = NEW.id_detalle_de_remision
       AND NOT (rt.id_reproceso = NEW.id_reproceso AND TG_OP = 'UPDATE');

    IF v_otros + NEW.cantidad > v_def.defectuosas THEN
        RAISE EXCEPTION 'De % talla % solo hay % pieza(s) defectuosa(s) por reprocesar; intenta reprocesar %.',
            v_def.nombre_de_la_pieza, v_def.talla, GREATEST(v_def.defectuosas - v_otros, 0), NEW.cantidad;
    END IF;
    RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_reproceso_talla_validar ON tb_reproceso_talla;
CREATE TRIGGER trg_reproceso_talla_validar
    BEFORE INSERT OR UPDATE OR DELETE ON tb_reproceso_talla
    FOR EACH ROW EXECUTE FUNCTION fn_reproceso_talla_validar();

-- Pasos: un paso de reproceso debe ser de un reproceso abierto de la misma producción
CREATE OR REPLACE FUNCTION fn_paso_produccion_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado VARCHAR;
BEGIN
    SELECT estado INTO v_estado FROM tb_produccion WHERE id_produccion = COALESCE(NEW.id_produccion, OLD.id_produccion);
    -- v_estado es NULL cuando se borra la producción completa (cascada)
    IF v_estado = 'Finalizada' THEN
        RAISE EXCEPTION 'La producción está Finalizada: no se pueden cambiar sus pasos.';
    END IF;
    IF TG_OP = 'UPDATE' AND (NEW.id_produccion <> OLD.id_produccion OR NEW.id_proceso <> OLD.id_proceso
                             OR NEW.id_reproceso IS DISTINCT FROM OLD.id_reproceso) THEN
        RAISE EXCEPTION 'Solo se puede cambiar la descripción del paso. Para otro proceso, agregue un paso nuevo.';
    END IF;
    IF TG_OP = 'DELETE' AND v_estado IS NOT NULL
       AND EXISTS (SELECT 1 FROM tb_detalle_de_produccion WHERE id_paso = OLD.id_paso) THEN
        RAISE EXCEPTION 'No se puede quitar el paso: ya tiene tareas asignadas. Elimine primero esas tareas.';
    END IF;
    IF TG_OP = 'INSERT' AND NOT EXISTS (
        SELECT 1 FROM tb_procesos WHERE id_proceso = NEW.id_proceso AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El proceso % no existe o está inactivo.', NEW.id_proceso;
    END IF;
    IF TG_OP = 'INSERT' AND NEW.id_reproceso IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tb_reproceso WHERE id_reproceso = NEW.id_reproceso
                                     AND id_produccion = NEW.id_produccion AND estado = 'Abierto') THEN
        RAISE EXCEPTION 'El reproceso % no está abierto en la producción %.', NEW.id_reproceso, NEW.id_produccion;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        NEW.descripcion := NULLIF(btrim(NEW.descripcion), '');
    END IF;
    RETURN COALESCE(NEW, OLD);
END $function$;

-- ---------------------------------------------------------------------
-- Tareas: ahora también las del reproceso (el tope por talla es lo que se reprocesa)
-- ---------------------------------------------------------------------
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
    v_paso         RECORD;
    v_asis         RECORD;
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

    -- El paso define el proceso de la tarea (y si es de un reproceso)
    SELECT p.id_paso, p.id_proceso, p.id_reproceso, pr.nombre, pr.estado INTO v_paso
      FROM tb_pasos_produccion p JOIN tb_procesos pr ON pr.id_proceso = p.id_proceso
     WHERE p.id_paso = NEW.id_paso AND p.id_produccion = NEW.id_produccion;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Elija uno de los pasos de la producción % para la tarea.', NEW.id_produccion;
    END IF;
    IF v_paso.estado <> 'Activo' THEN
        RAISE EXCEPTION 'El proceso % está inactivo.', v_paso.nombre;
    END IF;
    NEW.id_proceso := v_paso.id_proceso;
    NEW.id_reproceso := v_paso.id_reproceso;

    IF NOT EXISTS (SELECT 1 FROM empleados WHERE id_empleados = NEW.id_empleado AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El empleado % no existe o está inactivo.', NEW.id_empleado;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_pieza WHERE id_tipo_de_pieza = NEW.id_tipo_pieza AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El tipo de pieza % no existe o está inactivo.', NEW.id_tipo_pieza;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_maquina WHERE id_tipo_de_maquina = NEW.id_tipo_maquina AND estado = 'Activo') THEN
        RAISE EXCEPTION 'La máquina % no existe o está inactiva.', NEW.id_tipo_maquina;
    END IF;

    -- El empleado debe estar en el taller ahora (solo al asignarle una tarea nueva o cambiar de empleado)
    IF TG_OP = 'INSERT' OR NEW.id_empleado IS DISTINCT FROM OLD.id_empleado THEN
        SELECT estado, en_taller INTO v_asis FROM vw_asistencia
         WHERE id_empleado = NEW.id_empleado AND fecha = fn_hoy();
        IF NOT COALESCE(v_asis.en_taller, FALSE) THEN
            IF v_asis.estado = 'Presente' THEN
                RAISE EXCEPTION 'El empleado no está en el taller en este momento (salió y no ha vuelto): no se le pueden asignar tareas.';
            END IF;
            RAISE EXCEPTION 'El empleado no tiene entrada registrada hoy en la asistencia (%): no se le pueden asignar tareas.',
                COALESCE(v_asis.estado, 'No presente');
        END IF;
    END IF;

    -- La máquina debe servir para el proceso (si el proceso tiene máquinas configuradas)
    IF EXISTS (SELECT 1 FROM tb_proceso_x_maquina WHERE id_proceso = NEW.id_proceso)
       AND NOT EXISTS (SELECT 1 FROM tb_proceso_x_maquina
                        WHERE id_proceso = NEW.id_proceso AND id_maquina = NEW.id_tipo_maquina) THEN
        RAISE EXCEPTION 'Esa máquina no sirve para el proceso %. Elija una de las máquinas de ese proceso.', v_paso.nombre;
    END IF;

    -- La máquina no puede estar ocupada por otra tarea con unidades pendientes
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

    -- El empleado tampoco puede tener otra tarea con unidades pendientes
    SELECT a.id_detalle_de_produccion, a.id_produccion, a.cantidad_pendiente INTO v_ocupada
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

    -- En un reproceso, el tope de la talla es lo que se va a reprocesar
    IF NEW.id_reproceso IS NOT NULL THEN
        SELECT rt.cantidad INTO v_cant_pieza
          FROM tb_reproceso_talla rt JOIN tb_reproceso r ON r.id_reproceso = rt.id_reproceso
         WHERE rt.id_reproceso = NEW.id_reproceso AND rt.id_detalle_de_remision = NEW.id_detalle_de_remision
           AND r.estado = 'Abierto';
        IF v_cant_pieza IS NULL THEN
            RAISE EXCEPTION 'Esa talla no está en el reproceso (o el reproceso fue cancelado).';
        END IF;
    END IF;

    -- No asignar más unidades que las de la talla para el mismo paso y pieza
    SELECT COALESCE(sum(cantidad_asignada), 0) INTO v_ya_asignado
      FROM tb_detalle_de_produccion
     WHERE id_detalle_de_remision = NEW.id_detalle_de_remision
       AND id_paso = NEW.id_paso
       AND id_tipo_pieza = NEW.id_tipo_pieza
       AND id_detalle_de_produccion <> NEW.id_detalle_de_produccion;
    IF v_ya_asignado + NEW.cantidad_asignada > v_cant_pieza THEN
        RAISE EXCEPTION 'Se exceden las unidades de esa talla para ese paso y pieza: % %, ya asignadas %, intenta asignar %.',
            CASE WHEN NEW.id_reproceso IS NULL THEN 'pedidas' ELSE 'a reprocesar' END,
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

-- ---------------------------------------------------------------------
-- Finalizar: también debe estar terminado (o cancelado) el reproceso abierto
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_produccion_antes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_pendiente INT;
    v_falta     RECORD;
    v_rep       RECORD;
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
            IF NOT EXISTS (SELECT 1 FROM tb_pasos_produccion WHERE id_produccion = NEW.id_produccion AND id_reproceso IS NULL) THEN
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
            SELECT numero, situacion INTO v_rep FROM vw_reprocesos
             WHERE id_produccion = NEW.id_produccion AND situacion IN ('Por asignar', 'En curso') LIMIT 1;
            IF FOUND THEN
                RAISE EXCEPTION 'No se puede finalizar: el reproceso #% está %. Termínelo o cancélelo primero.',
                    v_rep.numero, lower(v_rep.situacion);
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

COMMIT;

-- Verificación: debe salir vacío al principio (todavía no hay reprocesos)
SELECT * FROM vw_reprocesos;
