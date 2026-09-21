import React, { useState } from 'react';
import { Send, Search, Plus, X, AlertTriangle, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const BLUE = "#4A90E2";
const DANGER = "#DC3545";
const DANGER_BG = "#FDECEA";
const DANGER_TXT = "#721c24";
const SUCCESS_BG = "#DCF7E6";
const SUCCESS_TXT = "#155724";

interface InsumoEnviado {
  id: string;
  idRemision: string;
  idInsumo: string;
  nombreInsumo: string;
  cantidadEnviada: number;
  fecha: string;
}

interface Props {
  remisiones?: { id: string }[];
  insumos?: { id: string; nombre: string; stock: number }[];
  dark?: boolean;
}

const mockRemisiones = [{ id: "REM-001" }, { id: "REM-002" }, { id: "REM-003" }];
const mockInsumos = [
  { id: "INS-001", nombre: "Hilo Negro 40/2", stock: 350 },
  { id: "INS-002", nombre: "Marquillas tejidas", stock: 200 },
  { id: "INS-003", nombre: "Botones nácar 15mm", stock: 500 }
];

export default function InsumosEnviadosCRUD({
  remisiones = mockRemisiones,
  insumos = mockInsumos,
  dark = false,
}: Props) {
  const bg = dark ? "#121212" : "#F8F9FA";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const [data, setData] = useState<InsumoEnviado[]>([
    { id:"INE-001", idRemision:"REM-001", idInsumo:"INS-001", nombreInsumo:"Hilo Negro 40/2", cantidadEnviada:500, fecha:"2026-09-15" },
    { id:"INE-002", idRemision:"REM-001", idInsumo:"INS-002", nombreInsumo:"Marquillas tejidas", cantidadEnviada:200, fecha:"2026-09-20" },
    { id:"INE-003", idRemision:"REM-002", idInsumo:"INS-003", nombreInsumo:"Botones nácar 15mm", cantidadEnviada:350, fecha:"2026-09-25" },
  ]);

  const [busqueda, setBusqueda] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [current, setCurrent] = useState<InsumoEnviado | null>(null);
  const [deleteItem, setDeleteItem] = useState<InsumoEnviado | null>(null);
  const [formData, setFormData] = useState<Partial<InsumoEnviado>>({});

  const filtered = data.filter(i => 
    i.id.toLowerCase().includes(busqueda.toLowerCase()) || 
    i.nombreInsumo.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.idRemision.toLowerCase().includes(busqueda.toLowerCase())
  );

  const openAdd = () => {
    const nextNum = data.length + 1;
    const autoId = `INE-${String(nextNum).padStart(3, '0')}`;
    setCurrent(null);
    setFormData({ id: autoId, idRemision: 'REM-001', idInsumo: 'INS-001', nombreInsumo: 'Hilo Negro 40/2', cantidadEnviada: 1, fecha: '' });
    setModalMode('add');
  };

  const openEdit = (i: InsumoEnviado) => {
    setCurrent(i);
    setFormData(i);
    setModalMode('edit');
  };

  const openView = (i: InsumoEnviado) => {
    setCurrent(i);
    setModalMode('view');
  };

  const handleInsumoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedInsumo = insumos.find(ins => ins.id === selectedId);
    setFormData({ 
      ...formData, 
      idInsumo: selectedId, 
      nombreInsumo: selectedInsumo ? selectedInsumo.nombre : '' 
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idRemision) { 
      toast.error("Selecciona una remisión", { style: { background: DANGER_BG, border: `1px solid ${DANGER}`, color: DANGER_TXT, fontFamily: 'Montserrat, sans-serif' } }); 
      return; 
    }
    if (!formData.idInsumo) { 
      toast.error("Selecciona un insumo", { style: { background: DANGER_BG, border: `1px solid ${DANGER}`, color: DANGER_TXT, fontFamily: 'Montserrat, sans-serif' } }); 
      return; 
    }
    if (!formData.cantidadEnviada || formData.cantidadEnviada <= 0) { 
      toast.error("La cantidad debe ser mayor a 0", { style: { background: DANGER_BG, border: `1px solid ${DANGER}`, color: DANGER_TXT, fontFamily: 'Montserrat, sans-serif' } }); 
      return; 
    }
    if (!formData.fecha) { 
      toast.error("Ingresa la fecha de envío", { style: { background: DANGER_BG, border: `1px solid ${DANGER}`, color: DANGER_TXT, fontFamily: 'Montserrat, sans-serif' } }); 
      return; 
    }

    if (modalMode === 'add') {
      const nextNum = data.length + 1;
      const newReg = { 
        ...formData, 
        id: `INE-${String(nextNum).padStart(3, '0')}` 
      } as InsumoEnviado;
      setData([...data, newReg]);
      toast.success("Insumo enviado registrado", {
        style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
      });
    } else if (modalMode === 'edit' && current) {
      setData(data.map(d => d.id === current.id ? { ...d, ...formData } as InsumoEnviado : d));
      toast.success("Registro actualizado", {
        style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
      });
    }
    setModalMode(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteItem) return;
    setData(data.filter(d => d.id !== deleteItem.id));
    setDeleteItem(null);
    toast.success("Registro de insumo enviado eliminado", {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Insumos Enviados</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Gestión de insumos del taller enviados a clientes</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Buscar envío..."
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
            <Plus size={14} /> Nuevo envío
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, background: cardBg }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
              {['ID Envío', 'ID Remisión', 'Insumo', 'Cantidad', 'Fecha', 'Acciones'].map((h, i) => (
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
              filtered.map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: `${GOLD}1F`, color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                      {row.id}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', background: `${GOLD}1F`, color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                      {row.idRemision}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: `${GOLD}1F`, color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                        {row.idInsumo}
                      </span>
                      <span style={{ fontSize: 12, color: fg, fontWeight: 600 }}>{row.nombreInsumo}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 14, fontWeight: 700, color: fg }}>{row.cantidadEnviada}</td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 13, fontFamily: 'monospace', color: subtle }}>{row.fecha}</td>
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
              ))
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
                {modalMode === 'add' ? 'Registrar Insumo Enviado' : 'Editar Insumo Enviado'}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Remisión Asociada</label>
                <select 
                  value={formData.idRemision || ''} 
                  onChange={e => setFormData({...formData, idRemision: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}
                >
                  {remisiones.map(r => <option key={r.id} value={r.id}>{r.id} — Documento de envío</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Insumo a utilizar</label>
                <select 
                  value={formData.idInsumo || ''} 
                  onChange={handleInsumoChange}
                  style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}
                >
                  {insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.id} — {ins.nombre} (stock: {ins.stock})</option>)}
                </select>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Cantidad Enviada</label>
                  <input type="number" min="1" value={formData.cantidadEnviada || ''} onChange={e => setFormData({...formData, cantidadEnviada: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Fecha de Envío</label>
                  <input type="date" value={formData.fecha || ''} onChange={e => setFormData({...formData, fecha: e.target.value})} style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box' }} />
                </div>
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
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg }}>Detalle de Insumo Enviado</h3>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}><X size={18}/></button>
            </div>
            
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 6 }}>ID Envío</div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: GOLD }}>{current.id}</span>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Fecha de Envío</div>
                <div style={{ fontSize: 13, fontFamily: 'monospace', color: fg }}>{current.fecha}</div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 11, color: subtle, textTransform: 'uppercase' }}>Remisión Asociada:</div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: GOLD }}>{current.idRemision}</span>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 6 }}>ID Insumo</div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: GOLD }}>{current.idInsumo}</span>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Nombre Insumo</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{current.nombreInsumo}</div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, gridColumn: 'span 2', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Cantidad Enviada</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{current.cantidadEnviada}</div>
                <div style={{ fontSize: 11, color: subtle }}>unidades</div>
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
              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 8px' }}>¿Eliminar registro?</h3>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 16px' }}>Esta acción no se puede deshacer.</p>
              
              <div style={{ background: DANGER_BG, border: `1px solid ${DANGER}4D`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: DANGER_TXT, fontWeight: 600, marginBottom: 20, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color={DANGER} style={{ flexShrink: 0 }} />
                <span>Se eliminará el envío <strong>{deleteItem.id}</strong> permanentemente.</span>
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