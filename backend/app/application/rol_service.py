from app.domain.entities.rol import Permiso, Rol
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.rol_repository import IRolRepository

# Descripciones que se consideran el rol de administrador (se comparan en minúscula)
ROLES_ADMIN = ("admin", "administrador")


class RolService:
    """Gestión de roles y sus permisos.

    Reglas de negocio:
    - La descripción del rol no se puede repetir.
    - Todo rol debe tener al menos un permiso, y los permisos deben existir.
    - El rol de administrador no se puede eliminar ni inactivar.
    - No se elimina un rol que tiene empleados asignados; en ese caso se debe inactivar.
    """

    def __init__(self, repo: IRolRepository):
        self.repo = repo

    @staticmethod
    def _es_admin(rol: Rol) -> bool:
        return rol.descripcion.strip().lower() in ROLES_ADMIN

    def _validar_permisos(self, ids_permisos: list[str]) -> None:
        if not ids_permisos:
            raise ConflictError("El rol debe tener al menos un permiso.")
        if not self.repo.permisos_existen(ids_permisos):
            raise NotFoundError("Uno o más permisos enviados no existen.")

    def listar(self, estado: str | None = None) -> list[Rol]:
        return self.repo.listar(estado)

    def listar_permisos(self) -> list[Permiso]:
        return self.repo.listar_permisos()

    def obtener(self, id_rol: str) -> Rol:
        rol = self.repo.obtener(id_rol)
        if not rol:
            raise NotFoundError(f"No existe el rol {id_rol}.")
        return rol

    def crear(self, datos: dict) -> Rol:
        if self.repo.existe_descripcion(datos["descripcion"]):
            raise ConflictError(f"Ya existe un rol llamado {datos['descripcion']}.")
        self._validar_permisos(datos["permisos"])
        return self.repo.crear(
            {"descripcion_rol": datos["descripcion"], "estado": datos["estado"]},
            datos["permisos"],
        )

    def actualizar(self, id_rol: str, datos: dict) -> Rol:
        rol = self.obtener(id_rol)  # lanza 404 si no existe
        cambios = {}
        if "descripcion" in datos:
            if self.repo.existe_descripcion(datos["descripcion"], excluir_id=id_rol):
                raise ConflictError(f"Ya existe otro rol llamado {datos['descripcion']}.")
            if self._es_admin(rol) and datos["descripcion"].strip().lower() not in ROLES_ADMIN:
                raise ConflictError("No se puede cambiar el nombre del rol de administrador.")
            cambios["descripcion_rol"] = datos["descripcion"]
        if "estado" in datos:
            if self._es_admin(rol) and datos["estado"] != "Activo":
                raise ConflictError("El rol de administrador no se puede inactivar.")
            cambios["estado"] = datos["estado"]
        permisos = datos.get("permisos")
        if permisos is not None:
            self._validar_permisos(permisos)
        return self.repo.actualizar(id_rol, cambios, permisos)

    def cambiar_estado(self, id_rol: str, estado: str) -> Rol:
        return self.actualizar(id_rol, {"estado": estado})

    def eliminar(self, id_rol: str) -> None:
        rol = self.obtener(id_rol)  # lanza 404 si no existe
        if self._es_admin(rol):
            raise ConflictError("Por seguridad, no se puede eliminar el rol de administrador.")
        if self.repo.tiene_empleados(id_rol):
            raise ConflictError(
                "No se puede eliminar el rol porque tiene empleados asignados. "
                "Puede marcarlo como Inactivo."
            )
        self.repo.eliminar(id_rol)
