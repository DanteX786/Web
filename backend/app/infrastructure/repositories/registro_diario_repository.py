from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.domain.entities.registro_diario import RegistroDiario
from app.domain.interfaces.registro_diario_repository import IRegistroDiarioRepository
from app.infrastructure.database.produccion_models import RegistroDiarioModel

ID_ROL_ADMINISTRADOR = "ROL00001"


class RegistroDiarioRepository(IRegistroDiarioRepository):
    def __init__(self, db: Session):
        self.db = db

    def listar(self, id_empleado: str | None = None, id_produccion: str | None = None,
               desde: date | None = None, hasta: date | None = None) -> list[RegistroDiario]:
        condiciones, params = [], {}
        if id_empleado:
            condiciones.append("id_empleado = :id_empleado")
            params["id_empleado"] = id_empleado
        if id_produccion:
            condiciones.append("id_produccion = :id_produccion")
            params["id_produccion"] = id_produccion
        if desde:
            condiciones.append("fecha::date >= :desde")
            params["desde"] = desde
        if hasta:
            condiciones.append("fecha::date <= :hasta")
            params["hasta"] = hasta
        sql = "SELECT * FROM vw_historial_registro_diario"
        if condiciones:
            sql += " WHERE " + " AND ".join(condiciones)
        sql += " ORDER BY fecha DESC"
        return [RegistroDiario(**fila) for fila in self.db.execute(text(sql), params).mappings()]

    def obtener(self, id_registro: str) -> RegistroDiario | None:
        fila = self.db.execute(
            text("SELECT * FROM vw_historial_registro_diario WHERE id_registro_diario = :id"),
            {"id": id_registro},
        ).mappings().first()
        return RegistroDiario(**fila) if fila else None

    def crear(self, id_detalle_de_produccion: str, cantidad: int) -> str:
        # La fecha/hora la pone la base de datos (CA_56_02)
        m = RegistroDiarioModel(id_detalle_de_produccion=id_detalle_de_produccion, cantidad=cantidad)
        self.db.add(m)
        self.db.flush()
        nuevo_id = m.id_registro_diario
        self.db.commit()
        return nuevo_id

    def eliminar(self, id_registro: str) -> None:
        m = self.db.get(RegistroDiarioModel, id_registro)
        self.db.delete(m)
        self.db.commit()

    def empleado_de_asignacion(self, id_detalle_de_produccion: str) -> str | None:
        return self.db.execute(
            text("SELECT id_empleado FROM tb_detalle_de_produccion WHERE id_detalle_de_produccion = :id"),
            {"id": id_detalle_de_produccion},
        ).scalar()

    def es_administrador(self, id_empleado: str) -> bool:
        return bool(self.db.execute(
            text("SELECT EXISTS (SELECT 1 FROM empleados WHERE id_empleados = :id AND id_rol = :rol)"),
            {"id": id_empleado, "rol": ID_ROL_ADMINISTRADOR},
        ).scalar())
