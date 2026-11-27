from dataclasses import dataclass
from datetime import datetime


@dataclass
class Cliente:
    """Cliente del taller (tabla tb_clientes). El NIT es la llave primaria.

    El rol (id_rol) no aparece aquí: el backend siempre asigna el rol "Cliente".
    """
    nit: str
    nombre: str
    direccion: str | None
    correo: str
    telefono: str | None
    estado: str
    tipo_documento: str = "NIT"           # NIT | CC | CE | PA | PPT
    nombre_contacto: str | None = None    # persona a contactar (obligatoria si es NIT)
    # De la tabla maestra tb_usuarios (script 21)
    estado_cuenta: str = "Activa"         # Sin acceso | Invitado | Activa
    origen: str | None = None             # Autoregistro | Creado por el taller
    fecha_invitacion: datetime | None = None
