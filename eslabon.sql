-- =====================================================================
--  ESLABÓN · Taller y Confecciones CDS
--  Script de base de datos - PostgreSQL 16 (compatible con Neon)
--  SENA · ADSO · Ficha 3228140
-- ---------------------------------------------------------------------
--  Orden de creación por niveles:
--    Nivel 1: catálogos sin dependencias
--    Nivel 2: tablas que dependen de nivel 1
--    Nivel 3: tablas transaccionales (remisión, compras, producción)
--
--  Convenciones:
--    * Nombres en minúscula y snake_case (PostgreSQL convierte a
--      minúscula lo que no va entre comillas).
--    * IDs VARCHAR(10) como en el modelo. Si el backend no envía el ID,
--      se genera solo con prefijo: REM00001, EMP00001, etc.
--    * Las contraseñas se guardan YA HASHEADAS (bcrypt desde FastAPI).
--
--  RESPONSABLE DEL CAMBIO DE ESTADO (tb_seguimiento_remision):
--    El backend debe indicar qué empleado (admin) hace la operación,
--    dentro de la misma transacción, ANTES de cambiar el estado:
--
--      SELECT set_config('eslabon.id_empleado', 'EMP00001', true);
--
--    Cuando el cliente crea la remisión no hace falta: el responsable
--    queda como el cliente (nit_cliente) automáticamente.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Funciones utilitarias
-- ---------------------------------------------------------------------

-- Genera IDs con prefijo: fn_generar_id('REM', 'seq_remision') -> REM00001
CREATE OR REPLACE FUNCTION fn_generar_id(p_prefijo TEXT, p_secuencia REGCLASS)
RETURNS VARCHAR LANGUAGE plpgsql AS $$
DECLARE
    v_n BIGINT := nextval(p_secuencia);
BEGIN
    RETURN p_prefijo || lpad(v_n::TEXT, greatest(5, length(v_n::TEXT)), '0');
END $$;

-- Devuelve el empleado de la sesión (lo fija el backend con set_config)
CREATE OR REPLACE FUNCTION fn_empleado_sesion()
RETURNS VARCHAR LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('eslabon.id_empleado', true), '')::VARCHAR;
$$;

CREATE SEQUENCE seq_tipo_insumos;
CREATE SEQUENCE seq_roles;
CREATE SEQUENCE seq_permisos;
CREATE SEQUENCE seq_tipo_pieza;
CREATE SEQUENCE seq_tipo_maquina;
CREATE SEQUENCE seq_proveedores;
CREATE SEQUENCE seq_insumos;
CREATE SEQUENCE seq_empleados;
CREATE SEQUENCE seq_compras;
CREATE SEQUENCE seq_remision;
CREATE SEQUENCE seq_detalle_rem;
CREATE SEQUENCE seq_insumo_enviado;
CREATE SEQUENCE seq_seguimiento;
CREATE SEQUENCE seq_produccion;
CREATE SEQUENCE seq_detalle_produccion;
CREATE SEQUENCE seq_registro_diario;
CREATE SEQUENCE seq_entrega;


-- =====================================================================
--  NIVEL 1 · Catálogos
-- =====================================================================

CREATE TABLE tb_tipo_insumos (
    id_tipo_insumos VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('TIN', 'seq_tipo_insumos'),
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    descripcion     VARCHAR(255),
    estado          VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo'))
);

-- Nota: se quitó "lista_permisos TEXT" porque ya existe rol_x_permiso
CREATE TABLE roles (
    id_rol          VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('ROL', 'seq_roles'),
    descripcion_rol VARCHAR(100) NOT NULL UNIQUE,
    estado          VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    es_protegido    BOOLEAN      NOT NULL DEFAULT FALSE  -- Administrador principal (CA_05_02)
);

CREATE TABLE permisos (
    id_permiso  VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('PER', 'seq_permisos'),
    descripcion VARCHAR(150) NOT NULL UNIQUE,
    modulo      VARCHAR(50)  NOT NULL
);

CREATE TABLE tipo_de_pieza (
    id_tipo_de_pieza VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('TPZ', 'seq_tipo_pieza'),
    nombre           VARCHAR(100) NOT NULL UNIQUE,
    descripcion      VARCHAR(255),
    estado           VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo'))
);

CREATE TABLE tipo_de_maquina (
    id_tipo_de_maquina VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('TMQ', 'seq_tipo_maquina'),
    nombre             VARCHAR(100) NOT NULL UNIQUE,
    descripcion        VARCHAR(255),
    estado             VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo'))
);

CREATE TABLE proveedores (
    id_proveedores VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('PRV', 'seq_proveedores'),
    nit            VARCHAR(30)  NOT NULL UNIQUE,              -- CA_36_01
    nombre         VARCHAR(100) NOT NULL,
    contacto       VARCHAR(100),
    telefono       VARCHAR(20),
    correo         VARCHAR(100),
    direccion      VARCHAR(150),
    estado         VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo'))
);


-- =====================================================================
--  NIVEL 2
-- =====================================================================

