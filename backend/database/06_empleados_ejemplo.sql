-- =====================================================================
--  ESLABÓN · 06 · Cinco empleados (operarios) de ejemplo
--  Contraseña de todos: Eslabon2026*   (hash bcrypt)
--  Se puede ejecutar varias veces: si el correo o la identificación ya existen, no los repite.
-- =====================================================================
INSERT INTO empleados (identificacion, nombre, direccion, correo, telefono, contrasena, estado, id_rol)
SELECT v.identificacion, v.nombre, v.direccion, v.correo, v.telefono,
       '$2a$12$E.SnBHtNY8pNIt.7tUBE9usWYYnIdn5sE6A9OD0KveiILxwjpa6Pa',
       'Activo',
       (SELECT id_rol FROM roles WHERE descripcion_rol = 'Empleado')
  FROM (VALUES
    ('1036601001', 'Carolina Restrepo Mejía', 'Cra 52 #45-10, Medellín',   'carolina.restrepo@eslabon.com', '3104561201'),
    ('1036601002', 'Andrés Felipe Gómez',     'Cl 30 #65-22, Medellín',    'andres.gomez@eslabon.com',      '3015782302'),
    ('1036601003', 'Luz Marina Ospina',       'Cra 80 #33-15, Medellín',   'luz.ospina@eslabon.com',        '3128893403'),
    ('1036601004', 'Jhon Fredy Zapata',       'Cl 44 #70-08, Bello',       'jhon.zapata@eslabon.com',       '3206674504'),
    ('1036601005', 'Paula Andrea Cardona',    'Cra 43A #18-55, Envigado',  'paula.cardona@eslabon.com',     '3007785605')
  ) AS v(identificacion, nombre, direccion, correo, telefono)
 WHERE NOT EXISTS (
       SELECT 1 FROM empleados e
        WHERE e.identificacion = v.identificacion OR lower(e.correo) = lower(v.correo));

-- Revisar:
-- SELECT id_empleados, nombre, correo, estado FROM empleados ORDER BY id_empleados;
