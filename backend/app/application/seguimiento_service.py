from datetime import date

from app.domain.entities.seguimiento import Seguimiento
from app.domain.entities.usuario import Usuario
from app.domain.exceptions.errors import NotFoundError
from app.domain.interfaces.seguimiento_repository import ISeguimientoRepository


class SeguimientoService:
    """Consulta del historial de estados de las remisiones (tb_seguimiento_remision).

    No hay crear/editar/eliminar: el historial lo llena la base de datos sola
    cada vez que cambia tb_remision.estado, y no se puede modificar.
    Un CLIENTE solo ve el historial de sus propias remisiones.
    """

    def __init__(self, repo: ISeguimientoRepository):
        self.repo = repo

    @staticmethod
    def _nit_si_cliente(usuario: Usuario | None) -> str | None:
        return usuario.id if usuario is not None and usuario.tipo == "Cliente" else None

    def historial_remision(self, id_remision: str, usuario: Usuario | None = None) -> list[Seguimiento]:
        if not self.repo.existe_remision(id_remision, self._nit_si_cliente(usuario)):
            raise NotFoundError(f"No existe la remisión {id_remision}.")
        return self.repo.listar_por_remision(id_remision)

    def listar(self, estado_nuevo: str | None = None, desde: date | None = None,
               hasta: date | None = None, usuario: Usuario | None = None) -> list[Seguimiento]:
        return self.repo.listar(estado_nuevo, desde, hasta, self._nit_si_cliente(usuario))
