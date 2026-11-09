class NotFoundError(Exception):
    """No existe el registro (404)."""


class ConflictError(Exception):
    """Duplicado o regla de negocio que impide la operación (409)."""


class ForbiddenError(Exception):
    """El usuario no tiene permiso para esta operación (403)."""
