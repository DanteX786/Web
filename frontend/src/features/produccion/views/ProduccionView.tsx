import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Factory, Pencil, Trash2, Eye, CheckCircle2, History, ClipboardPlus, PlayCircle, Clock, Search, Shirt, ListChecks, ExternalLink, FileText, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

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
  type MaquinaDisponible,
  type Produccion,
  type ProduccionDetalle,
  type SeguimientoProduccion,
} from '../services/produccionService';
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

/** Unidades de esa talla que ya están asignadas al mismo paso y pieza (sin contar la tarea que se edita). */
const yaAsignado = (asignaciones: Asignacion[], t: TareaDraft, excluirId?: string) =>
  asignaciones
    .filter((a) => a.id_detalle_de_produccion !== excluirId && a.id_detalle_de_remision === t.id_detalle_de_remision
      && a.id_paso === t.id_paso && a.id_tipo_pieza === t.id_tipo_pieza)
    .reduce((s, a) => s + a.cantidad_asignada, 0);

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

// ==========================================
// VISTA PRINCIPAL
// ==========================================
interface ProduccionViewProps {
  dark?: boolean;
}

/**
 * Producción. No se crea aquí: nace cuando la remisión Aprobada se envía a producir
 * (botón "Enviar a producir" en Remisiones) y llega en estado "Por asignar" con las
 * tallas de la remisión. Aquí se asignan las tareas por talla, se inicia y se finaliza.
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
  const [insumosCliente, setInsumosCliente] = useState<InsumoEnviado[]>([]);
  const [ficha, setFicha] = useState<{ url: string | null; nombre: string } | null>(null);
  const [modalProcesos, setModalProcesos] = useState(false);
  const [pasosEdit, setPasosEdit] = useState<PasoGuardar[]>([]);
  const [seguimiento, setSeguimiento] = useState<{ produccion: Produccion; pasos: SeguimientoProduccion[] } | null>(null);
  const [modalTarea, setModalTarea] = useState<{ asignacion: Asignacion | null } | null>(null);
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
  const abrirDetalle = async (idProduccion: string) => {
    try {
      abierta.current = idProduccion;
      setFicha(null);
      const det = await recargarDetalle(idProduccion);
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
    setPasosEdit(det.pasos.map((p) => ({ id_paso: p.id_paso, id_proceso: p.id_proceso, descripcion: p.descripcion ?? '' })));
    setModalProcesos(true);
  };

  const guardarProcesos = async () => {
    if (!detalle) return;
    if (pasosEdit.length === 0) { toast.error('Agrega al menos un proceso.'); return; }
    // Un proceso repetido debe tener descripción distinta en cada paso
    const claves = pasosEdit.map((p) => `${p.id_proceso}|${(p.descripcion ?? '').trim().toLowerCase()}`);
    if (new Set(claves).size !== claves.length) {
      toast.error('Si repites un proceso, ponle una descripción distinta a cada uno (ej. Bordado — logo en el pecho).');
      return;
    }
    setProcesando(true);
    try {
      await produccionService.guardarPasos(detalle.id_produccion,
        pasosEdit.map((p) => ({ ...p, descripcion: (p.descripcion ?? '').trim() || null })));
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
  const abrirTarea = async (asignacion: Asignacion | null, idLinea = '') => {
    if (!detalle) return;
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
    setTareaEdit(asignacion ? tareaDesdeAsignacion(asignacion) : tareaVacia(idLinea || detalle.lineas[0]?.id_detalle_de_remision));
    setModalTarea({ asignacion });
  };

  const validarTarea = (tarea: TareaDraft, asignacion: Asignacion | null): string | null => {
    if (!detalle || !cat) return 'Cargando datos...';
    if (!tarea.id_detalle_de_remision) return 'Selecciona la talla.';
    if (!tarea.id_paso) return 'Selecciona el proceso.';
    if (!tarea.id_tipo_pieza) return 'Selecciona la pieza.';
    if (!tarea.id_empleado) return 'Selecciona el empleado.';
    if (!tarea.id_tipo_maquina) return 'Selecciona la máquina.';
    const ocupadoEmp = disponibilidad.find((d) => d.id_empleado === tarea.id_empleado && !d.disponible);
    if (ocupadoEmp && tarea.id_empleado !== asignacion?.id_empleado) {
      if (!ocupadoEmp.presente_hoy) return `${ocupadoEmp.nombre} no está Presente en la asistencia de hoy.`;
      return `${ocupadoEmp.nombre} está ocupado: tiene ${ocupadoEmp.unidades_pendientes} und pendientes en la tarea ${ocupadoEmp.ocupado_en_tarea}.`;
    }
    const cant = Number(tarea.cantidad_asignada);
    if (!Number.isInteger(cant) || cant <= 0) return 'La cantidad asignada debe ser un número entero mayor a 0.';
    const linea = detalle.lineas.find((l) => l.id_detalle_de_remision === tarea.id_detalle_de_remision);
    if (linea) {
      const usado = yaAsignado(detalle.asignaciones, tarea, asignacion?.id_detalle_de_produccion);
      if (usado + cant > linea.cantidad) {
        return `La talla ${linea.talla} pide ${linea.cantidad} und; para ese paso y pieza ya hay ${usado} asignadas (quedan ${linea.cantidad - usado}).`;
      }
    }
    if (asignacion && cant < asignacion.cantidad_realizada) {
      return `El empleado ya reportó ${asignacion.cantidad_realizada} unidades; no puedes asignarle menos.`;
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
    const problema = validarTarea(tareaEdit, modalTarea.asignacion);
    if (problema) { toast.error(problema); return; }
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

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <ModuleHeader
        title="Producción"
        subtitle='Las producciones llegan desde Remisiones con "Enviar a producir". Asigna las tareas por talla, inicia y finaliza.'
        search={busqueda}
        onSearch={setBusqueda}
        dark={dark}
        extra={
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as '' | EstadoProduccion)}
            style={estiloInput(dark, { width: 170, padding: '8px 10px' })}>
            <option value="">Todos los estados</option>
            {ESTADOS_PRODUCCION.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        }
      />

      <TableShell headers={['ID producción', 'Remisión', 'Cliente', 'Prendas terminadas', 'Estado', 'Fecha de estado', 'Acciones']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={7} dark={dark} cargando={cargando}
            texto={producciones.length === 0
              ? 'Aún no hay producciones. Se crean desde Remisiones con el botón "Enviar a producir".'
              : 'No se encontraron producciones con ese filtro.'} />
        ) : visibles.map((p) => (
          <tr key={p.id_produccion} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '12px 14px' }}><IdBadge id={p.id_produccion} /></td>
            <td style={{ padding: '12px 14px' }}><IdBadge id={p.id_remision} /></td>
            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{p.cliente}</td>
            <td style={{ padding: '12px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>
              <b>{p.prendas_terminadas}</b> <span style={{ color: t.subtle }}>de {p.total_prendas}</span>
            </td>
            <td style={{ padding: '12px 14px' }}><PillEstado estado={p.estado} /></td>
            <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: t.subtle, whiteSpace: 'nowrap' }}>{fechaHora(p.fecha_estado)}</td>
            <td style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionCircleBtn variant="blue" onClick={() => abrirDetalle(p.id_produccion)} title="Ver tallas y tareas"><Eye size={14} /></ActionCircleBtn>
                <ActionCircleBtn variant="gold" onClick={() => verSeguimiento(p)} title="Seguimiento"><History size={14} /></ActionCircleBtn>
                {p.estado === 'Por asignar' && (
                  <ActionCircleBtn variant="success" disabled={p.total_asignado === 0} onClick={() => setConfirmar({ accion: 'iniciar', produccion: p })}
                    title={p.total_asignado === 0 ? 'Asigna al menos una tarea para iniciar' : 'Iniciar producción'}>
                    <PlayCircle size={14} />
                  </ActionCircleBtn>
                )}
                {p.estado === 'En producción' && (
                  <ActionCircleBtn variant="success" disabled={p.total_realizado < p.total_asignado}
                    onClick={() => setConfirmar({ accion: 'finalizar', produccion: p })}
                    title={p.total_realizado < p.total_asignado
                      ? `Faltan ${p.total_asignado - p.total_realizado} unidades por reportar`
                      : 'Finalizar producción'}>
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
      {detalle && !modalTarea && !modalProcesos && !confirmEliminar && !confirmar && (
        <Modal title={`Producción ${detalle.id_produccion}`} icon={<Factory size={16} color={GOLD} />} onClose={cerrarDetalle} dark={dark} maxWidth="1100px">
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
              Asigna en cada talla todas sus unidades en cada proceso (pieza, empleado y máquina). Cuando no falte nada, pulsa <b>Iniciar producción</b>.
            </div>
          )}

          {detalle.pasos.length === 0 && detalle.estado !== 'Finalizada' ? (
            <div style={{ textAlign: 'center', padding: 24, fontSize: 13, color: t.subtle, border: `1px dashed ${t.border}`, borderRadius: 12 }}>
              Primero elige los procesos que lleva la prenda mirando la ficha técnica. Después podrás asignar las tareas de cada talla.
            </div>
          ) : detalle.lineas.map((linea) => (
            <TallaCard key={linea.id_detalle_de_remision} linea={linea} dark={dark}
              tareas={detalle.asignaciones.filter((a) => a.id_detalle_de_remision === linea.id_detalle_de_remision)}
              faltantes={detalle.faltantes.filter((f) => f.id_detalle_de_remision === linea.id_detalle_de_remision)}
              insumosCliente={insumosCliente}
              editable={detalle.estado !== 'Finalizada'}
              onAgregar={() => abrirTarea(null, linea.id_detalle_de_remision)}
              onEditar={(a) => abrirTarea(a)}
              onEliminar={setConfirmEliminar} />
          ))}

          {detalle.estado !== 'Finalizada' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {detalle.estado === 'Por asignar' ? (
                (() => {
                  const bloqueo = detalle.pasos.length === 0
                    ? 'Primero elige los procesos de la prenda.'
                    : detalle.faltantes.length > 0
                      ? `Faltan ${detalle.faltantes.length} asignación(es) por talla y proceso (ver en naranja en cada talla).`
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
                const faltan = detalle.total_asignado - detalle.total_realizado;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {faltan > 0 && (
                      <span style={{ fontSize: 12, color: WARNING, fontWeight: 600 }}>
                        Faltan {faltan} unidades por reportar: se podrá finalizar cuando todas las tareas estén completas.
                      </span>
                    )}
                    <button onClick={() => setConfirmar({ accion: 'finalizar', produccion: detalle })} disabled={faltan > 0}
                      style={{ background: SUCCESS, border: 'none', color: '#FFF', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: faltan > 0 ? 'not-allowed' : 'pointer', opacity: faltan > 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
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
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
            <FichaTecnica ficha={ficha} dark={dark} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.subtle, marginBottom: 8 }}>
                  Pasos de esta prenda ({pasosEdit.length})
                </div>
                {pasosEdit.length === 0 ? (
                  <div style={{ fontSize: 12, color: t.subtle, padding: 12, border: `1px dashed ${t.border}`, borderRadius: 8 }}>
                    Aún no hay procesos. Agrégalos con los botones de abajo.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pasosEdit.map((p, i) => {
                      const nombre = cat?.procesos.find((x) => x.id === p.id_proceso)?.nombre
                        ?? detalle.pasos.find((x) => x.id_paso === p.id_paso)?.proceso ?? p.id_proceso;
                      const conTareas = Boolean(p.id_paso) && detalle.asignaciones.some((a) => a.id_paso === p.id_paso);
                      const repetido = pasosEdit.filter((x) => x.id_proceso === p.id_proceso).length > 1;
                      return (
                        <div key={p.id_paso ?? `nuevo-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${GOLD}60`, background: `${GOLD}0F` }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: GOLD, minWidth: 18 }}>{i + 1}.</span>
                          <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{nombre}</span>
                          <input value={p.descripcion ?? ''} maxLength={100}
                            placeholder={repetido ? 'Descripción obligatoria (ej. logo en el pecho)' : 'Descripción (opcional)'}
                            onChange={(e) => setPasosEdit(pasosEdit.map((x, j) => (j === i ? { ...x, descripcion: e.target.value } : x)))}
                            style={estiloInput(dark, { padding: '6px 10px', fontSize: 12, border: `1px solid ${repetido && !(p.descripcion ?? '').trim() ? WARNING : t.border}` })} />
                          <button type="button" disabled={conTareas} onClick={() => setPasosEdit(pasosEdit.filter((_, j) => j !== i))}
                            title={conTareas ? 'Tiene tareas asignadas: elimina primero esas tareas' : 'Quitar'}
                            style={{ background: 'transparent', border: 'none', color: conTareas ? t.subtle : DANGER, cursor: conTareas ? 'not-allowed' : 'pointer', padding: 4, display: 'flex' }}>
                            <X size={16} />
                          </button>
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
                        onClick={() => setPasosEdit([...pasosEdit, { id_paso: null, id_proceso: p.id, descripcion: '' }])}
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
        <Modal title={modalTarea.asignacion ? `Editar tarea ${modalTarea.asignacion.id_detalle_de_produccion}` : `Nueva tarea — ${detalle.id_produccion}`}
          icon={<ClipboardPlus size={16} color={GOLD} />} onClose={() => setModalTarea(null)} onSave={guardarTarea} saving={procesando} dark={dark} maxWidth="760px">
          <CamposTarea tarea={tareaEdit} onChange={setTareaEdit} detalle={detalle} cat={cat} maquinas={maquinas} disponibilidad={disponibilidad}
            insumosCliente={insumosCliente} asignacion={modalTarea.asignacion} dark={dark} />
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
            ? `Pasará a "En producción" y los empleados podrán reportar su avance diario. Tiene ${confirmar.produccion.total_asignado} unidades asignadas en tareas.`
            : 'Todas las tareas están completas. La remisión pasará a "Terminada" y quedará lista para la remisión de entrega.'}
          confirmarLabel={confirmar.accion === 'iniciar' ? 'Sí, iniciar' : 'Sí, finalizar'}
          variante="success"
          icono={confirmar.accion === 'iniciar' ? <PlayCircle size={28} color={SUCCESS} /> : <CheckCircle2 size={28} color={SUCCESS} />}
          procesando={procesando}
          onCancel={() => setConfirmar(null)}
          onConfirm={cambiarEstado}
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
}> = ({ linea, tareas, faltantes, insumosCliente, editable, dark, onAgregar, onEditar, onEliminar }) => {
  const t = tema(dark);

  // Avance por proceso de esta talla (ej. Confección 150/200)
  const porProceso = new Map<string, { asignado: number; realizado: number }>();
  tareas.forEach((a) => {
    const clave = a.paso ?? a.proceso ?? 'Sin proceso';
    const v = porProceso.get(clave) ?? { asignado: 0, realizado: 0 };
    porProceso.set(clave, { asignado: v.asignado + a.cantidad_asignada, realizado: v.realizado + a.cantidad_realizada });
  });

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
          <span style={{ fontSize: 13 }}><b>{linea.terminadas}</b> de {linea.cantidad} terminadas</span>
          {[...porProceso.entries()].map(([proceso, v]) => (
            <Pill key={proceso} texto={`${proceso}: ${v.realizado}/${v.asignado}`}
              color={v.asignado >= linea.cantidad ? SUCCESS : WARNING} bg={v.asignado >= linea.cantidad ? SUCCESS_BG : WARNING_BG} />
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
      <TableShell headers={['Proceso', 'Pieza', 'Empleado', 'Máquina', 'Insumo', 'Asignado', 'Realizado', 'Pendiente', '']} dark={dark}>
        {tareas.length === 0 ? (
          <FilaMensaje colSpan={9} dark={dark} texto="Sin tareas para esta talla todavía." />
        ) : tareas.map((a) => (
          <tr key={a.id_detalle_de_produccion} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>{a.paso ?? a.proceso ?? <span style={{ color: t.subtle, fontWeight: 400 }}>Sin proceso</span>}</td>
            <td style={{ padding: '8px 12px', fontSize: 12 }}>{a.pieza}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600 }}>{a.empleado}</td>
            <td style={{ padding: '8px 12px', fontSize: 12 }}>{a.maquina}</td>
            <td style={{ padding: '8px 12px', fontSize: 11, color: t.subtle }}>{nombreInsumo(a)}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>{a.cantidad_asignada}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: SUCCESS }}>{a.cantidad_realizada}</td>
            <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: a.cantidad_pendiente > 0 ? WARNING : t.subtle }}>{a.cantidad_pendiente}</td>
            <td style={{ padding: '8px 12px' }}>
              {editable && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <ActionCircleBtn variant="gold" onClick={() => onEditar(a)} title="Editar tarea"><Pencil size={13} /></ActionCircleBtn>
                  <ActionCircleBtn variant="danger" disabled={a.cantidad_realizada > 0} onClick={() => onEliminar(a)}
                    title={a.cantidad_realizada > 0 ? 'No se puede eliminar: ya tiene reportes diarios' : 'Eliminar tarea'}>
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
}> = ({ tarea, onChange, detalle, cat, maquinas, disponibilidad, insumosCliente, asignacion, dark }) => {
  const t = tema(dark);
  const set = (cambios: Partial<TareaDraft>) => onChange({ ...tarea, ...cambios });
  const sel = estiloInput(dark);

  const linea = detalle.lineas.find((l) => l.id_detalle_de_remision === tarea.id_detalle_de_remision);
  const quedan = linea && tarea.id_paso && tarea.id_tipo_pieza
    ? linea.cantidad - yaAsignado(detalle.asignaciones, tarea, asignacion?.id_detalle_de_produccion)
    : null;

  // Solo las máquinas que sirven para el proceso del paso (si tiene configuradas)...
  const paso = detalle.pasos.find((p) => p.id_paso === tarea.id_paso);
  const delProceso = paso && paso.maquinas.length > 0 ? maquinas.filter((m) => paso.maquinas.includes(m.id_maquina)) : maquinas;
  // ...y que estén libres (o la que ya tiene esta tarea, al editar)
  const libres = delProceso.filter((m) => m.disponible || m.id_maquina === asignacion?.id_tipo_maquina);
  const ocupadas = delProceso.filter((m) => !libres.includes(m));

  // Solo los empleados sin tareas pendientes (y el que ya tiene esta tarea, al editar)
  const ocupado = (id: string) => disponibilidad.find((d) => d.id_empleado === id && !d.disponible);
  const empleadosLibres = cat.empleados.filter((e) => !ocupado(e.id) || e.id === asignacion?.id_empleado);
  const empleadosOcupados = disponibilidad.filter((d) => d.presente_hoy && !d.disponible && d.id_empleado !== asignacion?.id_empleado);
  const empleadosAusentes = disponibilidad.filter((d) => !d.presente_hoy && d.id_empleado !== asignacion?.id_empleado);

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

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Talla" dark={dark}>
          <select value={tarea.id_detalle_de_remision} onChange={(e) => set({ id_detalle_de_remision: e.target.value })} style={sel}>
            <option value="">Seleccionar...</option>
            {detalle.lineas.map((l) => (
              <option key={l.id_detalle_de_remision} value={l.id_detalle_de_remision}>
                {l.nombre_de_la_pieza} · Talla {l.talla} ({l.cantidad} und)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Proceso" dark={dark}>
          <select value={tarea.id_paso} onChange={(e) => set({ id_paso: e.target.value, id_tipo_maquina: '' })} style={sel}>
            <option value="">Seleccionar...</option>
            {detalle.pasos.map((p) => <option key={p.id_paso} value={p.id_paso}>{p.paso}</option>)}
          </select>
        </Field>
        <Field label="Pieza" dark={dark}>
          <select value={tarea.id_tipo_pieza} onChange={(e) => set({ id_tipo_pieza: e.target.value })} style={sel}>
            <option value="">Seleccionar...</option>
            {cat.piezas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Field>
        <Field label="Empleado (solo los disponibles)" dark={dark}>
          <select value={tarea.id_empleado} onChange={(e) => set({ id_empleado: e.target.value })} style={sel}>
            <option value="">{empleadosLibres.length === 0 ? 'No hay empleados libres en este momento' : 'Seleccionar...'}</option>
            {empleadosLibres.map((e) => <option key={e.id} value={e.id}>{e.nombre}{e.rol ? ` (${e.rol})` : ''}</option>)}
          </select>
          {empleadosOcupados.length > 0 && (
            <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
              Ocupados: {empleadosOcupados.map((d) => `${d.nombre} (${d.unidades_pendientes} und pendientes)`).join(', ')}
            </div>
          )}
          {empleadosAusentes.length > 0 && (
            <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
              No asistieron hoy: {empleadosAusentes.map((d) => d.nombre).join(', ')}
            </div>
          )}
        </Field>
        <Field label={paso && paso.maquinas.length > 0 ? `Máquina (las de ${paso.proceso}, disponibles)` : 'Máquina (solo las disponibles)'} dark={dark}>
          <select value={tarea.id_tipo_maquina} onChange={(e) => set({ id_tipo_maquina: e.target.value })} style={sel}>
            <option value="">{libres.length === 0 ? 'No hay máquinas libres en este momento' : 'Seleccionar...'}</option>
            {libres.map((m) => <option key={m.id_maquina} value={m.id_maquina}>{m.nombre}</option>)}
          </select>
          {ocupadas.length > 0 && (
            <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>
              Ocupadas: {ocupadas.map((m) => `${m.nombre} (${m.ocupada_por_empleado})`).join(', ')}
            </div>
          )}
        </Field>
        <Field label="Cantidad a asignar" dark={dark}>
          <input type="number" min={1} value={tarea.cantidad_asignada}
            onChange={(e) => set({ cantidad_asignada: e.target.value === '' ? '' : Number(e.target.value) })} style={sel} />
          {quedan !== null && (
            <div style={{ fontSize: 11, color: quedan > 0 ? t.subtle : DANGER, marginTop: 4 }}>
              {quedan > 0 ? `Quedan ${quedan} und de esta talla para ese paso y pieza.` : 'Ya se asignaron todas las unidades de esta talla para ese paseso y pieza.'}
            </div>
          )}
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
        <Field label="Insumo" dark={dark}>
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
        <Field label="Cantidad de insumo" dark={dark}>
          <input type="number" min={1} max={maxInsumo?.n} value={tarea.cantidad_insumo} disabled={!tarea.insumo}
            onChange={(e) => set({ cantidad_insumo: e.target.value === '' ? '' : Number(e.target.value) })}
            style={{ ...sel, opacity: tarea.insumo ? 1 : 0.5, border: `1px solid ${maxInsumo && Number(tarea.cantidad_insumo) > maxInsumo.n ? DANGER : t.border}` }} />
          {maxInsumo && (
            <div style={{ fontSize: 11, color: Number(tarea.cantidad_insumo) > maxInsumo.n ? DANGER : t.subtle, marginTop: 4 }}>
              {Number(tarea.cantidad_insumo) > maxInsumo.n ? 'Supera lo disponible: ' : 'Máximo: '}{maxInsumo.n} {maxInsumo.u}
            </div>
          )}
        </Field>
      </div>

      {asignacion && asignacion.cantidad_realizada > 0 && (
        <div style={{ fontSize: 12, color: WARNING, fontWeight: 600 }}>
          Esta tarea ya tiene {asignacion.cantidad_realizada} unidades reportadas: la cantidad asignada no puede ser menor.
        </div>
      )}
    </>
  );
};

export default ProduccionView;
