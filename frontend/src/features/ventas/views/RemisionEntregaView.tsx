import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText, Search, UploadCloud, Save, ArrowLeft, Pencil, CheckCircle, Receipt, FileSignature, Image as ImageIcon, X, BadgeCheck, Loader2, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { mensajeError } from '../../../shared/utils/api';
import { ACEPTA_ARCHIVOS, errorArchivo, urlArchivo } from '../../../shared/utils/archivos';
import {
  entregaService,
  type Entrega,
  type RemisionPorEntregar,
} from '../services/entregaService';

const GOLD         = "#C9A227";
const GOLD_LIGHT   = "#E6B84A";
const DANGER       = "#DC3545";
const SUCCESS      = "#28A745";
const INFO         = "#4A90E2";
const WARNING      = "#FD7E14";

interface RemisionEntregaProps {
  dark?: boolean;
}

const hoy = () => new Date().toISOString().split('T')[0];
const pesos = (n: number) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const esPdf = (url: string) => url.toLowerCase().endsWith('.pdf');

export const IdBadge: React.FC<{ id: string, color?: string }> = ({ id, color = GOLD }) => (
  <span style={{
    background: color + "1F", color: color,
    fontFamily: "monospace", fontWeight: 700, fontSize: 11,
    padding: "3px 8px", borderRadius: 6, display: "inline-flex"
  }}>
    {id}
  </span>
);

