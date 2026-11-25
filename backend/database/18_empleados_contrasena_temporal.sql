-- =====================================================================
-- 18 - Contraseña de los empleados por correo (seguridad)
--   * El administrador ya NO escribe la contraseña del empleado: el sistema
--     genera una contraseña temporal y se la envía a su correo.
--   * debe_cambiar_contrasena = TRUE obliga al empleado a crear su propia
--     contraseña la primera vez que entra (no puede usar el sistema antes).
--   * Los empleados que ya existen (no administradores) quedan obligados a
--     cambiarla, porque hoy tienen una contraseña conocida por todos.
-- Se ejecuta UNA vez, completo, en el SQL Editor de Neon (después del 17).
-- =====================================================================
BEGIN;

ALTER TABLE empleados
    ADD COLUMN IF NOT EXISTS debe_cambiar_contrasena BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE empleados SET debe_cambiar_contrasena = TRUE
 WHERE id_rol IN (SELECT id_rol FROM roles WHERE descripcion_rol <> 'Administrador');

COMMIT;

-- Verificación
SELECT e.id_empleados, e.nombre, r.descripcion_rol AS rol, e.debe_cambiar_contrasena
  FROM empleados e JOIN roles r ON r.id_rol = e.id_rol
 ORDER BY e.id_empleados;
