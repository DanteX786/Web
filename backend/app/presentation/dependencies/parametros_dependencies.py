from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.tipo_maquina_service import TipoMaquinaService
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.tipo_maquina_repository import TipoMaquinaRepository


def get_tipo_maquina_service(db: Session = Depends(get_db)) -> TipoMaquinaService:
    return TipoMaquinaService(TipoMaquinaRepository(db))

