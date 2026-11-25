-- =====================================================================
-- 20 - Veces de cada proceso y tope real por talla
--   Al armar los procesos de la producción se dice CUÁNTAS VECES se hace cada
--   proceso a cada prenda (ej. Costura ×2, Empaquetado ×1).
--   El tope de un proceso en una talla = prendas de la talla × veces.
--   Antes el tope era por pieza, y escogiendo otra pieza se podía volver a
--   asignar un proceso ya hecho (ej. Empaquetado dos veces). Eso ya no se puede.
--   Se ejecuta UNA vez en el SQL Editor de Neon (después del 19).
-- =====================================================================
BEGIN;

ALTER TABLE tb_pasos_produccion
    ADD COLUMN IF NOT EXISTS veces SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE tb_pasos_produccion DROP CONSTRAINT IF EXISTS ck_pasos_veces;
ALTER TABLE tb_pasos_produccion
    ADD CONSTRAINT ck_pasos_veces CHECK (veces BETWEEN 1 AND 20);

-- Pasos con sus veces (columna nueva al final)
CREATE OR REPLACE VIEW vw_pasos_produccion AS
SELECT p.id_paso,
       p.id_produccion,
       p.id_proceso,
       pr.nombre AS proceso,
       p.descripcion,
       pr.nombre::text || COALESCE(' — ' || p.descripcion::text, '') AS paso,
       p.id_reproceso,
       p.veces
  FROM tb_pasos_produccion p
  JOIN tb_procesos pr ON pr.id_proceso = p.id_proceso;

-- Lo que falta por asignar: cantidad = (prendas - perdidas en otros pasos) × veces
CREATE OR REPLACE VIEW vw_produccion_faltantes AS
WITH base AS (
    SELECT p.id_produccion, dr.id_detalle_de_remision, dr.nombre_de_la_pieza, dr.talla,
           ps.id_paso, ps.paso, ps.veces,
           dr.cantidad AS cantidad_talla,
           COALESCE((SELECT sum(d.cantidad_asignada) FROM tb_detalle_de_produccion d
                      WHERE d.id_paso = ps.id_paso AND d.id_detalle_de_remision = dr.id_detalle_de_remision), 0)::int AS asignado,
           COALESCE((SELECT sum(rd.cantidad_defectuosa)
                       FROM tb_registro_diario rd JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
                      WHERE d.id_produccion = p.id_produccion AND d.id_detalle_de_remision = dr.id_detalle_de_remision
                        AND d.id_reproceso IS NULL AND d.id_paso IS DISTINCT FROM ps.id_paso), 0)::int AS defectuosas_otros_pasos
      FROM tb_produccion p
      JOIN vw_pasos_produccion ps ON ps.id_produccion = p.id_produccion AND ps.id_reproceso IS NULL
      JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision
)
SELECT id_produccion, id_detalle_de_remision, nombre_de_la_pieza, talla, id_paso, paso,
       GREATEST(cantidad_talla - defectuosas_otros_pasos, 0) * veces AS cantidad,
       asignado, defectuosas_otros_pasos
  FROM base
 WHERE asignado < GREATEST(cantidad_talla - defectuosas_otros_pasos, 0) * veces;

CREATE OR REPLACE VIEW vw_reproceso_faltantes AS
WITH base AS (
    SELECT r.id_reproceso, r.id_produccion, rt.id_detalle_de_remision, dr.nombre_de_la_pieza, dr.talla,
           ps.id_paso, ps.paso, ps.veces,
           rt.cantidad AS cantidad_reproceso,
           COALESCE((SELECT sum(d.cantidad_asignada) FROM tb_detalle_de_produccion d
                      WHERE d.id_paso = ps.id_paso AND d.id_detalle_de_remision = rt.id_detalle_de_remision), 0)::int AS asignado,
           COALESCE((SELECT sum(rd.cantidad_defectuosa)
                       FROM tb_registro_diario rd JOIN tb_detalle_de_produccion d USING (id_detalle_de_produccion)
                      WHERE d.id_reproceso = r.id_reproceso AND d.id_detalle_de_remision = rt.id_detalle_de_remision
                        AND d.id_paso <> ps.id_paso), 0)::int AS defectuosas_otros_pasos
      FROM tb_reproceso r
      JOIN tb_reproceso_talla rt ON rt.id_reproceso = r.id_reproceso
      JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision = rt.id_detalle_de_remision
      JOIN vw_pasos_produccion ps ON ps.id_reproceso = r.id_reproceso
     WHERE r.estado = 'Abierto'
)
SELECT id_reproceso, id_produccion, id_detalle_de_remision, nombre_de_la_pieza, talla, id_paso, paso,
       GREATEST(cantidad_reproceso - defectuosas_otros_pasos, 0) * veces AS cantidad,
       asignado, defectuosas_otros_pasos
  FROM base
 WHERE asignado < GREATEST(cantidad_reproceso - defectuosas_otros_pasos, 0) * veces;

