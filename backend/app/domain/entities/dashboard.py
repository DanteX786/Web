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


# Cuántos periodos de cada tipo tiene un año (mes 1-12, trimestre 1-4, semestre 1-2, año 1)
CANTIDAD_EN_ANIO = {"mes": 12, "trimestre": 4, "semestre": 2, "anio": 1}


@dataclass(frozen=True)
class Periodo:
    """Un periodo de calendario: un mes, trimestre, semestre o año concreto.

    Se elige con `anio` y `numero` (ej. trimestre 3 de 2025). Si no se indican,
    se usa el periodo que contiene a hoy.

    actual    : del primer día del periodo hasta su último día (o hasta hoy, si está en curso).
    anterior  : el periodo anterior del mismo tipo. Si el actual está en curso, se corta en el
                mismo punto para comparar parejo (del 1 al 10 de nov. vs. del 1 al 10 de oct.).
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
    anio: int = 0
    numero: int = 1
    completo: bool = True  # False si es el periodo en curso (va hasta hoy)

    @property
    def unidad_tramo(self) -> str:
        """Qué representa cada barra de las gráficas (para el eje X)."""
        return "Semana" if self.tipo == "mes" else "Mes"

    @staticmethod
    def calcular(tipo: TipoPeriodo, hoy: date | None = None,
                 anio: int | None = None, numero: int | None = None) -> "Periodo":
        hoy = hoy or date.today()
        n = _DURACION_MESES[tipo]
        if anio is None:
            anio = hoy.year
        if numero is None:
            # El que contiene a hoy (o el último, si se pidió un año anterior)
            numero = (hoy.month - 1) // n + 1 if anio == hoy.year else CANTIDAD_EN_ANIO[tipo]
        if not 1 <= numero <= CANTIDAD_EN_ANIO[tipo]:
            raise ValueError(f"Para '{tipo}' el número debe estar entre 1 y {CANTIDAD_EN_ANIO[tipo]}.")

        # Mes de inicio del periodo: mes 1, 4, 7, 10 (trimestre); 1, 7 (semestre); 1 (año)
        mes_inicio = (numero - 1) * n + 1
        desde = date(anio, mes_inicio, 1)
        if desde > hoy:
            raise ValueError("Ese periodo todavía no ha empezado.")
        fin_periodo = _sumar_meses(desde, n) - timedelta(days=1)
        completo = fin_periodo < hoy
        hasta = fin_periodo if completo else hoy
        anterior_desde = _sumar_meses(desde, -n)
        anterior_fin = desde - timedelta(days=1)
        anterior_hasta = anterior_fin if completo else _mismo_dia(anterior_desde, (hoy - desde).days, anterior_fin)

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

        # Si el periodo está en curso, las gráficas llegan hasta hoy (sin barras de meses futuros)
        tramos = [t for t in tramos if t.desde <= hasta]
        return Periodo(tipo, etiqueta, desde, hasta, fin_periodo, anterior_desde, anterior_hasta,
                       tuple(tramos), anio, numero, completo)
