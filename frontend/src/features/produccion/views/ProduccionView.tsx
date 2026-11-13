import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Factory, Plus, Pencil, Trash2, Eye, CheckCircle2, History, RefreshCw, ClipboardPlus } from 'lucide-react';
import { toast } from 'sonner';

import {
  produccionService,
  type Asignacion,
  type AsignacionForm,
  type EstadoProduccion,
  type Produccion,
  type ProduccionDetalle,
  type RemisionDisponible,
} from '../services/produccionService';
import { seguimientoService, type Seguimiento } from '../services/seguimientoService';
import { remisionService, type DetalleRemision, type InsumoEnviado } from '../../ventas/services/remisionService';
import { empleadoService, type Empleado } from '../../usuarios/services/empleadoService';
import { tipoPiezaService, type TipoPieza } from '../../parametros/services/tipoPiezaService';
import { tipoMaquinaService, type TipoMaquina } from '../../parametros/services/tipoMaquinaService';
import { insumoService, type Insumo } from '../../compras/services/insumoService';
import { mensajeError } from '../../../shared/utils/api';
import {
  GOLD, INFO, INFO_BG, SUCCESS, SUCCESS_BG, WARNING, WARNING_BG, DANGER, FONT,
  tema, estiloInput, fecha, fechaHora,
  IdBadge, Pill, ActionCircleBtn, TableShell, FilaMensaje, Modal, Field, ModuleHeader,
  Kpi, BarraAvance, Paginacion, ConfirmDialog,
} from '../components/ui';

// ==========================================
// TIPOS Y UTILIDADES DEL FORMULARIO
// ==========================================
type OrigenInsumo = 'ninguno' | 'taller' | 'cliente';

interface TareaDraft {
  id_detalle_de_remision: string;
  id_empleado: string;
  id_tipo_pieza: string;
  id_tipo_maquina: string;
  cantidad_asignada: number | '';
  origen: OrigenInsumo;
  id_insumo: string;
  cantidad_insumo: number | '';
}

interface Catalogos {
  empleados: Empleado[];
  piezas: TipoPieza[];
  maquinas: TipoMaquina[];
  insumos: Insumo[];
}

/** Datos de la remisión que necesita el formulario de tareas. */
interface DatosRemision {
  lineas: DetalleRemision[];
  insumosCliente: InsumoEnviado[];
}

const tareaVacia = (lineas: DetalleRemision[] = []): TareaDraft => ({
  id_detalle_de_remision: lineas[0]?.id_detalle_de_remision ?? '',
  id_empleado: '',
  id_tipo_pieza: '',
  id_tipo_maquina: '',
  cantidad_asignada: lineas[0]?.cantidad ?? '',
  origen: 'ninguno',
  id_insumo: '',
  cantidad_insumo: '',
});

const tareaDesdeAsignacion = (a: Asignacion): TareaDraft => ({
  id_detalle_de_remision: a.id_detalle_de_remision,
  id_empleado: a.id_empleado,
  id_tipo_pieza: a.id_tipo_pieza,
  id_tipo_maquina: a.id_tipo_maquina,
  cantidad_asignada: a.cantidad_asignada,
  origen: a.id_insumos ? 'taller' : a.id_insumos_enviados_x_cliente ? 'cliente' : 'ninguno',
  id_insumo: a.id_insumos ?? a.id_insumos_enviados_x_cliente ?? '',
  cantidad_insumo: a.cantidad_insumo ?? '',
});

const tareaAFormulario = (t: TareaDraft): AsignacionForm => ({
  id_empleado: t.id_empleado,
  id_tipo_pieza: t.id_tipo_pieza,
  id_tipo_maquina: t.id_tipo_maquina,
  id_detalle_de_remision: t.id_detalle_de_remision,
  cantidad_asignada: Number(t.cantidad_asignada),
  id_insumos: t.origen === 'taller' ? t.id_insumo : null,
  id_insumos_enviados_x_cliente: t.origen === 'cliente' ? t.id_insumo : null,
  cantidad_insumo: t.origen === 'ninguno' ? null : Number(t.cantidad_insumo),
});

