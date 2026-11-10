from dataclasses import dataclass


@dataclass
class TipoPieza:
    """Tipo de pieza de las prendas (tabla tipo_de_pieza).

    Se usan los nombres que espera el frontend: "id" y "desc".
    """
    id: str
    nombre: str
    desc: str | None
    estado: str
    