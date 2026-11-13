// Validaciones del inicio de sesión y registro (PBI-13). Son las MISMAS reglas del
// backend (app/application/validaciones.py); el backend vuelve a validar todo.
import type { TipoDocumento, TipoTelefono } from "../services/authService";

const CORREO = /^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+-]{1,64}(?<!\.)@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const ESPECIALES = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`¿¡°¬]/;

/** Errores de escritura comunes en los dominios más usados. */
const DOMINIOS_MAL_ESCRITOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com", "gnail.com": "gmail.com",
  "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.cm": "gmail.com", "gmail.om": "gmail.com",
  "gmail.es": "gmail.com", "gmal.com": "gmail.com", "gmaill.com": "gmail.com",
  "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com", "hotmail.con": "hotmail.com", "homail.com": "hotmail.com", "hormail.com": "hotmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.con": "yahoo.com", "yhoo.com": "yahoo.com",
  "outlok.com": "outlook.com", "outlook.co": "outlook.com", "outlook.con": "outlook.com", "otlook.com": "outlook.com",
  "icloud.co": "icloud.com", "iclod.com": "icloud.com",
};

export const soloDigitos = (v: string) => v.replace(/\D/g, "");

export function validarCorreo(correo: string): string | null {
  const v = correo.trim().toLowerCase();
  if (!v) return "Ingresa el correo electrónico.";
  if (v.length > 100) return "El correo es demasiado largo.";
  if (!CORREO.test(v)) return "Correo no válido. Debe ser como usuario@dominio.com (ej. nombre@gmail.com).";
  const dominio = v.split("@")[1];
  if (DOMINIOS_MAL_ESCRITOS[dominio]) return `¿Quisiste decir @${DOMINIOS_MAL_ESCRITOS[dominio]}?`;
  return null;
}

// ---------- Contraseña ----------
export const REGLAS_CONTRASENA: { texto: string; cumple: (c: string) => boolean }[] = [
  { texto: "Mínimo 8 caracteres", cumple: (c) => c.length >= 8 },
  { texto: "Una mayúscula", cumple: (c) => /[A-ZÁÉÍÓÚÑ]/.test(c) },
  { texto: "Una minúscula", cumple: (c) => /[a-záéíóúñ]/.test(c) },
  { texto: "Un número", cumple: (c) => /\d/.test(c) },
  { texto: "Un carácter especial (* . # @ !)", cumple: (c) => ESPECIALES.test(c) },
  { texto: "Sin espacios", cumple: (c) => c.length > 0 && !/\s/.test(c) },
];

export function validarContrasenaNueva(c: string): string | null {
  if (!c) return "Ingresa una contraseña.";
  if (c.length > 64) return "Máximo 64 caracteres.";
  const falla = REGLAS_CONTRASENA.find((r) => !r.cumple(c));
  return falla ? `La contraseña necesita: ${falla.texto.toLowerCase()}.` : null;
}

export const validarConfirmacion = (c: string, conf: string) =>
  !conf ? "Confirma la contraseña." : c === conf ? null : "Las contraseñas no coinciden.";

// ---------- Registro ----------
export function validarDocumento(tipo: TipoDocumento, numero: string): string | null {
  const v = numero.replace(/[\s.]/g, "");
  if (!v) return tipo === "NIT" ? "Ingresa el NIT." : "Ingresa el número de cédula.";
  if (tipo === "NIT") return /^\d{9,10}(-\d)?$/.test(v) ? null : "El NIT tiene 9 o 10 dígitos y, opcional, el dígito de verificación (900123456-1).";
  return /^\d{6,10}$/.test(v) ? null : "La cédula tiene entre 6 y 10 dígitos, sin puntos.";
}

export function validarTelefono(tipo: TipoTelefono, tel: string): string | null {
  if (!tel) return "Ingresa el número de teléfono.";
  if (tipo === "Personal") return /^3\d{9}$/.test(tel) ? null : "Celular de 10 dígitos que empiece por 3 (ej. 3001234567).";
  return /^(60\d{8}|3\d{9}|\d{7})$/.test(tel) ? null : "Fijo (60X + 7 dígitos, ej. 6044440000), celular de 10 dígitos o fijo de 7.";
}

export function validarNombre(nombre: string, tipo: TipoDocumento): string | null {
  const v = nombre.trim();
  if (!v) return tipo === "NIT" ? "Ingresa la razón social." : "Ingresa tu nombre completo.";
  if (v.length < 3) return "Mínimo 3 caracteres.";
  if (v.length > 100) return "Máximo 100 caracteres.";
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,&'-]+$/.test(v)) return "Solo letras, números, espacios y . , & ' -";
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(v)) return "Debe contener letras.";
  return null;
}

export function validarDireccion(dir: string): string | null {
  const v = dir.trim();
  if (!v) return null; // opcional
  if (v.length < 5) return "La dirección es muy corta.";
  if (v.length > 150) return "Máximo 150 caracteres.";
  return null;
}
