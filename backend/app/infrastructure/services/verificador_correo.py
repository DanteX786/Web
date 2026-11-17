import logging

from email_validator import EmailNotValidError, caching_resolver, validate_email

from app.domain.interfaces.seguridad import IVerificadorCorreo

log = logging.getLogger("eslabon.correo")


class DnsVerificadorCorreo(IVerificadorCorreo):
    """Consulta el DNS para saber si el dominio del correo existe y recibe correos
    (ej. gmail.com sí; gmial.com o empresa-que-no-existe.com no)."""

    def __init__(self, timeout_segundos: int = 5):
        self._resolver = caching_resolver(timeout=timeout_segundos)

    def dominio_recibe_correo(self, correo: str) -> bool:
        try:
            validate_email(correo, check_deliverability=True, dns_resolver=self._resolver)
            return True
        except EmailNotValidError as error:
            texto = str(error).lower()
            # Sin internet o DNS lento: no se bloquea el registro por eso
            if "timed out" in texto or "timeout" in texto or "no nameservers" in texto:
                log.warning("No se pudo verificar el dominio de %s: %s", correo, error)
                return True
            return False
