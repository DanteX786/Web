from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from core.config import settings
from app.infrastructure.database.database import get_db
from app.presentation.dependencies.auth_dependencies import permisos_de_ruta, requiere_rol
from app.domain.exceptions.errors import (
    AuthError, ConflictError, DemasiadosIntentosError, ForbiddenError, NotFoundError,
    ServicioNoDisponibleError, ValidacionError,
)

# ---- Routers de Camilo ----
from app.presentation.api.auth_router import router as auth_router
from app.presentation.api.proceso_router import router as proceso_router
from app.presentation.api.asistencia_router import router as asistencia_router
from app.presentation.api.produccion_router import asignaciones_router, defectuosas_router, router as produccion_router
from app.presentation.api.registro_diario_router import router as registro_diario_router
from app.presentation.api.seguimiento_router import router as seguimiento_router
# ---- Aquí cada compañero agrega el import de sus routers ----

# ---- Routers de Jordy ----
from app.presentation.api.proveedor_router import router as proveedor_router
from app.presentation.api.tipo_maquina_router import router as tipo_maquina_router
from app.presentation.api.tipo_pieza_router import router as tipo_pieza_router

# ---- Routers de (tu nombre) ----
from app.presentation.api.rol_router import router as rol_router
from app.presentation.api.empleado_router import router as empleado_router
from app.presentation.api.insumo_router import router as insumo_router

# ---- Routers de Emerson ----
from app.presentation.api.cliente_router import router as cliente_router
from app.presentation.api.tipo_insumo_router import router as tipo_insumo_router
from app.presentation.api.compra_router import router as compra_router

# ---- Routers de Daniel ----
from app.presentation.api.remision_router import router as remision_router
from app.presentation.api.insumo_enviado_router import router as insumo_enviado_router
from app.presentation.api.entrega_router import router as entrega_router
from app.presentation.api.dashboard_router import router as dashboard_router
from app.infrastructure.storage.local_storage import CARPETA_UPLOADS, URL_UPLOADS

