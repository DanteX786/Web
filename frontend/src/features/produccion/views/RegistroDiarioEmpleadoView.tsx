import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, PlayCircle, UserCheck, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { produccionService, type Asignacion } from '../services/produccionService';
import { registroDiarioService, type RegistroDiario } from '../services/registroDiarioService';
import { empleadoService, type Empleado } from '../../usuarios/services/empleadoService';
import { mensajeError } from '../../../shared/utils/api';
import { obtenerUsuario } from '../../auth/services/authService';
import {
  GOLD, SUCCESS, SUCCESS_BG, WARNING, INFO, DANGER, FONT,
  tema, estiloInput, fechaHora, useAutoRefresco,
  IdBadge, Pill, TableShell, FilaMensaje, Kpi, BarraAvance, ConfirmDialog, ActionCircleBtn,
} from '../components/ui';

interface RegistroDiarioEmpleadoViewProps {
  dark?: boolean;
}

const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const desplazar = (dias: number) => { const d = new Date(); d.setDate(d.getDate() + dias); return isoLocal(d); };
/** La BD guarda la hora en UTC: se pide de ayer a mañana y aquí se filtra el día local. */
const esDeHoy = (iso: string) => isoLocal(new Date(iso)) === isoLocal(new Date());

/** Lo que el operario escribió en una fila y todavía no envió. */
interface Borrador {
  terminadas: number | '';
  defectuosas: number | '';
  motivo: string;
}
const BORRADOR_VACIO: Borrador = { terminadas: '', defectuosas: '', motivo: '' };

const num = (v: number | '') => (v === '' ? 0 : Number(v));
const tieneDatos = (b?: Borrador) => Boolean(b) && (num(b!.terminadas) > 0 || num(b!.defectuosas) > 0);

/** Problema de una fila, o null si se puede enviar. */
const problemaFila = (tarea: Asignacion, b: Borrador): string | null => {
  const total = num(b.terminadas) + num(b.defectuosas);
  if (total <= 0) return 'Escribe la cantidad terminada o la defectuosa.';
  if (total > tarea.cantidad_pendiente) {
    return `Solo quedan ${tarea.cantidad_pendiente} unidades pendientes en esta tarea (terminadas + defectuosas).`;
  }
  return null;
};

/**
 * Vista del operario: ve sus tareas de las producciones En producción y reporta, fila por fila,
 * cuántas unidades terminó y cuántas salieron defectuosas (HU_55, HU_56).
 * Cada fila se envía con su botón ✓. Si escribe una cantidad y sale de la fila sin enviarla,
 * se le pregunta si la quiere enviar: así no queda información sin registrar.
 * La fecha y la hora las pone la base de datos; cada envío es un registro aparte.
 */
