-- =====================================================================
-- 21 - Tabla maestra de USUARIOS (empleados + clientes en un solo lugar)
--
--   * empleados y tb_clientes se quedan IGUAL y siguen siendo la fuente de
--     los datos. Cada vez que se crea o edita un empleado o un cliente, un
--     trigger lo copia / actualiza en tb_usuarios. El backend NUNCA escribe
--     esos datos en tb_usuarios (si lo intenta, la base lo rechaza).
--   * tb_usuarios tiene además datos PROPIOS de la cuenta, que solo se
--     cambian allí: estado_cuenta, origen, fechas de invitación / activación
--     y aceptación del tratamiento de datos.
--   * Las contraseñas NO se copian: siguen en empleados / tb_clientes.
--   * El correo queda único entre empleados y clientes (sin importar
--     mayúsculas): ya no puede haber un empleado y un cliente con el mismo.
--   * tb_clientes.contrasena pasa a ser opcional: el taller puede registrar
--     a un cliente que llamó por teléfono sin inventarle una contraseña.
--     Ese cliente queda con la cuenta "Sin acceso" hasta que la active.
--
--   Estados de la cuenta:
--     Sin acceso -> cliente creado por el taller, sin contraseña.
--     Invitado   -> se le envió el correo para activar la cuenta (cliente),
--                   o empleado que aún no cambia su contraseña temporal.
--     Activa     -> ya puede entrar al aplicativo.
--
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 20).
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 0. Si hay correos repetidos entre empleados y clientes, no se puede
--    seguir: hay que corregirlos primero (el correo pasa a ser único).
-- ---------------------------------------------------------------------
DO $$
DECLARE repetidos TEXT;
BEGIN
    SELECT string_agg(DISTINCT lower(e.correo), ', ') INTO repetidos
      FROM empleados e JOIN tb_clientes c ON lower(c.correo) = lower(e.correo);
    IF repetidos IS NOT NULL THEN
        RAISE EXCEPTION 'Hay correos que están a la vez en empleados y en clientes: %', repetidos
              USING HINT = 'Cambie el correo de uno de los dos y vuelva a ejecutar el script.';
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1. Clientes sin contraseña (creados por el taller)
-- ---------------------------------------------------------------------
ALTER TABLE tb_clientes ALTER COLUMN contrasena DROP NOT NULL;

-- ---------------------------------------------------------------------
-- 2. Tabla maestra
-- ---------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_usuarios;

CREATE TABLE IF NOT EXISTS tb_usuarios (
    id_usuario          VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('USR', 'seq_usuarios'),
    tipo_usuario        VARCHAR(10)  NOT NULL CHECK (tipo_usuario IN ('Empleado', 'Cliente')),
    -- De dónde viene (solo uno de los dos, según el tipo)
    id_empleado         VARCHAR(10)  UNIQUE REFERENCES empleados(id_empleados) ON UPDATE CASCADE,
    nit_cliente         VARCHAR(30)  UNIQUE REFERENCES tb_clientes(nit) ON UPDATE CASCADE ON DELETE CASCADE,
    -- Copiados desde empleados / tb_clientes (los mantiene el trigger)
    tipo_documento      VARCHAR(10),
    documento           VARCHAR(30)  NOT NULL,
    nombre              VARCHAR(100) NOT NULL,
    correo              VARCHAR(100) NOT NULL,
    telefono            VARCHAR(20),
    direccion           VARCHAR(150),
    id_rol              VARCHAR(10)  NOT NULL REFERENCES roles(id_rol),
    estado              VARCHAR(20)  NOT NULL CHECK (estado IN ('Activo', 'Inactivo')),
    -- Propios de la cuenta (solo se cambian aquí)
    estado_cuenta       VARCHAR(20)  NOT NULL DEFAULT 'Activa'
                        CHECK (estado_cuenta IN ('Sin acceso', 'Invitado', 'Activa')),
    origen              VARCHAR(25)  NOT NULL DEFAULT 'Autoregistro'
                        CHECK (origen IN ('Autoregistro', 'Creado por el taller')),
    creado_por          VARCHAR(10)  REFERENCES empleados(id_empleados),
    fecha_creacion      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    fecha_invitacion    TIMESTAMPTZ,
    fecha_activacion    TIMESTAMPTZ,
    acepto_tratamiento_datos BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_aceptacion_datos   TIMESTAMPTZ,
    CONSTRAINT ck_usuario_origen_unico CHECK (
        (tipo_usuario = 'Empleado' AND id_empleado IS NOT NULL AND nit_cliente IS NULL) OR
        (tipo_usuario = 'Cliente'  AND nit_cliente IS NOT NULL AND id_empleado IS NULL)
    ),
    CONSTRAINT ck_usuario_aceptacion CHECK (NOT acepto_tratamiento_datos OR fecha_aceptacion_datos IS NOT NULL)
);

