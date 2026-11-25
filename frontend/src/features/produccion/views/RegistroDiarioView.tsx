import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { registroDiarioService, type RegistroDiario } from '../services/registroDiarioService';
import { produccionService, type Produccion } from '../services/produccionService';
import { empleadoService, type Empleado } from '../../usuarios/services/empleadoService';
import { mensajeError } from '../../../shared/utils/api';
import {
  GOLD, DANGER, FONT,
  tema, estiloInput, fechaHora, coincide, useAutoRefresco,
  IdBadge, ActionCircleBtn, TableShell, FilaMensaje, Modal, Field, ModuleHeader, Paginacion, ConfirmDialog,
} from '../components/ui';

interface RegistroDiarioViewProps {
  dark?: boolean;
}

const POR_PAGINA = 8;

/**
 * Historial de reportes diarios para el administrador (HU_57): quién hizo qué, cuánto y cuándo.
 * Permite corregir la cantidad o eliminar un reporte mientras la producción esté En producción.
 * Los datos se actualizan solos (sin botón de refrescar).
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
  const [formDefectuosa, setFormDefectuosa] = useState<number | ''>('');
  const [formMotivo, setFormMotivo] = useState('');
  const [eliminar, setEliminar] = useState<RegistroDiario | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    Promise.all([empleadoService.listar(), produccionService.listar()])
      .then(([emps, prods]) => { setEmpleados(emps); setProducciones(prods); })
      .catch((e) => toast.error(mensajeError(e)));
  }, []);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      setRegistros(await registroDiarioService.listar({
        id_empleado: fEmpleado || undefined,
        id_produccion: fProduccion || undefined,
        desde: fDesde || undefined,
        hasta: fHasta || undefined,
      }));
    } catch (e) {
      if (!silencioso) toast.error(mensajeError(e));
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [fEmpleado, fProduccion, fDesde, fHasta]);

  useEffect(() => { cargar(); }, [cargar]);
  useAutoRefresco(() => {
    cargar(true);
    produccionService.listar().then(setProducciones).catch(() => undefined);
  });

  const estadoProduccion = (id: string) => producciones.find((p) => p.id_produccion === id)?.estado;
  const editable = (r: RegistroDiario) => estadoProduccion(r.id_produccion) !== 'Finalizada';

  // ---------- Editar cantidad ----------
  const abrirEditar = (r: RegistroDiario) => {
    setEditar(r);
    setFormCantidad(r.cantidad);
    setFormDefectuosa(r.cantidad_defectuosa ?? 0);
    setFormMotivo(r.motivo_defecto ?? '');
  };

  const guardarEdicion = async () => {
    if (!editar) return;
    const n = Number(formCantidad || 0);
    const d = Number(formDefectuosa || 0);
    if (!Number.isInteger(n) || !Number.isInteger(d) || n < 0 || d < 0) { toast.error('Las cantidades deben ser números enteros (0 o más).'); return; }
    if (n + d === 0) { toast.error('Ingresa la cantidad terminada o la defectuosa.'); return; }
    const motivo = d > 0 ? formMotivo.trim() || null : null;
    if (n === editar.cantidad && d === (editar.cantidad_defectuosa ?? 0) && motivo === (editar.motivo_defecto ?? null)) { setEditar(null); return; }
    setProcesando(true);
    try {
      await registroDiarioService.actualizar(editar.id_registro_diario, { cantidad: n, cantidad_defectuosa: d, motivo_defecto: motivo });
      toast.success('Registro diario actualizado.');
      setEditar(null);
      await cargar();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setProcesando(false);
    }
  };

  // Validación en tiempo real de la corrección
  const errorEdicion = editar
    ? (formCantidad === '' || formDefectuosa === '' ? 'Escribe las dos cantidades (puede ser 0).'
      : Number(formCantidad) + Number(formDefectuosa) <= 0 ? 'Debe haber al menos una unidad terminada o defectuosa.' : null)
    : null;

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

  // ---------- Búsqueda (en todas las columnas) y paginación ----------
  const filtrados = useMemo(() => registros.filter((r) => coincide(busqueda, [
    r.id_registro_diario, fechaHora(r.fecha), r.empleado, r.id_remision, r.id_produccion, r.prenda, r.talla,
    `${r.prenda} · ${r.talla}`, r.paso ?? r.proceso, r.pieza, r.maquina, r.cantidad, r.cantidad_defectuosa, r.motivo_defecto,
    estadoProduccion(r.id_produccion),
  ])), [registros, busqueda, producciones]);

  useEffect(() => { setPagina(1); }, [busqueda, fEmpleado, fProduccion, fDesde, fHasta]);

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


      <TableShell headers={['ID registro', 'Fecha y hora', 'Empleado', 'Remisión', 'Prenda / talla', 'Proceso', 'Pieza', 'Máquina', 'Cantidad terminada', 'Defectuosas', 'Acciones']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={11} dark={dark} cargando={cargando}
            texto={hayFiltros ? 'No hay reportes con esos filtros.' : 'Todavía no hay reportes diarios.'} />
        ) : visibles.map((r) => (
          <tr key={r.id_registro_diario} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={{ padding: '12px 14px' }}><IdBadge id={r.id_registro_diario} /></td>
            <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: t.subtle, whiteSpace: 'nowrap' }}>{fechaHora(r.fecha)}</td>
            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{r.empleado}</td>
            <td style={{ padding: '12px 14px' }}><IdBadge id={r.id_remision} /></td>
            <td style={{ padding: '12px 14px', fontSize: 12 }}>{r.prenda} · {r.talla}</td>
            <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600 }}>{r.paso ?? r.proceso ?? '—'}</td>
            <td style={{ padding: '12px 14px', fontSize: 12 }}>{r.pieza}</td>
            <td style={{ padding: '12px 14px', fontSize: 12, color: t.subtle }}>{r.maquina}</td>
            <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 800 }}>{r.cantidad}</td>
            <td style={{ padding: '12px 14px', fontSize: 12 }} title={r.motivo_defecto ?? ''}>
              {r.cantidad_defectuosa > 0
                ? <><b style={{ color: DANGER, fontSize: 14 }}>{r.cantidad_defectuosa}</b>{r.motivo_defecto && <div style={{ fontSize: 11, color: t.subtle, maxWidth: 160 }}>{r.motivo_defecto}</div>}</>
                : <span style={{ color: t.subtle }}>0</span>}
            </td>
            <td style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionCircleBtn variant="gold" disabled={!editable(r)} onClick={() => abrirEditar(r)}
                  title={editable(r) ? 'Corregir cantidades' : 'La producción está finalizada'}>
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
            <b style={{ color: t.fg }}>{editar.empleado}</b> — {editar.proceso ? `${editar.proceso} · ` : ''}{editar.pieza} ({editar.prenda} {editar.talla}) en {editar.maquina}<br />
            Reportado el {fechaHora(editar.fecha)}
          </div>
          <div style={{ fontSize: 12, color: t.subtle }}>Los campos con <b style={{ color: DANGER }}>*</b> son obligatorios (puede ser 0, pero no los dos).</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Cantidad terminada *" dark={dark} error={errorEdicion}>
              <input type="number" min={0} value={formCantidad} autoFocus aria-invalid={Boolean(errorEdicion)}
                onChange={(e) => setFormCantidad(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))}
                style={estiloInput(dark)} />
            </Field>
            <Field label="Defectuosas *" dark={dark}>
              <input type="number" min={0} value={formDefectuosa}
                onChange={(e) => setFormDefectuosa(e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value))))}
                style={estiloInput(dark)} />
            </Field>
          </div>
          {Number(formDefectuosa || 0) > 0 && (
            <Field label="Motivo del defecto (opcional)" dark={dark}>
              <input value={formMotivo} maxLength={200} placeholder="Ej. le faltaron 2 mm" onChange={(e) => setFormMotivo(e.target.value)} style={estiloInput(dark)} />
            </Field>
          )}
          <div style={{ fontSize: 11, color: t.subtle }}>La fecha y la hora no se modifican. Terminadas + defectuosas no pueden superar lo asignado.</div>
        </Modal>
      )}

      {eliminar && (
        <ConfirmDialog
          titulo="¿Eliminar registro diario?"
          mensaje={`Se borrará el reporte de ${eliminar.empleado}: ${eliminar.cantidad} terminadas${eliminar.cantidad_defectuosa ? ` y ${eliminar.cantidad_defectuosa} defectuosas` : ''} de ${eliminar.pieza} (${fechaHora(eliminar.fecha)}). El avance de la producción bajará.`}
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
