import { api } from "../../../shared/utils/api";

export interface DetalleCompra {
  id_insumo: string;
  nombre_insumo: string | null;
  cantidad: number;
  valor_unitario: number;
  subtotal: number;
}

export interface Compra {
  id: string;
  fecha: string; // formato YYYY-MM-DD
  id_proveedor: string | null;
  nombre_proveedor: string | null;
  descripcion: string | null;
  total: number; // lo calcula el backend
  detalles: DetalleCompra[];
}

export interface DetalleCompraDatos {
  id_insumo: string;
  cantidad: number;
  valor_unitario: number;
}

/** Datos para crear (el id y el total los genera el backend). */
export interface CompraCrearDatos {
  fecha?: string;
  id_proveedor: string;
  descripcion?: string | null;
  detalles: DetalleCompraDatos[];
}

/** Solo la cabecera; los insumos se editan con los métodos de detalle. */
export type CompraActualizarDatos = Partial<Omit<CompraCrearDatos, "detalles">>;

export const compraService = {
  listar: (idProveedor?: string) =>
    api.get<Compra[]>("/compras", { params: { id_proveedor: idProveedor } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<Compra>(`/compras/${id}`).then((r) => r.data),

  crear: (datos: CompraCrearDatos) =>
    api.post<Compra>("/compras", datos).then((r) => r.data),

  actualizar: (id: string, datos: CompraActualizarDatos) =>
    api.put<Compra>(`/compras/${id}`, datos).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/compras/${id}`).then(() => undefined),

  // ---- Insumos dentro de una compra (devuelven la compra actualizada) ----
  agregarDetalle: (idCompra: string, datos: DetalleCompraDatos) =>
    api.post<Compra>(`/compras/${idCompra}/detalles`, datos).then((r) => r.data),

  actualizarDetalle: (idCompra: string, idInsumo: string, datos: Partial<DetalleCompraDatos>) =>
    api.put<Compra>(`/compras/${idCompra}/detalles/${idInsumo}`, datos).then((r) => r.data),

  eliminarDetalle: (idCompra: string, idInsumo: string) =>
    api.delete<Compra>(`/compras/${idCompra}/detalles/${idInsumo}`).then((r) => r.data),
};
