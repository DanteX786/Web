import type { Usuario } from "../services/authService";

/**
 * Qué permiso (tabla `permisos`, columna `descripcion`) abre cada vista del menú.
 * Los permisos de cada rol se asignan en "Roles y Permisos" (tabla rol_x_permiso)
 * y llegan con el usuario al iniciar sesión.
 * Si una vista tiene varios permisos, basta con tener uno.
 */
export const PERMISOS_POR_VISTA: Record<string, string[]> = {
  dashboard: ["Ver dashboard"],
  roles: ["Gestionar roles y permisos"],
  tiposMaquinaria: ["Gestionar parámetros de producción"],
  catalogoPiezas: ["Gestionar parámetros de producción"],
  empleados: ["Gestionar usuarios"],
  clientes: ["Gestionar clientes"],
  remisiones: ["Gestionar remisiones", "Crear remisión (cliente)"],
  seguimientoRemision: ["Gestionar remisiones", "Crear remisión (cliente)", "Gestionar producción", "Gestionar remisiones de entrega"],
  remisionEntrega: ["Gestionar remisiones de entrega"],
  ordenPedido: ["Gestionar remisiones"],
  compras: ["Gestionar compras"],
  proveedores: ["Gestionar proveedores"],
  insumos: ["Gestionar insumos"],
  tipoInsumos: ["Gestionar insumos"],
  insumosEnviados: ["Gestionar insumos", "Gestionar remisiones"],
  produccion: ["Gestionar producción"],
  registroDiario: ["Gestionar producción"],
  registroDiarioEmpleado: ["Registrar avance diario"],
};


/** Orden en que se busca la vista inicial después de iniciar sesión. */
const ORDEN_INICIO = [
  "dashboard", "registroDiarioEmpleado", "remisiones", "produccion", "remisionEntrega",
  "compras", "insumos", "clientes", "empleados", "roles",
];

export const esAdministrador = (u: Usuario | null) => u?.rol === "Administrador";

/** ¿El usuario puede abrir esta vista? El Administrador puede abrir todas (menos Mi perfil). */
export function puedeVer(usuario: Usuario | null, vista: string): boolean {
  if (!usuario) return false;
  // Mi perfil: el cliente lo edita y el empleado solo lo consulta. El administrador no lo necesita.
  if (vista === "miPerfil") return !esAdministrador(usuario);
  if (esAdministrador(usuario)) return true;
  const requeridos = PERMISOS_POR_VISTA[vista];
  if (!requeridos) return false; // vista desconocida: cerrada por seguridad
  return requeridos.some((p) => usuario.permisos.includes(p));
}

/** Primera vista que el usuario puede abrir (si no tiene ninguna, Mi perfil). */
export function primeraVistaPermitida(usuario: Usuario): string {
  return ORDEN_INICIO.find((v) => puedeVer(usuario, v)) ?? "miPerfil";
}
