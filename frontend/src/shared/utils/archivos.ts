/**
 * El backend guarda los archivos subidos con una ruta relativa, ej. "/uploads/fichas/REM00001_ab12.pdf".
 * Para abrirlos hay que ponerle delante el servidor (VITE_API_URL sin el "/api" del final).
 */
const SERVIDOR = String(import.meta.env.VITE_API_URL ?? "")
  .replace(/\/+$/, "")
  .replace(/\/api\.?$/, "");

export const urlArchivo = (ruta: string | null | undefined): string | null =>
  !ruta ? null : /^https?:\/\//.test(ruta) ? ruta : `${SERVIDOR}${ruta}`;

/** Tipos que acepta el backend (máx. 5 MB). */
export const ACEPTA_ARCHIVOS = ".pdf,.jpg,.jpeg,.png,.webp";
export const MAX_MB = 5;

/** Valida en el navegador antes de subir (el backend vuelve a validar). */
export const errorArchivo = (archivo: File): string | null => {
  const ext = archivo.name.toLowerCase().split(".").pop() ?? "";
  if (!["pdf", "jpg", "jpeg", "png", "webp"].includes(ext)) return "Solo se permiten PDF o imágenes (JPG, PNG, WEBP).";
  if (archivo.size > MAX_MB * 1024 * 1024) return `El archivo supera los ${MAX_MB} MB.`;
  return null;
};
