import React, { useState } from 'react';
import { Truck, Search, Plus, X, AlertTriangle, Pencil, Trash2, Eye, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const BLUE = "#4A90E2";
const DANGER = "#DC3545";
const DANGER_BG = "#FDECEA";
const DANGER_TXT = "#721c24";
const SUCCESS_BG = "#DCF7E6";
const SUCCESS_TXT = "#155724";

type EstadoProveedor = "Activo" | "Inactivo";

interface Proveedor {
  id: string;
  nombre: string;
  nit: string;
  direccion: string;
  correo: string;
  telefono: string;
  contacto: string;
  estado: EstadoProveedor;
}

interface Props {
  dark?: boolean;
}

export default function ProveedoresCRUD({ dark = false }: Props) {
  const bg = dark ? "#121212" : "#F8F9FA";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const [data, setData] = useState<Proveedor[]>([
    { id:"PRV-001", nombre:"Textiles Medellín S.A.", nit:"800123456-1", direccion:"Cra 45 #12-34, Medellín", correo:"ventas@textilesmedellin.com", telefono:"3001234567", contacto:"Carlos Pérez", estado:"Activo" },
    { id:"PRV-002", nombre:"Distribuidora Hilos El Dorado", nit:"900234567-2", direccion:"Cl 80 #20-15, Bogotá", correo:"contacto@hiloseldorado.com", telefono:"3109876543", contacto:"Ana Gómez", estado:"Activo" },
    { id:"PRV-003", nombre:"Botones & Accesorios Ltda.", nit:"830345678-3", direccion:"Av. 30 #5-22, Cali", correo:"pedidos@botonesaccesorios.com", telefono:"3204567890", contacto:"Luis Torres", estado:"Inactivo" },
  ]);

  const [busqueda, setBusqueda] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [current, setCurrent] = useState<Proveedor | null>(null);
  const [deleteItem, setDeleteItem] = useState<Proveedor | null>(null);
  const [formData, setFormData] = useState<Partial<Proveedor>>({ estado: 'Activo' });

  const filtered = data.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.nit.includes(busqueda) || 
    p.id.toLowerCase().includes(busqueda.toLowerCase())
  );

  const openAdd = () => {
    const nextNum = data.length + 1;
    const autoId = `PRV-${String(nextNum).padStart(3, '0')}`;
    setCurrent(null);
    setFormData({ id: autoId, nombre: '', nit: '', direccion: '', correo: '', telefono: '', contacto: '', estado: 'Activo' });
    setModalMode('add');
  };

  const openEdit = (p: Proveedor) => {
    setCurrent(p);
    setFormData(p);
    setModalMode('edit');
  };

  const openView = (p: Proveedor) => {
    setCurrent(p);
    setModalMode('view');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.nit) {
      toast.error("El nombre y el NIT son obligatorios", {
        style: { background: DANGER_BG, border: `1px solid ${DANGER}`, color: DANGER_TXT, fontFamily: 'Montserrat, sans-serif' }
      });
      return;
    }

    if (modalMode === 'add') {
      const nextNum = data.length + 1;
      const newProv = { 
        ...formData, 
        id: `PRV-${String(nextNum).padStart(3, '0')}` 
      } as Proveedor;
      setData([...data, newProv]);
      toast.success("Proveedor registrado exitosamente", {
        style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
      });
    } else if (modalMode === 'edit' && current) {
      setData(data.map(d => d.id === current.id ? { ...d, ...formData } as Proveedor : d));
      toast.success("Proveedor actualizado exitosamente", {
        style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
      });
    }
    setModalMode(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteItem) return;
    setData(data.filter(d => d.id !== deleteItem.id));
    setDeleteItem(null);
    toast.success("Proveedor eliminado correctamente", {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  const handleStateChangeInline = (id: string, nuevoEstado: EstadoProveedor) => {
    setData(data.map(d => d.id === id ? { ...d, estado: nuevoEstado } : d));
    toast.success(`Estado actualizado a "${nuevoEstado}"`, {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  const getEstadoBadgeStyle = (estado: EstadoProveedor) => {
    switch (estado) {
      case "Activo":   return { bg: "#DCF7E6", color: "#28A745" };
      case "Inactivo": return { bg: "#FDECEA", color: "#DC3545" };
    }
  };

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Proveedores</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Gestión de proveedores e insumos del taller</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: 220, padding: '8px 12px 8px 36px', borderRadius: 8,
                border: `1px solid ${borderNormal}`, background: surfaceBg, color: fg,
                fontSize: 13, outline: 'none', fontFamily: 'Montserrat, sans-serif'
              }}
              onFocus={(e) => { e.target.style.borderColor = GOLD; }}
              onBlur={(e) => { e.target.style.borderColor = borderNormal; }}
            />
          </div>

          <button
            onClick={openAdd}
            style={{
              background: `linear-gradient(135deg, #C9A227, ${GOLD}, ${GOLD_LIGHT})`,
              color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10,
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif'
            }}
          >
            <Plus size={14} /> Nuevo proveedor
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, background: cardBg }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
              {['ID', 'Nombre', 'NIT', 'Teléfono', 'Estado', 'Acciones'].map((h, i) => (
                <th key={h} style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', textAlign: i === 5 ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: subtle, fontSize: 13 }}>
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const badgeStyle = getEstadoBadgeStyle(row.estado);
                return (
                  <tr key={row.id} style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: `${GOLD}1F`, color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                        {row.id}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: 600, fontSize: 13, color: fg }}>{row.nombre}</td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 13, fontFamily: 'monospace', color: subtle }}>{row.nit}</td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 13, color: subtle }}>{row.telefono}</td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <select
                          value={row.estado}
                          onChange={(e) => handleStateChangeInline(row.id, e.target.value as EstadoProveedor)}
                          style={{
                            background: badgeStyle.bg, color: badgeStyle.color, border: 'none',
                            borderRadius: 999, padding: '5px 24px 5px 12px', fontSize: 12,
                            fontWeight: 700, cursor: 'pointer', outline: 'none',
                            fontFamily: 'Montserrat, sans-serif', appearance: 'none'
                          }}
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                        <ChevronDown size={13} color={badgeStyle.color} style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {/* Ojo Azul a la izquierda */}
                        <button onClick={() => openView(row)} title="Ver" style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent', border: `1.5px solid ${BLUE}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e)=>{e.currentTarget.style.backgroundColor=`${BLUE}1A`;}} onMouseLeave={(e)=>{e.currentTarget.style.backgroundColor='transparent';}}>
                          <Eye size={14} color={BLUE} />
                        </button>
                        <button onClick={() => openEdit(row)} title="Editar" style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent', border: `1.5px solid ${GOLD}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e)=>{e.currentTarget.style.backgroundColor=`${GOLD}1A`;}} onMouseLeave={(e)=>{e.currentTarget.style.backgroundColor='transparent';}}>
                          <Pencil size={14} color={GOLD} />
                        </button>
                        <button onClick={() => setDeleteItem(row)} title="Eliminar" style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent', border: `1.5px solid ${GOLD}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e)=>{e.currentTarget.style.backgroundColor=`${GOLD}1A`;}} onMouseLeave={(e)=>{e.currentTarget.style.backgroundColor='transparent';}}>
                          <Trash2 size={14} color={GOLD} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: subtle, marginTop: 12 }}>{filtered.length} registro(s) encontrado(s)</div>

      {/* MODAL CREAR / EDITAR */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif' }}>
                {modalMode === 'add' ? 'Registrar Proveedor' : 'Editar Proveedor'}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Nombre de la Empresa</label>
                <input value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Textiles del Norte" style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>NIT</label>
                  <input value={formData.nit || ''} onChange={e => setFormData({...formData, nit: e.target.value})} placeholder="90000000-0" style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Teléfono</label>
                  <input value={formData.telefono || ''} onChange={e => setFormData({...formData, telefono: e.target.value})} placeholder="3000000000" style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Dirección</label>
                <input value={formData.direccion || ''} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Calle 0 #0-0" style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Correo</label>
                  <input value={formData.correo || ''} onChange={e => setFormData({...formData, correo: e.target.value})} placeholder="correo@empresa.com" style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Contacto Principal</label>
                  <input value={formData.contacto || ''} onChange={e => setFormData({...formData, contacto: e.target.value})} placeholder="Nombre persona" style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Estado</label>
                <select 
                  value={formData.estado || 'Activo'} 
                  onChange={e => setFormData({...formData, estado: e.target.value as EstadoProveedor})}
                  style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}
                >
                  {(["Activo", "Inactivo"] as EstadoProveedor[]).map(est => <option key={est} value={est}>{est}</option>)}
                </select>
              </div>

              <div style={{ padding: '16px 24px', margin: '-20px -24px -20px', marginTop: 12, borderTop: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: dark ? '#252525' : '#FAFAFA' }}>
                <button type="button" onClick={() => setModalMode(null)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: dark ? '#2A2A2A' : '#E8E8E8', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VIEW */}
      {modalMode === 'view' && current && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg }}>Detalle del Proveedor</h3>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}><X size={18}/></button>
            </div>
            
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>ID Proveedor</div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: GOLD }}>{current.id}</span>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Estado</div>
                <span style={{ ...getEstadoBadgeStyle(current.estado), padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>{current.estado}</span>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, gridColumn: 'span 2' }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Empresa</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: GOLD }}>{current.nombre}</div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} color={subtle} />
                <div>
                  <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase' }}>Dirección</div>
                  <div style={{ fontSize: 13, color: fg }}>{current.direccion}</div>
                </div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} color={subtle} />
                <div>
                  <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase' }}>Teléfono</div>
                  <div style={{ fontSize: 13, color: fg }}>{current.telefono}</div>
                </div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} color={subtle} />
                <div>
                  <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase' }}>Correo</div>
                  <div style={{ fontSize: 13, color: fg }}>{current.correo}</div>
                </div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, gridColumn: 'span 2' }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Contacto Principal</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{current.contacto}</div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${GOLD}25`, backgroundColor: dark ? '#252525' : '#FAFAFA', textAlign: 'right' }}>
              <button onClick={() => setModalMode(null)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: dark ? '#2A2A2A' : '#E8E8E8', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400, borderRadius: 16, backgroundColor: cardBg, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'center', paddingBottom: 24 }}>
            <div style={{ height: 4, background: `linear-gradient(135deg, ${DANGER}, #f56565)` }} />
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: DANGER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={28} color={DANGER} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 8px' }}>¿Eliminar proveedor?</h3>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 16px' }}>Esta acción no se puede deshacer.</p>
              
              <div style={{ background: DANGER_BG, border: `1px solid ${DANGER}4D`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: DANGER_TXT, fontWeight: 600, marginBottom: 20, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color={DANGER} style={{ flexShrink: 0 }} />
                <span>Se eliminará el proveedor <strong>{deleteItem.nombre}</strong> permanentemente.</span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setDeleteItem(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: dark ? '#2A2A2A' : '#E8E8E8', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleConfirmDelete} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: DANGER, color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}