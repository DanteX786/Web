from app.domain.entities.cliente import CategoriaCliente, Cliente
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.cliente_repository import IClienteRepository


class ClienteService:
    """Gestión de clientes.

    Reglas de negocio:
    - El NIT es la identificación del cliente: no se repite y no se cambia después de crear.
    - El correo no se puede repetir entre clientes.
    - La categoría debe existir y estar activa.
    - El rol siempre es "Cliente" (lo asigna el backend, no se pide en el formulario).
    - No se elimina un cliente que ya tiene remisiones; en ese caso se debe inactivar.
    """

    def __init__(self, repo: IClienteRepository):
        self.repo = repo

    def _validar(self, datos: dict, excluir_nit: str | None = None) -> None:
        correo = datos.get("correo")
        if correo and self.repo.existe_correo(correo, excluir_nit):
            raise ConflictError(f"Ya existe un cliente con el correo {correo}.")
        categoria = datos.get("id_categoria")
        if categoria and not self.repo.existe_categoria_activa(categoria):
            raise NotFoundError(f"La categoría {categoria} no existe o está inactiva.")

    def listar(self, estado: str | None = None) -> list[Cliente]:
        return self.repo.listar(estado)

    def listar_categorias(self) -> list[CategoriaCliente]:
        return self.repo.listar_categorias()

    def obtener(self, nit: str) -> Cliente:
        cliente = self.repo.obtener(nit)
        if not cliente:
            raise NotFoundError(f"No existe el cliente con NIT {nit}.")
        return cliente

    def crear(self, datos: dict) -> Cliente:
        if self.repo.obtener(datos["nit"]):
            raise ConflictError(f"Ya existe un cliente con el NIT {datos['nit']}.")
        self._validar(datos)
        return self.repo.crear(datos)

    def actualizar(self, nit: str, datos: dict) -> Cliente:
        self.obtener(nit)  # lanza 404 si no existe
        self._validar(datos, excluir_nit=nit)
        return self.repo.actualizar(nit, datos)

    def eliminar(self, nit: str) -> None:
        self.obtener(nit)  # lanza 404 si no existe
        if self.repo.esta_en_uso(nit):
            raise ConflictError(
                "No se puede eliminar el cliente porque ya tiene remisiones registradas. "
                "Puede cambiar su estado a Inactivo."
            )
        self.repo.eliminar(nit)
