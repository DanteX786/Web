from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.compra_service import CompraService
from app.application.insumo_service import InsumoService
from app.application.proveedor_service import ProveedorService
from app.application.tipo_insumo_service import TipoInsumoService
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.compra_repository import CompraRepository
from app.infrastructure.repositories.insumo_repository import InsumoRepository
from app.infrastructure.repositories.proveedor_repository import ProveedorRepository
from app.infrastructure.repositories.tipo_insumo_repository import TipoInsumoRepository


def get_proveedor_service(db: Session = Depends(get_db)) -> ProveedorService:
    return ProveedorService(ProveedorRepository(db))


def get_insumo_service(db: Session = Depends(get_db)) -> InsumoService:
    return InsumoService(InsumoRepository(db))


def get_tipo_insumo_service(db: Session = Depends(get_db)) -> TipoInsumoService:
    return TipoInsumoService(TipoInsumoRepository(db))


def get_compra_service(db: Session = Depends(get_db)) -> CompraService:
    return CompraService(CompraRepository(db))
