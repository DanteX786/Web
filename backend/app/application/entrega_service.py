from app.application.archivos import validar_archivo
from app.domain.entities.entrega import Entrega, RemisionPorEntregar
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.archivo_storage import IArchivoStorage
from app.domain.interfaces.entrega_repository import IEntregaRepository


class EntregaService:
    """Remisión de entrega: cuando la producción termina se entregan las prendas,
    el cliente firma la remisión (se imprime dos veces) y luego paga por transferencia.

    Reglas de negocio:
    - Solo se entrega una remisión Terminada.
    - Regla del taller: una sola entrega por remisión y siempre COMPLETA
      (cantidad_entregada = total de prendas). Al registrarla, la remisión pasa
      a "Entregada" (lo hace la BD).
    - Se crea desde el botón "Enviar a remisión de entrega" de Remisiones.
    - La entrega NO se edita: precio = prendas x costo por prenda (lo calcula la BD)
      y fecha = hoy. Así nadie puede alterar los valores cobrados.
    - La remisión firmada y la factura / comprobante se pueden subir y cambiar
      mientras la entrega NO esté Pagada. Al marcarla Pagada quedan bloqueados.
    - Solo se marca "Pagada" si ya se subió el comprobante (CA_29_01).
    """

    def __init__(self, repo: IEntregaRepository, storage: IArchivoStorage):
        self.repo = repo
        self.storage = storage

    # ---------- consultas ----------
    def listar(self, estado: str | None = None, id_remision: str | None = None) -> list[Entrega]:
        return self.repo.listar(estado, id_remision)

    def obtener(self, id_entrega: str) -> Entrega:
        entrega = self.repo.obtener(id_entrega)
        if not entrega:
            raise NotFoundError(f"No existe la remisión de entrega {id_entrega}.")
        return entrega

    def remisiones_por_entregar(self) -> list[RemisionPorEntregar]:
        return self.repo.remisiones_por_entregar()

    # ---------- escritura ----------
    def crear(self, id_remision: str, id_responsable: str) -> Entrega:
        if self.repo.existe_entrega_de(id_remision):
            raise ConflictError(f"La remisión {id_remision} ya tiene su remisión de entrega.")
        pendientes = {r.id_remision: r for r in self.repo.remisiones_por_entregar()}
        remision = pendientes.get(id_remision)
        if not remision:
            raise ConflictError(
                f"La remisión {id_remision} no está Terminada: solo se entregan remisiones Terminadas."
            )
        nuevo_id = self.repo.crear(id_remision, remision.total_prendas, None, None, id_responsable)
        return self.obtener(nuevo_id)

    def _editable(self, id_entrega: str) -> Entrega:
        entrega = self.obtener(id_entrega)
        if entrega.estado == "Pagada":
            raise ConflictError("La entrega ya está Pagada: no se puede modificar.")
        return entrega

    def _subir_soporte(self, id_entrega: str, campo: str, carpeta: str,
                       nombre: str | None, contenido: bytes) -> Entrega:
        """Sube o reemplaza un soporte. Solo mientras la entrega no esté Pagada."""
        actual = self._editable(id_entrega)
        extension = validar_archivo(nombre, contenido)
        url = self.storage.guardar(contenido, extension, carpeta, id_entrega)
        self.repo.guardar_url(id_entrega, campo, url)
        self.storage.eliminar(getattr(actual, campo))  # el archivo anterior ya no se usa
        return self.obtener(id_entrega)

    def subir_remision_firmada(self, id_entrega: str, nombre: str | None, contenido: bytes) -> Entrega:
        return self._subir_soporte(id_entrega, "remision_firmada_url", "remisiones-firmadas", nombre, contenido)

    def subir_comprobante(self, id_entrega: str, nombre: str | None, contenido: bytes) -> Entrega:
        return self._subir_soporte(id_entrega, "comprobante_pago_url", "comprobantes", nombre, contenido)

    def marcar_pagada(self, id_entrega: str) -> Entrega:
        actual = self._editable(id_entrega)
        if not actual.comprobante_pago_url:
            raise ConflictError("Suba primero el comprobante de pago para marcarla como Pagada.")
        self.repo.marcar_pagada(id_entrega)
        return self.obtener(id_entrega)
