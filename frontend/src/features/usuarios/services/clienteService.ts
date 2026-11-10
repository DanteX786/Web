import { api } from "../../../shared/utils/api";

export type EstadoCliente = "Activo" | "Inactivo";

export interface CategoriaCliente {
  id: string;
  nombre: string;
}

export interface Cliente {
  nit: string; // identificación del cliente y su llave en la base de datos
  nombre: string;
  direccion: string | null;
  correo: string;
  telefono: string | null;
  estado: EstadoCliente;
  id_categoria: string;
  nombre_categoria: string | null;
}

/** El rol "Cliente" lo asigna el backend automáticamente. */
export interface ClienteCrearDatos {
  nit: string;
  nombre: string;
  direccion?: string | null;
  correo: string;
  telefono?: string | null;
  id_categoria: string;
  estado?: EstadoCliente;
  contrasena: string; // obligatoria al crear, se guarda encriptada
}

/** El NIT no se edita. La contraseña solo se cambia si se envía. */
export type ClienteActualizarDatos = Partial<Omit<ClienteCrearDatos, "nit">>;

export const clienteService = {
  listar: (estado?: EstadoCliente) =>
    api.get<Cliente[]>("/clientes", { params: { estado } }).then((r) => r.data),

  listarCategorias: () =>
    api.get<CategoriaCliente[]>("/clientes/categorias").then((r) => r.data),

  obtener: (nit: string) =>
    api.get<Cliente>(`/clientes/${nit}`).then((r) => r.data),

  crear: (datos: ClienteCrearDatos) =>
    api.post<Cliente>("/clientes", datos).then((r) => r.data),

  actualizar: (nit: string, datos: ClienteActualizarDatos) =>
    api.put<Cliente>(`/clientes/${nit}`, datos).then((r) => r.data),

  cambiarEstado: (nit: string, estado: EstadoCliente) =>
    api.put<Cliente>(`/clientes/${nit}`, { estado }).then((r) => r.data),

  eliminar: (nit: string) =>
    api.delete(`/clientes/${nit}`).then(() => undefined),
};
