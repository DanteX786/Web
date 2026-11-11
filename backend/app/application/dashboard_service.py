from datetime import date

from app.domain.entities.dashboard import Periodo, TipoPeriodo
from app.domain.interfaces.dashboard_repository import IDashboardRepository


def _num(valor) -> float:
    return float(valor or 0)


def _variacion(actual: float, anterior: float) -> float | None:
    """% de cambio frente al periodo anterior. None si antes era 0 (no se puede comparar)."""
    if not anterior:
        return None
    return round((actual - anterior) / anterior * 100, 1)


def _por_tramos(periodo: Periodo, filas: list[dict], campo: str) -> list[float]:
    """Reparte valores diarios en las barras de la gráfica (semanas o meses)."""
    valores = [0.0] * len(periodo.tramos)
    for fila in filas:
        for i, tramo in enumerate(periodo.tramos):
            if tramo.desde <= fila["fecha"] <= tramo.hasta:
                valores[i] += _num(fila[campo])
                break
    return valores


def _suma(filas: list[dict], campo: str) -> float:
    return sum(_num(f[campo]) for f in filas)


def _info_periodo(p: Periodo) -> dict:
    return {
        "tipo": p.tipo, "etiqueta": p.etiqueta, "desde": p.desde, "hasta": p.hasta,
        "anterior_desde": p.anterior_desde, "anterior_hasta": p.anterior_hasta,
    }