CREATE TABLE rol_x_permiso (
    id_rol     VARCHAR(10) NOT NULL REFERENCES roles (id_rol)        ON DELETE CASCADE,
    id_permiso VARCHAR(10) NOT NULL REFERENCES permisos (id_permiso) ON DELETE CASCADE,
    PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE tb_insumos (
    id_insumos         VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('INS', 'seq_insumos'),
    nombre             VARCHAR(100) NOT NULL UNIQUE,
    descripcion_insumo VARCHAR(255),
    unidad_medida      VARCHAR(20)  NOT NULL DEFAULT 'Unidad',
    stock              INT          NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo       INT          NOT NULL CHECK (stock_minimo >= 0),     -- CA_44_01
    stock_maximo       INT          NOT NULL,
    id_tipo_insumo     VARCHAR(10)  NOT NULL REFERENCES tb_tipo_insumos (id_tipo_insumos),
    estado             VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    CONSTRAINT ck_insumos_max_min CHECK (stock_maximo >= stock_minimo)
);

CREATE TABLE empleados (
    id_empleados   VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('EMP', 'seq_empleados'),
    identificacion VARCHAR(30)  NOT NULL UNIQUE,                -- CA_09_01
    nombre         VARCHAR(100) NOT NULL,
    direccion      VARCHAR(150),
    contrasena     VARCHAR(255) NOT NULL,                        -- hash bcrypt
    correo         VARCHAR(100) NOT NULL UNIQUE,                 -- CA_09_01
    telefono       VARCHAR(20),
    estado         VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    id_rol         VARCHAR(10)  NOT NULL REFERENCES roles (id_rol)  -- CA_09_02
);

CREATE TABLE tb_clientes (
    nit          VARCHAR(30)  PRIMARY KEY,                       -- NIT o cédula
    nombre       VARCHAR(100) NOT NULL,
    direccion    VARCHAR(150),
    correo       VARCHAR(100) NOT NULL UNIQUE,
    telefono     VARCHAR(20),
    estado       VARCHAR(20)  NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    contrasena   VARCHAR(255) NOT NULL,                          -- hash bcrypt
    id_rol       VARCHAR(10)  NOT NULL REFERENCES roles (id_rol)
);


-- =====================================================================
--  NIVEL 3 · Compras
-- =====================================================================

CREATE TABLE tb_compras (
    id_compras   VARCHAR(10)   PRIMARY KEY DEFAULT fn_generar_id('CMP', 'seq_compras'),
    fecha_compra DATE          NOT NULL DEFAULT CURRENT_DATE,
    total_compra DECIMAL(12,2) NOT NULL DEFAULT 0,               -- se calcula con el detalle
    descripcion  VARCHAR(255),
    id_proveedor VARCHAR(10)   NOT NULL REFERENCES proveedores (id_proveedores) -- CA_41_01
);

CREATE TABLE tb_detalle_compras (
    id_compras     VARCHAR(10)   NOT NULL REFERENCES tb_compras (id_compras) ON DELETE CASCADE,
    id_insumos     VARCHAR(10)   NOT NULL REFERENCES tb_insumos (id_insumos),
    cantidad       INT           NOT NULL CHECK (cantidad > 0),
    valor_unitario DECIMAL(10,2) NOT NULL CHECK (valor_unitario >= 0),
    subtotal       DECIMAL(12,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
    PRIMARY KEY (id_compras, id_insumos)
);


-- =====================================================================
--  NIVEL 3 · Remisión (ventas)
-- =====================================================================

CREATE TABLE tb_remision (
    id_remision          VARCHAR(10)   PRIMARY KEY DEFAULT fn_generar_id('REM', 'seq_remision'),
    nit_cliente          VARCHAR(30)   NOT NULL REFERENCES tb_clientes (nit),
    ficha_tecnica_nombre VARCHAR(255)  NOT NULL,
    ficha_tecnica_url    VARCHAR(255),                           -- foto de la ficha (CA_24_01)
    fecha_recibo         DATE          NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega        DATE,
    costo_prenda         DECIMAL(10,2) NOT NULL CHECK (costo_prenda >= 0),
    total_prendas        INT           NOT NULL DEFAULT 0,       -- se calcula con tb_detalle_rem
    costo_total          DECIMAL(12,2) GENERATED ALWAYS AS (costo_prenda * total_prendas) STORED, -- CA_24_02
    estado               VARCHAR(20)   NOT NULL DEFAULT 'Pendiente'
                         CHECK (estado IN ('Pendiente', 'Aprobada', 'Rechazada',
                                           'En producción', 'Terminada', 'Entregada')),
    insumos_enviados     BOOLEAN       NOT NULL DEFAULT FALSE,
    observaciones        TEXT,                                   -- ej. motivo de rechazo
    CONSTRAINT ck_remision_fechas CHECK (fecha_entrega IS NULL OR fecha_entrega >= fecha_recibo)
);

CREATE TABLE tb_detalle_rem (
    id_detalle_de_remision VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('DRM', 'seq_detalle_rem'),
    id_remision            VARCHAR(10)  NOT NULL REFERENCES tb_remision (id_remision) ON DELETE CASCADE,
    nombre_de_la_pieza     VARCHAR(100) NOT NULL,
    talla                  VARCHAR(20)  NOT NULL,
    cantidad               INT          NOT NULL CHECK (cantidad > 0),
    CONSTRAINT uq_detalle_rem UNIQUE (id_remision, nombre_de_la_pieza, talla)
);

CREATE TABLE tb_insumos_enviados_x_cliente (
    id_insumo_enviado   VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('IEC', 'seq_insumo_enviado'),
    id_remision         VARCHAR(10)  NOT NULL REFERENCES tb_remision (id_remision) ON DELETE CASCADE,
    nombre              VARCHAR(100) NOT NULL,
    cantidad            INT          NOT NULL CHECK (cantidad > 0),
    cantidad_disponible INT          CHECK (cantidad_disponible >= 0), -- baja al asignar a producción
    unidad              VARCHAR(20)  NOT NULL DEFAULT 'Unidad'
);

-- Tabla pedida por la instructora: historial de estados de la remisión
CREATE TABLE tb_seguimiento_remision (
    id_seguimiento       VARCHAR(10) PRIMARY KEY DEFAULT fn_generar_id('SEG', 'seq_seguimiento'),
    id_remision          VARCHAR(10) NOT NULL REFERENCES tb_remision (id_remision) ON DELETE CASCADE,
    estado_anterior      VARCHAR(20),                          -- NULL cuando la remisión se crea
    estado_nuevo         VARCHAR(20) NOT NULL,
    responsable_empleado VARCHAR(10) REFERENCES empleados (id_empleados),
    responsable_cliente  VARCHAR(30) REFERENCES tb_clientes (nit),
    fecha_hora           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT ck_seguimiento_un_responsable
        CHECK (num_nonnulls(responsable_empleado, responsable_cliente) = 1)
);


-- =====================================================================
--  NIVEL 3 · Producción
-- =====================================================================

CREATE TABLE tb_produccion (
    id_produccion VARCHAR(10) PRIMARY KEY DEFAULT fn_generar_id('PRD', 'seq_produccion'),
    id_remision   VARCHAR(10) NOT NULL UNIQUE REFERENCES tb_remision (id_remision),
    fecha_inicio  DATE        NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    estado        VARCHAR(20) NOT NULL DEFAULT 'En proceso'
                  CHECK (estado IN ('En proceso', 'Finalizada')),
    CONSTRAINT ck_produccion_fechas CHECK (fecha_entrega IS NULL OR fecha_entrega >= fecha_inicio)
);

-- Regla del taller: solo UNA producción en proceso a la vez
CREATE UNIQUE INDEX ux_una_produccion_en_proceso
    ON tb_produccion ((TRUE)) WHERE estado = 'En proceso';

CREATE TABLE tb_detalle_de_produccion (
    id_detalle_de_produccion     VARCHAR(10) PRIMARY KEY DEFAULT fn_generar_id('DPR', 'seq_detalle_produccion'),
    id_produccion                VARCHAR(10) NOT NULL REFERENCES tb_produccion (id_produccion) ON DELETE CASCADE,
    id_empleado                  VARCHAR(10) NOT NULL REFERENCES empleados (id_empleados),
    id_tipo_pieza                VARCHAR(10) NOT NULL REFERENCES tipo_de_pieza (id_tipo_de_pieza),
    id_tipo_maquina              VARCHAR(10) NOT NULL REFERENCES tipo_de_maquina (id_tipo_de_maquina),
    id_detalle_de_remision       VARCHAR(10) NOT NULL REFERENCES tb_detalle_rem (id_detalle_de_remision),
    id_insumos                   VARCHAR(10) REFERENCES tb_insumos (id_insumos),                         -- insumo del taller
    id_insumos_enviados_x_cliente VARCHAR(10) REFERENCES tb_insumos_enviados_x_cliente (id_insumo_enviado), -- insumo del cliente
    cantidad_insumo              INT CHECK (cantidad_insumo > 0),   -- cuánto insumo se descuenta (CA_51_02)
    cantidad_asignada            INT  NOT NULL CHECK (cantidad_asignada > 0),
    fecha_asignada               DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Insumo del taller O del cliente, nunca los dos
    CONSTRAINT ck_dp_un_insumo CHECK (num_nonnulls(id_insumos, id_insumos_enviados_x_cliente) <= 1),
    -- Si hay insumo debe haber cantidad, y viceversa
    CONSTRAINT ck_dp_cantidad_insumo CHECK (
        (num_nonnulls(id_insumos, id_insumos_enviados_x_cliente) = 1) = (cantidad_insumo IS NOT NULL))
);

CREATE TABLE tb_registro_diario (
    id_registro_diario       VARCHAR(10) PRIMARY KEY DEFAULT fn_generar_id('RGD', 'seq_registro_diario'),
    id_detalle_de_produccion VARCHAR(10) NOT NULL REFERENCES tb_detalle_de_produccion (id_detalle_de_produccion),
    cantidad                 INT         NOT NULL CHECK (cantidad > 0),
    fecha                    TIMESTAMPTZ NOT NULL DEFAULT now()  -- CA_56_02: fecha/hora automática
);


-- =====================================================================
--  NIVEL 3 · Entrega (cierre de venta)
-- =====================================================================

CREATE TABLE tb_remision_entrega (
    id_entrega           VARCHAR(10)   PRIMARY KEY DEFAULT fn_generar_id('ENT', 'seq_entrega'),
    id_remision          VARCHAR(10)   NOT NULL REFERENCES tb_remision (id_remision),
    cantidad_entregada   INT           NOT NULL CHECK (cantidad_entregada > 0),
    precio_total         DECIMAL(12,2) CHECK (precio_total >= 0),  -- si no llega: cantidad x costo_prenda
    fecha_finalizacion   DATE          NOT NULL DEFAULT CURRENT_DATE,
    remision_firmada_url VARCHAR(255),
    comprobante_pago_url VARCHAR(255),
    estado               VARCHAR(20)   NOT NULL DEFAULT 'Pendiente de pago'
                         CHECK (estado IN ('Pendiente de pago', 'Pagada')),
    -- No se puede marcar como pagada sin comprobante (CA_29_01)
    CONSTRAINT ck_entrega_pagada CHECK (estado <> 'Pagada' OR comprobante_pago_url IS NOT NULL)
);


-- =====================================================================
--  ÍNDICES sobre llaves foráneas (búsquedas y JOINs)
-- =====================================================================
CREATE INDEX ix_insumos_tipo           ON tb_insumos (id_tipo_insumo);
CREATE INDEX ix_empleados_rol          ON empleados (id_rol);
CREATE INDEX ix_clientes_rol           ON tb_clientes (id_rol);
CREATE INDEX ix_compras_proveedor      ON tb_compras (id_proveedor);
CREATE INDEX ix_compras_fecha          ON tb_compras (fecha_compra);
CREATE INDEX ix_detalle_compras_insumo ON tb_detalle_compras (id_insumos);
CREATE INDEX ix_remision_cliente       ON tb_remision (nit_cliente);
CREATE INDEX ix_remision_estado        ON tb_remision (estado);
CREATE INDEX ix_detalle_rem_remision   ON tb_detalle_rem (id_remision);
CREATE INDEX ix_iec_remision           ON tb_insumos_enviados_x_cliente (id_remision);
CREATE INDEX ix_seguimiento_remision   ON tb_seguimiento_remision (id_remision, fecha_hora);
CREATE INDEX ix_dp_produccion          ON tb_detalle_de_produccion (id_produccion);
CREATE INDEX ix_dp_empleado            ON tb_detalle_de_produccion (id_empleado);
CREATE INDEX ix_dp_detalle_rem         ON tb_detalle_de_produccion (id_detalle_de_remision);
CREATE INDEX ix_registro_detalle       ON tb_registro_diario (id_detalle_de_produccion);
CREATE INDEX ix_registro_fecha         ON tb_registro_diario (fecha);
CREATE INDEX ix_entrega_remision       ON tb_remision_entrega (id_remision);


-- =====================================================================
--  TRIGGERS · Reglas de negocio
-- =====================================================================

-- ---------- Roles: proteger al Administrador principal (CA_05_02) ----
CREATE OR REPLACE FUNCTION fn_proteger_rol() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.es_protegido THEN
            RAISE EXCEPTION 'El rol "%" está protegido y no se puede eliminar.', OLD.descripcion_rol;
        END IF;
        RETURN OLD;
    END IF;
    IF OLD.es_protegido AND (NEW.estado <> 'Activo' OR NOT NEW.es_protegido) THEN
        RAISE EXCEPTION 'El rol "%" está protegido: no se puede desactivar.', OLD.descripcion_rol;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_proteger_rol
    BEFORE UPDATE OR DELETE ON roles
    FOR EACH ROW EXECUTE FUNCTION fn_proteger_rol();

-- ---------- Usuarios: solo se asignan roles activos (CA_10_01) -------
CREATE OR REPLACE FUNCTION fn_validar_rol_activo() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE id_rol = NEW.id_rol AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El rol % no existe o está inactivo.', NEW.id_rol;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_empleado_rol_activo
    BEFORE INSERT OR UPDATE OF id_rol ON empleados
    FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_activo();

CREATE TRIGGER trg_cliente_rol_activo
    BEFORE INSERT OR UPDATE OF id_rol ON tb_clientes
    FOR EACH ROW EXECUTE FUNCTION fn_validar_rol_activo();

-- ---------- Compras: no comprar a proveedores inactivos (CA_40_01) ---
CREATE OR REPLACE FUNCTION fn_validar_proveedor_activo() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM proveedores
                   WHERE id_proveedores = NEW.id_proveedor AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El proveedor % no existe o está inactivo.', NEW.id_proveedor;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_compra_proveedor_activo
    BEFORE INSERT OR UPDATE OF id_proveedor ON tb_compras
    FOR EACH ROW EXECUTE FUNCTION fn_validar_proveedor_activo();

-- ---------- Detalle de compra: sumar stock y total (CA_41_02) --------
CREATE OR REPLACE FUNCTION fn_detalle_compra_stock() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    -- Revertir lo anterior
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        UPDATE tb_insumos SET stock = stock - OLD.cantidad
         WHERE id_insumos = OLD.id_insumos AND stock >= OLD.cantidad;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No se puede modificar la compra: el insumo % ya no tiene ese stock (fue usado).', OLD.id_insumos;
        END IF;
    END IF;
    -- Aplicar lo nuevo
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        UPDATE tb_insumos SET stock = stock + NEW.cantidad WHERE id_insumos = NEW.id_insumos;
    END IF;
    -- Recalcular total de la(s) compra(s)
    UPDATE tb_compras c
       SET total_compra = COALESCE((SELECT sum(subtotal) FROM tb_detalle_compras d
                                     WHERE d.id_compras = c.id_compras), 0)
     WHERE c.id_compras IN (COALESCE(NEW.id_compras, OLD.id_compras), COALESCE(OLD.id_compras, NEW.id_compras));
    RETURN NULL;
END $$;

CREATE TRIGGER trg_detalle_compra_stock
    AFTER INSERT OR UPDATE OR DELETE ON tb_detalle_compras
    FOR EACH ROW EXECUTE FUNCTION fn_detalle_compra_stock();

-- ---------- Remisión: flujo de estados permitido --------------------
--   Pendiente     -> Aprobada | Rechazada
--   Aprobada      -> En producción | Rechazada
--   En producción -> Terminada
--   Terminada     -> Entregada
CREATE OR REPLACE FUNCTION fn_validar_estado_remision() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.estado <> 'Pendiente' THEN
            RAISE EXCEPTION 'Una remisión nueva debe iniciar en estado Pendiente.';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM tb_clientes WHERE nit = NEW.nit_cliente AND estado = 'Activo') THEN
            RAISE EXCEPTION 'El cliente % no existe o está inactivo.', NEW.nit_cliente;
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF NOT (
            (OLD.estado = 'Pendiente'     AND NEW.estado IN ('Aprobada', 'Rechazada')) OR
            (OLD.estado = 'Aprobada'      AND NEW.estado IN ('En producción', 'Rechazada')) OR
            (OLD.estado = 'En producción' AND NEW.estado = 'Terminada') OR
            (OLD.estado = 'Terminada'     AND NEW.estado = 'Entregada')
        ) THEN
            RAISE EXCEPTION 'Cambio de estado no permitido: % -> %', OLD.estado, NEW.estado;
        END IF;
        IF NEW.estado = 'Aprobada' AND NEW.total_prendas = 0 THEN
            RAISE EXCEPTION 'No se puede aprobar una remisión sin detalle de prendas.';
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_validar_estado_remision
    BEFORE INSERT OR UPDATE ON tb_remision
    FOR EACH ROW EXECUTE FUNCTION fn_validar_estado_remision();

-- ---------- Seguimiento automático de estados -----------------------
CREATE OR REPLACE FUNCTION fn_seguimiento_remision() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_empleado VARCHAR := fn_empleado_sesion();
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- La crea el cliente desde la página (o un empleado, si se indicó en la sesión)
        INSERT INTO tb_seguimiento_remision
               (id_remision, estado_anterior, estado_nuevo, responsable_empleado, responsable_cliente)
        VALUES (NEW.id_remision, NULL, NEW.estado,
                v_empleado, CASE WHEN v_empleado IS NULL THEN NEW.nit_cliente END);

    ELSIF NEW.estado IS DISTINCT FROM OLD.estado THEN
        IF v_empleado IS NULL THEN
            RAISE EXCEPTION 'Falta el responsable del cambio de estado de la remisión %.', NEW.id_remision
                USING HINT = 'Ejecute antes en la misma transacción: SELECT set_config(''eslabon.id_empleado'', ''EMP00001'', true);';
        END IF;
        INSERT INTO tb_seguimiento_remision
               (id_remision, estado_anterior, estado_nuevo, responsable_empleado)
        VALUES (NEW.id_remision, OLD.estado, NEW.estado, v_empleado);
    END IF;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_seguimiento_remision
    AFTER INSERT OR UPDATE OF estado ON tb_remision
    FOR EACH ROW EXECUTE FUNCTION fn_seguimiento_remision();

-- El historial no se edita ni se borra (solo se borra en cascada con la remisión)
CREATE OR REPLACE FUNCTION fn_seguimiento_inmutable() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'El historial de seguimiento no se puede modificar.';
END $$;

CREATE TRIGGER trg_seguimiento_inmutable
    BEFORE UPDATE ON tb_seguimiento_remision
    FOR EACH ROW EXECUTE FUNCTION fn_seguimiento_inmutable();

-- ---------- Detalle de remisión: solo editable en Pendiente y recalcula total
CREATE OR REPLACE FUNCTION fn_detalle_rem_validar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_estado VARCHAR;
BEGIN
    SELECT estado INTO v_estado FROM tb_remision
     WHERE id_remision = COALESCE(NEW.id_remision, OLD.id_remision);
    -- v_estado es NULL cuando se borra la remisión completa (cascada)
    IF v_estado IS NOT NULL AND v_estado <> 'Pendiente' THEN
        RAISE EXCEPTION 'El detalle solo se puede modificar mientras la remisión está Pendiente (actual: %).', v_estado;
    END IF;
    RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_detalle_rem_validar
    BEFORE INSERT OR UPDATE OR DELETE ON tb_detalle_rem
    FOR EACH ROW EXECUTE FUNCTION fn_detalle_rem_validar();

CREATE OR REPLACE FUNCTION fn_detalle_rem_total() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE tb_remision r
       SET total_prendas = COALESCE((SELECT sum(cantidad) FROM tb_detalle_rem d
                                      WHERE d.id_remision = r.id_remision), 0)
     WHERE r.id_remision IN (COALESCE(NEW.id_remision, OLD.id_remision), COALESCE(OLD.id_remision, NEW.id_remision));
    RETURN NULL;
END $$;

CREATE TRIGGER trg_detalle_rem_total
    AFTER INSERT OR UPDATE OR DELETE ON tb_detalle_rem
    FOR EACH ROW EXECUTE FUNCTION fn_detalle_rem_total();

-- ---------- Insumos enviados por el cliente --------------------------
CREATE OR REPLACE FUNCTION fn_iec_antes() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.cantidad_disponible := COALESCE(NEW.cantidad_disponible, NEW.cantidad);
    END IF;
    IF NEW.cantidad_disponible > NEW.cantidad THEN
        RAISE EXCEPTION 'La cantidad disponible no puede superar la cantidad enviada.';
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_iec_antes
    BEFORE INSERT OR UPDATE ON tb_insumos_enviados_x_cliente
    FOR EACH ROW EXECUTE FUNCTION fn_iec_antes();

CREATE OR REPLACE FUNCTION fn_iec_marcar_remision() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE tb_remision SET insumos_enviados = TRUE
     WHERE id_remision = NEW.id_remision AND NOT insumos_enviados;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_iec_marcar_remision
    AFTER INSERT ON tb_insumos_enviados_x_cliente
    FOR EACH ROW EXECUTE FUNCTION fn_iec_marcar_remision();

-- ---------- Producción ----------------------------------------------
-- Solo se crea para remisiones Aprobadas (CA_28_01) y la remisión pasa a "En producción".
-- Al finalizar la producción, la remisión pasa a "Terminada".
CREATE OR REPLACE FUNCTION fn_produccion_antes() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.estado <> 'En proceso' THEN
            RAISE EXCEPTION 'Una producción nueva debe iniciar En proceso.';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM tb_remision
                       WHERE id_remision = NEW.id_remision AND estado = 'Aprobada') THEN
            RAISE EXCEPTION 'Solo se puede crear producción para remisiones en estado Aprobada.';
        END IF;
        IF EXISTS (SELECT 1 FROM tb_produccion WHERE estado = 'En proceso') THEN
            RAISE EXCEPTION 'Ya hay una producción En proceso. Finalícela antes de iniciar otra.';
        END IF;
    ELSE
        IF NEW.id_remision <> OLD.id_remision THEN
            RAISE EXCEPTION 'No se puede cambiar la remisión de una producción.';
        END IF;
        IF OLD.estado = 'Finalizada' AND NEW.estado <> 'Finalizada' THEN
            RAISE EXCEPTION 'Una producción Finalizada no se puede reabrir.';
        END IF;
        IF NEW.estado = 'Finalizada' AND OLD.estado <> 'Finalizada' THEN
            NEW.fecha_entrega := COALESCE(NEW.fecha_entrega, CURRENT_DATE);
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_produccion_antes
    BEFORE INSERT OR UPDATE ON tb_produccion
    FOR EACH ROW EXECUTE FUNCTION fn_produccion_antes();

