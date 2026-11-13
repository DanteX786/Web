import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

/** Nombre del evento que avisa a App.tsx que la sesión terminó (token vencido o contraseña cambiada). */
export const EVENTO_SESION_CERRADA = "eslabon:sesion-cerrada";

// Endpoints públicos: un 401 ahí es "credenciales incorrectas", no "sesión cerrada"
const RUTAS_PUBLICAS = ["/auth/login", "/auth/registro", "/auth/recuperar", "/auth/reenviar-codigo", "/auth/verificar-codigo", "/auth/restablecer"];

// Agrega el token de la sesión a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el backend responde 401 en una ruta privada, la sesión ya no sirve:
// se borra y App.tsx manda al inicio de sesión mostrando el motivo.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const url: string = error?.config?.url ?? "";
    if (axios.isAxiosError(error) && error.response?.status === 401 && !RUTAS_PUBLICAS.some((r) => url.includes(r))) {
      const motivo = error.response.data?.detail;
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.dispatchEvent(new CustomEvent(EVENTO_SESION_CERRADA, {
        detail: typeof motivo === "string" ? motivo : "Tu sesión terminó. Inicia sesión de nuevo.",
      }));
    }
    return Promise.reject(error);
  },
);

/** Extrae el mensaje de error que manda FastAPI ({ detail: "..." }).
 *  Los errores de validación (422) traen una lista: se muestran los mensajes de cada campo. */
export const mensajeError = (e: unknown): string => {
  if (!axios.isAxiosError(e)) return "Error inesperado";
  const detail = e.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0)
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => `${String(d.loc?.[d.loc.length - 1] ?? "dato")}: ${d.msg ?? "inválido"}`)
      .join(" · ");
  return e.response ? `Error ${e.response.status} del servidor` : "No se pudo conectar con el servidor";
};
