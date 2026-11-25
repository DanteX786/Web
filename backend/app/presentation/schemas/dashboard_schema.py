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
    anio: int
    numero: int              # mes 1-12, trimestre 1-4, semestre 1-2 o 1 (año)
    completo: bool           # False = periodo en curso (llega hasta hoy)
    unidad_tramo: str        # "Semana" (si es un mes) o "Mes": qué es cada barra de las gráficas


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
# ---------- Fila 5: empleados ----------
class EmpleadosHoy(BaseModel):
    activos: int
    presentes: int
    en_taller: int
    con_tarea: int
    con_novedad: int


class AsistenciaPeriodo(BaseModel):
    porcentaje: float | None
    variacion: float | None   # puntos porcentuales frente al periodo anterior
    presentes: int
    faltas: int
    novedades: int


class CalidadPeriodo(BaseModel):
    porcentaje: float | None
    buenas: float
    defectuosas: float


class DesempenoEmpleado(BaseModel):
    id_empleado: str
    empleado: str
    rol: str | None
    unidades: float
    defectuosas: float
    calidad: float | None
    dias_presente: int
    faltas: int
    asistencia: float | None
    horas: float
    unidades_por_dia: float | None
    unidades_por_hora: float | None
    proceso_principal: str | None


class MejorEmpleado(BaseModel):
    empleado: str
    unidades: float
    unidades_por_dia: float
    calidad: float


class MejorPorProceso(BaseModel):
    proceso: str
    empleados: int
    unidades_proceso: float
    mejor: MejorEmpleado


class EmpleadosRespuesta(BaseModel):
    periodo: PeriodoRespuesta
    hoy: EmpleadosHoy
    asistencia: AsistenciaPeriodo
    horas_trabajadas: Indicador
    calidad: CalidadPeriodo
    grafica_asistencia: Grafica
    desempeno: list[DesempenoEmpleado]
    mejor_por_proceso: list[MejorPorProceso]


class Movimiento(BaseModel):
    tipo: Literal["remision", "compra", "entrega"]
    referencia: str
    fecha: datetime
    estado: str
    detalle: str              # cliente o proveedor
    responsable: str | None   # quién cambió el estado / descripción de la compra / remisión entregada
    valor: float | None       # prendas (remisión) o pesos (compra, entrega)
