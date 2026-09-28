import React, { useState } from 'react';
import { 
  FileText, Search, Plus, Trash2, UploadCloud, Save, ArrowLeft, Pencil, CheckCircle, Receipt, FileSignature, Image as ImageIcon, Eye, X, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const GOLD         = "#C9A227";
const GOLD_LIGHT   = "#E6B84A";
const DANGER       = "#DC3545";
const SUCCESS      = "#28A745";
const INFO         = "#4A90E2";

interface RemisionEntregaProps {
  dark?: boolean;
}

interface RemisionEntregaItem {
  id: string; 
  idRemision: string; 
  precioTotal: number;
  cantidad: number;
  fechaFinalizacion: string;
  comprobanteNombre?: string;
  comprobanteUrl?: string;
  remFirmadaNombre?: string;
  remFirmadaUrl?: string;
}

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
  variant?: 'blue' | 'gold' | 'danger';
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}> = ({ variant = 'gold', onClick, children, title }) => {
  let borderColor = variant === 'blue' ? INFO : variant === 'danger' ? DANGER : GOLD;
  let iconColor = variant === 'blue' ? INFO : variant === 'danger' ? DANGER : GOLD;

  return (
    <button
      onClick={onClick} title={title}
      style={{
        width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent', 
        border: `1.5px solid ${borderColor}`, color: iconColor, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
};

export function RemisionEntregaView({ dark = false }: RemisionEntregaProps) {
  const [vistaActual, setVistaActual] = useState<'listado' | 'formulario'>('listado');
  const [registroEnEdicion, setRegistroEnEdicion] = useState<string | null>(null);
  
  const [modalArchivo, setModalArchivo] = useState<{ url: string; titulo: string } | null>(null);
  const [idParaEliminar, setIdParaEliminar] = useState<string | null>(null);
  
  const bg = dark ? "#121212" : "#F8F9FA";
  const fg = dark ? "#F8F9FA" : "#121212";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";

  const [entregas, setEntregas] = useState<RemisionEntregaItem[]>([
    { 
      id: 'REMENT-001', idRemision: 'REM-001', precioTotal: 240000, cantidad: 250, fechaFinalizacion: '2026-10-02',
      comprobanteNombre: 'comprobante_pago_01.jpg', comprobanteUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      remFirmadaNombre: 'remision_firmada_01.jpg', remFirmadaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'
    },
    { 
      id: 'REMENT-002', idRemision: 'REM-003', precioTotal: 300000, cantidad: 50, fechaFinalizacion: '2026-09-28',
      comprobanteNombre: 'transferencia_bancaria.png', comprobanteUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      remFirmadaNombre: 'remision_firmada_03.png', remFirmadaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'
    }
  ]);

  const [busqueda, setBusqueda] = useState('');

  const [idRemision, setIdRemision] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [precioTotal, setPrecioTotal] = useState<number | ''>('');
  const [fechaFinalizacion, setFechaFinalizacion] = useState(new Date().toISOString().split('T')[0]);
  
  const [archivoFirmada, setArchivoFirmada] = useState<File | null>(null);
  const [nombreFirmadaExistente, setNombreFirmadaExistente] = useState('');
  const [urlFirmadaExistente, setUrlFirmadaExistente] = useState('');

  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);
  const [nombreComprobanteExistente, setNombreComprobanteExistente] = useState('');
  const [urlComprobanteExistente, setUrlComprobanteExistente] = useState('');

  const resetForm = () => {
    setRegistroEnEdicion(null);
    setIdRemision(''); setCantidad(''); setPrecioTotal('');
    setFechaFinalizacion(new Date().toISOString().split('T')[0]);
    setArchivoFirmada(null); setNombreFirmadaExistente(''); setUrlFirmadaExistente('');
    setArchivoComprobante(null); setNombreComprobanteExistente(''); setUrlComprobanteExistente('');
  };

  const handleNuevaEntrega = () => {
    resetForm();
    setVistaActual('formulario');
  };

  const handleEditarEntrega = (entrega: RemisionEntregaItem) => {
    setRegistroEnEdicion(entrega.id);
    setIdRemision(entrega.idRemision);
    setCantidad(entrega.cantidad);
    setPrecioTotal(entrega.precioTotal);
    setFechaFinalizacion(entrega.fechaFinalizacion);
    
    setNombreFirmadaExistente(entrega.remFirmadaNombre || '');
    setUrlFirmadaExistente(entrega.remFirmadaUrl || '');
    setArchivoFirmada(null);

    setNombreComprobanteExistente(entrega.comprobanteNombre || '');
    setUrlComprobanteExistente(entrega.comprobanteUrl || '');
    setArchivoComprobante(null);

    setVistaActual('formulario');
  };

  const handleSave = () => {
    if (!idRemision || !cantidad || !precioTotal || !fechaFinalizacion) {
      toast.error('Completa los datos generales obligatorios.');
      return;
    }
    if (!archivoFirmada && !nombreFirmadaExistente) {
      toast.error('Debes adjuntar la Remisión Firmada.');
      return;
    }
    if (!archivoComprobante && !nombreComprobanteExistente) {
      toast.error('Debes adjuntar el Comprobante de Pago.');
      return;
    }

    const nameFirmada = archivoFirmada ? archivoFirmada.name : nombreFirmadaExistente;
    const urlFirmada = archivoFirmada ? URL.createObjectURL(archivoFirmada) : urlFirmadaExistente;

    const nameComprobante = archivoComprobante ? archivoComprobante.name : nombreComprobanteExistente;
    const urlComprobante = archivoComprobante ? URL.createObjectURL(archivoComprobante) : urlComprobanteExistente;

    const nuevaEntrega: RemisionEntregaItem = {
      id: registroEnEdicion ? registroEnEdicion : `REMENT-00${entregas.length + 1}`,
      idRemision,
      cantidad: Number(cantidad),
      precioTotal: Number(precioTotal),
      fechaFinalizacion,
      remFirmadaNombre: nameFirmada,
      remFirmadaUrl: urlFirmada,
      comprobanteNombre: nameComprobante,
      comprobanteUrl: urlComprobante
    };

    if (registroEnEdicion) {
      setEntregas(entregas.map(e => e.id === registroEnEdicion ? nuevaEntrega : e));
      toast.success('Remisión de Entrega actualizada.');
    } else {
      setEntregas([...entregas, nuevaEntrega]);
      toast.success('Remisión de Entrega creada exitosamente.');
    }
    setVistaActual('listado');
    resetForm();
  };

  const confirmarEliminacion = () => {
    if (idParaEliminar) {
      setEntregas(entregas.filter(e => e.id !== idParaEliminar));
      toast.success('Remisión de Entrega eliminada.');
      setIdParaEliminar(null);
    }
  };

  const entregasFiltradas = entregas.filter(e => 
    e.id.toLowerCase().includes(busqueda.toLowerCase()) || 
    e.idRemision.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (vistaActual === 'listado') {
    return (
      <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Remisión de Entrega</h2>
            <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Gestiona las entregas finales, firmas y pagos del taller.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
              <input type="text" placeholder="Buscar por ID..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ padding: '8px 12px 8px 36px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, fontSize: 13, outline: 'none', width: '220px' }} />
            </div>
            <button onClick={handleNuevaEntrega} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '8px 16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(201,162,39,0.2)' }}>
              <CheckCircle size={16} /> Crear Entrega
            </button>
          </div>
        </div>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${borderNormal}`, background: cardBg }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
                {['ID ENTREGA', 'ID REMISIÓN', 'CANTIDAD', 'PRECIO TOTAL', 'FECHA FINALIZACIÓN', 'REM. FIRMADA', 'COMPROBANTE PAGO', 'ACCIONES'].map(h => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 14px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entregasFiltradas.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: subtle }}>No hay entregas registradas.</td></tr>
              ) : (
                entregasFiltradas.map(ent => (
                  <tr key={ent.id} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                    <td style={{ padding: '12px 14px' }}><IdBadge id={ent.id} color={GOLD} /></td>
                    <td style={{ padding: '12px 14px' }}><IdBadge id={ent.idRemision} color={INFO} /></td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700 }}>{ent.cantidad}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: fg }}>${ent.precioTotal.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: subtle }}>{ent.fechaFinalizacion}</td>
                    
                    <td style={{ padding: '12px 14px' }}>
                      {ent.remFirmadaNombre ? (
                        <button 
                          onClick={() => setModalArchivo({ url: ent.remFirmadaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600', titulo: `Remisión Firmada: ${ent.remFirmadaNombre}` })}
                          style={{ background: `${INFO}15`, color: INFO, border: `1px solid ${INFO}40`, borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <FileSignature size={14} /> Ver Firma
                        </button>
                      ) : <span style={{ fontSize: 11, color: subtle }}>No adjunta</span>}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      {ent.comprobanteNombre ? (
                        <button 
                          onClick={() => setModalArchivo({ url: ent.comprobanteUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600', titulo: `Comprobante de Pago: ${ent.comprobanteNombre}` })}
                          style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}40`, borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Receipt size={14} /> Ver Pago
                        </button>
                      ) : <span style={{ fontSize: 11, color: subtle }}>No adjunto</span>}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionCircleBtn variant="gold" onClick={() => handleEditarEntrega(ent)} title="Editar"><Pencil size={14} /></ActionCircleBtn>
                        <ActionCircleBtn variant="danger" onClick={() => setIdParaEliminar(ent.id)} title="Eliminar"><Trash2 size={14} /></ActionCircleBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL DE PREVISUALIZACIÓN DE ARCHIVO */}
        {modalArchivo && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: cardBg, borderRadius: 16, width: '100%', maxWidth: 600, overflow: 'hidden', border: `1px solid ${borderNormal}`, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderNormal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: fg }}>{modalArchivo.titulo}</span>
                <button onClick={() => setModalArchivo(null)} style={{ background: 'transparent', border: 'none', color: subtle, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
              </div>
              <div style={{ padding: 24, textAlign: 'center', maxHeight: '70vh', overflowY: 'auto' }}>
                <img src={modalArchivo.url} alt="Comprobante o Remisión" style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 8, objectFit: 'contain', border: `1px solid ${borderNormal}` }} />
              </div>
              <div style={{ padding: '12px 20px', borderTop: `1px solid ${borderNormal}`, display: 'flex', justifyContent: 'flex-end', background: dark ? '#181818' : '#F1F1F1' }}>
                <button onClick={() => setModalArchivo(null)} style={{ background: GOLD, color: '#121212', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {idParaEliminar && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: '#1E1E1E', borderRadius: 16, width: '100%', maxWidth: 420, padding: 32, textAlign: 'center', border: `1px solid rgba(255,255,255,0.08)`, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
              
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: DANGER }}>
                <AlertTriangle size={32} />
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#F8F9FA', margin: '0 0 12px' }}>¿Eliminar registro?</h3>
              
              <div style={{ background: '#FDEDED', color: DANGER, padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 24, border: '1px solid #FCA5A5' }}>
                Esta acción eliminará el registro de remisión de entrega y sus soportes asociados.
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  onClick={() => setIdParaEliminar(null)} 
                  style={{ flex: 1, backgroundColor: '#2A2A2A', color: '#F8F9FA', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarEliminacion} 
                  style={{ flex: 1, backgroundColor: DANGER, color: '#FFF', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Sí, eliminar
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  if (vistaActual === 'formulario') {
    return (
      <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setVistaActual('listado')} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>
                {registroEnEdicion ? `Editar Entrega ${registroEnEdicion}` : 'Nueva Remisión de Entrega'}
              </h2>
              <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Registra la entrega final, pago y firma del cliente por separado.</p>
            </div>
          </div>
          <button onClick={handleSave} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '10px 20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(201,162,39,0.2)' }}>
            <Save size={18} /> {registroEnEdicion ? 'Actualizar Entrega' : 'Guardar Entrega'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${borderNormal}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color={GOLD} /> Información de Liquidación</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>REMISIÓN ASOCIADA (ID_REM) <span style={{ color: DANGER }}>*</span></label>
                <select value={idRemision} onChange={(e) => setIdRemision(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }}>
                  <option value="">Selecciona una remisión...</option>
                  <option value="REM-001">REM-001 (NIT: 900123456)</option>
                  <option value="REM-003">REM-003 (NIT: 900123456)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>CANTIDAD ENTREGADA <span style={{ color: DANGER }}>*</span></label>
                  <input type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }} placeholder="Ej. 250" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>PRECIO TOTAL ($) <span style={{ color: DANGER }}>*</span></label>
                  <input type="number" value={precioTotal} onChange={(e) => setPrecioTotal(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }} placeholder="Ej. 240000" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>FECHA DE FINALIZACIÓN <span style={{ color: DANGER }}>*</span></label>
                <input type="date" value={fechaFinalizacion} onChange={(e) => setFechaFinalizacion(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: cardBg, borderRadius: 16, padding: 20, border: `1px solid ${borderNormal}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><FileSignature size={18} color={INFO} /> Remisión Firmada <span style={{ color: DANGER }}>*</span></h3>
              <div 
                onClick={() => document.getElementById('firma-upload-input')?.click()}
                style={{ border: `2px dashed ${INFO}60`, borderRadius: 10, padding: 18, textAlign: 'center', backgroundColor: `${INFO}0A`, cursor: 'pointer' }}
              >
                <input 
                  id="firma-upload-input"
                  type="file" 
                  onChange={(e) => { 
                    if (e.target.files?.[0]) {
                      setArchivoFirmada(e.target.files[0]); 
                      setNombreFirmadaExistente('');
                      setUrlFirmadaExistente('');
                      toast.success('Remisión firmada cargada.');
                    }
                  }} 
                  style={{ display: 'none' }} 
                  accept=".png,.jpg,.jpeg,.pdf" 
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <UploadCloud size={26} color={INFO} />
                  <span style={{ fontSize: 13, color: fg, fontWeight: 700 }}>
                    {archivoFirmada ? archivoFirmada.name : (nombreFirmadaExistente ? `Actual: ${nombreFirmadaExistente}` : "Haz clic para subir la remisión firmada")}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ background: cardBg, borderRadius: 16, padding: 20, border: `1px solid ${borderNormal}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Receipt size={18} color={GOLD} /> Comprobante de Pago <span style={{ color: DANGER }}>*</span></h3>
              <div 
                onClick={() => document.getElementById('pago-upload-input')?.click()}
                style={{ border: `2px dashed ${GOLD}60`, borderRadius: 10, padding: 18, textAlign: 'center', backgroundColor: `${GOLD}0A`, cursor: 'pointer' }}
              >
                <input 
                  id="pago-upload-input"
                  type="file" 
                  onChange={(e) => { 
                    if (e.target.files?.[0]) {
                      setArchivoComprobante(e.target.files[0]); 
                      setNombreComprobanteExistente('');
                      setUrlComprobanteExistente('');
                      toast.success('Comprobante de pago cargado.');
                    }
                  }} 
                  style={{ display: 'none' }} 
                  accept=".png,.jpg,.jpeg,.pdf" 
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <ImageIcon size={26} color={GOLD} />
                  <span style={{ fontSize: 13, color: fg, fontWeight: 700 }}>
                    {archivoComprobante ? archivoComprobante.name : (nombreComprobanteExistente ? `Actual: ${nombreComprobanteExistente}` : "Haz clic para adjuntar el comprobante")}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return null;
}