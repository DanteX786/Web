import { api } from "../../../shared/utils/api";

export type EstadoRemision =
  | "Pendiente" | "Aprobada" | "Rechazada" | "En producción" | "Terminada" | "Entregada";

export interface Seguimiento {
  id_seguimiento: string;
  id_remision: string;
  estado_anterior: EstadoRemision | null;
  estado_nuevo: EstadoRemision;
  responsable: string;
  tipo_responsable: "Empleado" | "Cliente";
  fecha_hora: string;
}

export const seguimientoService = {
  historialRemision: (idRemision: string) =>
    api.get<Seguimiento[]>(`/seguimiento/remision/${idRemision}`).then((r) => r.data),

  listar: (filtros?: { estado_nuevo?: EstadoRemision; desde?: string; hasta?: string }) =>
    api.get<Seguimiento[]>("/seguimiento", { params: filtros }).then((r) => r.data),
};
