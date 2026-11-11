import { api } from "../../../shared/utils/api";

export type TipoPeriodo = "mes" | "trimestre" | "semestre" | "anio";

export interface Periodo {
  tipo: TipoPeriodo;
  etiqueta: string; // ej. "Noviembre 2026", "Trimestre 4 de 2026"
  desde: string;
  hasta: string; // hoy
  anterior_desde: string; // con qué se compara (mismo corte del periodo anterior)
  anterior_hasta: string;
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

export const dashboardService = {
  atencion: () => api.get<Atencion>("/dashboard/atencion").then((r) => r.data),
  dinero: (periodo: TipoPeriodo) => api.get<Dinero>("/dashboard/dinero", { params: { periodo } }).then((r) => r.data),
  produccion: (periodo: TipoPeriodo) =>
    api.get<Produccion>("/dashboard/produccion", { params: { periodo } }).then((r) => r.data),
  clientes: (periodo: TipoPeriodo) =>
    api.get<Clientes>("/dashboard/clientes", { params: { periodo } }).then((r) => r.data),
  movimientos: (limite = 8) =>
    api.get<Movimiento[]>("/dashboard/movimientos", { params: { limite } }).then((r) => r.data),
};
