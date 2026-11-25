import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Factory, Pencil, Trash2, Eye, Hammer, CheckCircle2, History, ClipboardPlus, PlayCircle, Clock, Search, Shirt, ListChecks, ExternalLink, FileText, Plus, X, AlertTriangle, ClipboardList, RotateCcw, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { exportarExcel, subtituloExportacion } from '../../../shared/utils/excel';

import {
  ESTADOS_PRODUCCION,
  produccionService,
  type Asignacion,
  type AsignacionForm,
  type EstadoProduccion,
  type LineaRemision,
  type EmpleadoDisponible,
  type FaltantePaso,
  type PasoGuardar,
  type PasoProduccion,
  type MaquinaDisponible,
  type PiezaDefectuosa,
  type Produccion,
  type ProduccionDetalle,
  type Reproceso,
  type SituacionReproceso,
  type SeguimientoProduccion,
} from '../services/produccionService';
import { UNIDADES_INSUMO } from '../../compras/utils/insumosEnviados';
import { registroDiarioService, type RegistroDiario } from '../services/registroDiarioService';
import { remisionService, type InsumoEnviado } from '../../ventas/services/remisionService';
import { empleadoService, type Empleado } from '../../usuarios/services/empleadoService';
import { tipoPiezaService, type TipoPieza } from '../../parametros/services/tipoPiezaService';
import { procesoService, type Proceso } from '../../parametros/services/procesoService';
import { insumoService, type Insumo } from '../../compras/services/insumoService';
import { mensajeError } from '../../../shared/utils/api';
import { urlArchivo } from '../../../shared/utils/archivos';
import {
  GOLD, INFO, SUCCESS, SUCCESS_BG, WARNING, WARNING_BG, DANGER, FONT,
  tema, estiloInput, fecha, fechaHora, coincide, useAutoRefresco,
  IdBadge, Pill, ActionCircleBtn, TableShell, FilaMensaje, Modal, Field, ModuleHeader,
  Paginacion, ConfirmDialog,
} from '../components/ui';

// ==========================================
// TIPOS Y UTILIDADES
// ==========================================
interface TareaDraft {
  id_detalle_de_remision: string;
  id_paso: string;
  id_tipo_pieza: string;
  id_empleado: string;
  id_tipo_maquina: string;
  cantidad_asignada: number | '';
  /** '' = sin insumo · 't:INS00001' = del taller · 'c:IEC00001' = enviado por el cliente */
  insumo: string;
  cantidad_insumo: number | '';
}

interface Catalogos {
  empleados: Empleado[];
  piezas: TipoPieza[];
  procesos: Proceso[];
  insumos: Insumo[];
}

const tareaVacia = (idLinea = ''): TareaDraft => ({
  id_detalle_de_remision: idLinea, id_paso: '', id_tipo_pieza: '', id_empleado: '', id_tipo_maquina: '',
  cantidad_asignada: '', insumo: '', cantidad_insumo: '',
});

const tareaDesdeAsignacion = (a: Asignacion): TareaDraft => ({
  id_detalle_de_remision: a.id_detalle_de_remision,
  id_paso: a.id_paso ?? '',
  id_tipo_pieza: a.id_tipo_pieza,
  id_empleado: a.id_empleado,
  id_tipo_maquina: a.id_tipo_maquina,
  cantidad_asignada: a.cantidad_asignada,
  insumo: a.id_insumos ? `t:${a.id_insumos}` : a.id_insumos_enviados_x_cliente ? `c:${a.id_insumos_enviados_x_cliente}` : '',
  cantidad_insumo: a.cantidad_insumo ?? '',
});

const tareaAFormulario = (t: TareaDraft): AsignacionForm => ({
  id_paso: t.id_paso,
  id_empleado: t.id_empleado,
  id_tipo_pieza: t.id_tipo_pieza,
  id_tipo_maquina: t.id_tipo_maquina,
  id_detalle_de_remision: t.id_detalle_de_remision,
  cantidad_asignada: Number(t.cantidad_asignada),
  id_insumos: t.insumo.startsWith('t:') ? t.insumo.slice(2) : null,
  id_insumos_enviados_x_cliente: t.insumo.startsWith('c:') ? t.insumo.slice(2) : null,
  cantidad_insumo: t.insumo ? Number(t.cantidad_insumo) : null,
});

/** Unidades de esa talla que ya están asignadas al mismo paso (sin contar la tarea que se edita).
 *  La pieza no abre cupo nuevo: el tope del paso es prendas × veces. */
const yaAsignado = (asignaciones: Asignacion[], t: Pick<TareaDraft, 'id_detalle_de_remision' | 'id_paso'>, excluirId?: string) =>
  asignaciones
    .filter((a) => a.id_detalle_de_produccion !== excluirId && a.id_detalle_de_remision === t.id_detalle_de_remision
      && a.id_paso === t.id_paso)
    .reduce((s, a) => s + a.cantidad_asignada, 0);

/** Unidades que se deben hacer de un paso en una talla: prendas × veces. */
const topePaso = (prendas: number, paso?: PasoProduccion) => prendas * Math.max(paso?.veces ?? 1, 1);

/** Nombre del paso con sus veces (ej. "Confección ×2"). */
const nombrePaso = (p: PasoProduccion) => (p.veces > 1 ? `${p.paso} ×${p.veces}` : p.paso);

/** Veces válidas: entero de 1 a 20. */
const errorVeces = (v: number | '' | undefined) =>
  v === '' || v === undefined || !Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > 20 ? 'Veces: de 1 a 20.' : null;

const COLOR_ESTADO: Record<EstadoProduccion, string> = {
  'Por asignar': '#8A8A8A',
  'En producción': WARNING,
  'Finalizada': SUCCESS,
};

const PillEstado: React.FC<{ estado: EstadoProduccion }> = ({ estado }) => {
  const color = COLOR_ESTADO[estado] ?? '#8A8A8A';
  return <Pill texto={estado} color={color} bg={`${color}1F`} />;
};

const POR_PAGINA = 8;

const COLOR_REPROCESO: Record<SituacionReproceso, string> = {
  'Por asignar': '#8A8A8A',
  'En curso': WARNING,
  'Terminado': SUCCESS,
  'Cancelado': DANGER,
};

/**
 * Para las tareas de un reproceso: solo sus pasos y sus tallas, y el tope de cada talla
 * es lo que se va a reprocesar (no lo pedido en la remisión).
 */
const ambitoReproceso = (det: ProduccionDetalle, rep: Reproceso): ProduccionDetalle => ({
  ...det,
  pasos: rep.pasos,
  faltantes: rep.faltantes,
  lineas: rep.tallas.map((rt) => {
    const l = det.lineas.find((x) => x.id_detalle_de_remision === rt.id_detalle_de_remision);
    return {
      id_detalle_de_remision: rt.id_detalle_de_remision, nombre_de_la_pieza: rt.nombre_de_la_pieza, talla: rt.talla,
      cantidad: rt.cantidad, total_asignado: l?.total_asignado ?? 0, total_realizado: l?.total_realizado ?? 0,
      total_defectuoso: 0, terminadas: 0, recuperadas: 0, defectuosas_disponibles: 0,
    };
  }),
});

// ==========================================
// VISTA PRINCIPAL
// ==========================================
interface ProduccionViewProps {
  dark?: boolean;
}

/**
 * Producción. No se crea aquí: nace sola cuando se aprueba la remisión y llega en estado
 * "Por asignar" con las tallas de la remisión.
 *  - Ojo (Ver detalle): toda la información de la producción, solo lectura.
 *  - Martillo (Asignar): procesos, tareas por talla, iniciar y finalizar.
 * Para iniciar basta con una tarea; el resto se asigna a medida que avanza.
 * Para finalizar todo debe estar asignado y reportado (terminadas + defectuosas).
 */
