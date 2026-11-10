import { api } from "../../../shared/utils/api";

export type EstadoTipo = "Activo" | "Inactivo";

export interface TipoPieza {
  id: string;
  nombre: string;
  desc: string | null;
  estado: EstadoTipo;
}

/** Datos que se envían al crear o editar (el id lo genera la base de datos). */
export type TipoPiezaDatos = Partial<Omit<TipoPieza, "id">>;

export const tipoPiezaService = {
  listar: (estado?: EstadoTipo) =>
    api.get<TipoPieza[]>("/tipos-pieza", { params: { estado } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<TipoPieza>(`/tipos-pieza/${id}`).then((r) => r.data),

  crear: (datos: TipoPiezaDatos) =>
    api.post<TipoPieza>("/tipos-pieza", datos).then((r) => r.data),

  actualizar: (id: string, datos: TipoPiezaDatos) =>
    api.put<TipoPieza>(`/tipos-pieza/${id}`, datos).then((r) => r.data),

  cambiarEstado: (id: string, estado: EstadoTipo) =>
    api.patch<TipoPieza>(`/tipos-pieza/${id}/estado`, { estado }).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/tipos-pieza/${id}`).then(() => undefined),
};
