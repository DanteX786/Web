from dataclasses import dataclass


@dataclass
class Empleado:
    """Empleado del taller (tabla empleados).

    La contraseña NUNCA viaja en esta entidad: solo se escribe (encriptada)
    al crear o editar, y no se devuelve en las respuestas.
    """
    id: str
    nombre: str
    identificacion: str
    correo: str | None
    telefono: str | None
    direccion: str | None
    id_rol: str | None
    rol: str | None  # descripción del rol (viene de un JOIN con roles)
    estado: str
