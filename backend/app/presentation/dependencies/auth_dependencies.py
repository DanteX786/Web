from fastapi import Header, HTTPException, status


def get_id_empleado_actual(x_empleado_id: str | None = Header(default=None)) -> str:
    """Devuelve el id del empleado que hace la petición.

    TEMPORAL mientras se construye el login: se lee del encabezado HTTP
    "X-Empleado-Id" (ej. EMP00001). Cuando el login con JWT esté listo, SOLO
    se cambia el cuerpo de esta función para leer el token; los routers no cambian.
    """
    if not x_empleado_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falta el encabezado X-Empleado-Id (temporal hasta tener el login).",
        )
    return x_empleado_id


def get_id_empleado_opcional(x_empleado_id: str | None = Header(default=None)) -> str | None:
    """Igual que get_id_empleado_actual, pero no obliga a enviarlo.

    Se usa donde también puede operar un cliente (ej. crear remisión desde la página):
    si no llega empleado, la BD deja al cliente como responsable en el seguimiento.
    """
    return x_empleado_id or None
