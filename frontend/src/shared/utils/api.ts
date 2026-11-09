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

/** Extrae el mensaje de error que manda FastAPI ({ detail: "..." }). */
export const mensajeError = (e: unknown): string =>
  axios.isAxiosError(e)
    ? typeof e.response?.data?.detail === "string"
      ? e.response.data.detail
      : "No se pudo conectar con el servidor"
    : "Error inesperado";
