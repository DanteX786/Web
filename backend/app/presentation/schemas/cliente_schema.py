import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _limpiar(valor):
    """Quita espacios sobrantes y convierte los textos vacíos en None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None


TEXTOS = ("nit", "nombre", "direccion", "correo", "telefono")
PATRON_CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# Así se guarda en la base de datos (columna estado, default 'Activo')
Estado = Literal["Activo", "Inactivo"]


def _validar_formato(campo: str, valor):
    if valor is None:
        return valor
    if campo == "nombre" and not re.fullmatch(r"[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+", valor):
        raise ValueError("solo puede contener letras y espacios")
    if campo == "telefono" and not re.fullmatch(r"\d{7,20}", valor):
        raise ValueError("debe tener solo números (entre 7 y 20 dígitos)")
    if campo == "correo" and not PATRON_CORREO.match(valor):
        raise ValueError("no es un correo válido")
    if campo == "nit" and not re.fullmatch(r"[0-9\-]+", valor):
        raise ValueError("solo puede contener números y guiones")
    return valor


class ClienteCrear(BaseModel):
    nit: str = Field(max_length=30, description="Identificación / NIT del cliente")
    nombre: str = Field(max_length=100)
    direccion: str | None = Field(default=None, max_length=150)
    correo: str = Field(max_length=100)
    telefono: str | None = Field(default=None, max_length=20)
    estado: Estado = "Activo"
    contrasena: str = Field(min_length=6, max_length=72, description="Se guarda encriptada")

    _limpiar_textos = field_validator(*TEXTOS, mode="before")(lambda cls, v: _limpiar(v))

    @field_validator("nit", "nombre", "correo", "telefono")
    @classmethod
    def formato(cls, valor, info):
        return _validar_formato(info.field_name, valor)


class ClienteActualizar(BaseModel):
    """Todos los campos son opcionales: solo se cambian los que se envían.
    El NIT no se edita porque es la llave del cliente.
    La contraseña solo se cambia si se envía."""
    nombre: str | None = Field(default=None, max_length=100)
    direccion: str | None = Field(default=None, max_length=150)
    correo: str | None = Field(default=None, max_length=100)
    telefono: str | None = Field(default=None, max_length=20)
    estado: Estado | None = None
    contrasena: str | None = Field(default=None, min_length=6, max_length=72)

    _limpiar_textos = field_validator(*TEXTOS[1:], mode="before")(lambda cls, v: _limpiar(v))

    @field_validator("nombre", "correo", "estado")
    @classmethod
    def no_vacio(cls, valor, info):
        if valor is None:
            raise ValueError("no puede quedar vacío")
        return _validar_formato(info.field_name, valor)

    @field_validator("telefono")
    @classmethod
    def telefono_valido(cls, valor):
        return _validar_formato("telefono", valor)


class ClienteRespuesta(BaseModel):
    """La contraseña nunca se devuelve."""
    model_config = ConfigDict(from_attributes=True)

    nit: str
    nombre: str
    direccion: str | None
    correo: str
    telefono: str | None
    estado: str
