import { api } from "../../../shared/utils/api";

export interface RegistroDiario {
  id_registro_diario: string;
  fecha: string;          // ISO con hora
  id_empleado: string;
  empleado: string;
  pieza: string;
  maquina: string;
  prenda: string;
  talla: string;
  cantidad: number;
  id_produccion: string;
  id_remision: string;
}

export interface FiltrosRegistro {
  id_empleado?: string;
  id_produccion?: string;
  desde?: string;   // "YYYY-MM-DD"
  hasta?: string;
}

export const registroDiarioService = {
  listar: (filtros?: FiltrosRegistro) =>
    api.get<RegistroDiario[]>("/registros-diarios", { params: filtros }).then((r) => r.data),

  misRegistros: () =>
    api.get<RegistroDiario[]>("/registros-diarios/mios").then((r) => r.data),

  registrar: (id_detalle_de_produccion: string, cantidad: number) =>
    api.post<RegistroDiario>("/registros-diarios", { id_detalle_de_produccion, cantidad }).then((r) => r.data),

  eliminar: (id: string) => api.delete(`/registros-diarios/${id}`),
};
