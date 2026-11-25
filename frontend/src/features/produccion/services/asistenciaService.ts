import { api } from "../../../shared/utils/api";

/**
 * Estado del día. "Presente" lo pone el sistema solo cuando se registra una entrada.
 * Permiso / Incapacidad / Vacaciones son novedades del día completo (sin horas).
 */
export type EstadoAsistencia = "No presente" | "Presente" | "Permiso" | "Incapacidad" | "Vacaciones";
export const NOVEDADES: EstadoAsistencia[] = ["No presente", "Permiso", "Incapacidad", "Vacaciones"];

export type TipoSalida = "Fin de jornada" | "Permiso";

/** Un tramo del día: entrada -> salida. */
export interface Marcacion {
  id_marcacion: string;
  id_asistencia: string;
  id_empleado: string;
  empleado: string;
  fecha: string;                 // "YYYY-MM-DD"
  hora_entrada: string;          // ISO
  hora_salida: string | null;    // null = sigue en el taller (o se olvidó la salida)
  tipo_salida: TipoSalida | null;
  motivo: string | null;
  minutos: number;
  sin_salida: boolean;           // día anterior sin salida: hay que corregirlo
  registrado_por: string | null;
  registrado_por_nombre: string | null;
}

export interface Asistencia {
  id_asistencia: string;
  fecha: string;                 // "YYYY-MM-DD"
  id_empleado: string;
  empleado: string;
  identificacion: string;
  rol: string | null;
  estado: EstadoAsistencia;
  observacion: string | null;
  fecha_registro: string;        // ISO
  registrado_por: string | null;
  registrado_por_nombre: string | null;
  en_taller: boolean;            // tiene una entrada de hoy sin salida
  minutos_trabajados: number;
  marcaciones: Marcacion[];
}

/** Solo el administrador. Al pedir un día, el backend crea la lista con todos en "No presente". */
export const asistenciaService = {
  delDia: (fecha?: string) =>
    api.get<Asistencia[]>("/asistencia", { params: { fecha: fecha || undefined } }).then((r) => r.data),

  /** Entradas de días anteriores que quedaron sin salida. */
  sinSalida: () =>
    api.get<Marcacion[]>("/asistencia/sin-salida").then((r) => r.data),

  /** Novedad del día completo (o volver a No presente) y observación. */
  marcar: (id: string, estado: EstadoAsistencia, observacion?: string | null) =>
    api.patch<Asistencia>(`/asistencia/${id}`, { estado, observacion: observacion ?? null }).then((r) => r.data),

  /** hora "HH:MM" (vacío = ahora, solo hoy). */
  entrada: (id: string, hora?: string | null) =>
    api.post<Asistencia>(`/asistencia/${id}/entrada`, { hora: hora || null }).then((r) => r.data),

  salida: (id: string, datos: { hora?: string | null; tipo_salida: TipoSalida; motivo?: string | null }) =>
    api.post<Asistencia>(`/asistencia/${id}/salida`, { ...datos, hora: datos.hora || null }).then((r) => r.data),

  entradaTodos: (fecha: string | undefined, hora?: string | null) =>
    api.post<Asistencia[]>("/asistencia/entrada-todos", { fecha: fecha || null, hora: hora || null }).then((r) => r.data),

  editarMarcacion: (id: string, datos: { hora_entrada: string; hora_salida?: string | null; tipo_salida?: TipoSalida | null; motivo?: string | null }) =>
    api.put<Asistencia>(`/asistencia/marcaciones/${id}`, datos).then((r) => r.data),

  eliminarMarcacion: (id: string) =>
    api.delete(`/asistencia/marcaciones/${id}`).then((r) => r.data as Asistencia),
};
