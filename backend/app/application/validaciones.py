"""Reglas de validación del acceso. Las mismas están en el frontend
(features/auth/utils/validaciones.ts) para avisar antes de enviar; el backend
vuelve a validar todo porque es la fuente de verdad."""
import re

LONGITUD_MINIMA = 8
LONGITUD_MAXIMA = 64  # bcrypt usa máximo 72 bytes
ESPECIALES = r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?~`¿¡°¬]"

# usuario@dominio.ext — sin espacios, sin puntos seguidos ni al inicio/fin, extensión de 2 a 24 letras
_CORREO = re.compile(
    r"^(?!\.)(?!.*\.\.)[A-Za-z0-9._%+\-]{1,64}(?<!\.)@"
    r"(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$"
)

# Errores de escritura frecuentes en los dominios más usados
DOMINIOS_MAL_ESCRITOS = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com", "gnail.com": "gmail.com",
    "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.cm": "gmail.com", "gmail.om": "gmail.com",
    "gmail.es": "gmail.com", "gmal.com": "gmail.com", "gmaill.com": "gmail.com",
    "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmai.com": "hotmail.com",
    "hotmail.co": "hotmail.com", "hotmail.con": "hotmail.com", "homail.com": "hotmail.com", "hormail.com": "hotmail.com",
    "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.con": "yahoo.com", "yhoo.com": "yahoo.com",
    "outlok.com": "outlook.com", "outlook.co": "outlook.com", "outlook.con": "outlook.com", "otlook.com": "outlook.com",
    "icloud.co": "icloud.com", "iclod.com": "icloud.com",
}


def normalizar_correo(correo: str) -> str:
    return (correo or "").strip().lower()


def problema_correo(correo: str) -> str | None:
    """Formato del correo (gmail, hotmail, yahoo, outlook, corporativos...). None si está bien."""
    valor = normalizar_correo(correo)
    if not valor:
        return "Ingresa el correo electrónico."
    if len(valor) > 100:
        return "El correo es demasiado largo (máximo 100 caracteres)."
    if not _CORREO.match(valor):
        return "El correo no es válido. Debe tener la forma usuario@dominio.com (ej. nombre@gmail.com)."
    dominio = valor.split("@", 1)[1]
    if dominio in DOMINIOS_MAL_ESCRITOS:
        return f"¿Quisiste decir @{DOMINIOS_MAL_ESCRITOS[dominio]}? Revisa el dominio del correo."
    return None


def problemas_contrasena(contrasena: str) -> list[str]:
    """Reglas que NO cumple la contraseña (lista vacía = válida)."""
    problemas = []
    if len(contrasena) < LONGITUD_MINIMA:
        problemas.append(f"mínimo {LONGITUD_MINIMA} caracteres")
    if len(contrasena) > LONGITUD_MAXIMA:
        problemas.append(f"máximo {LONGITUD_MAXIMA} caracteres")
    if not re.search(r"[A-ZÁÉÍÓÚÑ]", contrasena):
        problemas.append("una letra mayúscula")
    if not re.search(r"[a-záéíóúñ]", contrasena):
        problemas.append("una letra minúscula")
    if not re.search(r"\d", contrasena):
        problemas.append("un número")
    if not re.search(ESPECIALES, contrasena):
        problemas.append("un carácter especial (ej. * . # @ !)")
    if re.search(r"\s", contrasena):
        problemas.append("sin espacios")
    return problemas


# Tipos de documento usados en Colombia (código que se guarda -> nombre que se muestra)
TIPOS_DOCUMENTO = {
    "NIT": "NIT",
    "CC": "Cédula de ciudadanía",
    "CE": "Cédula de extranjería",
    "PA": "Pasaporte",
    "PPT": "Permiso por Protección Temporal (PPT)",
}

# Formato de cada documento y el mensaje si no lo cumple
_REGLAS_DOCUMENTO = {
    "NIT": (r"\d{9,10}(-\d)?",
            "El NIT debe tener 9 o 10 dígitos y, opcional, el dígito de verificación (ej. 900123456-1)."),
    "CC": (r"\d{6,10}", "La cédula de ciudadanía debe tener entre 6 y 10 dígitos, sin puntos ni espacios."),
    "CE": (r"\d{6,10}", "La cédula de extranjería debe tener entre 6 y 10 dígitos, sin puntos ni espacios."),
    "PA": (r"[A-Z0-9]{5,15}", "El pasaporte debe tener entre 5 y 15 letras o números, sin espacios ni guiones."),
    "PPT": (r"\d{6,15}", "El PPT debe tener entre 6 y 15 dígitos, sin puntos ni espacios."),
}


def normalizar_documento(tipo: str, numero: str) -> str:
    """Quita espacios y puntos; el pasaporte se guarda en mayúsculas."""
    valor = re.sub(r"[\s.]", "", numero or "")
    return valor.upper() if tipo == "PA" else valor


def problema_documento(tipo: str, numero: str) -> str | None:
    if tipo not in _REGLAS_DOCUMENTO:
        return "Elige el tipo de documento: " + ", ".join(TIPOS_DOCUMENTO.values()) + "."
    if not numero:
        return "Ingresa el número de documento."
    patron, mensaje = _REGLAS_DOCUMENTO[tipo]
    if not re.fullmatch(patron, numero):
        return mensaje
    return None


def problema_contacto(tipo_documento: str, nombre_contacto: str | None) -> str | None:
    """Si el cliente es una empresa (NIT) debe decir a qué persona contactar."""
    valor = (nombre_contacto or "").strip()
    if tipo_documento != "NIT" and not valor:
        return None
    if not valor:
        return "Escribe el nombre de la persona a contactar en la empresa."
    if len(valor) < 3:
        return "El nombre de la persona a contactar debe tener al menos 3 letras."
    if len(valor) > 100:
        return "El nombre de la persona a contactar puede tener máximo 100 caracteres."
    if not re.fullmatch(r"[A-Za-zÁÉÍÓÚáéíóúÑñÜü .'\-]+", valor):
        return "El nombre de la persona a contactar solo puede tener letras y espacios."
    return None


def problema_telefono(tipo: str, telefono: str) -> str | None:
    if tipo not in ("Empresarial", "Personal"):
        return "Elige el tipo de teléfono: Empresarial o Personal."
    if not telefono:
        return "Ingresa el número de teléfono."
    if tipo == "Personal":
        if not re.fullmatch(r"3\d{9}", telefono):
            return "El teléfono personal debe ser un celular de 10 dígitos que empiece por 3 (ej. 3001234567)."
    elif not re.fullmatch(r"(60\d{8}|3\d{9}|\d{7})", telefono):
        return "El teléfono empresarial debe ser un fijo (60X + 7 dígitos), un celular de 10 dígitos o un fijo de 7 dígitos."
    return None


def problema_nombre(nombre: str) -> str | None:
    valor = (nombre or "").strip()
    if len(valor) < 3:
        return "El nombre o razón social debe tener al menos 3 caracteres."
    if len(valor) > 100:
        return "El nombre o razón social puede tener máximo 100 caracteres."
    if not re.fullmatch(r"[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,&'\-]+", valor):
        return "El nombre solo puede tener letras, números, espacios y . , & ' -"
    if not re.search(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]", valor):
        return "El nombre debe contener letras."
    return None


def problema_direccion(direccion: str | None) -> str | None:
    if direccion and len(direccion.strip()) > 150:
        return "La dirección puede tener máximo 150 caracteres."
    if direccion and len(direccion.strip()) < 5:
        return "La dirección es muy corta."
    return None


# ---------------------------------------------------------------- Empleados
def problema_nombre_persona(nombre: str) -> str | None:
    """Nombre y apellido de una persona (empleados): solo letras, mínimo dos palabras."""
    valor = " ".join((nombre or "").split())
    if not valor:
        return "Ingrese el nombre completo."
    if len(valor) > 100:
        return "El nombre puede tener máximo 100 caracteres."
    if not re.fullmatch(r"[A-Za-zÁÉÍÓÚáéíóúÑñÜü .'\-]+", valor):
        return "El nombre solo puede tener letras y espacios."
    if len([p for p in valor.split(" ") if len(p) >= 2]) < 2:
        return "Escriba nombre y apellido."
    return None


def problema_identificacion(identificacion: str) -> str | None:
    """Cédula del empleado: entre 6 y 10 dígitos, sin puntos."""
    valor = (identificacion or "").strip()
    if not valor:
        return "Ingrese la cédula."
    if not re.fullmatch(r"\d{6,10}", valor):
        return "La cédula tiene entre 6 y 10 dígitos, sin puntos ni espacios."
    return None


def generar_contrasena_temporal(longitud: int = 12) -> str:
    """Contraseña aleatoria que cumple todas las reglas (mayúscula, minúscula, número y especial).
    Se usa como contraseña temporal del empleado: él la cambia al entrar por primera vez."""
    import secrets
    mayus = "ABCDEFGHJKLMNPQRSTUVWXYZ"          # sin letras que se confunden (I, O)
    minus = "abcdefghijkmnpqrstuvwxyz"          # sin l, o
    numeros = "23456789"                         # sin 0 ni 1
    especiales = "*#@!$%&?"
    todos = mayus + minus + numeros + especiales
    letras = [secrets.choice(mayus), secrets.choice(minus), secrets.choice(numeros), secrets.choice(especiales)]
    letras += [secrets.choice(todos) for _ in range(max(longitud, LONGITUD_MINIMA) - len(letras))]
    secrets.SystemRandom().shuffle(letras)
    contrasena = "".join(letras)
    if problemas_contrasena(contrasena):        # no debería pasar; por si acaso se genera otra
        return generar_contrasena_temporal(longitud)
    return contrasena
