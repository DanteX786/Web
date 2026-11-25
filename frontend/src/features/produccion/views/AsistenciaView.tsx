import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, UserCheck, CalendarX, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { exportarExcel, subtituloExportacion } from '../../../shared/utils/excel';

import {
  asistenciaService, NOVEDADES,
  type Asistencia, type EstadoAsistencia, type Marcacion, type TipoSalida,
} from '../services/asistenciaService';
import { mensajeError } from '../../../shared/utils/api';
import {
  GOLD, SUCCESS, SUCCESS_BG, DANGER, DANGER_BG, WARNING, WARNING_BG, INFO, FONT,
  tema, estiloInput, fecha as formatoFecha, fechaHora, coincide, useAutoRefresco,
  Pill, TableShell, FilaMensaje, Modal, Field, ModuleHeader, Paginacion, ConfirmDialog, ActionCircleBtn,
} from '../components/ui';

interface AsistenciaViewProps {
  dark?: boolean;
}

const POR_PAGINA = 10;

const dos = (n: number) => String(n).padStart(2, '0');
/** Fecha de hoy en el equipo del usuario (Colombia) como "YYYY-MM-DD". */
const hoyLocal = () => { const d = new Date(); return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`; };
/** Hora actual "HH:MM". */
const horaActual = () => { const d = new Date(); return `${dos(d.getHours())}:${dos(d.getMinutes())}`; };
/** ISO -> "HH:MM" (hora del equipo, Colombia). */
const hhmm = (iso: string | null) => { if (!iso) return ''; const d = new Date(iso); return `${dos(d.getHours())}:${dos(d.getMinutes())}`; };
/** 390 -> "6 h 30 min" */
const duracion = (min: number) => (min <= 0 ? '—' : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`);

type Filtro = '' | 'en_taller' | EstadoAsistencia;

/** Cómo está el empleado ese día (para la columna Estado). */
const situacion = (r: Asistencia, esHoy: boolean): { texto: string; color: string; bg: string } => {
  if (r.estado === 'Permiso') return { texto: 'Permiso (día completo)', color: WARNING, bg: WARNING_BG };
  if (r.estado === 'Incapacidad') return { texto: 'Incapacidad', color: INFO, bg: `${INFO}1F` };
  if (r.estado === 'Vacaciones') return { texto: 'Vacaciones', color: INFO, bg: `${INFO}1F` };
  if (r.estado === 'No presente') return { texto: 'No presente', color: DANGER, bg: DANGER_BG };
  if (r.marcaciones.length === 0) return { texto: 'Presente (sin horario)', color: SUCCESS, bg: SUCCESS_BG };
  if (r.marcaciones.some((m) => m.sin_salida)) return { texto: 'Falta la salida', color: DANGER, bg: DANGER_BG };
  if (r.en_taller) return { texto: 'En el taller', color: SUCCESS, bg: SUCCESS_BG };
  const ultima = r.marcaciones[r.marcaciones.length - 1];
  if (esHoy && ultima.tipo_salida === 'Permiso') return { texto: 'Salió con permiso', color: WARNING, bg: WARNING_BG };
  return { texto: 'Jornada terminada', color: '#8A8A8A', bg: '#8A8A8A1F' };
};

/**
 * Asistencia diaria con hora de entrada y salida (solo el administrador).
 *  - Entrada: llega o vuelve al taller. Salida: fin de jornada o permiso (con motivo).
 *    Ej: 6:00 → 7:00 (permiso: cita médica) y 9:00 → 14:30.
 *  - Novedad: Permiso / Incapacidad / Vacaciones del día completo.
 *  - Solo recibe tareas quien está EN EL TALLER ahora; solo reporta avance quien vino hoy.
 *  - Las entradas de días anteriores sin salida se avisan arriba para corregirlas.
 */
