"""Exporta la ESTRUCTURA de la base de datos (tablas, restricciones, vistas,
triggers y funciones) a database/esquema_actual.sql. No exporta datos ni claves.

Uso (desde la carpeta backend, con el venv activo):
    python database/exportar_esquema.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text  # noqa: E402

from app.infrastructure.database.database import engine  # noqa: E402

CONSULTAS = {
    "TABLAS": """
        SELECT c.relname,
               string_agg('    ' || a.attname || ' ' || format_type(a.atttypid, a.atttypmod)
                          || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END
                          || COALESCE(' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid), ''),
                          E',\\n' ORDER BY a.attnum)
          FROM pg_class c
          JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
          LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
         WHERE c.relkind = 'r' AND c.relnamespace = 'public'::regnamespace
         GROUP BY c.relname ORDER BY c.relname""",
    "RESTRICCIONES": """
        SELECT conrelid::regclass::text || '.' || conname, pg_get_constraintdef(oid)
          FROM pg_constraint
         WHERE connamespace = 'public'::regnamespace AND conrelid <> 0
         ORDER BY 1""",
    "SECUENCIAS": """
        SELECT sequencename, 'start ' || start_value || ' last ' || COALESCE(last_value::text, '-')
          FROM pg_sequences WHERE schemaname = 'public' ORDER BY 1""",
    "VISTAS": """
        SELECT viewname, pg_get_viewdef(('public.' || quote_ident(viewname))::regclass, true)
          FROM pg_views WHERE schemaname = 'public' ORDER BY 1""",
    "TRIGGERS": """
        SELECT tgrelid::regclass::text || '.' || tgname, pg_get_triggerdef(oid)
          FROM pg_trigger WHERE NOT tgisinternal ORDER BY 1""",
    "FUNCIONES": """
        SELECT p.proname, pg_get_functiondef(p.oid)
          FROM pg_proc p
         WHERE p.pronamespace = 'public'::regnamespace AND p.prokind IN ('f', 'p')
         ORDER BY 1""",
}

salida = Path(__file__).resolve().parent / "esquema_actual.sql"
with engine.connect() as con, salida.open("w", encoding="utf-8") as f:
    for titulo, sql in CONSULTAS.items():
        f.write(f"-- {'=' * 70}\n-- {titulo}\n-- {'=' * 70}\n")
        for nombre, definicion in con.execute(text(sql)):
            f.write(f"\n-- {nombre}\n{definicion}\n")
        f.write("\n")
print(f"Listo: {salida}")
