from app.application.archivos import validar_archivo
from app.domain.entities.remision import Remision
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.archivo_storage import IArchivoStorage
from app.domain.interfaces.remision_repository import IRemisionRepository


class RemisionService:
    """Gestión de remisiones (lo que manda el cliente: prendas, tallas, ficha e insumos).

    Flujo de estados (lo valida también la BD con trg_validar_estado_remision):
        Pendiente -> Aprobada | Rechazada      (aquí: aprobar / rechazar)
        Aprobada  -> En producción | Rechazada (En producción la pone el módulo de Producción)
        En producción -> Terminada             (al finalizar la producción)
        Terminada -> Entregada                 (al registrar la remisión de entrega)

    Reglas de negocio:
    - El cliente debe existir y estar activo.
    - Debe tener al menos una prenda, y cada (prenda, talla) aparece una sola vez.
    - Solo se edita, o se borra, mientras está Pendiente (o Rechazada para borrar).
    - total_prendas y costo_total los calcula la base de datos.
    """

    def __init__(self, repo: IRemisionRepository, storage: IArchivoStorage):
        self.repo = repo
        self.storage = storage

    # ---------- validaciones ----------
    @staticmethod
    def _validar_detalles(detalles: list[dict]) -> None:
        vistos = set()
        for d in detalles:
            clave = (d["nombre_de_la_pieza"].strip().lower(), d["talla"].strip().lower())
            if clave in vistos:
                raise ConflictError(
                    f"La prenda '{d['nombre_de_la_pieza']}' talla {d['talla']} está repetida. "
                    "Sume las cantidades en una sola línea."
                )
            vistos.add(clave)

    @staticmethod
    def _validar_fechas(fecha_recibo, fecha_entrega) -> None:
        if fecha_recibo and fecha_entrega and fecha_entrega < fecha_recibo:
            raise ConflictError("La fecha de entrega no puede ser anterior a la fecha de recibo.")

    # ---------- consultas ----------
    def listar(self, estado: str | None = None, nit_cliente: str | None = None) -> list[Remision]:
        return self.repo.listar(estado, nit_cliente)

    def obtener(self, id_remision: str) -> Remision:
        remision = self.repo.obtener(id_remision)
        if not remision:
            raise NotFoundError(f"No existe la remisión {id_remision}.")
        return remision

    # ---------- escritura ----------
    def crear(self, datos: dict, id_responsable: str | None) -> Remision:
        detalles = datos.pop("detalles")
        insumos = datos.pop("insumos", None) or []
        if not self.repo.cliente_activo(datos["nit_cliente"]):
            raise NotFoundError(f"El cliente {datos['nit_cliente']} no existe o está inactivo.")
        self._validar_detalles(detalles)
        self._validar_fechas(datos.get("fecha_recibo"), datos.get("fecha_entrega"))
        nuevo_id = self.repo.crear(datos, detalles, insumos, id_responsable)
        return self.obtener(nuevo_id)

    def actualizar(self, id_remision: str, datos: dict) -> Remision:
        actual = self.obtener(id_remision)
        if actual.estado != "Pendiente":
            raise ConflictError(
                f"Solo se puede editar una remisión Pendiente (estado actual: {actual.estado})."
            )
        detalles = datos.pop("detalles", None)
        insumos = datos.pop("insumos", None)
        if detalles is not None:
            self._validar_detalles(detalles)
        self._validar_fechas(datos.get("fecha_recibo", actual.fecha_recibo),
                             datos.get("fecha_entrega", actual.fecha_entrega))
        self.repo.actualizar(id_remision, datos, detalles, insumos)
        return self.obtener(id_remision)

    def aprobar(self, id_remision: str, id_responsable: str) -> Remision:
        actual = self.obtener(id_remision)
        if actual.estado != "Pendiente":
            raise ConflictError(f"Solo se aprueban remisiones Pendientes (estado actual: {actual.estado}).")
        if actual.total_prendas == 0:
            raise ConflictError("No se puede aprobar una remisión sin prendas.")
        self.repo.cambiar_estado(id_remision, "Aprobada", id_responsable)
        return self.obtener(id_remision)

    def rechazar(self, id_remision: str, motivo: str, id_responsable: str) -> Remision:
        actual = self.obtener(id_remision)
        if actual.estado not in ("Pendiente", "Aprobada"):
            raise ConflictError(
                f"Solo se rechazan remisiones Pendientes o Aprobadas (estado actual: {actual.estado})."
            )
        if self.repo.tiene_produccion(id_remision):
            raise ConflictError("La remisión ya tiene producción: no se puede rechazar.")
        self.repo.cambiar_estado(id_remision, "Rechazada", id_responsable, observaciones=motivo)
        return self.obtener(id_remision)

    def eliminar(self, id_remision: str) -> None:
        actual = self.obtener(id_remision)
        if actual.estado not in ("Pendiente", "Rechazada"):
            raise ConflictError(
                f"Solo se eliminan remisiones Pendientes o Rechazadas (estado actual: {actual.estado})."
            )
        self.repo.eliminar(id_remision)
        self.storage.eliminar(actual.ficha_tecnica_url)

    def subir_ficha(self, id_remision: str, nombre_archivo: str | None, contenido: bytes,
                    renombrar: bool = False) -> Remision:
        """Guarda la foto o PDF de la ficha técnica (CA_24_01). Reemplaza la anterior."""
        actual = self.obtener(id_remision)
        if actual.estado in ("Rechazada", "Entregada"):
            raise ConflictError(f"No se puede cambiar la ficha de una remisión {actual.estado}.")
        extension = validar_archivo(nombre_archivo, contenido)
        url = self.storage.guardar(contenido, extension, "fichas", id_remision)
        self.repo.guardar_ficha_url(id_remision, url, nombre_archivo if renombrar else None)
        self.storage.eliminar(actual.ficha_tecnica_url)
        return self.obtener(id_remision)
