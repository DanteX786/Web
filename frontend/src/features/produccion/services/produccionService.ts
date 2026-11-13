import { api } from "../../../shared/utils/api";

// ---------- Tipos ----------
export type EstadoProduccion = "En proceso" | "Finalizada";

export interface Produccion {
  id_produccion: string;
  id_remision: string;
  cliente: string;
  estado: EstadoProduccion;
  fecha_inicio: string;          // "YYYY-MM-DD"
  fecha_entrega: string | null;
  total_asignado: number;
  total_realizado: number;
  porcentaje_avance: number;
}

export interface Asignacion {
  id_detalle_de_produccion: string;
  id_produccion: string;
  id_remision: string;
  estado_produccion: EstadoProduccion;
  id_empleado: string;
  empleado: string;
  id_tipo_pieza: string;
  pieza: string;
  id_tipo_maquina: string;
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

export interface ProduccionDetalle extends Produccion {
  asignaciones: Asignacion[];
}

export interface RemisionDisponible {
  id_remision: string;
  cliente: string;
  ficha_tecnica_nombre: string;
  total_prendas: number;
  fecha_entrega: string | null;
}

export interface LineaRemision {
  id_detalle_de_remision: string;
  nombre_de_la_pieza: string;
  talla: string;
  cantidad: number;
}

export interface AsignacionForm {
  id_empleado: string;
  id_tipo_pieza: string;
  id_tipo_maquina: string;
  id_detalle_de_remision: string;
  cantidad_asignada: number;
  id_insumos?: string | null;                     // insumo del taller
  id_insumos_enviados_x_cliente?: string | null;  // insumo del cliente
  cantidad_insumo?: number | null;
}

// El responsable de cada cambio (crear / finalizar) sale del token de la sesión:
// api.ts lo envía en cada petición y el backend lo usa para el seguimiento de la remisión.

// ---------- Producción ----------
export const produccionService = {
  listar: (estado?: EstadoProduccion) =>
    api.get<Produccion[]>("/producciones", { params: { estado } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<ProduccionDetalle>(`/producciones/${id}`).then((r) => r.data),

  remisionesDisponibles: () =>
    api.get<RemisionDisponible[]>("/producciones/remisiones-disponibles").then((r) => r.data),

  lineasRemision: (id: string) =>
    api.get<LineaRemision[]>(`/producciones/${id}/lineas-remision`).then((r) => r.data),

  crear: (id_remision: string, fecha_entrega?: string | null) =>
    api.post<Produccion>("/producciones", { id_remision, fecha_entrega: fecha_entrega || null })
      .then((r) => r.data),

  finalizar: (id: string) =>
    api.patch<Produccion>(`/producciones/${id}/finalizar`).then((r) => r.data),

  // ---------- Asignaciones ----------
  crearAsignacion: (idProduccion: string, datos: AsignacionForm) =>
    api.post<Asignacion>(`/producciones/${idProduccion}/asignaciones`, datos).then((r) => r.data),

  listarAsignaciones: (filtros?: { id_empleado?: string; solo_en_proceso?: boolean }) =>
    api.get<Asignacion[]>("/asignaciones", { params: filtros }).then((r) => r.data),

  misAsignaciones: () =>
    api.get<Asignacion[]>("/asignaciones/mias").then((r) => r.data),

  actualizarAsignacion: (id: string, datos: AsignacionForm) =>
    api.put<Asignacion>(`/asignaciones/${id}`, datos).then((r) => r.data),

  eliminarAsignacion: (id: string) =>
    api.delete(`/asignaciones/${id}`).then(() => undefined),
};
