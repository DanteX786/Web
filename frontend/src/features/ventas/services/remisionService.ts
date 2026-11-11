import { api } from "../../../shared/utils/api";

export type EstadoRemision =
  | "Pendiente" | "Aprobada" | "Rechazada" | "En producción" | "Terminada" | "Entregada";

export interface DetalleRemision {
  id_detalle_de_remision: string;
  nombre_de_la_pieza: string;
  talla: string;
  cantidad: number;
}

export interface InsumoEnviado {
  id_insumo_enviado: string;
  id_remision: string;
  nombre: string;
  cantidad: number;
  cantidad_disponible: number; // la calcula la BD: baja al asignar a producción
  cantidad_usada: number;
  unidad: string;
  cliente?: string | null;
  estado_remision?: EstadoRemision | null;
}

export interface Remision {
  id_remision: string;
  nit_cliente: string;
  cliente: string;
  ficha_tecnica_nombre: string;
  ficha_tecnica_url: string | null;
  fecha_recibo: string; // YYYY-MM-DD
  fecha_entrega: string | null;
  costo_prenda: number;
  total_prendas: number; // lo calcula la BD con el detalle
  costo_total: number; // costo_prenda x total_prendas (BD)
  estado: EstadoRemision;
  insumos_enviados: boolean;
  observaciones: string | null; // ej. motivo de rechazo
  detalles: DetalleRemision[];
  insumos: InsumoEnviado[];
}

export interface DetalleRemisionDatos {
  nombre_de_la_pieza: string;
  talla: string;
  cantidad: number;
}

export interface InsumoEnviadoDatos {
  nombre: string;
  cantidad: number;
  unidad?: string;
}

export interface RemisionCrearDatos {
  nit_cliente: string;
  ficha_tecnica_nombre: string;
  fecha_recibo?: string;
  fecha_entrega?: string | null;
  costo_prenda: number;
  observaciones?: string | null;
  detalles: DetalleRemisionDatos[];
  insumos?: InsumoEnviadoDatos[];
}

/** Solo mientras está Pendiente. Si se envían detalles / insumos, reemplazan a los actuales. */
export type RemisionActualizarDatos = Partial<Omit<RemisionCrearDatos, "nit_cliente">>;

export const remisionService = {
  listar: (filtros?: { estado?: EstadoRemision; nit_cliente?: string }) =>
    api.get<Remision[]>("/remisiones", { params: filtros }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<Remision>(`/remisiones/${id}`).then((r) => r.data),

  crear: (datos: RemisionCrearDatos) =>
    api.post<Remision>("/remisiones", datos).then((r) => r.data),

  actualizar: (id: string, datos: RemisionActualizarDatos) =>
    api.put<Remision>(`/remisiones/${id}`, datos).then((r) => r.data),

  aprobar: (id: string) =>
    api.patch<Remision>(`/remisiones/${id}/aprobar`).then((r) => r.data),

  rechazar: (id: string, motivo: string) =>
    api.patch<Remision>(`/remisiones/${id}/rechazar`, { motivo }).then((r) => r.data),

  /** Sube la foto o PDF de la ficha técnica (máx. 5 MB). */
  subirFicha: (id: string, archivo: File, usarNombreArchivo = true) => {
    const form = new FormData();
    form.append("archivo", archivo);
    form.append("usar_nombre_archivo", String(usarNombreArchivo));
    return api.post<Remision>(`/remisiones/${id}/ficha-tecnica`, form).then((r) => r.data);
  },

  eliminar: (id: string) =>
    api.delete(`/remisiones/${id}`).then(() => undefined),
};
