import { api } from "../../../shared/utils/api";

export type EstadoRol = "Activo" | "Inactivo";

export interface Permiso {
  id: string;
  descripcion: string;
}

export interface Rol {
  id: string;
  descripcion: string;
  estado: EstadoRol;
  permisos: Permiso[];
}

/** Datos que se envían al crear o editar (el id lo genera la base de datos).
 *  "permisos" son los IDs de los permisos. */
export interface RolDatos {
  descripcion?: string;
  estado?: EstadoRol;
  permisos?: string[];
}

export const rolService = {
  listar: (estado?: EstadoRol) =>
    api.get<Rol[]>("/roles", { params: { estado } }).then((r) => r.data),

  listarPermisos: () =>
    api.get<Permiso[]>("/roles/permisos").then((r) => r.data),

  obtener: (id: string) =>
    api.get<Rol>(`/roles/${id}`).then((r) => r.data),

  crear: (datos: RolDatos) =>
    api.post<Rol>("/roles", datos).then((r) => r.data),

  actualizar: (id: string, datos: RolDatos) =>
    api.put<Rol>(`/roles/${id}`, datos).then((r) => r.data),

  cambiarEstado: (id: string, estado: EstadoRol) =>
    api.patch<Rol>(`/roles/${id}/estado`, { estado }).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/roles/${id}`).then(() => undefined),
};
