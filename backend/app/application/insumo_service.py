from app.domain.entities.insumo import Insumo, TipoInsumo
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.insumo_repository import IInsumoRepository


class InsumoService:
    """Gestión de insumos.

    Reglas de negocio:
    - El nombre del insumo no se puede repetir.
    - El tipo de insumo debe existir.
    - El stock solo se fija al crear; después lo modifican las compras y la producción.
    - No se elimina un insumo que ya aparece en compras o en producción.
    """

    def __init__(self, repo: IInsumoRepository):
        self.repo = repo

    def _validar(self, datos: dict, excluir_id: str | None = None) -> None:
        if "nombre" in datos and self.repo.existe_nombre(datos["nombre"], excluir_id):
            raise ConflictError(f"Ya existe un insumo llamado {datos['nombre']}.")
        if "tipo_id" in datos and not self.repo.existe_tipo(datos["tipo_id"]):
            raise NotFoundError(f"No existe el tipo de insumo {datos['tipo_id']}.")

    def listar(self, id_tipo: str | None = None) -> list[Insumo]:
        return self.repo.listar(id_tipo)

    def listar_tipos(self) -> list[TipoInsumo]:
        return self.repo.listar_tipos()

    def obtener(self, id_insumo: str) -> Insumo:
        insumo = self.repo.obtener(id_insumo)
        if not insumo:
            raise NotFoundError(f"No existe el insumo {id_insumo}.")
        return insumo

    def crear(self, datos: dict) -> Insumo:
        self._validar(datos)
        return self.repo.crear(datos)

    def actualizar(self, id_insumo: str, datos: dict) -> Insumo:
        self.obtener(id_insumo)  # lanza 404 si no existe
        datos = {k: v for k, v in datos.items() if k != "stock"}  # el stock no se edita a mano
        self._validar(datos, excluir_id=id_insumo)
        return self.repo.actualizar(id_insumo, datos)

    def eliminar(self, id_insumo: str) -> None:
        self.obtener(id_insumo)  # lanza 404 si no existe
        if self.repo.esta_en_uso(id_insumo):
            raise ConflictError(
                "No se puede eliminar el insumo porque ya aparece en compras o en producción."
            )
        self.repo.eliminar(id_insumo)
