import { api, EVENTO_SESION_CERRADA } from "../../../shared/utils/api";
import { primeraVistaPermitida } from "../utils/permisos";

/** Evento que avisa a App.tsx que cambiaron los datos o permisos del usuario. */
export const EVENTO_USUARIO_ACTUALIZADO = "eslabon:usuario-actualizado";

// ---------- Tipos ----------
export type TipoUsuario = "Empleado" | "Cliente";
export type TipoDocumento = "NIT" | "Cédula";
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
  tipo_telefono: TipoTelefono | null;
  permisos: string[];
}

export interface PerfilDatos {
  nombre: string;
  correo: string;
  tipo_telefono: TipoTelefono;
  telefono: string;
  direccion?: string | null;
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

  /** Cambia la contraseña (solo clientes) y cierra la sesión en TODOS los dispositivos, incluido este. */
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
