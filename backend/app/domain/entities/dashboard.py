from calendar import monthrange
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Literal

TipoPeriodo = Literal["mes", "trimestre", "semestre", "anio"]

MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
MESES_LARGOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto",
                "Septiembre", "Octubre", "Noviembre", "Diciembre"]
_DURACION_MESES = {"mes": 1, "trimestre": 3, "semestre": 6, "anio": 12}


def _sumar_meses(d: date, meses: int) -> date:
    """Primer día del mes que está `meses` después (o antes, si es negativo) de d."""
    total = d.year * 12 + (d.month - 1) + meses
    return date(total // 12, total % 12 + 1, 1)


def _mismo_dia(inicio: date, dias: int, tope: date) -> date:
    """inicio + dias, sin pasarse de tope (ej. 31 de marzo -> 28 de febrero)."""
    return min(inicio + timedelta(days=dias), tope)


@dataclass(frozen=True)
class Tramo:
    """Una barra de la gráfica: etiqueta + rango de fechas (incluye ambos extremos)."""
    etiqueta: str
    desde: date
    hasta: date


@dataclass(frozen=True)
class Periodo:
    """Periodo de calendario que contiene a `hoy` (este mes, este trimestre...).

    actual    : desde el primer día del periodo hasta hoy.
    anterior  : el periodo anterior, cortado en el mismo punto (mismo número de días),
                para comparar parejo. Ej.: del 1 al 10 de noviembre vs. del 1 al 10 de octubre.
    tramos    : las barras de la gráfica (semanas si es un mes; meses si es más largo).
    """
    tipo: TipoPeriodo
    etiqueta: str
    desde: date
    hasta: date
    fin_periodo: date
    anterior_desde: date
    anterior_hasta: date
    tramos: tuple[Tramo, ...]

    @staticmethod
    def calcular(tipo: TipoPeriodo, hoy: date | None = None) -> "Periodo":
        hoy = hoy or date.today()
        n = _DURACION_MESES[tipo]
        # Mes de inicio del periodo: mes 1, 4, 7, 10 (trimestre); 1, 7 (semestre); 1 (año)
        mes_inicio = ((hoy.month - 1) // n) * n + 1
        desde = date(hoy.year, mes_inicio, 1)
        fin_periodo = _sumar_meses(desde, n) - timedelta(days=1)
        anterior_desde = _sumar_meses(desde, -n)
        anterior_fin = desde - timedelta(days=1)
        anterior_hasta = _mismo_dia(anterior_desde, (hoy - desde).days, anterior_fin)

        if tipo == "mes":
            etiqueta = f"{MESES_LARGOS[desde.month - 1]} {desde.year}"
            tramos, dia, semana = [], desde, 1
            while dia <= fin_periodo:
                fin = min(dia + timedelta(days=6), fin_periodo)
                tramos.append(Tramo(f"Sem {semana}", dia, fin))
                dia, semana = fin + timedelta(days=1), semana + 1
        else:
            if tipo == "trimestre":
                etiqueta = f"Trimestre {(mes_inicio - 1) // 3 + 1} de {desde.year}"
            elif tipo == "semestre":
                etiqueta = f"Semestre {(mes_inicio - 1) // 6 + 1} de {desde.year}"
            else:
                etiqueta = f"Año {desde.year}"
            tramos = []
            for i in range(n):
                ini = _sumar_meses(desde, i)
                tramos.append(Tramo(MESES[ini.month - 1], ini,
                                    date(ini.year, ini.month, monthrange(ini.year, ini.month)[1])))

        return Periodo(tipo, etiqueta, desde, hoy, fin_periodo, anterior_desde, anterior_hasta,
                       tuple(tramos))
