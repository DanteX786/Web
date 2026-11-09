from datetime import date

from app.domain.entities.seguimiento import Seguimiento
from app.domain.exceptions.errors import NotFoundError
from app.domain.interfaces.seguimiento_repository import ISeguimientoRepository


class SeguimientoService:
    """Consulta del historial de estados de las remisiones.

    No hay crear/editar/eliminar: el historial lo llena la base de datos sola
    cada vez que cambia tb_remision.estado, y no se puede modificar.
    """

    def __init__(self, repo: ISeguimientoRepository):
        self.repo = repo

    def historial_remision(self, id_remision: str) -> list[Seguimiento]:
        if not self.repo.existe_remision(id_remision):
            raise NotFoundError(f"No existe la remisión {id_remision}.")
        return self.repo.listar_por_remision(id_remision)

    def listar(self, estado_nuevo: str | None = None, desde: date | None = None,
               hasta: date | None = None) -> list[Seguimiento]:
        return self.repo.listar(estado_nuevo, desde, hasta)
