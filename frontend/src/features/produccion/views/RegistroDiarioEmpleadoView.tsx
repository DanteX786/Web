import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Send, PlayCircle, RefreshCw, UserCheck, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

import { produccionService, type Asignacion } from '../services/produccionService';
import { registroDiarioService, type RegistroDiario } from '../services/registroDiarioService';
import { empleadoService, type Empleado } from '../../usuarios/services/empleadoService';
import { mensajeError } from '../../../shared/utils/api';
import { obtenerUsuario } from '../../auth/services/authService';
import {
  GOLD, SUCCESS, SUCCESS_BG, WARNING, INFO, FONT,
  tema, estiloInput, fechaHora,
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

/**
 * Vista del operario: ve sus tareas de la producción en curso y reporta lo que
 * confeccionó en el día (HU_55, HU_56). La fecha y hora las pone la base de datos.
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
  const [cantidades, setCantidades] = useState<Record<string, number | ''>>({});
  const [cargando, setCargando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!esAdmin) return;
    empleadoService.listar('Activo')
      .then((lista) => {
        setEmpleados(lista);
        if (lista.length) setIdEmpleado((actual) => actual || (lista.find((e) => e.rol !== 'Administrador')?.id ?? lista[0].id));
      })
      .catch((e) => toast.error(mensajeError(e)));
  }, [esAdmin]);

  const cargar = useCallback(async () => {
    if (!idEmpleado) return;
    setCargando(true);
    try {
      const [asig, regs] = await Promise.all([
        produccionService.listarAsignaciones({ id_empleado: idEmpleado, solo_en_proceso: true }),
        registroDiarioService.listar({ id_empleado: idEmpleado, desde: desplazar(-1), hasta: desplazar(1) }),
      ]);
      setTareas(asig);
      setRegistrosHoy(regs.filter((r) => esDeHoy(r.fecha)));
      setCantidades({});
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [idEmpleado]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarCantidad = (tarea: Asignacion, valor: string) => {
    if (valor === '') { setCantidades({ ...cantidades, [tarea.id_detalle_de_produccion]: '' }); return; }
    const n = Math.floor(Number(valor));
    if (Number.isNaN(n) || n < 0) return;
    if (n > tarea.cantidad_pendiente) toast.warning(`Solo te quedan ${tarea.cantidad_pendiente} unidades pendientes en esta tarea.`);
    setCantidades({ ...cantidades, [tarea.id_detalle_de_produccion]: n });
  };

  /** Lo que se va a enviar: solo tareas con cantidad > 0. */
  const porEnviar = useMemo(
    () => tareas
      .map((tarea) => ({ tarea, cantidad: Number(cantidades[tarea.id_detalle_de_produccion] || 0) }))
      .filter((x) => x.cantidad > 0),
    [tareas, cantidades],
  );
  const conError = porEnviar.filter((x) => x.cantidad > x.tarea.cantidad_pendiente);

  const abrirConfirmacion = () => {
    if (porEnviar.length === 0) { toast.error('Ingresa la cantidad confeccionada en al menos una tarea.'); return; }
    if (conError.length) { toast.error('Hay cantidades mayores a lo pendiente. Corrígelas antes de enviar.'); return; }
    setConfirmar(true);
  };

  const enviar = async () => {
    setEnviando(true);
    let ok = 0;
    for (const { tarea, cantidad } of porEnviar) {
      try {
        await registroDiarioService.registrar(tarea.id_detalle_de_produccion, cantidad);
        ok++;
      } catch (e) {
        toast.error(`${tarea.pieza} (${tarea.prenda} ${tarea.talla}): ${mensajeError(e)}`, { duration: 8000 });
      }
    }
    if (ok) toast.success(`Registro diario enviado: ${ok} tarea(s) reportada(s).`);
    setEnviando(false);
    setConfirmar(false);
    await cargar();
  };

  const nombreOperario = esAdmin ? empleados.find((e) => e.id === idEmpleado)?.nombre : usuario?.nombre;
  const totalHoy = registrosHoy.reduce((s, r) => s + r.cantidad, 0);
  const totalPendiente = tareas.reduce((s, x) => s + x.cantidad_pendiente, 0);

  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: GOLD }}>Mis tareas asignadas — Producción</h2>
          <p style={{ fontSize: 13, color: t.subtle, margin: 0 }}>
            Tus tareas se cargan solas. Escribe cuántas unidades hiciste hoy y envía el registro.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
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
          <ActionCircleBtn variant="blue" onClick={cargar} title="Actualizar"><RefreshCw size={14} /></ActionCircleBtn>
          <button onClick={abrirConfirmacion} disabled={tareas.length === 0} style={{
            background: `linear-gradient(135deg, ${SUCCESS}, #218838)`, color: '#FFF', fontWeight: 700, fontSize: 14, borderRadius: 10,
            padding: '10px 20px', border: 'none', cursor: tareas.length ? 'pointer' : 'not-allowed', opacity: tareas.length ? 1 : 0.5,
            display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT,
          }}>
            <Send size={16} /> Enviar registro diario
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Kpi label="Tareas activas" valor={tareas.length} color={INFO} dark={dark} />
        <Kpi label="Reportado hoy" valor={totalHoy} color={SUCCESS} dark={dark} nota="unidades" />
        <Kpi label="Pendiente por hacer" valor={totalPendiente} color={WARNING} dark={dark} nota="unidades" />
      </div>

      <TableShell headers={['Tarea', 'Remisión', 'Prenda / talla', 'Pieza', 'Máquina', 'Avance', 'Pendiente', 'Cantidad hoy']} dark={dark}>
        {cargando || tareas.length === 0 ? (
          <FilaMensaje colSpan={8} dark={dark} cargando={cargando}
            texto={`${nombreOperario ?? 'Este empleado'} no tiene tareas en la producción en curso.`} />
        ) : tareas.map((tarea) => {
          const valor = cantidades[tarea.id_detalle_de_produccion] ?? '';
          const excede = valor !== '' && Number(valor) > tarea.cantidad_pendiente;
          const terminada = tarea.cantidad_pendiente === 0;
          const porcentaje = tarea.cantidad_asignada ? (tarea.cantidad_realizada / tarea.cantidad_asignada) * 100 : 0;
          return (
            <tr key={tarea.id_detalle_de_produccion} style={{ borderBottom: `1px solid ${t.border}` }}>
              <td style={{ padding: '12px 14px' }}><IdBadge id={tarea.id_detalle_de_produccion} /></td>
              <td style={{ padding: '12px 14px' }}><IdBadge id={tarea.id_remision} /></td>
              <td style={{ padding: '12px 14px', fontSize: 12 }}>{tarea.prenda} · {tarea.talla}</td>
              <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{tarea.pieza}</td>
              <td style={{ padding: '12px 14px', fontSize: 12, color: t.subtle }}>{tarea.maquina}</td>
              <td style={{ padding: '12px 14px' }}>
                <BarraAvance porcentaje={porcentaje} dark={dark} />
                <div style={{ fontSize: 10, color: t.subtle, marginTop: 2 }}>{tarea.cantidad_realizada} de {tarea.cantidad_asignada}</div>
              </td>
              <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: terminada ? SUCCESS : WARNING }}>{tarea.cantidad_pendiente}</td>
              <td style={{ padding: '12px 14px' }}>
                {terminada ? (
                  <Pill texto="Completada" color={SUCCESS} bg={SUCCESS_BG} />
                ) : (
                  <input type="number" min={0} max={tarea.cantidad_pendiente} placeholder={`Máx. ${tarea.cantidad_pendiente}`} value={valor}
                    onChange={(e) => cambiarCantidad(tarea, e.target.value)}
                    style={estiloInput(dark, { width: 110, padding: '8px 10px', border: `1px solid ${excede ? '#DC3545' : t.border}` })} />
                )}
              </td>
            </tr>
          );
        })}
      </TableShell>

      <h3 style={{ fontSize: 14, fontWeight: 700, margin: '28px 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ClipboardCheck size={16} color={GOLD} /> Lo que reportaste hoy
      </h3>
      <TableShell headers={['Registro', 'Hora', 'Prenda / talla', 'Pieza', 'Máquina', 'Cantidad']} dark={dark}>
        {registrosHoy.length === 0 ? (
          <FilaMensaje colSpan={6} dark={dark} texto="Aún no has enviado reportes hoy." />
        ) : registrosHoy.map((r) => (
          <tr key={r.id_registro_diario} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '10px 14px' }}><IdBadge id={r.id_registro_diario} /></td>
            <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', color: t.subtle }}>{fechaHora(r.fecha)}</td>
            <td style={{ padding: '10px 14px', fontSize: 12 }}>{r.prenda} · {r.talla}</td>
            <td style={{ padding: '10px 14px', fontSize: 12 }}>{r.pieza}</td>
            <td style={{ padding: '10px 14px', fontSize: 12, color: t.subtle }}>{r.maquina}</td>
            <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700 }}>{r.cantidad}</td>
          </tr>
        ))}
      </TableShell>

      {/* CA_56_01: pantalla para verificar los números antes del envío */}
      {confirmar && (
        <ConfirmDialog
          titulo="¿Enviar tu registro de hoy?"
          mensaje="Verifica las cantidades. La fecha y la hora se guardan automáticamente."
          confirmarLabel="Sí, enviar"
          variante="success"
          icono={<PlayCircle size={28} color={SUCCESS} />}
          procesando={enviando}
          onCancel={() => setConfirmar(false)}
          onConfirm={enviar}
          dark={dark}
        >
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {porEnviar.map(({ tarea, cantidad }) => (
              <div key={tarea.id_detalle_de_produccion} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 10px', borderRadius: 8, background: t.inputBg }}>
                <span>{tarea.pieza} · {tarea.prenda} {tarea.talla}</span>
                <b>{cantidad} und</b>
              </div>
            ))}
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
};

export default RegistroDiarioEmpleadoView;