/** Devuelve el primer problema de la tarea, o null si está bien. */
const validarTarea = (t: TareaDraft, datos: DatosRemision, cat: Catalogos, esEdicion = false): string | null => {
  if (!t.id_detalle_de_remision) return 'Selecciona la prenda y talla.';
  if (!t.id_empleado) return 'Selecciona el empleado.';
  if (!t.id_tipo_pieza) return 'Selecciona la pieza.';
  if (!t.id_tipo_maquina) return 'Selecciona la máquina.';
  const cant = Number(t.cantidad_asignada);
  if (!Number.isInteger(cant) || cant <= 0) return 'La cantidad asignada debe ser un número entero mayor a 0.';
  const linea = datos.lineas.find((l) => l.id_detalle_de_remision === t.id_detalle_de_remision);
  if (linea && cant > linea.cantidad) return `La remisión pide ${linea.cantidad} unidades de ${linea.nombre_de_la_pieza} talla ${linea.talla}.`;
  if (t.origen !== 'ninguno') {
    if (!t.id_insumo) return 'Selecciona el insumo o elige "Sin insumo".';
    const ci = Number(t.cantidad_insumo);
    if (!Number.isInteger(ci) || ci <= 0) return 'La cantidad de insumo debe ser un número entero mayor a 0.';
    if (!esEdicion) {
      const disponible = t.origen === 'taller'
        ? cat.insumos.find((i) => i.id === t.id_insumo)?.stock
        : datos.insumosCliente.find((i) => i.id_insumo_enviado === t.id_insumo)?.cantidad_disponible;
      if (disponible !== undefined && ci > disponible) return `Solo hay ${disponible} unidades disponibles de ese insumo.`;
    }
  }
  return null;
};

const ESTADO_STYLE: Record<EstadoProduccion, { bg: string; color: string }> = {
  'En proceso': { bg: WARNING_BG, color: WARNING },
  'Finalizada': { bg: SUCCESS_BG, color: SUCCESS },
};

