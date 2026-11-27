from dataclasses import dataclass
from datetime import datetime


@dataclass
class UsuarioMaestro:
    """Fila de la tabla maestra tb_usuarios (empleados y clientes juntos, script 21).

    Los datos personales se copian solos desde empleados / tb_clientes (triggers).
    """
    id_usuario: str
    tipo_usuario: str              # Empleado | Cliente
    id_origen: str                 # id_empleados o nit
    tipo_documento: str | None
    documento: str
    nombre: str
    correo: str
    telefono: str | None
    direccion: str | None
    id_rol: str
    rol: str
    estado: str                    # Activo | Inactivo
    estado_cuenta: str             # Sin acceso | Invitado | Activa
    origen: str                    # Autoregistro | Creado por el taller
    creado_por: str | None
    creado_por_nombre: str | None
    fecha_creacion: datetime
    fecha_invitacion: datetime | None
    fecha_activacion: datetime | None
    acepto_tratamiento_datos: bool
    fecha_aceptacion_datos: datetime | None