CREATE OR REPLACE FUNCTION fn_produccion_despues() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tb_remision SET estado = 'En producción' WHERE id_remision = NEW.id_remision;
    ELSIF NEW.estado = 'Finalizada' AND OLD.estado <> 'Finalizada' THEN
        UPDATE tb_remision SET estado = 'Terminada' WHERE id_remision = NEW.id_remision;
    END IF;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_produccion_despues
    AFTER INSERT OR UPDATE OF estado ON tb_produccion
    FOR EACH ROW EXECUTE FUNCTION fn_produccion_despues();

-- ---------- Detalle de producción (asignaciones) ---------------------
CREATE OR REPLACE FUNCTION fn_detalle_produccion_validar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_remision     VARCHAR;
    v_estado_prod  VARCHAR;
    v_cant_pieza   INT;
    v_ya_asignado  INT;
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

    IF v_estado_prod <> 'En proceso' THEN
        RAISE EXCEPTION 'Solo se puede asignar trabajo a una producción En proceso.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM empleados WHERE id_empleados = NEW.id_empleado AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El empleado % no existe o está inactivo.', NEW.id_empleado;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_pieza WHERE id_tipo_de_pieza = NEW.id_tipo_pieza AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El tipo de pieza % no existe o está inactivo.', NEW.id_tipo_pieza;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM tipo_de_maquina WHERE id_tipo_de_maquina = NEW.id_tipo_maquina AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El tipo de máquina % no existe o está inactivo.', NEW.id_tipo_maquina;
    END IF;

    -- La línea de la remisión debe ser de la misma remisión de la producción
    SELECT cantidad INTO v_cant_pieza FROM tb_detalle_rem
     WHERE id_detalle_de_remision = NEW.id_detalle_de_remision AND id_remision = v_remision;
    IF v_cant_pieza IS NULL THEN
        RAISE EXCEPTION 'El detalle de remisión % no pertenece a la remisión %.', NEW.id_detalle_de_remision, v_remision;
    END IF;

    -- No asignar más unidades que las pedidas para la misma operación
    -- (misma línea de remisión + misma pieza + misma máquina). Así se puede
    -- repartir una operación entre varios empleados sin pasarse.
    SELECT COALESCE(sum(cantidad_asignada), 0) INTO v_ya_asignado
      FROM tb_detalle_de_produccion
     WHERE id_detalle_de_remision = NEW.id_detalle_de_remision
       AND id_tipo_pieza = NEW.id_tipo_pieza
       AND id_tipo_maquina = NEW.id_tipo_maquina
       AND id_detalle_de_produccion <> NEW.id_detalle_de_produccion;
    IF v_ya_asignado + NEW.cantidad_asignada > v_cant_pieza THEN
        RAISE EXCEPTION 'Se exceden las unidades pedidas para esa pieza y máquina: pedidas %, ya asignadas %, intenta asignar %.',
            v_cant_pieza, v_ya_asignado, NEW.cantidad_asignada;
    END IF;

    -- Insumo del cliente: debe ser de esta misma remisión
    IF NEW.id_insumos_enviados_x_cliente IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tb_insumos_enviados_x_cliente
         WHERE id_insumo_enviado = NEW.id_insumos_enviados_x_cliente AND id_remision = v_remision) THEN
        RAISE EXCEPTION 'El insumo enviado % no pertenece a la remisión %.', NEW.id_insumos_enviados_x_cliente, v_remision;
    END IF;

    -- Insumo del taller: debe estar activo (CA_46_01)
    IF NEW.id_insumos IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM tb_insumos WHERE id_insumos = NEW.id_insumos AND estado = 'Activo') THEN
        RAISE EXCEPTION 'El insumo % no existe o está inactivo.', NEW.id_insumos;
    END IF;

    RETURN NEW;
