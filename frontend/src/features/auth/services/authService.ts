import { api, EVENTO_SESION_CERRADA } from "../../../shared/utils/api";
import { primeraVistaPermitida } from "../utils/permisos";

/** Evento que avisa a App.tsx que cambiaron los datos o permisos del usuario. */
export const EVENTO_USUARIO_ACTUALIZADO = "eslabon:usuario-actualizado";

// ---------- Tipos ----------
export type TipoUsuario = "Empleado" | "Cliente";
export type TipoDocumento = "NIT" | "CC" | "CE" | "PA" | "PPT";

/** Tipos de documento usados en Colombia: código que se guarda -> nombre que se muestra. */
export const TIPOS_DOCUMENTO: { valor: TipoDocumento; etiqueta: string; corta: string }[] = [
  { valor: "CC", etiqueta: "Cédula de ciudadanía", corta: "C.C." },
  { valor: "NIT", etiqueta: "NIT (empresa)", corta: "NIT" },
  { valor: "CE", etiqueta: "Cédula de extranjería", corta: "C.E." },
  { valor: "PA", etiqueta: "Pasaporte", corta: "Pasaporte" },
  { valor: "PPT", etiqueta: "Permiso por Protección Temporal (PPT)", corta: "PPT" },
];

/** Nombre del tipo de documento para mostrar (acepta también el antiguo "Cédula"). */
export function nombreTipoDocumento(tipo: string | null | undefined): string {
  if (!tipo) return "Documento";
  if (tipo === "Cédula") return "Cédula de ciudadanía";
  return TIPOS_DOCUMENTO.find((t) => t.valor === tipo)?.etiqueta.replace(" (empresa)", "") ?? tipo;
}
export type TipoTelefono = "Empresarial" | "Personal";

export interface Usuario {
  id: string;            // id_empleados o NIT/cédula del cliente
  tipo: TipoUsuario;
  nombre: string;
  correo: string;
  rol: string | null;    // "Administrador", "Empleado", "Cliente"...
  telefono: string | null;
  direccion: string | null;
  documento: string | null;        // NIT/cédula (cliente) o identificación (empleado)
  tipo_documento: TipoDocumento | null;
  nombre_contacto?: string | null; // persona a contactar (clientes con NIT)
  tipo_telefono: TipoTelefono | null;
  /** Empleado con contraseña temporal (la que le llegó al correo): debe crear la suya al entrar. */
  debe_cambiar_contrasena?: boolean;
  /** Tabla maestra de usuarios: Sin acceso | Invitado | Activa */
  estado_cuenta?: EstadoCuenta;
  permisos: string[];
}

export type EstadoCuenta = "Sin acceso" | "Invitado" | "Activa";

/** Datos del cliente invitado que se muestran en "Activar cuenta". */
export interface InvitacionInfo {
  nombre: string;
  correo: string;
  documento: string | null;
  tipo_documento: TipoDocumento | null;
}

export interface PerfilDatos {
  nombre: string;
  correo: string;
  tipo_telefono: TipoTelefono;
  telefono: string;
  direccion?: string | null;
  nombre_contacto?: string | null;
}

export interface Sesion {
  access_token: string;
  token_type: "bearer";
  usuario: Usuario;
}

export interface RegistroDatos {
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombre: string;
  nombre_contacto?: string | null;
  correo: string;
  tipo_telefono: TipoTelefono;
  telefono: string;
  direccion?: string | null;
  contrasena: string;
  confirmar_contrasena: string;
}

export interface CodigoEnviado {
  mensaje: string;
  segundos_reenvio: number;
  minutos_vigencia: number;
}

