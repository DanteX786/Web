import { api } from "../../../shared/utils/api";
import type { InsumoEnviado } from "../../ventas/services/remisionService";

export type { InsumoEnviado };

export interface InsumoEnviadoCrearDatos {
  id_remision: string;
  nombre: string;
  cantidad: number;
  unidad?: string;
}

/** La cantidad no puede quedar por debajo de lo ya usado en producción. */
export type InsumoEnviadoActualizarDatos = Partial<Omit<InsumoEnviadoCrearDatos, "id_remision">>;

export const insumoEnviadoService = {
  listar: (idRemision?: string) =>
    api.get<InsumoEnviado[]>("/insumos-enviados", { params: { id_remision: idRemision } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<InsumoEnviado>(`/insumos-enviados/${id}`).then((r) => r.data),

  crear: (datos: InsumoEnviadoCrearDatos) =>
    api.post<InsumoEnviado>("/insumos-enviados", datos).then((r) => r.data),

  actualizar: (id: string, datos: InsumoEnviadoActualizarDatos) =>
    api.put<InsumoEnviado>(`/insumos-enviados/${id}`, datos).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/insumos-enviados/${id}`).then(() => undefined),
};
