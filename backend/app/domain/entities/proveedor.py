from dataclasses import dataclass


@dataclass
class Proveedor:
    """Proveedor de insumos del taller (tabla proveedores)."""
    id: str
    nit: str
    nombre: str
    contacto: str | None
    telefono: str | None
    correo: str | None
    direccion: str | None
    estado: str
    