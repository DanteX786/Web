from dataclasses import dataclass, field


@dataclass
class Permiso:
    """Permiso o módulo del sistema (tabla permisos)."""
    id: str
    descripcion: str


@dataclass
class Rol:
    """Rol del sistema con sus permisos (tablas roles y rol_x_permiso)."""
    id: str
    descripcion: str
    estado: str
    permisos: list[Permiso] = field(default_factory=list)
