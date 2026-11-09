from datetime import date

from app.domain.entities.produccion import (
    Asignacion, LineaRemision, NuevaAsignacion, Produccion, RemisionDisponible,
)
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.produccion_repository import IProduccionRepository


class ProduccionService:
    """Casos de uso del proceso de Producción (HU_51 a HU_54).

    Las reglas fuertes (remisión Aprobada, una sola producción en proceso, stock,
    no pasarse de lo pedido) las valida también la base de datos con triggers;
    aquí se validan las más comunes para dar mensajes claros.
    """

    def __init__(self, repo: IProduccionRepository):
        self.repo = repo

    # ------------------------------------------------------------------ Producción
    def listar(self, estado: str | None = None) -> list[Produccion]:
        return self.repo.listar(estado)

    def obtener(self, id_produccion: str) -> Produccion:
        produccion = self.repo.obtener(id_produccion)
        if not produccion:
            raise NotFoundError(f"No existe la producción {id_produccion}.")
        return produccion

    def remisiones_disponibles(self) -> list[RemisionDisponible]:
        return self.repo.remisiones_disponibles()

    def lineas_remision(self, id_produccion: str) -> list[LineaRemision]:
        self.obtener(id_produccion)
        return self.repo.lineas_remision(id_produccion)

    def crear(self, id_remision: str, fecha_entrega: date | None, id_responsable: str) -> Produccion:
        if self.repo.listar(estado="En proceso"):
            raise ConflictError("Ya hay una producción En proceso. Finalícela antes de iniciar otra.")
        disponibles = {r.id_remision for r in self.repo.remisiones_disponibles()}
        if id_remision not in disponibles:
            raise ConflictError(f"La remisión {id_remision} no está Aprobada o ya tiene producción.")
        nuevo_id = self.repo.crear(id_remision, fecha_entrega, id_responsable)
        return self.obtener(nuevo_id)

    def finalizar(self, id_produccion: str, id_responsable: str) -> Produccion:
        produccion = self.obtener(id_produccion)
        if produccion.estado == "Finalizada":
            raise ConflictError("La producción ya está Finalizada.")
        if produccion.total_asignado == 0:
            raise ConflictError("No se puede finalizar una producción sin asignaciones.")
        self.repo.finalizar(id_produccion, id_responsable)
        return self.obtener(id_produccion)

    # ------------------------------------------------------------------ Asignaciones
    def listar_asignaciones(self, id_produccion: str | None = None, id_empleado: str | None = None,
                            solo_en_proceso: bool = False) -> list[Asignacion]:
        return self.repo.listar_asignaciones(id_produccion, id_empleado, solo_en_proceso)

    def obtener_asignacion(self, id_detalle: str) -> Asignacion:
        asignacion = self.repo.obtener_asignacion(id_detalle)
        if not asignacion:
            raise NotFoundError(f"No existe la asignación {id_detalle}.")
        return asignacion

    def crear_asignacion(self, id_produccion: str, datos: NuevaAsignacion) -> Asignacion:
        produccion = self.obtener(id_produccion)
        if produccion.estado != "En proceso":
            raise ConflictError("Solo se puede asignar trabajo a una producción En proceso.")
        self._validar_insumo(datos)
        nuevo_id = self.repo.crear_asignacion(id_produccion, datos)
        return self.obtener_asignacion(nuevo_id)

    def actualizar_asignacion(self, id_detalle: str, datos: NuevaAsignacion) -> Asignacion:
        asignacion = self.obtener_asignacion(id_detalle)
        if asignacion.estado_produccion != "En proceso":
            raise ConflictError("No se pueden editar asignaciones de una producción Finalizada.")
        if datos.cantidad_asignada < asignacion.cantidad_realizada:
            raise ConflictError(
                f"El empleado ya reportó {asignacion.cantidad_realizada} unidades; "
                f"no puede asignarle menos que eso.")
        self._validar_insumo(datos)
        self.repo.actualizar_asignacion(id_detalle, datos)
        return self.obtener_asignacion(id_detalle)

    def eliminar_asignacion(self, id_detalle: str) -> None:
        asignacion = self.obtener_asignacion(id_detalle)
        if asignacion.cantidad_realizada > 0:
            raise ConflictError("No se puede eliminar: la asignación ya tiene reportes diarios.")
        self.repo.eliminar_asignacion(id_detalle)

    @staticmethod
    def _validar_insumo(datos: NuevaAsignacion) -> None:
        tiene_insumo = bool(datos.id_insumos) or bool(datos.id_insumos_enviados_x_cliente)
        if datos.id_insumos and datos.id_insumos_enviados_x_cliente:
            raise ConflictError("Elija un insumo del taller O uno enviado por el cliente, no los dos.")
        if tiene_insumo and not datos.cantidad_insumo:
            raise ConflictError("Indique la cantidad de insumo a usar.")
        if not tiene_insumo:
            datos.cantidad_insumo = None