export const ProduccionView: React.FC<ProduccionViewProps> = ({ dark = false }) => {
  const t = tema(dark);

  // ---------- Datos ----------
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cat, setCat] = useState<Catalogos | null>(null);

  // ---------- Filtros ----------
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'' | EstadoProduccion>('');
  const [pagina, setPagina] = useState(1);

  // ---------- Modales ----------
  const [detalle, setDetalle] = useState<ProduccionDetalle | null>(null);
  /** asignar = martillo (trabajar la producción) · ver = ojo (ver detalle, solo lectura) */
  const [modo, setModo] = useState<'asignar' | 'ver'>('asignar');
  const [registrosDetalle, setRegistrosDetalle] = useState<RegistroDiario[] | null>(null);
  const [insumosCliente, setInsumosCliente] = useState<InsumoEnviado[]>([]);
  const [ficha, setFicha] = useState<{ url: string | null; nombre: string } | null>(null);
  const [modalProcesos, setModalProcesos] = useState(false);
  const [pasosEdit, setPasosEdit] = useState<PasoGuardar[]>([]);
  const [seguimiento, setSeguimiento] = useState<{ produccion: Produccion; pasos: SeguimientoProduccion[] } | null>(null);
  const [modalTarea, setModalTarea] = useState<{ asignacion: Asignacion | null; reproceso: Reproceso | null } | null>(null);
  const [modalReproceso, setModalReproceso] = useState(false);
  const [intentoTarea, setIntentoTarea] = useState(false);   // ya intentó guardar: se ven todos los errores
  const [confirmCancelarRep, setConfirmCancelarRep] = useState<Reproceso | null>(null);
  const [tareaEdit, setTareaEdit] = useState<TareaDraft>(tareaVacia());
  const [maquinas, setMaquinas] = useState<MaquinaDisponible[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<EmpleadoDisponible[]>([]);
  const [confirmar, setConfirmar] = useState<{ accion: 'iniciar' | 'finalizar'; produccion: Produccion } | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<Asignacion | null>(null);
  const [procesando, setProcesando] = useState(false);

  // ==========================================
  // CARGA DE DATOS (se actualiza sola, sin botón de refrescar)
  // ==========================================
  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      setProducciones(await produccionService.listar());
    } catch (e) {
      if (!silencioso) toast.error(mensajeError(e));
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Producción que está abierta. Si se cierra mientras llega una actualización,
  // la respuesta se descarta para que la ventana no se vuelva a abrir sola.
  const abierta = useRef<string | null>(null);

  const recargarDetalle = useCallback(async (idProduccion: string) => {
    const det = await produccionService.obtener(idProduccion);
    if (abierta.current === idProduccion) setDetalle(det);
    return det;
  }, []);

  const cerrarDetalle = () => {
    abierta.current = null;
    setDetalle(null);
  };

  useAutoRefresco(() => {
    cargar(true);
    if (detalle && !modalTarea) recargarDetalle(detalle.id_produccion).catch(() => undefined);
  });

  /** Empleados, piezas, procesos e insumos activos (se cargan al abrir una producción). */
  const cargarCatalogos = async (): Promise<Catalogos | null> => {
    try {
      const [empleados, piezas, procesos, insumos] = await Promise.all([
        empleadoService.listar('Activo'),
        tipoPiezaService.listar('Activo'),
        procesoService.listar('Activo'),
        insumoService.listar(),
      ]);
      const nuevo = { empleados, piezas, procesos, insumos };
      setCat(nuevo);
      return nuevo;
    } catch (e) {
      toast.error(`No se pudieron cargar los catálogos: ${mensajeError(e)}`);
      return null;
    }
  };

  // ==========================================
  // DETALLE (tallas de la remisión y sus tareas)
  // ==========================================
  const abrirDetalle = async (idProduccion: string, modoApertura: 'asignar' | 'ver' = 'asignar') => {
    try {
      abierta.current = idProduccion;
      setModo(modoApertura);
      setFicha(null);
      setRegistrosDetalle(null);
      const det = await recargarDetalle(idProduccion);
      if (modoApertura === 'ver') {
        // Ver detalle: solo lectura, con los reportes diarios de la producción
        registroDiarioService.listar({ id_produccion: idProduccion })
          .then((regs) => { if (abierta.current === idProduccion) setRegistrosDetalle(regs); })
          .catch(() => setRegistrosDetalle([]));
        remisionService.obtener(det.id_remision)
          .then((r) => setFicha({ url: urlArchivo(r.ficha_tecnica_url), nombre: r.ficha_tecnica_nombre }))
          .catch(() => undefined);
        return;
      }
      cargarCatalogos();
      remisionService.obtener(det.id_remision)
        .then((r) => {
          setInsumosCliente(r.insumos ?? []);
          setFicha({ url: urlArchivo(r.ficha_tecnica_url), nombre: r.ficha_tecnica_nombre });
        })
        .catch(() => setInsumosCliente([]));
      // Paso 1: si aún no se eligieron los procesos, se abre la selección con la ficha técnica
      if (det.pasos.length === 0 && det.estado !== 'Finalizada') abrirProcesos(det);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  // ==========================================
  // PROCESOS DE LA PRODUCCIÓN (según la ficha técnica)
  // ==========================================
  const abrirProcesos = (det: ProduccionDetalle) => {
    if (!cat) cargarCatalogos();
    setPasosEdit(det.pasos.map((p) => ({ id_paso: p.id_paso, id_proceso: p.id_proceso, descripcion: p.descripcion ?? '', veces: p.veces ?? 1 })));
    setModalProcesos(true);
  };

  const guardarProcesos = async () => {
    if (!detalle) return;
    if (pasosEdit.length === 0) { toast.error('Agrega al menos un proceso.'); return; }
    if (pasosEdit.some((p) => errorVeces(p.veces))) { toast.error('Las veces de cada proceso deben ser un número entero de 1 a 20.'); return; }
    // Un proceso repetido debe tener descripción distinta en cada paso
    const claves = pasosEdit.map((p) => `${p.id_proceso}|${(p.descripcion ?? '').trim().toLowerCase()}`);
    if (new Set(claves).size !== claves.length) {
      toast.error('Si repites un proceso, ponle una descripción distinta a cada uno (ej. Bordado — logo en el pecho).');
      return;
    }
    setProcesando(true);
    try {
      await produccionService.guardarPasos(detalle.id_produccion,
        pasosEdit.map((p) => ({ ...p, descripcion: (p.descripcion ?? '').trim() || null, veces: Number(p.veces) })));
      toast.success('Procesos guardados. Ahora asigna las tareas de cada talla.');
      setModalProcesos(false);
      await Promise.all([recargarDetalle(detalle.id_produccion), cargar(true)]);
    } catch (e) {
      toast.error(mensajeError(e), { duration: 8000 });
    } finally {
      setProcesando(false);
    }
  };

  const verSeguimiento = async (p: Produccion) => {
    try {
      setSeguimiento({ produccion: p, pasos: await produccionService.seguimiento(p.id_produccion) });
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  // ==========================================
  // TAREAS
  // ==========================================
  const abrirTarea = async (asignacion: Asignacion | null, idLinea = '', repElegido: Reproceso | null = null) => {
    if (!detalle) return;
    // Las tareas de un reproceso usan los pasos y las tallas del reproceso
    const reproceso = repElegido ?? (asignacion?.id_reproceso
      ? detalle.reprocesos.find((r) => r.id_reproceso === asignacion.id_reproceso) ?? null
      : null);
    const ambito = reproceso ? ambitoReproceso(detalle, reproceso) : detalle;
    const catalogos = cat ?? await cargarCatalogos();
    if (!catalogos) return;
    try {
      // Máquinas e insumos del cliente al momento (disponibilidad actual)
      const [maqs, emps, rem] = await Promise.all([
        produccionService.maquinas(),
        produccionService.empleados(),
        remisionService.obtener(detalle.id_remision).catch(() => null),
      ]);
      setMaquinas(maqs);
      setDisponibilidad(emps);
      if (rem) setInsumosCliente(rem.insumos ?? []);
    } catch (e) {
      toast.error(mensajeError(e));
      return;
    }
    setTareaEdit(asignacion ? tareaDesdeAsignacion(asignacion) : tareaVacia(idLinea || ambito.lineas[0]?.id_detalle_de_remision));
    setIntentoTarea(false);
    setModalTarea({ asignacion, reproceso });
  };

  const validarTarea = (tarea: TareaDraft, asignacion: Asignacion | null, reproceso: Reproceso | null): string | null => {
    if (!detalle || !cat) return 'Cargando datos...';
    const ambito = reproceso ? ambitoReproceso(detalle, reproceso) : detalle;
    if (!tarea.id_detalle_de_remision) return 'Selecciona la talla.';
    if (!tarea.id_paso) return 'Selecciona el proceso.';
    if (!tarea.id_tipo_pieza) return 'Selecciona la pieza.';
    if (!tarea.id_empleado) return 'Selecciona el empleado.';
    if (!tarea.id_tipo_maquina) return 'Selecciona la máquina.';
    const ocupadoEmp = disponibilidad.find((d) => d.id_empleado === tarea.id_empleado && !d.disponible);
    if (ocupadoEmp && tarea.id_empleado !== asignacion?.id_empleado) {
      if (!ocupadoEmp.en_taller) {
        return ocupadoEmp.presente_hoy
          ? `${ocupadoEmp.nombre} no está en el taller ahora (salió y no ha vuelto).`
          : `${ocupadoEmp.nombre} no tiene entrada registrada hoy (${ocupadoEmp.estado_asistencia}).`;
      }
      return `${ocupadoEmp.nombre} está ocupado: tiene ${ocupadoEmp.unidades_pendientes} und pendientes en la tarea ${ocupadoEmp.ocupado_en_tarea}.`;
    }
    const cant = Number(tarea.cantidad_asignada);
    if (!Number.isInteger(cant) || cant <= 0) return 'La cantidad asignada debe ser un número entero mayor a 0.';
    const linea = ambito.lineas.find((l) => l.id_detalle_de_remision === tarea.id_detalle_de_remision);
    const pasoSel = ambito.pasos.find((p) => p.id_paso === tarea.id_paso);
    if (linea && pasoSel) {
      const usado = yaAsignado(detalle.asignaciones, tarea, asignacion?.id_detalle_de_produccion);
      const tope = topePaso(linea.cantidad, pasoSel);
      const cambiaCupo = !asignacion || cant > asignacion.cantidad_asignada
        || tarea.id_paso !== (asignacion.id_paso ?? '') || tarea.id_detalle_de_remision !== asignacion.id_detalle_de_remision;
      if (cambiaCupo && usado >= tope) {
        return `${nombrePaso(pasoSel)} ya está asignado completo para la talla ${linea.talla} (${usado} de ${tope} und). No se puede asignar otra vez.`;
      }
      if (cambiaCupo && usado + cant > tope) {
        return `${nombrePaso(pasoSel)} en la talla ${linea.talla}: ${linea.cantidad} prendas × ${pasoSel.veces} = ${tope} und; ya hay ${usado} asignadas (quedan ${tope - usado}).`;
      }
    }
    const reportado = asignacion ? asignacion.cantidad_realizada + asignacion.cantidad_defectuosa : 0;
    if (asignacion && cant < reportado) {
      return `El empleado ya reportó ${reportado} unidades (terminadas + defectuosas); no puedes asignarle menos.`;
    }
    if (asignacion && reportado > 0 && (tarea.id_empleado !== asignacion.id_empleado
      || tarea.id_detalle_de_remision !== asignacion.id_detalle_de_remision
      || tarea.id_paso !== (asignacion.id_paso ?? '') || tarea.id_tipo_pieza !== asignacion.id_tipo_pieza)) {
      return 'La tarea ya tiene reportes: solo puedes cambiar la cantidad, la máquina o el insumo. Para pasar lo que falta a otra persona, bájale la cantidad y crea una tarea nueva.';
    }
    if (tarea.insumo) {
      const ci = Number(tarea.cantidad_insumo);
      if (!Number.isInteger(ci) || ci <= 0) return 'La cantidad de insumo debe ser un número entero mayor a 0.';
      const id = tarea.insumo.slice(2);
      const original = asignacion && tareaDesdeAsignacion(asignacion).insumo === tarea.insumo ? asignacion.cantidad_insumo ?? 0 : 0;
      const disponible = tarea.insumo.startsWith('t:')
        ? cat.insumos.find((i) => i.id === id)?.stock
        : insumosCliente.find((i) => i.id_insumo_enviado === id)?.cantidad_disponible;
      if (disponible !== undefined && ci > disponible + original) return `Solo hay ${disponible + original} disponibles de ese insumo.`;
    }
    return null;
  };

  const guardarTarea = async () => {
    if (!detalle || !modalTarea) return;
    const problema = validarTarea(tareaEdit, modalTarea.asignacion, modalTarea.reproceso);
    if (problema) { setIntentoTarea(true); toast.error(problema); return; }
    setProcesando(true);
    try {
      if (modalTarea.asignacion) {
        await produccionService.actualizarAsignacion(modalTarea.asignacion.id_detalle_de_produccion, tareaAFormulario(tareaEdit));
        toast.success('Tarea actualizada.');
      } else {
        await produccionService.crearAsignacion(detalle.id_produccion, tareaAFormulario(tareaEdit));
        toast.success('Tarea asignada.');
      }
      setModalTarea(null);
      await Promise.all([recargarDetalle(detalle.id_produccion), cargar(true), cargarCatalogos()]);
    } catch (e) {
      toast.error(mensajeError(e), { duration: 8000 });
    } finally {
      setProcesando(false);
    }
  };

  const eliminarTarea = async () => {
    if (!confirmEliminar || !detalle) return;
    setProcesando(true);
    try {
      await produccionService.eliminarAsignacion(confirmEliminar.id_detalle_de_produccion);
      toast.success('Tarea eliminada. El insumo volvió al inventario y la máquina quedó libre.');
      setConfirmEliminar(null);
      await Promise.all([recargarDetalle(detalle.id_produccion), cargar(true)]);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // REPROCESO
  // ==========================================
  const reprocesoCreado = async (reprocesos: Reproceso[]) => {
    if (!detalle) return;
    setModalReproceso(false);
    const nuevo = reprocesos[reprocesos.length - 1];
    toast.success(`Reproceso #${nuevo?.numero ?? ''} abierto: ahora asigna sus tareas.`);
    await Promise.all([recargarDetalle(detalle.id_produccion), cargar(true)]);
  };

  const cancelarReproceso = async () => {
    if (!confirmCancelarRep || !detalle) return;
    setProcesando(true);
    try {
      await produccionService.cancelarReproceso(confirmCancelarRep.id_reproceso);
      toast.success(`Reproceso #${confirmCancelarRep.numero} cancelado.`);
      setConfirmCancelarRep(null);
      await Promise.all([recargarDetalle(detalle.id_produccion), cargar(true)]);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // INICIAR / FINALIZAR
  // ==========================================
  const cambiarEstado = async () => {
    if (!confirmar) return;
    const { accion, produccion } = confirmar;
    setProcesando(true);
    try {
      const prod = accion === 'iniciar'
        ? await produccionService.iniciar(produccion.id_produccion)
        : await produccionService.finalizar(produccion.id_produccion);
      toast.success(accion === 'iniciar'
        ? `Producción ${prod.id_produccion} iniciada: ya está En producción.`
        : `Producción ${prod.id_produccion} finalizada. La remisión ${prod.id_remision} quedó "Terminada".`);
      setConfirmar(null);
      await cargar(true);
      if (detalle?.id_produccion === prod.id_produccion) await recargarDetalle(prod.id_produccion);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // BÚSQUEDA (en todas las columnas) Y PAGINACIÓN
  // ==========================================
  const filtradas = useMemo(() => producciones
    .filter((p) => !filtroEstado || p.estado === filtroEstado)
    .filter((p) => coincide(busqueda, [
      p.id_produccion, p.id_remision, p.cliente, p.estado, p.ficha_tecnica_nombre, p.total_prendas,
      `${p.prendas_terminadas} de ${p.total_prendas}`,
      `${p.total_realizado} de ${p.total_asignado}`, fechaHora(p.fecha_estado), fecha(p.fecha_entrega),
    ])), [producciones, busqueda, filtroEstado]);

  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const visibles = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  /** Exporta las producciones de la tabla (con la búsqueda y el filtro aplicados, todas las páginas). */
  const descargarExcel = () => exportarExcel({
    archivo: 'producciones', hoja: 'Producciones', titulo: 'Producciones',
    subtitulo: subtituloExportacion(busqueda, filtradas.length) + (filtroEstado ? ` · Estado: ${filtroEstado}` : ''),
    filas: filtradas,
    columnas: [
      { titulo: 'ID producción', valor: p => p.id_produccion },
      { titulo: 'Remisión', valor: p => p.id_remision },
      { titulo: 'Cliente', valor: p => p.cliente },
      { titulo: 'Ficha técnica', valor: p => p.ficha_tecnica_nombre },
      { titulo: 'Estado', valor: p => p.reproceso_activo ? `${p.estado} (en reproceso)` : p.estado },
      { titulo: 'Fecha de inicio', valor: p => p.fecha_inicio, tipo: 'fecha' },
      { titulo: 'Fecha de entrega', valor: p => p.fecha_entrega, tipo: 'fecha' },
      { titulo: 'Total prendas', valor: p => p.total_prendas, tipo: 'numero' },
      { titulo: 'Prendas terminadas', valor: p => p.prendas_terminadas, tipo: 'numero' },
      { titulo: 'Unidades asignadas', valor: p => p.total_asignado, tipo: 'numero' },
      { titulo: 'Unidades realizadas', valor: p => p.total_realizado, tipo: 'numero' },
      { titulo: 'Defectuosas', valor: p => p.total_defectuoso, tipo: 'numero' },
      { titulo: 'Pendientes', valor: p => p.total_pendiente, tipo: 'numero' },
      { titulo: 'Avance (%)', valor: p => Math.round(p.porcentaje_avance * 10) / 10, tipo: 'numero' },
      { titulo: 'Último cambio de estado', valor: p => fechaHora(p.fecha_estado) },
    ],
  });

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <ModuleHeader
        title="Producción"
        subtitle='Las producciones llegan solas al aprobar una remisión. Con el martillo asignas las tareas; con el ojo ves todo el detalle.'
        search={busqueda}
        onSearch={setBusqueda}
        dark={dark}
        extra={
          <>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as '' | EstadoProduccion)}
              style={estiloInput(dark, { width: 170, padding: '8px 10px' })}>
              <option value="">Todos los estados</option>
              {ESTADOS_PRODUCCION.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </>
        }
        excel={{ onClick: descargarExcel, cantidad: filtradas.length }}
      />

      <TableShell headers={['ID producción', 'Remisión', 'Cliente', 'Prendas terminadas', 'Estado', 'Fecha de estado', 'Acciones']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={7} dark={dark} cargando={cargando}
            texto={producciones.length === 0
              ? 'Aún no hay producciones. Se crean solas cuando se aprueba una remisión.'
              : 'No se encontraron producciones con ese filtro.'} />
        ) : visibles.map((p) => (
          <tr key={p.id_produccion} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '12px 14px' }}><IdBadge id={p.id_produccion} /></td>
            <td style={{ padding: '12px 14px' }}><IdBadge id={p.id_remision} /></td>
            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{p.cliente}</td>
            <td style={{ padding: '12px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>
              <b>{p.prendas_terminadas}</b> <span style={{ color: t.subtle }}>de {p.total_prendas}</span>
            </td>
            <td style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <PillEstado estado={p.estado} />
                {p.reproceso_activo && <Pill texto="En reproceso" color={DANGER} bg={`${DANGER}1A`} />}
              </div>
            </td>
            <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: t.subtle, whiteSpace: 'nowrap' }}>{fechaHora(p.fecha_estado)}</td>
            <td style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionCircleBtn variant="blue" onClick={() => abrirDetalle(p.id_produccion, 'ver')} title="Ver detalle"><Eye size={14} /></ActionCircleBtn>
                <ActionCircleBtn variant="gold" disabled={p.estado === 'Finalizada'} onClick={() => abrirDetalle(p.id_produccion, 'asignar')}
                  title={p.estado === 'Finalizada' ? 'La producción está finalizada' : 'Asignar tareas'}><Hammer size={14} /></ActionCircleBtn>
                <ActionCircleBtn variant="gold" onClick={() => verSeguimiento(p)} title="Seguimiento"><History size={14} /></ActionCircleBtn>
                {p.estado === 'Por asignar' && (
                  <ActionCircleBtn variant="success" disabled={p.total_asignado === 0} onClick={() => setConfirmar({ accion: 'iniciar', produccion: p })}
                    title={p.total_asignado === 0 ? 'Asigna al menos una tarea para iniciar' : 'Iniciar producción'}>
                    <PlayCircle size={14} />
                  </ActionCircleBtn>
                )}
                {p.estado === 'En producción' && (
                  <ActionCircleBtn variant="success" disabled={p.total_pendiente > 0 || p.reproceso_activo}
                    onClick={() => setConfirmar({ accion: 'finalizar', produccion: p })}
                    title={p.reproceso_activo ? 'Tiene un reproceso abierto: termínalo o cancélalo'
                      : p.total_pendiente > 0 ? `Faltan ${p.total_pendiente} unidades por reportar`
                        : 'Finalizar producción (debe estar todo asignado)'}>
                    <CheckCircle2 size={14} />
                  </ActionCircleBtn>
                )}
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      <Paginacion pagina={pagina} total={totalPaginas} registros={filtradas.length} porPagina={POR_PAGINA} onCambiar={setPagina} dark={dark} />

      {/* ============ DETALLE: TALLAS Y TAREAS ============ */}
      {detalle && modo === 'ver' && (
        <DetalleProduccion detalle={detalle} registros={registrosDetalle} ficha={ficha} onClose={cerrarDetalle} dark={dark} />
      )}

      {detalle && modo === 'asignar' && !modalTarea && !modalProcesos && !confirmEliminar && !confirmar && !modalReproceso && !confirmCancelarRep && (
        <Modal title={`Asignar — Producción ${detalle.id_produccion}`} icon={<Hammer size={16} color={GOLD} />} onClose={cerrarDetalle} dark={dark} maxWidth="1100px">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            {[
              ['Remisión', <IdBadge key="r" id={detalle.id_remision} />],
              ['Cliente', <b key="c">{detalle.cliente}</b>],
              ['Prendas terminadas', <span key="pt"><b style={{ fontSize: 15 }}>{detalle.prendas_terminadas}</b> de {detalle.total_prendas}</span>],
              ['Ficha técnica', detalle.ficha_tecnica_nombre],
              ['Estado', <span key="e" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <PillEstado estado={detalle.estado} />
                <span style={{ fontSize: 11, color: t.subtle }}>{fechaHora(detalle.fecha_estado)}</span>
              </span>],
            ].map(([label, valor]) => (
              <div key={String(label)} style={{ background: t.surface, borderRadius: 8, padding: '10px 14px', minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.05em', color: t.subtle, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>{valor}</div>
              </div>
            ))}
          </div>

          {/* Procesos que lleva la prenda */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: t.surface, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <ListChecks size={16} color={GOLD} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: t.subtle }}>Procesos de la prenda:</span>
              {detalle.pasos.length === 0
                ? <span style={{ fontSize: 12, color: WARNING, fontWeight: 600 }}>Aún no se han elegido</span>
                : detalle.pasos.map((p) => <Pill key={p.id_paso} texto={p.paso} color={INFO} bg={`${INFO}1F`} />)}
            </div>
            {detalle.estado !== 'Finalizada' && (
              <button onClick={() => abrirProcesos(detalle)} style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
                <ListChecks size={14} /> {detalle.pasos.length === 0 ? 'Elegir procesos' : 'Editar procesos'}
              </button>
            )}
          </div>

          {detalle.estado === 'Por asignar' && detalle.pasos.length > 0 && (
            <div style={{ fontSize: 12, color: t.subtle, background: `${INFO}12`, border: `1px solid ${INFO}40`, borderRadius: 8, padding: '10px 14px' }}>
              No hace falta asignarlo todo: con <b>una tarea</b> ya puedes pulsar <b>Iniciar producción</b> y seguir asignando a medida que avanzan.
              Para <b>finalizar</b> sí debe estar todo asignado y reportado.
            </div>
          )}

          {detalle.pasos.length === 0 && detalle.estado !== 'Finalizada' ? (
            <div style={{ textAlign: 'center', padding: 24, fontSize: 13, color: t.subtle, border: `1px dashed ${t.border}`, borderRadius: 12 }}>
              Primero elige los procesos que lleva la prenda mirando la ficha técnica. Después podrás asignar las tareas de cada talla.
            </div>
          ) : detalle.lineas.map((linea) => (
            <TallaCard key={linea.id_detalle_de_remision} linea={linea} dark={dark}
              tareas={detalle.asignaciones.filter((a) => !a.id_reproceso && a.id_detalle_de_remision === linea.id_detalle_de_remision)}
              faltantes={detalle.faltantes.filter((f) => f.id_detalle_de_remision === linea.id_detalle_de_remision)}
              insumosCliente={insumosCliente}
              editable={detalle.estado !== 'Finalizada'}
              onAgregar={() => abrirTarea(null, linea.id_detalle_de_remision)}
              onEditar={(a) => abrirTarea(a)}
              onEliminar={setConfirmEliminar} />
          ))}

          <TablaDefectuosas defectuosas={detalle.defectuosas} dark={dark} />

          <SeccionReprocesos detalle={detalle} insumosCliente={insumosCliente} dark={dark}
            onReprocesar={() => { if (!cat) cargarCatalogos(); setModalReproceso(true); }}
            onCancelar={setConfirmCancelarRep}
            onAgregar={(rep, idLinea) => abrirTarea(null, idLinea, rep)}
            onEditar={(a) => abrirTarea(a)}
            onEliminar={setConfirmEliminar} />

          {detalle.estado !== 'Finalizada' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {detalle.estado === 'Por asignar' ? (
                (() => {
                  const bloqueo = detalle.pasos.length === 0
                    ? 'Primero elige los procesos de la prenda.'
                    : detalle.asignaciones.length === 0
                      ? 'Asigna al menos una tarea para iniciar.'
                      : '';
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {bloqueo && <span style={{ fontSize: 12, color: WARNING, fontWeight: 600 }}>{bloqueo}</span>}
                      <button onClick={() => setConfirmar({ accion: 'iniciar', produccion: detalle })} disabled={Boolean(bloqueo)}
                        style={{ background: SUCCESS, border: 'none', color: '#FFF', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: bloqueo ? 'not-allowed' : 'pointer', opacity: bloqueo ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
                        <PlayCircle size={15} /> Iniciar producción
                      </button>
                    </div>
                  );
                })()
              ) : (() => {
                const faltan = detalle.total_pendiente;
                const sinAsignar = detalle.faltantes.reduce((s, f) => s + (f.cantidad - f.asignado), 0);
                const repAbierto = detalle.reprocesos.find((r) => r.situacion === 'Por asignar' || r.situacion === 'En curso');
                const bloqueo = sinAsignar > 0
                  ? `Faltan ${sinAsignar} unidades por asignar (ver en naranja en cada talla).`
                  : repAbierto ? `El reproceso #${repAbierto.numero} está ${repAbierto.situacion.toLowerCase()}: termínalo o cancélalo.`
                    : faltan > 0 ? `Faltan ${faltan} unidades por reportar en las tareas.` : '';
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {bloqueo && (
                      <span style={{ fontSize: 12, color: WARNING, fontWeight: 600 }}>
                        {bloqueo} Se podrá finalizar cuando todo esté asignado y reportado.
                      </span>
                    )}
                    <button onClick={() => setConfirmar({ accion: 'finalizar', produccion: detalle })} disabled={Boolean(bloqueo)}
                      style={{ background: SUCCESS, border: 'none', color: '#FFF', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: bloqueo ? 'not-allowed' : 'pointer', opacity: bloqueo ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
                      <CheckCircle2 size={15} /> Finalizar producción
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </Modal>
      )}

      {/* ============ PROCESOS DE LA PRODUCCIÓN (con la ficha técnica) ============ */}
      {modalProcesos && detalle && (
        <Modal title={`Procesos de la producción ${detalle.id_produccion}`} icon={<ListChecks size={16} color={GOLD} />}
          onClose={() => setModalProcesos(false)} onSave={guardarProcesos} saveLabel="Guardar procesos" saving={procesando} dark={dark} maxWidth="1100px">
          <div style={{ fontSize: 13, color: t.subtle, marginTop: -4 }}>
            Mira la ficha técnica y agrega los procesos que lleva esta prenda. Si un proceso va dos veces (ej. dos bordados distintos),
            agrégalo dos veces y ponle a cada uno una descripción (ej. "logo en el pecho" y "nombre en la manga").
            En <b>Veces</b> pon cuántas veces se hace ese proceso a cada prenda (ej. Confección ×2): ese es el total que se podrá asignar
            por talla, y un proceso ya asignado completo no se puede volver a asignar.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
            <FichaTecnica ficha={ficha} dark={dark} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.subtle, marginBottom: 8 }}>
                  Pasos de esta prenda ({pasosEdit.length}) <span style={{ color: DANGER }}>*</span>
                </div>
                {pasosEdit.length === 0 ? (
                  <div style={{ fontSize: 12, color: DANGER, padding: 12, border: `1px dashed ${DANGER}`, borderRadius: 8, fontWeight: 600 }}>
                    Agrega al menos un proceso con los botones de abajo.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pasosEdit.map((p, i) => {
                      const nombre = cat?.procesos.find((x) => x.id === p.id_proceso)?.nombre
                        ?? detalle.pasos.find((x) => x.id_paso === p.id_paso)?.proceso ?? p.id_proceso;
                      const conTareas = Boolean(p.id_paso) && detalle.asignaciones.some((a) => a.id_paso === p.id_paso);
                      const repetido = pasosEdit.filter((x) => x.id_proceso === p.id_proceso).length > 1;
                      const descripcion = (p.descripcion ?? '').trim().toLowerCase();
                      const errorPaso = repetido && !descripcion ? 'Proceso repetido: la descripción es obligatoria.'
                        : repetido && pasosEdit.filter((x) => x.id_proceso === p.id_proceso && (x.descripcion ?? '').trim().toLowerCase() === descripcion).length > 1
                          ? 'Ya hay otro paso igual: cambia la descripción.' : errorVeces(p.veces);
                      return (
                        <div key={p.id_paso ?? `nuevo-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${GOLD}60`, background: `${GOLD}0F` }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: GOLD, minWidth: 18 }}>{i + 1}.</span>
                          <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{nombre}</span>
                          <input value={p.descripcion ?? ''} maxLength={100}
                            placeholder={repetido ? 'Descripción obligatoria (ej. logo en el pecho)' : 'Descripción (opcional)'}
                            onChange={(e) => setPasosEdit(pasosEdit.map((x, j) => (j === i ? { ...x, descripcion: e.target.value } : x)))}
                            style={estiloInput(dark, { padding: '6px 10px', fontSize: 12, border: `1px solid ${errorPaso && !errorVeces(p.veces) ? DANGER : t.border}` })} />
                          <label title="Cuántas veces se hace este proceso a cada prenda" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            Veces<span style={{ color: DANGER }}>*</span>
                            <input type="number" min={1} max={20} value={p.veces ?? 1}
                              onChange={(e) => setPasosEdit(pasosEdit.map((x, j) => (j === i ? { ...x, veces: e.target.value === '' ? '' : Number(e.target.value) } : x)))}
                              style={estiloInput(dark, { padding: '6px 6px', fontSize: 12, width: 58, border: `1px solid ${errorVeces(p.veces) ? DANGER : t.border}` })} />
                          </label>
                          <button type="button" disabled={conTareas} onClick={() => setPasosEdit(pasosEdit.filter((_, j) => j !== i))}
                            title={conTareas ? 'Tiene tareas asignadas: elimina primero esas tareas' : 'Quitar'}
                            style={{ background: 'transparent', border: 'none', color: conTareas ? t.subtle : DANGER, cursor: conTareas ? 'not-allowed' : 'pointer', padding: 4, display: 'flex' }}>
                            <X size={16} />
                          </button>
                          {errorPaso && <span style={{ fontSize: 11, color: DANGER, fontWeight: 600, whiteSpace: 'nowrap' }}>{errorPaso}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.subtle, marginBottom: 8 }}>
                  Agregar proceso
                </div>
                {!cat ? (
                  <div style={{ fontSize: 13, color: t.subtle }}>Cargando procesos...</div>
                ) : cat.procesos.length === 0 ? (
                  <div style={{ fontSize: 13, color: t.subtle }}>No hay procesos activos. Créalos en Producción → Parámetros → Procesos.</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {cat.procesos.map((p) => (
                      <button key={p.id} type="button" title={p.desc ?? ''}
                        onClick={() => setPasosEdit([...pasosEdit, { id_paso: null, id_proceso: p.id, descripcion: '', veces: 1 }])}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 999, border: `1px solid ${t.border}`, background: t.surface, color: t.fg, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                        <Plus size={12} color={GOLD} /> {p.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ============ TAREA (agregar / editar) ============ */}
      {modalTarea && detalle && cat && (
        <Modal title={`${modalTarea.asignacion ? `Editar tarea ${modalTarea.asignacion.id_detalle_de_produccion}` : `Nueva tarea — ${detalle.id_produccion}`}${modalTarea.reproceso ? ` · Reproceso #${modalTarea.reproceso.numero}` : ''}`}
          icon={<ClipboardPlus size={16} color={GOLD} />} onClose={() => setModalTarea(null)} onSave={guardarTarea} saving={procesando} dark={dark} maxWidth="760px">
          <CamposTarea tarea={tareaEdit} onChange={setTareaEdit} cat={cat} maquinas={maquinas} disponibilidad={disponibilidad}
            detalle={modalTarea.reproceso ? ambitoReproceso(detalle, modalTarea.reproceso) : detalle}
            insumosCliente={insumosCliente} asignacion={modalTarea.asignacion} dark={dark} mostrarErrores={intentoTarea} />
        </Modal>
      )}

      {/* ============ SEGUIMIENTO (línea de tiempo) ============ */}
      {seguimiento && (
        <Modal title={`Seguimiento — ${seguimiento.produccion.id_produccion}`} icon={<History size={16} color={GOLD} />}
          onClose={() => setSeguimiento(null)} dark={dark} maxWidth="560px">
          <div style={{ fontSize: 12, color: t.subtle, marginTop: -4 }}>
            Remisión <b style={{ color: t.fg }}>{seguimiento.produccion.id_remision}</b> · {seguimiento.produccion.cliente}
          </div>
          {seguimiento.pasos.length === 0 ? (
            <div style={{ fontSize: 13, color: t.subtle, display: 'flex', alignItems: 'center', gap: 8 }}><Search size={14} /> Sin registros de seguimiento.</div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              <div style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, background: `${GOLD}40` }} />
              {seguimiento.pasos.map((p, i) => {
                const color = COLOR_ESTADO[p.estado_nuevo] ?? GOLD;
                const ultimo = i === seguimiento.pasos.length - 1;
                return (
                  <div key={p.id_seguimiento_produccion} style={{ position: 'relative', paddingBottom: ultimo ? 0 : 20 }}>
                    <div style={{
                      position: 'absolute', left: -25, top: 2, width: 16, height: 16, borderRadius: '50%', background: color,
                      border: `3px solid ${t.cardBg}`, boxShadow: ultimo ? `0 0 0 4px ${color}33` : 'none',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <PillEstado estado={p.estado_nuevo} />
                      {ultimo && <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' }}>Estado actual</span>}
                    </div>
                    <div style={{ fontSize: 12, color: t.subtle, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} /> {fechaHora(p.fecha_hora)}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>
                      por <b>{p.responsable}</b> <span style={{ color: t.subtle }}>({p.tipo_responsable})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* ============ CONFIRMAR INICIAR / FINALIZAR ============ */}
      {confirmar && (
        <ConfirmDialog
          titulo={confirmar.accion === 'iniciar' ? `¿Iniciar ${confirmar.produccion.id_produccion}?` : `¿Finalizar ${confirmar.produccion.id_produccion}?`}
          mensaje={confirmar.accion === 'iniciar'
            ? `Pasará a "En producción" y los empleados podrán reportar su avance diario. Tiene ${confirmar.produccion.total_asignado} unidades asignadas en tareas; puedes seguir asignando el resto mientras avanza.`
            : `Todo está asignado y reportado${confirmar.produccion.total_defectuoso ? ` (${confirmar.produccion.total_defectuoso} piezas defectuosas quedan registradas)` : ''}. La remisión pasará a "Terminada" y quedará lista para la remisión de entrega.`}
          confirmarLabel={confirmar.accion === 'iniciar' ? 'Sí, iniciar' : 'Sí, finalizar'}
          variante="success"
          icono={confirmar.accion === 'iniciar' ? <PlayCircle size={28} color={SUCCESS} /> : <CheckCircle2 size={28} color={SUCCESS} />}
          procesando={procesando}
          onCancel={() => setConfirmar(null)}
          onConfirm={cambiarEstado}
          dark={dark}
        />
      )}

      {/* ============ REPROCESO: abrir y cancelar ============ */}
      {modalReproceso && detalle && (
        <ReprocesoModal detalle={detalle} procesos={cat?.procesos ?? null} ficha={ficha} dark={dark}
          onClose={() => setModalReproceso(false)} onCreado={reprocesoCreado} />
      )}
      {confirmCancelarRep && (
        <ConfirmDialog
          titulo={`¿Cancelar el reproceso #${confirmCancelarRep.numero}?`}
          mensaje={`Se quitan sus procesos y las ${confirmCancelarRep.total_piezas} piezas vuelven a quedar como defectuosas por reprocesar. Los insumos que se registraron para este reproceso y no se usaron también se quitan.`}
          confirmarLabel="Sí, cancelar reproceso"
          icono={<Ban size={28} color={DANGER} />}
          procesando={procesando}
          onCancel={() => setConfirmCancelarRep(null)}
          onConfirm={cancelarReproceso}
          dark={dark}
        />
      )}

      {/* ============ CONFIRMAR ELIMINAR TAREA ============ */}
      {confirmEliminar && (
        <ConfirmDialog
          titulo="¿Eliminar tarea?"
          mensaje={`Se quitará la tarea de ${confirmEliminar.empleado} (${confirmEliminar.proceso ?? 'sin proceso'} · ${confirmEliminar.pieza}, ${confirmEliminar.cantidad_asignada} und). El insumo vuelve al inventario y la máquina queda libre.`}
          confirmarLabel="Sí, eliminar"
          procesando={procesando}
          onCancel={() => setConfirmEliminar(null)}
          onConfirm={eliminarTarea}
          dark={dark}
        />
      )}
    </div>
  );
};

// ==========================================
// TARJETA DE UNA TALLA CON SUS TAREAS
// ==========================================
const TallaCard: React.FC<{
  linea: LineaRemision;
  tareas: Asignacion[];
  faltantes: FaltantePaso[];
  insumosCliente: InsumoEnviado[];
  editable: boolean;
  dark: boolean;
  onAgregar: () => void;
  onEditar: (a: Asignacion) => void;
  onEliminar: (a: Asignacion) => void;
  /** Texto en lugar de "X de Y terminadas" (ej. en un reproceso: "2 piezas a reprocesar"). */
  etiqueta?: string;
}> = ({ linea, tareas, faltantes, insumosCliente, editable, dark, onAgregar, onEditar, onEliminar, etiqueta }) => {
  const t = tema(dark);

  // Avance por proceso de esta talla (ej. Confección 150/200)
  const porProceso = new Map<string, { asignado: number; realizado: number }>();
  tareas.forEach((a) => {
    const clave = a.paso ?? a.proceso ?? 'Sin proceso';
    const v = porProceso.get(clave) ?? { asignado: 0, realizado: 0 };
    porProceso.set(clave, { asignado: v.asignado + a.cantidad_asignada, realizado: v.realizado + a.cantidad_realizada });
  });
  const faltanEn = (clave: string) => faltantes.some((f) => f.paso === clave);

  const nombreInsumo = (a: Asignacion) => a.id_insumos
    ? `${a.id_insumos} (taller) ×${a.cantidad_insumo}`
    : a.id_insumos_enviados_x_cliente
      ? (() => {
        const i = insumosCliente.find((x) => x.id_insumo_enviado === a.id_insumos_enviados_x_cliente);
        return `${i?.nombre ?? ''} ${a.id_insumos_enviados_x_cliente} (cliente) ×${a.cantidad_insumo}${i ? ` ${i.unidad}` : ''}`;
      })()
      : '—';

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', background: t.surface, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Shirt size={16} color={GOLD} />
          <b style={{ fontSize: 14 }}>{linea.nombre_de_la_pieza}</b>
          <Pill texto={`Talla ${linea.talla}`} color={GOLD} bg={`${GOLD}1F`} />
          {etiqueta
            ? <span style={{ fontSize: 13, fontWeight: 700 }}>{etiqueta}</span>
            : <span style={{ fontSize: 13 }}><b>{linea.terminadas}</b> de {linea.cantidad} terminadas{linea.recuperadas > 0 ? ` (${linea.recuperadas} recuperadas en reproceso)` : ''}</span>}
          {linea.total_defectuoso > 0 && <Pill texto={`${linea.total_defectuoso} defectuosas`} color={DANGER} bg={`${DANGER}1A`} />}
          {[...porProceso.entries()].map(([proceso, v]) => (
            <Pill key={proceso} texto={`${proceso}: ${v.realizado}/${v.asignado}`}
              color={faltanEn(proceso) ? WARNING : SUCCESS} bg={faltanEn(proceso) ? WARNING_BG : SUCCESS_BG} />
          ))}
          {editable && faltantes.map((f) => (
            <Pill key={f.id_paso} texto={`Falta asignar ${f.paso}: ${f.cantidad - f.asignado} und`} color={WARNING} bg={WARNING_BG} />
          ))}
        </div>
        {editable && (
          <button onClick={onAgregar} style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
            <ClipboardPlus size={14} /> Agregar tarea
          </button>
        )}
      </div>
      <TableShell headers={['Proceso', 'Pieza', 'Empleado', 'Máquina', 'Insumo', 'Asignado', 'Terminadas', 'Defectuosas', 'Pendiente', '']} dark={dark}>
        {tareas.length === 0 ? (
          <FilaMensaje colSpan={10} dark={dark} texto="Sin tareas para esta talla todavía." />
        ) : tareas.map((a) => (
          <tr key={a.id_detalle_de_produccion} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>{a.paso ?? a.proceso ?? <span style={{ color: t.subtle, fontWeight: 400 }}>Sin proceso</span>}</td>
            <td style={{ padding: '8px 12px', fontSize: 12 }}>{a.pieza}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600 }}>{a.empleado}</td>
            <td style={{ padding: '8px 12px', fontSize: 12 }}>{a.maquina}</td>
            <td style={{ padding: '8px 12px', fontSize: 11, color: t.subtle }}>{nombreInsumo(a)}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>{a.cantidad_asignada}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: SUCCESS }}>{a.cantidad_realizada}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: a.cantidad_defectuosa > 0 ? DANGER : t.subtle }}>{a.cantidad_defectuosa}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: a.cantidad_pendiente > 0 ? WARNING : t.subtle }}>{a.cantidad_pendiente}</td>
            <td style={{ padding: '8px 12px' }}>
              {editable && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <ActionCircleBtn variant="gold" onClick={() => onEditar(a)} title="Editar tarea (ej. bajarle la cantidad para pasar lo que falta a otra persona)"><Pencil size={13} /></ActionCircleBtn>
                  <ActionCircleBtn variant="danger" disabled={a.cantidad_realizada + a.cantidad_defectuosa > 0} onClick={() => onEliminar(a)}
                    title={a.cantidad_realizada + a.cantidad_defectuosa > 0 ? 'No se puede eliminar: ya tiene reportes (bájale la cantidad en su lugar)' : 'Eliminar tarea'}>
                    <Trash2 size={13} />
                  </ActionCircleBtn>
                </div>
              )}
            </td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
};

// ==========================================
// REPROCESOS (en la ventana de asignar)
// ==========================================
const SeccionReprocesos: React.FC<{
  detalle: ProduccionDetalle;
  insumosCliente: InsumoEnviado[];
  dark: boolean;
  onReprocesar: () => void;
  onCancelar: (r: Reproceso) => void;
  onAgregar: (r: Reproceso, idLinea: string) => void;
  onEditar: (a: Asignacion) => void;
  onEliminar: (a: Asignacion) => void;
}> = ({ detalle, insumosCliente, dark, onReprocesar, onCancelar, onAgregar, onEditar, onEliminar }) => {
  const t = tema(dark);
  const enProduccion = detalle.estado === 'En producción';
  const abierto = detalle.reprocesos.find((r) => r.situacion === 'Por asignar' || r.situacion === 'En curso');
  const motivo = !enProduccion
    ? (detalle.estado === 'Finalizada' ? 'La producción está finalizada.' : 'Se puede reprocesar cuando la producción esté En producción.')
    : abierto ? `Termina o cancela el reproceso #${abierto.numero} antes de abrir otro.`
      : detalle.defectuosas_disponibles === 0 ? 'No hay piezas defectuosas por reprocesar.' : '';
  const activos = detalle.reprocesos.filter((r) => r.estado !== 'Cancelado').slice().reverse();
  const cancelados = detalle.reprocesos.filter((r) => r.estado === 'Cancelado');

  return (
    <div style={{ border: `1px solid ${abierto ? `${DANGER}66` : t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 16px', background: abierto ? `${DANGER}10` : t.surface, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <RotateCcw size={16} color={abierto ? DANGER : GOLD} />
          <b style={{ fontSize: 13 }}>Reproceso</b>
          <Pill texto={`${detalle.defectuosas_disponibles} defectuosa(s) por reprocesar`} color={detalle.defectuosas_disponibles ? DANGER : '#8A8A8A'}
            bg={detalle.defectuosas_disponibles ? `${DANGER}1A` : '#8A8A8A1F'} />
          {abierto && <Pill texto={`Reproceso #${abierto.numero}: ${abierto.situacion}`} color={COLOR_REPROCESO[abierto.situacion]} bg={`${COLOR_REPROCESO[abierto.situacion]}1F`} />}
        </div>
        <button onClick={onReprocesar} disabled={Boolean(motivo)} title={motivo || 'Abrir un reproceso con las piezas defectuosas'}
          style={{ background: motivo ? 'transparent' : DANGER, border: `1px solid ${DANGER}`, color: motivo ? DANGER : '#FFF', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: motivo ? 'not-allowed' : 'pointer', opacity: motivo ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
          <RotateCcw size={14} /> Reprocesar piezas defectuosas
        </button>
      </div>
      <div style={{ padding: '10px 16px', fontSize: 12, color: t.subtle, lineHeight: 1.6 }}>
        Si el cliente quiere que se reparen las piezas defectuosas (y envía lo que falta), abre un reproceso: eliges cuántas piezas,
        solo los procesos que hacen falta y los insumos que envió. Si no se reprocesa, la producción se puede finalizar igual y las defectuosas quedan registradas.
        {motivo && <div style={{ color: WARNING, fontWeight: 600 }}>{motivo}</div>}
      </div>

      {activos.map((rep) => {
        const ambito = ambitoReproceso(detalle, rep);
        const editable = enProduccion && rep.estado === 'Abierto';
        return (
          <div key={rep.id_reproceso} style={{ borderTop: `1px solid ${t.border}`, padding: 16, display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 14 }}>Reproceso #{rep.numero}</b>
                <Pill texto={rep.situacion} color={COLOR_REPROCESO[rep.situacion]} bg={`${COLOR_REPROCESO[rep.situacion]}1F`} />
                <span style={{ fontSize: 11, color: t.subtle }}>{rep.creado_por_nombre ?? ''} · {fechaHora(rep.fecha_creacion)}</span>
              </div>
              {editable && rep.tareas === 0 && (
                <button onClick={() => onCancelar(rep)} style={{ background: 'transparent', border: `1px solid ${DANGER}`, color: DANGER, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
                  <Ban size={13} /> Cancelar reproceso
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
              <span style={{ fontWeight: 700, color: t.subtle, textTransform: 'uppercase', fontSize: 11 }}>Procesos:</span>
              {rep.pasos.map((p, i) => <Pill key={p.id_paso} texto={`${i + 1}. ${p.paso}`} color={INFO} bg={`${INFO}1F`} />)}
            </div>
            {(rep.insumos.length > 0 || rep.observacion) && (
              <div style={{ fontSize: 12, color: t.subtle }}>
                {rep.insumos.length > 0 && <div>Insumos enviados para el reproceso: <b style={{ color: t.fg }}>{rep.insumos.map((i) => `${i.nombre} (${i.cantidad_disponible} de ${i.cantidad} ${i.unidad})`).join(', ')}</b></div>}
                {rep.observacion && <div>Observación: {rep.observacion}</div>}
              </div>
            )}
            {ambito.lineas.map((linea) => (
              <TallaCard key={linea.id_detalle_de_remision} linea={linea} dark={dark}
                etiqueta={`${linea.cantidad} pieza(s) a reprocesar`}
                tareas={detalle.asignaciones.filter((a) => a.id_reproceso === rep.id_reproceso && a.id_detalle_de_remision === linea.id_detalle_de_remision)}
                faltantes={rep.faltantes.filter((f) => f.id_detalle_de_remision === linea.id_detalle_de_remision)}
                insumosCliente={insumosCliente}
                editable={editable}
                onAgregar={() => onAgregar(rep, linea.id_detalle_de_remision)}
                onEditar={onEditar}
                onEliminar={onEliminar} />
            ))}
          </div>
        );
      })}
      {cancelados.length > 0 && (
        <div style={{ borderTop: `1px solid ${t.border}`, padding: '8px 16px', fontSize: 11, color: t.subtle }}>
          Cancelados: {cancelados.map((r) => `#${r.numero} (${fechaHora(r.fecha_estado)})`).join(', ')}
        </div>
      )}
    </div>
  );
};

// ==========================================
// ABRIR UN REPROCESO (piezas, procesos e insumos que envió el cliente)
// ==========================================
const ReprocesoModal: React.FC<{
  detalle: ProduccionDetalle;
  procesos: Proceso[] | null;
  ficha: { url: string | null; nombre: string } | null;
  dark: boolean;
  onClose: () => void;
  onCreado: (r: Reproceso[]) => void;
}> = ({ detalle, procesos, ficha, dark, onClose, onCreado }) => {
  const t = tema(dark);
  const conDefectos = detalle.lineas.filter((l) => l.defectuosas_disponibles > 0);
  const [cantidades, setCantidades] = useState<Record<string, number | ''>>(
    () => Object.fromEntries(conDefectos.map((l) => [l.id_detalle_de_remision, l.defectuosas_disponibles])));
  const [pasos, setPasos] = useState<PasoGuardar[]>([]);
  const [insumos, setInsumos] = useState<{ nombre: string; cantidad: number | ''; unidad: string }[]>([]);
  const [observacion, setObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(false);   // ya intentó guardar: se ven también los errores de listas vacías
  // ---------- Validación en tiempo real ----------
  const totalPiezas = conDefectos.reduce((s, l) => s + Number(cantidades[l.id_detalle_de_remision] || 0), 0);
  const errorPiezas = totalPiezas <= 0 ? 'Escribe cuántas piezas vas a reprocesar (al menos una).' : null;
  const errorTalla = (l: LineaRemision) => {
    const n = Number(cantidades[l.id_detalle_de_remision] || 0);
    return n > l.defectuosas_disponibles ? `Máximo ${l.defectuosas_disponibles}.` : null;
  };
  const errorPasos = pasos.length === 0 ? 'Agrega al menos un proceso.' : null;
  const errorInsumo = (i: { nombre: string; cantidad: number | '' }) =>
    !i.nombre.trim() ? 'Escribe el insumo.' : i.cantidad === '' || Number(i.cantidad) <= 0 ? 'Escribe la cantidad.' : null;
  const titulo: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.subtle, marginBottom: 8 };

  const guardar = async () => {
    setIntento(true);
    const tallas = conDefectos
      .map((l) => ({ id_detalle_de_remision: l.id_detalle_de_remision, cantidad: Number(cantidades[l.id_detalle_de_remision] || 0), linea: l }))
      .filter((x) => x.cantidad > 0);
    if (tallas.length === 0) { toast.error('Escribe cuántas piezas de cada talla se van a reprocesar.'); return; }
    const excede = tallas.find((x) => !Number.isInteger(x.cantidad) || x.cantidad > x.linea.defectuosas_disponibles);
    if (excede) { toast.error(`De ${excede.linea.nombre_de_la_pieza} talla ${excede.linea.talla} solo hay ${excede.linea.defectuosas_disponibles} defectuosa(s).`); return; }
    if (pasos.length === 0) { toast.error('Agrega los procesos que lleva el reproceso.'); return; }
    const claves = pasos.map((p) => `${p.id_proceso}|${(p.descripcion ?? '').trim().toLowerCase()}`);
    if (new Set(claves).size !== claves.length) { toast.error('Si repites un proceso, ponle una descripción distinta a cada uno.'); return; }
    if (pasos.some((p) => errorVeces(p.veces))) { toast.error('Las veces de cada proceso deben ser un número entero de 1 a 20.'); return; }
    const insumosOk = insumos.filter((i) => i.nombre.trim() || i.cantidad !== '');
    if (insumosOk.some((i) => !i.nombre.trim() || !Number.isInteger(Number(i.cantidad)) || Number(i.cantidad) <= 0)) {
      toast.error('Cada insumo enviado necesita nombre y una cantidad entera mayor a 0.'); return;
    }
    setGuardando(true);
    try {
      onCreado(await produccionService.crearReproceso(detalle.id_produccion, {
        tallas: tallas.map(({ id_detalle_de_remision, cantidad }) => ({ id_detalle_de_remision, cantidad })),
        pasos: pasos.map((p) => ({ id_proceso: p.id_proceso, descripcion: (p.descripcion ?? '').trim() || null, veces: Number(p.veces ?? 1) })),
        insumos: insumosOk.map((i) => ({ nombre: i.nombre.trim(), cantidad: Number(i.cantidad), unidad: i.unidad })),
        observacion: observacion.trim() || null,
      }));
    } catch (e) {
      toast.error(mensajeError(e), { duration: 8000 });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title={`Reprocesar piezas defectuosas — ${detalle.id_produccion}`} icon={<RotateCcw size={16} color={DANGER} />}
      onClose={onClose} onSave={guardar} saveLabel="Abrir reproceso" saving={guardando} dark={dark} maxWidth="1100px">
      <div style={{ fontSize: 13, color: t.subtle, marginTop: -4 }}>
        El reproceso queda dentro de esta misma producción y remisión. Elige las piezas, <b>solo</b> los procesos que hacen falta
        y, si el cliente envió material, regístralo. Mientras el reproceso esté abierto no se puede finalizar la producción.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <FichaTecnica ficha={ficha} dark={dark} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={titulo}>1. Piezas a reprocesar <span style={{ color: DANGER }}>*</span></div>
            {conDefectos.length === 0 ? (
              <div style={{ fontSize: 12, color: t.subtle }}>No hay piezas defectuosas por reprocesar.</div>
            ) : conDefectos.map((l) => (
              <div key={l.id_detalle_de_remision} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 13, flex: 1 }}><b>{l.nombre_de_la_pieza}</b> talla {l.talla} <span style={{ color: DANGER }}>({l.defectuosas_disponibles} defectuosa(s))</span></span>
                <input type="number" min={0} max={l.defectuosas_disponibles} value={cantidades[l.id_detalle_de_remision] ?? ''}
                  onChange={(e) => setCantidades({ ...cantidades, [l.id_detalle_de_remision]: e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))) })}
                  style={estiloInput(dark, { width: 90, padding: '6px 10px', border: `1px solid ${errorTalla(l) || (intento && errorPiezas) ? DANGER : t.border}` })} />
                {errorTalla(l) && <span style={{ fontSize: 11, color: DANGER, fontWeight: 600 }}>{errorTalla(l)}</span>}
              </div>
            ))}
            {conDefectos.length > 0 && errorPiezas && <div style={{ fontSize: 11, color: DANGER, fontWeight: 600 }}>{errorPiezas}</div>}
          </div>

          <div>
            <div style={titulo}>2. Procesos del reproceso ({pasos.length}) <span style={{ color: DANGER }}>*</span></div>
            {pasos.length === 0 ? (
              <div style={{ fontSize: 12, color: intento ? DANGER : t.subtle, fontWeight: intento ? 600 : 400, padding: 10, border: `1px dashed ${intento && errorPasos ? DANGER : t.border}`, borderRadius: 8 }}>
                {intento ? errorPasos : 'Agrega solo los procesos que necesitan estas piezas.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pasos.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, border: `1px solid ${GOLD}60`, background: `${GOLD}0F` }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>{i + 1}.</span>
                    <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{procesos?.find((x) => x.id === p.id_proceso)?.nombre ?? p.id_proceso}</span>
                    <input value={p.descripcion ?? ''} maxLength={100} placeholder="Descripción (opcional)"
                      onChange={(e) => setPasos(pasos.map((x, j) => (j === i ? { ...x, descripcion: e.target.value } : x)))}
                      style={estiloInput(dark, { padding: '5px 10px', fontSize: 12 })} />
                    <label title="Cuántas veces se hace este proceso a cada pieza" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Veces<span style={{ color: DANGER }}>*</span>
                      <input type="number" min={1} max={20} value={p.veces ?? 1}
                        onChange={(e) => setPasos(pasos.map((x, j) => (j === i ? { ...x, veces: e.target.value === '' ? '' : Number(e.target.value) } : x)))}
                        style={estiloInput(dark, { padding: '5px 6px', fontSize: 12, width: 58, border: `1px solid ${errorVeces(p.veces) ? DANGER : t.border}` })} />
                    </label>
                    <button type="button" onClick={() => setPasos(pasos.filter((_, j) => j !== i))} title="Quitar"
                      style={{ background: 'transparent', border: 'none', color: DANGER, cursor: 'pointer', padding: 4, display: 'flex' }}><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {procesos === null ? <span style={{ fontSize: 12, color: t.subtle }}>Cargando procesos...</span> : procesos.map((p) => (
                <button key={p.id} type="button" onClick={() => setPasos([...pasos, { id_paso: null, id_proceso: p.id, descripcion: '', veces: 1 }])}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 999, border: `1px solid ${t.border}`, background: t.surface, color: t.fg, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
                  <Plus size={12} color={GOLD} /> {p.nombre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={titulo}>3. Insumos que envió el cliente (opcional)</div>
            {insumos.map((ins, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px auto', gap: 6, marginBottom: 6 }}>
                <input value={ins.nombre} maxLength={100} placeholder="Insumo *" onChange={(e) => setInsumos(insumos.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))}
                  style={estiloInput(dark, { padding: '6px 10px', fontSize: 12, border: `1px solid ${(intento || ins.cantidad !== '') && !ins.nombre.trim() ? DANGER : t.border}` })} />
                <input type="number" min={1} value={ins.cantidad} placeholder="Cant. *" onChange={(e) => setInsumos(insumos.map((x, j) => (j === i ? { ...x, cantidad: e.target.value === '' ? '' : Math.floor(Number(e.target.value)) } : x)))}
                  style={estiloInput(dark, { padding: '6px 10px', fontSize: 12, border: `1px solid ${(intento || ins.nombre.trim()) && (ins.cantidad === '' || Number(ins.cantidad) <= 0) ? DANGER : t.border}` })} />
                <select value={ins.unidad} onChange={(e) => setInsumos(insumos.map((x, j) => (j === i ? { ...x, unidad: e.target.value } : x)))} style={estiloInput(dark, { padding: '6px 8px', fontSize: 12 })}>
                  {UNIDADES_INSUMO.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <button type="button" onClick={() => setInsumos(insumos.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: DANGER, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
                {(intento || ins.nombre.trim() || ins.cantidad !== '') && errorInsumo(ins) && (
                  <div style={{ gridColumn: '1 / -1', fontSize: 11, color: DANGER, fontWeight: 600, marginTop: -2 }}>{errorInsumo(ins)}</div>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setInsumos([...insumos, { nombre: '', cantidad: '', unidad: 'Metros' }])}
              style={{ background: 'transparent', border: `1px dashed ${GOLD}`, color: GOLD, borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
              <Plus size={12} /> Agregar insumo enviado
            </button>
            <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
              Se suman a los insumos de la remisión marcados "para reproceso". Si no enviaron nada, se usan los insumos del taller (y lo que sobre queda en el inventario).
            </div>
          </div>

          <Field label="Observación (opcional)" dark={dark}>
            <input value={observacion} maxLength={200} placeholder="Ej. el cliente envió tela para 2 mangas" onChange={(e) => setObservacion(e.target.value)} style={estiloInput(dark)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
};

// ==========================================
// PIEZAS DEFECTUOSAS (apartado de la producción)
// ==========================================
const TablaDefectuosas: React.FC<{ defectuosas: PiezaDefectuosa[]; dark: boolean }> = ({ defectuosas, dark }) => {
  const t = tema(dark);
  const total = defectuosas.reduce((s, d) => s + d.cantidad_defectuosa, 0);
  return (
    <div style={{ border: `1px solid ${total ? `${DANGER}55` : t.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: total ? `${DANGER}10` : t.surface, flexWrap: 'wrap' }}>
        <AlertTriangle size={16} color={total ? DANGER : t.subtle} />
        <b style={{ fontSize: 13 }}>Piezas defectuosas</b>
        <Pill texto={`${total} en total`} color={total ? DANGER : '#8A8A8A'} bg={total ? `${DANGER}1A` : '#8A8A8A1F'} />
      </div>
      <TableShell headers={['Fecha y hora', 'Prenda / talla', 'Proceso', 'Pieza', 'Empleado', 'Cantidad', 'Motivo']} dark={dark}>
        {defectuosas.length === 0 ? (
          <FilaMensaje colSpan={7} dark={dark} texto="No se han reportado piezas defectuosas en esta producción." />
        ) : defectuosas.map((d) => (
          <tr key={d.id_registro_diario} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '8px 12px', fontSize: 12, fontFamily: 'monospace', color: t.subtle, whiteSpace: 'nowrap' }}>{fechaHora(d.fecha)}</td>
            <td style={{ padding: '8px 12px', fontSize: 12 }}>{d.prenda} · {d.talla}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600 }}>{d.paso ?? '—'}</td>
            <td style={{ padding: '8px 12px', fontSize: 12 }}>{d.pieza}</td>
            <td style={{ padding: '8px 12px', fontSize: 12 }}>{d.empleado}</td>
            <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 800, color: DANGER }}>{d.cantidad_defectuosa}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, color: d.motivo_defecto ? t.fg : t.subtle }}>{d.motivo_defecto ?? 'Sin motivo'}</td>
          </tr>
        ))}
      </TableShell>
    </div>
  );
};

// ==========================================
// VER DETALLE (ojo): toda la información de la producción, solo lectura
// ==========================================
const DetalleProduccion: React.FC<{
  detalle: ProduccionDetalle;
  registros: RegistroDiario[] | null;
  ficha: { url: string | null; nombre: string } | null;
  onClose: () => void;
  dark: boolean;
}> = ({ detalle, registros, ficha, onClose, dark }) => {
  const t = tema(dark);
  const sinAsignar = (idLinea: string) => detalle.faltantes
    .filter((f) => f.id_detalle_de_remision === idLinea)
    .map((f) => `${f.paso}: ${f.cantidad - f.asignado}`);
  const celda: React.CSSProperties = { padding: '8px 12px', fontSize: 12 };
  const subtitulo = (icono: React.ReactNode, texto: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{icono} {texto}</div>
  );

  return (
    <Modal title={`Detalle — Producción ${detalle.id_produccion}`} icon={<Eye size={16} color={GOLD} />} onClose={onClose} dark={dark} maxWidth="1100px">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {([
          ['Remisión', <IdBadge key="r" id={detalle.id_remision} />],
          ['Cliente', <b key="c">{detalle.cliente}</b>],
          ['Estado', <span key="e" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}><PillEstado estado={detalle.estado} /><span style={{ fontSize: 11, color: t.subtle }}>{fechaHora(detalle.fecha_estado)}</span></span>],
          ['Fecha de inicio', fecha(detalle.fecha_inicio)],
          ['Fecha de entrega', fecha(detalle.fecha_entrega)],
          ['Prendas terminadas', <span key="pt"><b style={{ fontSize: 15 }}>{detalle.prendas_terminadas}</b> de {detalle.total_prendas}</span>],
          ['Unidades asignadas', detalle.total_asignado],
          ['Terminadas', <b key="tr" style={{ color: SUCCESS }}>{detalle.total_realizado}</b>],
          ['Defectuosas', <b key="td" style={{ color: detalle.total_defectuoso ? DANGER : t.subtle }}>{detalle.total_defectuoso}</b>],
          ['Pendientes por reportar', <b key="tp" style={{ color: detalle.total_pendiente ? WARNING : t.subtle }}>{detalle.total_pendiente}</b>],
          ['Ficha técnica', ficha?.url
            ? <a key="f" href={ficha.url} target="_blank" rel="noopener noreferrer" style={{ color: INFO, fontWeight: 600, textDecoration: 'none' }}>{detalle.ficha_tecnica_nombre}</a>
            : detalle.ficha_tecnica_nombre],
        ] as [string, React.ReactNode][]).map(([label, valor]) => (
          <div key={label} style={{ background: t.surface, borderRadius: 8, padding: '10px 14px', minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.05em', color: t.subtle, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>{valor}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: t.surface, borderRadius: 8, padding: '10px 14px' }}>
        <ListChecks size={16} color={GOLD} />
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: t.subtle }}>Procesos de la prenda:</span>
        {detalle.pasos.length === 0
          ? <span style={{ fontSize: 12, color: WARNING, fontWeight: 600 }}>Aún no se han elegido</span>
          : detalle.pasos.map((p, i) => <Pill key={p.id_paso} texto={`${i + 1}. ${p.paso}`} color={INFO} bg={`${INFO}1F`} />)}
      </div>

      <div>
        {subtitulo(<Shirt size={15} color={GOLD} />, 'Tallas de la remisión')}
        <TableShell headers={['Prenda', 'Talla', 'Pedidas', 'Terminadas', 'Defectuosas', 'Falta asignar']} dark={dark}>
          {detalle.lineas.map((l) => {
            const falta = sinAsignar(l.id_detalle_de_remision);
            return (
              <tr key={l.id_detalle_de_remision} style={{ borderBottom: `1px solid ${t.border}` }}>
                <td style={{ ...celda, fontWeight: 600 }}>{l.nombre_de_la_pieza}</td>
                <td style={celda}><Pill texto={l.talla} color={GOLD} bg={`${GOLD}1F`} /></td>
                <td style={{ ...celda, fontWeight: 700 }}>{l.cantidad}</td>
                <td style={{ ...celda, fontWeight: 700, color: SUCCESS }}>{l.terminadas}</td>
                <td style={{ ...celda, fontWeight: 700, color: l.total_defectuoso ? DANGER : t.subtle }}>{l.total_defectuoso}</td>
                <td style={{ ...celda, color: falta.length ? WARNING : t.subtle }}>{falta.length ? falta.join(' · ') : 'Nada'}</td>
              </tr>
            );
          })}
        </TableShell>
      </div>

      <div>
        {subtitulo(<ClipboardPlus size={15} color={GOLD} />, `Tareas asignadas (${detalle.asignaciones.length})`)}
        <TableShell headers={['Tarea', 'Tipo', 'Talla', 'Proceso', 'Pieza', 'Empleado', 'Máquina', 'Asignada el', 'Asignado', 'Terminadas', 'Defectuosas', 'Pendiente']} dark={dark}>
          {detalle.asignaciones.length === 0 ? (
            <FilaMensaje colSpan={12} dark={dark} texto="Todavía no hay tareas asignadas." />
          ) : detalle.asignaciones.map((a) => (
            <tr key={a.id_detalle_de_produccion} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={celda}><IdBadge id={a.id_detalle_de_produccion} /></td>
              <td style={celda}>
                {a.id_reproceso
                  ? <Pill texto={`Reproceso #${detalle.reprocesos.find((r) => r.id_reproceso === a.id_reproceso)?.numero ?? ''}`} color={DANGER} bg={`${DANGER}1A`} />
                  : <span style={{ color: t.subtle }}>Normal</span>}
              </td>
              <td style={celda}>{a.prenda} · {a.talla}</td>
              <td style={{ ...celda, fontWeight: 700 }}>{a.paso ?? a.proceso ?? '—'}</td>
              <td style={celda}>{a.pieza}</td>
              <td style={{ ...celda, fontWeight: 600 }}>{a.empleado}</td>
              <td style={celda}>{a.maquina}</td>
              <td style={{ ...celda, color: t.subtle }}>{fecha(a.fecha_asignada)}</td>
              <td style={{ ...celda, fontWeight: 700 }}>{a.cantidad_asignada}</td>
              <td style={{ ...celda, fontWeight: 700, color: SUCCESS }}>{a.cantidad_realizada}</td>
              <td style={{ ...celda, fontWeight: 700, color: a.cantidad_defectuosa ? DANGER : t.subtle }}>{a.cantidad_defectuosa}</td>
              <td style={{ ...celda, fontWeight: 700, color: a.cantidad_pendiente ? WARNING : t.subtle }}>{a.cantidad_pendiente}</td>
            </tr>
          ))}
        </TableShell>
      </div>

      <TablaDefectuosas defectuosas={detalle.defectuosas} dark={dark} />

      <div>
        {subtitulo(<RotateCcw size={15} color={GOLD} />, `Reprocesos (${detalle.reprocesos.length})`)}
        <TableShell headers={['Reproceso', 'Situación', 'Piezas por talla', 'Procesos', 'Insumos enviados', 'Tareas', 'Abierto por']} dark={dark}>
          {detalle.reprocesos.length === 0 ? (
            <FilaMensaje colSpan={7} dark={dark} texto="Esta producción no ha tenido reprocesos." />
          ) : detalle.reprocesos.map((r) => (
            <tr key={r.id_reproceso} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={celda}><b>#{r.numero}</b> <IdBadge id={r.id_reproceso} /></td>
              <td style={celda}><Pill texto={r.situacion} color={COLOR_REPROCESO[r.situacion]} bg={`${COLOR_REPROCESO[r.situacion]}1F`} /></td>
              <td style={celda}>{r.tallas.map((x) => `${x.nombre_de_la_pieza} ${x.talla}: ${x.cantidad}`).join(' · ')}</td>
              <td style={celda}>{r.pasos.map((p) => p.paso).join(', ') || '—'}</td>
              <td style={celda}>{r.insumos.map((i) => `${i.nombre} ${i.cantidad} ${i.unidad}`).join(', ') || '—'}</td>
              <td style={celda}>{r.tareas}</td>
              <td style={{ ...celda, color: t.subtle }}>{r.creado_por_nombre ?? '—'} · {fechaHora(r.fecha_creacion)}{r.observacion ? <div>{r.observacion}</div> : null}</td>
            </tr>
          ))}
        </TableShell>
      </div>

      <div>
        {subtitulo(<ClipboardList size={15} color={GOLD} />, 'Reportes diarios')}
        <TableShell headers={['Fecha y hora', 'Empleado', 'Prenda / talla', 'Proceso', 'Pieza', 'Terminadas', 'Defectuosas']} dark={dark}>
          {registros === null || registros.length === 0 ? (
            <FilaMensaje colSpan={7} dark={dark} cargando={registros === null} texto="Todavía no hay reportes diarios." />
          ) : registros.map((r) => (
            <tr key={r.id_registro_diario} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={{ ...celda, fontFamily: 'monospace', color: t.subtle, whiteSpace: 'nowrap' }}>{fechaHora(r.fecha)}</td>
              <td style={{ ...celda, fontWeight: 600 }}>{r.empleado}</td>
              <td style={celda}>{r.prenda} · {r.talla}</td>
              <td style={celda}>{r.paso ?? r.proceso ?? '—'}</td>
              <td style={celda}>{r.pieza}</td>
              <td style={{ ...celda, fontWeight: 700 }}>{r.cantidad}</td>
              <td style={{ ...celda, fontWeight: 700, color: r.cantidad_defectuosa ? DANGER : t.subtle }}>{r.cantidad_defectuosa}</td>
            </tr>
          ))}
        </TableShell>
      </div>
    </Modal>
  );
};

// ==========================================
// FICHA TÉCNICA (imagen o PDF de la remisión)
// ==========================================
const FichaTecnica: React.FC<{ ficha: { url: string | null; nombre: string } | null; dark: boolean }> = ({ ficha, dark }) => {
  const t = tema(dark);
  const caja: React.CSSProperties = {
    border: `1px solid ${t.border}`, borderRadius: 12, background: t.surface, minHeight: 320,
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative',
  };
  if (!ficha) return <div style={caja}><span style={{ fontSize: 13, color: t.subtle }}>Cargando ficha técnica...</span></div>;
  if (!ficha.url) {
    return (
      <div style={{ ...caja, flexDirection: 'column', gap: 8, padding: 16, textAlign: 'center' }}>
        <FileText size={28} color={t.subtle} />
        <span style={{ fontSize: 13, color: t.subtle }}>La remisión no tiene archivo de ficha técnica cargado.</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{ficha.nombre}</span>
      </div>
    );
  }
  const esPdf = ficha.url.toLowerCase().split('?')[0].endsWith('.pdf');
  return (
    <div>
      <div style={caja}>
        {esPdf
          ? <iframe src={ficha.url} title="Ficha técnica" style={{ width: '100%', height: '60vh', border: 'none' }} />
          : <img src={ficha.url} alt="Ficha técnica" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', display: 'block' }} />}
      </div>
      <a href={ficha.url} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 12, color: INFO, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, textDecoration: 'none' }}>
        <ExternalLink size={12} /> Abrir la ficha en grande ({ficha.nombre})
      </a>
    </div>
  );
};

// ==========================================
// CAMPOS DE UNA TAREA
// ==========================================
const CamposTarea: React.FC<{
  tarea: TareaDraft;
  onChange: (t: TareaDraft) => void;
  detalle: ProduccionDetalle;
  cat: Catalogos;
  maquinas: MaquinaDisponible[];
  disponibilidad: EmpleadoDisponible[];
  insumosCliente: InsumoEnviado[];
  asignacion: Asignacion | null;
  dark: boolean;
  /** true después de intentar guardar: se muestran todos los errores, aunque no se hayan tocado. */
  mostrarErrores?: boolean;
}> = ({ tarea, onChange, detalle, cat, maquinas, disponibilidad, insumosCliente, asignacion, dark, mostrarErrores = false }) => {
  const t = tema(dark);
  // Validación en tiempo real: cada campo se valida apenas se toca
  const [tocados, setTocados] = useState<Set<keyof TareaDraft>>(new Set());
  const set = (cambios: Partial<TareaDraft>) => {
    setTocados((x) => new Set([...x, ...(Object.keys(cambios) as (keyof TareaDraft)[])]));
    onChange({ ...tarea, ...cambios });
  };
  const sel = estiloInput(dark);
  // Con reportes ya no se cambia quién, qué talla, qué paso ni qué pieza (solo cantidad, máquina e insumo)
  const reportado = asignacion ? asignacion.cantidad_realizada + asignacion.cantidad_defectuosa : 0;
  const fijo = reportado > 0;
  const selFijo = fijo ? { ...sel, opacity: 0.6, cursor: 'not-allowed' } : sel;

  const linea = detalle.lineas.find((l) => l.id_detalle_de_remision === tarea.id_detalle_de_remision);
  const paso = detalle.pasos.find((p) => p.id_paso === tarea.id_paso);
  // Lo que queda de cada paso en la talla elegida (prendas × veces - lo ya asignado)
  const quedanEn = (p: PasoProduccion) => (linea
    ? topePaso(linea.cantidad, p) - yaAsignado(detalle.asignaciones, { id_detalle_de_remision: linea.id_detalle_de_remision, id_paso: p.id_paso }, asignacion?.id_detalle_de_produccion)
    : null);
  const quedan = paso ? quedanEn(paso) : null;
  // Solo se ofrecen los pasos que todavía tienen unidades por asignar (y el de la tarea, al editar)
  const pasosConCupo = detalle.pasos.filter((p) => p.id_paso === asignacion?.id_paso || (quedanEn(p) ?? 1) > 0);
  const pasosCompletos = linea ? detalle.pasos.filter((p) => !pasosConCupo.includes(p)) : [];

  // Solo las máquinas que sirven para el proceso del paso (si tiene configuradas)...
  const delProceso = paso && paso.maquinas.length > 0 ? maquinas.filter((m) => paso.maquinas.includes(m.id_maquina)) : maquinas;
  // ...y que estén libres (o la que ya tiene esta tarea, al editar)
  const libres = delProceso.filter((m) => m.disponible || m.id_maquina === asignacion?.id_tipo_maquina);
  const ocupadas = delProceso.filter((m) => !libres.includes(m));

  // Solo los empleados sin tareas pendientes (y el que ya tiene esta tarea, al editar)
  const ocupado = (id: string) => disponibilidad.find((d) => d.id_empleado === id && !d.disponible);
  const empleadosLibres = cat.empleados.filter((e) => !ocupado(e.id) || e.id === asignacion?.id_empleado);
  const empleadosOcupados = disponibilidad.filter((d) => d.en_taller && !d.disponible && d.id_empleado !== asignacion?.id_empleado);
  const empleadosAusentes = disponibilidad.filter((d) => !d.en_taller && d.id_empleado !== asignacion?.id_empleado);

  // Lo que ya está apartado de cada insumo en ESTE formulario (al editar, la cantidad actual vuelve a contar)
  const disponibleCliente = (i: InsumoEnviado) =>
    i.cantidad_disponible + (asignacion?.id_insumos_enviados_x_cliente === i.id_insumo_enviado ? asignacion.cantidad_insumo ?? 0 : 0);
  const disponibleTaller = (i: Insumo) =>
    i.stock + (asignacion?.id_insumos === i.id ? asignacion.cantidad_insumo ?? 0 : 0);
  const maxInsumo = tarea.insumo.startsWith('c:')
    ? (() => { const i = insumosCliente.find((x) => `c:${x.id_insumo_enviado}` === tarea.insumo); return i ? { n: disponibleCliente(i), u: i.unidad } : null; })()
    : tarea.insumo.startsWith('t:')
      ? (() => { const i = cat.insumos.find((x) => `t:${x.id}` === tarea.insumo); return i ? { n: disponibleTaller(i), u: 'und' } : null; })()
      : null;

  // ---------- Errores de cada campo (las mismas reglas que se revisan al guardar) ----------
  const cant = Number(tarea.cantidad_asignada);
  const empOcupado = tarea.id_empleado && tarea.id_empleado !== asignacion?.id_empleado
    ? disponibilidad.find((d) => d.id_empleado === tarea.id_empleado && !d.disponible) : undefined;
  const errores: Partial<Record<keyof TareaDraft, string | null>> = {
    id_detalle_de_remision: tarea.id_detalle_de_remision ? null : 'Elige la talla.',
    id_paso: tarea.id_paso ? null : 'Elige el proceso.',
    id_tipo_pieza: tarea.id_tipo_pieza ? null : 'Elige la pieza.',
    id_empleado: !tarea.id_empleado ? 'Elige el empleado.'
      : empOcupado ? (!empOcupado.en_taller ? `${empOcupado.nombre} no está en el taller ahora.` : `${empOcupado.nombre} está ocupado.`) : null,
    id_tipo_maquina: tarea.id_tipo_maquina ? null : 'Elige la máquina.',
    cantidad_asignada: tarea.cantidad_asignada === '' || !Number.isInteger(cant) || cant <= 0 ? 'Escribe una cantidad entera mayor a 0.'
      : quedan !== null && cant > quedan && (!asignacion || cant > asignacion.cantidad_asignada || tarea.id_paso !== asignacion.id_paso)
        ? `Solo quedan ${Math.max(quedan, 0)} und de ese proceso en la talla${paso && paso.veces > 1 ? ` (${linea?.cantidad} prendas × ${paso.veces})` : ''}.`
        : cant < reportado ? `Ya tiene ${reportado} reportadas: no puede ser menor.` : null,
    cantidad_insumo: !tarea.insumo ? null
      : tarea.cantidad_insumo === '' || !Number.isInteger(Number(tarea.cantidad_insumo)) || Number(tarea.cantidad_insumo) <= 0
        ? 'Escribe la cantidad de insumo.'
        : maxInsumo && Number(tarea.cantidad_insumo) > maxInsumo.n ? `Supera lo disponible (${maxInsumo.n} ${maxInsumo.u}).` : null,
  };
  const ver = (c: keyof TareaDraft) => (mostrarErrores || tocados.has(c) ? errores[c] ?? null : null);
  const borde = (c: keyof TareaDraft, base: React.CSSProperties = sel): React.CSSProperties =>
    ({ ...base, border: `1px solid ${ver(c) ? DANGER : t.border}` });

  return (
    <>
      <div style={{ fontSize: 12, color: t.subtle }}>Los campos con <b style={{ color: DANGER }}>*</b> son obligatorios.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
        <Field label="Talla *" dark={dark} error={ver('id_detalle_de_remision')}>
          <select value={tarea.id_detalle_de_remision} disabled={fijo} onChange={(e) => set({ id_detalle_de_remision: e.target.value })} style={borde('id_detalle_de_remision', selFijo)}>
            <option value="">Seleccionar...</option>
            {detalle.lineas.map((l) => (
              <option key={l.id_detalle_de_remision} value={l.id_detalle_de_remision}>
                {l.nombre_de_la_pieza} · Talla {l.talla} ({l.cantidad} und)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Proceso *" dark={dark} error={ver('id_paso')}>
          <select value={tarea.id_paso} disabled={fijo} onChange={(e) => set({ id_paso: e.target.value, id_tipo_maquina: '' })} style={borde('id_paso', selFijo)}>
            <option value="">{linea && pasosConCupo.length === 0 ? 'Todos los procesos de esta talla ya están asignados' : 'Seleccionar...'}</option>
            {pasosConCupo.map((p) => {
              const q = quedanEn(p);
              return <option key={p.id_paso} value={p.id_paso}>{nombrePaso(p)}{q !== null ? ` — quedan ${Math.max(q, 0)} und` : ''}</option>;
            })}
          </select>
          {pasosCompletos.length > 0 && (
            <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
              Ya asignados completos: {pasosCompletos.map(nombrePaso).join(', ')}
            </div>
          )}
        </Field>
        <Field label="Pieza *" dark={dark} error={ver('id_tipo_pieza')}>
          <select value={tarea.id_tipo_pieza} disabled={fijo} onChange={(e) => set({ id_tipo_pieza: e.target.value })} style={borde('id_tipo_pieza', selFijo)}>
            <option value="">Seleccionar...</option>
            {cat.piezas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Field>
        <Field label="Empleado *" dark={dark} error={ver('id_empleado')}>
          <select value={tarea.id_empleado} disabled={fijo} onChange={(e) => set({ id_empleado: e.target.value })} style={borde('id_empleado', selFijo)}>
            <option value="">{empleadosLibres.length === 0 ? 'No hay empleados libres en este momento' : 'Seleccionar...'}</option>
            {empleadosLibres.map((e) => <option key={e.id} value={e.id}>{e.nombre}{e.rol ? ` (${e.rol})` : ''}</option>)}
          </select>
          <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>Solo los que están en el taller y sin tareas pendientes.</div>
          {empleadosOcupados.length > 0 && (
            <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
              Ocupados: {empleadosOcupados.map((d) => `${d.nombre} (${d.unidades_pendientes} und pendientes)`).join(', ')}
            </div>
          )}
          {empleadosAusentes.length > 0 && (
            <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
              No están en el taller ahora: {empleadosAusentes.map((d) => `${d.nombre} (${d.presente_hoy ? 'salió' : d.estado_asistencia})`).join(', ')}
            </div>
          )}
        </Field>
        <Field label="Máquina *" dark={dark} error={ver('id_tipo_maquina')}>
          <select value={tarea.id_tipo_maquina} onChange={(e) => set({ id_tipo_maquina: e.target.value })} style={borde('id_tipo_maquina')}>
            <option value="">{libres.length === 0 ? 'No hay máquinas libres en este momento' : 'Seleccionar...'}</option>
            {libres.map((m) => <option key={m.id_maquina} value={m.id_maquina}>{m.nombre}</option>)}
          </select>
          <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
            {paso && paso.maquinas.length > 0 ? `Solo las de ${paso.proceso} que están libres.` : 'Solo las que están libres.'}
          </div>
          {ocupadas.length > 0 && (
            <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
              Ocupadas: {ocupadas.map((m) => `${m.nombre} (${m.ocupada_por_empleado})`).join(', ')}
            </div>
          )}
        </Field>
        <Field label="Cantidad a asignar *" dark={dark} error={ver('cantidad_asignada')}>
          <input type="number" min={1} value={tarea.cantidad_asignada}
            onChange={(e) => set({ cantidad_asignada: e.target.value === '' ? '' : Number(e.target.value) })} style={borde('cantidad_asignada')} />
          {quedan !== null && !ver('cantidad_asignada') && (
            <div style={{ fontSize: 11, color: quedan > 0 ? t.subtle : DANGER, marginTop: 4 }}>
              {quedan > 0 ? `Quedan ${quedan} und de esta talla para ese paso y pieza.` : 'Ya se asignaron todas las unidades de esta talla para ese paso y pieza.'}
            </div>
          )}
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
        <Field label="Insumo (opcional)" dark={dark}>
          <select value={tarea.insumo} onChange={(e) => set({ insumo: e.target.value, cantidad_insumo: '' })} style={sel}>
            <option value="">Sin insumo</option>
            <optgroup label={`Enviados por el cliente (remisión ${detalle.id_remision})`}>
              {insumosCliente.length === 0
                ? <option disabled value="-">Esta remisión no tiene insumos enviados</option>
                : insumosCliente.map((i) => (
                  <option key={i.id_insumo_enviado} value={`c:${i.id_insumo_enviado}`} disabled={disponibleCliente(i) <= 0 && tarea.insumo !== `c:${i.id_insumo_enviado}`}>
                    {i.nombre} ({i.id_insumo_enviado}) — disponible {disponibleCliente(i)} de {i.cantidad} {i.unidad}
                  </option>
                ))}
            </optgroup>
            <optgroup label="Del taller (inventario)">
              {cat.insumos.map((i) => (
                <option key={i.id} value={`t:${i.id}`} disabled={disponibleTaller(i) <= 0 && tarea.insumo !== `t:${i.id}`}>
                  {i.nombre} ({i.id}) — stock {disponibleTaller(i)}
                </option>
              ))}
            </optgroup>
          </select>
          <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
            {insumosCliente.length === 0
              ? 'Esta remisión no tiene insumos enviados: solo puedes usar insumos del taller.'
              : `Esta remisión tiene ${insumosCliente.length} insumo(s) enviado(s) por el cliente; también puedes usar los del taller.`}
          </div>
        </Field>
        <Field label={tarea.insumo ? 'Cantidad de insumo *' : 'Cantidad de insumo'} dark={dark} error={ver('cantidad_insumo')}>
          <input type="number" min={1} max={maxInsumo?.n} value={tarea.cantidad_insumo} disabled={!tarea.insumo}
            onChange={(e) => set({ cantidad_insumo: e.target.value === '' ? '' : Number(e.target.value) })}
            style={{ ...borde('cantidad_insumo'), opacity: tarea.insumo ? 1 : 0.5 }} />
          {maxInsumo && !ver('cantidad_insumo') && (
            <div style={{ fontSize: 11, color: Number(tarea.cantidad_insumo) > maxInsumo.n ? DANGER : t.subtle, marginTop: 4 }}>
              {Number(tarea.cantidad_insumo) > maxInsumo.n ? 'Supera lo disponible: ' : 'Máximo: '}{maxInsumo.n} {maxInsumo.u}
            </div>
          )}
        </Field>
      </div>

      {asignacion && fijo && (
        <div style={{ fontSize: 12, color: WARNING, fontWeight: 600, lineHeight: 1.5 }}>
          Esta tarea ya tiene {reportado} unidades reportadas ({asignacion.cantidad_realizada} terminadas
          {asignacion.cantidad_defectuosa ? ` + ${asignacion.cantidad_defectuosa} defectuosas` : ''}): la cantidad no puede ser menor.
          Si {asignacion.empleado} no puede seguir, pon la cantidad en <b>{reportado}</b> para cerrar su tarea y asigna lo que falta a otra persona.
        </div>
      )}
    </>
  );
};

export default ProduccionView;
