"""Modelos ORM de los módulos de Producción y Registro diario.

No se declaran ForeignKey hacia tablas de otros compañeros (empleados, insumos,
remisión...) para no depender de sus modelos: la base de datos ya valida esas
llaves foráneas por su cuenta.
"""
from datetime import date, datetime

from sqlalchemy import Date, DateTime, FetchedValue, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.database import Base


class ProduccionModel(Base):
    __tablename__ = "tb_produccion"

    id_produccion: Mapped[str] = mapped_column(String(10), primary_key=True, server_default=FetchedValue())
    id_remision: Mapped[str] = mapped_column(String(10))
    fecha_inicio: Mapped[date] = mapped_column(Date, server_default=FetchedValue())
    fecha_entrega: Mapped[date | None] = mapped_column(Date)
    estado: Mapped[str] = mapped_column(String(20), server_default=FetchedValue())


class DetalleProduccionModel(Base):
    __tablename__ = "tb_detalle_de_produccion"

    id_detalle_de_produccion: Mapped[str] = mapped_column(String(10), primary_key=True, server_default=FetchedValue())
    id_produccion: Mapped[str] = mapped_column(String(10))
    id_empleado: Mapped[str] = mapped_column(String(10))
    id_tipo_pieza: Mapped[str] = mapped_column(String(10))
    id_tipo_maquina: Mapped[str] = mapped_column(String(10))
    id_detalle_de_remision: Mapped[str] = mapped_column(String(10))
    id_insumos: Mapped[str | None] = mapped_column(String(10))
    id_insumos_enviados_x_cliente: Mapped[str | None] = mapped_column(String(10))
    cantidad_insumo: Mapped[int | None] = mapped_column(Integer)
    cantidad_asignada: Mapped[int] = mapped_column(Integer)
    fecha_asignada: Mapped[date] = mapped_column(Date, server_default=FetchedValue())


class RegistroDiarioModel(Base):
    __tablename__ = "tb_registro_diario"

    id_registro_diario: Mapped[str] = mapped_column(String(10), primary_key=True, server_default=FetchedValue())
    id_detalle_de_produccion: Mapped[str] = mapped_column(String(10))
    cantidad: Mapped[int] = mapped_column(Integer)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=FetchedValue())
