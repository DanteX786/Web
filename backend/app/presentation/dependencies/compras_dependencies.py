from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.proveedor_service import ProveedorService
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.proveedor_repository import ProveedorRepository


def get_proveedor_service(db: Session = Depends(get_db)) -> ProveedorService:
    return ProveedorService(ProveedorRepository(db))
