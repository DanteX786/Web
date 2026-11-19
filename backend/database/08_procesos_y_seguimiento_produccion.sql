-- =====================================================================
-- 08 - Nueva regla de negocio de Producción (correcciones de la instructora)
--
--   1) tb_procesos: tabla maestra con los procesos de una confección
--      (corte, confección, fileteado, bordado...). Cada tarea de la
--      producción dice qué proceso se hace.
--   2) Estados de la producción: Por asignar -> En producción -> Finalizada.
--      La producción nace desde la remisión aprobada ("Enviar a producir").
--      Se permiten varias producciones al mismo tiempo.
--   3) tipo_de_maquina guarda cada máquina física (en la app se llama
--      "Máquinas"). Una máquina ocupada (tarea con unidades pendientes en
--      una producción no finalizada) no se puede asignar a otra tarea.
--   4) tb_seguimiento_produccion: historial de estados de la producción,
--      se llena solo con un trigger (igual que el de la remisión).
--   5) fecha_estado: fecha del último cambio de estado de la producción.
--
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon.
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 1) PROCESOS
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_procesos;

CREATE TABLE IF NOT EXISTS tb_procesos (
    id_proceso  VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('PRC', 'seq_procesos'),
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    estado      VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo'))
);

INSERT INTO tb_procesos (nombre, descripcion) VALUES
    ('Trazo y corte',      'Trazar los moldes sobre la tela y cortar las piezas'),
    ('Confección',         'Unir las piezas en máquina plana'),
    ('Fileteado',          'Rematar los bordes de la tela con fileteadora'),
    ('Recubrimiento',      'Costuras de recubridora en dobladillos y cuellos'),
    ('Bordado',            'Bordar logos, nombres o diseños'),
    ('Estampado',          'Estampar diseños sobre la prenda'),
    ('Pegado de cuello',   'Unir el cuello a la prenda'),
    ('Pegado de mangas',   'Unir las mangas al cuerpo de la prenda'),
    ('Ojal y botón',       'Hacer ojales y pegar botones'),
    ('Pegado de cremallera', 'Instalar cremalleras'),
    ('Pegado de etiquetas', 'Coser marquillas y etiquetas'),
    ('Terminación',        'Quitar hilos sobrantes y revisar la calidad'),
    ('Planchado',          'Planchar la prenda terminada'),
    ('Empaque',            'Doblar, embolsar y empacar')
ON CONFLICT (nombre) DO NOTHING;

-- Cada tarea (asignación) indica su proceso. Las tareas viejas quedan sin proceso.
ALTER TABLE tb_detalle_de_produccion
    ADD COLUMN IF NOT EXISTS id_proceso VARCHAR(10) REFERENCES tb_procesos(id_proceso);

-- ---------------------------------------------------------------------
-- 2) ESTADOS DE LA PRODUCCIÓN + fecha_estado
-- ---------------------------------------------------------------------
ALTER TABLE tb_produccion ADD COLUMN IF NOT EXISTS fecha_estado TIMESTAMPTZ;

ALTER TABLE tb_produccion DROP CONSTRAINT IF EXISTS tb_produccion_estado_check;

-- Migración de datos sin disparar los triggers (no deben crear seguimiento aquí)
ALTER TABLE tb_produccion DISABLE TRIGGER USER;
UPDATE tb_produccion SET estado = 'En producción' WHERE estado = 'En proceso';
UPDATE tb_produccion SET fecha_estado = fecha_inicio::TIMESTAMPTZ WHERE fecha_estado IS NULL;
ALTER TABLE tb_produccion ENABLE TRIGGER USER;

ALTER TABLE tb_produccion
    ALTER COLUMN fecha_estado SET DEFAULT now(),
    ALTER COLUMN fecha_estado SET NOT NULL,
    ALTER COLUMN estado SET DEFAULT 'Por asignar',
    ADD CONSTRAINT tb_produccion_estado_check
        CHECK (estado IN ('Por asignar', 'En producción', 'Finalizada'));

-- ---------------------------------------------------------------------
-- 4) SEGUIMIENTO DE LA PRODUCCIÓN (igual al de la remisión)
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_seguimiento_produccion;

