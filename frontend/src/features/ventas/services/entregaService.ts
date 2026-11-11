import { api } from "../../../shared/utils/api";

export type EstadoEntrega = "Pendiente de pago" | "Pagada";

export interface Entrega {
  id_entrega: string;
  id_remision: string;
  nit_cliente: string;
  cliente: string;
  cantidad_entregada: number; // siempre el total de prendas de la remisión
  precio_total: number;
  fecha_finalizacion: string; // YYYY-MM-DD
  remision_firmada_url: string | null;
  comprobante_pago_url: string | null;
  estado: EstadoEntrega;
}

export interface RemisionPorEntregar {
  id_remision: string;
  nit_cliente: string;
  cliente: string;
  ficha_tecnica_nombre: string;
  total_prendas: number;
  costo_prenda: number;
  costo_total: number;
  fecha_entrega: string | null;
}

export interface EntregaCrearDatos {
  id_remision: string;
  fecha_finalizacion?: string; // por defecto hoy
  precio_total?: number; // por defecto total_prendas x costo_prenda
}

export type EntregaActualizarDatos = Partial<Omit<EntregaCrearDatos, "id_remision">>;

const subir = (url: string, archivo: File) => {
  const form = new FormData();
  form.append("archivo", archivo);
  return api.post<Entrega>(url, form).then((r) => r.data);
};

export const entregaService = {
  listar: (filtros?: { estado?: EstadoEntrega; id_remision?: string }) =>
    api.get<Entrega[]>("/entregas", { params: filtros }).then((r) => r.data),

  /** Remisiones Terminadas que todavía no tienen remisión de entrega. */
  remisionesPorEntregar: () =>
    api.get<RemisionPorEntregar[]>("/entregas/remisiones-por-entregar").then((r) => r.data),

  obtener: (id: string) =>
    api.get<Entrega>(`/entregas/${id}`).then((r) => r.data),

  /** Registra la entrega COMPLETA. La remisión pasa a "Entregada". */
  crear: (datos: EntregaCrearDatos) =>
    api.post<Entrega>("/entregas", datos).then((r) => r.data),

  actualizar: (id: string, datos: EntregaActualizarDatos) =>
    api.put<Entrega>(`/entregas/${id}`, datos).then((r) => r.data),

  subirRemisionFirmada: (id: string, archivo: File) => subir(`/entregas/${id}/remision-firmada`, archivo),

  subirComprobante: (id: string, archivo: File) => subir(`/entregas/${id}/comprobante`, archivo),

  /** Requiere que ya se haya subido el comprobante. */
  marcarPagada: (id: string) =>
    api.patch<Entrega>(`/entregas/${id}/pagar`).then((r) => r.data),
};
