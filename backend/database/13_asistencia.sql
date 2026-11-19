-- =====================================================================
-- 13 - Asistencia de empleados
--   * tb_asistencia: un registro por empleado por día (Presente / No presente).
--   * Al abrir la asistencia de un día se crea la lista con todos los empleados
--     Activos en "No presente"; el administrador marca a los que vinieron.
--   * Solo se asignan tareas a empleados Presentes hoy.
--   * Solo reportan avance diario los empleados Presentes hoy.
--   * "Hoy" se calcula con la hora de Colombia (Neon trabaja en UTC).
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 12).
-- =====================================================================
BEGIN;

-- Fecha de hoy en Colombia
CREATE OR REPLACE FUNCTION fn_hoy()
 RETURNS date
 LANGUAGE sql
 STABLE
AS $function$
    SELECT (now() AT TIME ZONE 'America/Bogota')::date;
$function$;

CREATE SEQUENCE IF NOT EXISTS seq_asistencia;

CREATE TABLE IF NOT EXISTS tb_asistencia (
    id_asistencia  VARCHAR(10) PRIMARY KEY DEFAULT fn_generar_id('ASI', 'seq_asistencia'),
    id_empleado    VARCHAR(10) NOT NULL REFERENCES empleados(id_empleados),
    fecha          DATE        NOT NULL DEFAULT fn_hoy(),
    estado         VARCHAR(20) NOT NULL DEFAULT 'No presente' CHECK (estado IN ('Presente', 'No presente')),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now(),
    registrado_por VARCHAR(10) REFERENCES empleados(id_empleados),
    observacion    VARCHAR(150),
    CONSTRAINT uq_asistencia_empleado_fecha UNIQUE (id_empleado, fecha)
);

-- No se registra asistencia de días futuros
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
    END IF;
    RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_asistencia_validar ON tb_asistencia;
CREATE TRIGGER trg_asistencia_validar
    BEFORE INSERT OR UPDATE ON tb_asistencia
    FOR EACH ROW EXECUTE FUNCTION fn_asistencia_validar();

-- Abre la asistencia de un día: agrega a los empleados Activos que falten, en "No presente"
CREATE OR REPLACE FUNCTION fn_abrir_asistencia(p_fecha date)
 RETURNS void
 LANGUAGE sql
AS $function$
    INSERT INTO tb_asistencia (id_empleado, fecha, estado)
    SELECT e.id_empleados, p_fecha, 'No presente'
      FROM empleados e
     WHERE e.estado = 'Activo'
    ON CONFLICT (id_empleado, fecha) DO NOTHING;
$function$;

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
       rp.nombre AS registrado_por_nombre
  FROM tb_asistencia a
  JOIN empleados e ON e.id_empleados = a.id_empleado
  LEFT JOIN roles r ON r.id_rol = e.id_rol
  LEFT JOIN empleados rp ON rp.id_empleados = a.registrado_por;

-- Disponibilidad de empleados: además de no tener tareas pendientes, debe estar Presente hoy
CREATE OR REPLACE VIEW vw_empleados_disponibilidad AS
 SELECT e.id_empleados AS id_empleado,
    e.nombre,
    o.id_detalle_de_produccion AS ocupado_en_tarea,
    o.id_produccion AS ocupado_en_produccion,
    o.cantidad_pendiente AS unidades_pendientes,
    (o.id_detalle_de_produccion IS NULL AND COALESCE(asis.estado = 'Presente', FALSE)) AS disponible,
    COALESCE(asis.estado = 'Presente', FALSE) AS presente_hoy
   FROM empleados e
   LEFT JOIN LATERAL (
        SELECT a.id_detalle_de_produccion, a.id_produccion, a.cantidad_pendiente
          FROM vw_asignaciones a
         WHERE a.id_empleado = e.id_empleados
           AND a.estado_produccion <> 'Finalizada'
           AND a.cantidad_pendiente > 0
         ORDER BY a.fecha_asignada
         LIMIT 1) o ON TRUE
   LEFT JOIN tb_asistencia asis ON asis.id_empleado = e.id_empleados AND asis.fecha = fn_hoy()
  WHERE e.estado = 'Activo';

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

    -- El empleado debe haber asistido hoy (solo al asignarle una tarea nueva o cambiar de empleado)
    IF (TG_OP = 'INSERT' OR NEW.id_empleado IS DISTINCT FROM OLD.id_empleado) AND NOT EXISTS (
        SELECT 1 FROM tb_asistencia
         WHERE id_empleado = NEW.id_empleado AND fecha = fn_hoy() AND estado = 'Presente') THEN
        RAISE EXCEPTION 'El empleado no está marcado como Presente en la asistencia de hoy: no se le pueden asignar tareas.';
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

    SELECT COALESCE(sum(cantidad), 0) INTO v_reportado
      FROM tb_registro_diario
     WHERE id_detalle_de_produccion = NEW.id_detalle_de_produccion
       AND id_registro_diario <> NEW.id_registro_diario;

    IF v_reportado + NEW.cantidad > v_asignada THEN
        RAISE EXCEPTION 'Supera lo asignado: asignado %, ya reportado %, intenta reportar %.',
            v_asignada, v_reportado, NEW.cantidad;
    END IF;
    RETURN NEW;
END $function$;

COMMIT;

-- Verificación: la asistencia de hoy queda lista para marcar
SELECT fn_abrir_asistencia(fn_hoy());
SELECT fecha, estado, COUNT(*) FROM tb_asistencia GROUP BY fecha, estado ORDER BY fecha DESC, estado;
