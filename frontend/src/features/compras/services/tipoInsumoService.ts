import { api } from "../../../shared/utils/api";

export type EstadoTipoInsumo = "Activo" | "Inactivo";

export interface TipoInsumo {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoTipoInsumo;
}

/** Datos para crear (el id lo genera la base de datos). */
export interface TipoInsumoCrearDatos {
  nombre: string;
  descripcion?: string | null;
  estado?: EstadoTipoInsumo;
}

export type TipoInsumoActualizarDatos = Partial<TipoInsumoCrearDatos>;

export const tipoInsumoService = {
  listar: () =>
    api.get<TipoInsumo[]>("/tipos-insumo").then((r) => r.data),

  obtener: (id: string) =>
    api.get<TipoInsumo>(`/tipos-insumo/${id}`).then((r) => r.data),

  crear: (datos: TipoInsumoCrearDatos) =>
    api.post<TipoInsumo>("/tipos-insumo", datos).then((r) => r.data),

  actualizar: (id: string, datos: TipoInsumoActualizarDatos) =>
    api.put<TipoInsumo>(`/tipos-insumo/${id}`, datos).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/tipos-insumo/${id}`).then(() => undefined),
};