END $$;

CREATE TRIGGER trg_detalle_produccion_validar
    BEFORE INSERT OR UPDATE OR DELETE ON tb_detalle_de_produccion
    FOR EACH ROW EXECUTE FUNCTION fn_detalle_produccion_validar();

-- Descuento de inventario al asignar (CA_51_02). Si se edita o borra, se devuelve.
CREATE OR REPLACE FUNCTION fn_detalle_produccion_stock() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        IF OLD.id_insumos IS NOT NULL THEN
            UPDATE tb_insumos SET stock = stock + OLD.cantidad_insumo WHERE id_insumos = OLD.id_insumos;
        ELSIF OLD.id_insumos_enviados_x_cliente IS NOT NULL THEN
            UPDATE tb_insumos_enviados_x_cliente
               SET cantidad_disponible = cantidad_disponible + OLD.cantidad_insumo
             WHERE id_insumo_enviado = OLD.id_insumos_enviados_x_cliente;
        END IF;
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        IF NEW.id_insumos IS NOT NULL THEN
            UPDATE tb_insumos SET stock = stock - NEW.cantidad_insumo
             WHERE id_insumos = NEW.id_insumos AND stock >= NEW.cantidad_insumo;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Stock insuficiente del insumo % para asignar % unidades.', NEW.id_insumos, NEW.cantidad_insumo;
            END IF;
        ELSIF NEW.id_insumos_enviados_x_cliente IS NOT NULL THEN
            UPDATE tb_insumos_enviados_x_cliente
               SET cantidad_disponible = cantidad_disponible - NEW.cantidad_insumo
             WHERE id_insumo_enviado = NEW.id_insumos_enviados_x_cliente
               AND cantidad_disponible >= NEW.cantidad_insumo;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Cantidad insuficiente del insumo enviado % para asignar % unidades.',
                    NEW.id_insumos_enviados_x_cliente, NEW.cantidad_insumo;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_detalle_produccion_stock
    AFTER INSERT OR UPDATE OR DELETE ON tb_detalle_de_produccion
    FOR EACH ROW EXECUTE FUNCTION fn_detalle_produccion_stock();

