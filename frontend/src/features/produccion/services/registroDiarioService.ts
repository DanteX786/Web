import { api } from "../../../shared/utils/api";

export interface RegistroDiario {
  id_registro_diario: string;
  fecha: string;          // ISO con hora (UTC); mostrar con toLocaleString
  id_empleado: string;
  empleado: string;
  pieza: string;
  maquina: string;
  prenda: string;
  talla: string;
  cantidad: number;               // cantidad terminada (buenas)
  id_produccion: string;
  id_remision: string;
  proceso: string | null;   // las tareas antiguas no tienen proceso
  cantidad_defectuosa: number;
  motivo_defecto: string | null;
  paso: string | null;
}

/** Lo que se reporta: terminadas y/o defectuosas (con motivo opcional). */
export interface ReporteCantidades {
  cantidad: number;
  cantidad_defectuosa?: number;
  motivo_defecto?: string | null;
}

export interface FiltrosRegistro {
  id_empleado?: string;
  id_produccion?: string;
  desde?: string;   // "YYYY-MM-DD"
  hasta?: string;
}

// Quién reporta / corrige / elimina sale del token de la sesión (el empleado dueño o el administrador).
export const registroDiarioService = {
  listar: (filtros?: FiltrosRegistro) =>
    api.get<RegistroDiario[]>("/registros-diarios", { params: filtros }).then((r) => r.data),

  misRegistros: () =>
    api.get<RegistroDiario[]>("/registros-diarios/mios").then((r) => r.data),

  registrar: (id_detalle_de_produccion: string, datos: ReporteCantidades) =>
    api.post<RegistroDiario>("/registros-diarios", { id_detalle_de_produccion, ...datos }).then((r) => r.data),

  /** Corrige las cantidades de un reporte (el dueño o el administrador). */
  actualizar: (id: string, datos: ReporteCantidades) =>
    api.patch<RegistroDiario>(`/registros-diarios/${id}`, datos).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/registros-diarios/${id}`).then(() => undefined),
};
