from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.produccion_service import ProduccionService
from app.application.registro_diario_service import RegistroDiarioService
from app.application.seguimiento_service import SeguimientoService
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.produccion_repository import ProduccionRepository
from app.infrastructure.repositories.registro_diario_repository import RegistroDiarioRepository
from app.infrastructure.repositories.seguimiento_repository import SeguimientoRepository


def get_produccion_service(db: Session = Depends(get_db)) -> ProduccionService:
    return ProduccionService(ProduccionRepository(db))


def get_registro_diario_service(db: Session = Depends(get_db)) -> RegistroDiarioService:
    return RegistroDiarioService(RegistroDiarioRepository(db))


def get_seguimiento_service(db: Session = Depends(get_db)) -> SeguimientoService:
    return SeguimientoService(SeguimientoRepository(db))