-- ---------- Registro diario -----------------------------------------
-- Bloqueado si la producción está Finalizada (CA_54_01) y no puede superar lo asignado.
CREATE OR REPLACE FUNCTION fn_registro_diario_validar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
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

    IF v_estado_prod <> 'En proceso' THEN
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
END $$;

CREATE TRIGGER trg_registro_diario_validar
    BEFORE INSERT OR UPDATE OR DELETE ON tb_registro_diario
    FOR EACH ROW EXECUTE FUNCTION fn_registro_diario_validar();

-- ---------- Remisión de entrega -------------------------------------
-- Solo para remisiones Terminadas. Permite entregas parciales; cuando se entrega
-- todo, la remisión pasa automáticamente a "Entregada".
CREATE OR REPLACE FUNCTION fn_entrega_validar() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_estado     VARCHAR;
    v_total      INT;
    v_costo      DECIMAL(10,2);
    v_entregado  INT;
BEGIN
    SELECT estado, total_prendas, costo_prenda INTO v_estado, v_total, v_costo
      FROM tb_remision WHERE id_remision = NEW.id_remision;

    IF TG_OP = 'INSERT' AND v_estado <> 'Terminada' THEN
        RAISE EXCEPTION 'Solo se registran entregas de remisiones Terminadas (actual: %).', v_estado;
    END IF;

    SELECT COALESCE(sum(cantidad_entregada), 0) INTO v_entregado
      FROM tb_remision_entrega
     WHERE id_remision = NEW.id_remision AND id_entrega <> NEW.id_entrega;

    IF v_entregado + NEW.cantidad_entregada > v_total THEN
        RAISE EXCEPTION 'Se exceden las prendas de la remisión: total %, ya entregadas %, intenta entregar %.',
            v_total, v_entregado, NEW.cantidad_entregada;
    END IF;

    NEW.precio_total := COALESCE(NEW.precio_total, NEW.cantidad_entregada * v_costo);
    RETURN NEW;
