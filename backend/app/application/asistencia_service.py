from datetime import date, time

from app.domain.entities.asistencia import Asistencia, Marcacion
from app.domain.exceptions.errors import ConflictError, NotFoundError, ValidacionError
from app.domain.interfaces.asistencia_repository import IAsistenciaRepository

# Estados que el administrador pone a mano. "Presente" lo pone la base de datos
# sola cuando se registra una entrada (y vuelve a "No presente" si se borran las horas).
NOVEDADES = ("No presente", "Permiso", "Incapacidad", "Vacaciones")
TIPOS_SALIDA = ("Fin de jornada", "Permiso")


class AsistenciaService:
    """Asistencia diaria de los empleados con hora de entrada y salida (solo el administrador).

    Reglas de negocio:
    - Un registro por empleado por día; al abrir un día todos quedan en "No presente".
    - Cada día puede tener varios tramos entrada -> salida. Ej: entra 6:00, sale a las 7:00
      con permiso (cita médica), vuelve a las 9:00 y sale a las 14:30.
    - Una salida es "Fin de jornada" o "Permiso" (el permiso lleva motivo).
    - Los tramos no se cruzan, no hay horas futuras y son del mismo día.
    - Permiso / Incapacidad / Vacaciones son novedades del día completo (sin horas).
    - Solo recibe tareas quien está en el taller ahora (entrada sin salida).
    - Solo reporta avance diario quien vino hoy (estado Presente).
    - Una entrada de un día anterior sin salida se avisa para corregirla.
    """

    def __init__(self, repo: IAsistenciaRepository):
        self.repo = repo

    def _fecha(self, fecha: date | None) -> date:
        hoy = self.repo.hoy()
        fecha = fecha or hoy
        if fecha > hoy:
            raise ValidacionError("No se puede registrar asistencia de un día futuro.")
        return fecha

    def _asistencia(self, id_asistencia: str) -> Asistencia:
        asistencia = self.repo.obtener(id_asistencia)
        if not asistencia:
            raise NotFoundError(f"No existe el registro de asistencia {id_asistencia}.")
        return asistencia

    def _hora_requerida(self, asistencia: Asistencia, hora: time | None) -> None:
        """En días anteriores hay que escribir la hora (sin hora = ahora, solo sirve para hoy)."""
        if hora is None and asistencia.fecha != self.repo.hoy():
            raise ValidacionError("Para un día anterior escriba la hora.")

    @staticmethod
    def _limpiar(texto: str | None) -> str | None:
        return " ".join((texto or "").split()) or None

    # ------------------------------------------------------------------ Día
    def del_dia(self, fecha: date | None = None) -> list[Asistencia]:
        fecha = self._fecha(fecha)
        self.repo.abrir_dia(fecha)
        return self.repo.listar(fecha)

    def marcar(self, id_asistencia: str, estado: str, observacion: str | None, id_responsable: str) -> Asistencia:
        asistencia = self._asistencia(id_asistencia)
        if estado == "Presente" and asistencia.estado != "Presente":
            raise ValidacionError("Para marcar Presente registre la hora de entrada.")
        if estado not in NOVEDADES + ("Presente",):
            raise ValidacionError("Estado no válido: " + ", ".join(NOVEDADES) + ".")
        if estado != asistencia.estado and asistencia.marcaciones:
            raise ConflictError(
                f"{asistencia.empleado} ya tiene horas registradas ese día: elimínelas antes de marcarlo como {estado}.")
        self.repo.marcar(id_asistencia, estado, self._limpiar(observacion), id_responsable)
        return self._asistencia(id_asistencia)

    # ------------------------------------------------------------------ Horas
    def entrada(self, id_asistencia: str, hora: time | None, id_responsable: str) -> Asistencia:
        asistencia = self._asistencia(id_asistencia)
        self._hora_requerida(asistencia, hora)
        if asistencia.estado in ("Permiso", "Incapacidad", "Vacaciones"):
            raise ConflictError(
                f"{asistencia.empleado} tiene el día marcado como {asistencia.estado}: quite esa novedad primero.")
        abierto = self.repo.tramo_abierto(id_asistencia)
        if abierto:
            raise ConflictError(f"{asistencia.empleado} ya está en el taller (entrada sin salida): registre primero la salida.")
        self.repo.registrar_entrada(id_asistencia, hora, id_responsable)
        return self._asistencia(id_asistencia)

    def salida(self, id_asistencia: str, hora: time | None, tipo_salida: str, motivo: str | None,
               id_responsable: str) -> Asistencia:
        asistencia = self._asistencia(id_asistencia)
        self._hora_requerida(asistencia, hora)
        if tipo_salida not in TIPOS_SALIDA:
            raise ValidacionError("El tipo de salida debe ser Fin de jornada o Permiso.")
        motivo = self._limpiar(motivo)
        if tipo_salida == "Permiso" and not motivo:
            raise ValidacionError("Escriba el motivo del permiso (ej. cita médica).")
        abierto = self.repo.tramo_abierto(id_asistencia)
        if not abierto:
            raise ConflictError(f"{asistencia.empleado} no tiene una entrada abierta: registre primero la entrada.")
        self.repo.registrar_salida(abierto.id_marcacion, hora, tipo_salida, motivo, id_responsable)
        return self._asistencia(id_asistencia)

    def entrada_todos(self, fecha: date | None, hora: time | None, id_responsable: str) -> list[Asistencia]:
        fecha = self._fecha(fecha)
        if hora is None and fecha != self.repo.hoy():
            raise ValidacionError("Para un día anterior escriba la hora.")
        self.repo.abrir_dia(fecha)
        if self.repo.entrada_todos(fecha, hora, id_responsable) == 0:
            raise ConflictError("No hay empleados en 'No presente' para registrarles la entrada.")
        return self.repo.listar(fecha)

    def editar_marcacion(self, id_marcacion: str, hora_entrada: time, hora_salida: time | None,
                         tipo_salida: str | None, motivo: str | None, id_responsable: str) -> Asistencia:
        marcacion = self.repo.obtener_marcacion(id_marcacion)
        if not marcacion:
            raise NotFoundError(f"No existe el tramo {id_marcacion}.")
        motivo = self._limpiar(motivo)
        if hora_salida is None:
            tipo_salida, motivo = None, None
        else:
            if tipo_salida not in TIPOS_SALIDA:
                raise ValidacionError("Elija el tipo de salida: Fin de jornada o Permiso.")
            if hora_salida <= hora_entrada:
                raise ValidacionError("La hora de salida debe ser después de la hora de entrada.")
            if tipo_salida == "Permiso" and not motivo:
                raise ValidacionError("Escriba el motivo del permiso (ej. cita médica).")
            if tipo_salida != "Permiso":
                motivo = None
        self.repo.actualizar_marcacion(id_marcacion, hora_entrada, hora_salida, tipo_salida, motivo, id_responsable)
        return self._asistencia(marcacion.id_asistencia)

    def eliminar_marcacion(self, id_marcacion: str) -> Asistencia:
        marcacion = self.repo.obtener_marcacion(id_marcacion)
        if not marcacion:
            raise NotFoundError(f"No existe el tramo {id_marcacion}.")
        self.repo.eliminar_marcacion(id_marcacion)
        return self._asistencia(marcacion.id_asistencia)

    def sin_salida(self) -> list[Marcacion]:
        return self.repo.sin_salida()
