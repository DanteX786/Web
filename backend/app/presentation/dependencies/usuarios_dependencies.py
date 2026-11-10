from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.cliente_service import ClienteService
from app.application.empleado_service import EmpleadoService
from app.application.rol_service import RolService
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.cliente_repository import ClienteRepository
from app.infrastructure.repositories.empleado_repository import EmpleadoRepository
from app.infrastructure.repositories.rol_repository import RolRepository


def get_rol_service(db: Session = Depends(get_db)) -> RolService:
    return RolService(RolRepository(db))


def get_empleado_service(db: Session = Depends(get_db)) -> EmpleadoService:
    return EmpleadoService(EmpleadoRepository(db))


def get_cliente_service(db: Session = Depends(get_db)) -> ClienteService:
    return ClienteService(ClienteRepository(db))
