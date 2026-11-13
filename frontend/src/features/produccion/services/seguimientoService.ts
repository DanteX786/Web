import { api } from "../../../shared/utils/api";

export type EstadoRemision =
  | "Pendiente" | "Aprobada" | "Rechazada" | "En producción" | "Terminada" | "Entregada";

export interface Seguimiento {
  id_seguimiento: string;
  id_remision: string;
  estado_anterior: EstadoRemision | null;   // null = la remisión se acaba de crear
  estado_nuevo: EstadoRemision;
  responsable: string;
  tipo_responsable: "Empleado" | "Cliente";
  fecha_hora: string;                         // ISO (UTC); mostrar con toLocaleString
  cliente?: string | null;                    // cliente dueño de la remisión
}

export interface FiltrosSeguimiento {
  estado_nuevo?: EstadoRemision;
  desde?: string;   // "YYYY-MM-DD"
  hasta?: string;
}

/** El cliente solo recibe el historial de SUS remisiones (lo filtra el backend). */
export const seguimientoService = {
  historialRemision: (idRemision: string) =>
    api.get<Seguimiento[]>(`/seguimiento/remision/${idRemision}`).then((r) => r.data),

  listar: (filtros?: FiltrosSeguimiento) =>
    api.get<Seguimiento[]>("/seguimiento", { params: filtros }).then((r) => r.data),
};
