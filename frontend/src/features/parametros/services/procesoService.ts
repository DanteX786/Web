import { api } from "../../../shared/utils/api";

export type EstadoTipo = "Activo" | "Inactivo";

export interface Proceso {
  id: string;
  nombre: string;
  desc: string | null;
  estado: EstadoTipo;
  maquinas: string[];   // máquinas que sirven para el proceso (vacío = cualquiera)
}

/** Datos que se envían al crear o editar (el id lo genera la base de datos). */
export type ProcesoDatos = Partial<Omit<Proceso, "id">>;

export const procesoService = {
  listar: (estado?: EstadoTipo) =>
    api.get<Proceso[]>("/procesos", { params: { estado } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<Proceso>(`/procesos/${id}`).then((r) => r.data),

  crear: (datos: ProcesoDatos) =>
    api.post<Proceso>("/procesos", datos).then((r) => r.data),

  actualizar: (id: string, datos: ProcesoDatos) =>
    api.put<Proceso>(`/procesos/${id}`, datos).then((r) => r.data),

  cambiarEstado: (id: string, estado: EstadoTipo) =>
    api.patch<Proceso>(`/procesos/${id}/estado`, { estado }).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/procesos/${id}`).then(() => undefined),
};
