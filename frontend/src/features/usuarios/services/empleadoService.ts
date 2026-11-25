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
  /** Todavía no ha creado su contraseña (tiene la temporal que le llegó al correo). */
  debe_cambiar_contrasena?: boolean;
}

/** Datos que se envían al crear o editar (el id lo genera la base de datos).
 *  La contraseña NO se envía: el sistema genera una temporal y la manda al correo del empleado. */
export type EmpleadoDatos = Partial<Omit<Empleado, "id" | "rol" | "debe_cambiar_contrasena">>;

export const empleadoService = {
  listar: (estado?: EstadoEmpleado) =>
    api.get<Empleado[]>("/empleados", { params: { estado } }).then((r) => r.data),

  obtener: (id: string) =>
    api.get<Empleado>(`/empleados/${id}`).then((r) => r.data),

  /** Registra al empleado y le envía una contraseña temporal a su correo. */
  crear: (datos: EmpleadoDatos) =>
    api.post<Empleado>("/empleados", datos).then((r) => r.data),

  actualizar: (id: string, datos: EmpleadoDatos) =>
    api.put<Empleado>(`/empleados/${id}`, datos).then((r) => r.data),

  cambiarEstado: (id: string, estado: EstadoEmpleado) =>
    api.patch<Empleado>(`/empleados/${id}/estado`, { estado }).then((r) => r.data),

  /** Genera otra contraseña temporal y la envía al correo del empleado. */
  reenviarAcceso: (id: string) =>
    api.post<Empleado>(`/empleados/${id}/reenviar-acceso`).then((r) => r.data),
};
