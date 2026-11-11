-- =====================================================================
--  ESLABÓN · Quitar la categoría de clientes
--  Ejecutar UNA sola vez en el SQL Editor de Neon (en la base que ya existe).
--  El script eslabon.sql ya viene sin la categoría, así que una base nueva
--  no necesita esto.
--
--  Qué hace:
--    1. Quita la columna id_categoria de tb_clientes
--       (se borran solas su llave foránea y su índice).
--    2. Borra la tabla tb_categoria_clientes y su secuencia.
--  Los clientes NO se borran: solo pierden el dato de la categoría.
-- =====================================================================
BEGIN;

ALTER TABLE tb_clientes DROP COLUMN IF EXISTS id_categoria;
DROP TABLE IF EXISTS tb_categoria_clientes;
DROP SEQUENCE IF EXISTS seq_categoria_clientes;

COMMIT;

-- Revisión: debe salir 0 en las dos columnas
SELECT
  (SELECT count(*) FROM information_schema.columns
    WHERE table_name = 'tb_clientes' AND column_name = 'id_categoria') AS columna_categoria,
  (SELECT count(*) FROM information_schema.tables
    WHERE table_name = 'tb_categoria_clientes')                       AS tabla_categoria;
