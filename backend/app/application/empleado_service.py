import re

import bcrypt

from app.application.validaciones import (
    generar_contrasena_temporal, normalizar_correo, problema_correo, problema_direccion,
    problema_identificacion, problema_nombre_persona, problema_telefono,
)
from app.domain.entities.empleado import Empleado
from app.domain.exceptions.errors import ConflictError, ForbiddenError, NotFoundError, ValidacionError
from app.domain.interfaces.empleado_repository import IEmpleadoRepository
from app.domain.interfaces.seguridad import IEmailService, IVerificadorCorreo


def encriptar(contrasena: str) -> str:
    """Convierte la contraseña en un hash bcrypt. Nunca se guarda la contraseña real."""
    return bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


class EmpleadoService:
    """Gestión de empleados.

    Reglas de negocio:
    - La identificación y el correo no se pueden repetir.
    - El rol asignado debe existir y no puede ser "Cliente".
    - El administrador NO escribe la contraseña: el sistema genera una contraseña temporal,
      se la envía al correo del empleado y él debe crear la suya al entrar la primera vez.
      Primero se envía el correo: si no se puede enviar, el empleado no se crea.
    - "Reenviar acceso" genera otra contraseña temporal (cierra sus sesiones abiertas).
    - Los empleados NUNCA se eliminan (el histórico laboral se conserva por ley):
      solo se cambian a Inactivo y se pueden volver a activar.
    - Nadie se puede inactivar a sí mismo.
    """

    def __init__(self, repo: IEmpleadoRepository, correo: IEmailService, verificador: IVerificadorCorreo):
        self.repo = repo
        self.correo = correo
        self.verificador = verificador

    # ------------------------------------------------------------------ validaciones
    @staticmethod
    def _normalizar(datos: dict) -> dict:
        datos = dict(datos)
        if datos.get("nombre") is not None:
            datos["nombre"] = " ".join(datos["nombre"].split())
        if datos.get("correo") is not None:
            datos["correo"] = normalizar_correo(datos["correo"])
        if datos.get("telefono") is not None:
            datos["telefono"] = re.sub(r"[\s\-()+]", "", datos["telefono"])
        if datos.get("identificacion") is not None:
            datos["identificacion"] = re.sub(r"[\s.]", "", datos["identificacion"])
        if "direccion" in datos:
            datos["direccion"] = (datos["direccion"] or "").strip() or None
        return datos

    def _validar(self, datos: dict, excluir_id: str | None = None, correo_actual: str | None = None) -> None:
        reglas = {
            "nombre": problema_nombre_persona,
            "identificacion": problema_identificacion,
            "correo": problema_correo,
            "telefono": lambda v: problema_telefono("Personal", v),
            "direccion": problema_direccion,
        }
        for campo, regla in reglas.items():
            if campo in datos:
                problema = regla(datos[campo])
                if problema:
                    raise ValidacionError(problema)
        if "identificacion" in datos and self.repo.existe_identificacion(datos["identificacion"], excluir_id):
            raise ConflictError(f"Ya existe un empleado con la cédula {datos['identificacion']}.")
        if datos.get("correo") and self.repo.existe_correo(datos["correo"], excluir_id):
            raise ConflictError(f"Ya existe un empleado con el correo {datos['correo']}.")
        if datos.get("correo") and datos["correo"] != (correo_actual or "").lower() \
                and not self.verificador.dominio_recibe_correo(datos["correo"]):
            raise ValidacionError(f"El dominio @{datos['correo'].split('@')[1]} no existe o no recibe correos.")
        if "id_rol" in datos:
            rol = self.repo.descripcion_rol(datos["id_rol"])
            if rol is None:
                raise NotFoundError(f"No existe el rol {datos['id_rol']}.")
            if rol == "Cliente":
                raise ValidacionError("A un empleado no se le puede asignar el rol Cliente.")

    # ------------------------------------------------------------------ casos de uso
    def listar(self, estado: str | None = None) -> list[Empleado]:
        return self.repo.listar(estado)

    def obtener(self, id_empleado: str) -> Empleado:
        empleado = self.repo.obtener(id_empleado)
        if not empleado:
            raise NotFoundError(f"No existe el empleado {id_empleado}.")
        return empleado

    def crear(self, datos: dict) -> Empleado:
        datos = self._normalizar(datos)
        datos.pop("contrasena", None)
        self._validar(datos)
        temporal = generar_contrasena_temporal()
        datos["contrasena_hash"] = encriptar(temporal)
        datos["debe_cambiar_contrasena"] = True
        # El correo va primero: si no se puede enviar, no se crea nada (los empleados no se borran)
        self.correo.enviar_acceso_empleado(datos["correo"], datos["nombre"], temporal, es_nuevo=True)
        return self.repo.crear(datos)

    def actualizar(self, id_empleado: str, datos: dict) -> Empleado:
        actual = self.obtener(id_empleado)  # lanza 404 si no existe
        datos = self._normalizar(datos)
        datos.pop("contrasena", None)       # la contraseña ya no la escribe el administrador
        self._validar(datos, excluir_id=id_empleado, correo_actual=actual.correo)
        return self.repo.actualizar(id_empleado, datos)

    def reenviar_acceso(self, id_empleado: str) -> Empleado:
        """Genera otra contraseña temporal y la envía al correo (si el correo falla, no cambia nada)."""
        empleado = self.obtener(id_empleado)
        if empleado.estado != "Activo":
            raise ConflictError("El empleado está Inactivo: actívelo antes de enviarle el acceso.")
        if not empleado.correo:
            raise ValidacionError("El empleado no tiene correo registrado.")
        temporal = generar_contrasena_temporal()
        self.correo.enviar_acceso_empleado(empleado.correo, empleado.nombre, temporal, es_nuevo=False)
        self.repo.asignar_contrasena_temporal(id_empleado, encriptar(temporal))
        return self.obtener(id_empleado)

    def cambiar_estado(self, id_empleado: str, estado: str, id_usuario: str | None = None) -> Empleado:
        if id_usuario and id_usuario == id_empleado and estado != "Activo":
            raise ForbiddenError("No puede inactivar su propia cuenta.")
        return self.actualizar(id_empleado, {"estado": estado})
