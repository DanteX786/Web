import { api } from "../../../shared/utils/api";

export type EstadoAsistencia = "Presente" | "No presente";

export interface Asistencia {
  id_asistencia: string;
  fecha: string;                 // "YYYY-MM-DD"
  id_empleado: string;
  empleado: string;
  identificacion: string;
  rol: string | null;
  estado: EstadoAsistencia;
  observacion: string | null;
  fecha_registro: string;        // ISO
  registrado_por: string | null;
  registrado_por_nombre: string | null;
}

/** Solo el administrador. Al pedir un día, el backend crea la lista con todos en "No presente". */
export const asistenciaService = {
  delDia: (fecha?: string) =>
    api.get<Asistencia[]>("/asistencia", { params: { fecha: fecha || undefined } }).then((r) => r.data),

  marcar: (id: string, estado: EstadoAsistencia, observacion?: string | null) =>
    api.patch<Asistencia>(`/asistencia/${id}`, { estado, observacion: observacion ?? null }).then((r) => r.data),

  marcarTodos: (fecha: string | undefined, estado: EstadoAsistencia = "Presente") =>
    api.post<Asistencia[]>("/asistencia/marcar-todos", { fecha: fecha || null, estado }).then((r) => r.data),
};
