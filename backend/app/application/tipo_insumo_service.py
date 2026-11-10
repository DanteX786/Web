from app.domain.entities.tipo_insumo import TipoInsumo
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.tipo_insumo_repository import ITipoInsumoRepository


class TipoInsumoService:
    """Gestión de tipos de insumo.

    Reglas de negocio:
    - El nombre del tipo no se puede repetir (sin importar mayúsculas).
    - No se elimina un tipo que ya tiene insumos asignados.
    """

    def __init__(self, repo: ITipoInsumoRepository):
        self.repo = repo

    def _validar(self, datos: dict, excluir_id: str | None = None) -> None:
        if "nombre" in datos and self.repo.existe_nombre(datos["nombre"], excluir_id):
            raise ConflictError(f"Ya existe un tipo de insumo llamado {datos['nombre']}.")

    def listar(self) -> list[TipoInsumo]:
        return self.repo.listar()

    def obtener(self, id_tipo: str) -> TipoInsumo:
        tipo = self.repo.obtener(id_tipo)
        if not tipo:
            raise NotFoundError(f"No existe el tipo de insumo {id_tipo}.")
        return tipo

    def crear(self, datos: dict) -> TipoInsumo:
        self._validar(datos)
        return self.repo.crear(datos)

    def actualizar(self, id_tipo: str, datos: dict) -> TipoInsumo:
        self.obtener(id_tipo)  # lanza 404 si no existe
        self._validar(datos, excluir_id=id_tipo)
        return self.repo.actualizar(id_tipo, datos)

    def eliminar(self, id_tipo: str) -> None:
        self.obtener(id_tipo)  # lanza 404 si no existe
        if self.repo.esta_en_uso(id_tipo):
            raise ConflictError(
                "No se puede eliminar el tipo de insumo porque hay insumos registrados con este tipo."
            )
        self.repo.eliminar(id_tipo)
