import { api } from "../../../shared/utils/api";

// ---------- Tipos ----------
/** Por asignar (recién enviada desde la remisión) -> En producción -> Finalizada */
export type EstadoProduccion = "Por asignar" | "En producción" | "Finalizada";

export const ESTADOS_PRODUCCION: EstadoProduccion[] = ["Por asignar", "En producción", "Finalizada"];

export interface Produccion {
  id_produccion: string;
  id_remision: string;
  cliente: string;
  estado: EstadoProduccion;
  fecha_inicio: string;          // "YYYY-MM-DD"
  fecha_entrega: string | null;
  fecha_estado: string;          // ISO: último cambio de estado
  total_prendas: number;         // unidades pedidas en la remisión
  ficha_tecnica_nombre: string;
  /** Prendas completas: pasaron por todos los procesos asignados de su talla */
  prendas_terminadas: number;
  total_asignado: number;
  total_realizado: number;
  porcentaje_avance: number;
}

/** Talla de la remisión (prenda + talla + unidades) */
export interface LineaRemision {
  id_detalle_de_remision: string;
  nombre_de_la_pieza: string;
  talla: string;
  cantidad: number;
  total_asignado: number;
  total_realizado: number;
  terminadas: number;     // prendas de esta talla que pasaron por todos sus procesos
}

export interface Asignacion {
  id_detalle_de_produccion: string;
  id_produccion: string;
  id_remision: string;
  estado_produccion: EstadoProduccion;
  id_proceso: string | null;     // las tareas antiguas no tienen proceso
  proceso: string | null;
  id_paso: string | null;
  paso: string | null;           // ej. "Bordado — logo en el pecho"
  id_empleado: string;
  empleado: string;
  id_tipo_pieza: string;
  pieza: string;
  id_tipo_maquina: string;       // la máquina física
  maquina: string;
  id_detalle_de_remision: string;
  prenda: string;
  talla: string;
  id_insumos: string | null;
  id_insumos_enviados_x_cliente: string | null;
  cantidad_insumo: number | null;
  cantidad_asignada: number;
  cantidad_realizada: number;
  cantidad_pendiente: number;
  fecha_asignada: string;
}

/**
 * Paso de la producción: un proceso que lleva la prenda según la ficha técnica.
 * El mismo proceso puede repetirse con otra descripción (Bordado — logo / Bordado — nombre).
 */
export interface PasoProduccion {
  id_paso: string;
  id_proceso: string;
  proceso: string;
  descripcion: string | null;
  paso: string;            // nombre que se muestra
  maquinas: string[];      // máquinas que sirven para el proceso (vacío = cualquiera)
}

/** Lo que se envía al guardar los pasos (id_paso vacío = paso nuevo). */
export interface PasoGuardar {
  id_paso?: string | null;
  id_proceso: string;
  descripcion?: string | null;
}

/** Talla que todavía no tiene todas sus unidades asignadas en un paso. */
export interface FaltantePaso {
  id_detalle_de_remision: string;
  nombre_de_la_pieza: string;
  talla: string;
  id_paso: string;
  paso: string;
  cantidad: number;
  asignado: number;
}

export interface ProduccionDetalle extends Produccion {
  pasos: PasoProduccion[];
  faltantes: FaltantePaso[];
  lineas: LineaRemision[];
  asignaciones: Asignacion[];
}

export interface SeguimientoProduccion {
  id_seguimiento_produccion: string;
  id_produccion: string;
  id_remision: string;
  estado_anterior: EstadoProduccion | null;   // null = se acaba de crear
  estado_nuevo: EstadoProduccion;
  responsable: string;
  tipo_responsable: string;
  fecha_hora: string;
}

/** Máquina física con su disponibilidad (las ocupadas no se pueden asignar). */
export interface MaquinaDisponible {
  id_maquina: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  disponible: boolean;
  ocupada_por_tarea: string | null;
  ocupada_por_empleado: string | null;
  ocupada_en_produccion: string | null;
}

/** Empleado activo con su disponibilidad (los ocupados no reciben otra tarea hasta terminar). */
export interface EmpleadoDisponible {
  id_empleado: string;
  nombre: string;
  disponible: boolean;
  ocupado_en_tarea: string | null;
  ocupado_en_produccion: string | null;
  unidades_pendientes: number | null;
  presente_hoy: boolean;   // asistencia de hoy
}

export interface AsignacionForm {
  id_paso: string;               // el proceso sale del paso
  id_empleado: string;
  id_tipo_pieza: string;
  id_tipo_maquina: string;
  id_detalle_de_remision: string;
  cantidad_asignada: number;
  id_insumos?: string | null;                     // insumo del taller
  id_insumos_enviados_x_cliente?: string | null;  // insumo enviado por el cliente
  cantidad_insumo?: number | null;
}

// El responsable de cada cambio de estado sale del token de la sesión (lo usa el seguimiento).

// ---------- Producción ----------
export const produccionService = {
  listar: (estado?: EstadoProduccion) =>
    api.get<Produccion[]>("/producciones", { params: { estado } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<ProduccionDetalle>(`/producciones/${id}`).then((r) => r.data),

  /** Botón "Enviar a producir" de la remisión Aprobada: crea la producción "Por asignar". */
  enviarAProducir: (id_remision: string) =>
    api.post<Produccion>("/producciones", { id_remision }).then((r) => r.data),

  /** Pasos que lleva la prenda (se arman viendo la ficha técnica, antes de asignar tareas). */
  guardarPasos: (id: string, pasos: PasoGuardar[]) =>
    api.put<PasoProduccion[]>(`/producciones/${id}/pasos`, { pasos }).then((r) => r.data),

  iniciar: (id: string) =>
    api.patch<Produccion>(`/producciones/${id}/iniciar`).then((r) => r.data),

  finalizar: (id: string) =>
    api.patch<Produccion>(`/producciones/${id}/finalizar`).then((r) => r.data),

  seguimiento: (id: string) =>
    api.get<SeguimientoProduccion[]>(`/producciones/${id}/seguimiento`).then((r) => r.data),

  maquinas: () =>
    api.get<MaquinaDisponible[]>("/producciones/maquinas").then((r) => r.data),

  empleados: () =>
    api.get<EmpleadoDisponible[]>("/producciones/empleados").then((r) => r.data),

  // ---------- Tareas ----------
  crearAsignacion: (idProduccion: string, datos: AsignacionForm) =>
    api.post<Asignacion>(`/producciones/${idProduccion}/asignaciones`, datos).then((r) => r.data),

  listarAsignaciones: (filtros?: { id_empleado?: string; solo_en_produccion?: boolean }) =>
    api.get<Asignacion[]>("/asignaciones", { params: filtros }).then((r) => r.data),

  misAsignaciones: () =>
    api.get<Asignacion[]>("/asignaciones/mias").then((r) => r.data),

  actualizarAsignacion: (id: string, datos: AsignacionForm) =>
    api.put<Asignacion>(`/asignaciones/${id}`, datos).then((r) => r.data),

  eliminarAsignacion: (id: string) =>
    api.delete(`/asignaciones/${id}`).then(() => undefined),
};
