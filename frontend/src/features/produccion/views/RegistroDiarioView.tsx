import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { registroDiarioService, type RegistroDiario } from '../services/registroDiarioService';
import { produccionService, type Produccion } from '../services/produccionService';
import { empleadoService, type Empleado } from '../../usuarios/services/empleadoService';
import { mensajeError } from '../../../shared/utils/api';
import {
  GOLD, INFO, SUCCESS, WARNING, FONT,
  tema, estiloInput, fechaHora,
  IdBadge, ActionCircleBtn, TableShell, FilaMensaje, Modal, Field, ModuleHeader, Kpi, Paginacion, ConfirmDialog,
} from '../components/ui';

interface RegistroDiarioViewProps {
  dark?: boolean;
}

const POR_PAGINA = 8;

/**
 * Historial de reportes diarios para el administrador (HU_57): quién hizo qué, cuánto y cuándo.
 * Permite corregir la cantidad o eliminar un reporte mientras la producción esté En proceso.
 */
export const RegistroDiarioView: React.FC<RegistroDiarioViewProps> = ({ dark = false }) => {
  const t = tema(dark);

  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [producciones, setProducciones] = useState<Produccion[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros (empleado, producción y fechas van al backend; la búsqueda es local)
  const [busqueda, setBusqueda] = useState('');
  const [fEmpleado, setFEmpleado] = useState('');
  const [fProduccion, setFProduccion] = useState('');
  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');
  const [pagina, setPagina] = useState(1);

  const [editar, setEditar] = useState<RegistroDiario | null>(null);
  const [formCantidad, setFormCantidad] = useState<number | ''>('');
  const [eliminar, setEliminar] = useState<RegistroDiario | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    Promise.all([empleadoService.listar(), produccionService.listar()])
      .then(([emps, prods]) => { setEmpleados(emps); setProducciones(prods); })
      .catch((e) => toast.error(mensajeError(e)));
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setRegistros(await registroDiarioService.listar({
        id_empleado: fEmpleado || undefined,
        id_produccion: fProduccion || undefined,
        desde: fDesde || undefined,
        hasta: fHasta || undefined,
      }));
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [fEmpleado, fProduccion, fDesde, fHasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const estadoProduccion = (id: string) => producciones.find((p) => p.id_produccion === id)?.estado;
  const editable = (r: RegistroDiario) => estadoProduccion(r.id_produccion) !== 'Finalizada';

  // ---------- Editar cantidad ----------
  const abrirEditar = (r: RegistroDiario) => {
    setEditar(r);
    setFormCantidad(r.cantidad);
  };

  const guardarEdicion = async () => {
    if (!editar) return;
    const n = Number(formCantidad);
    if (!Number.isInteger(n) || n <= 0) { toast.error('Ingresa una cantidad entera mayor a 0.'); return; }
    if (n === editar.cantidad) { setEditar(null); return; }
    setProcesando(true);
    try {
      await registroDiarioService.actualizar(editar.id_registro_diario, n);
      toast.success('Registro diario actualizado.');
      setEditar(null);
      await cargar();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // ---------- Eliminar ----------
  const confirmarEliminar = async () => {
    if (!eliminar) return;
    setProcesando(true);
    try {
      await registroDiarioService.eliminar(eliminar.id_registro_diario);
      toast.success('Registro diario eliminado.');
      setEliminar(null);
      await cargar();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // ---------- Búsqueda, KPI y paginación ----------
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return registros;
    return registros.filter((r) =>
      [r.id_registro_diario, r.empleado, r.pieza, r.maquina, r.prenda, r.talla, r.id_remision, r.id_produccion]
        .some((v) => v.toLowerCase().includes(q)));
  }, [registros, busqueda]);

  useEffect(() => { setPagina(1); }, [busqueda, fEmpleado, fProduccion, fDesde, fHasta]);

  const totalUnidades = filtrados.reduce((s, r) => s + r.cantidad, 0);
  const operarios = new Set(filtrados.map((r) => r.id_empleado)).size;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const limpiarFiltros = () => { setFEmpleado(''); setFProduccion(''); setFDesde(''); setFHasta(''); setBusqueda(''); };
  const hayFiltros = Boolean(fEmpleado || fProduccion || fDesde || fHasta || busqueda);

  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <ModuleHeader
        title="Registro Diario"
        subtitle="Historial de lo que reporta cada operario en su jornada"
        search={busqueda}
        onSearch={setBusqueda}
        dark={dark}
        extra={<ActionCircleBtn variant="blue" onClick={cargar} title="Actualizar"><RefreshCw size={14} /></ActionCircleBtn>}
      />

      {/* Filtros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20, alignItems: 'end' }}>
        <Field label="Empleado" dark={dark}>
          <select value={fEmpleado} onChange={(e) => setFEmpleado(e.target.value)} style={estiloInput(dark)}>
            <option value="">Todos</option>
            {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </Field>
        <Field label="Producción" dark={dark}>
          <select value={fProduccion} onChange={(e) => setFProduccion(e.target.value)} style={estiloInput(dark)}>
            <option value="">Todas</option>
            {producciones.map((p) => <option key={p.id_produccion} value={p.id_produccion}>{p.id_produccion} · {p.id_remision} ({p.estado})</option>)}
          </select>
        </Field>
        <Field label="Desde" dark={dark}>
          <input type="date" value={fDesde} max={fHasta || undefined} onChange={(e) => setFDesde(e.target.value)} style={estiloInput(dark)} />
        </Field>
        <Field label="Hasta" dark={dark}>
          <input type="date" value={fHasta} min={fDesde || undefined} onChange={(e) => setFHasta(e.target.value)} style={estiloInput(dark)} />
        </Field>
        <button onClick={limpiarFiltros} disabled={!hayFiltros} style={{
          padding: '9px 14px', borderRadius: 8, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, fontWeight: 700,
          fontSize: 12, cursor: hayFiltros ? 'pointer' : 'not-allowed', opacity: hayFiltros ? 1 : 0.5, fontFamily: FONT,
        }}>
          Limpiar filtros
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Kpi label="Reportes" valor={filtrados.length} color={INFO} dark={dark} />
        <Kpi label="Unidades confeccionadas" valor={totalUnidades} color={SUCCESS} dark={dark} />
        <Kpi label="Operarios que reportaron" valor={operarios} color={WARNING} dark={dark} />
      </div>

      <TableShell headers={['ID registro', 'Fecha y hora', 'Empleado', 'Remisión', 'Prenda / talla', 'Pieza', 'Máquina', 'Cantidad', 'Acciones']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={9} dark={dark} cargando={cargando}
            texto={hayFiltros ? 'No hay reportes con esos filtros.' : 'Todavía no hay reportes diarios.'} />
        ) : visibles.map((r) => (
          <tr key={r.id_registro_diario} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '12px 14px' }}><IdBadge id={r.id_registro_diario} /></td>
            <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: t.subtle, whiteSpace: 'nowrap' }}>{fechaHora(r.fecha)}</td>
            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{r.empleado}</td>
            <td style={{ padding: '12px 14px' }}><IdBadge id={r.id_remision} /></td>
            <td style={{ padding: '12px 14px', fontSize: 12 }}>{r.prenda} · {r.talla}</td>
            <td style={{ padding: '12px 14px', fontSize: 12 }}>{r.pieza}</td>
            <td style={{ padding: '12px 14px', fontSize: 12, color: t.subtle }}>{r.maquina}</td>
            <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 800 }}>{r.cantidad}</td>
            <td style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionCircleBtn variant="gold" disabled={!editable(r)} onClick={() => abrirEditar(r)}
                  title={editable(r) ? 'Corregir cantidad' : 'La producción está finalizada'}>
                  <Pencil size={14} />
                </ActionCircleBtn>
                <ActionCircleBtn variant="danger" disabled={!editable(r)} onClick={() => setEliminar(r)}
                  title={editable(r) ? 'Eliminar' : 'La producción está finalizada'}>
                  <Trash2 size={14} />
                </ActionCircleBtn>
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      <Paginacion pagina={pagina} total={totalPaginas} registros={filtrados.length} porPagina={POR_PAGINA} onCambiar={setPagina} dark={dark} />

      {editar && (
        <Modal title={`Corregir registro ${editar.id_registro_diario}`} icon={<ClipboardList size={16} color={GOLD} />}
          onClose={() => setEditar(null)} onSave={guardarEdicion} saving={procesando} dark={dark} maxWidth="480px">
          <div style={{ fontSize: 13, color: t.subtle, lineHeight: 1.6 }}>
            <b style={{ color: t.fg }}>{editar.empleado}</b> — {editar.pieza} ({editar.prenda} {editar.talla}) en {editar.maquina}<br />
            Reportado el {fechaHora(editar.fecha)}
          </div>
          <Field label="Cantidad confeccionada" dark={dark}>
            <input type="number" min={1} value={formCantidad} autoFocus
              onChange={(e) => setFormCantidad(e.target.value === '' ? '' : Math.floor(Number(e.target.value)))}
              style={estiloInput(dark)} />
          </Field>
          <div style={{ fontSize: 11, color: t.subtle }}>La fecha y la hora no se modifican. El total reportado no puede superar lo asignado.</div>
        </Modal>
      )}

      {eliminar && (
        <ConfirmDialog
          titulo="¿Eliminar registro diario?"
          mensaje={`Se borrará el reporte de ${eliminar.empleado}: ${eliminar.cantidad} und de ${eliminar.pieza} (${fechaHora(eliminar.fecha)}). El avance de la producción bajará.`}
          confirmarLabel="Sí, eliminar"
          procesando={procesando}
          onCancel={() => setEliminar(null)}
          onConfirm={confirmarEliminar}
          dark={dark}
        />
      )}
    </div>
  );
};

export default RegistroDiarioView;
