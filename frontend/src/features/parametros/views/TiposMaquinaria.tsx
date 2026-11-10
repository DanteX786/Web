import React, { useState, useEffect } from 'react';
import { Search, Plus, X, AlertTriangle, Pencil, Trash2, Eye, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { tipoMaquinaService, type TipoMaquina, type EstadoTipo } from '../services/tipoMaquinaService';
import { mensajeError } from '../../../shared/utils/api';

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const BLUE = "#4A90E2";
const DANGER = "#DC3545";
const DANGER_BG = "#FDECEA";
const DANGER_TXT = "#721c24";
const SUCCESS_BG = "#DCF7E6";
const SUCCESS_TXT = "#155724";

const estiloError = { background: DANGER_BG, border: `1px solid ${DANGER}`, color: DANGER_TXT, fontFamily: 'Montserrat, sans-serif' };
const estiloExito = { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' };

interface Props {
  dark?: boolean;
}

export default function TipoMaquinaCRUD({ dark = false }: Props) {
  const bg = dark ? "#121212" : "#F8F9FA";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const [data, setData] = useState<TipoMaquina[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [current, setCurrent] = useState<TipoMaquina | null>(null);
  const [deleteItem, setDeleteItem] = useState<TipoMaquina | null>(null);
  const [formData, setFormData] = useState<Partial<TipoMaquina>>({ estado: 'Activo' });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Carga inicial desde el backend
  useEffect(() => {
    tipoMaquinaService.listar()
      .then(setData)
      .catch((e) => toast.error(mensajeError(e), { style: estiloError }));
  }, []);

  const filtered = data.filter(item =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.id_tipo_de_maquina.toLowerCase().includes(busqueda.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const openAdd = () => {
    setCurrent(null);
    setFormData({ nombre: '', descripcion: '', estado: 'Activo' });
    setModalMode('add');
  };

  const openEdit = (item: TipoMaquina) => {
    setCurrent(item);
    setFormData(item);
    setModalMode('edit');
  };

  const openView = (item: TipoMaquina) => {
    setCurrent(item);
    setModalMode('view');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre?.trim()) {
      toast.error("El nombre del tipo de máquina es obligatorio", { style: estiloError });
      return;
    }

    // El id no se envía: lo genera la base de datos
    const datos = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      estado: formData.estado,
    };

    try {
      if (modalMode === 'add') {
        const creado = await tipoMaquinaService.crear(datos);
        setData(prev => [...prev, creado]);
        toast.success(`Tipo de máquina ${creado.id_tipo_de_maquina} registrado`, { style: estiloExito });
      } else if (modalMode === 'edit' && current) {
        const actualizado = await tipoMaquinaService.actualizar(current.id_tipo_de_maquina, datos);
        setData(prev => prev.map(d => d.id_tipo_de_maquina === actualizado.id_tipo_de_maquina ? actualizado : d));
        toast.success("Tipo de máquina actualizado", { style: estiloExito });
      }
      setModalMode(null);
    } catch (e) {
      // Se deja el modal abierto para que el usuario corrija
      toast.error(mensajeError(e), { style: estiloError });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await tipoMaquinaService.eliminar(deleteItem.id_tipo_de_maquina);
      setData(prev => prev.filter(d => d.id_tipo_de_maquina !== deleteItem.id_tipo_de_maquina));
      toast.success("Tipo de máquina eliminado", { style: estiloExito });
    } catch (e) {
      toast.error(mensajeError(e), { style: estiloError });
    } finally {
      setDeleteItem(null);
    }
  };

  const handleStateChangeInline = async (id: string, nuevoEstado: EstadoTipo) => {
    try {
      const actualizado = await tipoMaquinaService.cambiarEstado(id, nuevoEstado);
      setData(prev => prev.map(d => d.id_tipo_de_maquina === id ? actualizado : d));
      toast.success(`Estado cambiado a "${nuevoEstado}"`, { style: estiloExito });
    } catch (e) {
      toast.error(mensajeError(e), { style: estiloError });
    }
  };

  const getEstadoBadgeStyle = (estado: EstadoTipo) => {
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
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Tipos de Máquina</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Gestión y estandarización de capacidades del taller (PB-39)</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Buscar tipo de máquina..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: 240, padding: '8px 12px 8px 36px', borderRadius: 8,
                border: `1px solid ${borderNormal}`, background: surfaceBg, color: fg,
                fontSize: 13, outline: 'none', fontFamily: 'Montserrat, sans-serif'
              }}
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
            <Plus size={14} /> Nuevo Tipo
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, background: cardBg }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
              {['ID', 'Nombre', 'Descripción', 'Estado', 'Acciones'].map((h, i) => (
                <th key={h} style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', textAlign: i === 4 ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: subtle, fontSize: 13 }}>
                  No se encontraron registros de tipos de máquina.
                </td>
              </tr>
            ) : (
             currentItems.map((row) => {
                const badgeStyle = getEstadoBadgeStyle(row.estado);
                return (
                  <tr key={row.id_tipo_de_maquina} style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', background: `${GOLD}1F`, color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                        {row.id_tipo_de_maquina}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: 600, fontSize: 13, color: fg }}>{row.nombre}</td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 13, color: subtle }}>{row.descripcion || 'Sin descripción'}</td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                        <select
                          value={row.estado}
                          onChange={(e) => handleStateChangeInline(row.id_tipo_de_maquina, e.target.value as EstadoTipo)}
                          style={{
                            background: badgeStyle?.bg, color: badgeStyle?.color, border: 'none',
                            borderRadius: 999, padding: '5px 24px 5px 12px', fontSize: 12,
                            fontWeight: 700, cursor: 'pointer', outline: 'none',
                            fontFamily: 'Montserrat, sans-serif', appearance: 'none'
                          }}
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                        <ChevronDown size={13} color={badgeStyle?.color} style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button onClick={() => openView(row)} title="Ver" style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent', border: `1.5px solid ${BLUE}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Eye size={14} color={BLUE} />
                        </button>
                        <button onClick={() => openEdit(row)} title="Editar" style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent', border: `1.5px solid ${GOLD}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Pencil size={14} color={GOLD} />
                        </button>
                        <button onClick={() => setDeleteItem(row)} title="Eliminar" style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent', border: `1.5px solid ${GOLD}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* PAGINACIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <div style={{ fontSize: 13, color: subtle }}>
          Mostrando de {filtered.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filtered.length)} de {filtered.length} registros
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: surfaceBg, color: currentPage === 1 ? subtle : fg, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Anterior
          </button>

          <span style={{ fontSize: 13, color: fg, fontWeight: 600, padding: '0 8px' }}>
            Página {currentPage} de {totalPages || 1}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            style={{ padding: '6px 16px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: surfaceBg, color: currentPage === totalPages || totalPages === 0 ? subtle : fg, cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif' }}>
                {modalMode === 'add' ? 'Registrar Tipo de Máquina' : 'Editar Tipo de Máquina'}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}><X size={18}/></button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Nombre de la Máquina</label>
                <input value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Plana, Fileteadora..." style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Descripción</label>
                <textarea value={formData.descripcion || ''} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Detalle técnico de la máquina" style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box', height: 80, resize: 'none', fontFamily: 'Montserrat, sans-serif' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Estado</label>
                <select
                  value={formData.estado || 'Activo'}
                  onChange={e => setFormData({...formData, estado: e.target.value as EstadoTipo})}
                  style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
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
          <div style={{ width: '100%', maxWidth: 400, borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg }}>Detalle de la Máquina</h3>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}><X size={18}/></button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>ID Tipo de Máquina</div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: GOLD }}>{current.id_tipo_de_maquina}</span>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Nombre</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: GOLD }}>{current.nombre}</div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Descripción</div>
                <div style={{ fontSize: 13, color: fg }}>{current.descripcion || 'Sin descripción'}</div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Estado</div>
                <span style={{ ...getEstadoBadgeStyle(current.estado), padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-block' }}>{current.estado}</span>
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
              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 8px' }}>¿Eliminar tipo de máquina?</h3>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 16px' }}>Esta acción no se puede deshacer.</p>

              <div style={{ background: DANGER_BG, border: `1px solid ${DANGER}4D`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: DANGER_TXT, fontWeight: 600, marginBottom: 20, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color={DANGER} style={{ flexShrink: 0 }} />
                <span>Se eliminará el tipo <strong>{deleteItem.nombre}</strong> permanentemente.</span>
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

