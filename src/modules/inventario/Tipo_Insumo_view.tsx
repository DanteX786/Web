import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// CONSTANTES DE DISEÑO - SISTEMA STITCHER
// ==========================================
const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const DANGER = "#DC3545";
const DANGER_BG = "#FDECEA";
const DANGER_TXT = "#721c24";
const SUCCESS_BG = "#DCF7E6";
const SUCCESS_TXT = "#155724";

interface TipoInsumo {
  id: string;
  nombre: string;
  descripcion: string;
}

interface Props {
  dark?: boolean;
}

export const TipoInsumoView: React.FC<Props> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');
  
  // Lista inicial de registros
  const [tipos, setTipos] = useState<TipoInsumo[]>([
    { id: 'TIPI-001', nombre: 'Armado', descripcion: 'Insumos principales para la estructura y costura base de la prenda' },
    { id: 'TIPI-002', nombre: 'Detalle', descripcion: 'Elementos decorativos, ajustes o componentes visibles' },
    { id: 'TIPI-003', nombre: 'Acabado', descripcion: 'Insumos destinados al empaque, presentación y terminación final' },
    { id: 'TIPI-004', nombre: 'Textil', descripcion: 'Tejidos y telas auxiliares para refuerzos internos' },
    { id: 'TIPI-005', nombre: 'Metalería', descripcion: 'Broches, hebillas y herrajes metálicos especializados' },
    { id: 'TIPI-006', nombre: 'Elásticos', descripcion: 'Bandas elásticas y resortes para pretinas y puños' },
    { id: 'TIPI-007', nombre: 'Cintas', descripcion: 'Cintas decorativas, sesgos y listones de refuerzo' },
    { id: 'TIPI-008', nombre: 'Etiquetado', descripcion: 'Marquillas, etiquetas de composición y tallas' },
    { id: 'TIPI-009', nombre: 'Adhesivos', descripcion: 'Entretelas termoadhesivas y pegamentos textiles' },
    { id: 'TIPI-010', nombre: 'Empaque', descripcion: 'Bolsas plásticas, ganchos y protectores de envío' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formId, setFormId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [deleteItem, setDeleteItem] = useState<TipoInsumo | null>(null);

  const bg = dark ? "#121212" : "#F8F9FA";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const handleOpenCreate = () => {
    setEditingId(null);
    const nextNum = tipos.length + 1;
    const autoId = `TIPI-${String(nextNum).padStart(3, '0')}`;
    setFormId(autoId);
    setNombre('');
    setDescripcion('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tipo: TipoInsumo) => {
    setEditingId(tipo.id);
    setFormId(tipo.id);
    setNombre(tipo.nombre);
    setDescripcion(tipo.descripcion);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio', {
        style: { background: DANGER_BG, border: `1px solid ${DANGER}`, color: DANGER_TXT, fontFamily: 'Montserrat, sans-serif' }
      });
      return;
    }

    if (editingId) {
      setTipos(tipos.map(t => t.id === editingId ? {
        ...t,
        nombre,
        descripcion
      } : t));
      toast.success('Tipo de insumo actualizado correctamente', {
        style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
      });
    } else {
      setTipos([...tipos, {
        id: formId,
        nombre,
        descripcion
      }]);
      toast.success('Tipo de insumo creado correctamente', {
        style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
      });
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteItem) return;
    setTipos(tipos.filter(t => t.id !== deleteItem.id));
    setDeleteItem(null);
    toast.success('Tipo de insumo eliminado', {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  const tiposFiltrados = tipos.filter(t =>
    t.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    t.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    t.id.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO DEL MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Tipos de Insumos</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Clasificación y categorización de materiales</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: 220, padding: '8px 12px 8px 36px', borderRadius: 8,
                border: `1px solid ${borderNormal}`, background: surfaceBg, color: fg,
                fontSize: 13, outline: 'none', fontFamily: 'Montserrat, sans-serif', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => { e.target.style.borderColor = GOLD; }}
              onBlur={(e) => { e.target.style.borderColor = borderNormal; }}
            />
          </div>

          <button
            onClick={handleOpenCreate}
            style={{
              background: `linear-gradient(135deg, #C9A227, ${GOLD}, ${GOLD_LIGHT})`,
              color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10,
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif'
            }}
          >
            <Plus size={14} /> Nuevo tipo
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        background: cardBg
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                ID Tip. Insumo
              </th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                Nombre
              </th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                Descripción
              </th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {tiposFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: subtle, fontSize: 13 }}>
                  No se encontraron registros.
                </td>
              </tr>
            ) : (
              tiposFiltrados.map((tipo) => (
                <tr key={tipo.id} style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                  
                  <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: `${GOLD}1F`, color: GOLD,
                      fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 6
                    }}>
                      {tipo.id}
                    </span>
                  </td>

                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: 600, fontSize: 13, color: fg }}>
                    {tipo.nombre}
                  </td>

                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 12, color: subtle, maxWidth: 450 }}>
                    {tipo.descripcion}
                  </td>

                  <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                    {/* BOTONES CIRCULARES CON BORDE DORADO */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        onClick={() => handleOpenEdit(tipo)}
                        title="Editar"
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          backgroundColor: 'transparent',
                          border: `1.5px solid ${GOLD}`,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: fg, transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${GOLD}1A`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Pencil size={14} color={fg} />
                      </button>

                      <button
                        onClick={() => setDeleteItem(tipo)}
                        title="Eliminar"
                        style={{
                          width: 32, height: 32, borderRadius: '50%',
                          backgroundColor: 'transparent',
                          border: `1.5px solid ${GOLD}`,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: fg, transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${GOLD}1A`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Trash2 size={14} color={fg} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: subtle, marginTop: 12 }}>
        {tiposFiltrados.length} registros encontrados
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div style={{
            width: '100%', maxWidth: 500, borderRadius: 16, backgroundColor: cardBg,
            border: `1px solid ${GOLD}40`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />

            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif' }}>
                {editingId ? 'Editar Tipo de Insumo' : 'Nuevo Tipo de Insumo'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtle
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: subtle, display: 'block', marginBottom: 6 }}>
                    ID (Auto)
                  </label>
                  <input
                    type="text"
                    value={formId}
                    disabled
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                      backgroundColor: dark ? '#222222' : '#EFEFEF', color: subtle, border: `1px solid ${borderNormal}`,
                      outline: 'none', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box', cursor: 'not-allowed'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: subtle, display: 'block', marginBottom: 6 }}>
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Armado"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                      backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`,
                      outline: 'none', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = GOLD; }}
                    onBlur={(e) => { e.target.style.borderColor = borderNormal; }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: subtle, display: 'block', marginBottom: 6 }}>
                  Descripción
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del tipo de insumo"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                    backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`,
                    outline: 'none', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = GOLD; }}
                  onBlur={(e) => { e.target.style.borderColor = borderNormal; }}
                />
              </div>

              <div style={{ padding: '16px 24px', margin: '-20px -24px -20px', marginTop: 12, borderTop: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: dark ? '#252525' : '#FAFAFA' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none',
                    background: dark ? '#2A2A2A' : '#E8E8E8', color: fg,
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 24px', borderRadius: 8, border: 'none',
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteItem && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16
        }}>
          <div style={{
            width: '100%', maxWidth: 400, borderRadius: 16, backgroundColor: cardBg,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'center', paddingBottom: 24
          }}>
            <div style={{ height: 4, background: `linear-gradient(135deg, ${DANGER}, #f56565)` }} />

            <div style={{ padding: '24px 24px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: DANGER_BG,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <AlertTriangle size={28} color={DANGER} />
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 8px' }}>
                ¿Eliminar tipo de insumo?
              </h3>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 16px' }}>
                Esta acción no se puede deshacer.
              </p>

              <div style={{
                background: DANGER_BG, border: `1px solid ${DANGER}4D`,
                borderRadius: 10, padding: '10px 14px', fontSize: 12,
                color: DANGER_TXT, fontWeight: 600, marginBottom: 20, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <AlertTriangle size={14} color={DANGER} style={{ flexShrink: 0 }} />
                <span>Se eliminará el registro <strong>{deleteItem.nombre}</strong> permanentemente.</span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setDeleteItem(null)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                    background: dark ? '#2A2A2A' : '#E8E8E8', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                    background: DANGER, color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};