CREATE TABLE IF NOT EXISTS tb_seguimiento_produccion (
    id_seguimiento_produccion VARCHAR(10) PRIMARY KEY
        DEFAULT fn_generar_id('SGP', 'seq_seguimiento_produccion'),
    id_produccion        VARCHAR(10) NOT NULL REFERENCES tb_produccion(id_produccion) ON DELETE CASCADE,
    estado_anterior      VARCHAR(20),
    estado_nuevo         VARCHAR(20) NOT NULL,
    responsable_empleado VARCHAR(10) REFERENCES empleados(id_empleados),
    fecha_hora           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

DROP TRIGGER IF EXISTS trg_seguimiento_produccion_inmutable ON tb_seguimiento_produccion;
CREATE TRIGGER trg_seguimiento_produccion_inmutable
    BEFORE UPDATE ON tb_seguimiento_produccion
    FOR EACH ROW EXECUTE FUNCTION fn_seguimiento_inmutable();

-- Historial inicial de las producciones que ya existían: se toma quién y
-- cuándo pasó la remisión a "En producción".
INSERT INTO tb_seguimiento_produccion (id_produccion, estado_anterior, estado_nuevo, responsable_empleado, fecha_hora)
SELECT p.id_produccion, NULL, p.estado, s.responsable_empleado, COALESCE(s.fecha_hora, p.fecha_inicio::TIMESTAMPTZ)
  FROM tb_produccion p
  LEFT JOIN LATERAL (
        SELECT responsable_empleado, fecha_hora FROM tb_seguimiento_remision
         WHERE id_remision = p.id_remision AND estado_nuevo = 'En producción'
         ORDER BY fecha_hora LIMIT 1) s ON TRUE
 WHERE NOT EXISTS (SELECT 1 FROM tb_seguimiento_produccion x WHERE x.id_produccion = p.id_produccion);

CREATE OR REPLACE VIEW vw_seguimiento_produccion AS
SELECT s.id_seguimiento_produccion,
       s.id_produccion,
       p.id_remision,
       s.estado_anterior,
       s.estado_nuevo,
       COALESCE(e.nombre, 'Sistema') AS responsable,
       'Empleado'::TEXT AS tipo_responsable,
       s.fecha_hora
  FROM tb_seguimiento_produccion s
  JOIN tb_produccion p ON p.id_produccion = s.id_produccion
  LEFT JOIN empleados e ON e.id_empleados = s.responsable_empleado;

-- ---------------------------------------------------------------------
-- TRIGGERS DE LA PRODUCCIÓN
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_produccion_antes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
            NEW.fecha_entrega := COALESCE(NEW.fecha_entrega, CURRENT_DATE);
        END IF;
        NEW.fecha_estado := now();
    END IF;
    RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION fn_produccion_despues()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_empleado VARCHAR := fn_empleado_sesion();
BEGIN
    IF TG_OP = 'INSERT' OR NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF v_empleado IS NULL THEN
            RAISE EXCEPTION 'Falta el responsable del cambio de estado de la producción %.', NEW.id_produccion
                USING HINT = 'Ejecute antes en la misma transacción: SELECT set_config(''eslabon.id_empleado'', ''EMP00001'', true);';
        END IF;
        INSERT INTO tb_seguimiento_produccion (id_produccion, estado_anterior, estado_nuevo, responsable_empleado)
        VALUES (NEW.id_produccion, CASE WHEN TG_OP = 'UPDATE' THEN OLD.estado END, NEW.estado, v_empleado);
    END IF;

    IF TG_OP = 'INSERT' THEN
        UPDATE tb_remision SET estado = 'En producción' WHERE id_remision = NEW.id_remision;
    ELSIF NEW.estado = 'Finalizada' AND OLD.estado <> 'Finalizada' THEN
        UPDATE tb_remision SET estado = 'Terminada' WHERE id_remision = NEW.id_remision;
    END IF;
    RETURN NULL;
END $function$;

-- ---------------------------------------------------------------------
-- 3) TAREAS: proceso obligatorio, máquinas ocupadas y tope por proceso
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

-- El avance diario solo se reporta cuando la producción ya inició
CREATE OR REPLACE FUNCTION fn_registro_diario_validar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_estado_prod VARCHAR;
    v_asignada    INT;
    v_reportado   INT;
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

    SELECT p.estado, d.cantidad_asignada INTO v_estado_prod, v_asignada
      FROM tb_detalle_de_produccion d JOIN tb_produccion p USING (id_produccion)
     WHERE d.id_detalle_de_produccion = NEW.id_detalle_de_produccion;

    IF v_estado_prod = 'Por asignar' THEN
        RAISE EXCEPTION 'La producción aún no ha iniciado: no se aceptan reportes diarios.';
    ELSIF v_estado_prod <> 'En producción' THEN
        RAISE EXCEPTION 'La producción está Finalizada: no se aceptan más reportes diarios.';
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