END $$;

CREATE TRIGGER trg_entrega_validar
    BEFORE INSERT OR UPDATE ON tb_remision_entrega
    FOR EACH ROW EXECUTE FUNCTION fn_entrega_validar();

CREATE OR REPLACE FUNCTION fn_entrega_cerrar_remision() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE tb_remision r SET estado = 'Entregada'
     WHERE r.id_remision = NEW.id_remision
       AND r.estado = 'Terminada'
       AND (SELECT sum(cantidad_entregada) FROM tb_remision_entrega e
             WHERE e.id_remision = r.id_remision) >= r.total_prendas;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_entrega_cerrar_remision
    AFTER INSERT OR UPDATE ON tb_remision_entrega
    FOR EACH ROW EXECUTE FUNCTION fn_entrega_cerrar_remision();


-- =====================================================================
--  VISTAS · Consultas listas para la API y el dashboard
-- =====================================================================

-- Inventario unificado: taller + aportado por el cliente (CA_45_01, CA_45_02)
CREATE VIEW vw_inventario AS
SELECT i.id_insumos           AS id,
       i.nombre,
       t.nombre               AS tipo,
       'Taller'               AS origen,
       i.stock                AS disponible,
       i.unidad_medida        AS unidad,
       i.stock_minimo,
       i.stock_maximo,
       (i.stock <= i.stock_minimo) AS alerta_stock_minimo,
       NULL::VARCHAR          AS id_remision,
       NULL::VARCHAR          AS cliente,
       i.estado
  FROM tb_insumos i
  JOIN tb_tipo_insumos t ON t.id_tipo_insumos = i.id_tipo_insumo
