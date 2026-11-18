-- =====================================================================
-- 07 - Correcciones de la instructora
--   1) Persona a contactar cuando el cliente es una empresa (NIT)
--   2) Tipos de documento estándar de Colombia: NIT, CC, CE, PA, PPT
-- Se puede ejecutar más de una vez sin problema.
-- =====================================================================
BEGIN;

-- 1) Nombre de la persona a contactar (obligatorio en la app solo para NIT)
ALTER TABLE tb_clientes ADD COLUMN IF NOT EXISTS nombre_contacto VARCHAR(100);

-- 2) Tipos de documento
ALTER TABLE tb_clientes DROP CONSTRAINT IF EXISTS ck_clientes_tipo_documento;

-- Las cuentas que estaban como 'Cédula' pasan a Cédula de ciudadanía (CC)
UPDATE tb_clientes SET tipo_documento = 'CC' WHERE tipo_documento = 'Cédula';

ALTER TABLE tb_clientes
    ADD CONSTRAINT ck_clientes_tipo_documento
    CHECK (tipo_documento IN ('NIT', 'CC', 'CE', 'PA', 'PPT'));

COMMIT;

-- Verificación
SELECT tipo_documento, COUNT(*) AS clientes, COUNT(nombre_contacto) AS con_contacto
  FROM tb_clientes GROUP BY tipo_documento ORDER BY tipo_documento;