// ---------- Llamadas a la API ----------
export const authService = {
  login: (correo: string, contrasena: string) =>
    api.post<Sesion>("/auth/login", { correo, contrasena }).then((r) => r.data),

  registro: (datos: RegistroDatos) =>
    api.post<Sesion>("/auth/registro", datos).then((r) => r.data),

  me: () => api.get<Usuario>("/auth/me").then((r) => r.data),

  /** Cliente registrado por el taller: datos de su invitación (enlace ?activar=... del correo). */
  infoInvitacion: (token: string) =>
    api.get<InvitacionInfo>("/auth/invitacion", { params: { token } }).then((r) => r.data),

  /** El cliente invitado crea su contraseña; devuelve la sesión para entrar de una vez. */
  activarCuenta: (token: string, contrasena: string, confirmar_contrasena: string, acepta_tratamiento_datos: boolean) =>
    api.post<Sesion>("/auth/activar-cuenta", { token, contrasena, confirmar_contrasena, acepta_tratamiento_datos })
      .then((r) => r.data),

  recuperar: (correo: string) =>
    api.post<CodigoEnviado>("/auth/recuperar", { correo }).then((r) => r.data),

  reenviarCodigo: (correo: string) =>
    api.post<CodigoEnviado>("/auth/reenviar-codigo", { correo }).then((r) => r.data),

  verificarCodigo: (correo: string, codigo: string) =>
    api.post<{ token_restablecer: string; minutos_vigencia: number }>("/auth/verificar-codigo", { correo, codigo })
      .then((r) => r.data),

  restablecer: (token_restablecer: string, nueva_contrasena: string, confirmar_contrasena: string) =>
    api.post<{ mensaje: string }>("/auth/restablecer", { token_restablecer, nueva_contrasena, confirmar_contrasena })
      .then((r) => r.data),

  /** Mi perfil del cliente: guarda los cambios y actualiza el usuario de la sesión. */
  actualizarPerfil: (datos: PerfilDatos) =>
    api.put<Usuario>("/auth/perfil", datos).then((r) => {
      localStorage.setItem("usuario", JSON.stringify(r.data));
      window.dispatchEvent(new CustomEvent(EVENTO_USUARIO_ACTUALIZADO, { detail: r.data }));
      return r.data;
    }),

  /** Mi perfil: dice si la contraseña actual es correcta (el backend limita a 10 consultas por minuto). */
  verificarContrasenaActual: (contrasena_actual: string) =>
    api.post<{ correcta: boolean }>("/auth/verificar-contrasena-actual", { contrasena_actual })
      .then((r) => r.data.correcta),

  /**
   * Empleado que entró con la contraseña temporal: crea la suya. Se usa el token del login
   * (todavía no se guarda la sesión) y devuelve una sesión nueva.
   */
  primerCambio: (token: string, contrasena_actual: string, nueva_contrasena: string, confirmar_contrasena: string) =>
    api.post<Sesion>("/auth/primer-cambio", { contrasena_actual, nueva_contrasena, confirmar_contrasena },
      { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),

  /** Cambia la contraseña (clientes y empleados) y cierra la sesión en TODOS los dispositivos, incluido este. */
  cambiarContrasena: (contrasena_actual: string, nueva_contrasena: string, confirmar_contrasena: string) =>
    api.post<{ mensaje: string }>("/auth/cambiar-contrasena", { contrasena_actual, nueva_contrasena, confirmar_contrasena })
      .then((r) => {
        cerrarSesionLocal(r.data.mensaje);
        return r.data;
      }),
};

// ---------- Sesión guardada en el navegador ----------
export function guardarSesion(sesion: Sesion): void {
  localStorage.setItem("token", sesion.access_token);
  localStorage.setItem("usuario", JSON.stringify(sesion.usuario));
}

export function obtenerUsuario(): Usuario | null {
  try {
    const texto = localStorage.getItem("usuario");
    return localStorage.getItem("token") && texto ? (JSON.parse(texto) as Usuario) : null;
  } catch {
    return null;
  }
}

/** Borra la sesión de este navegador y avisa a App.tsx (que vuelve al inicio de sesión). */
export function cerrarSesionLocal(motivo?: string): void {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.dispatchEvent(new CustomEvent(EVENTO_SESION_CERRADA, { detail: motivo ?? "" }));
}

/** Vista inicial: la primera que el usuario puede abrir según sus permisos. */
export function vistaInicial(usuario: Usuario): string {
  return primeraVistaPermitida(usuario);
}

/**
 * PBI-21: revisa la sesión cada 15 segundos y cada vez que el usuario vuelve a la pestaña.
 * Si la contraseña se cambió en otro dispositivo, /auth/me responde 401 y el interceptor
 * de api.ts cierra la sesión aquí también. Devuelve una función para detener la vigilancia.
 */
export function vigilarSesion(): () => void {
  // Además trae los permisos actuales: si el administrador cambia los permisos de un rol,
  // el menú se actualiza solo, sin volver a iniciar sesión.
  const revisar = () => {
    if (!localStorage.getItem("token")) return;
    authService.me()
      .then((u) => {
        if (JSON.stringify(u) !== localStorage.getItem("usuario")) {
          localStorage.setItem("usuario", JSON.stringify(u));
          window.dispatchEvent(new CustomEvent(EVENTO_USUARIO_ACTUALIZADO, { detail: u }));
        }
      })
      .catch(() => undefined);
  };
  const alVolver = () => { if (document.visibilityState === "visible") revisar(); };
  // Si se cierra la sesión en otra pestaña del mismo navegador
  const alCambiarStorage = (e: StorageEvent) => {
    if (e.key === "token" && !e.newValue) {
      window.dispatchEvent(new CustomEvent(EVENTO_SESION_CERRADA, { detail: "Se cerró la sesión en otra pestaña." }));
    }
  };
  revisar();
  const intervalo = window.setInterval(revisar, 15000);
  window.addEventListener("focus", revisar);
  document.addEventListener("visibilitychange", alVolver);
  window.addEventListener("storage", alCambiarStorage);
  return () => {
    window.clearInterval(intervalo);
    window.removeEventListener("focus", revisar);
    document.removeEventListener("visibilitychange", alVolver);
    window.removeEventListener("storage", alCambiarStorage);
  };
}
