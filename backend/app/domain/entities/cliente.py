from dataclasses import dataclass


@dataclass
class CategoriaCliente:
    """Categoría de cliente (tabla tb_categoria_clientes). Solo se lee para el formulario."""
    id: str
    nombre: str


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
    id_categoria: str
    nombre_categoria: str | None  # viene de un JOIN con tb_categoria_clientes