-- ---------------------------------------------------------------------
-- VISTAS (las columnas nuevas van al final para no romper las existentes)
-- ---------------------------------------------------------------------
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
    pr.nombre AS proceso
   FROM tb_detalle_de_produccion d
     JOIN tb_produccion p ON p.id_produccion::text = d.id_produccion::text
     JOIN empleados e ON e.id_empleados::text = d.id_empleado::text
     JOIN tipo_de_pieza tp ON tp.id_tipo_de_pieza::text = d.id_tipo_pieza::text
     JOIN tipo_de_maquina tm ON tm.id_tipo_de_maquina::text = d.id_tipo_maquina::text
     JOIN tb_detalle_rem dr ON dr.id_detalle_de_remision::text = d.id_detalle_de_remision::text
     LEFT JOIN tb_procesos pr ON pr.id_proceso::text = d.id_proceso::text
     LEFT JOIN tb_registro_diario rd ON rd.id_detalle_de_produccion::text = d.id_detalle_de_produccion::text
  GROUP BY d.id_detalle_de_produccion, p.id_remision, p.estado, e.nombre, tp.nombre, tm.nombre,
           dr.nombre_de_la_pieza, dr.talla, pr.nombre;

CREATE OR REPLACE VIEW vw_avance_produccion AS
 SELECT p.id_produccion,
    p.id_remision,
    c.nombre AS cliente,
    p.estado,
    p.fecha_inicio,
    p.fecha_entrega,
    COALESCE(sum(a.cantidad_asignada), 0::bigint)::integer AS total_asignado,
    COALESCE(sum(a.cantidad_realizada), 0::bigint)::integer AS total_realizado,
        CASE
            WHEN COALESCE(sum(a.cantidad_asignada), 0::bigint) = 0 THEN 0::numeric
            ELSE round(100.0 * sum(a.cantidad_realizada)::numeric / sum(a.cantidad_asignada)::numeric, 1)
        END AS porcentaje_avance,
    p.fecha_estado,
    r.total_prendas,
    r.ficha_tecnica_nombre
   FROM tb_produccion p
     JOIN tb_remision r ON r.id_remision::text = p.id_remision::text
     JOIN tb_clientes c ON c.nit::text = r.nit_cliente::text
     LEFT JOIN vw_asignaciones a ON a.id_produccion::text = p.id_produccion::text
  GROUP BY p.id_produccion, r.id_remision, c.nombre;

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
    a.proceso
   FROM tb_registro_diario rd
     JOIN vw_asignaciones a ON a.id_detalle_de_produccion::text = rd.id_detalle_de_produccion::text;

-- Máquinas con su disponibilidad (si está ocupada: quién la usa y en qué producción)
CREATE OR REPLACE VIEW vw_maquinas_disponibilidad AS
 SELECT m.id_tipo_de_maquina AS id_maquina,
    m.nombre,
    m.descripcion,
    m.estado,
    o.id_detalle_de_produccion AS ocupada_por_tarea,
    o.empleado AS ocupada_por_empleado,
    o.id_produccion AS ocupada_en_produccion,
    (o.id_detalle_de_produccion IS NULL) AS disponible
   FROM tipo_de_maquina m
   LEFT JOIN LATERAL (
        SELECT a.id_detalle_de_produccion, a.empleado, a.id_produccion
          FROM tb_detalle_de_produccion d
          JOIN vw_asignaciones a ON a.id_detalle_de_produccion = d.id_detalle_de_produccion
         WHERE d.id_tipo_maquina = m.id_tipo_de_maquina
           AND a.estado_produccion <> 'Finalizada'
           AND a.cantidad_pendiente > 0
         ORDER BY a.fecha_asignada
         LIMIT 1) o ON TRUE;

-- Permiso para el nuevo parámetro (usa el mismo de parámetros de producción)
COMMIT;

-- Verificación
SELECT estado, COUNT(*) FROM tb_produccion GROUP BY estado;
SELECT COUNT(*) AS procesos FROM tb_procesos;
SELECT * FROM vw_maquinas_disponibilidad ORDER BY id_maquina;
