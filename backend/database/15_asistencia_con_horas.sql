-- =====================================================================
-- 15 - Asistencia con hora de entrada y salida (corrección de la instructora)
--   * tb_asistencia sigue siendo un registro por empleado por día, pero el
--     estado del día ahora es:
--        No presente | Presente | Permiso | Incapacidad | Vacaciones
--     "Presente" lo pone la base de datos sola cuando se registra una entrada.
--     Permiso / Incapacidad / Vacaciones son novedades de TODO el día (sin horas).
--   * tb_asistencia_marcacion: los tramos del día (entrada -> salida).
--     Ej: 6:00 -> 7:00 (salida por permiso: cita médica) y 9:00 -> 14:30.
--   * Solo se asignan tareas a quien está EN EL TALLER ahora
--     (tiene una entrada de hoy sin salida). Si salió con permiso y no ha
--     vuelto, no se le asigna nada.
--   * El registro diario sigue pidiendo que haya venido hoy (estado Presente).
--   * Una entrada sin salida de un día anterior queda marcada "sin salida"
--     para que el administrador la corrija.
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 14).
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- Estados del día
-- ---------------------------------------------------------------------
ALTER TABLE tb_asistencia DROP CONSTRAINT IF EXISTS tb_asistencia_estado_check;
ALTER TABLE tb_asistencia DROP CONSTRAINT IF EXISTS ck_asistencia_estado;
ALTER TABLE tb_asistencia ADD CONSTRAINT ck_asistencia_estado
    CHECK (estado IN ('No presente', 'Presente', 'Permiso', 'Incapacidad', 'Vacaciones'));

-- ---------------------------------------------------------------------
-- Tramos del día: entrada -> salida
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_asistencia_marcacion;

CREATE TABLE IF NOT EXISTS tb_asistencia_marcacion (
    id_marcacion   VARCHAR(10) PRIMARY KEY DEFAULT fn_generar_id('MAR', 'seq_asistencia_marcacion'),
    id_asistencia  VARCHAR(10) NOT NULL REFERENCES tb_asistencia(id_asistencia) ON DELETE CASCADE,
    hora_entrada   TIMESTAMPTZ NOT NULL,
    hora_salida    TIMESTAMPTZ,
    tipo_salida    VARCHAR(20) CHECK (tipo_salida IN ('Fin de jornada', 'Permiso')),
    motivo         VARCHAR(150),
    registrado_por VARCHAR(10) REFERENCES empleados(id_empleados),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_marcacion_salida CHECK (
        (hora_salida IS NULL AND tipo_salida IS NULL) OR
        (hora_salida IS NOT NULL AND tipo_salida IS NOT NULL AND hora_salida > hora_entrada))
);

CREATE INDEX IF NOT EXISTS ix_marcacion_asistencia ON tb_asistencia_marcacion (id_asistencia);

-- Validaciones de cada tramo
CREATE OR REPLACE FUNCTION fn_marcacion_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_asis    RECORD;
    v_choque  RECORD;
