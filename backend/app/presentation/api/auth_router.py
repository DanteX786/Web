from fastapi import APIRouter, Depends, status

from core.config import settings
from app.application.auth_service import MENSAJE_CODIGO_ENVIADO, AuthService, Sesion
from app.domain.entities.usuario import Usuario
from app.presentation.dependencies.auth_dependencies import get_auth_service, get_usuario_actual
from app.presentation.schemas.auth_schema import (
    CambiarContrasenaEntrada, CodigoEnviadoRespuesta, ContrasenaActualEntrada,
    ContrasenaActualRespuesta, CorreoEntrada, LoginEntrada,
    MensajeRespuesta, PerfilEntrada, RegistroClienteEntrada, RestablecerEntrada, SesionRespuesta,
    TokenRestablecerRespuesta, UsuarioRespuesta, VerificarCodigoEntrada,
)

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

MENSAJE_SESIONES_CERRADAS = (
    "Contraseña actualizada. Por seguridad cerramos tu sesión en todos los dispositivos: inicia sesión con la nueva contraseña."
)


def _sesion(s: Sesion) -> dict:
    return {"access_token": s.token, "token_type": "bearer", "usuario": s.usuario}


def _codigo_enviado() -> dict:
    return {"mensaje": MENSAJE_CODIGO_ENVIADO,
            "segundos_reenvio": settings.CODIGO_SEGUNDOS_REENVIO,
            "minutos_vigencia": settings.CODIGO_MINUTOS_VIGENCIA}


# ------------------------------------------------------------------ Sesión
@router.post("/login", response_model=SesionRespuesta, summary="Iniciar sesión (empleados y clientes)")
def login(datos: LoginEntrada, service: AuthService = Depends(get_auth_service)):
    return _sesion(service.iniciar_sesion(datos.correo, datos.contrasena))


@router.get("/me", response_model=UsuarioRespuesta, summary="Datos del usuario con sesión (valida que siga activa)")
def me(usuario: Usuario = Depends(get_usuario_actual)):
    return usuario


@router.put("/perfil", response_model=UsuarioRespuesta, summary="Editar Mi perfil (solo clientes)")
def actualizar_perfil(datos: PerfilEntrada,
                      usuario: Usuario = Depends(get_usuario_actual),
                      service: AuthService = Depends(get_auth_service)):
    return service.actualizar_perfil(usuario, datos.nombre, datos.correo, datos.tipo_telefono,
                                     datos.telefono, datos.direccion, datos.nombre_contacto)


# ------------------------------------------------------------------ Registro
@router.post("/registro", response_model=SesionRespuesta, status_code=status.HTTP_201_CREATED,
             summary="Registro de clientes (solo los clientes crean su cuenta)")
def registro(datos: RegistroClienteEntrada, service: AuthService = Depends(get_auth_service)):
    return _sesion(service.registrar_cliente(
        tipo_documento=datos.tipo_documento, numero_documento=datos.numero_documento,
        nombre=datos.nombre, nombre_contacto=datos.nombre_contacto, correo=datos.correo,
        tipo_telefono=datos.tipo_telefono, telefono=datos.telefono, direccion=datos.direccion,
        contrasena=datos.contrasena, confirmar=datos.confirmar_contrasena,
    ))


# ------------------------------------------------------------------ Recuperación
@router.post("/recuperar", response_model=CodigoEnviadoRespuesta,
             summary="Enviar código de 6 dígitos al correo (vence en 5 min)")
def recuperar(datos: CorreoEntrada, service: AuthService = Depends(get_auth_service)):
    service.solicitar_codigo(datos.correo)
    return _codigo_enviado()


@router.post("/reenviar-codigo", response_model=CodigoEnviadoRespuesta,
             summary="Reenviar código (cada 15 s); el código anterior deja de servir")
def reenviar_codigo(datos: CorreoEntrada, service: AuthService = Depends(get_auth_service)):
    service.solicitar_codigo(datos.correo)
    return _codigo_enviado()


@router.post("/verificar-codigo", response_model=TokenRestablecerRespuesta,
             summary="Validar el código; devuelve un permiso temporal para cambiar la contraseña")
def verificar_codigo(datos: VerificarCodigoEntrada, service: AuthService = Depends(get_auth_service)):
    return {"token_restablecer": service.verificar_codigo(datos.correo, datos.codigo),
            "minutos_vigencia": settings.JWT_MINUTOS_RESTABLECER}


@router.post("/restablecer", response_model=MensajeRespuesta,
             summary="Guardar la nueva contraseña; cierra todas las sesiones")
def restablecer(datos: RestablecerEntrada, service: AuthService = Depends(get_auth_service)):
    service.restablecer_contrasena(datos.token_restablecer, datos.nueva_contrasena, datos.confirmar_contrasena)
    return {"mensaje": MENSAJE_SESIONES_CERRADAS}


# ------------------------------------------------------------------ Usuario con sesión
@router.post("/verificar-contrasena-actual", response_model=ContrasenaActualRespuesta,
             summary="Mi perfil: comprobar la contraseña actual mientras se escribe (máx. 10 por minuto)")
def verificar_contrasena_actual(datos: ContrasenaActualEntrada,
                                usuario: Usuario = Depends(get_usuario_actual),
                                service: AuthService = Depends(get_auth_service)):
    return {"correcta": service.verificar_contrasena_actual(usuario, datos.contrasena_actual)}


@router.post("/cambiar-contrasena", response_model=MensajeRespuesta,
             summary="Cambiar contraseña desde Mi perfil (solo clientes); cierra TODAS las sesiones")
def cambiar_contrasena(datos: CambiarContrasenaEntrada,
                       usuario: Usuario = Depends(get_usuario_actual),
                       service: AuthService = Depends(get_auth_service)):
    service.cambiar_contrasena(usuario, datos.contrasena_actual, datos.nueva_contrasena, datos.confirmar_contrasena)
    return {"mensaje": MENSAJE_SESIONES_CERRADAS}


@router.post("/cerrar-sesiones", response_model=MensajeRespuesta, summary="Cerrar sesión en todos los dispositivos")
def cerrar_sesiones(usuario: Usuario = Depends(get_usuario_actual),
                    service: AuthService = Depends(get_auth_service)):
    service.cerrar_todas_las_sesiones(usuario)
    return {"mensaje": "Se cerró la sesión en todos los dispositivos."}
