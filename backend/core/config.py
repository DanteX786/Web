from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ruta absoluta al .env (backend/.env), funciona sin importar desde dónde se ejecute
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    FRONTEND_URL: str = "http://localhost:5173"

    # ---------- Sesión (JWT) ----------
    JWT_ALGORITMO: str = "HS256"
    JWT_MINUTOS_SESION: int = 480          # 8 horas = una jornada
    JWT_MINUTOS_RESTABLECER: int = 10      # tiempo para escribir la nueva contraseña tras validar el código

    # ---------- Recuperación de contraseña ----------
    CODIGO_MINUTOS_VIGENCIA: int = 5       # el código vence a los 5 minutos
    CODIGO_SEGUNDOS_REENVIO: int = 15      # espera para poder reenviar
    CODIGO_MAX_INTENTOS: int = 5

    # ---------- Invitación a clientes registrados por el taller ----------
    HORAS_INVITACION_CLIENTE: int = 72     # el enlace para activar la cuenta vence a las 72 horas

    # ---------- Correo (Gmail con contraseña de aplicación) ----------
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PUERTO: int = 587
    SMTP_USUARIO: str = ""                 # ej. juancamilovalle25@gmail.com
    SMTP_CONTRASENA: str = ""              # contraseña de aplicación de 16 letras (sin espacios)
    SMTP_REMITENTE: str = "Eslabón - Taller y Confecciones CDS"

    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")


settings = Settings()
