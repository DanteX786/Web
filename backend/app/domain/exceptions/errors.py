class NotFoundError(Exception):
    """No existe el registro (404)."""


class ConflictError(Exception):
    """Duplicado o regla de negocio que impide la operación (409)."""


class ForbiddenError(Exception):
    """El usuario no tiene permiso para esta operación (403)."""


class ValidacionError(Exception):
    """Datos que no cumplen una regla (400)."""


class AuthError(Exception):
    """Credenciales incorrectas o sesión inválida (401)."""


class TokenInvalidoError(AuthError):
    """El token expiró, fue alterado o la sesión se cerró (401)."""


class DemasiadosIntentosError(Exception):
    """Se superó un límite de tiempo o de intentos (429)."""


class ServicioNoDisponibleError(Exception):
    """Un servicio externo (ej. el correo) no respondió (503)."""
