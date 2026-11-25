-- =====================================================================
-- 19 - Los empleados NO se eliminan
--   El histórico laboral de un empleado se debe conservar (por ley):
--   un empleado solo se cambia de estado (Activo / Inactivo).
--   Este trigger impide borrar empleados aunque se intente desde la base de datos.
--   Se ejecuta UNA vez en el SQL Editor de Neon (después del 18).
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_empleados_no_eliminar()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION 'Los empleados no se pueden eliminar (su histórico se conserva). Cambie su estado a Inactivo.';
END;
$function$;

DROP TRIGGER IF EXISTS trg_empleados_no_eliminar ON empleados;
CREATE TRIGGER trg_empleados_no_eliminar
    BEFORE DELETE ON empleados
    FOR EACH ROW EXECUTE FUNCTION fn_empleados_no_eliminar();
