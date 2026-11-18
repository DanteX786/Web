import logging
import smtplib
import socket
import ssl
from email.message import EmailMessage
from email.utils import formataddr

from app.domain.exceptions.errors import ServicioNoDisponibleError
from app.domain.interfaces.seguridad import IEmailService

log = logging.getLogger("uvicorn.error")  # sale en la terminal de uvicorn


class SmtpEmailService(IEmailService):
    """Envía correos reales por SMTP (Gmail con contraseña de aplicación).

    Intenta primero el puerto 587 (STARTTLS) y, si la red lo bloquea, el 465 (SSL).
    Si nada funciona, escribe en la terminal de uvicorn la causa exacta.
    """

    def __init__(self, host: str, puerto: int, usuario: str, contrasena: str, remitente: str):
        self.host = host
        self.puerto = puerto
        self.usuario = usuario.strip()
        self.contrasena = contrasena.replace(" ", "").strip()  # Google la muestra en grupos de 4
        self.remitente = remitente

    # ------------------------------------------------------------------ envío
    def enviar_codigo_recuperacion(self, correo: str, nombre: str, codigo: str, minutos: int) -> None:
        if not self.usuario or not self.contrasena:
            log.error("[CORREO] Falta SMTP_USUARIO o SMTP_CONTRASENA en backend/.env (reinicia uvicorn después de editarlo).")
            raise ServicioNoDisponibleError(
                "El envío de correos no está configurado en el servidor. Comunícate con el administrador.")
        if len(self.contrasena) != 16:
            log.warning("[CORREO] SMTP_CONTRASENA tiene %s caracteres; una contraseña de aplicación de Google tiene 16.",
                        len(self.contrasena))

        mensaje = self._mensaje(correo, nombre, codigo, minutos)
        errores = []
        for intento in (self._enviar_starttls, self._enviar_ssl):
            try:
                intento(mensaje)
                log.info("[CORREO] Código de recuperación enviado a %s", correo)
                return
            except smtplib.SMTPAuthenticationError as e:
                log.error("[CORREO] Gmail rechazó el usuario o la contraseña de aplicación: %s", e)
                raise ServicioNoDisponibleError(
                    "No se pudo enviar el correo: Gmail rechazó la cuenta del servidor (revisa SMTP_USUARIO y la contraseña de aplicación).")
            except ssl.SSLCertVerificationError as e:
                log.error("[CORREO] Certificado SSL no verificado (antivirus o red que intercepta HTTPS): %s", e)
                errores.append(f"certificado SSL: {e}")
            except (socket.gaierror, socket.timeout, TimeoutError, ConnectionError, OSError, smtplib.SMTPException) as e:
                log.error("[CORREO] %s falló: %s: %s", intento.__name__, type(e).__name__, e)
                errores.append(f"{type(e).__name__}: {e}")

        log.error("[CORREO] No se pudo enviar a %s. Causas: %s", correo, " | ".join(errores))
        raise ServicioNoDisponibleError(
            "No se pudo conectar con el servidor de correo (sin internet o la red bloquea Gmail). Intenta de nuevo en unos minutos.")

    def _enviar_starttls(self, mensaje: EmailMessage) -> None:
        with smtplib.SMTP(self.host, self.puerto, timeout=15) as servidor:
            servidor.ehlo()
            servidor.starttls(context=ssl.create_default_context())
            servidor.ehlo()
            servidor.login(self.usuario, self.contrasena)
            servidor.send_message(mensaje)

    def _enviar_ssl(self, mensaje: EmailMessage) -> None:
        with smtplib.SMTP_SSL(self.host, 465, timeout=15, context=ssl.create_default_context()) as servidor:
            servidor.login(self.usuario, self.contrasena)
            servidor.send_message(mensaje)

    # ------------------------------------------------------------------ contenido
    def _mensaje(self, correo: str, nombre: str, codigo: str, minutos: int) -> EmailMessage:
        mensaje = EmailMessage()
        mensaje["Subject"] = f"{codigo} es tu código para restablecer la contraseña - Eslabón"
        mensaje["From"] = formataddr((self.remitente, self.usuario))
        mensaje["To"] = correo
        mensaje.set_content(
            f"Hola {nombre},\n\n"
            f"Tu código para restablecer la contraseña en Eslabón es: {codigo}\n"
            f"Vence en {minutos} minutos. Si pides otro código, este deja de funcionar.\n\n"
            "Si no solicitaste este cambio, ignora este correo: tu contraseña seguirá igual.\n\n"
            "Taller y Confecciones CDS"
        )
        mensaje.add_alternative(self._html(nombre, codigo, minutos), subtype="html")
        return mensaje

    @staticmethod
    def _html(nombre: str, codigo: str, minutos: int) -> str:
        return f"""\
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Montserrat,Arial,Helvetica,sans-serif;color:#121212">
    <table role="presentation" width="100%" style="max-width:480px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="height:4px;background:linear-gradient(90deg,#C9A227,#E6B84A)"></td></tr>
      <tr><td style="padding:32px">
        <h2 style="margin:0 0 8px">Restablecer contraseña</h2>
        <p style="margin:0 0 24px;color:#6B6B6B">Hola {nombre}, usa este código en Eslabón:</p>
        <p style="font-size:36px;letter-spacing:10px;font-weight:800;text-align:center;color:#121212;
                  background:#C9A2271F;border:1px solid #C9A22766;border-radius:10px;padding:16px;margin:0 0 24px">{codigo}</p>
        <p style="margin:0 0 8px;color:#6B6B6B">Vence en <b>{minutos} minutos</b>. Si pides otro código, este deja de funcionar.</p>
        <p style="margin:0;color:#9A9A9A;font-size:13px">Si no solicitaste este cambio, ignora este correo.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="margin:0;color:#9A9A9A;font-size:12px">Taller y Confecciones CDS · Eslabón</p>
      </td></tr>
    </table>
  </body>
</html>"""
