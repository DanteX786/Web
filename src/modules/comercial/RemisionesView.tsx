import React, { useState } from 'react';
import { 
  FileText, Plus, Trash2, UploadCloud, Save, ArrowLeft, ToggleLeft, ToggleRight, Box, Search, Eye, Pencil, ShieldAlert, User, X, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// PALETA DE COLORES Y ESTILOS BASE
// ==========================================
const GOLD         = "#C9A227";
const GOLD_LIGHT   = "#E6B84A";
const DANGER       = "#DC3545";
const DANGER_BG    = "#FDECEA";
const SUCCESS      = "#28A745";
const INFO         = "#4A90E2";
const WARNING      = "#FD7E14";
const WARNING_BG   = "#FFF3E0";

const ESTADOS_STYLES: Record<string, { bg: string; color: string }> = {
  "Pendiente": { bg: WARNING_BG, color: WARNING },
  "En Proceso": { bg: `${INFO}20`, color: INFO },
  "Finalizado": { bg: `${SUCCESS}20`, color: SUCCESS },
  "Cancelado": { bg: DANGER_BG, color: DANGER },
};

// ==========================================
// INTERFACES
// ==========================================
interface RemisionProps {
  dark?: boolean;
  rolInicial?: 'ADMIN' | 'CLIENTE'; 
}

interface DetallePieza {
  nombre: string;
  talla: string;
  cantidad: number;
}

interface InsumoEnviado {
  nombre: string;
  cantidad: number;
  unidad: string;
}

interface Remision {
  id: string;
  nit: string;
  fechaRecibo: string;
  fechaEntrega: string;
  costoPrenda: number;
  totalPrendas: number;
  estado: string;
  insumosEnviados: boolean;
  detalles: DetallePieza[];
  listaInsumos?: InsumoEnviado[];
  fichaTecnicaNombre?: string;
}

// ==========================================
// COMPONENTES REUTILIZABLES
// ==========================================
export const IdBadge: React.FC<{ id: string }> = ({ id }) => (
  <span style={{
    background: GOLD + "1F", color: GOLD,
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
  disabled?: boolean;
}> = ({ variant = 'gold', onClick, children, title, disabled = false }) => {
  let borderColor = disabled ? '#9A9A9A' : GOLD;
  let iconColor = disabled ? '#9A9A9A' : GOLD;

  if (variant === 'blue' && !disabled) { borderColor = INFO; iconColor = INFO; } 
  else if (variant === 'danger' && !disabled) { borderColor = DANGER; iconColor = DANGER; }

  return (
    <button
      onClick={onClick} title={title} disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent', 
        border: `1.5px solid ${borderColor}`, color: iconColor, 
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
};

export const Modal: React.FC<{
  title: string; icon?: React.ReactNode; onClose: () => void; dark?: boolean; maxWidth?: string; children: React.ReactNode;
}> = ({ title, icon, onClose, dark, maxWidth = "650px", children }) => {
  const cardBg = dark ? '#1E1E1E' : '#FFFFFF';
  const fg = dark ? '#F8F9FA' : '#121212';
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ width: '100%', maxWidth, borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 3, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon}
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL: RemisionesView
// ==========================================
export const RemisionesView: React.FC<RemisionProps> = ({ dark = false, rolInicial = 'CLIENTE' }) => {
  const [rolActivo, setRolActivo] = useState<'ADMIN' | 'CLIENTE'>(rolInicial);
  const [vistaActual, setVistaActual] = useState<'listado' | 'formulario'>('listado');
  const [modalDetalle, setModalDetalle] = useState<Remision | null>(null);
  
  // Estado para el modal de confirmación de eliminación
  const [idParaEliminar, setIdParaEliminar] = useState<string | null>(null);
  
  const [remisionEnEdicion, setRemisionEnEdicion] = useState<string | null>(null);
  
  const bg = dark ? "#121212" : "#F8F9FA";
  const fg = dark ? "#F8F9FA" : "#121212";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";

  const [remisiones, setRemisiones] = useState<Remision[]>([
    { 
      id: 'REM-001', nit: '900123456', fechaRecibo: '2026-09-24', fechaEntrega: '2026-10-02', costoPrenda: 13400, totalPrendas: 50, estado: 'Pendiente', insumosEnviados: false,
      detalles: [{ nombre: 'Mangas', talla: 'S', cantidad: 24 }, { nombre: 'Cuellos', talla: 'S', cantidad: 26 }],
      fichaTecnicaNombre: 'FICHA-TEC-001.pdf'
    },
    { 
      id: 'REM-002', nit: '800987654', fechaRecibo: '2026-09-25', fechaEntrega: '2026-10-05', costoPrenda: 15000, totalPrendas: 100, estado: 'En Proceso', insumosEnviados: true,
      detalles: [{ nombre: 'Cuello Polo', talla: 'L', cantidad: 100 }],
      listaInsumos: [{ nombre: 'Hilo Poliéster Azul', cantidad: 2, unidad: 'Conos' }, { nombre: 'Botones Azules', cantidad: 300, unidad: 'Und' }],
      fichaTecnicaNombre: 'DISEÑO-POLO.jpg'
    },
    { 
      id: 'REM-003', nit: '900123456', fechaRecibo: '2026-09-20', fechaEntrega: '2026-09-28', costoPrenda: 12000, totalPrendas: 25, estado: 'Finalizado', insumosEnviados: false,
      detalles: [{ nombre: 'Bolsillos Frontales', talla: 'Única', cantidad: 50 }],
      fichaTecnicaNombre: 'BOLSILLOS.pdf'
    },
  ]);

  const [busqueda, setBusqueda] = useState('');

  const [fichaTecnica, setFichaTecnica] = useState<File | null>(null);
  const [nombreArchivoFicha, setNombreArchivoFicha] = useState<string>('');
  
  const [fechaRecibo, setFechaRecibo] = useState(new Date().toISOString().split('T')[0]);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [nit, setNit] = useState(rolActivo === 'CLIENTE' ? '900123456' : '');
  const [costoPrenda, setCostoPrenda] = useState<number | ''>('');
  const [totalPrendasManual, setTotalPrendasManual] = useState<number | ''>('');
  const [habilitarInsumos, setHabilitarInsumos] = useState(false);
  const [detalles, setDetalles] = useState<DetallePieza[]>([{ nombre: '', talla: 'S', cantidad: 0 }]);
  const [insumosEnviados, setInsumosEnviados] = useState<InsumoEnviado[]>([]);

  const resetForm = () => {
    setRemisionEnEdicion(null);
    setFechaEntrega(''); 
    setCostoPrenda(''); 
    setTotalPrendasManual(''); 
    setDetalles([{ nombre: '', talla: 'S', cantidad: 0 }]); 
    setHabilitarInsumos(false); 
    setInsumosEnviados([]); 
    setFichaTecnica(null);
    setNombreArchivoFicha('');
  };

  const handleNuevaRemision = () => {
    resetForm();
    setFechaRecibo(new Date().toISOString().split('T')[0]);
    setVistaActual('formulario');
  };

  const handleEditarRemision = (remision: Remision) => {
    setRemisionEnEdicion(remision.id);
    setNit(remision.nit);
    setFechaRecibo(remision.fechaRecibo);
    setFechaEntrega(remision.fechaEntrega);
    setCostoPrenda(remision.costoPrenda);
    setTotalPrendasManual(remision.totalPrendas);
    setHabilitarInsumos(remision.insumosEnviados);
    setDetalles([...remision.detalles]);
    setInsumosEnviados(remision.listaInsumos ? [...remision.listaInsumos] : []);
    
    if (remision.fichaTecnicaNombre) {
      setNombreArchivoFicha(remision.fichaTecnicaNombre);
    } else {
      setNombreArchivoFicha('');
    }
    setFichaTecnica(null);
    
    setVistaActual('formulario');
  };

  const handleSaveRemision = () => {
    if (!fichaTecnica && !nombreArchivoFicha) {
      toast.error('La Ficha Técnica es un documento obligatorio.');
      return;
    }

    if (!fechaEntrega || !costoPrenda || totalPrendasManual === '' || detalles.some(d => !d.nombre || d.cantidad <= 0)) {
      toast.error('Por favor completa todos los campos obligatorios del detalle.');
      return;
    }
    
    const nombreFichaGuardar = fichaTecnica ? fichaTecnica.name : nombreArchivoFicha;

    const datosGuardar: Remision = {
      id: remisionEnEdicion ? remisionEnEdicion : `REM-00${remisiones.length + 1}`,
      nit, 
      fechaRecibo, 
      fechaEntrega, 
      costoPrenda: Number(costoPrenda),
      totalPrendas: Number(totalPrendasManual),
      estado: 'Pendiente', 
      insumosEnviados: habilitarInsumos,
      detalles, 
      listaInsumos: habilitarInsumos ? insumosEnviados : [],
      fichaTecnicaNombre: nombreFichaGuardar
    };

    if (remisionEnEdicion) {
      setRemisiones(remisiones.map(r => r.id === remisionEnEdicion ? datosGuardar : r));
      toast.success(`Remisión ${remisionEnEdicion} actualizada correctamente.`);
    } else {
      setRemisiones([...remisiones, datosGuardar]);
      toast.success('Remisión creada exitosamente.');
    }
    
    setVistaActual('listado');
    resetForm();
  };

  const handleEstadoChange = (id: string, nuevoEstado: string) => {
    setRemisiones(remisiones.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r));
    toast.success(`Estado actualizado a ${nuevoEstado}`);
  };

  const confirmarEliminacion = () => {
    if (idParaEliminar) {
      setRemisiones(remisiones.filter(r => r.id !== idParaEliminar));
      toast.success('Remisión eliminada.');
      setIdParaEliminar(null);
    }
  };

  const datosMostrar = rolActivo === 'CLIENTE' ? remisiones.filter(r => r.nit === '900123456') : remisiones;
  const remisionesFiltradas = datosMostrar.filter(r => r.id.toLowerCase().includes(busqueda.toLowerCase()) || r.nit.includes(busqueda));

  // ==========================================
  // RENDER DE VISTA 1: LISTADO
  // ==========================================
  if (vistaActual === 'listado') {
    return (
      <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>{rolActivo === 'ADMIN' ? 'Gestión de Remisiones (Admin)' : 'Mis Remisiones (Cliente)'}</h2>
            <p style={{ fontSize: 13, color: subtle, margin: 0 }}>{rolActivo === 'ADMIN' ? 'Administra las remisiones de todos los clientes.' : 'Consulta el estado de tus envíos y crea nuevas remisiones.'}</p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: inputBg, padding: '4px', borderRadius: 8, display: 'flex', border: `1px solid ${borderNormal}` }}>
              <button onClick={() => setRolActivo('CLIENTE')} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: rolActivo === 'CLIENTE' ? cardBg : 'transparent', color: rolActivo === 'CLIENTE' ? GOLD : subtle, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: rolActivo === 'CLIENTE' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                <User size={14} /> Vista Cliente
              </button>
              <button onClick={() => setRolActivo('ADMIN')} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: rolActivo === 'ADMIN' ? cardBg : 'transparent', color: rolActivo === 'ADMIN' ? INFO : subtle, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: rolActivo === 'ADMIN' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                <ShieldAlert size={14} /> Vista Admin
              </button>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
              <input type="text" placeholder="Buscar remisión..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ padding: '8px 12px 8px 36px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, fontSize: 13, outline: 'none' }} />
            </div>

            {rolActivo === 'CLIENTE' && (
              <button onClick={handleNuevaRemision} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '8px 16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Nueva Remisión
              </button>
            )}
          </div>
        </div>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${borderNormal}`, background: cardBg }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
                {['ID', rolActivo === 'ADMIN' ? 'NIT CLIENTE' : '', 'FECHA RECIBO', 'FECHA ENTREGA', 'TOTAL PRENDAS', 'INSUMOS ENVIADOS', 'ESTADO', 'ACCIONES'].filter(Boolean).map(h => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 14px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {remisionesFiltradas.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: subtle }}>No hay remisiones registradas.</td></tr>
              ) : (
                remisionesFiltradas.map(rem => {
                  const st = ESTADOS_STYLES[rem.estado];
                  return (
                  <tr key={rem.id} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                    <td style={{ padding: '12px 14px' }}><IdBadge id={rem.id} /></td>
                    {rolActivo === 'ADMIN' && <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600 }}>{rem.nit}</td>}
                    <td style={{ padding: '12px 14px', fontSize: 11, color: subtle }}>{rem.fechaRecibo}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: subtle }}>{rem.fechaEntrega}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700 }}>{rem.totalPrendas}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12 }}>{rem.insumosEnviados ? 'Sí' : 'No'}</td>
                    
                    <td style={{ padding: '12px 14px' }}>
                      {rolActivo === 'ADMIN' ? (
                        <select value={rem.estado} onChange={(e) => handleEstadoChange(rem.id, e.target.value)} style={{ backgroundColor: st.bg, color: st.color, border: 'none', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                          <option value="Pendiente">Pendiente</option><option value="En Proceso">En Proceso</option><option value="Finalizado">Finalizado</option><option value="Cancelado">Cancelado</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: st.bg, color: st.color }}>{rem.estado}</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionCircleBtn variant="blue" onClick={() => setModalDetalle(rem)} title="Ver Detalle"><Eye size={14} /></ActionCircleBtn>
                        {rolActivo === 'CLIENTE' && <ActionCircleBtn variant="gold" onClick={() => handleEditarRemision(rem)} title="Editar" disabled={rem.estado !== 'Pendiente'}><Pencil size={14} /></ActionCircleBtn>}
                        {rolActivo === 'ADMIN' && <ActionCircleBtn variant="danger" onClick={() => setIdParaEliminar(rem.id)} title="Eliminar"><Trash2 size={14} /></ActionCircleBtn>}
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {idParaEliminar && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: '#1E1E1E', borderRadius: 16, width: '100%', maxWidth: 420, padding: 32, textAlign: 'center', border: `1px solid rgba(255,255,255,0.08)`, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
              
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: DANGER }}>
                <AlertTriangle size={32} />
              </div>

              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#F8F9FA', margin: '0 0 12px' }}>¿Eliminar registro?</h3>
              
              <div style={{ background: '#FDEDED', color: DANGER, padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 24, border: '1px solid #FCA5A5' }}>
                Esta acción eliminará el registro de producción y sus asignaciones asociadas.
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

        {/* MODAL DE VER DETALLE */}
        {modalDetalle && (
          <Modal title={`Detalle de Remisión ${modalDetalle.id}`} icon={<FileText size={18} color={INFO} />} onClose={() => setModalDetalle(null)} dark={dark} maxWidth="750px">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ background: inputBg, padding: '12px 16px', borderRadius: 10, border: `1px solid ${borderNormal}` }}>
                <span style={{ fontSize: 10, color: subtle, fontWeight: 700, display: 'block', marginBottom: 4 }}>ESTADO</span>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: ESTADOS_STYLES[modalDetalle.estado].bg, color: ESTADOS_STYLES[modalDetalle.estado].color }}>{modalDetalle.estado}</span>
              </div>
              <div style={{ background: inputBg, padding: '12px 16px', borderRadius: 10, border: `1px solid ${borderNormal}` }}>
                <span style={{ fontSize: 10, color: subtle, fontWeight: 700, display: 'block', marginBottom: 4 }}>NIT CLIENTE</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: fg }}>{modalDetalle.nit}</span>
              </div>
              <div style={{ background: inputBg, padding: '12px 16px', borderRadius: 10, border: `1px solid ${borderNormal}` }}>
                <span style={{ fontSize: 10, color: subtle, fontWeight: 700, display: 'block', marginBottom: 4 }}>COSTO POR PRENDA</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: fg }}>${modalDetalle.costoPrenda.toLocaleString()}</span>
              </div>
              <div style={{ background: inputBg, padding: '12px 16px', borderRadius: 10, border: `1px solid ${borderNormal}` }}>
                <span style={{ fontSize: 10, color: subtle, fontWeight: 700, display: 'block', marginBottom: 4 }}>FECHA RECIBO</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>{modalDetalle.fechaRecibo}</span>
              </div>
              <div style={{ background: inputBg, padding: '12px 16px', borderRadius: 10, border: `1px solid ${borderNormal}` }}>
                <span style={{ fontSize: 10, color: subtle, fontWeight: 700, display: 'block', marginBottom: 4 }}>FECHA ENTREGA ESPERADA</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>{modalDetalle.fechaEntrega}</span>
              </div>
              <div style={{ background: inputBg, padding: '12px 16px', borderRadius: 10, border: `1px solid ${borderNormal}` }}>
                <span style={{ fontSize: 10, color: subtle, fontWeight: 700, display: 'block', marginBottom: 4 }}>TOTAL PRENDAS</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>{modalDetalle.totalPrendas}</span>
              </div>
            </div>

            {/* Ficha Técnica Descarga Simulada */}
            <div style={{ marginTop: 8, padding: 12, backgroundColor: `${INFO}15`, borderRadius: 8, border: `1px solid ${INFO}40`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color={INFO} />
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: INFO, display: 'block' }}>Ficha Técnica Asociada</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: fg }}>{modalDetalle.fichaTecnicaNombre || 'No se adjuntó ficha técnica'}</span>
                </div>
              </div>
              {modalDetalle.fichaTecnicaNombre && (
                <button style={{ background: INFO, color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Descargar</button>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: fg, margin: '0 0 10px 0' }}>Prendas a Confeccionar</h4>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${borderNormal}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: inputBg }}>
                      <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>PIEZA</th>
                      <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>TALLA</th>
                      <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>CANTIDAD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalDetalle.detalles.map((d, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${borderNormal}` }}>
                        <td style={{ padding: '8px 12px', color: fg, fontWeight: 600 }}>{d.nombre}</td>
                        <td style={{ padding: '8px 12px', color: fg }}>{d.talla}</td>
                        <td style={{ padding: '8px 12px', color: fg, fontWeight: 700 }}>{d.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {modalDetalle.insumosEnviados && modalDetalle.listaInsumos && modalDetalle.listaInsumos.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: fg, margin: '0 0 10px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Box size={14} color={INFO}/> Insumos Adjuntados por el Cliente
                </h4>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${borderNormal}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: inputBg }}>
                        <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>INSUMO</th>
                        <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>CANTIDAD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalDetalle.listaInsumos.map((ins, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${borderNormal}` }}>
                          <td style={{ padding: '8px 12px', color: fg, fontWeight: 600 }}>{ins.nombre}</td>
                          <td style={{ padding: '8px 12px', color: fg }}>{ins.cantidad} {ins.unidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER DE VISTA 2: FORMULARIO (SOLO CLIENTE - CREAR O EDITAR)
  // ==========================================
  if (vistaActual === 'formulario' && rolActivo === 'CLIENTE') {
    return (
      <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setVistaActual('listado')} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>
                {remisionEnEdicion ? `Editar Remisión ${remisionEnEdicion}` : 'Crear Remisión'}
              </h2>
              <p style={{ fontSize: 13, color: subtle, margin: 0 }}>
                {remisionEnEdicion ? 'Actualiza los datos de tu remisión pendiente.' : 'Diligencia la información general y detalles de las prendas a confeccionar.'}
              </p>
            </div>
          </div>
          <button onClick={handleSaveRemision} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '10px 20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={18} /> {remisionEnEdicion ? 'Actualizar Remisión' : 'Enviar Remisión'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${borderNormal}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color={GOLD} /> Información General</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>NIT CLIENTE</label>
                  <input type="text" value={nit} disabled style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: subtle, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>COSTO POR PRENDA PACTADO ($)</label>
                  <input type="number" value={costoPrenda} onChange={(e) => setCostoPrenda(Number(e.target.value))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} placeholder="Ej. 13400" />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>FECHA DE CREACIÓN</label>
                  <input type="date" value={fechaRecibo} onChange={(e) => setFechaRecibo(e.target.value)} disabled style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: subtle, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box', opacity: 0.7 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>FECHA DE ENTREGA ESPERADA</label>
                  <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                
                {/* FICHA TÉCNICA OBLIGATORIA */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    FICHA TÉCNICA <span style={{ color: DANGER, fontSize: 14 }}>*</span>
                  </label>
                  <div style={{ border: `2px dashed ${GOLD}60`, borderRadius: 10, padding: 20, textAlign: 'center', backgroundColor: `${GOLD}0A`, cursor: 'pointer' }}>
                    <input type="file" onChange={(e) => { setFichaTecnica(e.target.files?.[0] || null); setNombreArchivoFicha(''); }} style={{ display: 'none' }} id="ficha-upload" accept=".pdf,.jpg,.png" />
                    <label htmlFor="ficha-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <UploadCloud size={24} color={GOLD} />
                      <span style={{ fontSize: 13, color: fg, fontWeight: 600 }}>
                        {fichaTecnica ? fichaTecnica.name : (nombreArchivoFicha ? `Archivo actual: ${nombreArchivoFicha} (Clic para cambiar)` : "Clic para subir Ficha Técnica (.PDF, .JPG)")}
                      </span>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            <div style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${borderNormal}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: habilitarInsumos ? 20 : 0 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}><Box size={18} color={INFO} /> Habilitar insumos enviados</h3>
                  <p style={{ fontSize: 11, color: subtle, margin: 0 }}>¿Enviarás insumos propios para esta producción?</p>
                </div>
                <button onClick={() => { setHabilitarInsumos(!habilitarInsumos); if (habilitarInsumos) setInsumosEnviados([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  {habilitarInsumos ? <ToggleRight size={36} color={SUCCESS} /> : <ToggleLeft size={36} color={subtle} />}
                </button>
              </div>

              {habilitarInsumos && (
                <div style={{ borderTop: `1px solid ${borderNormal}`, paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: fg }}>Listado de Insumos</span>
                    <button onClick={() => setInsumosEnviados([...insumosEnviados, { nombre: '', cantidad: 0, unidad: 'Und' }])} style={{ background: `${INFO}15`, color: INFO, border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} /> Agregar Insumo</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {insumosEnviados.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 16, color: subtle, fontSize: 12, backgroundColor: inputBg, borderRadius: 8 }}>Aún no has agregado insumos.</div>
                    ) : (
                      insumosEnviados.map((ins, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                          <input type="text" placeholder="Nombre insumo" value={ins.nombre} onChange={(e) => { const n = [...insumosEnviados]; n[idx].nombre = e.target.value; setInsumosEnviados(n); }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }} />
                          <input type="number" placeholder="Cant." value={ins.cantidad || ''} onChange={(e) => { const n = [...insumosEnviados]; n[idx].cantidad = Number(e.target.value); setInsumosEnviados(n); }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }} />
                          <select value={ins.unidad} onChange={(e) => { const n = [...insumosEnviados]; n[idx].unidad = e.target.value; setInsumosEnviados(n); }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }}>
                            <option value="Und">Und</option><option value="Metros">Metros</option><option value="Conos">Conos</option>
                          </select>
                          <button onClick={() => setInsumosEnviados(insumosEnviados.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: DANGER, cursor: 'pointer' }}><Trash2 size={16} /></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${borderNormal}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color={GOLD} /> Detalle de Prendas</h3>
              <button onClick={() => setDetalles([...detalles, { nombre: '', talla: 'S', cantidad: 0 }])} style={{ background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={14} /> Añadir Pieza</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
              {detalles.map((det, index) => (
                <div key={index} style={{ background: inputBg, borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end', border: `1px solid ${borderNormal}` }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>PIEZA</label>
                    <input type="text" value={det.nombre} onChange={(e) => { const n = [...detalles]; n[index].nombre = e.target.value; setDetalles(n); }} placeholder="Ej. Mangas" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12, backgroundColor: cardBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>TALLA</label>
                    <select value={det.talla} onChange={(e) => { const n = [...detalles]; n[index].talla = e.target.value; setDetalles(n); }} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12, backgroundColor: cardBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }}>
                      {['XS', 'S', 'M', 'L', 'XL', 'Única'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>CANTIDAD</label>
                    <input type="number" value={det.cantidad || ''} onChange={(e) => { const n = [...detalles]; n[index].cantidad = Number(e.target.value); setDetalles(n); }} placeholder="0" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 12, backgroundColor: cardBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }} />
                  </div>
                  <div style={{ paddingBottom: 4 }}>
                    <button onClick={() => setDetalles(detalles.filter((_, i) => i !== index))} disabled={detalles.length === 1} style={{ background: 'transparent', border: 'none', color: detalles.length === 1 ? subtle : DANGER, cursor: detalles.length === 1 ? 'not-allowed' : 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `2px dashed ${borderNormal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: subtle }}>Total de Prendas a confeccionar:</span>
              <input 
                type="number" 
                value={totalPrendasManual} 
                onChange={(e) => setTotalPrendasManual(Number(e.target.value))} 
                placeholder="0"
                style={{ 
                  width: '80px', padding: '6px 10px', borderRadius: 8, fontSize: 20, fontWeight: 800, 
                  backgroundColor: inputBg, color: GOLD, border: `1px solid ${GOLD}40`, outline: 'none', textAlign: 'center'
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};