-- =====================================================================
-- 12 - Pasos de la producción y máquinas por proceso
--
--   1) tb_pasos_produccion: los procesos elegidos para una producción ahora
--      son "pasos". El mismo proceso puede ir varias veces con una descripción
--      (ej. Bordado - "logo en el pecho" y Bordado - "nombre en la manga").
--      Cada paso tiene sus tareas, su "falta asignar" por talla y cuenta
--      aparte para las prendas terminadas. Reemplaza a tb_produccion_x_proceso.
--   2) Cada tarea apunta a su paso (id_paso). id_proceso se sigue guardando
--      y lo llena la base de datos a partir del paso.
--   3) tb_proceso_x_maquina: qué máquinas sirven para cada proceso
--      (ej. Bordado -> Bordadora 1 y 2). Si un proceso no tiene máquinas
--      configuradas, se puede usar cualquiera.
--
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 11).
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 1) PASOS DE LA PRODUCCIÓN
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_pasos_produccion;

CREATE TABLE IF NOT EXISTS tb_pasos_produccion (
    id_paso       VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('PAS', 'seq_pasos_produccion'),
    id_produccion VARCHAR(10)  NOT NULL REFERENCES tb_produccion(id_produccion) ON DELETE CASCADE,
    id_proceso    VARCHAR(10)  NOT NULL REFERENCES tb_procesos(id_proceso),
    descripcion   VARCHAR(100)
);

-- El mismo proceso solo se repite en una producción si la descripción es distinta
CREATE UNIQUE INDEX IF NOT EXISTS uq_paso_produccion
    ON tb_pasos_produccion (id_produccion, id_proceso, lower(COALESCE(descripcion, '')));

-- Los procesos ya elegidos pasan a ser pasos (sin descripción)
INSERT INTO tb_pasos_produccion (id_produccion, id_proceso)
SELECT pp.id_produccion, pp.id_proceso
  FROM tb_produccion_x_proceso pp
 WHERE NOT EXISTS (SELECT 1 FROM tb_pasos_produccion x
                    WHERE x.id_produccion = pp.id_produccion AND x.id_proceso = pp.id_proceso);

-- Cada tarea apunta a su paso
ALTER TABLE tb_detalle_de_produccion
    ADD COLUMN IF NOT EXISTS id_paso VARCHAR(10) REFERENCES tb_pasos_produccion(id_paso);

ALTER TABLE tb_detalle_de_produccion DISABLE TRIGGER USER;
UPDATE tb_detalle_de_produccion d
   SET id_paso = p.id_paso
  FROM tb_pasos_produccion p
 WHERE d.id_paso IS NULL AND p.id_produccion = d.id_produccion AND p.id_proceso = d.id_proceso;
ALTER TABLE tb_detalle_de_produccion ENABLE TRIGGER USER;

-- La tabla anterior ya no se usa (primero la vista que dependía de ella)
DROP VIEW IF EXISTS vw_produccion_faltantes;
DROP TRIGGER IF EXISTS trg_tarea_proceso_elegido ON tb_detalle_de_produccion;
DROP FUNCTION IF EXISTS fn_tarea_proceso_elegido();
DROP TABLE IF EXISTS tb_produccion_x_proceso;
DROP FUNCTION IF EXISTS fn_produccion_x_proceso_validar();

-- Cambios en los pasos: no en producciones finalizadas ni quitando un paso con tareas
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
    IF TG_OP = 'UPDATE' AND (NEW.id_produccion <> OLD.id_produccion OR NEW.id_proceso <> OLD.id_proceso) THEN
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
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        NEW.descripcion := NULLIF(btrim(NEW.descripcion), '');
    END IF;
    RETURN COALESCE(NEW, OLD);
END $function$;

DROP TRIGGER IF EXISTS trg_paso_produccion_validar ON tb_pasos_produccion;
CREATE TRIGGER trg_paso_produccion_validar
    BEFORE INSERT OR UPDATE OR DELETE ON tb_pasos_produccion
    FOR EACH ROW EXECUTE FUNCTION fn_paso_produccion_validar();

-- ---------------------------------------------------------------------
-- 3) MÁQUINAS QUE SIRVEN PARA CADA PROCESO
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_proceso_x_maquina (
    id_proceso VARCHAR(10) NOT NULL REFERENCES tb_procesos(id_proceso) ON DELETE CASCADE,
    id_maquina VARCHAR(10) NOT NULL REFERENCES tipo_de_maquina(id_tipo_de_maquina) ON DELETE CASCADE,
    PRIMARY KEY (id_proceso, id_maquina)
);