BEGIN
    SELECT a.fecha, a.estado, e.nombre INTO v_asis
      FROM tb_asistencia a JOIN empleados e ON e.id_empleados = a.id_empleado
     WHERE a.id_asistencia = NEW.id_asistencia;

    IF v_asis.estado IN ('Permiso', 'Incapacidad', 'Vacaciones') THEN
        RAISE EXCEPTION '% tiene el día marcado como %: quite esa novedad antes de registrar horas.',
            v_asis.nombre, v_asis.estado;
    END IF;

    -- Las horas deben ser del mismo día de la asistencia (hora de Colombia) y no futuras
    IF (NEW.hora_entrada AT TIME ZONE 'America/Bogota')::date <> v_asis.fecha THEN
        RAISE EXCEPTION 'La hora de entrada debe ser del %.', to_char(v_asis.fecha, 'DD/MM/YYYY');
    END IF;
    IF NEW.hora_salida IS NOT NULL AND (NEW.hora_salida AT TIME ZONE 'America/Bogota')::date <> v_asis.fecha THEN
        RAISE EXCEPTION 'La hora de salida debe ser del mismo día (%).', to_char(v_asis.fecha, 'DD/MM/YYYY');
    END IF;
    IF NEW.hora_entrada > now() + interval '1 minute'
       OR (NEW.hora_salida IS NOT NULL AND NEW.hora_salida > now() + interval '1 minute') THEN
        RAISE EXCEPTION 'No se pueden registrar horas que todavía no han pasado.';
    END IF;
    IF NEW.hora_salida IS NOT NULL AND NEW.hora_salida <= NEW.hora_entrada THEN
        RAISE EXCEPTION 'La hora de salida debe ser después de la hora de entrada.';
    END IF;

    -- Una salida por permiso lleva motivo
    NEW.motivo := NULLIF(btrim(NEW.motivo), '');
    IF NEW.tipo_salida = 'Permiso' AND NEW.motivo IS NULL THEN
        RAISE EXCEPTION 'Escriba el motivo del permiso (ej. cita médica).';
    END IF;

    -- Los tramos del día no se pueden cruzar (un tramo sin salida va "hasta ahora")
    SELECT m.id_marcacion,
           to_char(m.hora_entrada AT TIME ZONE 'America/Bogota', 'HH24:MI') AS entrada,
           COALESCE(to_char(m.hora_salida AT TIME ZONE 'America/Bogota', 'HH24:MI'), 'sin salida') AS salida
      INTO v_choque
      FROM tb_asistencia_marcacion m
     WHERE m.id_asistencia = NEW.id_asistencia
       AND m.id_marcacion <> NEW.id_marcacion
       AND tstzrange(m.hora_entrada, COALESCE(m.hora_salida, 'infinity'::timestamptz))
           && tstzrange(NEW.hora_entrada, COALESCE(NEW.hora_salida, 'infinity'::timestamptz))
     LIMIT 1;
    IF FOUND THEN
        IF v_choque.salida = 'sin salida' THEN
            RAISE EXCEPTION '% todavía está en el taller desde las % (sin salida): registre primero la salida.',
                v_asis.nombre, v_choque.entrada;
        END IF;
        RAISE EXCEPTION 'Ese horario se cruza con otro tramo del mismo día (% a %).', v_choque.entrada, v_choque.salida;
    END IF;

    RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_marcacion_validar ON tb_asistencia_marcacion;
CREATE TRIGGER trg_marcacion_validar
    BEFORE INSERT OR UPDATE ON tb_asistencia_marcacion
    FOR EACH ROW EXECUTE FUNCTION fn_marcacion_validar();

-- El estado del día se mantiene solo: con horas = Presente; sin horas = No presente
CREATE OR REPLACE FUNCTION fn_marcacion_sincronizar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_id VARCHAR := COALESCE(NEW.id_asistencia, OLD.id_asistencia);
BEGIN
    IF EXISTS (SELECT 1 FROM tb_asistencia_marcacion WHERE id_asistencia = v_id) THEN
        UPDATE tb_asistencia SET estado = 'Presente'
         WHERE id_asistencia = v_id AND estado <> 'Presente';
    ELSE
        UPDATE tb_asistencia SET estado = 'No presente'
         WHERE id_asistencia = v_id AND estado = 'Presente';
    END IF;
    RETURN NULL;
END $function$;

DROP TRIGGER IF EXISTS trg_marcacion_sincronizar ON tb_asistencia_marcacion;
CREATE TRIGGER trg_marcacion_sincronizar
    AFTER INSERT OR UPDATE OR DELETE ON tb_asistencia_marcacion
    FOR EACH ROW EXECUTE FUNCTION fn_marcacion_sincronizar();

-- Validación del día: no futuro; "Presente" solo con horas; novedades solo sin horas
CREATE OR REPLACE FUNCTION fn_asistencia_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.fecha > fn_hoy() THEN
        RAISE EXCEPTION 'No se puede registrar asistencia de un día futuro.';
    END IF;
    NEW.observacion := NULLIF(btrim(NEW.observacion), '');
    IF TG_OP = 'UPDATE' THEN
        NEW.fecha_registro := now();
        IF NEW.estado IS DISTINCT FROM OLD.estado THEN
            IF NEW.estado = 'Presente' AND NOT EXISTS (
                SELECT 1 FROM tb_asistencia_marcacion WHERE id_asistencia = NEW.id_asistencia) THEN
                RAISE EXCEPTION 'Para marcar Presente registre la hora de entrada.';
            END IF;
            IF NEW.estado <> 'Presente' AND EXISTS (
                SELECT 1 FROM tb_asistencia_marcacion WHERE id_asistencia = NEW.id_asistencia) THEN
                RAISE EXCEPTION 'Ese día ya tiene horas registradas: elimínelas antes de marcarlo como %.', NEW.estado;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END $function$;

