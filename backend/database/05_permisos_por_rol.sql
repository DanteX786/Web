-- =====================================================================
--  ESLABÓN · Migración 05 · Permisos por rol para el menú
--  Asegura que existan los permisos que usa el frontend y que cada rol
--  base tenga los suyos. No borra nada: solo agrega lo que falte.
--  Se puede ejecutar varias veces.
-- =====================================================================
BEGIN;

-- 1. Permisos que usa el menú (si ya existen, no se duplican)
INSERT INTO permisos (descripcion, modulo)
SELECT v.descripcion, v.modulo
  FROM (VALUES
    ('Ver dashboard',                      'Medición'),
    ('Gestionar roles y permisos',         'Configuración'),
    ('Gestionar usuarios',                 'Usuarios'),
    ('Gestionar clientes',                 'Ventas'),
    ('Gestionar remisiones',               'Ventas'),
    ('Crear remisión (cliente)',           'Ventas'),
    ('Gestionar remisiones de entrega',    'Ventas'),
    ('Gestionar proveedores',              'Compras'),
    ('Gestionar compras',                  'Compras'),
    ('Gestionar insumos',                  'Compras'),
    ('Gestionar producción',               'Producción'),
    ('Gestionar parámetros de producción', 'Producción'),
    ('Registrar avance diario',            'Producción')
  ) AS v(descripcion, modulo)
 WHERE NOT EXISTS (SELECT 1 FROM permisos p WHERE p.descripcion = v.descripcion);

-- 2. Administrador: todos los permisos
INSERT INTO rol_x_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
  FROM roles r CROSS JOIN permisos p
 WHERE r.descripcion_rol = 'Administrador'
ON CONFLICT DO NOTHING;

-- 3. Empleado (operario): solo registrar su avance diario
INSERT INTO rol_x_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
  FROM roles r JOIN permisos p ON p.descripcion = 'Registrar avance diario'
 WHERE r.descripcion_rol = 'Empleado'
ON CONFLICT DO NOTHING;

-- 4. Cliente: solo crear y consultar sus remisiones
INSERT INTO rol_x_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
  FROM roles r JOIN permisos p ON p.descripcion = 'Crear remisión (cliente)'
 WHERE r.descripcion_rol = 'Cliente'
ON CONFLICT DO NOTHING;

-- 5. El Cliente NO debe tener permisos de administración (por si se asignaron por error)
DELETE FROM rol_x_permiso rp
 USING roles r, permisos p
 WHERE rp.id_rol = r.id_rol AND rp.id_permiso = p.id_permiso
   AND r.descripcion_rol = 'Cliente'
   AND p.descripcion <> 'Crear remisión (cliente)';

COMMIT;

-- Para revisar cómo quedó:
-- SELECT r.descripcion_rol, p.descripcion
--   FROM rol_x_permiso rp JOIN roles r USING (id_rol) JOIN permisos p USING (id_permiso)
--  ORDER BY 1, 2;
