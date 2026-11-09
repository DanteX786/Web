from sqlalchemy import text
from sqlalchemy.orm import Session


def fijar_responsable(db: Session, id_empleado: str) -> None:
    """Le dice a PostgreSQL qué empleado hace la operación (solo para esta transacción).

    Lo usa el trigger de tb_seguimiento_remision para guardar el responsable.
    Debe llamarse ANTES de los cambios y en la MISMA transacción (antes del commit).
    """
    db.execute(text("SELECT set_config('eslabon.id_empleado', :id, true)"), {"id": id_empleado})