export const AsistenciaView: React.FC<AsistenciaViewProps> = ({ dark = false }) => {
  const t = tema(dark);

  const [dia, setDia] = useState(hoyLocal());
  const [registros, setRegistros] = useState<Asistencia[]>([]);
  const [sinSalida, setSinSalida] = useState<Marcacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('');
  const [pagina, setPagina] = useState(1);
  const [procesando, setProcesando] = useState(false);

  // Ventanas
  const [entrada, setEntrada] = useState<{ r: Asistencia; hora: string } | null>(null);
  const [salida, setSalida] = useState<{ r: Asistencia; hora: string; tipo: TipoSalida; motivo: string } | null>(null);
  const [novedad, setNovedad] = useState<{ r: Asistencia; estado: EstadoAsistencia; observacion: string } | null>(null);
  const [tramo, setTramo] = useState<{ m: Marcacion; entrada: string; salida: string; tipo: TipoSalida; motivo: string } | null>(null);
  const [borrarTramo, setBorrarTramo] = useState<Marcacion | null>(null);
  const [entradaTodos, setEntradaTodos] = useState<{ hora: string } | null>(null);

  const esHoy = dia === hoyLocal();

  // ---------- Validación en tiempo real ----------
  // "Escribe la hora" solo aparece después de intentar guardar; lo demás se avisa mientras se escribe.
  const [intento, setIntento] = useState(false);
  useEffect(() => { setIntento(false); }, [Boolean(entrada), Boolean(salida), Boolean(tramo), Boolean(entradaTodos)]);
  const futura = (h: string) => esHoy && Boolean(h) && h > horaActual();
  const errHora = (h: string, nombre = 'la hora') => (!h ? (intento ? `Escribe ${nombre}.` : null)
    : futura(h) ? 'No puede ser una hora que todavía no ha pasado.' : null);
  const ultimaSalida = (r: Asistencia) => {
    const salidas = r.marcaciones.filter((m) => m.hora_salida).map((m) => hhmm(m.hora_salida));
    return salidas.length ? salidas.sort()[salidas.length - 1] : '';
  };
  const errEntrada = entrada ? (errHora(entrada.hora, 'la hora de entrada')
    ?? (entrada.hora && ultimaSalida(entrada.r) && entrada.hora < ultimaSalida(entrada.r)
      ? `Debe ser después de su última salida (${ultimaSalida(entrada.r)}).` : null)) : null;
  const entradaAbierta = salida ? salida.r.marcaciones.find((m) => !m.hora_salida) : undefined;
  const errSalida = salida ? (errHora(salida.hora, 'la hora de salida')
    ?? (salida.hora && entradaAbierta && salida.hora <= hhmm(entradaAbierta.hora_entrada)
      ? `Debe ser después de la entrada (${hhmm(entradaAbierta.hora_entrada)}).` : null)) : null;
  const errMotivoSalida = salida && salida.tipo === 'Permiso' && !salida.motivo.trim() && (intento || salida.motivo !== '')
    ? 'Escribe el motivo del permiso.' : salida && salida.tipo === 'Permiso' && intento && !salida.motivo.trim() ? 'Escribe el motivo del permiso.' : null;
  const errTramoEntrada = tramo ? errHora(tramo.entrada, 'la hora de entrada') : null;
  const errTramoSalida = tramo && tramo.salida ? (futura(tramo.salida) ? 'No puede ser una hora que todavía no ha pasado.'
    : tramo.entrada && tramo.salida <= tramo.entrada ? 'Debe ser después de la entrada.' : null) : null;
  const errTramoMotivo = tramo && tramo.salida && tramo.tipo === 'Permiso' && !tramo.motivo.trim() ? 'Escribe el motivo del permiso.' : null;
  const errTodos = entradaTodos ? errHora(entradaTodos.hora, 'la hora de entrada') : null;

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const [lista, abiertas] = await Promise.all([asistenciaService.delDia(dia), asistenciaService.sinSalida()]);
      setRegistros(lista);
      setSinSalida(abiertas);
    } catch (e) {
      if (!silencioso) toast.error(mensajeError(e));
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [dia]);

  useEffect(() => { cargar(); }, [cargar]);
  useAutoRefresco(() => cargar(true));

  // Aviso al entrar: entradas de días anteriores que quedaron sin salida
  useEffect(() => {
    if (sinSalida.length) toast.warning(`Hay ${sinSalida.length} entrada(s) de días anteriores sin salida. Corrígelas en el aviso de arriba.`, { id: 'sin-salida' });
  }, [sinSalida.length]);

  const reemplazar = (a: Asistencia) => setRegistros((prev) => prev.map((r) => (r.id_asistencia === a.id_asistencia ? a : r)));

  /** Ejecuta una acción que devuelve la asistencia actualizada del empleado. */
  const ejecutar = async (accion: () => Promise<Asistencia>, ok: string, cerrar: () => void) => {
    setProcesando(true);
    try {
      reemplazar(await accion());
      toast.success(ok);
      cerrar();
      asistenciaService.sinSalida().then(setSinSalida).catch(() => undefined);
    } catch (e) {
      toast.error(mensajeError(e), { duration: 8000 });
    } finally {
      setProcesando(false);
    }
  };

  // ---------- Acciones ----------
  const guardarEntrada = () => {
    if (!entrada) return;
    if (!entrada.hora || errEntrada) { setIntento(true); toast.error(errEntrada ?? 'Escribe la hora de entrada.'); return; }
    ejecutar(() => asistenciaService.entrada(entrada.r.id_asistencia, entrada.hora),
      `Entrada de ${entrada.r.empleado} registrada a las ${entrada.hora}.`, () => setEntrada(null));
  };

  const guardarSalida = () => {
    if (!salida) return;
    if (!salida.hora || errSalida) { setIntento(true); toast.error(errSalida ?? 'Escribe la hora de salida.'); return; }
    if (salida.tipo === 'Permiso' && !salida.motivo.trim()) { setIntento(true); toast.error('Escribe el motivo del permiso.'); return; }
    ejecutar(() => asistenciaService.salida(salida.r.id_asistencia, {
      hora: salida.hora, tipo_salida: salida.tipo, motivo: salida.tipo === 'Permiso' ? salida.motivo.trim() : null,
    }), salida.tipo === 'Permiso'
      ? `${salida.r.empleado} salió con permiso a las ${salida.hora}. Cuando vuelva, registra otra entrada.`
      : `Salida de ${salida.r.empleado} registrada a las ${salida.hora}.`, () => setSalida(null));
  };

  const guardarNovedad = () => {
    if (!novedad) return;
    ejecutar(() => asistenciaService.marcar(novedad.r.id_asistencia, novedad.estado, novedad.observacion.trim() || null),
      'Asistencia actualizada.', () => setNovedad(null));
  };

  const guardarTramo = () => {
    if (!tramo) return;
    if (!tramo.entrada || errTramoEntrada || errTramoSalida || errTramoMotivo) {
      setIntento(true); toast.error(errTramoEntrada ?? errTramoSalida ?? errTramoMotivo ?? 'La hora de entrada es obligatoria.'); return;
    }
    if (tramo.salida && tramo.salida <= tramo.entrada) { toast.error('La salida debe ser después de la entrada.'); return; }
    if (tramo.salida && tramo.tipo === 'Permiso' && !tramo.motivo.trim()) { toast.error('Escribe el motivo del permiso.'); return; }
    ejecutar(() => asistenciaService.editarMarcacion(tramo.m.id_marcacion, {
      hora_entrada: tramo.entrada,
      hora_salida: tramo.salida || null,
      tipo_salida: tramo.salida ? tramo.tipo : null,
      motivo: tramo.salida && tramo.tipo === 'Permiso' ? tramo.motivo.trim() : null,
    }), 'Horario corregido.', () => setTramo(null));
  };

  const eliminarTramo = () => {
    if (!borrarTramo) return;
    ejecutar(() => asistenciaService.eliminarMarcacion(borrarTramo.id_marcacion), 'Tramo eliminado.',
      () => { setBorrarTramo(null); setTramo(null); });
  };

  const guardarEntradaTodos = async () => {
    if (!entradaTodos) return;
    if (!entradaTodos.hora || errTodos) { setIntento(true); toast.error(errTodos ?? 'Escribe la hora de entrada.'); return; }
    setProcesando(true);
    try {
      setRegistros(await asistenciaService.entradaTodos(dia, entradaTodos.hora));
      toast.success(`Entrada registrada a las ${entradaTodos.hora} para todos los que no habían llegado.`);
      setEntradaTodos(null);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  const abrirTramo = (m: Marcacion) => setTramo({
    m, entrada: hhmm(m.hora_entrada), salida: hhmm(m.hora_salida), tipo: m.tipo_salida ?? 'Fin de jornada', motivo: m.motivo ?? '',
  });

  // ---------- Búsqueda, filtro y paginación ----------
  const filtrados = useMemo(() => registros
    .filter((r) => !filtro || (filtro === 'en_taller' ? r.en_taller : r.estado === filtro))
    .filter((r) => coincide(busqueda, [
      r.id_asistencia, r.empleado, r.identificacion, r.rol, r.estado, situacion(r, esHoy).texto, r.observacion,
      r.registrado_por_nombre, duracion(r.minutos_trabajados),
      r.marcaciones.map((m) => `${hhmm(m.hora_entrada)} ${hhmm(m.hora_salida)} ${m.tipo_salida ?? ''} ${m.motivo ?? ''}`),
    ])), [registros, busqueda, filtro, esHoy]);

  useEffect(() => { setPagina(1); }, [busqueda, filtro, dia]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  /** Exporta la asistencia del día elegido (con la búsqueda y el filtro aplicados). */
  const descargarExcel = () => exportarExcel({
    archivo: `asistencia_${dia}`, hoja: 'Asistencia', titulo: `Asistencia del ${dia.split('-').reverse().join('/')}`,
    subtitulo: subtituloExportacion(busqueda, filtrados.length),
    filas: filtrados,
    columnas: [
      { titulo: 'Fecha', valor: r => r.fecha, tipo: 'fecha' },
      { titulo: 'ID empleado', valor: r => r.id_empleado },
      { titulo: 'Empleado', valor: r => r.empleado },
      { titulo: 'Identificación', valor: r => r.identificacion },
      { titulo: 'Rol', valor: r => r.rol },
      { titulo: 'Estado', valor: r => r.estado },
      { titulo: 'Situación', valor: r => situacion(r, esHoy).texto },
      { titulo: 'Entradas y salidas', valor: r => r.marcaciones.map(m => `${hhmm(m.hora_entrada)} – ${m.hora_salida ? hhmm(m.hora_salida) : 'sin salida'}${m.tipo_salida ? ` (${m.tipo_salida})` : ''}`).join('\n'), ancho: 32 },
      { titulo: 'Horas trabajadas', valor: r => Math.round(r.minutos_trabajados / 6) / 10, tipo: 'numero' },
      { titulo: 'Observación', valor: r => r.observacion, ancho: 32 },
      { titulo: 'Registrado por', valor: r => r.registrado_por_nombre },
    ],
  });
  const enTaller = registros.filter((r) => r.en_taller).length;
  const vinieron = registros.filter((r) => r.estado === 'Presente').length;
  const conNovedad = registros.filter((r) => ['Permiso', 'Incapacidad', 'Vacaciones'].includes(r.estado)).length;
  const sinLlegar = registros.filter((r) => r.estado === 'No presente').length;
  const novedadDia = (r: Asistencia) => ['Permiso', 'Incapacidad', 'Vacaciones'].includes(r.estado);

  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <ModuleHeader
        title="Asistencia"
        subtitle="Registra la hora de entrada y de salida. Solo quien está en el taller recibe tareas."
        search={busqueda}
        onSearch={setBusqueda}
        dark={dark}
        excel={{ onClick: descargarExcel, cantidad: filtrados.length }}
        extra={
          <>
            <input type="date" value={dia} max={hoyLocal()} onChange={(e) => setDia(e.target.value || hoyLocal())}
              style={estiloInput(dark, { width: 160, padding: '8px 10px' })} />
            <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)} style={estiloInput(dark, { width: 170, padding: '8px 10px' })}>
              <option value="">Todos</option>
              <option value="en_taller">En el taller</option>
              <option value="Presente">Vinieron</option>
              <option value="No presente">No presente</option>
              <option value="Permiso">Permiso</option>
              <option value="Incapacidad">Incapacidad</option>
              <option value="Vacaciones">Vacaciones</option>
            </select>
            <button onClick={() => setEntradaTodos({ hora: esHoy ? horaActual() : '' })} disabled={sinLlegar === 0} style={{
              background: SUCCESS, color: '#FFF', fontWeight: 700, fontSize: 13, borderRadius: 10, padding: '8px 14px', border: 'none',
              cursor: sinLlegar ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, opacity: sinLlegar ? 1 : 0.5,
            }}>
              <UserCheck size={14} /> Entrada a todos
            </button>
          </>
        }
      />

      {/* Aviso: entradas de días anteriores sin salida */}
      {sinSalida.length > 0 && (
        <div style={{ border: `1px solid ${DANGER}66`, background: `${DANGER}12`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: DANGER, marginBottom: 6 }}>
            <AlertTriangle size={16} /> Hay {sinSalida.length} entrada(s) sin salida de días anteriores
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {sinSalida.map((m) => (
              <button key={m.id_marcacion} onClick={() => setDia(m.fecha)} title="Ir a ese día para corregirla"
                style={{ border: `1px solid ${DANGER}66`, background: 'transparent', color: t.fg, borderRadius: 999, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>
                <b>{m.empleado}</b> · {formatoFecha(m.fecha)} entró {hhmm(m.hora_entrada)}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: t.subtle, marginTop: 6 }}>Haz clic para ir a ese día y luego en el horario en rojo para ponerle la hora de salida.</div>
        </div>
      )}

      <div style={{ fontSize: 13, color: t.subtle, marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>{esHoy ? 'Hoy' : formatoFecha(dia)}:</span>
        {esHoy && <span><b style={{ color: SUCCESS }}>{enTaller}</b> en el taller ahora</span>}
        <span><b style={{ color: t.fg }}>{vinieron}</b> vinieron</span>
        <span><b style={{ color: DANGER }}>{sinLlegar}</b> no presentes</span>
        <span><b style={{ color: INFO }}>{conNovedad}</b> con novedad</span>
        {!esHoy && <span>Estás corrigiendo un día anterior: las tareas y el registro diario solo miran la asistencia de hoy.</span>}
      </div>

      <TableShell headers={['Empleado', 'Estado', 'Horario (entrada → salida)', 'Horas', 'Observación', 'Acciones']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={6} dark={dark} cargando={cargando}
            texto={registros.length === 0 ? 'No hay empleados activos.' : 'No hay registros con ese filtro.'} />
        ) : visibles.map((r) => {
          const s = situacion(r, esHoy);
          const abierto = r.marcaciones.find((m) => !m.hora_salida);
          return (
            <tr key={r.id_asistencia} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{r.empleado}</div>
                <div style={{ fontSize: 11, color: t.subtle }}>{r.identificacion}{r.rol ? ` · ${r.rol}` : ''}</div>
              </td>
              <td style={{ padding: '12px 14px' }}><Pill texto={s.texto} color={s.color} bg={s.bg} /></td>
              <td style={{ padding: '12px 14px' }}>
                {r.marcaciones.length === 0 ? (
                  <span style={{ fontSize: 12, color: t.subtle }}>{novedadDia(r) ? 'Día completo' : 'Sin horas'}</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {r.marcaciones.map((m) => {
                      const color = m.sin_salida ? DANGER : !m.hora_salida ? SUCCESS : m.tipo_salida === 'Permiso' ? WARNING : t.fg;
                      return (
                        <button key={m.id_marcacion} onClick={() => abrirTramo(m)} title="Corregir este horario"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', padding: '3px 10px', borderRadius: 999, fontSize: 12,
                            border: `1px solid ${m.sin_salida ? DANGER : t.border}`, background: m.sin_salida ? `${DANGER}12` : 'transparent', color, cursor: 'pointer', fontFamily: FONT }}>
                          <Clock size={11} />
                          <b>{hhmm(m.hora_entrada)}</b> →{' '}
                          {m.hora_salida
                            ? <><b>{hhmm(m.hora_salida)}</b>{m.tipo_salida === 'Permiso' && <span>· permiso: {m.motivo}</span>}</>
                            : m.sin_salida ? <b>sin salida</b> : <b>en el taller</b>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </td>
              <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{duracion(r.minutos_trabajados)}</td>
              <td style={{ padding: '12px 14px', fontSize: 12, color: r.observacion ? t.fg : t.subtle, maxWidth: 200 }}>
                {r.observacion ?? '—'}
                {r.registrado_por_nombre && <div style={{ fontSize: 10, color: t.subtle, marginTop: 2 }}>{r.registrado_por_nombre} · {fechaHora(r.fecha_registro)}</div>}
              </td>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <ActionCircleBtn variant="success" disabled={Boolean(abierto) || novedadDia(r)}
                    onClick={() => setEntrada({ r, hora: esHoy ? horaActual() : '' })}
                    title={abierto ? 'Ya está en el taller' : novedadDia(r) ? `Tiene ${r.estado}: quita la novedad primero` : r.marcaciones.length ? 'Registrar que volvió (entrada)' : 'Registrar entrada'}>
                    <LogIn size={14} />
                  </ActionCircleBtn>
                  <ActionCircleBtn variant="danger" disabled={!abierto}
                    onClick={() => setSalida({ r, hora: esHoy && !abierto?.sin_salida ? horaActual() : '', tipo: 'Fin de jornada', motivo: '' })}
                    title={abierto ? 'Registrar salida (fin de jornada o permiso)' : 'No tiene una entrada abierta'}>
                    <LogOut size={14} />
                  </ActionCircleBtn>
                  <ActionCircleBtn variant="gold" onClick={() => setNovedad({ r, estado: r.estado === 'Presente' ? 'Presente' : r.estado, observacion: r.observacion ?? '' })}
                    title="Novedad del día (permiso, incapacidad, vacaciones) u observación">
                    <CalendarX size={14} />
                  </ActionCircleBtn>
                </div>
              </td>
            </tr>
          );
        })}
      </TableShell>

      <Paginacion pagina={pagina} total={totalPaginas} registros={filtrados.length} porPagina={POR_PAGINA} onCambiar={setPagina} dark={dark} />

      {/* ============ ENTRADA ============ */}
      {entrada && (
        <Modal title={`Entrada — ${entrada.r.empleado}`} icon={<LogIn size={16} color={SUCCESS} />} onClose={() => setEntrada(null)}
          onSave={guardarEntrada} saveLabel="Registrar entrada" saving={procesando} dark={dark} maxWidth="420px">
          <div style={{ fontSize: 13, color: t.subtle }}>
            {entrada.r.marcaciones.length ? 'Registra la hora en que volvió al taller.' : 'Registra la hora en que llegó.'} Día: <b style={{ color: t.fg }}>{formatoFecha(dia)}</b>
          </div>
          <Field label="Hora de entrada *" dark={dark} error={errEntrada}>
            <input type="time" value={entrada.hora} autoFocus max={esHoy ? horaActual() : undefined} onChange={(e) => setEntrada({ ...entrada, hora: e.target.value })} style={estiloInput(dark, { border: `1px solid ${errEntrada ? DANGER : t.border}` })} />
          </Field>
        </Modal>
      )}

      {/* ============ SALIDA ============ */}
      {salida && (
        <Modal title={`Salida — ${salida.r.empleado}`} icon={<LogOut size={16} color={DANGER} />} onClose={() => setSalida(null)}
          onSave={guardarSalida} saveLabel="Registrar salida" saving={procesando} dark={dark} maxWidth="460px">
          <Field label="Hora de salida *" dark={dark} error={errSalida}>
            <input type="time" value={salida.hora} autoFocus max={esHoy ? horaActual() : undefined} onChange={(e) => setSalida({ ...salida, hora: e.target.value })} style={estiloInput(dark, { border: `1px solid ${errSalida ? DANGER : t.border}` })} />
          </Field>
          <Field label="Tipo de salida *" dark={dark}>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Fin de jornada', 'Permiso'] as TipoSalida[]).map((tipo) => (
                <button key={tipo} type="button" onClick={() => setSalida({ ...salida, tipo })} style={{
                  flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                  border: `1px solid ${salida.tipo === tipo ? (tipo === 'Permiso' ? WARNING : GOLD) : t.border}`,
                  background: salida.tipo === tipo ? (tipo === 'Permiso' ? WARNING_BG : `${GOLD}1F`) : 'transparent',
                  color: salida.tipo === tipo ? (tipo === 'Permiso' ? WARNING : GOLD) : t.subtle,
                }}>{tipo === 'Permiso' ? 'Permiso (vuelve después)' : 'Fin de jornada'}</button>
              ))}
            </div>
          </Field>
          {salida.tipo === 'Permiso' && (
            <Field label="Motivo del permiso *" dark={dark} error={errMotivoSalida}>
              <input value={salida.motivo} maxLength={150} placeholder="Ej. cita médica" onChange={(e) => setSalida({ ...salida, motivo: e.target.value })} style={estiloInput(dark, { border: `1px solid ${errMotivoSalida ? DANGER : t.border}` })} />
            </Field>
          )}
          <div style={{ fontSize: 12, color: t.subtle }}>
            Mientras esté fuera no se le pueden asignar tareas. Cuando vuelva, registra otra entrada con el botón verde.
          </div>
        </Modal>
      )}

      {/* ============ NOVEDAD DEL DÍA ============ */}
      {novedad && (
        <Modal title={`Novedad — ${novedad.r.empleado}`} icon={<CalendarX size={16} color={GOLD} />} onClose={() => setNovedad(null)}
          onSave={guardarNovedad} saving={procesando} dark={dark} maxWidth="460px">
          {novedad.r.marcaciones.length > 0 ? (
            <div style={{ fontSize: 12, color: WARNING, fontWeight: 600 }}>
              Ese día ya tiene horas registradas, por eso está Presente. Para marcar una novedad del día completo, elimina primero sus horarios.
            </div>
          ) : (
            <Field label="Estado del día *" dark={dark}>
              <select value={novedad.estado} onChange={(e) => setNovedad({ ...novedad, estado: e.target.value as EstadoAsistencia })} style={estiloInput(dark)}>
                {[...(NOVEDADES.includes(novedad.r.estado) ? [] : [novedad.r.estado]), ...NOVEDADES].map((e) => (
                  <option key={e} value={e}>{e === 'Permiso' ? 'Permiso (día completo)' : e}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Observación (opcional)" dark={dark}>
            <input value={novedad.observacion} maxLength={150} placeholder="Ej. incapacidad por 3 días, llegó tarde"
              onChange={(e) => setNovedad({ ...novedad, observacion: e.target.value })} style={estiloInput(dark)} />
          </Field>
        </Modal>
      )}

      {/* ============ CORREGIR UN TRAMO ============ */}
      {tramo && !borrarTramo && (
        <Modal title={`Corregir horario — ${tramo.m.empleado}`} icon={<Clock size={16} color={GOLD} />} onClose={() => setTramo(null)}
          onSave={guardarTramo} saving={procesando} dark={dark} maxWidth="480px">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
            <Field label="Entrada *" dark={dark} error={errTramoEntrada}>
              <input type="time" value={tramo.entrada} onChange={(e) => setTramo({ ...tramo, entrada: e.target.value })} style={estiloInput(dark, { border: `1px solid ${errTramoEntrada ? DANGER : t.border}` })} />
            </Field>
            <Field label="Salida" dark={dark} error={errTramoSalida ?? (tramo.m.sin_salida && !tramo.salida ? 'Este día ya pasó: ponle la hora de salida.' : null)}>
              <input type="time" value={tramo.salida} onChange={(e) => setTramo({ ...tramo, salida: e.target.value })}
                style={estiloInput(dark, { border: `1px solid ${errTramoSalida || (tramo.m.sin_salida && !tramo.salida) ? DANGER : t.border}` })} />
              {!errTramoSalida && !(tramo.m.sin_salida && !tramo.salida) && (
                <div style={{ fontSize: 11, color: t.subtle, marginTop: 4 }}>Vacía = sigue en el taller.</div>
              )}
            </Field>
          </div>
          {tramo.salida && (
            <>
              <Field label="Tipo de salida *" dark={dark}>
                <select value={tramo.tipo} onChange={(e) => setTramo({ ...tramo, tipo: e.target.value as TipoSalida })} style={estiloInput(dark)}>
                  <option value="Fin de jornada">Fin de jornada</option>
                  <option value="Permiso">Permiso (vuelve después)</option>
                </select>
              </Field>
              {tramo.tipo === 'Permiso' && (
                <Field label="Motivo del permiso *" dark={dark} error={errTramoMotivo}>
                  <input value={tramo.motivo} maxLength={150} placeholder="Ej. cita médica" onChange={(e) => setTramo({ ...tramo, motivo: e.target.value })} style={estiloInput(dark, { border: `1px solid ${errTramoMotivo ? DANGER : t.border}` })} />
                </Field>
              )}
            </>
          )}
          <button type="button" onClick={() => setBorrarTramo(tramo.m)} style={{
            justifySelf: 'start', background: 'transparent', border: `1px solid ${DANGER}`, color: DANGER, borderRadius: 8, padding: '6px 12px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT,
          }}>
            <Trash2 size={13} /> Eliminar este horario (se registró por error)
          </button>
        </Modal>
      )}

      {borrarTramo && (
        <ConfirmDialog
          titulo="¿Eliminar este horario?"
          mensaje={`Se borrará el tramo de ${borrarTramo.empleado}: ${hhmm(borrarTramo.hora_entrada)} → ${borrarTramo.hora_salida ? hhmm(borrarTramo.hora_salida) : 'sin salida'}. Si no le quedan horas ese día, quedará "No presente".`}
          confirmarLabel="Sí, eliminar"
          procesando={procesando}
          onCancel={() => setBorrarTramo(null)}
          onConfirm={eliminarTramo}
          dark={dark}
        />
      )}

      {/* ============ ENTRADA A TODOS ============ */}
      {entradaTodos && (
        <Modal title="Entrada a todos" icon={<UserCheck size={16} color={SUCCESS} />} onClose={() => setEntradaTodos(null)}
          onSave={guardarEntradaTodos} saveLabel={`Registrar ${sinLlegar} entrada(s)`} saving={procesando} dark={dark} maxWidth="440px">
          <div style={{ fontSize: 13, color: t.subtle }}>
            Se registra la entrada de los <b style={{ color: t.fg }}>{sinLlegar}</b> empleados que están "No presente" el {formatoFecha(dia)}.
            Los que tienen novedad (permiso, incapacidad, vacaciones) no se tocan. Después puedes corregir a quien llegó a otra hora.
          </div>
          <Field label="Hora de entrada *" dark={dark} error={errTodos}>
            <input type="time" value={entradaTodos.hora} autoFocus max={esHoy ? horaActual() : undefined} onChange={(e) => setEntradaTodos({ hora: e.target.value })} style={estiloInput(dark, { border: `1px solid ${errTodos ? DANGER : t.border}` })} />
          </Field>
        </Modal>
      )}
    </div>
  );
};

export default AsistenciaView;
