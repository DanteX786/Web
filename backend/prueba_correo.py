"""Diagnóstico del login en Gmail. NO muestra la contraseña.
Ejecutar desde backend (con el venv activo):  python prueba_correo.py
Borrar este archivo cuando el correo funcione."""
import base64
import smtplib
import ssl

from core.config import settings as s

usuario = s.SMTP_USUARIO.strip()
clave_original = s.SMTP_CONTRASENA
clave = "".join(clave_original.split())  # quita espacios normales, de no separación, tabs y saltos

print("Usuario:", repr(usuario))
print("Clave -> largo:", len(clave), "| solo letras:", clave.isalpha(), "| minúsculas:", clave.islower(),
      "| ASCII:", clave.isascii(), "| tenía espacios raros:", clave_original != clave_original.replace("\xa0", ""))
print()


def b64(texto: str) -> str:
    return base64.b64encode(texto.encode("utf-8")).decode()


def probar(nombre: str, conectar):
    for mecanismo in ("LOGIN", "PLAIN"):
        print(f"== {nombre} · AUTH {mecanismo}")
        try:
            c = conectar()
            if mecanismo == "LOGIN":
                print("  ", c.docmd("AUTH", "LOGIN"))
                print("  ", c.docmd(b64(usuario)))
                codigo, resp = c.docmd(b64(clave))
            else:
                codigo, resp = c.docmd("AUTH", "PLAIN " + b64(f"\0{usuario}\0{clave}"))
            print("   Respuesta de Gmail:", codigo, resp.decode(errors="replace"))
            print("   >>> LOGIN OK" if codigo == 235 else "   >>> Gmail rechazó el login")
            try:
                c.quit()
            except Exception:
                pass
        except Exception as e:
            print("   ERROR:", type(e).__name__, e)
        print()


def starttls():
    c = smtplib.SMTP("smtp.gmail.com", 587, timeout=15)
    c.ehlo()
    c.starttls(context=ssl.create_default_context())
    c.ehlo()
    return c


def ssl465():
    c = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15, context=ssl.create_default_context())
    c.ehlo()
    return c


probar("Puerto 587 (STARTTLS)", starttls)
probar("Puerto 465 (SSL)", ssl465)
