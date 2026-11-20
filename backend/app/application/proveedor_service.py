from app.application.validaciones import (
    normalizar_correo,
    normalizar_documento,
    problema_contacto,
    problema_correo,
    problema_direccion,
    problema_documento,
    problema_nombre,
    problema_telefono,
)
from app.domain.entities.proveedor import Proveedor
from app.domain.exceptions.errors import ConflictError, NotFoundError, ValidacionError
from app.domain.interfaces.proveedor_repository import IProveedorRepository

# Una vez creado el proveedor, su NIT y su nombre no se pueden cambiar (PB-36)
CAMPOS_NO_EDITABLES = ("nit", "nombre")


def _validar(datos: dict, es_nuevo: bool) -> dict:
    """Aplica las mismas reglas del frontend (app/application/validaciones.py).

    Los campos opcionales solo se validan si traen algún valor.
    Lanza ValidacionError (400) con el primer problema encontrado.
    """
    d = dict(datos)

    if es_nuevo:
        d["nit"] = normalizar_documento("NIT", d.get("nit") or "")
        problema = problema_documento("NIT", d["nit"]) or problema_nombre(d.get("nombre") or "")
        if problema:
            raise ValidacionError(problema)

    if d.get("correo"):
        d["correo"] = normalizar_correo(d["correo"])
        if problema := problema_correo(d["correo"]):
            raise ValidacionError(problema)

    if d.get("telefono"):
        if problema := problema_telefono("Empresarial", d["telefono"]):
            raise ValidacionError(problema)

    if d.get("contacto"):
        if problema := problema_contacto("NIT", d["contacto"]):
            raise ValidacionError(problema)

    if d.get("direccion"):
        if problema := problema_direccion(d["direccion"]):
            raise ValidacionError(problema)

    return d


class ProveedorService:
    """Gestión de proveedores (PB-36).

    Reglas de negocio:
    - El NIT no se puede repetir (CA_36_01).
    - El NIT y el nombre no se pueden editar después de crear el proveedor.
    - Los datos se validan con las mismas reglas del frontend.
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
        datos = _validar(datos, es_nuevo=True)
        if self.repo.existe_nit(datos["nit"]):
            raise ConflictError(f"Ya existe un proveedor con el NIT {datos['nit']}.")
        return self.repo.crear(datos)

    def actualizar(self, id_proveedor: str, datos: dict) -> Proveedor:
        self.obtener(id_proveedor)  # lanza 404 si no existe
        # El NIT y el nombre se ignoran aunque lleguen: no son editables
        datos = {k: v for k, v in datos.items() if k not in CAMPOS_NO_EDITABLES}
        datos = _validar(datos, es_nuevo=False)
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
        