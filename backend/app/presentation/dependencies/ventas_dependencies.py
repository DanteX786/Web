from fastapi import Depends
from sqlalchemy.orm import Session

from app.application.entrega_service import EntregaService
from app.application.insumo_enviado_service import InsumoEnviadoService
from app.application.remision_service import RemisionService
from app.domain.interfaces.archivo_storage import IArchivoStorage
from app.infrastructure.database.database import get_db
from app.infrastructure.repositories.entrega_repository import EntregaRepository
from app.infrastructure.repositories.insumo_enviado_repository import InsumoEnviadoRepository
from app.infrastructure.repositories.remision_repository import RemisionRepository
from app.infrastructure.storage.local_storage import LocalArchivoStorage


def get_storage() -> IArchivoStorage:
    # Para pasar a la nube: devolver aquí otra clase que implemente IArchivoStorage
    return LocalArchivoStorage()


def get_remision_service(db: Session = Depends(get_db),
                         storage: IArchivoStorage = Depends(get_storage)) -> RemisionService:
    return RemisionService(RemisionRepository(db), storage)


def get_insumo_enviado_service(db: Session = Depends(get_db)) -> InsumoEnviadoService:
    return InsumoEnviadoService(InsumoEnviadoRepository(db))


def get_entrega_service(db: Session = Depends(get_db),
                        storage: IArchivoStorage = Depends(get_storage)) -> EntregaService:
    return EntregaService(EntregaRepository(db), storage)
