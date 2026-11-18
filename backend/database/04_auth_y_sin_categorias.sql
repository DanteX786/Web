-- =====================================================================
--  ESLABÓN · Migración 04 · Login real + quitar categorías de clientes
--  Ejecutar UNA VEZ en Neon (SQL Editor). Se puede volver a correr sin daño.
-- =====================================================================
BEGIN;

-- ---------- 1. Quitar categorías de clientes (el equipo las eliminó) ----------
ALTER TABLE tb_clientes DROP COLUMN IF EXISTS id_categoria;   -- borra también su FK e índice
DROP TABLE IF EXISTS tb_categoria_clientes;
DROP SEQUENCE IF EXISTS seq_categoria_clientes;

-- ---------- 2. Datos del registro de clientes ----------
-- Documento: NIT o Cédula (PBI-15)
ALTER TABLE tb_clientes ADD COLUMN IF NOT EXISTS tipo_documento VARCHAR(10) NOT NULL DEFAULT 'NIT';
-- Un solo teléfono; el cliente elige si es Empresarial o Personal (PBI-16)
ALTER TABLE tb_clientes ADD COLUMN IF NOT EXISTS tipo_telefono VARCHAR(15) NOT NULL DEFAULT 'Empresarial';

ALTER TABLE tb_clientes DROP CONSTRAINT IF EXISTS ck_clientes_tipo_documento;
ALTER TABLE tb_clientes ADD CONSTRAINT ck_clientes_tipo_documento
    CHECK (tipo_documento IN ('NIT', 'Cédula'));
ALTER TABLE tb_clientes DROP CONSTRAINT IF EXISTS ck_clientes_tipo_telefono;
ALTER TABLE tb_clientes ADD CONSTRAINT ck_clientes_tipo_telefono
    CHECK (tipo_telefono IN ('Empresarial', 'Personal'));

-- ---------- 3. Cerrar todas las sesiones al cambiar la contraseña (PBI-21) ----------
-- Cada token guarda esta versión; al cambiar la contraseña sube y los tokens viejos dejan de servir.
ALTER TABLE tb_clientes ADD COLUMN IF NOT EXISTS version_token INT NOT NULL DEFAULT 0;
ALTER TABLE empleados   ADD COLUMN IF NOT EXISTS version_token INT NOT NULL DEFAULT 0;

-- ---------- 4. Códigos de recuperación de contraseña (PBI-18, PBI-19) ----------
CREATE SEQUENCE IF NOT EXISTS seq_codigo_recuperacion;

CREATE TABLE IF NOT EXISTS tb_codigos_recuperacion (
    id_codigo        VARCHAR(10)  PRIMARY KEY DEFAULT fn_generar_id('COD', 'seq_codigo_recuperacion'),
    correo           VARCHAR(100) NOT NULL,
    tipo_usuario     VARCHAR(10)  NOT NULL CHECK (tipo_usuario IN ('Empleado', 'Cliente')),
    codigo_hash      VARCHAR(255) NOT NULL,              -- el código nunca se guarda en texto plano
    intentos         INT          NOT NULL DEFAULT 0 CHECK (intentos >= 0),
    usado            BOOLEAN      NOT NULL DEFAULT FALSE, -- TRUE si se usó o si se reenvió otro código
    fecha_creacion   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    fecha_expiracion TIMESTAMPTZ  NOT NULL,
    CONSTRAINT ck_codigo_expiracion CHECK (fecha_expiracion > fecha_creacion)
);

CREATE INDEX IF NOT EXISTS ix_codigos_correo ON tb_codigos_recuperacion (lower(correo), fecha_creacion DESC);

COMMIT;

-- Verificación:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'tb_clientes';