-- Prendas terminadas por talla: en cada paso cuenta lo realizado (todas las piezas juntas)
-- dividido entre las veces del paso; la talla va por el paso más atrasado.
CREATE OR REPLACE VIEW vw_terminadas_por_talla AS
WITH requeridos AS (
    SELECT p.id_produccion, ''::varchar AS grupo, dr.id_detalle_de_remision, dr.cantidad, ps.id_paso, ps.veces
      FROM tb_produccion p
      JOIN tb_detalle_rem dr ON dr.id_remision = p.id_remision
      JOIN tb_pasos_produccion ps ON ps.id_produccion = p.id_produccion AND ps.id_reproceso IS NULL
    UNION ALL
    SELECT r.id_produccion, r.id_reproceso, rt.id_detalle_de_remision, rt.cantidad, ps.id_paso, ps.veces
      FROM tb_reproceso r
      JOIN tb_reproceso_talla rt ON rt.id_reproceso = r.id_reproceso
      JOIN tb_pasos_produccion ps ON ps.id_reproceso = r.id_reproceso
     WHERE r.estado <> 'Cancelado'
), por_paso AS (
    SELECT d.id_produccion, COALESCE(d.id_reproceso, '')::varchar AS grupo, d.id_detalle_de_remision, d.id_paso,
           sum(a.cantidad_realizada) AS realizado
      FROM tb_detalle_de_produccion d
      JOIN vw_asignaciones a USING (id_detalle_de_produccion)
     WHERE d.id_paso IS NOT NULL
     GROUP BY d.id_produccion, COALESCE(d.id_reproceso, ''), d.id_detalle_de_remision, d.id_paso
), por_grupo AS (
    SELECT r.id_produccion, r.grupo, r.id_detalle_de_remision,
           LEAST(min(COALESCE(pp.realizado, 0) / r.veces), r.cantidad)::int AS terminadas
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

-- Pasos: ahora también se pueden cambiar las veces (sin bajar de lo ya asignado)
CREATE OR REPLACE FUNCTION public.fn_paso_produccion_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado VARCHAR;
    v_exceso RECORD;
BEGIN
    SELECT estado INTO v_estado FROM tb_produccion WHERE id_produccion = COALESCE(NEW.id_produccion, OLD.id_produccion);
    -- v_estado es NULL cuando se borra la producción completa (cascada)
    IF v_estado = 'Finalizada' THEN
        RAISE EXCEPTION 'La producción está Finalizada: no se pueden cambiar sus pasos.';
    END IF;
    IF TG_OP = 'UPDATE' AND (NEW.id_produccion <> OLD.id_produccion OR NEW.id_proceso <> OLD.id_proceso
                             OR NEW.id_reproceso IS DISTINCT FROM OLD.id_reproceso) THEN
        RAISE EXCEPTION 'Solo se puede cambiar la descripción o las veces del paso. Para otro proceso, agregue un paso nuevo.';
    END IF;
    -- Bajar las veces: no puede quedar por debajo de lo que ya está asignado en alguna talla
    IF TG_OP = 'UPDATE' AND NEW.veces < OLD.veces THEN
        SELECT d.id_detalle_de_remision, sum(d.cantidad_asignada)::int AS asignado,
               COALESCE(rt.cantidad, dr.cantidad) AS prendas
          INTO v_exceso
          FROM tb_detalle_de_produccion d
          JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision = d.id_detalle_de_remision
          LEFT JOIN tb_reproceso_talla rt ON rt.id_reproceso = NEW.id_reproceso
                                          AND rt.id_detalle_de_remision = d.id_detalle_de_remision
         WHERE d.id_paso = NEW.id_paso
         GROUP BY d.id_detalle_de_remision, rt.cantidad, dr.cantidad
        HAVING sum(d.cantidad_asignada) > COALESCE(rt.cantidad, dr.cantidad) * NEW.veces
         LIMIT 1;
        IF FOUND THEN
            RAISE EXCEPTION 'No se pueden bajar las veces a %: en una talla ya hay % und asignadas de ese proceso (máximo % con % vez/veces).',
                NEW.veces, v_exceso.asignado, v_exceso.prendas * NEW.veces, NEW.veces;
        END IF;
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

-- Tareas: el tope es por talla y paso (prendas × veces), sin importar la pieza
CREATE OR REPLACE FUNCTION public.fn_detalle_produccion_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_remision     VARCHAR;
    v_estado_prod  VARCHAR;
    v_cant_pieza   INT;
    v_ya_asignado  INT;
    v_tope         INT;
    v_revisar      BOOLEAN;
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
    SELECT p.id_paso, p.id_proceso, p.id_reproceso, p.veces, pr.nombre, pr.estado,
           pr.nombre || COALESCE(' — ' || p.descripcion, '') AS paso INTO v_paso
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

    -- Tope del paso para la talla = prendas × veces que se hace el proceso a cada prenda.
    -- La pieza NO abre cupo nuevo: un proceso ya asignado completo no se puede volver a asignar.
    -- (Solo se revisa si la tarea es nueva, sube la cantidad o cambia de paso/talla)
    IF TG_OP = 'INSERT' THEN
        v_revisar := TRUE;
    ELSE
        v_revisar := NEW.cantidad_asignada > OLD.cantidad_asignada
                  OR NEW.id_paso IS DISTINCT FROM OLD.id_paso
                  OR NEW.id_detalle_de_remision IS DISTINCT FROM OLD.id_detalle_de_remision;
    END IF;
    IF v_revisar THEN
        SELECT COALESCE(sum(cantidad_asignada), 0) INTO v_ya_asignado
          FROM tb_detalle_de_produccion
         WHERE id_detalle_de_remision = NEW.id_detalle_de_remision
           AND id_paso = NEW.id_paso
           AND id_detalle_de_produccion <> NEW.id_detalle_de_produccion;
        v_tope := v_cant_pieza * v_paso.veces;
        IF v_ya_asignado >= v_tope THEN
            RAISE EXCEPTION 'El proceso % ya está asignado completo para esa talla (% de % und). No se puede asignar otra vez.',
                v_paso.paso, v_ya_asignado, v_tope;
        END IF;
        IF v_ya_asignado + NEW.cantidad_asignada > v_tope THEN
            RAISE EXCEPTION 'Se exceden las unidades del proceso % para esa talla: % prendas × % vez(veces) = % und, ya asignadas %, quedan %.',
                v_paso.paso, v_cant_pieza, v_paso.veces, v_tope, v_ya_asignado, v_tope - v_ya_asignado;
        END IF;
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

COMMIT;
