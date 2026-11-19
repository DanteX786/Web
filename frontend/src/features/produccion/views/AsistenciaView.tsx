import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, UserCheck, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { asistenciaService, type Asistencia, type EstadoAsistencia } from '../services/asistenciaService';
import { mensajeError } from '../../../shared/utils/api';
import {
  GOLD, SUCCESS, SUCCESS_BG, DANGER, DANGER_BG, FONT,
  tema, estiloInput, fecha as formatoFecha, fechaHora, coincide, useAutoRefresco,
  IdBadge, Pill, TableShell, FilaMensaje, Modal, Field, ModuleHeader, Paginacion, ConfirmDialog,
} from '../components/ui';

interface AsistenciaViewProps {
  dark?: boolean;
}

const POR_PAGINA = 10;

/** Fecha de hoy en el equipo del usuario (Colombia) como "YYYY-MM-DD". */
const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Asistencia diaria de los empleados (solo el administrador).
 * Al abrir un día, todos aparecen en "No presente" y se marca a los que vinieron.
 * Solo los empleados Presentes hoy reciben tareas y reportan su avance diario.
 */
export const AsistenciaView: React.FC<AsistenciaViewProps> = ({ dark = false }) => {
  const t = tema(dark);

  const [dia, setDia] = useState(hoyLocal());
  const [registros, setRegistros] = useState<Asistencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'' | EstadoAsistencia>('');
  const [pagina, setPagina] = useState(1);
  const [observar, setObservar] = useState<Asistencia | null>(null);
  const [textoObs, setTextoObs] = useState('');
  const [confirmarTodos, setConfirmarTodos] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const esHoy = dia === hoyLocal();

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      setRegistros(await asistenciaService.delDia(dia));
    } catch (e) {
      if (!silencioso) toast.error(mensajeError(e));
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [dia]);

  useEffect(() => { cargar(); }, [cargar]);
  useAutoRefresco(() => cargar(true));

  const reemplazar = (a: Asistencia) => setRegistros((prev) => prev.map((r) => (r.id_asistencia === a.id_asistencia ? a : r)));

  const cambiarEstado = async (r: Asistencia, estado: EstadoAsistencia) => {
    if (r.estado === estado) return;
    try {
      reemplazar(await asistenciaService.marcar(r.id_asistencia, estado, r.observacion));
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const guardarObservacion = async () => {
    if (!observar) return;
    setProcesando(true);
    try {
      reemplazar(await asistenciaService.marcar(observar.id_asistencia, observar.estado, textoObs.trim() || null));
      toast.success('Observación guardada.');
      setObservar(null);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  const marcarTodosPresentes = async () => {
    setProcesando(true);
    try {
      setRegistros(await asistenciaService.marcarTodos(dia, 'Presente'));
      toast.success('Todos los empleados quedaron Presentes.');
      setConfirmarTodos(false);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // ---------- Búsqueda (en todas las columnas), filtro y paginación ----------
  const filtrados = useMemo(() => registros
    .filter((r) => !filtroEstado || r.estado === filtroEstado)
    .filter((r) => coincide(busqueda, [
      r.id_asistencia, r.empleado, r.identificacion, r.rol, r.estado, r.observacion, r.registrado_por_nombre,
      fechaHora(r.fecha_registro),
    ])), [registros, busqueda, filtroEstado]);

  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado, dia]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const presentes = registros.filter((r) => r.estado === 'Presente').length;

  const botonEstado = (activo: boolean, color: string, bg: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    border: `1px solid ${activo ? color : t.border}`, background: activo ? bg : 'transparent', color: activo ? color : t.subtle,
    cursor: 'pointer', fontFamily: FONT,
  });

  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <ModuleHeader
        title="Asistencia"
        subtitle="Marca a los empleados que vinieron. Solo los Presentes de hoy reciben tareas y reportan su avance diario."
        search={busqueda}
        onSearch={setBusqueda}
        dark={dark}
        extra={
          <>
            <input type="date" value={dia} max={hoyLocal()} onChange={(e) => setDia(e.target.value || hoyLocal())}
              style={estiloInput(dark, { width: 160, padding: '8px 10px' })} />
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as '' | EstadoAsistencia)}
              style={estiloInput(dark, { width: 160, padding: '8px 10px' })}>
              <option value="">Todos los estados</option>
              <option value="Presente">Presente</option>
              <option value="No presente">No presente</option>
            </select>
            <button onClick={() => setConfirmarTodos(true)} disabled={registros.length === 0 || presentes === registros.length} style={{
              background: SUCCESS, color: '#FFF', fontWeight: 700, fontSize: 13, borderRadius: 10, padding: '8px 14px', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT,
              opacity: registros.length === 0 || presentes === registros.length ? 0.5 : 1,
            }}>
              <UserCheck size={14} /> Marcar todos presentes
            </button>
          </>
        }
      />

      <div style={{ fontSize: 13, color: t.subtle, marginBottom: 12 }}>
        {esHoy ? 'Hoy' : formatoFecha(dia)}: <b style={{ color: t.fg }}>{presentes}</b> de {registros.length} empleados presentes.
        {!esHoy && ' Estás corrigiendo un día anterior: las tareas y el registro diario solo miran la asistencia de hoy.'}
      </div>

      <TableShell headers={['ID', 'Empleado', 'Identificación', 'Rol', 'Estado', 'Observación', 'Marcado por', 'Acciones']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={8} dark={dark} cargando={cargando}
            texto={registros.length === 0 ? 'No hay empleados activos.' : 'No hay registros con ese filtro.'} />
        ) : visibles.map((r) => (
          <tr key={r.id_asistencia} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '12px 14px' }}><IdBadge id={r.id_asistencia} /></td>
            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{r.empleado}</td>
            <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: t.subtle }}>{r.identificacion}</td>
            <td style={{ padding: '12px 14px', fontSize: 12, color: t.subtle }}>{r.rol ?? '—'}</td>
            <td style={{ padding: '12px 14px' }}>
              {r.estado === 'Presente'
                ? <Pill texto="Presente" color={SUCCESS} bg={SUCCESS_BG} />
                : <Pill texto="No presente" color={DANGER} bg={DANGER_BG} />}
            </td>
            <td style={{ padding: '12px 14px', fontSize: 12, color: r.observacion ? t.fg : t.subtle, maxWidth: 220 }}>{r.observacion ?? '—'}</td>
            <td style={{ padding: '12px 14px', fontSize: 11, color: t.subtle }}>
              {r.registrado_por_nombre ? <>{r.registrado_por_nombre}<br />{fechaHora(r.fecha_registro)}</> : 'Sin marcar'}
            </td>
            <td style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => cambiarEstado(r, 'Presente')} style={botonEstado(r.estado === 'Presente', SUCCESS, SUCCESS_BG)}>
                  <CheckCircle2 size={12} /> Presente
                </button>
                <button onClick={() => cambiarEstado(r, 'No presente')} style={botonEstado(r.estado === 'No presente', DANGER, DANGER_BG)}>
                  <XCircle size={12} /> No presente
                </button>
                <button onClick={() => { setObservar(r); setTextoObs(r.observacion ?? ''); }} title="Observación"
                  style={botonEstado(Boolean(r.observacion), GOLD, `${GOLD}1F`)}>
                  <MessageSquare size={12} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      <Paginacion pagina={pagina} total={totalPaginas} registros={filtrados.length} porPagina={POR_PAGINA} onCambiar={setPagina} dark={dark} />

      {observar && (
        <Modal title={`Observación — ${observar.empleado}`} icon={<MessageSquare size={16} color={GOLD} />}
          onClose={() => setObservar(null)} onSave={guardarObservacion} saving={procesando} dark={dark} maxWidth="480px">
          <Field label="Observación (opcional)" dark={dark}>
            <input value={textoObs} maxLength={150} autoFocus placeholder="Ej. llegó tarde, cita médica, incapacidad"
              onChange={(e) => setTextoObs(e.target.value)} style={estiloInput(dark)} />
          </Field>
        </Modal>
      )}

      {confirmarTodos && (
        <ConfirmDialog
          titulo="¿Marcar a todos como presentes?"
          mensaje={`Los ${registros.length} empleados activos quedarán Presentes ${esHoy ? 'hoy' : `el ${formatoFecha(dia)}`}. Después puedes cambiar a los que no vinieron.`}
          confirmarLabel="Sí, marcar todos"
          variante="success"
          icono={<UserCheck size={28} color={SUCCESS} />}
          procesando={procesando}
          onCancel={() => setConfirmarTodos(false)}
          onConfirm={marcarTodosPresentes}
          dark={dark}
        />
      )}
    </div>
  );
};

export default AsistenciaView;
