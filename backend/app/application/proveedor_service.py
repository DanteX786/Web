from app.domain.entities.proveedor import Proveedor
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.proveedor_repository import IProveedorRepository


class ProveedorService:
    """Gestión de proveedores (PB-36).

    Reglas de negocio:
    - El NIT no se puede repetir (CA_36_01).
    - No se elimina un proveedor que ya tiene compras; en ese caso se debe inactivar.
    """

    def __init__(self, repo: IProveedorRepository):
        self.repo = repo

    def listar(self, estado: str | None = None) -> list[Proveedor]:
        return self.repo.listar(estado)

    def obtener(self, id_proveedor: str) -> Proveedor:
        proveedor = self.repo.obtener(id_proveedor)
        if not proveedor:
            raise NotFoundError(f"No existe el proveedor {id_proveedor}.")
        return proveedor

    def crear(self, datos: dict) -> Proveedor:
        if self.repo.existe_nit(datos["nit"]):
            raise ConflictError(f"Ya existe un proveedor con el NIT {datos['nit']}.")
        return self.repo.crear(datos)

    def actualizar(self, id_proveedor: str, datos: dict) -> Proveedor:
        self.obtener(id_proveedor)  # lanza 404 si no existe
        if "nit" in datos and self.repo.existe_nit(datos["nit"], excluir_id=id_proveedor):
            raise ConflictError(f"Ya existe otro proveedor con el NIT {datos['nit']}.")
        return self.repo.actualizar(id_proveedor, datos)

    def cambiar_estado(self, id_proveedor: str, estado: str) -> Proveedor:
        return self.actualizar(id_proveedor, {"estado": estado})

    def eliminar(self, id_proveedor: str) -> None:
        self.obtener(id_proveedor)  # lanza 404 si no existe
        if self.repo.tiene_compras(id_proveedor):
            raise ConflictError(
                "No se puede eliminar el proveedor porque tiene compras registradas. "
                "Puede marcarlo como Inactivo."
            )
        self.repo.eliminar(id_proveedor)
        