UNION ALL
SELECT e.id_insumo_enviado,
       e.nombre,
       NULL,
       'Cliente',
       e.cantidad_disponible,
       e.unidad,
       NULL, NULL, FALSE,
       r.id_remision,
       c.nombre,
       r.estado
  FROM tb_insumos_enviados_x_cliente e
  JOIN tb_remision r ON r.id_remision = e.id_remision
  JOIN tb_clientes c ON c.nit = r.nit_cliente;

-- Asignaciones con avance (HU_55: el empleado filtra por su id)
CREATE VIEW vw_asignaciones AS
SELECT d.id_detalle_de_produccion,
       d.id_produccion,
       p.id_remision,
       p.estado                       AS estado_produccion,
       d.id_empleado,
       e.nombre                       AS empleado,
       tp.nombre                      AS pieza,
       tm.nombre                      AS maquina,
       dr.nombre_de_la_pieza          AS prenda,
       dr.talla,
       d.cantidad_asignada,
       COALESCE(sum(rd.cantidad), 0)::INT                       AS cantidad_realizada,
       (d.cantidad_asignada - COALESCE(sum(rd.cantidad), 0))::INT AS cantidad_pendiente,
       d.fecha_asignada
  FROM tb_detalle_de_produccion d
  JOIN tb_produccion   p  ON p.id_produccion = d.id_produccion
  JOIN empleados       e  ON e.id_empleados = d.id_empleado
  JOIN tipo_de_pieza   tp ON tp.id_tipo_de_pieza = d.id_tipo_pieza
  JOIN tipo_de_maquina tm ON tm.id_tipo_de_maquina = d.id_tipo_maquina
  JOIN tb_detalle_rem  dr ON dr.id_detalle_de_remision = d.id_detalle_de_remision
  LEFT JOIN tb_registro_diario rd ON rd.id_detalle_de_produccion = d.id_detalle_de_produccion
 GROUP BY d.id_detalle_de_produccion, p.id_remision, p.estado, e.nombre, tp.nombre,
          tm.nombre, dr.nombre_de_la_pieza, dr.talla;

