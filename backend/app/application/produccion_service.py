from app.domain.entities.produccion import (
    Asignacion, EmpleadoDisponibilidad, FaltantePaso, LineaRemision, MaquinaDisponibilidad, NuevaAsignacion,
    NuevoPaso, PasoProduccion, Produccion, RemisionDisponible, SeguimientoProduccion,
)
from app.domain.exceptions.errors import ConflictError, NotFoundError, ValidacionError
from app.domain.interfaces.produccion_repository import IProduccionRepository

POR_ASIGNAR = "Por asignar"
EN_PRODUCCION = "En producción"
FINALIZADA = "Finalizada"


class ProduccionService:
    """Casos de uso del proceso de Producción.

    Flujo: la remisión Aprobada se "envía a producir" -> la producción nace en
    "Por asignar" con las tallas de la remisión -> se asignan las tareas
    (proceso + pieza + empleado + máquina libre + insumo) -> "Iniciar" la pasa a
    "En producción" -> "Finalizar" la cierra y la remisión queda Terminada.
    Se permiten varias producciones al mismo tiempo; las máquinas ocupadas no se
    pueden asignar. La base de datos valida todo esto también con triggers.
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

    def enviar_a_producir(self, id_remision: str, id_responsable: str) -> Produccion:
        existente = self.repo.produccion_de_remision(id_remision)
        if existente:
            raise ConflictError(f"La remisión {id_remision} ya se envió a producir ({existente}).")
        disponibles = {r.id_remision for r in self.repo.remisiones_disponibles()}
        if id_remision not in disponibles:
            raise ConflictError(f"Solo se puede enviar a producir una remisión Aprobada ({id_remision} no lo está).")
        nuevo_id = self.repo.crear(id_remision, id_responsable)
        return self.obtener(nuevo_id)

    def iniciar(self, id_produccion: str, id_responsable: str) -> Produccion:
        produccion = self.obtener(id_produccion)
        if produccion.estado != POR_ASIGNAR:
            raise ConflictError(f"Solo se inicia una producción Por asignar (actual: {produccion.estado}).")
        if not self.repo.pasos(id_produccion):
            raise ConflictError("Elija los procesos de la producción antes de iniciarla.")
        faltantes = self.repo.faltantes(id_produccion)
        if faltantes:
            f = faltantes[0]
            raise ConflictError(
                f"Falta asignar {f.cantidad - f.asignado} de {f.cantidad} unidades de {f.nombre_de_la_pieza} "
                f"talla {f.talla} en el paso {f.paso}.")
        self.repo.cambiar_estado(id_produccion, EN_PRODUCCION, id_responsable)
        return self.obtener(id_produccion)

    def finalizar(self, id_produccion: str, id_responsable: str) -> Produccion:
        produccion = self.obtener(id_produccion)
        if produccion.estado != EN_PRODUCCION:
            raise ConflictError(f"Solo se finaliza una producción En producción (actual: {produccion.estado}).")
        pendiente = produccion.total_asignado - produccion.total_realizado
        if pendiente > 0:
            raise ConflictError(f"No se puede finalizar: faltan {pendiente} unidades por reportar en las tareas.")
        self.repo.cambiar_estado(id_produccion, FINALIZADA, id_responsable)
        return self.obtener(id_produccion)

    def seguimiento(self, id_produccion: str) -> list[SeguimientoProduccion]:
        self.obtener(id_produccion)
        return self.repo.seguimiento(id_produccion)

    def pasos(self, id_produccion: str) -> list[PasoProduccion]:
        self.obtener(id_produccion)
        return self.repo.pasos(id_produccion)

    def guardar_pasos(self, id_produccion: str, pasos: list[NuevoPaso]) -> list[PasoProduccion]:
        """La administradora, viendo la ficha técnica, arma los pasos que lleva la prenda.

        El mismo proceso puede repetirse si cada paso tiene una descripción distinta.
        """
        produccion = self.obtener(id_produccion)
        if produccion.estado == FINALIZADA:
            raise ConflictError("La producción está Finalizada: no se pueden cambiar sus pasos.")
        if not pasos:
            raise ValidacionError("Agregue al menos un proceso.")
        actuales = {p.id_paso: p for p in self.repo.pasos(id_produccion)}
        vistos: set[tuple[str, str]] = set()
        for paso in pasos:
            paso.descripcion = " ".join((paso.descripcion or "").split()) or None
            if paso.id_paso and paso.id_paso not in actuales:
                raise ValidacionError(f"El paso {paso.id_paso} no es de esta producción.")
            if paso.id_paso:
                paso.id_proceso = actuales[paso.id_paso].id_proceso
            clave = (paso.id_proceso, (paso.descripcion or "").lower())
            if clave in vistos:
                raise ValidacionError(
                    "Un mismo proceso repetido debe tener una descripción distinta en cada paso "
                    "(ej. Bordado — logo en el pecho / Bordado — nombre en la manga).")
            vistos.add(clave)
        conservar = {p.id_paso for p in pasos if p.id_paso}
        con_tareas = {a.id_paso for a in self.repo.listar_asignaciones(id_produccion=id_produccion) if a.id_paso}
        quitados = [actuales[i].paso for i in actuales if i not in conservar and i in con_tareas]
        if quitados:
            raise ConflictError(f"No se puede quitar {', '.join(quitados)}: ya tiene tareas. Elimine primero esas tareas.")
        self.repo.guardar_pasos(id_produccion, pasos)
        return self.repo.pasos(id_produccion)

    def faltantes(self, id_produccion: str) -> list[FaltantePaso]:
        return self.repo.faltantes(id_produccion)

    def maquinas(self) -> list[MaquinaDisponibilidad]:
        return self.repo.maquinas()

    def empleados(self) -> list[EmpleadoDisponibilidad]:
        return self.repo.empleados()

    # ------------------------------------------------------------------ Tareas
    def listar_asignaciones(self, id_produccion: str | None = None, id_empleado: str | None = None,
                            solo_en_produccion: bool = False) -> list[Asignacion]:
        return self.repo.listar_asignaciones(id_produccion, id_empleado, solo_en_produccion)

    def obtener_asignacion(self, id_detalle: str) -> Asignacion:
        asignacion = self.repo.obtener_asignacion(id_detalle)
        if not asignacion:
            raise NotFoundError(f"No existe la tarea {id_detalle}.")
        return asignacion

    def crear_asignacion(self, id_produccion: str, datos: NuevaAsignacion) -> Asignacion:
        produccion = self.obtener(id_produccion)
        if produccion.estado == FINALIZADA:
            raise ConflictError("La producción está Finalizada: no se pueden asignar tareas.")
        self._validar(datos)
        self._validar_paso(id_produccion, datos)
        self._validar_empleado(datos.id_empleado)
        self._validar_maquina(datos.id_tipo_maquina)
        nuevo_id = self.repo.crear_asignacion(id_produccion, datos)
        return self.obtener_asignacion(nuevo_id)

    def actualizar_asignacion(self, id_detalle: str, datos: NuevaAsignacion) -> Asignacion:
        asignacion = self.obtener_asignacion(id_detalle)
        if asignacion.estado_produccion == FINALIZADA:
            raise ConflictError("No se pueden editar tareas de una producción Finalizada.")
        if datos.cantidad_asignada < asignacion.cantidad_realizada:
            raise ConflictError(
                f"El empleado ya reportó {asignacion.cantidad_realizada} unidades; "
                f"no puede asignarle menos que eso.")
        self._validar(datos)
        self._validar_paso(asignacion.id_produccion, datos)
        if datos.id_empleado != asignacion.id_empleado:
            self._validar_empleado(datos.id_empleado)
        if datos.id_tipo_maquina != asignacion.id_tipo_maquina:
            self._validar_maquina(datos.id_tipo_maquina)
        self.repo.actualizar_asignacion(id_detalle, datos)
        return self.obtener_asignacion(id_detalle)

    def eliminar_asignacion(self, id_detalle: str) -> None:
        asignacion = self.obtener_asignacion(id_detalle)
        if asignacion.estado_produccion == FINALIZADA:
            raise ConflictError("No se pueden eliminar tareas de una producción Finalizada.")
        if asignacion.cantidad_realizada > 0:
            raise ConflictError("No se puede eliminar: la tarea ya tiene reportes diarios.")
        self.repo.eliminar_asignacion(id_detalle)

    def _validar_paso(self, id_produccion: str, datos: NuevaAsignacion) -> None:
        """El paso debe ser de la producción y la máquina debe servir para su proceso."""
        paso = next((p for p in self.repo.pasos(id_produccion) if p.id_paso == datos.id_paso), None)
        if paso is None:
            raise ConflictError("Ese paso no es de esta producción. Elija uno de los procesos de la prenda.")
        if paso.maquinas and datos.id_tipo_maquina not in paso.maquinas:
            raise ConflictError(f"Esa máquina no sirve para el proceso {paso.proceso}. Elija una de sus máquinas.")

    def _validar_empleado(self, id_empleado: str) -> None:
        """Un empleado con una tarea pendiente no recibe otra hasta que termine."""
        empleado = next((e for e in self.repo.empleados() if e.id_empleado == id_empleado), None)
        if empleado is None:
            raise ValidacionError("El empleado no existe o está inactivo.")
        if not empleado.presente_hoy:
            raise ConflictError(
                f"{empleado.nombre} no está marcado como Presente en la asistencia de hoy: "
                f"no se le pueden asignar tareas.")
        if not empleado.disponible:
            raise ConflictError(
                f"{empleado.nombre} está ocupado: tiene {empleado.unidades_pendientes} unidades pendientes "
                f"en la tarea {empleado.ocupado_en_tarea} (producción {empleado.ocupado_en_produccion}). "
                f"Asígnele otra tarea cuando termine.")

    def _validar_maquina(self, id_maquina: str) -> None:
        maquina = next((m for m in self.repo.maquinas() if m.id_maquina == id_maquina), None)
        if maquina is None:
            raise ValidacionError("La máquina no existe o está inactiva.")
        if not maquina.disponible:
            raise ConflictError(
                f"La máquina {maquina.nombre} está ocupada por {maquina.ocupada_por_empleado} "
                f"(producción {maquina.ocupada_en_produccion}). Elija otra o espere a que termine.")

    @staticmethod
    def _validar(datos: NuevaAsignacion) -> None:
        if not datos.id_paso:
            raise ValidacionError("Elija el proceso (paso) de la tarea.")
        tiene_insumo = bool(datos.id_insumos) or bool(datos.id_insumos_enviados_x_cliente)
        if datos.id_insumos and datos.id_insumos_enviados_x_cliente:
            raise ValidacionError("Elija un insumo del taller O uno enviado por el cliente, no los dos.")
        if tiene_insumo and not datos.cantidad_insumo:
            raise ValidacionError("Indique la cantidad de insumo a usar.")
        if not tiene_insumo:
            datos.cantidad_insumo = None
