import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  // Cuando exista el login con JWT:
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // TEMPORAL mientras no hay login: el backend pide el encabezado X-Empleado-Id.
  // Para probar, en la consola del navegador:  localStorage.setItem("id_empleado", "EMP00001")
  const idEmpleado = localStorage.getItem("id_empleado");
  if (idEmpleado) config.headers["X-Empleado-Id"] = idEmpleado;

  return config;
});

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
