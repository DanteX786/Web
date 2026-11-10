import { api } from "../../../shared/utils/api";

export interface TipoInsumo {
  id: string;
  nombre: string;
}

export interface Insumo {
  id: string;
  nombre: string;
  descripcion: string | null;
  stock: number;
  tipo_id: string | null;
  tipo_nombre: string | null;
}

/** Datos para crear (el id lo genera la base de datos; stock es el stock inicial). */
export interface InsumoCrearDatos {
  nombre: string;
  descripcion?: string | null;
  stock: number;
  tipo_id: string;
}

/** Datos para editar (el stock no se edita: lo mueven las compras y la producción). */
export type InsumoActualizarDatos = Partial<Omit<InsumoCrearDatos, "stock">>;

export const insumoService = {
  listar: (tipoId?: string) =>
    api.get<Insumo[]>("/insumos", { params: { tipo_id: tipoId } }).then((r) => r.data),

  listarTipos: () =>
    api.get<TipoInsumo[]>("/insumos/tipos").then((r) => r.data),

  obtener: (id: string) =>
    api.get<Insumo>(`/insumos/${id}`).then((r) => r.data),

  crear: (datos: InsumoCrearDatos) =>
    api.post<Insumo>("/insumos", datos).then((r) => r.data),

  actualizar: (id: string, datos: InsumoActualizarDatos) =>
    api.put<Insumo>(`/insumos/${id}`, datos).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/insumos/${id}`).then(() => undefined),
};