-- Correo único entre TODOS (empleados y clientes), sin importar mayúsculas
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_correo ON tb_usuarios (lower(correo));
CREATE INDEX IF NOT EXISTS ix_usuarios_tipo_estado ON tb_usuarios (tipo_usuario, estado_cuenta);

-- ---------------------------------------------------------------------
-- 3. Nadie escribe a mano los datos copiados (solo los triggers de sincronización)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_usuarios_proteger_copiados() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('eslabon.sync_usuarios', true) = 'on' OR pg_trigger_depth() > 1 THEN
        RETURN NEW;   -- viene de la sincronización (o de un cambio de NIT en cascada)
    END IF;
    IF TG_OP = 'INSERT' THEN
        RAISE EXCEPTION 'Los usuarios no se crean directamente: cree el empleado o el cliente y se copia solo.';
    END IF;
    IF (NEW.tipo_usuario, NEW.id_empleado, NEW.nit_cliente, NEW.tipo_documento, NEW.documento, NEW.nombre,
        NEW.correo, NEW.telefono, NEW.direccion, NEW.id_rol, NEW.estado)
       IS DISTINCT FROM
       (OLD.tipo_usuario, OLD.id_empleado, OLD.nit_cliente, OLD.tipo_documento, OLD.documento, OLD.nombre,
        OLD.correo, OLD.telefono, OLD.direccion, OLD.id_rol, OLD.estado) THEN
        RAISE EXCEPTION 'Esos datos se editan en empleados o en clientes (tb_usuarios solo los copia).';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_usuarios_proteger_copiados ON tb_usuarios;
CREATE TRIGGER trg_usuarios_proteger_copiados
BEFORE INSERT OR UPDATE ON tb_usuarios
FOR EACH ROW EXECUTE FUNCTION fn_usuarios_proteger_copiados();

-- Los usuarios tampoco se borran a mano (un cliente borrado se lleva su usuario por CASCADE)
CREATE OR REPLACE FUNCTION fn_usuarios_no_eliminar() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN OLD;   -- borrado en cascada al eliminar un cliente
    END IF;
    RAISE EXCEPTION 'Los usuarios no se eliminan directamente: elimine o desactive el cliente / empleado.';
END $$;

DROP TRIGGER IF EXISTS trg_usuarios_no_eliminar ON tb_usuarios;
CREATE TRIGGER trg_usuarios_no_eliminar
BEFORE DELETE ON tb_usuarios
FOR EACH ROW EXECUTE FUNCTION fn_usuarios_no_eliminar();