-- ---------------------------------------------------------------------
-- Vistas
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_asistencia_marcacion AS
SELECT m.id_marcacion,
       m.id_asistencia,
       a.id_empleado,
       e.nombre AS empleado,
       a.fecha,
       m.hora_entrada,
       m.hora_salida,
       m.tipo_salida,
       m.motivo,
       -- minutos del tramo (si no tiene salida y es de hoy, cuenta hasta ahora)
       CASE
           WHEN m.hora_salida IS NOT NULL THEN floor(extract(epoch FROM m.hora_salida - m.hora_entrada) / 60)
           WHEN a.fecha = fn_hoy() THEN floor(extract(epoch FROM now() - m.hora_entrada) / 60)
           ELSE 0
       END::int AS minutos,
       (m.hora_salida IS NULL AND a.fecha < fn_hoy()) AS sin_salida,   -- olvidaron marcar la salida
       m.registrado_por,
       rp.nombre AS registrado_por_nombre,
       m.fecha_registro
  FROM tb_asistencia_marcacion m
  JOIN tb_asistencia a ON a.id_asistencia = m.id_asistencia
  JOIN empleados e ON e.id_empleados = a.id_empleado
  LEFT JOIN empleados rp ON rp.id_empleados = m.registrado_por;

CREATE OR REPLACE VIEW vw_asistencia AS
SELECT a.id_asistencia,
       a.fecha,
       a.id_empleado,
       e.nombre AS empleado,
       e.identificacion,
       r.descripcion_rol AS rol,
       a.estado,
       a.observacion,
       a.fecha_registro,
       a.registrado_por,
       rp.nombre AS registrado_por_nombre,
       EXISTS (SELECT 1 FROM tb_asistencia_marcacion m
                WHERE m.id_asistencia = a.id_asistencia AND m.hora_salida IS NULL
                  AND a.fecha = fn_hoy()) AS en_taller,
       COALESCE((SELECT sum(v.minutos) FROM vw_asistencia_marcacion v
                  WHERE v.id_asistencia = a.id_asistencia), 0)::int AS minutos_trabajados
  FROM tb_asistencia a
  JOIN empleados e ON e.id_empleados = a.id_empleado
  LEFT JOIN roles r ON r.id_rol = e.id_rol
  LEFT JOIN empleados rp ON rp.id_empleados = a.registrado_por;

-- Disponibilidad: para recibir tareas debe estar EN EL TALLER ahora
CREATE OR REPLACE VIEW vw_empleados_disponibilidad AS
 SELECT e.id_empleados AS id_empleado,
    e.nombre,
    o.id_detalle_de_produccion AS ocupado_en_tarea,
    o.id_produccion AS ocupado_en_produccion,
    o.cantidad_pendiente AS unidades_pendientes,
    (o.id_detalle_de_produccion IS NULL AND COALESCE(asis.en_taller, FALSE)) AS disponible,
    COALESCE(asis.estado = 'Presente', FALSE) AS presente_hoy,
    COALESCE(asis.en_taller, FALSE) AS en_taller,
    COALESCE(asis.estado, 'No presente') AS estado_asistencia
   FROM empleados e
   LEFT JOIN LATERAL (
        SELECT a.id_detalle_de_produccion, a.id_produccion, a.cantidad_pendiente
          FROM vw_asignaciones a
         WHERE a.id_empleado = e.id_empleados
           AND a.estado_produccion <> 'Finalizada'
           AND a.cantidad_pendiente > 0
         ORDER BY a.fecha_asignada
         LIMIT 1) o ON TRUE
   LEFT JOIN vw_asistencia asis ON asis.id_empleado = e.id_empleados AND asis.fecha = fn_hoy()
  WHERE e.estado = 'Activo';

-- ---------------------------------------------------------------------
-- Asignar tareas: el empleado debe estar en el taller ahora
-- (misma función de antes; solo cambia la validación de asistencia)
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
-- Datos que ya existían: a los Presentes de HOY se les crea su entrada
-- (a la hora en que se marcaron), así siguen pudiendo recibir tareas.
-- Los días anteriores quedan como estaban (Presente sin horario).
-- ---------------------------------------------------------------------
INSERT INTO tb_asistencia_marcacion (id_asistencia, hora_entrada, registrado_por)
SELECT a.id_asistencia,
       CASE WHEN (a.fecha_registro AT TIME ZONE 'America/Bogota')::date = a.fecha AND a.fecha_registro <= now()
            THEN a.fecha_registro ELSE now() END,
       a.registrado_por
  FROM tb_asistencia a
 WHERE a.fecha = fn_hoy() AND a.estado = 'Presente'
   AND NOT EXISTS (SELECT 1 FROM tb_asistencia_marcacion m WHERE m.id_asistencia = a.id_asistencia);

COMMIT;

-- Verificación: asistencia de hoy con sus horas
SELECT empleado, estado, en_taller, minutos_trabajados FROM vw_asistencia WHERE fecha = fn_hoy() ORDER BY empleado;
