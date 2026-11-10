import { api } from "../../../shared/utils/api";

export type EstadoProveedor = "Activo" | "Inactivo";

export interface Proveedor {
  id: string;
  nit: string;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  estado: EstadoProveedor;
}

/** Datos que se envían al crear o editar (el id lo genera la base de datos). */
export type ProveedorDatos = Partial<Omit<Proveedor, "id">>;

export const proveedorService = {
  listar: (estado?: EstadoProveedor) =>
    api.get<Proveedor[]>("/proveedores", { params: { estado } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<Proveedor>(`/proveedores/${id}`).then((r) => r.data),

  crear: (datos: ProveedorDatos) =>
    api.post<Proveedor>("/proveedores", datos).then((r) => r.data),

  actualizar: (id: string, datos: ProveedorDatos) =>
    api.put<Proveedor>(`/proveedores/${id}`, datos).then((r) => r.data),

  cambiarEstado: (id: string, estado: EstadoProveedor) =>
    api.patch<Proveedor>(`/proveedores/${id}/estado`, { estado }).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/proveedores/${id}`).then(() => undefined),
};

