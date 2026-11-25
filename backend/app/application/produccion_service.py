from app.domain.entities.produccion import (
    Asignacion, EmpleadoDisponibilidad, FaltantePaso, LineaRemision, MaquinaDisponibilidad, NuevaAsignacion,
    NuevoPaso, NuevoReproceso, PasoProduccion, PiezaDefectuosa, Produccion, RemisionDisponible, Reproceso,
    SeguimientoProduccion,
)
from app.domain.exceptions.errors import ConflictError, NotFoundError, ValidacionError
from app.domain.interfaces.produccion_repository import IProduccionRepository

POR_ASIGNAR = "Por asignar"
EN_PRODUCCION = "En producción"
FINALIZADA = "Finalizada"


class ProduccionService:
    """Casos de uso del proceso de Producción.

    Flujo: al aprobar la remisión se crea sola la producción en "Por asignar"
    (trigger de la BD) -> se asignan las tareas (proceso + pieza + empleado +
    máquina libre + insumo) -> "Iniciar" (con al menos una tarea) la pasa a
    "En producción" y se sigue asignando mientras avanza -> "Finalizar" (todo
    asignado y reportado: terminadas + defectuosas) la cierra y la remisión queda Terminada.
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
        # No hace falta asignarlo todo: basta con una tarea y el resto se asigna mientras avanza
        if produccion.total_asignado == 0:
            raise ConflictError("Asigne al menos una tarea antes de iniciar la producción.")
        self.repo.cambiar_estado(id_produccion, EN_PRODUCCION, id_responsable)
        return self.obtener(id_produccion)

    def finalizar(self, id_produccion: str, id_responsable: str) -> Produccion:
        produccion = self.obtener(id_produccion)
        if produccion.estado != EN_PRODUCCION:
            raise ConflictError(f"Solo se finaliza una producción En producción (actual: {produccion.estado}).")
        # Para finalizar sí debe estar todo asignado...
        faltantes = self.repo.faltantes(id_produccion)
        if faltantes:
            f = faltantes[0]
            raise ConflictError(
                f"No se puede finalizar: falta asignar {f.cantidad - f.asignado} de {f.cantidad} unidades de "
                f"{f.nombre_de_la_pieza} talla {f.talla} en el paso {f.paso}.")
        # ...sin un reproceso abierto...
        if produccion.reproceso_activo:
            raise ConflictError("No se puede finalizar: hay un reproceso abierto. Termínelo o cancélelo primero.")
        # ...y reportado (terminadas + defectuosas)
        if produccion.total_pendiente > 0:
            raise ConflictError(
                f"No se puede finalizar: faltan {produccion.total_pendiente} unidades por reportar en las tareas.")
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
        Cada paso dice cuántas veces se hace a cada prenda: el tope por talla es prendas × veces.
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
            self._validar_veces(paso)
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

    def defectuosas(self, id_produccion: str | None = None,
                    id_remision: str | None = None) -> list[PiezaDefectuosa]:
        return self.repo.defectuosas(id_produccion, id_remision)

    # ------------------------------------------------------------------ Reproceso
    def reprocesos(self, id_produccion: str) -> list[Reproceso]:
        return self.repo.reprocesos(id_produccion)

    def crear_reproceso(self, id_produccion: str, datos: NuevoReproceso, id_responsable: str) -> list[Reproceso]:
        """Reprocesar piezas defectuosas dentro de la misma producción.

        Se eligen las piezas por talla (máximo las defectuosas disponibles), solo los procesos
        que hacen falta, y opcionalmente los insumos que el cliente envió para el reproceso.
        Uno a la vez. La base de datos valida todo esto también.
        """
        produccion = self.obtener(id_produccion)
        if produccion.estado != EN_PRODUCCION:
            raise ConflictError("Solo se puede reprocesar una producción que está En producción.")
        if produccion.reproceso_activo:
            raise ConflictError("Ya hay un reproceso abierto: termínelo o cancélelo antes de abrir otro.")
        datos.tallas = {k: v for k, v in datos.tallas.items() if v and v > 0}
        if not datos.tallas:
            raise ValidacionError("Indique cuántas piezas de cada talla se van a reprocesar.")
        disponibles = {l.id_detalle_de_remision: l for l in self.repo.lineas_remision(id_produccion)}
        for id_detalle, cantidad in datos.tallas.items():
            linea = disponibles.get(id_detalle)
            if linea is None:
                raise ValidacionError(f"La talla {id_detalle} no es de esta producción.")
            if cantidad > linea.defectuosas_disponibles:
                raise ConflictError(
                    f"De {linea.nombre_de_la_pieza} talla {linea.talla} solo hay {linea.defectuosas_disponibles} "
                    f"pieza(s) defectuosa(s) por reprocesar.")
        if not datos.pasos:
            raise ValidacionError("Elija los procesos que lleva el reproceso.")
        vistos: set[tuple[str, str]] = set()
        for paso in datos.pasos:
            paso.id_paso = None
            paso.descripcion = " ".join((paso.descripcion or "").split()) or None
            self._validar_veces(paso)
            clave = (paso.id_proceso, (paso.descripcion or "").lower())
            if clave in vistos:
                raise ValidacionError("Si repite un proceso, póngale una descripción distinta a cada uno.")
            vistos.add(clave)
        for insumo in datos.insumos:
            insumo.nombre = " ".join(insumo.nombre.split())
            if not insumo.nombre or insumo.cantidad <= 0:
                raise ValidacionError("Cada insumo enviado debe tener nombre y una cantidad mayor a 0.")
        datos.observacion = " ".join((datos.observacion or "").split()) or None
        self.repo.crear_reproceso(id_produccion, datos, id_responsable)
        return self.repo.reprocesos(id_produccion)

    def cancelar_reproceso(self, id_reproceso: str) -> list[Reproceso]:
        """Por si se abrió por error: solo mientras no tenga tareas."""
        dato = self.repo.reproceso_de(id_reproceso)
        if dato is None:
            raise NotFoundError(f"No existe el reproceso {id_reproceso}.")
        id_produccion, estado = dato
        if estado == "Cancelado":
            raise ConflictError("El reproceso ya está cancelado.")
        if any(a.id_reproceso == id_reproceso for a in self.repo.listar_asignaciones(id_produccion=id_produccion)):
            raise ConflictError("No se puede cancelar: el reproceso ya tiene tareas asignadas. Elimínelas primero.")
        self.repo.cancelar_reproceso(id_reproceso)
        return self.repo.reprocesos(id_produccion)

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
        reportado = asignacion.cantidad_realizada + asignacion.cantidad_defectuosa
        if datos.cantidad_asignada < reportado:
            raise ConflictError(
                f"El empleado ya reportó {reportado} unidades; no puede asignarle menos que eso.")
        if reportado > 0 and (datos.id_empleado != asignacion.id_empleado
                              or datos.id_detalle_de_remision != asignacion.id_detalle_de_remision
                              or datos.id_paso != asignacion.id_paso
                              or datos.id_tipo_pieza != asignacion.id_tipo_pieza):
            raise ConflictError(
                "La tarea ya tiene reportes: solo se puede cambiar la cantidad, la máquina o el insumo. "
                "Para pasar lo que falta a otra persona, bájele la cantidad y cree una tarea nueva.")
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
        if asignacion.cantidad_realizada + asignacion.cantidad_defectuosa > 0:
            raise ConflictError("No se puede eliminar: la tarea ya tiene reportes diarios. Bájele la cantidad en su lugar.")
        self.repo.eliminar_asignacion(id_detalle)

    @staticmethod
    def _validar_veces(paso: NuevoPaso) -> None:
        if not isinstance(paso.veces, int) or not 1 <= paso.veces <= 20:
            raise ValidacionError("Las veces de cada proceso deben ser un número entero entre 1 y 20.")

    def _validar_paso(self, id_produccion: str, datos: NuevaAsignacion) -> None:
        """El paso debe ser de la producción y la máquina debe servir para su proceso."""
        paso = next((p for p in self.repo.pasos(id_produccion, todos=True) if p.id_paso == datos.id_paso), None)
        if paso is None:
            raise ConflictError("Ese paso no es de esta producción. Elija uno de los procesos de la prenda.")
        if paso.maquinas and datos.id_tipo_maquina not in paso.maquinas:
            raise ConflictError(f"Esa máquina no sirve para el proceso {paso.proceso}. Elija una de sus máquinas.")

    def _validar_empleado(self, id_empleado: str) -> None:
        """Un empleado con una tarea pendiente no recibe otra hasta que termine."""
        empleado = next((e for e in self.repo.empleados() if e.id_empleado == id_empleado), None)
        if empleado is None:
            raise ValidacionError("El empleado no existe o está inactivo.")
        if not empleado.en_taller:
            if empleado.presente_hoy:
                raise ConflictError(
                    f"{empleado.nombre} no está en el taller en este momento (salió y no ha vuelto): "
                    f"no se le pueden asignar tareas.")
            raise ConflictError(
                f"{empleado.nombre} no tiene entrada registrada hoy en la asistencia "
                f"({empleado.estado_asistencia}): no se le pueden asignar tareas.")
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
