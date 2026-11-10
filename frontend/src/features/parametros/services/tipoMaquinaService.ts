import { api } from "../../../shared/utils/api";

export type EstadoTipo = "Activo" | "Inactivo";

export interface TipoMaquina {
  id_tipo_de_maquina: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoTipo;
}

/** Datos que se envían al crear o editar (el id lo genera la base de datos). */
export type TipoMaquinaDatos = Partial<Omit<TipoMaquina, "id_tipo_de_maquina">>;

export const tipoMaquinaService = {
  listar: (estado?: EstadoTipo) =>
    api.get<TipoMaquina[]>("/tipos-maquina", { params: { estado } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<TipoMaquina>(`/tipos-maquina/${id}`).then((r) => r.data),

  crear: (datos: TipoMaquinaDatos) =>
    api.post<TipoMaquina>("/tipos-maquina", datos).then((r) => r.data),

  actualizar: (id: string, datos: TipoMaquinaDatos) =>
    api.put<TipoMaquina>(`/tipos-maquina/${id}`, datos).then((r) => r.data),

  cambiarEstado: (id: string, estado: EstadoTipo) =>
    api.patch<TipoMaquina>(`/tipos-maquina/${id}/estado`, { estado }).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/tipos-maquina/${id}`).then(() => undefined),
};

