from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from core.config import settings
from app.infrastructure.database.database import get_db
from app.domain.exceptions.errors import ConflictError, ForbiddenError, NotFoundError

# ---- Routers de Camilo ----
from app.presentation.api.produccion_router import asignaciones_router, router as produccion_router
from app.presentation.api.registro_diario_router import router as registro_diario_router
from app.presentation.api.seguimiento_router import router as seguimiento_router
# ---- Aquí cada compañero agrega el import de sus routers ----

# ---- Routers de Jordy ----
from app.presentation.api.proveedor_router import router as proveedor_router

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
app.include_router(produccion_router)
app.include_router(asignaciones_router)
app.include_router(registro_diario_router)
app.include_router(seguimiento_router)
app.include_router(proveedor_router)  # PB-36
# app.include_router(...)  <- routers de los demás módulos
