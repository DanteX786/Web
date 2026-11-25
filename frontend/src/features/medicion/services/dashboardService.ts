import { api } from "../../../shared/utils/api";

export type TipoPeriodo = "mes" | "trimestre" | "semestre" | "anio";

/** Periodo a consultar: tipo + año + número (mes 1-12, trimestre 1-4, semestre 1-2; 1 si es año). */
export interface FiltroPeriodo {
  tipo: TipoPeriodo;
  anio: number;
  numero: number;
}

export interface Periodo {
  tipo: TipoPeriodo;
  etiqueta: string; // ej. "Noviembre 2026", "Trimestre 4 de 2026"
  desde: string;
  hasta: string; // fin del periodo, o hoy si está en curso
  anterior_desde: string; // con qué se compara
  anterior_hasta: string;
  anio: number;
  numero: number;
  completo: boolean; // false = periodo en curso
  unidad_tramo: "Semana" | "Mes"; // qué es cada barra de las gráficas
}

export interface Indicador {
  valor: number;
  variacion: number | null; // % frente al periodo anterior; null = no hay con qué comparar
}

// ---------- Fila 1 ----------
export interface ProduccionEnCurso {
  id_produccion: string;
  id_remision: string;
  cliente: string;
  porcentaje_avance: number;
  total_asignado: number;
  total_realizado: number;
  total_prendas: number;
  fecha_entrega: string | null;
  dias_para_entrega: number | null;
}

export interface RemisionAtrasada {
  id_remision: string;
  cliente: string;
  estado: string;
  fecha_entrega: string;
  dias_atraso: number;
}

export interface InsumoBajo {
  id: string;
  nombre: string;
  disponible: number;
  stock_minimo: number | null;
  unidad: string;
}

export interface Atencion {
  remisiones_por_aprobar: { cantidad: number; mas_antigua: string | null; dias_esperando: number | null };
  producciones_en_curso: ProduccionEnCurso[];
  listas_para_entregar: number;
  remisiones_atrasadas: RemisionAtrasada[];
  por_cobrar: { total: number; entregas: number; mas_antigua: string | null; dias_sin_pagar: number | null };
  stock_bajo: InsumoBajo[];
}

// ---------- Fila 2 ----------
export interface Dinero {
  periodo: Periodo;
  facturado: Indicador;
  cobrado: Indicador & { pendiente: number };
  gastos_compras: Indicador & { compras: number };
  ganancia: Indicador;
  grafica: { etiquetas: string[]; facturado: number[]; compras: number[] };
}

// ---------- Fila 3 ----------
export interface Produccion {
  periodo: Periodo;
  unidades_confeccionadas: Indicador;
  prendas_entregadas: Indicador & { remisiones: number };
  entregas_a_tiempo: { porcentaje: number | null; a_tiempo: number; tarde: number };
  dias_promedio: number | null;
  grafica_unidades: { etiquetas: string[]; valores: number[] };
  por_empleado: { empleado: string; unidades: number }[];
}

// ---------- Fila 4 ----------
export interface Clientes {
  periodo: Periodo;
  top_clientes: { nit: string; cliente: string; facturado: number; prendas: number; entregas: number; participacion: number }[];
  remisiones_recibidas: number;
  remisiones_por_estado: { estado: string; cantidad: number; prendas: number }[];
}

// ---------- Empleados: asistencia y desempeño ----------
export interface DesempenoEmpleado {
  id_empleado: string;
  empleado: string;
  rol: string | null;
  unidades: number;          // unidades buenas del registro diario
  defectuosas: number;
  calidad: number | null;    // % buenas / (buenas + defectuosas)
  dias_presente: number;
  faltas: number;
  asistencia: number | null; // % días presente / días con registro
  horas: number;             // horas trabajadas (marcaciones de entrada y salida)
  unidades_por_dia: number | null;
  unidades_por_hora: number | null;
  proceso_principal: string | null;
}

export interface MejorPorProceso {
  proceso: string;
  empleados: number;
  unidades_proceso: number;
  mejor: { empleado: string; unidades: number; unidades_por_dia: number; calidad: number };
}

export interface Empleados {
  periodo: Periodo;
  hoy: { activos: number; presentes: number; en_taller: number; con_tarea: number; con_novedad: number };
  asistencia: { porcentaje: number | null; variacion: number | null; presentes: number; faltas: number; novedades: number };
  horas_trabajadas: Indicador;
  calidad: { porcentaje: number | null; buenas: number; defectuosas: number };
  grafica_asistencia: { etiquetas: string[]; valores: number[] };
  desempeno: DesempenoEmpleado[];
  mejor_por_proceso: MejorPorProceso[];
}

// ---------- Fila 5 ----------
export interface Movimiento {
  tipo: "remision" | "compra" | "entrega";
  referencia: string;
  fecha: string;
  estado: string;
  detalle: string; // cliente o proveedor
  responsable: string | null;
  valor: number | null; // prendas (remisión) o pesos (compra / entrega)
}

const parametros = (f: FiltroPeriodo) => ({ periodo: f.tipo, anio: f.anio, numero: f.numero });

export const dashboardService = {
  atencion: () => api.get<Atencion>("/dashboard/atencion").then((r) => r.data),
  dinero: (f: FiltroPeriodo) => api.get<Dinero>("/dashboard/dinero", { params: parametros(f) }).then((r) => r.data),
  produccion: (f: FiltroPeriodo) =>
    api.get<Produccion>("/dashboard/produccion", { params: parametros(f) }).then((r) => r.data),
  empleados: (f: FiltroPeriodo) =>
    api.get<Empleados>("/dashboard/empleados", { params: parametros(f) }).then((r) => r.data),
  clientes: (f: FiltroPeriodo) =>
    api.get<Clientes>("/dashboard/clientes", { params: parametros(f) }).then((r) => r.data),
  /** Años que tienen datos (siempre incluye el actual), del más reciente al más antiguo. */
  anios: () => api.get<number[]>("/dashboard/anios").then((r) => r.data),
  movimientos: (limite = 8) =>
    api.get<Movimiento[]>("/dashboard/movimientos", { params: { limite } }).then((r) => r.data),
};