-- ---------------------------------------------------------------------
-- TAREAS: paso obligatorio, tope por paso, máquina compatible y libre,
-- empleado libre (incluye las reglas de los scripts 08 y 09)
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

    -- El paso define el proceso de la tarea
    SELECT p.id_paso, p.id_proceso, pr.nombre, pr.estado INTO v_paso
      FROM tb_pasos_produccion p JOIN tb_procesos pr ON pr.id_proceso = p.id_proceso
     WHERE p.id_paso = NEW.id_paso AND p.id_produccion = NEW.id_produccion;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Elija uno de los pasos de la producción % para la tarea.', NEW.id_produccion;
    END IF;
    IF v_paso.estado <> 'Activo' THEN
        RAISE EXCEPTION 'El proceso % está inactivo.', v_paso.nombre;
    END IF;
    NEW.id_proceso := v_paso.id_proceso;

    IF NOT EXISTS (SELECT 1 FROM empleados WHERE id_empleados = NEW.id_empleado AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El empleado % no existe o está inactivo.', NEW.id_empleado;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_pieza WHERE id_tipo_de_pieza = NEW.id_tipo_pieza AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El tipo de pieza % no existe o está inactivo.', NEW.id_tipo_pieza;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_maquina WHERE id_tipo_de_maquina = NEW.id_tipo_maquina AND estado = 'Activo') THEN
        RAISE EXCEPTION 'La máquina % no existe o está inactiva.', NEW.id_tipo_maquina;
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

    -- No asignar más unidades que las de la talla para el mismo paso y pieza
    SELECT COALESCE(sum(cantidad_asignada), 0) INTO v_ya_asignado
      FROM tb_detalle_de_produccion
     WHERE id_detalle_de_remision = NEW.id_detalle_de_remision
       AND id_paso = NEW.id_paso
       AND id_tipo_pieza = NEW.id_tipo_pieza
       AND id_detalle_de_produccion <> NEW.id_detalle_de_produccion;
    IF v_ya_asignado + NEW.cantidad_asignada > v_cant_pieza THEN
        RAISE EXCEPTION 'Se exceden las unidades de esa talla para ese paso y pieza: pedidas %, ya asignadas %, intenta asignar %.',
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
-- VISTAS
-- ---------------------------------------------------------------------
-- Nombre que se muestra de un paso: "Bordado — logo en el pecho"
CREATE OR REPLACE VIEW vw_pasos_produccion AS
SELECT p.id_paso,
       p.id_produccion,
       p.id_proceso,
       pr.nombre AS proceso,
       p.descripcion,
       pr.nombre || COALESCE(' — ' || p.descripcion, '') AS paso
  FROM tb_pasos_produccion p
  JOIN tb_procesos pr ON pr.id_proceso = p.id_proceso;

-- vw_asignaciones: se agregan el paso y su nombre (al final)
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
    COALESCE(sum(rd.cantidad), 0::bigint)::integer AS cantidad_realizada,
    (d.cantidad_asignada - COALESCE(sum(rd.cantidad), 0::bigint))::integer AS cantidad_pendiente,
    d.fecha_asignada,
    d.id_proceso,
    pr.nombre AS proceso,
    d.id_paso,
    pr.nombre || COALESCE(' — ' || ps.descripcion, '') AS paso
   FROM tb_detalle_de_produccion d
     JOIN tb_produccion p ON p.id_produccion::text = d.id_produccion::text
     JOIN empleados e ON e.id_empleados::text = d.id_empleado::text
     JOIN tipo_de_pieza tp ON tp.id_tipo_de_pieza::text = d.id_tipo_pieza::text
     JOIN tipo_de_maquina tm ON tm.id_tipo_de_maquina::text = d.id_tipo_maquina::text
     JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision::text = d.id_detalle_de_remision::text
     LEFT JOIN tb_procesos pr ON pr.id_proceso::text = d.id_proceso::text
     LEFT JOIN tb_pasos_produccion ps ON ps.id_paso::text = d.id_paso::text
     LEFT JOIN tb_registro_diario rd ON rd.id_detalle_de_produccion::text = d.id_detalle_de_produccion::text
  GROUP BY d.id_detalle_de_produccion, p.id_remision, p.estado, e.nombre, tp.nombre, tm.nombre,
           dr.nombre_de_la_pieza, dr.talla, pr.nombre, ps.descripcion;

-- Talla x paso que todavía no tiene todas sus unidades asignadas
DROP VIEW IF EXISTS vw_produccion_faltantes;
CREATE VIEW vw_produccion_faltantes AS
SELECT p.id_produccion,
       dr.id_detalle_de_remision,
       dr.nombre_de_la_pieza,
       dr.talla,
       ps.id_paso,
       ps.paso,
       dr.cantidad,
       COALESCE((SELECT sum(d.cantidad_asignada) FROM tb_detalle_de_produccion d
                  WHERE d.id_paso = ps.id_paso
                    AND d.id_detalle_de_remision = dr.id_detalle_de_remision), 0)::int AS asignado
  FROM tb_produccion p
  JOIN vw_pasos_produccion ps ON ps.id_produccion = p.id_produccion
  JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision
 WHERE COALESCE((SELECT sum(d.cantidad_asignada) FROM tb_detalle_de_produccion d
                  WHERE d.id_paso = ps.id_paso
                    AND d.id_detalle_de_remision = dr.id_detalle_de_remision), 0) < dr.cantidad;

-- ---------------------------------------------------------------------
-- INICIAR / FINALIZAR (usa los pasos)
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
            SELECT * INTO v_falta FROM vw_produccion_faltantes WHERE id_produccion = NEW.id_produccion LIMIT 1;
            IF FOUND THEN
                RAISE EXCEPTION 'Falta asignar % de % unidades de % talla % en el paso %.',
                    v_falta.cantidad - v_falta.asignado, v_falta.cantidad, v_falta.nombre_de_la_pieza,
                    v_falta.talla, v_falta.paso;
            END IF;
        END IF;
        IF NEW.estado = 'Finalizada' THEN
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

-- Verificación: pasos de cada producción
SELECT id_produccion, string_agg(paso, ', ' ORDER BY id_paso) AS pasos
  FROM vw_pasos_produccion GROUP BY id_produccion ORDER BY id_produccion;
