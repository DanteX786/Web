from dataclasses import dataclass, field


@dataclass
class Proceso:
    """Proceso de confección (tabla maestra tb_procesos): corte, confección, bordado...

    Se usan los mismos nombres de campos que los demás parámetros: "id" y "desc".
    """
    id: str
    nombre: str
    desc: str | None
    estado: str
    maquinas: list[str] = field(default_factory=list)   # máquinas que sirven (vacío = cualquiera)
