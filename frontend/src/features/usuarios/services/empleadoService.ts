import { api } from "../../../shared/utils/api";

export type EstadoEmpleado = "Activo" | "Inactivo";

export interface Empleado {
  id: string;
  nombre: string;
  identificacion: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  id_rol: string | null;
  rol: string | null; // descripción del rol
  estado: EstadoEmpleado;
}

/** Datos que se envían al crear o editar (el id lo genera la base de datos).
 *  "contrasena" solo se envía al crear o cuando se quiere cambiar. */
export type EmpleadoDatos = Partial<Omit<Empleado, "id" | "rol">> & {
  contrasena?: string;
};

export const empleadoService = {
  listar: (estado?: EstadoEmpleado) =>
    api.get<Empleado[]>("/empleados", { params: { estado } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<Empleado>(`/empleados/${id}`).then((r) => r.data),

  crear: (datos: EmpleadoDatos) =>
    api.post<Empleado>("/empleados", datos).then((r) => r.data),

  actualizar: (id: string, datos: EmpleadoDatos) =>
    api.put<Empleado>(`/empleados/${id}`, datos).then((r) => r.data),

  cambiarEstado: (id: string, estado: EstadoEmpleado) =>
    api.patch<Empleado>(`/empleados/${id}/estado`, { estado }).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/empleados/${id}`).then(() => undefined),
};
