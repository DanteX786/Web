import { api } from "../../../shared/utils/api";
import type { EstadoCuenta, TipoDocumento, TipoUsuario } from "../../auth/services/authService";

/** Fila de la tabla maestra de usuarios (empleados y clientes juntos). */
export interface UsuarioMaestro {
  id_usuario: string;
  tipo_usuario: TipoUsuario;
  id_origen: string;            // id del empleado o NIT del cliente
  tipo_documento: TipoDocumento | null;
  documento: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  direccion: string | null;
  id_rol: string;
  rol: string;
  estado: "Activo" | "Inactivo";
  estado_cuenta: EstadoCuenta;
  origen: "Autoregistro" | "Creado por el taller";
  creado_por: string | null;
  creado_por_nombre: string | null;
  fecha_creacion: string;
  fecha_invitacion: string | null;
  fecha_activacion: string | null;
  acepto_tratamiento_datos: boolean;
  fecha_aceptacion_datos: string | null;
}

export const usuarioService = {
  /** Solo lectura: los datos se editan en Empleados o en Clientes y se copian solos. */
  listar: (filtros?: { tipo?: TipoUsuario; estado_cuenta?: EstadoCuenta }) =>
    api.get<UsuarioMaestro[]>("/usuarios", { params: filtros }).then((r) => r.data),
};
