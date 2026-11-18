// Reglas para los insumos que el cliente envía con su remisión (corrección de la instructora).
// En la base de datos se guarda un solo texto `nombre` = "Insumo · especificación"
// (ej. "Hilo · negro 45 m"), así que no hace falta cambiar las tablas.
import { insumoService } from "../services/insumoService";

/** Unidades permitidas para los insumos enviados. */
export const UNIDADES_INSUMO = ["Unidad", "Metros", "Yardas", "Rollo", "Carrete", "Paquete", "Kilogramo"];

/** En estas unidades la especificación es obligatoria (ej. "Botones · negros 2 cm"). */
const UNIDADES_CON_ESPECIFICACION = ["Unidad", "Paquete", "Carrete"];

/** Insumos comunes en un taller de confección (se suman a los del catálogo del taller). */
export const INSUMOS_ESTANDAR = [
  "Hilo", "Hilo poliéster", "Hilo algodón", "Hilaza", "Botones", "Broches", "Cremallera",
  "Tela", "Tela antifluido", "Tela drill", "Tela lino", "Tela jersey", "Entretela",
  "Elástico", "Cordón", "Reata", "Velcro", "Sesgo", "Encaje", "Etiquetas", "Marquillas",
  "Remaches", "Ojaletes", "Hebillas", "Apliques", "Bolsas de empaque",
];

export const SEPARADOR = " · ";

export const requiereEspecificacion = (unidad: string) => UNIDADES_CON_ESPECIFICACION.includes(unidad);

/** Une el insumo y su especificación en el texto que se guarda. */
export function unirNombre(insumo: string, especificacion: string): string {
  const base = insumo.trim().replace(/\s+/g, " ");
  const espec = especificacion.trim().replace(/\s+/g, " ");
  return espec ? `${base}${SEPARADOR}${espec}` : base;
}

/** Separa el texto guardado en insumo y especificación (para editar). */
export function separarNombre(nombre: string): { insumo: string; especificacion: string } {
  const i = nombre.indexOf(SEPARADOR);
  return i === -1
    ? { insumo: nombre, especificacion: "" }
    : { insumo: nombre.slice(0, i), especificacion: nombre.slice(i + SEPARADOR.length) };
}

/** Problema de una fila de insumo, o null si está bien. */
export function problemaInsumo(insumo: string, especificacion: string, cantidad: number, unidad: string): string | null {
  if (!insumo.trim()) return "Escribe o elige el insumo.";
  if (requiereEspecificacion(unidad) && !especificacion.trim())
    return `Agrega la especificación del insumo «${insumo.trim()}» (color, tamaño, metros...).`;
  if (unirNombre(insumo, especificacion).length > 100) return "El insumo y su especificación pueden tener máximo 100 caracteres.";
  if (!cantidad || cantidad <= 0) return `Ingresa la cantidad de «${insumo.trim()}».`;
  return null;
}

/** Sugerencias: catálogo del taller + lista estándar, sin repetidos. Si no hay permiso al catálogo, solo la estándar. */
export async function cargarSugerenciasInsumos(): Promise<string[]> {
  let catalogo: string[] = [];
  try {
    catalogo = (await insumoService.listar()).map((i) => i.nombre);
  } catch {
    catalogo = [];
  }
  const vistos = new Set<string>();
  return [...catalogo, ...INSUMOS_ESTANDAR].filter((n) => {
    const clave = n.trim().toLowerCase();
    if (!clave || vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}
