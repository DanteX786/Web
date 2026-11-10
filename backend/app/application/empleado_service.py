import bcrypt

from app.domain.entities.empleado import Empleado
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.empleado_repository import IEmpleadoRepository


def encriptar(contrasena: str) -> str:
    """Convierte la contraseña en un hash bcrypt. Nunca se guarda la contraseña real."""
    return bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


class EmpleadoService:
    """Gestión de empleados.

    Reglas de negocio:
    - La identificación y el correo no se pueden repetir.
    - El rol asignado debe existir.
    - La contraseña se guarda encriptada (bcrypt) y nunca se devuelve.
    - No se elimina un empleado con asignaciones de producción; en ese caso se debe inactivar.
    """

    def __init__(self, repo: IEmpleadoRepository):
        self.repo = repo

    def _validar(self, datos: dict, excluir_id: str | None = None) -> None:
        if "identificacion" in datos and self.repo.existe_identificacion(datos["identificacion"], excluir_id):
            raise ConflictError(f"Ya existe un empleado con la identificación {datos['identificacion']}.")
        if datos.get("correo") and self.repo.existe_correo(datos["correo"], excluir_id):
            raise ConflictError(f"Ya existe un empleado con el correo {datos['correo']}.")
        if "id_rol" in datos and not self.repo.existe_rol(datos["id_rol"]):
            raise NotFoundError(f"No existe el rol {datos['id_rol']}.")

    @staticmethod
    def _preparar(datos: dict) -> dict:
        """Cambia la contraseña en texto plano por su hash antes de enviarla al repositorio."""
        datos = dict(datos)
        contrasena = datos.pop("contrasena", None)
        if contrasena:
            datos["contrasena_hash"] = encriptar(contrasena)
        return datos

    def listar(self, estado: str | None = None) -> list[Empleado]:
        return self.repo.listar(estado)

    def obtener(self, id_empleado: str) -> Empleado:
        empleado = self.repo.obtener(id_empleado)
        if not empleado:
            raise NotFoundError(f"No existe el empleado {id_empleado}.")
        return empleado

    def crear(self, datos: dict) -> Empleado:
        self._validar(datos)
        return self.repo.crear(self._preparar(datos))

    def actualizar(self, id_empleado: str, datos: dict) -> Empleado:
        self.obtener(id_empleado)  # lanza 404 si no existe
        self._validar(datos, excluir_id=id_empleado)
        return self.repo.actualizar(id_empleado, self._preparar(datos))

    def cambiar_estado(self, id_empleado: str, estado: str) -> Empleado:
        return self.actualizar(id_empleado, {"estado": estado})

    def eliminar(self, id_empleado: str) -> None:
        self.obtener(id_empleado)  # lanza 404 si no existe
        if self.repo.tiene_produccion(id_empleado):
            raise ConflictError(
                "No se puede eliminar el empleado porque tiene asignaciones de producción. "
                "Puede marcarlo como Inactivo."
            )
        self.repo.eliminar(id_empleado)
