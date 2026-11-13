import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { History, RefreshCw, Eye, ArrowRight, User, Building2, Search, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { seguimientoService, type EstadoRemision, type Seguimiento } from '../services/seguimientoService';
import { obtenerUsuario } from '../../auth/services/authService';
import { mensajeError } from '../../../shared/utils/api';
import {
  GOLD, INFO, SUCCESS, WARNING, DANGER, FONT,
  tema, estiloInput, fechaHora,
  IdBadge, ActionCircleBtn, TableShell, FilaMensaje, Modal, Field, ModuleHeader, Kpi, Paginacion,
} from '../components/ui';

interface SeguimientoRemisionViewProps {
  dark?: boolean;
}

const ESTADOS: EstadoRemision[] = ['Pendiente', 'Aprobada', 'Rechazada', 'En producción', 'Terminada', 'Entregada'];

/** Color de cada estado de la remisión. */
const COLOR_ESTADO: Record<EstadoRemision, string> = {
  'Pendiente': '#8A8A8A',
  'Aprobada': INFO,
  'Rechazada': DANGER,
  'En producción': WARNING,
  'Terminada': GOLD,
  'Entregada': SUCCESS,
};

const POR_PAGINA = 10;

const PillEstado: React.FC<{ estado: EstadoRemision | null }> = ({ estado }) => {
  if (!estado) return <span style={{ fontSize: 11, fontWeight: 700, color: '#8A8A8A', fontStyle: 'italic' }}>Creada</span>;
  const color = COLOR_ESTADO[estado] ?? '#8A8A8A';
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${color}1F`, color, whiteSpace: 'nowrap' }}>
      {estado}
    </span>
  );
};

/**
 * Seguimiento de estados de las remisiones (tabla tb_seguimiento_remision).
 * Subproceso de Gestión de Remisiones: muestra quién cambió cada remisión de estado y cuándo.
 * Es solo de consulta: los registros los crea la base de datos automáticamente.
 */
export const SeguimientoRemisionView: React.FC<SeguimientoRemisionViewProps> = ({ dark = false }) => {
  const t = tema(dark);
  const esCliente = obtenerUsuario()?.tipo === 'Cliente';

  const [registros, setRegistros] = useState<Seguimiento[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [fEstado, setFEstado] = useState<'' | EstadoRemision>('');
  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');
  const [pagina, setPagina] = useState(1);

  const [lineaTiempo, setLineaTiempo] = useState<{ id: string; pasos: Seguimiento[] } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setRegistros(await seguimientoService.listar({
        estado_nuevo: fEstado || undefined,
        desde: fDesde || undefined,
        hasta: fHasta || undefined,
      }));
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [fEstado, fDesde, fHasta]);

  useEffect(() => { cargar(); }, [cargar]);

  const verLineaTiempo = async (idRemision: string) => {
    try {
      const pasos = await seguimientoService.historialRemision(idRemision);
      setLineaTiempo({ id: idRemision, pasos });
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  // ---------- Búsqueda local, KPI y paginación ----------
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return registros;
    return registros.filter((r) =>
      [r.id_seguimiento, r.id_remision, r.responsable, r.cliente ?? '', r.estado_nuevo, r.estado_anterior ?? '']
        .some((v) => v.toLowerCase().includes(q)));
  }, [registros, busqueda]);

  useEffect(() => { setPagina(1); }, [busqueda, fEstado, fDesde, fHasta]);

  const hoy = new Date().toDateString();
  const kpiHoy = filtrados.filter((r) => new Date(r.fecha_hora).toDateString() === hoy).length;
  const kpiRemisiones = new Set(filtrados.map((r) => r.id_remision)).size;
  const kpiEntregadas = filtrados.filter((r) => r.estado_nuevo === 'Entregada').length;

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const hayFiltros = Boolean(busqueda || fEstado || fDesde || fHasta);

  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <ModuleHeader
        title="Seguimiento de Estados"
        subtitle={esCliente
          ? 'Historial de cambios de estado de tus remisiones'
          : 'Historial de cambios de estado de las remisiones: quién lo hizo y cuándo'}
        search={busqueda}
        onSearch={setBusqueda}
        dark={dark}
        extra={<ActionCircleBtn variant="blue" onClick={cargar} title="Actualizar"><RefreshCw size={14} /></ActionCircleBtn>}
      />

      {/* Filtros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20, alignItems: 'end' }}>
        <Field label="Estado nuevo" dark={dark}>
          <select value={fEstado} onChange={(e) => setFEstado(e.target.value as '' | EstadoRemision)} style={estiloInput(dark)}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </Field>
        <Field label="Desde" dark={dark}>
          <input type="date" value={fDesde} max={fHasta || undefined} onChange={(e) => setFDesde(e.target.value)} style={estiloInput(dark)} />
        </Field>
        <Field label="Hasta" dark={dark}>
          <input type="date" value={fHasta} min={fDesde || undefined} onChange={(e) => setFHasta(e.target.value)} style={estiloInput(dark)} />
        </Field>
        <button onClick={() => { setBusqueda(''); setFEstado(''); setFDesde(''); setFHasta(''); }} disabled={!hayFiltros} style={{
          padding: '9px 14px', borderRadius: 8, border: `1px solid ${GOLD}`, background: 'transparent', color: GOLD, fontWeight: 700,
          fontSize: 12, cursor: hayFiltros ? 'pointer' : 'not-allowed', opacity: hayFiltros ? 1 : 0.5, fontFamily: FONT,
        }}>
          Limpiar filtros
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Kpi label="Cambios registrados" valor={filtrados.length} color={INFO} dark={dark} />
        <Kpi label="Remisiones con movimiento" valor={kpiRemisiones} color={GOLD} dark={dark} />
        <Kpi label="Cambios de hoy" valor={kpiHoy} color={WARNING} dark={dark} />
        <Kpi label="Entregas cerradas" valor={kpiEntregadas} color={SUCCESS} dark={dark} />
      </div>

      <TableShell headers={['ID', 'Remisión', ...(esCliente ? [] : ['Cliente']), 'Cambio de estado', 'Responsable', 'Fecha y hora', '']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={esCliente ? 6 : 7} dark={dark} cargando={cargando}
            texto={hayFiltros ? 'No hay cambios de estado con esos filtros.' : 'Todavía no hay cambios de estado registrados.'} />
        ) : visibles.map((r) => (
          <tr key={r.id_seguimiento} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '12px 14px' }}><IdBadge id={r.id_seguimiento} /></td>
            <td style={{ padding: '12px 14px' }}><IdBadge id={r.id_remision} /></td>
            {!esCliente && <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{r.cliente ?? '—'}</td>}
            <td style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PillEstado estado={r.estado_anterior} />
                <ArrowRight size={14} color={t.subtle} />
                <PillEstado estado={r.estado_nuevo} />
              </div>
            </td>
            <td style={{ padding: '12px 14px', fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {r.tipo_responsable === 'Cliente' ? <Building2 size={14} color={INFO} /> : <User size={14} color={GOLD} />}
                <span style={{ fontWeight: 600 }}>{r.responsable}</span>
              </div>
              <div style={{ fontSize: 11, color: t.subtle, marginLeft: 20 }}>{r.tipo_responsable}</div>
            </td>
            <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: t.subtle, whiteSpace: 'nowrap' }}>{fechaHora(r.fecha_hora)}</td>
            <td style={{ padding: '12px 14px' }}>
              <ActionCircleBtn variant="blue" onClick={() => verLineaTiempo(r.id_remision)} title="Ver línea de tiempo de la remisión">
                <Eye size={14} />
              </ActionCircleBtn>
            </td>
          </tr>
        ))}
      </TableShell>

      <Paginacion pagina={pagina} total={totalPaginas} registros={filtrados.length} porPagina={POR_PAGINA} onCambiar={setPagina} dark={dark} />

      {/* ============ LÍNEA DE TIEMPO DE UNA REMISIÓN ============ */}
      {lineaTiempo && (
        <Modal title={`Línea de tiempo — ${lineaTiempo.id}`} icon={<History size={16} color={GOLD} />} onClose={() => setLineaTiempo(null)} dark={dark} maxWidth="560px">
          {lineaTiempo.pasos.length === 0 ? (
            <div style={{ fontSize: 13, color: t.subtle, display: 'flex', alignItems: 'center', gap: 8 }}><Search size={14} /> Sin registros de seguimiento.</div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              <div style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, background: `${GOLD}40` }} />
              {lineaTiempo.pasos.map((p, i) => {
                const color = COLOR_ESTADO[p.estado_nuevo] ?? GOLD;
                const ultimo = i === lineaTiempo.pasos.length - 1;
                return (
                  <div key={p.id_seguimiento} style={{ position: 'relative', paddingBottom: ultimo ? 0 : 20 }}>
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
                      {p.estado_anterior ? <>Desde <b>{p.estado_anterior}</b> · </> : <>Remisión creada · </>}
                      por <b>{p.responsable}</b> <span style={{ color: t.subtle }}>({p.tipo_responsable})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default SeguimientoRemisionView;