class DashboardService:
    """Datos del dashboard para la dueña del taller.

    Cada fila se pide por separado, así cada una tiene su propio periodo
    (mensual, trimestral, semestral o anual) sin recargar las demás.

    El periodo es el de calendario que contiene a hoy (este mes, este trimestre...)
    y se compara con el periodo anterior cortado en el mismo punto: si hoy es 10 de
    noviembre, se compara del 1 al 10 de noviembre contra el 1 al 10 de octubre.
    """

    def __init__(self, repo: IDashboardRepository):
        self.repo = repo

    # ------------------------------------------------------------------ fila 1
    def atencion(self, hoy: date | None = None) -> dict:
        """Lo que hay que atender hoy. No depende del periodo."""
        hoy = hoy or date.today()
        pendientes = self.repo.remisiones_pendientes()
        en_curso = self.repo.producciones_en_curso()
        abiertas = self.repo.remisiones_abiertas()
        por_cobrar = self.repo.entregas_por_cobrar()
        stock_bajo = self.repo.insumos_stock_bajo()

        for prod in en_curso:
            prod["porcentaje_avance"] = _num(prod["porcentaje_avance"])
            prod["dias_para_entrega"] = (prod["fecha_entrega"] - hoy).days if prod["fecha_entrega"] else None

        listas = [r for r in abiertas if r["estado"] == "Terminada"]
        atrasadas = [r for r in abiertas if r["fecha_entrega"] and r["fecha_entrega"] < hoy]
        for r in atrasadas:
            r["dias_atraso"] = (hoy - r["fecha_entrega"]).days

        mas_antigua = pendientes[0] if pendientes else None
        return {
            "remisiones_por_aprobar": {
                "cantidad": len(pendientes),
                "mas_antigua": mas_antigua["id_remision"] if mas_antigua else None,
                "dias_esperando": (hoy - mas_antigua["fecha_recibo"]).days if mas_antigua else None,
            },
            "producciones_en_curso": en_curso,
            "listas_para_entregar": len(listas),
            "remisiones_atrasadas": atrasadas,
            "por_cobrar": {
                "total": _suma(por_cobrar, "precio_total"),
                "entregas": len(por_cobrar),
                "mas_antigua": por_cobrar[0]["id_entrega"] if por_cobrar else None,
                "dias_sin_pagar": (hoy - por_cobrar[0]["fecha_finalizacion"]).days if por_cobrar else None,
            },
            "stock_bajo": stock_bajo,
        }

    # ------------------------------------------------------------------ fila 2
    def dinero(self, tipo: TipoPeriodo, hoy: date | None = None) -> dict:
        p = Periodo.calcular(tipo, hoy)
        entregas = self.repo.entregas_por_dia(p.desde, p.hasta)
        compras = self.repo.compras_por_dia(p.desde, p.hasta)
        entregas_ant = self.repo.entregas_por_dia(p.anterior_desde, p.anterior_hasta)
        compras_ant = self.repo.compras_por_dia(p.anterior_desde, p.anterior_hasta)

        facturado, facturado_ant = _suma(entregas, "facturado"), _suma(entregas_ant, "facturado")
        cobrado, cobrado_ant = _suma(entregas, "cobrado"), _suma(entregas_ant, "cobrado")
        gastos, gastos_ant = _suma(compras, "total"), _suma(compras_ant, "total")
        ganancia, ganancia_ant = facturado - gastos, facturado_ant - gastos_ant

        return {
            "periodo": _info_periodo(p),
            "facturado": {"valor": facturado, "variacion": _variacion(facturado, facturado_ant)},
            "cobrado": {"valor": cobrado, "variacion": _variacion(cobrado, cobrado_ant),
                        "pendiente": facturado - cobrado},
            "gastos_compras": {"valor": gastos, "variacion": _variacion(gastos, gastos_ant),
                               "compras": int(_suma(compras, "compras"))},
            "ganancia": {"valor": ganancia, "variacion": _variacion(ganancia, ganancia_ant)},
            "grafica": {
                "etiquetas": [t.etiqueta for t in p.tramos],
                "facturado": _por_tramos(p, entregas, "facturado"),
                "compras": _por_tramos(p, compras, "total"),
            },
        }

    # ------------------------------------------------------------------ fila 3
    def produccion(self, tipo: TipoPeriodo, hoy: date | None = None) -> dict:
        p = Periodo.calcular(tipo, hoy)
        unidades = self.repo.unidades_por_dia(p.desde, p.hasta)
        unidades_ant = self.repo.unidades_por_dia(p.anterior_desde, p.anterior_hasta)
        entregas = self.repo.entregas_por_dia(p.desde, p.hasta)
        entregas_ant = self.repo.entregas_por_dia(p.anterior_desde, p.anterior_hasta)
        cumpl = self.repo.cumplimiento_entregas(p.desde, p.hasta)

        hechas, hechas_ant = _suma(unidades, "unidades"), _suma(unidades_ant, "unidades")
        prendas, prendas_ant = _suma(entregas, "prendas"), _suma(entregas_ant, "prendas")
        a_tiempo, tarde = int(cumpl["a_tiempo"] or 0), int(cumpl["tarde"] or 0)
        con_fecha = a_tiempo + tarde

        return {
            "periodo": _info_periodo(p),
            "unidades_confeccionadas": {"valor": hechas, "variacion": _variacion(hechas, hechas_ant)},
            "prendas_entregadas": {"valor": prendas, "variacion": _variacion(prendas, prendas_ant),
                                   "remisiones": int(_suma(entregas, "entregas"))},
            "entregas_a_tiempo": {
                "porcentaje": round(a_tiempo / con_fecha * 100, 1) if con_fecha else None,
                "a_tiempo": a_tiempo, "tarde": tarde,
            },
            "dias_promedio": round(_num(cumpl["dias_promedio"]), 1) if cumpl["dias_promedio"] is not None else None,
            "grafica_unidades": {
                "etiquetas": [t.etiqueta for t in p.tramos],
                "valores": _por_tramos(p, unidades, "unidades"),
            },
            "por_empleado": [{"empleado": f["empleado"], "unidades": _num(f["unidades"])}
                             for f in self.repo.unidades_por_empleado(p.desde, p.hasta, 6)],
        }

    # ------------------------------------------------------------------ fila 4
    def clientes(self, tipo: TipoPeriodo, hoy: date | None = None) -> dict:
        p = Periodo.calcular(tipo, hoy)
        top = self.repo.top_clientes(p.desde, p.hasta, 5)
        total = sum(_num(c["facturado"]) for c in top) or 0
        estados = self.repo.remisiones_por_estado(p.desde, p.hasta)
        return {
            "periodo": _info_periodo(p),
            "top_clientes": [
                {"nit": c["nit"], "cliente": c["cliente"], "facturado": _num(c["facturado"]),
                 "prendas": int(c["prendas"] or 0), "entregas": int(c["entregas"]),
                 "participacion": round(_num(c["facturado"]) / total * 100, 1) if total else 0}
                for c in top
            ],
            "remisiones_recibidas": sum(int(e["cantidad"]) for e in estados),
            "remisiones_por_estado": [
                {"estado": e["estado"], "cantidad": int(e["cantidad"]), "prendas": int(e["prendas"])}
                for e in estados
            ],
        }

    # ------------------------------------------------------------------ fila 5
    def movimientos(self, limite: int = 8) -> list[dict]:
        filas = self.repo.ultimos_movimientos(limite)
        for f in filas:
            f["valor"] = _num(f["valor"]) if f["valor"] is not None else None
        return filas