app = FastAPI(title="Eslabón API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Manejo de errores ----------
@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(ForbiddenError)
async def forbidden_handler(request: Request, exc: ForbiddenError):
    return JSONResponse(status_code=403, content={"detail": str(exc)})


@app.exception_handler(ValidacionError)
async def validacion_handler(request: Request, exc: ValidacionError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(AuthError)
async def auth_handler(request: Request, exc: AuthError):
    return JSONResponse(status_code=401, content={"detail": str(exc)}, headers={"WWW-Authenticate": "Bearer"})


@app.exception_handler(DemasiadosIntentosError)
async def intentos_handler(request: Request, exc: DemasiadosIntentosError):
    return JSONResponse(status_code=429, content={"detail": str(exc)})


@app.exception_handler(ServicioNoDisponibleError)
async def servicio_handler(request: Request, exc: ServicioNoDisponibleError):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


@app.exception_handler(DBAPIError)
async def db_error_handler(request: Request, exc: DBAPIError):
    # Devuelve el mensaje de los triggers de la BD, ej: "Stock insuficiente del insumo..."
    diag = getattr(exc.orig, "diag", None)
    detalle = getattr(diag, "message_primary", None) or "Error en la base de datos"
    return JSONResponse(status_code=400, content={"detail": detalle})


# ---------- Prueba de conexión ----------
@app.get("/api/health", tags=["Sistema"])
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"estado": "ok", "base_de_datos": "conectada"}


# ---------- Routers ----------
# Seguridad por permisos (nivel 3): cada grupo de endpoints exige su permiso de la
# tabla rol_x_permiso, que el administrador asigna en "Roles y Permisos".
# Formato: _p(lectura=(permisos para consultar), escritura=(permisos para crear/editar/eliminar))
# Algunas consultas se abren a otros módulos porque las necesitan (ej. Producción lee empleados).
P_ROLES = "Gestionar roles y permisos"
P_USUARIOS = "Gestionar usuarios"
P_CLIENTES = "Gestionar clientes"
P_REMISIONES = "Gestionar remisiones"
P_REMISION_CLIENTE = "Crear remisión (cliente)"
P_ENTREGAS = "Gestionar remisiones de entrega"
P_PROVEEDORES = "Gestionar proveedores"
P_COMPRAS = "Gestionar compras"
P_INSUMOS = "Gestionar insumos"
P_PRODUCCION = "Gestionar producción"
P_PARAMETROS = "Gestionar parámetros de producción"
P_AVANCE = "Registrar avance diario"
P_DASHBOARD = "Ver dashboard"


def _p(lectura, escritura, **kwargs):
    return [Depends(permisos_de_ruta(tuple(lectura), tuple(escritura), **kwargs))]


app.include_router(auth_router)  # login, registro y recuperación son públicos

# Producción (Camilo)
app.include_router(produccion_router, dependencies=_p([P_PRODUCCION], [P_PRODUCCION]))
app.include_router(asignaciones_router, dependencies=_p([P_PRODUCCION, P_AVANCE], [P_PRODUCCION]))
app.include_router(defectuosas_router, dependencies=_p([P_PRODUCCION, P_ENTREGAS], [P_PRODUCCION]))  # solo lectura
app.include_router(registro_diario_router, dependencies=_p([P_PRODUCCION, P_AVANCE], [P_PRODUCCION, P_AVANCE]))
app.include_router(seguimiento_router, dependencies=_p(
    [P_REMISIONES, P_REMISION_CLIENTE, P_PRODUCCION, P_ENTREGAS], [], solo_personal=False))
app.include_router(proceso_router, dependencies=_p([P_PARAMETROS, P_PRODUCCION], [P_PARAMETROS]))  # tabla maestra de procesos
app.include_router(asistencia_router, dependencies=[Depends(requiere_rol("Administrador"))])  # solo el administrador

# Parámetros y proveedores (Jordy)
app.include_router(proveedor_router, dependencies=_p([P_PROVEEDORES, P_COMPRAS], [P_PROVEEDORES]))  # PB-36
app.include_router(tipo_maquina_router, dependencies=_p([P_PARAMETROS, P_PRODUCCION], [P_PARAMETROS]))  # PB-39
app.include_router(tipo_pieza_router, dependencies=_p([P_PARAMETROS, P_PRODUCCION], [P_PARAMETROS]))  # PB-40

# Roles, empleados e insumos (Axebiel)
app.include_router(rol_router, dependencies=_p([P_ROLES, P_USUARIOS], [P_ROLES]))
app.include_router(empleado_router, dependencies=_p([P_USUARIOS, P_PRODUCCION], [P_USUARIOS]))
app.include_router(insumo_router, dependencies=_p([P_INSUMOS, P_COMPRAS, P_PRODUCCION], [P_INSUMOS]))

# Clientes, categorías de insumo y compras (Emerson)
app.include_router(cliente_router, dependencies=_p([P_CLIENTES, P_REMISIONES, P_ENTREGAS], [P_CLIENTES]))
app.include_router(tipo_insumo_router, dependencies=_p([P_INSUMOS, P_COMPRAS], [P_INSUMOS]))
app.include_router(compra_router, dependencies=_p([P_COMPRAS], [P_COMPRAS]))

# Remisiones, insumos enviados, entregas y dashboard (Daniel)
# El cliente consulta, crea y edita SUS remisiones; aprobar, rechazar y eliminar es solo del personal.
app.include_router(remision_router, dependencies=_p(
    [P_REMISIONES, P_REMISION_CLIENTE, P_PRODUCCION, P_ENTREGAS, P_INSUMOS],
    [P_REMISIONES, P_REMISION_CLIENTE],
    por_metodo={"PATCH": (P_REMISIONES,), "DELETE": (P_REMISIONES,)},
    solo_personal=False))
app.include_router(insumo_enviado_router, dependencies=_p(
    [P_REMISIONES, P_REMISION_CLIENTE, P_INSUMOS, P_PRODUCCION], [P_REMISIONES, P_REMISION_CLIENTE],
    solo_personal=False))
app.include_router(entrega_router, dependencies=_p([P_ENTREGAS], [P_ENTREGAS]))
app.include_router(dashboard_router, dependencies=_p([P_DASHBOARD], [P_DASHBOARD]))

# ---------- Archivos subidos (fichas técnicas, remisiones firmadas, comprobantes) ----------
# Se sirven en http://localhost:8000/uploads/...
CARPETA_UPLOADS.mkdir(parents=True, exist_ok=True)
app.mount(URL_UPLOADS, StaticFiles(directory=CARPETA_UPLOADS), name="uploads")