export const ActionCircleBtn: React.FC<{
  variant?: 'blue' | 'gold' | 'danger' | 'success';
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}> = ({ variant = 'gold', onClick, children, title, disabled = false }) => {
  const color = disabled ? '#9A9A9A'
    : variant === 'blue' ? INFO : variant === 'danger' ? DANGER : variant === 'success' ? SUCCESS : GOLD;

  return (
    <button
      onClick={onClick} title={title} disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent',
        border: `1.5px solid ${color}`, color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
};

export function RemisionEntregaView({ dark = false }: RemisionEntregaProps) {
  const [vistaActual, setVistaActual] = useState<'listado' | 'formulario'>('listado');
  const [registroEnEdicion, setRegistroEnEdicion] = useState<Entrega | null>(null);

  const [modalArchivo, setModalArchivo] = useState<{ url: string; titulo: string } | null>(null);
  const [paraPagar, setParaPagar] = useState<Entrega | null>(null);

  const bg = dark ? "#121212" : "#F8F9FA";
  const fg = dark ? "#F8F9FA" : "#121212";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const inputEstilo: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' };

  // ---------- Datos de la API ----------
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [porEntregar, setPorEntregar] = useState<RemisionPorEntregar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    try {
      const [lista, pendientes] = await Promise.all([entregaService.listar(), entregaService.remisionesPorEntregar()]);
      setEntregas(lista);
      setPorEntregar(pendientes);
    } catch (error) {
      toast.error(`No se pudieron cargar las entregas: ${mensajeError(error)}`);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const reemplazarEnLista = (ent: Entrega) =>
    setEntregas(prev => prev.some(e => e.id_entrega === ent.id_entrega)
      ? prev.map(e => e.id_entrega === ent.id_entrega ? ent : e)
      : [ent, ...prev]);

  // ---------- Formulario ----------
  const [busqueda, setBusqueda] = useState('');
  const [idRemision, setIdRemision] = useState('');
  const [precioTotal, setPrecioTotal] = useState<number | ''>('');
  const [fechaFinalizacion, setFechaFinalizacion] = useState(hoy());
  const [archivoFirmada, setArchivoFirmada] = useState<File | null>(null);
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);

  const remisionElegida = porEntregar.find(r => r.id_remision === idRemision);
  // Regla del taller: se entrega todo en una sola entrega
  const cantidad = registroEnEdicion ? registroEnEdicion.cantidad_entregada : (remisionElegida?.total_prendas ?? 0);

  const resetForm = () => {
    setRegistroEnEdicion(null);
    setIdRemision(''); setPrecioTotal('');
    setFechaFinalizacion(hoy());
    setArchivoFirmada(null); setArchivoComprobante(null);
  };

  const handleNuevaEntrega = () => {
    resetForm();
    setVistaActual('formulario');
  };

  const handleEditarEntrega = (entrega: Entrega) => {
    setRegistroEnEdicion(entrega);
    setIdRemision(entrega.id_remision);
    setPrecioTotal(entrega.precio_total);
    setFechaFinalizacion(entrega.fecha_finalizacion);
    setArchivoFirmada(null); setArchivoComprobante(null);
    setVistaActual('formulario');
  };

  const elegirRemision = (id: string) => {
    setIdRemision(id);
    const rem = porEntregar.find(r => r.id_remision === id);
    setPrecioTotal(rem ? rem.costo_total : '');
  };

  const elegirArchivo = (archivo: File | undefined, setter: (f: File | null) => void, mensaje: string) => {
    if (!archivo) return;
    const error = errorArchivo(archivo);
    if (error) { toast.error(error); return; }
    setter(archivo);
    toast.success(mensaje);
  };

  const handleSave = async () => {
    if (!idRemision || precioTotal === '' || Number(precioTotal) < 0 || !fechaFinalizacion) {
      toast.error('Completa los datos generales obligatorios.');
      return;
    }
    if (fechaFinalizacion > hoy()) {
      toast.error('La fecha de entrega no puede ser futura.');
      return;
    }

    setGuardando(true);
    try {
      let ent = registroEnEdicion
        ? await entregaService.actualizar(registroEnEdicion.id_entrega, { fecha_finalizacion: fechaFinalizacion, precio_total: Number(precioTotal) })
        : await entregaService.crear({ id_remision: idRemision, fecha_finalizacion: fechaFinalizacion, precio_total: Number(precioTotal) });

      // Los soportes se suben después (van como archivo, no como JSON)
      const errores: string[] = [];
      if (archivoFirmada) {
        try { ent = await entregaService.subirRemisionFirmada(ent.id_entrega, archivoFirmada); }
        catch (error) { errores.push(`remisión firmada (${mensajeError(error)})`); }
      }
      if (archivoComprobante) {
        try { ent = await entregaService.subirComprobante(ent.id_entrega, archivoComprobante); }
        catch (error) { errores.push(`comprobante (${mensajeError(error)})`); }
      }

      reemplazarEnLista(ent);
      if (!registroEnEdicion) setPorEntregar(prev => prev.filter(r => r.id_remision !== ent.id_remision));
      if (errores.length) toast.warning(`La entrega ${ent.id_entrega} se guardó, pero no se pudo subir: ${errores.join(', ')}. Edítela para intentarlo de nuevo.`);
      toast.success(registroEnEdicion
        ? `Entrega ${ent.id_entrega} actualizada.`
        : `Entrega ${ent.id_entrega} registrada. La remisión ${ent.id_remision} quedó Entregada.`);
      setVistaActual('listado');
      resetForm();
    } catch (error) {
      toast.error(mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarPago = async () => {
    if (!paraPagar) return;
    try {
      reemplazarEnLista(await entregaService.marcarPagada(paraPagar.id_entrega));
      toast.success(`Entrega ${paraPagar.id_entrega} marcada como Pagada.`);
    } catch (error) {
      toast.error(mensajeError(error));
    } finally {
      setParaPagar(null);
    }
  };

  const entregasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return entregas.filter(e =>
      e.id_entrega.toLowerCase().includes(q) ||
      e.id_remision.toLowerCase().includes(q) ||
      e.cliente.toLowerCase().includes(q));
  }, [entregas, busqueda]);

  // Lógica para seccionar los datos por página
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [busqueda]);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = entregasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(entregasFiltradas.length / itemsPerPage);

  const botonArchivo = (url: string | null, titulo: string, tipo: 'firma' | 'pago') => {
    const completa = urlArchivo(url);
    if (!completa) return <span style={{ fontSize: 11, color: subtle }}>{tipo === 'firma' ? 'No adjunta' : 'No adjunto'}</span>;
    const color = tipo === 'firma' ? INFO : GOLD;
    return (
      <button
        onClick={() => setModalArchivo({ url: completa, titulo })}
        style={{ background: `${color}15`, color, border: `1px solid ${color}40`, borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        {tipo === 'firma' ? <><FileSignature size={14} /> Ver Firma</> : <><Receipt size={14} /> Ver Pago</>}
      </button>
    );
  };

  if (vistaActual === 'listado') {
    return (
      <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Remisión de Entrega</h2>
            <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Gestiona las entregas finales, firmas y pagos del taller.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
              <input type="text" placeholder="Buscar por ID o cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ padding: '8px 12px 8px 36px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, fontSize: 13, outline: 'none', width: '220px' }} />
            </div>
            <button onClick={handleNuevaEntrega} disabled={porEntregar.length === 0} title={porEntregar.length === 0 ? 'No hay remisiones Terminadas por entregar' : ''} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '8px 16px', border: 'none', cursor: porEntregar.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(201,162,39,0.2)', opacity: porEntregar.length === 0 ? 0.5 : 1 }}>
              <CheckCircle size={16} /> Crear Entrega {porEntregar.length > 0 && `(${porEntregar.length})`}
            </button>
          </div>
        </div>

        <div style={{ borderRadius: 12, overflow: 'auto', border: `1px solid ${borderNormal}`, background: cardBg }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
                {['ID ENTREGA', 'ID REMISIÓN', 'CLIENTE', 'CANTIDAD', 'PRECIO TOTAL', 'FECHA ENTREGA', 'REM. FIRMADA', 'COMPROBANTE PAGO', 'ESTADO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 14px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: subtle }}><Loader2 size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Cargando entregas...</td></tr>
              ) : entregasFiltradas.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: subtle }}>No hay entregas registradas.</td></tr>
              ) : (
                currentItems.map(ent => {
                  const pagada = ent.estado === 'Pagada';
                  return (
                  <tr key={ent.id_entrega} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                    <td style={{ padding: '12px 14px' }}><IdBadge id={ent.id_entrega} color={GOLD} /></td>
                    <td style={{ padding: '12px 14px' }}><IdBadge id={ent.id_remision} color={INFO} /></td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600 }}>{ent.cliente}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700 }}>{ent.cantidad_entregada}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: fg }}>{pesos(ent.precio_total)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: subtle }}>{ent.fecha_finalizacion}</td>
                    <td style={{ padding: '12px 14px' }}>{botonArchivo(ent.remision_firmada_url, `Remisión firmada · ${ent.id_entrega}`, 'firma')}</td>
                    <td style={{ padding: '12px 14px' }}>{botonArchivo(ent.comprobante_pago_url, `Comprobante de pago · ${ent.id_entrega}`, 'pago')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', backgroundColor: pagada ? `${SUCCESS}20` : `${WARNING}20`, color: pagada ? SUCCESS : WARNING }}>{ent.estado}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionCircleBtn variant="gold" onClick={() => handleEditarEntrega(ent)} disabled={pagada} title={pagada ? 'Ya está pagada' : 'Editar / subir soportes'}><Pencil size={14} /></ActionCircleBtn>
                        <ActionCircleBtn variant="success" onClick={() => setParaPagar(ent)} disabled={pagada || !ent.comprobante_pago_url} title={pagada ? 'Ya está pagada' : !ent.comprobante_pago_url ? 'Suba primero el comprobante' : 'Marcar como pagada'}><BadgeCheck size={14} /></ActionCircleBtn>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px' }}>
          <span style={{ fontSize: 12, color: subtle, fontFamily: 'Montserrat, sans-serif' }}>
            Mostrando de {entregasFiltradas.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, entregasFiltradas.length)} de {entregasFiltradas.length} registros
          </span>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px', borderRadius: 6, border: `1px solid ${borderNormal}`,
                background: currentPage === 1 ? (dark ? '#1a1a1a' : '#f5f5f5') : 'transparent',
                color: currentPage === 1 ? subtle : fg,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600
              }}
            >
              Anterior
            </button>

            <span style={{ fontSize: 13, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif', padding: '0 8px' }}>
              Página {currentPage} de {totalPages || 1}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{
                padding: '6px 12px', borderRadius: 6, border: `1px solid ${borderNormal}`,
                background: (currentPage === totalPages || totalPages === 0) ? (dark ? '#1a1a1a' : '#f5f5f5') : 'transparent',
                color: (currentPage === totalPages || totalPages === 0) ? subtle : fg,
                cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600
              }}
            >
              Siguiente
            </button>
          </div>
        </div>

        {/* MODAL DE PREVISUALIZACIÓN DE ARCHIVO */}
        {modalArchivo && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: cardBg, borderRadius: 16, width: '100%', maxWidth: 700, overflow: 'hidden', border: `1px solid ${borderNormal}`, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderNormal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: fg }}>{modalArchivo.titulo}</span>
                <button onClick={() => setModalArchivo(null)} style={{ background: 'transparent', border: 'none', color: subtle, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
              </div>
              <div style={{ padding: 24, textAlign: 'center', maxHeight: '70vh', overflowY: 'auto' }}>
                {esPdf(modalArchivo.url) ? (
                  <iframe src={modalArchivo.url} title={modalArchivo.titulo} style={{ width: '100%', height: '60vh', border: `1px solid ${borderNormal}`, borderRadius: 8 }} />
                ) : (
                  <img src={modalArchivo.url} alt={modalArchivo.titulo} style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 8, objectFit: 'contain', border: `1px solid ${borderNormal}` }} />
                )}
              </div>
              <div style={{ padding: '12px 20px', borderTop: `1px solid ${borderNormal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dark ? '#181818' : '#F1F1F1' }}>
                <a href={modalArchivo.url} target="_blank" rel="noreferrer" style={{ color: INFO, fontSize: 13, fontWeight: 700 }}>Abrir en otra pestaña</a>
                <button onClick={() => setModalArchivo(null)} style={{ background: GOLD, color: '#121212', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE PAGO */}
        {paraPagar && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: cardBg, borderRadius: 16, width: '100%', maxWidth: 420, padding: 32, textAlign: 'center', border: `1px solid ${borderNormal}`, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${SUCCESS}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: SUCCESS }}>
                <BadgeCheck size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: fg, margin: '0 0 12px' }}>¿Confirmar pago de {paraPagar.id_entrega}?</h3>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 24px' }}>
                {paraPagar.cliente} · {pesos(paraPagar.precio_total)}. Después de marcarla como pagada ya no se podrá editar.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setParaPagar(null)} style={{ flex: 1, backgroundColor: inputBg, color: fg, border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={confirmarPago} style={{ flex: 1, backgroundColor: SUCCESS, color: '#FFF', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Sí, está pagada</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setVistaActual('listado')} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>
              {registroEnEdicion ? `Editar Entrega ${registroEnEdicion.id_entrega}` : 'Nueva Remisión de Entrega'}
            </h2>
            <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Registra la entrega final; la firma y el comprobante se pueden subir ahora o después.</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={guardando} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '10px 20px', border: 'none', cursor: guardando ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(201,162,39,0.2)', opacity: guardando ? 0.7 : 1 }}>
          {guardando ? <Loader2 size={18} /> : <Save size={18} />} {guardando ? 'Guardando...' : registroEnEdicion ? 'Actualizar Entrega' : 'Guardar Entrega'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        <div style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${borderNormal}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color={GOLD} /> Información de Liquidación</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>REMISIÓN ASOCIADA <span style={{ color: DANGER }}>*</span></label>
              {registroEnEdicion ? (
                <input type="text" disabled value={`${registroEnEdicion.id_remision} · ${registroEnEdicion.cliente}`} style={{ ...inputEstilo, color: subtle }} />
              ) : (
                <select value={idRemision} onChange={(e) => elegirRemision(e.target.value)} style={inputEstilo}>
                  <option value="">Selecciona una remisión Terminada...</option>
                  {porEntregar.map(r => (
                    <option key={r.id_remision} value={r.id_remision}>{r.id_remision} · {r.cliente} · {r.total_prendas} prendas</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>CANTIDAD ENTREGADA</label>
                <input type="number" value={cantidad || ''} disabled style={{ ...inputEstilo, color: subtle }} placeholder="Total de la remisión" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>PRECIO TOTAL ($) <span style={{ color: DANGER }}>*</span></label>
                <input type="number" min={0} value={precioTotal} onChange={(e) => setPrecioTotal(e.target.value === '' ? '' : Number(e.target.value))} style={inputEstilo} placeholder="Ej. 240000" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11, color: subtle, background: `${INFO}10`, padding: '8px 10px', borderRadius: 8 }}>
              <Info size={14} color={INFO} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>La remisión se entrega completa en una sola entrega. El precio sugerido es prendas × costo por prenda
                {remisionElegida && <> ({remisionElegida.total_prendas} × {pesos(remisionElegida.costo_prenda)} = <b>{pesos(remisionElegida.costo_total)}</b>)</>}.</span>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>FECHA DE ENTREGA <span style={{ color: DANGER }}>*</span></label>
              <input type="date" value={fechaFinalizacion} max={hoy()} onChange={(e) => setFechaFinalizacion(e.target.value)} style={inputEstilo} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: cardBg, borderRadius: 16, padding: 20, border: `1px solid ${borderNormal}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><FileSignature size={18} color={INFO} /> Remisión Firmada</h3>
            <div
              onClick={() => document.getElementById('firma-upload-input')?.click()}
              style={{ border: `2px dashed ${INFO}60`, borderRadius: 10, padding: 18, textAlign: 'center', backgroundColor: `${INFO}0A`, cursor: 'pointer' }}
            >
              <input
                id="firma-upload-input"
                type="file"
                onChange={(e) => { elegirArchivo(e.target.files?.[0], setArchivoFirmada, 'Remisión firmada cargada.'); e.target.value = ''; }}
                style={{ display: 'none' }}
                accept={ACEPTA_ARCHIVOS}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <UploadCloud size={26} color={INFO} />
                <span style={{ fontSize: 13, color: fg, fontWeight: 700 }}>
                  {archivoFirmada ? archivoFirmada.name : (registroEnEdicion?.remision_firmada_url ? 'Ya hay una adjunta (clic para reemplazarla)' : 'Haz clic para subir la remisión firmada (PDF o imagen, máx. 5 MB)')}
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: cardBg, borderRadius: 16, padding: 20, border: `1px solid ${borderNormal}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Receipt size={18} color={GOLD} /> Comprobante de Pago</h3>
            <div
              onClick={() => document.getElementById('pago-upload-input')?.click()}
              style={{ border: `2px dashed ${GOLD}60`, borderRadius: 10, padding: 18, textAlign: 'center', backgroundColor: `${GOLD}0A`, cursor: 'pointer' }}
            >
              <input
                id="pago-upload-input"
                type="file"
                onChange={(e) => { elegirArchivo(e.target.files?.[0], setArchivoComprobante, 'Comprobante de pago cargado.'); e.target.value = ''; }}
                style={{ display: 'none' }}
                accept={ACEPTA_ARCHIVOS}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <ImageIcon size={26} color={GOLD} />
                <span style={{ fontSize: 13, color: fg, fontWeight: 700 }}>
                  {archivoComprobante ? archivoComprobante.name : (registroEnEdicion?.comprobante_pago_url ? 'Ya hay uno adjunto (clic para reemplazarlo)' : 'Haz clic para adjuntar el comprobante (la transferencia que llega por WhatsApp)')}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: subtle, margin: '10px 0 0' }}>Con el comprobante subido podrás marcar la entrega como <b>Pagada</b> desde el listado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