// ==========================================
// CAMPOS DE UNA TAREA (se usa al crear producción y al agregar/editar tareas)
// ==========================================
const CamposTarea: React.FC<{
  tarea: TareaDraft;
  onChange: (t: TareaDraft) => void;
  datos: DatosRemision;
  cat: Catalogos;
  dark: boolean;
  onEliminar?: () => void;
}> = ({ tarea, onChange, datos, cat, dark, onEliminar }) => {
  const t = tema(dark);
  const set = (cambios: Partial<TareaDraft>) => onChange({ ...tarea, ...cambios });
  const sel = estiloInput(dark, { padding: '7px 10px', fontSize: 12 });
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: t.subtle, textTransform: 'uppercase', display: 'block', marginBottom: 4 };

  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
        <div>
          <label style={lbl}>Prenda / talla</label>
          <select value={tarea.id_detalle_de_remision} onChange={(e) => {
            const linea = datos.lineas.find((l) => l.id_detalle_de_remision === e.target.value);
            set({ id_detalle_de_remision: e.target.value, cantidad_asignada: linea?.cantidad ?? tarea.cantidad_asignada });
          }} style={sel}>
            <option value="">Seleccionar...</option>
            {datos.lineas.map((l) => (
              <option key={l.id_detalle_de_remision} value={l.id_detalle_de_remision}>
                {l.nombre_de_la_pieza} · {l.talla} ({l.cantidad} und)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Empleado</label>
          <select value={tarea.id_empleado} onChange={(e) => set({ id_empleado: e.target.value })} style={sel}>
            <option value="">Seleccionar...</option>
            {cat.empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}{e.rol ? ` (${e.rol})` : ''}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Pieza</label>
          <select value={tarea.id_tipo_pieza} onChange={(e) => set({ id_tipo_pieza: e.target.value })} style={sel}>
            <option value="">Seleccionar...</option>
            {cat.piezas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Máquina</label>
          <select value={tarea.id_tipo_maquina} onChange={(e) => set({ id_tipo_maquina: e.target.value })} style={sel}>
            <option value="">Seleccionar...</option>
            {cat.maquinas.map((m) => <option key={m.id_tipo_de_maquina} value={m.id_tipo_de_maquina}>{m.nombre}</option>)}
          </select>
        </div>
        {onEliminar ? (
          <button type="button" onClick={onEliminar} title="Quitar tarea" style={{ background: 'transparent', border: 'none', color: DANGER, cursor: 'pointer', padding: 6 }}>
            <Trash2 size={18} />
          </button>
        ) : <span />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 0.8fr 1.6fr 0.8fr', gap: 8 }}>
        <div>
          <label style={lbl}>Cantidad asignada</label>
          <input type="number" min={1} value={tarea.cantidad_asignada}
            onChange={(e) => set({ cantidad_asignada: e.target.value === '' ? '' : Number(e.target.value) })} style={sel} />
        </div>
        <div>
          <label style={lbl}>Insumo</label>
          <select value={tarea.origen} onChange={(e) => set({ origen: e.target.value as OrigenInsumo, id_insumo: '', cantidad_insumo: '' })} style={sel}>
            <option value="ninguno">Sin insumo</option>
            <option value="cliente">Enviado por el cliente</option>
            <option value="taller">Del taller (stock)</option>
          </select>
        </div>
        <div>
          <label style={lbl}>{tarea.origen === 'cliente' ? 'Insumo enviado para esta remisión' : 'Insumo del taller'}</label>
          <select value={tarea.id_insumo} disabled={tarea.origen === 'ninguno'} onChange={(e) => set({ id_insumo: e.target.value })}
            style={{ ...sel, opacity: tarea.origen === 'ninguno' ? 0.5 : 1 }}>
            <option value="">{tarea.origen === 'ninguno' ? '—' : 'Seleccionar...'}</option>
            {tarea.origen === 'cliente' && (datos.insumosCliente.length === 0
              ? <option disabled value="">El cliente no envió insumos para esta remisión</option>
              : datos.insumosCliente.map((i) => (
                <option key={i.id_insumo_enviado} value={i.id_insumo_enviado}>
                  {i.nombre} — disponible {i.cantidad_disponible} {i.unidad}
                </option>
              )))}
            {tarea.origen === 'taller' && cat.insumos.map((i) => (
              <option key={i.id} value={i.id} disabled={i.stock <= 0}>
                {i.nombre} — stock {i.stock}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Cant. insumo</label>
          <input type="number" min={1} value={tarea.cantidad_insumo} disabled={tarea.origen === 'ninguno'}
            onChange={(e) => set({ cantidad_insumo: e.target.value === '' ? '' : Number(e.target.value) })}
            style={{ ...sel, opacity: tarea.origen === 'ninguno' ? 0.5 : 1 }} />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// VISTA PRINCIPAL
// ==========================================
interface ProduccionViewProps {
  dark?: boolean;
}

const POR_PAGINA = 5;

export const ProduccionView: React.FC<ProduccionViewProps> = ({ dark = false }) => {
  const t = tema(dark);

  // ---------- Datos ----------
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [disponibles, setDisponibles] = useState<RemisionDisponible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cat, setCat] = useState<Catalogos | null>(null);

  // ---------- Filtros ----------
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'' | EstadoProduccion>('');
  const [pagina, setPagina] = useState(1);

  // ---------- Modales ----------
  const [modalNueva, setModalNueva] = useState(false);
  const [detalle, setDetalle] = useState<ProduccionDetalle | null>(null);
  const [datosRemDetalle, setDatosRemDetalle] = useState<DatosRemision>({ lineas: [], insumosCliente: [] });
  const [historial, setHistorial] = useState<Seguimiento[]>([]);
  const [modalTarea, setModalTarea] = useState<{ asignacion: Asignacion | null } | null>(null);
  const [confirmFinalizar, setConfirmFinalizar] = useState<Produccion | null>(null);
  const [confirmEliminar, setConfirmEliminar] = useState<Asignacion | null>(null);
  const [procesando, setProcesando] = useState(false);

  // ---------- Formulario "Nueva producción" ----------
  const [formRemision, setFormRemision] = useState('');
  const [formFechaEntrega, setFormFechaEntrega] = useState('');
  const [datosRemNueva, setDatosRemNueva] = useState<DatosRemision>({ lineas: [], insumosCliente: [] });
  const [formTareas, setFormTareas] = useState<TareaDraft[]>([]);

  // ---------- Formulario de una tarea ----------
  const [tareaEdit, setTareaEdit] = useState<TareaDraft>(tareaVacia());

  // ==========================================
  // CARGA DE DATOS
  // ==========================================
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [prods, disp] = await Promise.all([produccionService.listar(), produccionService.remisionesDisponibles()]);
      setProducciones(prods);
      setDisponibles(disp);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  /** Empleados, piezas, máquinas e insumos activos (se cargan una vez, al abrir un formulario). */
  const cargarCatalogos = async (forzar = false): Promise<Catalogos | null> => {
    if (cat && !forzar) return cat;
    try {
      const [empleados, piezas, maquinas, insumos] = await Promise.all([
        empleadoService.listar('Activo'),
        tipoPiezaService.listar('Activo'),
        tipoMaquinaService.listar('Activo'),
        insumoService.listar(),
      ]);
      const nuevo = { empleados, piezas, maquinas, insumos };
      setCat(nuevo);
      return nuevo;
    } catch (e) {
      toast.error(`No se pudieron cargar los catálogos: ${mensajeError(e)}`);
      return null;
    }
  };

  const cargarDatosRemision = async (idRemision: string): Promise<DatosRemision> => {
    const rem = await remisionService.obtener(idRemision);
    return { lineas: rem.detalles ?? [], insumosCliente: rem.insumos ?? [] };
  };

  // ==========================================
  // NUEVA PRODUCCIÓN
  // ==========================================
  const abrirNueva = async () => {
    if (producciones.some((p) => p.estado === 'En proceso')) {
      toast.warning('Ya hay una producción En proceso. El taller trabaja una a la vez: finalízala antes de iniciar otra.');
      return;
    }
    if (disponibles.length === 0) {
      toast.info('No hay remisiones aprobadas pendientes de producción. Primero aprueba una remisión en Ventas.');
      return;
    }
    const catalogos = await cargarCatalogos(true);
    if (!catalogos) return;
    setFormRemision('');
    setFormFechaEntrega('');
    setDatosRemNueva({ lineas: [], insumosCliente: [] });
    setFormTareas([]);
    setModalNueva(true);
  };

  const seleccionarRemision = async (idRemision: string) => {
    setFormRemision(idRemision);
    setFormTareas([]);
    const rem = disponibles.find((r) => r.id_remision === idRemision);
    setFormFechaEntrega(rem?.fecha_entrega ?? '');
    if (!idRemision) { setDatosRemNueva({ lineas: [], insumosCliente: [] }); return; }
    try {
      const datos = await cargarDatosRemision(idRemision);
      setDatosRemNueva(datos);
      setFormTareas([tareaVacia(datos.lineas)]);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const guardarNueva = async () => {
    if (!formRemision) { toast.error('Selecciona la remisión aprobada.'); return; }
    if (!cat) return;
    for (let i = 0; i < formTareas.length; i++) {
      const problema = validarTarea(formTareas[i], datosRemNueva, cat);
      if (problema) { toast.error(`Tarea ${i + 1}: ${problema}`); return; }
    }
    setProcesando(true);
    try {
      const prod = await produccionService.crear(formRemision, formFechaEntrega || null);
      let creadas = 0;
      const fallidas: string[] = [];
      // Las tareas se guardan una por una: así un error (ej. stock) no pierde las demás
      for (let i = 0; i < formTareas.length; i++) {
        try {
          await produccionService.crearAsignacion(prod.id_produccion, tareaAFormulario(formTareas[i]));
          creadas++;
        } catch (e) {
          fallidas.push(`Tarea ${i + 1}: ${mensajeError(e)}`);
        }
      }
      toast.success(`Producción ${prod.id_produccion} creada. La remisión ${prod.id_remision} pasó a "En producción".`);
      if (creadas) toast.success(`${creadas} tarea(s) asignada(s).`);
      fallidas.forEach((f) => toast.error(f, { duration: 8000 }));
      setModalNueva(false);
      await cargar();
      await abrirDetalle(prod.id_produccion);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // DETALLE
  // ==========================================
  const abrirDetalle = async (idProduccion: string) => {
    try {
      const det = await produccionService.obtener(idProduccion);
      setDetalle(det);
      const [datos, hist] = await Promise.all([
        cargarDatosRemision(det.id_remision).catch(() => ({ lineas: [], insumosCliente: [] })),
        seguimientoService.historialRemision(det.id_remision).catch(() => [] as Seguimiento[]),
      ]);
      setDatosRemDetalle(datos);
      setHistorial(hist);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const refrescarDetalle = async () => {
    if (!detalle) return;
    await Promise.all([abrirDetalle(detalle.id_produccion), cargar()]);
  };

  // ==========================================
  // TAREAS (ASIGNACIONES)
  // ==========================================
  const abrirTarea = async (asignacion: Asignacion | null) => {
    const catalogos = await cargarCatalogos(true);
    if (!catalogos || !detalle) return;
    // Recarga los insumos del cliente para ver la cantidad disponible actual
    const datos = await cargarDatosRemision(detalle.id_remision).catch(() => datosRemDetalle);
    setDatosRemDetalle(datos);
    setTareaEdit(asignacion ? tareaDesdeAsignacion(asignacion) : tareaVacia(datos.lineas));
    setModalTarea({ asignacion });
  };

  const guardarTarea = async () => {
    if (!detalle || !cat || !modalTarea) return;
    const problema = validarTarea(tareaEdit, datosRemDetalle, cat, Boolean(modalTarea.asignacion));
    if (problema) { toast.error(problema); return; }
    if (modalTarea.asignacion && Number(tareaEdit.cantidad_asignada) < modalTarea.asignacion.cantidad_realizada) {
      toast.error(`El empleado ya reportó ${modalTarea.asignacion.cantidad_realizada} unidades; no puedes asignarle menos.`);
      return;
    }
    setProcesando(true);
    try {
      if (modalTarea.asignacion) {
        await produccionService.actualizarAsignacion(modalTarea.asignacion.id_detalle_de_produccion, tareaAFormulario(tareaEdit));
        toast.success('Tarea actualizada.');
      } else {
        await produccionService.crearAsignacion(detalle.id_produccion, tareaAFormulario(tareaEdit));
        toast.success('Tarea asignada. El inventario del insumo se descontó.');
      }
      setModalTarea(null);
      await refrescarDetalle();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  const eliminarTarea = async () => {
    if (!confirmEliminar) return;
    setProcesando(true);
    try {
      await produccionService.eliminarAsignacion(confirmEliminar.id_detalle_de_produccion);
      toast.success('Tarea eliminada. El insumo volvió al inventario.');
      setConfirmEliminar(null);
      await refrescarDetalle();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // FINALIZAR
  // ==========================================
  const finalizar = async () => {
    if (!confirmFinalizar) return;
    setProcesando(true);
    try {
      const prod = await produccionService.finalizar(confirmFinalizar.id_produccion);
      toast.success(`Producción ${prod.id_produccion} finalizada. La remisión ${prod.id_remision} quedó "Terminada" y lista para entregar.`);
      setConfirmFinalizar(null);
      await cargar();
      if (detalle?.id_produccion === prod.id_produccion) await abrirDetalle(prod.id_produccion);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // ==========================================
  // FILTRADO Y PAGINACIÓN
  // ==========================================
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return producciones
      .filter((p) => !filtroEstado || p.estado === filtroEstado)
      .filter((p) => !q || [p.id_produccion, p.id_remision, p.cliente, p.estado].some((v) => v.toLowerCase().includes(q)));
  }, [producciones, busqueda, filtroEstado]);

  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const visibles = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const enProceso = producciones.find((p) => p.estado === 'En proceso');

  const nombreLinea = (id: string) => {
    const l = datosRemNueva.lineas.find((x) => x.id_detalle_de_remision === id);
    return l ? `${l.nombre_de_la_pieza} · ${l.talla}` : id;
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <ModuleHeader
        title="Producción"
        subtitle="Producciones en curso: asignación de operarios, máquinas e insumos por remisión aprobada"
        onAdd={abrirNueva}
        addLabel="Nueva Producción"
        search={busqueda}
        onSearch={setBusqueda}
        dark={dark}
        extra={
          <>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as '' | EstadoProduccion)}
              style={estiloInput(dark, { width: 150, padding: '8px 10px' })}>
              <option value="">Todos los estados</option>
              <option value="En proceso">En proceso</option>
              <option value="Finalizada">Finalizada</option>
            </select>
            <ActionCircleBtn variant="blue" onClick={cargar} title="Actualizar"><RefreshCw size={14} /></ActionCircleBtn>
          </>
        }
      />

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Kpi label="Total producciones" valor={producciones.length} color={INFO} dark={dark} />
        <Kpi label="En proceso" valor={producciones.filter((p) => p.estado === 'En proceso').length} color={WARNING} dark={dark}
          nota={enProceso ? `${Number(enProceso.porcentaje_avance).toFixed(0)}% de avance` : 'Ninguna'} />
        <Kpi label="Finalizadas" valor={producciones.filter((p) => p.estado === 'Finalizada').length} color={SUCCESS} dark={dark} />
        <Kpi label="Remisiones por iniciar" valor={disponibles.length} color={GOLD} dark={dark} nota="Aprobadas sin producción" />
      </div>

      {/* TABLA */}
      <TableShell headers={['ID producción', 'Remisión', 'Cliente', 'Inicio', 'Entrega', 'Avance', 'Estado', 'Acciones']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={8} dark={dark} cargando={cargando}
            texto={producciones.length === 0 ? 'Aún no hay producciones. Crea una a partir de una remisión aprobada.' : 'No se encontraron producciones con ese filtro.'} />
        ) : visibles.map((p) => (
          <tr key={p.id_produccion} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '12px 14px' }}><IdBadge id={p.id_produccion} /></td>
            <td style={{ padding: '12px 14px' }}><IdBadge id={p.id_remision} /></td>
            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{p.cliente}</td>
            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: t.subtle }}>{fecha(p.fecha_inicio)}</td>
            <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: t.subtle }}>{fecha(p.fecha_entrega)}</td>
            <td style={{ padding: '12px 14px' }}>
              <BarraAvance porcentaje={p.porcentaje_avance} dark={dark} />
              <div style={{ fontSize: 10, color: t.subtle, marginTop: 2 }}>{p.total_realizado} de {p.total_asignado} und</div>
            </td>
            <td style={{ padding: '12px 14px' }}><Pill texto={p.estado} {...ESTADO_STYLE[p.estado]} /></td>
            <td style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionCircleBtn variant="blue" onClick={() => abrirDetalle(p.id_produccion)} title="Ver detalle y tareas"><Eye size={14} /></ActionCircleBtn>
                <ActionCircleBtn variant="success" disabled={p.estado !== 'En proceso'} onClick={() => setConfirmFinalizar(p)} title="Finalizar producción">
                  <CheckCircle2 size={14} />
                </ActionCircleBtn>
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      <Paginacion pagina={pagina} total={totalPaginas} registros={filtradas.length} porPagina={POR_PAGINA} onCambiar={setPagina} dark={dark} />

      {/* ============ MODAL NUEVA PRODUCCIÓN ============ */}
      {modalNueva && cat && (
        <Modal title="Nueva Producción" icon={<Factory size={16} color={GOLD} />} onClose={() => setModalNueva(false)}
          onSave={guardarNueva} saveLabel="Crear producción" saving={procesando} dark={dark} maxWidth="980px">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <Field label="Remisión aprobada" dark={dark}>
              <select value={formRemision} onChange={(e) => seleccionarRemision(e.target.value)} style={estiloInput(dark)}>
                <option value="">Seleccionar remisión...</option>
                {disponibles.map((r) => (
                  <option key={r.id_remision} value={r.id_remision}>
                    {r.id_remision} · {r.cliente} · {r.ficha_tecnica_nombre} ({r.total_prendas} prendas)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fecha de entrega pactada" dark={dark}>
              <input type="date" value={formFechaEntrega} onChange={(e) => setFormFechaEntrega(e.target.value)} style={estiloInput(dark)} />
            </Field>
          </div>
          <div style={{ fontSize: 12, color: t.subtle }}>
            La fecha de inicio es hoy. Al crearla, la remisión pasa automáticamente a <b>En producción</b>.
          </div>

          {formRemision && (
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Asignación de operarios y tareas <span style={{ fontWeight: 400, color: t.subtle }}>(puedes agregarlas después)</span></h4>
                <button type="button" onClick={() => setFormTareas([...formTareas, tareaVacia(datosRemNueva.lineas)])}
                  style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
                  <Plus size={12} /> Agregar tarea
                </button>
              </div>
              {datosRemNueva.lineas.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {datosRemNueva.lineas.map((l) => (
                    <Pill key={l.id_detalle_de_remision} texto={`${l.nombre_de_la_pieza} · ${l.talla}: ${l.cantidad} und`} color={INFO} bg={INFO_BG} />
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                {formTareas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 16, color: t.subtle, fontSize: 12 }}>Sin tareas. Haz clic en "Agregar tarea".</div>
                ) : formTareas.map((tarea, i) => (
                  <CamposTarea key={i} tarea={tarea} datos={datosRemNueva} cat={cat} dark={dark}
                    onChange={(nueva) => setFormTareas(formTareas.map((x, j) => (j === i ? nueva : x)))}
                    onEliminar={() => setFormTareas(formTareas.filter((_, j) => j !== i))} />
                ))}
              </div>
              {formTareas.length > 0 && (
                <div style={{ fontSize: 11, color: t.subtle, marginTop: 8 }}>
                  Resumen: {formTareas.map((x) => `${nombreLinea(x.id_detalle_de_remision)} ×${x.cantidad_asignada || 0}`).join(' · ')}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ============ MODAL DETALLE ============ */}
      {detalle && !modalTarea && !confirmEliminar && !confirmFinalizar && (
        <Modal title={`Producción ${detalle.id_produccion}`} icon={<Eye size={16} color={INFO} />} onClose={() => setDetalle(null)} dark={dark} maxWidth="1050px">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              ['Remisión', <IdBadge key="r" id={detalle.id_remision} />],
              ['Cliente', <b key="c">{detalle.cliente}</b>],
              ['Inicio / entrega', `${fecha(detalle.fecha_inicio)} → ${fecha(detalle.fecha_entrega)}`],
              ['Estado', <Pill key="e" texto={detalle.estado} {...ESTADO_STYLE[detalle.estado]} />],
            ].map(([label, valor]) => (
              <div key={String(label)} style={{ background: t.surface, borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.05em', color: t.subtle, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 13 }}>{valor}</div>
              </div>
            ))}
          </div>

          <div style={{ background: t.surface, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: t.subtle, marginBottom: 6, textTransform: 'uppercase' }}>
              Avance general — {detalle.total_realizado} de {detalle.total_asignado} unidades
            </div>
            <BarraAvance porcentaje={detalle.porcentaje_avance} dark={dark} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Tareas asignadas</h4>
            {detalle.estado === 'En proceso' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => abrirTarea(null)} style={{ background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
                  <ClipboardPlus size={14} /> Agregar tarea
                </button>
                <button onClick={() => setConfirmFinalizar(detalle)} style={{ background: SUCCESS, border: 'none', color: '#FFF', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT }}>
                  <CheckCircle2 size={14} /> Finalizar producción
                </button>
              </div>
            )}
          </div>

          <TableShell headers={['ID', 'Empleado', 'Prenda / talla', 'Pieza', 'Máquina', 'Insumo', 'Asignado', 'Realizado', 'Pendiente', '']} dark={dark}>
            {detalle.asignaciones.length === 0 ? (
              <FilaMensaje colSpan={10} dark={dark} texto="Sin tareas asignadas todavía." />
            ) : detalle.asignaciones.map((a) => {
              const insumo = a.id_insumos
                ? `${a.id_insumos} (taller) ×${a.cantidad_insumo}`
                : a.id_insumos_enviados_x_cliente
                  ? `${datosRemDetalle.insumosCliente.find((i) => i.id_insumo_enviado === a.id_insumos_enviados_x_cliente)?.nombre ?? a.id_insumos_enviados_x_cliente} (cliente) ×${a.cantidad_insumo}`
                  : '—';
              const editable = detalle.estado === 'En proceso';
              return (
                <tr key={a.id_detalle_de_produccion} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '8px 10px' }}><IdBadge id={a.id_detalle_de_produccion} /></td>
                  <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600 }}>{a.empleado}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{a.prenda} · {a.talla}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{a.pieza}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{a.maquina}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: t.subtle }}>{insumo}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700 }}>{a.cantidad_asignada}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, color: SUCCESS }}>{a.cantidad_realizada}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, color: a.cantidad_pendiente > 0 ? WARNING : t.subtle }}>{a.cantidad_pendiente}</td>
                  <td style={{ padding: '8px 10px' }}>
                    {editable && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <ActionCircleBtn variant="gold" onClick={() => abrirTarea(a)} title="Editar tarea"><Pencil size={13} /></ActionCircleBtn>
                        <ActionCircleBtn variant="danger" disabled={a.cantidad_realizada > 0} onClick={() => setConfirmEliminar(a)}
                          title={a.cantidad_realizada > 0 ? 'No se puede eliminar: ya tiene reportes diarios' : 'Eliminar tarea'}>
                          <Trash2 size={13} />
                        </ActionCircleBtn>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </TableShell>

          <div>
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <History size={14} color={GOLD} /> Seguimiento de la remisión {detalle.id_remision}
            </h4>
            {historial.length === 0 ? (
              <div style={{ fontSize: 12, color: t.subtle }}>Sin registros de seguimiento.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {historial.map((h) => (
                  <div key={h.id_seguimiento} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 12px', borderRadius: 8, background: t.inputBg, fontSize: 12 }}>
                    <span><b>{h.estado_anterior ?? 'Creada'}</b> → <b style={{ color: GOLD }}>{h.estado_nuevo}</b></span>
                    <span style={{ color: t.subtle }}>{h.responsable} ({h.tipo_responsable}) · {fechaHora(h.fecha_hora)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ============ MODAL TAREA (agregar / editar) ============ */}
      {modalTarea && cat && detalle && (
        <Modal title={modalTarea.asignacion ? `Editar tarea ${modalTarea.asignacion.id_detalle_de_produccion}` : `Nueva tarea — ${detalle.id_produccion}`}
          icon={<ClipboardPlus size={16} color={GOLD} />} onClose={() => setModalTarea(null)} onSave={guardarTarea} saving={procesando} dark={dark} maxWidth="980px">
          {modalTarea.asignacion && modalTarea.asignacion.cantidad_realizada > 0 && (
            <div style={{ fontSize: 12, color: WARNING, fontWeight: 600 }}>
              Esta tarea ya tiene {modalTarea.asignacion.cantidad_realizada} unidades reportadas: la cantidad asignada no puede ser menor.
            </div>
          )}
          <CamposTarea tarea={tareaEdit} onChange={setTareaEdit} datos={datosRemDetalle} cat={cat} dark={dark} />
        </Modal>
      )}

      {/* ============ CONFIRMAR FINALIZAR ============ */}
      {confirmFinalizar && (
        <ConfirmDialog
          titulo={`¿Finalizar ${confirmFinalizar.id_produccion}?`}
          mensaje={Number(confirmFinalizar.porcentaje_avance) < 100
            ? `Atención: el avance es de ${Number(confirmFinalizar.porcentaje_avance).toFixed(0)}% (${confirmFinalizar.total_realizado} de ${confirmFinalizar.total_asignado}). Después de finalizar no se aceptan más reportes diarios.`
            : 'Todas las tareas están completas. La remisión pasará a "Terminada" y quedará lista para la remisión de entrega.'}
          confirmarLabel="Sí, finalizar"
          variante="success"
          icono={<CheckCircle2 size={28} color={SUCCESS} />}
          procesando={procesando}
          onCancel={() => setConfirmFinalizar(null)}
          onConfirm={finalizar}
          dark={dark}
        />
      )}

      {/* ============ CONFIRMAR ELIMINAR TAREA ============ */}
      {confirmEliminar && (
        <ConfirmDialog
          titulo="¿Eliminar tarea?"
          mensaje={`Se quitará la tarea de ${confirmEliminar.empleado} (${confirmEliminar.pieza}, ${confirmEliminar.cantidad_asignada} und) y el insumo usado volverá al inventario.`}
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

export default ProduccionView;
