from app.domain.entities.compra import Compra
from app.domain.exceptions.errors import ConflictError, NotFoundError
from app.domain.interfaces.compra_repository import ICompraRepository


class CompraService:
    """Gestión de compras de insumos.

    Reglas de negocio:
    - Todos los insumos deben existir.
    - Una compra debe tener al menos un insumo, y cada insumo aparece una sola vez.
    - El proveedor debe estar activo.
    - El total y el stock los maneja la base de datos (trigger trg_detalle_compra_stock):
      registrar una compra suma al stock; editarla o eliminarla lo corrige, y si lo
      comprado ya se usó en producción, la base de datos rechaza la operación.
    """

    def __init__(self, repo: ICompraRepository):
        self.repo = repo

    # ---------- validaciones ----------
    def _validar_proveedor(self, datos: dict) -> None:
        id_proveedor = datos.get("id_proveedor")
        if id_proveedor and not self.repo.existe_proveedor(id_proveedor):
            raise NotFoundError(f"El proveedor {id_proveedor} no existe o está inactivo.")

    def _validar_insumos(self, ids: list[str]) -> None:
        faltantes = self.repo.insumos_inexistentes(ids)
        if faltantes:
            raise NotFoundError(f"No existen los insumos: {', '.join(faltantes)}.")

    def _linea(self, compra: Compra, id_insumo: str):
        for d in compra.detalles:
            if d.id_insumo == id_insumo:
                return d
        raise NotFoundError(f"La compra {compra.id} no tiene el insumo {id_insumo}.")

    # ---------- consultas ----------
    def listar(self, id_proveedor: str | None = None) -> list[Compra]:
        return self.repo.listar(id_proveedor)

    def obtener(self, id_compra: str) -> Compra:
        compra = self.repo.obtener(id_compra)
        if not compra:
            raise NotFoundError(f"No existe la compra {id_compra}.")
        return compra

    # ---------- compra completa ----------
    def crear(self, datos: dict) -> Compra:
        detalles = datos.pop("detalles")
        ids = [d["id_insumo"] for d in detalles]
        repetidos = sorted({i for i in ids if ids.count(i) > 1})
        if repetidos:
            raise ConflictError(
                f"Cada insumo debe aparecer una sola vez en la compra. Repetidos: {', '.join(repetidos)}."
            )
        self._validar_proveedor(datos)
        self._validar_insumos(ids)
        return self.repo.crear(datos, detalles)

    def actualizar(self, id_compra: str, datos: dict) -> Compra:
        """Solo cambia la cabecera (fecha, proveedor, descripción)."""
        self.obtener(id_compra)
        self._validar_proveedor(datos)
        return self.repo.actualizar_cabecera(id_compra, datos)

    def eliminar(self, id_compra: str) -> None:
        self.obtener(id_compra)
        self.repo.eliminar(id_compra)

    # ---------- líneas de detalle ----------
    def agregar_detalle(self, id_compra: str, detalle: dict) -> Compra:
        compra = self.obtener(id_compra)
        if any(d.id_insumo == detalle["id_insumo"] for d in compra.detalles):
            raise ConflictError(
                f"El insumo {detalle['id_insumo']} ya está en esta compra. Edite esa línea en lugar de agregarla otra vez."
            )
        self._validar_insumos([detalle["id_insumo"]])
        return self.repo.agregar_detalle(id_compra, detalle)

    def actualizar_detalle(self, id_compra: str, id_insumo: str, cambios: dict) -> Compra:
        compra = self.obtener(id_compra)
        actual = self._linea(compra, id_insumo)
        nuevo = {
            "id_insumo": cambios.get("id_insumo") or actual.id_insumo,
            "cantidad": cambios.get("cantidad", actual.cantidad),
            "valor_unitario": cambios.get("valor_unitario", actual.valor_unitario),
        }
        if nuevo["id_insumo"] != id_insumo:
            if any(d.id_insumo == nuevo["id_insumo"] for d in compra.detalles):
                raise ConflictError(f"El insumo {nuevo['id_insumo']} ya está en esta compra.")
            self._validar_insumos([nuevo["id_insumo"]])
        return self.repo.reemplazar_detalle(id_compra, id_insumo, nuevo)

    def eliminar_detalle(self, id_compra: str, id_insumo: str) -> Compra:
        compra = self.obtener(id_compra)
        self._linea(compra, id_insumo)  # lanza 404 si la línea no existe
        if len(compra.detalles) == 1:
            raise ConflictError(
                "La compra debe tener al menos un insumo. Si quiere quitarlo, elimine la compra completa."
            )
        return self.repo.eliminar_detalle(id_compra, id_insumo)