export const RegistroDiarioEmpleadoView: React.FC<RegistroDiarioEmpleadoViewProps> = ({ dark = false }) => {
  const t = tema(dark);

  // El operario ve SUS tareas (sale de la sesión). El administrador puede elegir a cualquier operario.
  const usuario = obtenerUsuario();
  const esAdmin = usuario?.rol === 'Administrador';
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [idEmpleado, setIdEmpleado] = useState<string>(() => (esAdmin ? '' : usuario?.id ?? ''));

  const [tareas, setTareas] = useState<Asignacion[]>([]);
  const [registrosHoy, setRegistrosHoy] = useState<RegistroDiario[]>([]);
  const [borradores, setBorradores] = useState<Record<string, Borrador>>({});
  const [cargando, setCargando] = useState(false);
  /** porSalir = se abrió porque salió de la fila sin enviar (al cancelar se borra lo escrito). */
  const [confirmar, setConfirmar] = useState<{ tarea: Asignacion; porSalir: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const confirmarRef = useRef(confirmar);
  confirmarRef.current = confirmar;

  useEffect(() => {
    if (!esAdmin) return;
    empleadoService.listar('Activo')
      .then((lista) => {
        setEmpleados(lista);
        if (lista.length) setIdEmpleado((actual) => actual || (lista.find((e) => e.rol !== 'Administrador')?.id ?? lista[0].id));
      })
      .catch((e) => toast.error(mensajeError(e)));
  }, [esAdmin]);

  // silencioso = actualización automática: no muestra "Cargando" ni borra lo que el operario está escribiendo
  const cargar = useCallback(async (silencioso = false) => {
    if (!idEmpleado) return;
    if (!silencioso) setCargando(true);
    try {
      const [asig, regs] = await Promise.all([
        produccionService.listarAsignaciones({ id_empleado: idEmpleado, solo_en_produccion: true }),
        registroDiarioService.listar({ id_empleado: idEmpleado, desde: desplazar(-1), hasta: desplazar(1) }),
      ]);
      setTareas(asig);
      setRegistrosHoy(regs.filter((r) => esDeHoy(r.fecha)));
      if (!silencioso) setBorradores({});
    } catch (e) {
      if (!silencioso) toast.error(mensajeError(e));
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [idEmpleado]);

  useEffect(() => { cargar(); }, [cargar]);
  useAutoRefresco(() => cargar(true));

  // Si intenta cerrar o recargar la pestaña con cantidades sin enviar, el navegador avisa
  const hayPendientes = Object.values(borradores).some(tieneDatos);
  useEffect(() => {
    if (!hayPendientes) return;
    const avisar = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [hayPendientes]);

  const borradorDe = (id: string) => borradores[id] ?? BORRADOR_VACIO;

  const cambiar = (tarea: Asignacion, campo: keyof Borrador, valor: string) => {
    const id = tarea.id_detalle_de_produccion;
    let nuevo: number | '' | string = valor;
    if (campo !== 'motivo') {
      if (valor === '') nuevo = '';
      else {
        const n = Math.floor(Number(valor));
        if (Number.isNaN(n) || n < 0) return;
        nuevo = n;
      }
    }
    setBorradores((b) => ({ ...b, [id]: { ...(b[id] ?? BORRADOR_VACIO), [campo]: nuevo } }));
  };

  const limpiarFila = (id: string) => setBorradores((b) => {
    const copia = { ...b };
    delete copia[id];
    return copia;
  });

  /** Botón ✓ de la fila. */
  const pedirEnvio = (tarea: Asignacion) => {
    const b = borradorDe(tarea.id_detalle_de_produccion);
    const problema = problemaFila(tarea, b);
    if (problema) { toast.error(problema); return; }
    setConfirmar({ tarea, porSalir: false });
  };

  /**
   * Salió de la fila (clic afuera, otra fila, otra ventana) dejando una cantidad escrita:
   * se pregunta si la quiere enviar para que no quede información sin registrar.
   */
  const alSalirDeFila = (tarea: Asignacion, e: React.FocusEvent<HTMLTableRowElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;   // sigue dentro de la misma fila
    if (confirmarRef.current || enviando) return;
    const b = borradores[tarea.id_detalle_de_produccion];
    if (!tieneDatos(b)) return;
    const problema = problemaFila(tarea, b!);
    if (problema) { toast.warning(`${tarea.paso ?? tarea.pieza}: ${problema}`); return; }
    setConfirmar({ tarea, porSalir: true });
  };

  const cancelar = () => {
    if (confirmar?.porSalir) {
      limpiarFila(confirmar.tarea.id_detalle_de_produccion);
      toast.info('No se envió: se borró la cantidad escrita.');
    }
    setConfirmar(null);
  };

  const enviar = async () => {
    if (!confirmar) return;
    const { tarea } = confirmar;
    const b = borradorDe(tarea.id_detalle_de_produccion);
    setEnviando(true);
    try {
      await registroDiarioService.registrar(tarea.id_detalle_de_produccion, {
        cantidad: num(b.terminadas),
        cantidad_defectuosa: num(b.defectuosas),
        motivo_defecto: num(b.defectuosas) > 0 ? (b.motivo.trim() || null) : null,
      });
      toast.success(`Reporte enviado: ${num(b.terminadas)} terminadas${num(b.defectuosas) ? ` y ${num(b.defectuosas)} defectuosas` : ''}.`);
      limpiarFila(tarea.id_detalle_de_produccion);
      setConfirmar(null);
      await cargar(true);
    } catch (e) {
      toast.error(mensajeError(e), { duration: 8000 });
    } finally {
      setEnviando(false);
    }
  };

  const nombreOperario = esAdmin ? empleados.find((e) => e.id === idEmpleado)?.nombre : usuario?.nombre;
  const totalHoy = registrosHoy.reduce((s, r) => s + r.cantidad, 0);
  const defectuosasHoy = registrosHoy.reduce((s, r) => s + (r.cantidad_defectuosa ?? 0), 0);
  const totalPendiente = tareas.reduce((s, x) => s + x.cantidad_pendiente, 0);
  const confirmando = confirmar ? borradorDe(confirmar.tarea.id_detalle_de_produccion) : null;
  const celda: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'top' };

  const filas = tareas;

  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: GOLD }}>Mis tareas asignadas — Producción</h2>
          <p style={{ fontSize: 13, color: t.subtle, margin: 0 }}>
            Escribe la cantidad terminada (y las defectuosas, si hubo) y envíala con el botón <b>✓</b> de la fila.
            Puedes enviar varias veces en el día: cada envío queda con su fecha y hora.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserCheck size={16} color={GOLD} />
          {esAdmin ? (
            <select value={idEmpleado} onChange={(e) => setIdEmpleado(e.target.value)} title="Como administrador puedes ver y reportar por cualquier operario"
              style={estiloInput(dark, { width: 220, padding: '8px 10px' })}>
              {empleados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700 }}>{usuario?.nombre}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Kpi label="Tareas activas" valor={tareas.length} color={INFO} dark={dark} />
        <Kpi label="Terminadas hoy" valor={totalHoy} color={SUCCESS} dark={dark} nota="unidades" />
        <Kpi label="Defectuosas hoy" valor={defectuosasHoy} color={DANGER} dark={dark} nota="piezas" />
        <Kpi label="Pendiente por hacer" valor={totalPendiente} color={WARNING} dark={dark} nota="unidades" />
      </div>

      <div style={{ fontSize: 12, color: t.subtle, marginBottom: 8 }}>
        <b style={{ color: DANGER }}>*</b> Escribe la cantidad terminada o la defectuosa (al menos una) y envíala con el ✓.
      </div>
      <TableShell headers={['Tarea', 'Remisión', 'Prenda / talla', 'Proceso', 'Pieza', 'Máquina', 'Avance', 'Pendiente', 'Cantidad terminada *', 'Defectuosas *', 'Acciones']} dark={dark}>
        {cargando || filas.length === 0 ? (
          <FilaMensaje colSpan={11} dark={dark} cargando={cargando}
            texto={`${nombreOperario ?? 'Este empleado'} no tiene tareas en producciones iniciadas.`} />
        ) : filas.map((tarea) => {
          const id = tarea.id_detalle_de_produccion;
          const b = borradorDe(id);
          const total = num(b.terminadas) + num(b.defectuosas);
          const excede = total > tarea.cantidad_pendiente;
          const terminada = tarea.cantidad_pendiente === 0;
          const reportado = tarea.cantidad_realizada + tarea.cantidad_defectuosa;
          const porcentaje = tarea.cantidad_asignada ? (reportado / tarea.cantidad_asignada) * 100 : 0;
          const borde = `1px solid ${excede ? DANGER : t.border}`;
          return (
            <tr key={id} onBlur={(e) => alSalirDeFila(tarea, e)}
              style={{ borderBottom: `1px solid ${t.border}`, background: tieneDatos(b) ? `${GOLD}0D` : undefined }}>
              <td style={celda}><IdBadge id={id} /></td>
              <td style={celda}><IdBadge id={tarea.id_remision} /></td>
              <td style={{ ...celda, fontSize: 12 }}>{tarea.prenda} · {tarea.talla}</td>
              <td style={{ ...celda, fontSize: 13, fontWeight: 700 }}>{tarea.paso ?? tarea.proceso ?? '—'}</td>
              <td style={{ ...celda, fontSize: 13, fontWeight: 600 }}>{tarea.pieza}</td>
              <td style={{ ...celda, fontSize: 12, color: t.subtle }}>{tarea.maquina}</td>
              <td style={celda}>
                <BarraAvance porcentaje={porcentaje} dark={dark} />
                <div style={{ fontSize: 10, color: t.subtle, marginTop: 2 }}>
                  {tarea.cantidad_realizada} terminadas{tarea.cantidad_defectuosa ? ` + ${tarea.cantidad_defectuosa} def.` : ''} de {tarea.cantidad_asignada}
                </div>
              </td>
              <td style={{ ...celda, fontSize: 13, fontWeight: 700, color: terminada ? SUCCESS : WARNING }}>{tarea.cantidad_pendiente}</td>
              {terminada ? (
                <td colSpan={3} style={celda}><Pill texto="Completada" color={SUCCESS} bg={SUCCESS_BG} /></td>
              ) : (
                <>
                  <td style={celda}>
                    <input type="number" min={0} max={tarea.cantidad_pendiente} placeholder={`Máx. ${tarea.cantidad_pendiente}`}
                      value={b.terminadas} onChange={(e) => cambiar(tarea, 'terminadas', e.target.value)}
                      style={estiloInput(dark, { width: 110, padding: '8px 10px', border: borde })} />
                    {excede && (
                      <div style={{ fontSize: 11, color: DANGER, fontWeight: 600, marginTop: 4, maxWidth: 160 }}>
                        Supera lo pendiente ({tarea.cantidad_pendiente}).
                      </div>
                    )}
                  </td>
                  <td style={celda}>
                    <input type="number" min={0} max={tarea.cantidad_pendiente} placeholder="0"
                      value={b.defectuosas} onChange={(e) => cambiar(tarea, 'defectuosas', e.target.value)}
                      title="Piezas que salieron mal y no se pueden terminar"
                      style={estiloInput(dark, { width: 80, padding: '8px 10px', border: num(b.defectuosas) > 0 ? `1px solid ${DANGER}` : borde })} />
                    {num(b.defectuosas) > 0 && (
                      <input value={b.motivo} maxLength={200} placeholder="Motivo (ej. faltaron 2 mm)"
                        onChange={(e) => cambiar(tarea, 'motivo', e.target.value)}
                        style={estiloInput(dark, { width: 180, padding: '6px 10px', fontSize: 12, marginTop: 6 })} />
                    )}
                  </td>
                  <td style={celda}>
                    <ActionCircleBtn variant="success" disabled={total <= 0 || excede} onClick={() => pedirEnvio(tarea)}
                      title={excede ? 'Supera lo pendiente' : total <= 0 ? 'Escribe una cantidad' : 'Enviar este reporte'}>
                      <Check size={15} />
                    </ActionCircleBtn>
                  </td>
                </>
              )}
            </tr>
          );
        })}
      </TableShell>

      <h3 style={{ fontSize: 14, fontWeight: 700, margin: '28px 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ClipboardCheck size={16} color={GOLD} /> Lo que reportaste hoy
      </h3>
      <TableShell headers={['Registro', 'Fecha y hora', 'Prenda / talla', 'Proceso', 'Pieza', 'Máquina', 'Cantidad terminada', 'Defectuosas']} dark={dark}>
        {registrosHoy.length === 0 ? (
          <FilaMensaje colSpan={8} dark={dark} texto="Aún no has enviado reportes hoy." />
        ) : registrosHoy.map((r) => (
          <tr key={r.id_registro_diario} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '10px 14px' }}><IdBadge id={r.id_registro_diario} /></td>
            <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: t.subtle }}>{fechaHora(r.fecha)}</td>
            <td style={{ padding: '10px 14px', fontSize: 12 }}>{r.prenda} · {r.talla}</td>
            <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600 }}>{r.paso ?? r.proceso ?? '—'}</td>
            <td style={{ padding: '10px 14px', fontSize: 12 }}>{r.pieza}</td>
            <td style={{ padding: '10px 14px', fontSize: 12, color: t.subtle }}>{r.maquina}</td>
            <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700 }}>{r.cantidad}</td>
            <td style={{ padding: '10px 14px', fontSize: 12 }}>
              {r.cantidad_defectuosa > 0
                ? <span style={{ color: DANGER, fontWeight: 700 }}>{r.cantidad_defectuosa}{r.motivo_defecto ? <span style={{ fontWeight: 400, color: t.subtle }}> · {r.motivo_defecto}</span> : null}</span>
                : <span style={{ color: t.subtle }}>0</span>}
            </td>
          </tr>
        ))}
      </TableShell>

      {/* Confirmación antes de enviar (CA_56_01): con el ✓ o al salir de la fila sin enviar */}
      {confirmar && confirmando && (
        <ConfirmDialog
          titulo={confirmar.porSalir ? '¿Enviar la cantidad que escribiste?' : '¿Enviar este reporte?'}
          mensaje={confirmar.porSalir
            ? 'Escribiste una cantidad y saliste sin enviarla. Si no la envías, se borra para que no quede sin registrar.'
            : 'Verifica las cantidades. La fecha y la hora se guardan automáticamente.'}
          confirmarLabel="Sí, enviar"
          variante="success"
          icono={confirmar.porSalir ? <AlertTriangle size={28} color={SUCCESS} /> : <PlayCircle size={28} color={SUCCESS} />}
          procesando={enviando}
          onCancel={cancelar}
          onConfirm={enviar}
          dark={dark}
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, fontSize: 13 }}>
            <div style={{ padding: '6px 10px', borderRadius: 8, background: t.inputBg }}>
              {confirmar.tarea.paso ?? confirmar.tarea.proceso ?? ''} · {confirmar.tarea.pieza} · {confirmar.tarea.prenda} {confirmar.tarea.talla}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: t.inputBg }}>
              <span>Cantidad terminada</span><b>{num(confirmando.terminadas)} und</b>
            </div>
            {num(confirmando.defectuosas) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: t.inputBg, color: DANGER }}>
                <span>Defectuosas{confirmando.motivo.trim() ? ` (${confirmando.motivo.trim()})` : ''}</span><b>{num(confirmando.defectuosas)} und</b>
              </div>
            )}
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
};

export default RegistroDiarioEmpleadoView;