-- ---------------------------------------------------------------------
-- 4. Sincronización desde EMPLEADOS
--    Cuenta: "Invitado" mientras tenga la contraseña temporal; luego "Activa".
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_usuario_empleado() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE cuenta VARCHAR(20) := CASE WHEN NEW.debe_cambiar_contrasena THEN 'Invitado' ELSE 'Activa' END;
BEGIN
    PERFORM set_config('eslabon.sync_usuarios', 'on', true);
    INSERT INTO tb_usuarios (tipo_usuario, id_empleado, tipo_documento, documento, nombre, correo,
                             telefono, direccion, id_rol, estado, estado_cuenta, origen, creado_por,
                             fecha_invitacion, fecha_activacion)
    VALUES ('Empleado', NEW.id_empleados, NULL, NEW.identificacion, NEW.nombre, NEW.correo,
            NEW.telefono, NEW.direccion, NEW.id_rol, NEW.estado, cuenta, 'Creado por el taller',
            fn_empleado_sesion(),
            CASE WHEN cuenta = 'Invitado' THEN now() END,
            CASE WHEN cuenta = 'Activa' THEN now() END)
    ON CONFLICT (id_empleado) DO UPDATE
       SET documento = EXCLUDED.documento, nombre = EXCLUDED.nombre, correo = EXCLUDED.correo,
           telefono = EXCLUDED.telefono, direccion = EXCLUDED.direccion, id_rol = EXCLUDED.id_rol,
           estado = EXCLUDED.estado,
           estado_cuenta = EXCLUDED.estado_cuenta,
           -- Se le reenvió una contraseña temporal / la acaba de cambiar
           fecha_invitacion = CASE WHEN EXCLUDED.estado_cuenta = 'Invitado' AND tb_usuarios.estado_cuenta <> 'Invitado'
                                   THEN now() ELSE tb_usuarios.fecha_invitacion END,
           fecha_activacion = CASE WHEN EXCLUDED.estado_cuenta = 'Activa' AND tb_usuarios.estado_cuenta <> 'Activa'
                                   THEN now() ELSE tb_usuarios.fecha_activacion END;
    PERFORM set_config('eslabon.sync_usuarios', 'off', true);
    RETURN NEW;
EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'El correo % ya lo tiene otro usuario (empleado o cliente).', NEW.correo
          USING ERRCODE = 'unique_violation';
END $$;

DROP TRIGGER IF EXISTS trg_sync_usuario_empleado ON empleados;
CREATE TRIGGER trg_sync_usuario_empleado
AFTER INSERT OR UPDATE ON empleados
FOR EACH ROW EXECUTE FUNCTION fn_sync_usuario_empleado();

-- ---------------------------------------------------------------------
-- 5. Sincronización desde CLIENTES
--    Sin contraseña -> "Sin acceso" (o "Invitado" si ya se le envió la invitación).
--    Con contraseña -> "Activa".
--    Origen: "Creado por el taller" si lo crea un empleado o si no tiene contraseña.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sync_usuario_cliente() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    cuenta VARCHAR(20) := CASE WHEN NEW.contrasena IS NULL THEN 'Sin acceso' ELSE 'Activa' END;
    origen_nuevo VARCHAR(25) := CASE WHEN fn_empleado_sesion() IS NOT NULL OR NEW.contrasena IS NULL
                                     THEN 'Creado por el taller' ELSE 'Autoregistro' END;
BEGIN
    PERFORM set_config('eslabon.sync_usuarios', 'on', true);
    INSERT INTO tb_usuarios (tipo_usuario, nit_cliente, tipo_documento, documento, nombre, correo,
                             telefono, direccion, id_rol, estado, estado_cuenta, origen, creado_por,
                             fecha_activacion)
    VALUES ('Cliente', NEW.nit, NEW.tipo_documento, NEW.nit, NEW.nombre, NEW.correo,
            NEW.telefono, NEW.direccion, NEW.id_rol, NEW.estado, cuenta, origen_nuevo,
            fn_empleado_sesion(),
            CASE WHEN cuenta = 'Activa' THEN now() END)
    ON CONFLICT (nit_cliente) DO UPDATE
       SET tipo_documento = EXCLUDED.tipo_documento, documento = EXCLUDED.documento,
           nombre = EXCLUDED.nombre, correo = EXCLUDED.correo, telefono = EXCLUDED.telefono,
           direccion = EXCLUDED.direccion, id_rol = EXCLUDED.id_rol, estado = EXCLUDED.estado,
           -- Sin contraseña se respeta "Invitado" (ya se le envió el correo)
           estado_cuenta = CASE WHEN EXCLUDED.estado_cuenta = 'Activa' THEN 'Activa'
                                WHEN tb_usuarios.estado_cuenta = 'Invitado' THEN 'Invitado'
                                ELSE 'Sin acceso' END,
           fecha_activacion = CASE WHEN EXCLUDED.estado_cuenta = 'Activa' AND tb_usuarios.estado_cuenta <> 'Activa'
                                   THEN now() ELSE tb_usuarios.fecha_activacion END;
    PERFORM set_config('eslabon.sync_usuarios', 'off', true);
    RETURN NEW;
EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'El correo % ya lo tiene otro usuario (empleado o cliente).', NEW.correo
          USING ERRCODE = 'unique_violation';
END $$;

DROP TRIGGER IF EXISTS trg_sync_usuario_cliente ON tb_clientes;
CREATE TRIGGER trg_sync_usuario_cliente
AFTER INSERT OR UPDATE ON tb_clientes
FOR EACH ROW EXECUTE FUNCTION fn_sync_usuario_cliente();

-- ---------------------------------------------------------------------
-- 6. Cargar los empleados y clientes que ya existen
--    (no se sabe cómo se crearon los clientes viejos: quedan como "Autoregistro")
-- ---------------------------------------------------------------------
SELECT set_config('eslabon.sync_usuarios', 'on', true);

INSERT INTO tb_usuarios (tipo_usuario, id_empleado, documento, nombre, correo, telefono, direccion,
                         id_rol, estado, estado_cuenta, origen, fecha_activacion)
SELECT 'Empleado', e.id_empleados, e.identificacion, e.nombre, e.correo, e.telefono, e.direccion,
       e.id_rol, e.estado,
       CASE WHEN e.debe_cambiar_contrasena THEN 'Invitado' ELSE 'Activa' END,
       'Creado por el taller',
       CASE WHEN NOT e.debe_cambiar_contrasena THEN now() END
  FROM empleados e
ON CONFLICT (id_empleado) DO NOTHING;

INSERT INTO tb_usuarios (tipo_usuario, nit_cliente, tipo_documento, documento, nombre, correo, telefono,
                         direccion, id_rol, estado, estado_cuenta, origen, fecha_activacion)
SELECT 'Cliente', c.nit, c.tipo_documento, c.nit, c.nombre, c.correo, c.telefono, c.direccion,
       c.id_rol, c.estado,
       CASE WHEN c.contrasena IS NULL THEN 'Sin acceso' ELSE 'Activa' END,
       CASE WHEN c.contrasena IS NULL THEN 'Creado por el taller' ELSE 'Autoregistro' END,
       CASE WHEN c.contrasena IS NOT NULL THEN now() END
  FROM tb_clientes c
ON CONFLICT (nit_cliente) DO NOTHING;

SELECT set_config('eslabon.sync_usuarios', 'off', true);

-- ---------------------------------------------------------------------
-- 7. Vista para el módulo "Usuarios" (todos juntos, con el nombre del rol)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_usuarios AS
SELECT u.id_usuario,
       u.tipo_usuario,
       COALESCE(u.id_empleado, u.nit_cliente) AS id_origen,
       u.tipo_documento,
       u.documento,
       u.nombre,
       u.correo,
       u.telefono,
       u.direccion,
       u.id_rol,
       r.descripcion_rol AS rol,
       u.estado,
       u.estado_cuenta,
       u.origen,
       u.creado_por,
       cp.nombre AS creado_por_nombre,
       u.fecha_creacion,
       u.fecha_invitacion,
       u.fecha_activacion,
       u.acepto_tratamiento_datos,
       u.fecha_aceptacion_datos
  FROM tb_usuarios u
  JOIN roles r ON r.id_rol = u.id_rol
  LEFT JOIN empleados cp ON cp.id_empleados = u.creado_por;

COMMIT;

-- ---------------------------------------------------------------------
-- Verificación: deben coincidir los totales
-- ---------------------------------------------------------------------
SELECT (SELECT count(*) FROM empleados)   AS empleados,
       (SELECT count(*) FROM tb_clientes) AS clientes,
       (SELECT count(*) FROM tb_usuarios WHERE tipo_usuario = 'Empleado') AS usuarios_empleado,
       (SELECT count(*) FROM tb_usuarios WHERE tipo_usuario = 'Cliente')  AS usuarios_cliente;

SELECT tipo_usuario, estado_cuenta, count(*) FROM tb_usuarios GROUP BY 1, 2 ORDER BY 1, 2;
