-- =====================================================================
-- 17 - Limpiar los datos de prueba y dejar el aplicativo listo
--   BORRA (no se puede deshacer):
--     * Movimientos: remisiones y sus detalles, insumos enviados por clientes,
--       producciones, pasos, tareas, reprocesos, registro diario, asistencia,
--       remisiones de entrega, seguimientos y códigos de recuperación.
--     * Compras y su detalle. El stock de los insumos vuelve a 0
--       (el catálogo de insumos, tipos de insumo y proveedores se quedan).
--     * TODOS los clientes (hay que registrarlos de nuevo).
--     * Los empleados que NO son Administrador.
--   SE QUEDAN: roles, permisos, administradores, procesos, máquinas,
--   tipos de pieza, insumos, tipos de insumo y proveedores.
--   Después: los códigos vuelven a empezar en 00001 y se crean 7 empleados nuevos
--   (contraseña de todos: Eslabon2026*  — la misma del script 06).
--
--   Si algo falla, no se borra NADA (todo va en una sola transacción).
--   Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 16).
-- =====================================================================
BEGIN;

-- 0. Debe existir el rol "Empleado" para los empleados nuevos (si está inactivo, se activa)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE descripcion_rol = 'Empleado') THEN
        RAISE EXCEPTION 'No existe el rol "Empleado". Créelo antes (o ejecute los scripts 05 y 06).';
    END IF;
    UPDATE roles SET estado = 'Activo' WHERE descripcion_rol = 'Empleado' AND estado <> 'Activo';
    IF NOT EXISTS (SELECT 1 FROM empleados e JOIN roles r ON r.id_rol = e.id_rol
                    WHERE r.descripcion_rol = 'Administrador' AND e.estado = 'Activo') THEN
        RAISE EXCEPTION 'No hay ningún Administrador activo: no se limpia para no quedarse sin acceso.';
    END IF;
END $$;

-- 1. Movimientos, compras y clientes (en un solo TRUNCATE: si otra tabla depende
--    de estas y no está en la lista, PostgreSQL no deja seguir y no se borra nada)
TRUNCATE TABLE
    tb_registro_diario,
    tb_detalle_de_produccion,
    tb_pasos_produccion,
    tb_reproceso_talla,
    tb_reproceso,
    tb_seguimiento_produccion,
    tb_produccion,
    tb_remision_entrega,
    tb_insumos_enviados_x_cliente,
    tb_detalle_rem,
    tb_seguimiento_remision,
    tb_remision,
    tb_asistencia_marcacion,
    tb_asistencia,
    tb_codigos_recuperacion,
    tb_detalle_compras,
    tb_compras,
    tb_clientes;

-- 2. Stock de insumos en 0 (ya no hay compras que lo respalden)
UPDATE tb_insumos SET stock = 0 WHERE stock <> 0;

-- 3. Empleados: se quedan solo los Administradores
DELETE FROM empleados
 WHERE id_rol <> (SELECT id_rol FROM roles WHERE descripcion_rol = 'Administrador');

-- 4. Los códigos vuelven a empezar en 00001
DO $$
DECLARE
    v_seq TEXT;
BEGIN
    FOREACH v_seq IN ARRAY ARRAY[
        'seq_asistencia', 'seq_asistencia_marcacion', 'seq_codigo_recuperacion', 'seq_compras',
        'seq_detalle_produccion', 'seq_detalle_rem', 'seq_entrega', 'seq_insumo_enviado',
        'seq_pasos_produccion', 'seq_produccion', 'seq_registro_diario', 'seq_remision',
        'seq_reproceso', 'seq_seguimiento', 'seq_seguimiento_produccion', 'seq_detalle_compras']
    LOOP
        IF to_regclass(v_seq) IS NOT NULL THEN
            PERFORM setval(v_seq::regclass, 1, false);
        END IF;
    END LOOP;
    -- Empleados: siguen después del último administrador que quedó
    PERFORM setval('seq_empleados',
        COALESCE((SELECT max(substring(id_empleados FROM 4)::int) FROM empleados), 0) + 1, false);
END $$;

-- 5. Empleados nuevos del taller (operarios)
INSERT INTO empleados (identificacion, nombre, direccion, correo, telefono, contrasena, estado, id_rol)
SELECT v.identificacion, v.nombre, v.direccion, v.correo, v.telefono,
       '$2a$12$E.SnBHtNY8pNIt.7tUBE9usWYYnIdn5sE6A9OD0KveiILxwjpa6Pa',   -- Eslabon2026*
       'Activo',
       (SELECT id_rol FROM roles WHERE descripcion_rol = 'Empleado')
  FROM (VALUES
    ('43871256',   'Gloria Inés Arango Vélez',       'Cl 48 #79-31, Barrio La América, Medellín',  'gloria.arango@eslabon.com',     '3117452390'),
    ('1017184532', 'Yuliana Marcela Restrepo Pino',  'Cra 65 #97-14, Barrio Castilla, Medellín',   'yuliana.restrepo@eslabon.com',  '3046218875'),
    ('71789044',   'Hernán Darío Montoya Ríos',      'Cl 52 #55-20, Bello',                        'hernan.montoya@eslabon.com',    '3152094418'),
    ('1036645190', 'Sandra Milena Ruiz Gaviria',     'Cra 50A #63-12, Barrio Prado, Medellín',     'sandra.ruiz@eslabon.com',       '3218830147'),
    ('1128403377', 'Luisa Fernanda Correa Ochoa',    'Cl 37 Sur #43A-25, Envigado',                'luisa.correa@eslabon.com',      '3008914502'),
    ('42998615',   'Beatriz Elena Cardona Toro',     'Cra 46 #80-05, Barrio Manrique, Medellín',   'beatriz.cardona@eslabon.com',   '3135567209'),
    ('1001370582', 'Kevin Alejandro Úsuga Henao',    'Cl 104 #74-38, Barrio Robledo, Medellín',    'kevin.usuga@eslabon.com',       '3023471196')
  ) AS v(identificacion, nombre, direccion, correo, telefono)
 WHERE NOT EXISTS (
       SELECT 1 FROM empleados e
        WHERE e.identificacion = v.identificacion OR lower(e.correo) = lower(v.correo));

COMMIT;

-- Verificación: quiénes quedaron
SELECT e.id_empleados, e.nombre, r.descripcion_rol AS rol, e.correo, e.estado
  FROM empleados e JOIN roles r ON r.id_rol = e.id_rol
 ORDER BY e.id_empleados;
