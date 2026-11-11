from app.domain.entities.remision import InsumoEnviado
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.insumo_enviado_repository import IInsumoEnviadoRepository

# Mientras la remisión esté en uno de estos estados el cliente puede mandar o corregir insumos
ESTADOS_EDITABLES = ("Pendiente", "Aprobada", "En producción")


class InsumoEnviadoService:
    """Insumos que el cliente manda junto con la remisión (botones, hilos, cremalleras...).

    Reglas de negocio:
    - Solo se agregan / editan / borran mientras la remisión está Pendiente, Aprobada
      o En producción (una remisión Terminada, Entregada o Rechazada ya está cerrada).
    - Si parte del insumo ya se usó en producción, no se puede bajar la cantidad por
      debajo de lo usado, ni borrar el insumo.
    - cantidad_disponible la calcula la base de datos.
    """

    def __init__(self, repo: IInsumoEnviadoRepository):
        self.repo = repo

    def _validar_remision_abierta(self, id_remision: str) -> None:
        estado = self.repo.estado_remision(id_remision)
        if estado is None:
            raise NotFoundError(f"No existe la remisión {id_remision}.")
        if estado not in ESTADOS_EDITABLES:
            raise ConflictError(f"La remisión {id_remision} está {estado}: ya no se modifican sus insumos.")

    def listar(self, id_remision: str | None = None) -> list[InsumoEnviado]:
        return self.repo.listar(id_remision)

    def obtener(self, id_insumo_enviado: str) -> InsumoEnviado:
        insumo = self.repo.obtener(id_insumo_enviado)
        if not insumo:
            raise NotFoundError(f"No existe el insumo enviado {id_insumo_enviado}.")
        return insumo

    def crear(self, datos: dict) -> InsumoEnviado:
        id_remision = datos.pop("id_remision")
        self._validar_remision_abierta(id_remision)
        nuevo_id = self.repo.crear(id_remision, datos)
        return self.obtener(nuevo_id)

    def actualizar(self, id_insumo_enviado: str, cambios: dict) -> InsumoEnviado:
        actual = self.obtener(id_insumo_enviado)
        self._validar_remision_abierta(actual.id_remision)
        nuevo = {
            "nombre": cambios.get("nombre") or actual.nombre,
            "unidad": cambios.get("unidad") or actual.unidad,
            "cantidad": cambios.get("cantidad", actual.cantidad),
        }
        if nuevo["cantidad"] < actual.cantidad_usada:
            raise ConflictError(
                f"Ya se usaron {actual.cantidad_usada} {actual.unidad} en producción; "
                "la cantidad no puede ser menor a eso."
            )
        self.repo.actualizar(id_insumo_enviado, nuevo)
        return self.obtener(id_insumo_enviado)

    def eliminar(self, id_insumo_enviado: str) -> None:
        actual = self.obtener(id_insumo_enviado)
        self._validar_remision_abierta(actual.id_remision)
        if actual.cantidad_usada > 0 or self.repo.usado_en_produccion(id_insumo_enviado):
            raise ConflictError("No se puede eliminar: el insumo ya está asignado en producción.")
        self.repo.eliminar(id_insumo_enviado)
