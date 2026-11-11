from dataclasses import dataclass


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