-- Avance por producción en porcentaje (HU_52)
CREATE VIEW vw_avance_produccion AS
SELECT p.id_produccion,
       p.id_remision,
       c.nombre AS cliente,
       p.estado,
       p.fecha_inicio,
       p.fecha_entrega,
       COALESCE(sum(a.cantidad_asignada), 0)::INT  AS total_asignado,
       COALESCE(sum(a.cantidad_realizada), 0)::INT AS total_realizado,
       CASE WHEN COALESCE(sum(a.cantidad_asignada), 0) = 0 THEN 0
            ELSE round(100.0 * sum(a.cantidad_realizada) / sum(a.cantidad_asignada), 1)
       END AS porcentaje_avance
  FROM tb_produccion p
  JOIN tb_remision r ON r.id_remision = p.id_remision
  JOIN tb_clientes c ON c.nit = r.nit_cliente
  LEFT JOIN vw_asignaciones a ON a.id_produccion = p.id_produccion
 GROUP BY p.id_produccion, c.nombre;

-- Historial de reportes diarios (HU_57, HU_59)
CREATE VIEW vw_historial_registro_diario AS
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
       a.id_remision
  FROM tb_registro_diario rd
  JOIN vw_asignaciones a ON a.id_detalle_de_produccion = rd.id_detalle_de_produccion;

-- Historial legible de estados de remisión
CREATE VIEW vw_seguimiento_remision AS
SELECT s.id_seguimiento,
       s.id_remision,
       s.estado_anterior,
       s.estado_nuevo,
       COALESCE(e.nombre, c.nombre) AS responsable,
       CASE WHEN s.responsable_empleado IS NOT NULL THEN 'Empleado' ELSE 'Cliente' END AS tipo_responsable,
       s.fecha_hora
  FROM tb_seguimiento_remision s
  LEFT JOIN empleados   e ON e.id_empleados = s.responsable_empleado
  LEFT JOIN tb_clientes c ON c.nit = s.responsable_cliente;

-- Ventas (entregas) para dashboard: top clientes, últimas transacciones (HU_58, HU_60)
CREATE VIEW vw_ventas AS
SELECT en.id_entrega,
       en.fecha_finalizacion,
       en.id_remision,
       c.nit,
       c.nombre AS cliente,
       en.cantidad_entregada,
       en.precio_total,
       en.estado
  FROM tb_remision_entrega en
  JOIN tb_remision r ON r.id_remision = en.id_remision
  JOIN tb_clientes c ON c.nit = r.nit_cliente;


-- =====================================================================
--  DATOS BASE (necesarios para arrancar)
-- =====================================================================

-- Roles -> ROL00001 Administrador, ROL00002 Empleado, ROL00003 Cliente
INSERT INTO roles (descripcion_rol, es_protegido) VALUES
    ('Administrador', TRUE),
    ('Empleado',      FALSE),
    ('Cliente',       FALSE);

-- Permisos por módulo (PER00001 ...)
INSERT INTO permisos (descripcion, modulo) VALUES
    ('Gestionar roles y permisos',     'Configuración'),   -- PER00001
    ('Gestionar usuarios',             'Usuarios'),        -- PER00002
    ('Gestionar clientes',             'Ventas'),          -- PER00003
    ('Gestionar remisiones',           'Ventas'),          -- PER00004
    ('Crear remisión (cliente)',       'Ventas'),          -- PER00005
    ('Gestionar remisiones de entrega','Ventas'),          -- PER00006
    ('Gestionar proveedores',          'Compras'),         -- PER00007
    ('Gestionar compras',              'Compras'),         -- PER00008
    ('Gestionar insumos',              'Compras'),         -- PER00009
    ('Gestionar producción',           'Producción'),      -- PER00010
    ('Gestionar parámetros de producción','Producción'),   -- PER00011
    ('Registrar avance diario',        'Producción'),      -- PER00012
    ('Ver dashboard',                  'Medición');        -- PER00013

-- Administrador: todos menos "crear remisión (cliente)" y "registrar avance diario"
INSERT INTO rol_x_permiso (id_rol, id_permiso)
SELECT 'ROL00001', id_permiso FROM permisos
 WHERE id_permiso NOT IN ('PER00005', 'PER00012');
-- Empleado: registrar su avance diario
INSERT INTO rol_x_permiso VALUES ('ROL00002', 'PER00012');
-- Cliente: crear remisiones
INSERT INTO rol_x_permiso VALUES ('ROL00003', 'PER00005');

-- Administrador inicial -> EMP00001
-- Contraseña temporal: Eslabon2026*  (hash bcrypt, ¡cámbiela al entrar!)
INSERT INTO empleados (identificacion, nombre, correo, contrasena, id_rol) VALUES
    ('0000000000', 'Administrador', 'admin@eslabon.com',
     '$2a$12$E.SnBHtNY8pNIt.7tUBE9usWYYnIdn5sE6A9OD0KveiILxwjpa6Pa', 'ROL00001');

-- Tipos de insumo
INSERT INTO tb_tipo_insumos (nombre, descripcion) VALUES
    ('Hilos',       'Hilos de costura y fileteado'),
    ('Cremalleras', 'Cremalleras de diferentes medidas'),
    ('Botones',     'Botones y broches'),
    ('Etiquetas',   'Etiquetas de marca y talla'),
    ('Elásticos',   'Resortes y elásticos');

-- Tipos de máquina
INSERT INTO tipo_de_maquina (nombre, descripcion) VALUES
    ('Plana',        'Costura recta'),
    ('Fileteadora',  'Unión y remate de bordes'),
    ('Recubridora',  'Dobladillos y recubrimientos'),
    ('Collarín',     'Aplicación de cintas y sesgos'),
    ('Ojaladora',    'Ojales'),
    ('Botonadora',   'Pegado de botones');

-- Tipos de pieza
INSERT INTO tipo_de_pieza (nombre, descripcion) VALUES
    ('Delantero', 'Parte frontal de la prenda'),
    ('Espalda',   'Parte trasera de la prenda'),
    ('Manga',     'Mangas'),
    ('Cuello',    'Cuello'),
    ('Puño',      'Puños'),
    ('Bolsillo',  'Bolsillos'),
    ('Pretina',   'Pretina de pantalón');

COMMIT;