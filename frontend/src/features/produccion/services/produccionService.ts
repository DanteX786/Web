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
  total_realizado: number;       // unidades terminadas (buenas)
  total_defectuoso: number;      // piezas reportadas como defectuosas
  total_pendiente: number;       // asignado que falta por reportar (terminadas + defectuosas)
  defectuosas_disponibles: number;   // defectuosas que todavía se pueden reprocesar
  reproceso_activo: boolean;         // tiene un reproceso abierto (etiqueta "En reproceso")
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
  total_defectuoso: number;
  terminadas: number;     // prendas de esta talla que pasaron por todos sus procesos (incluye las recuperadas)
  recuperadas: number;    // de las terminadas, las que salieron de un reproceso
  defectuosas_disponibles: number;   // defectuosas que todavía se pueden reprocesar
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
  cantidad_realizada: number;    // terminadas
  cantidad_defectuosa: number;   // también cuentan como reportadas
  cantidad_pendiente: number;    // asignada - terminadas - defectuosas
  id_reproceso: string | null;   // tarea de un reproceso (null = producción normal)
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
  id_reproceso: string | null;   // paso de un reproceso (null = producción normal)
  veces: number;           // veces que se hace a cada prenda (tope por talla = prendas × veces)
}

/** Lo que se envía al guardar los pasos (id_paso vacío = paso nuevo). */
export interface PasoGuardar {
  id_paso?: string | null;
  id_proceso: string;
  descripcion?: string | null;
  veces?: number | '';
}

/** Talla que todavía no tiene todas sus unidades asignadas en un paso. */
export interface FaltantePaso {
  id_detalle_de_remision: string;
  nombre_de_la_pieza: string;
  talla: string;
  id_paso: string;
  paso: string;
  cantidad: number;              // lo que se exige en el paso (sin las piezas perdidas en otros pasos)
  asignado: number;
  defectuosas_otros_pasos: number;
}

/** Reporte diario con piezas defectuosas. */
export interface PiezaDefectuosa {
  id_registro_diario: string;
  fecha: string;
  id_produccion: string;
  id_remision: string;
  id_detalle_de_produccion: string;
  empleado: string;
  prenda: string;
  talla: string;
  paso: string | null;
  pieza: string;
  cantidad_defectuosa: number;
  motivo_defecto: string | null;
}

/** Reproceso de piezas defectuosas dentro de la misma producción. */
export type SituacionReproceso = "Por asignar" | "En curso" | "Terminado" | "Cancelado";

export interface Reproceso {
  id_reproceso: string;
  id_produccion: string;
  numero: number;
  estado: "Abierto" | "Cancelado";
  situacion: SituacionReproceso;
  observacion: string | null;
  creado_por: string | null;
  creado_por_nombre: string | null;
  fecha_creacion: string;
  fecha_estado: string;
  total_piezas: number;
  tareas: number;
  pendiente: number;
  sin_asignar: number;
  tallas: { id_detalle_de_remision: string; nombre_de_la_pieza: string; talla: string; cantidad: number }[];
  pasos: PasoProduccion[];
  faltantes: FaltantePaso[];
  insumos: { id_insumo_enviado: string; nombre: string; cantidad: number; cantidad_disponible: number; unidad: string }[];
}

export interface NuevoReproceso {
  tallas: { id_detalle_de_remision: string; cantidad: number }[];
  pasos: { id_proceso: string; descripcion?: string | null; veces?: number }[];
  insumos: { nombre: string; cantidad: number; unidad: string }[];   // opcional: lo que envió el cliente
  observacion?: string | null;
}

export interface ProduccionDetalle extends Produccion {
  pasos: PasoProduccion[];
  faltantes: FaltantePaso[];
  lineas: LineaRemision[];
  asignaciones: Asignacion[];
  defectuosas: PiezaDefectuosa[];
  reprocesos: Reproceso[];
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
  presente_hoy: boolean;   // vino hoy (tiene entrada registrada)
  en_taller: boolean;      // está en el taller ahora (entrada sin salida): solo a estos se les asigna
  estado_asistencia: string;   // No presente | Presente | Permiso | Incapacidad | Vacaciones
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

  /** Ya no se usa desde la pantalla: al aprobar la remisión la producción se crea sola. */
  enviarAProducir: (id_remision: string) =>
    api.post<Produccion>("/producciones", { id_remision }).then((r) => r.data),

  /** Piezas defectuosas de una producción o de una remisión (también lo usa Remisión de entrega). */
  piezasDefectuosas: (filtros: { id_produccion?: string; id_remision?: string }) =>
    api.get<PiezaDefectuosa[]>("/piezas-defectuosas", { params: filtros }).then((r) => r.data),

  /** Pasos que lleva la prenda (se arman viendo la ficha técnica, antes de asignar tareas). */
  guardarPasos: (id: string, pasos: PasoGuardar[]) =>
    api.put<PasoProduccion[]>(`/producciones/${id}/pasos`, { pasos }).then((r) => r.data),

  iniciar: (id: string) =>
    api.patch<Produccion>(`/producciones/${id}/iniciar`).then((r) => r.data),

  finalizar: (id: string) =>
    api.patch<Produccion>(`/producciones/${id}/finalizar`).then((r) => r.data),

  /** Reprocesar piezas defectuosas (uno a la vez). */
  crearReproceso: (idProduccion: string, datos: NuevoReproceso) =>
    api.post<Reproceso[]>(`/producciones/${idProduccion}/reprocesos`, datos).then((r) => r.data),

  /** Cancelar un reproceso abierto por error (solo si no tiene tareas). */
  cancelarReproceso: (idReproceso: string) =>
    api.patch<Reproceso[]>(`/producciones/reprocesos/${idReproceso}/cancelar`).then((r) => r.data),

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
