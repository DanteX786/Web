from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

TipoPeriodo = Literal["mes", "trimestre", "semestre", "anio"]


class PeriodoRespuesta(BaseModel):
    tipo: TipoPeriodo
    etiqueta: str            # ej. "Noviembre 2026", "Trimestre 4 de 2026"
    desde: date
    hasta: date              # hoy
    anterior_desde: date     # con qué se compara
    anterior_hasta: date


class Indicador(BaseModel):
    valor: float
    variacion: float | None  # % frente al periodo anterior (None = no hay con qué comparar)


# ---------- Fila 1: requiere atención ----------
class PorAprobar(BaseModel):
    cantidad: int
    mas_antigua: str | None
    dias_esperando: int | None


class ProduccionEnCurso(BaseModel):
    id_produccion: str
    id_remision: str
    cliente: str
    porcentaje_avance: float
    total_asignado: int
    total_realizado: int
    total_prendas: int
    fecha_entrega: date | None
    dias_para_entrega: int | None


class RemisionAtrasada(BaseModel):
    id_remision: str
    cliente: str
    estado: str
    fecha_entrega: date
    dias_atraso: int


class PorCobrar(BaseModel):
    total: float
    entregas: int
    mas_antigua: str | None
    dias_sin_pagar: int | None


class InsumoBajo(BaseModel):
    id: str
    nombre: str
    disponible: int
    stock_minimo: int | None
    unidad: str


class AtencionRespuesta(BaseModel):
    remisiones_por_aprobar: PorAprobar
    producciones_en_curso: list[ProduccionEnCurso]
    listas_para_entregar: int
    remisiones_atrasadas: list[RemisionAtrasada]
    por_cobrar: PorCobrar
    stock_bajo: list[InsumoBajo]


# ---------- Fila 2: dinero ----------
class Cobrado(Indicador):
    pendiente: float


class Gastos(Indicador):
    compras: int


class GraficaDinero(BaseModel):
    etiquetas: list[str]
    facturado: list[float]
    compras: list[float]


class DineroRespuesta(BaseModel):
    periodo: PeriodoRespuesta
    facturado: Indicador
    cobrado: Cobrado
    gastos_compras: Gastos
    ganancia: Indicador
    grafica: GraficaDinero


# ---------- Fila 3: producción ----------
class PrendasEntregadas(Indicador):
    remisiones: int


class EntregasATiempo(BaseModel):
    porcentaje: float | None
    a_tiempo: int
    tarde: int


class Grafica(BaseModel):
    etiquetas: list[str]
    valores: list[float]


class UnidadesEmpleado(BaseModel):
    empleado: str
    unidades: float


class ProduccionRespuesta(BaseModel):
    periodo: PeriodoRespuesta
    unidades_confeccionadas: Indicador
    prendas_entregadas: PrendasEntregadas
    entregas_a_tiempo: EntregasATiempo
    dias_promedio: float | None
    grafica_unidades: Grafica
    por_empleado: list[UnidadesEmpleado]


# ---------- Fila 4: clientes ----------
class TopCliente(BaseModel):
    nit: str
    cliente: str
    facturado: float
    prendas: int
    entregas: int
    participacion: float  # % del total facturado del top


class RemisionesEstado(BaseModel):
    estado: str
    cantidad: int
    prendas: int


class ClientesRespuesta(BaseModel):
    periodo: PeriodoRespuesta
    top_clientes: list[TopCliente]
    remisiones_recibidas: int
    remisiones_por_estado: list[RemisionesEstado]


# ---------- Fila 5: movimientos ----------
class Movimiento(BaseModel):
    tipo: Literal["remision", "compra", "entrega"]
    referencia: str
    fecha: datetime
    estado: str
    detalle: str              # cliente o proveedor
    responsable: str | None   # quién cambió el estado / descripción de la compra / remisión entregada
    valor: float | None       # prendas (remisión) o pesos (compra, entrega)
