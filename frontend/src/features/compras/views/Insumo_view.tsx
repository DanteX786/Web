import React, { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { mensajeError } from '../../../shared/utils/api';
import { insumoService, type Insumo as InsumoApi, type TipoInsumo } from '../services/insumoService';

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

const ESTILO_ERROR = { background: DANGER_BG, border: `1px solid ${DANGER}`, color: DANGER_TXT, fontFamily: 'Montserrat, sans-serif' };
const ESTILO_OK = { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' };
const notificarError = (msg: string) => toast.error(msg, { style: ESTILO_ERROR });
const notificarOk = (msg: string) => toast.success(msg, { style: ESTILO_OK });

const STOCK_BAJO = 10;

interface Insumo {
  id: string;
  nombre: string;
  descripcion: string;
  stock: number;
  tipoId: string;
  tipoNombre: string;
}

interface Props {
  dark?: boolean;
}

/** Convierte un insumo de la API al formato que usa esta vista. */
const aInsumo = (i: InsumoApi): Insumo => ({
  id: i.id,
  nombre: i.nombre,
  descripcion: i.descripcion ?? '',
  stock: i.stock,
  tipoId: i.tipo_id ?? '',
  tipoNombre: i.tipo_nombre ?? '',
});

export const InsumosView: React.FC<Props> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');
  
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [tiposDisponibles, setTiposDisponibles] = useState<TipoInsumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formId, setFormId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [stock, setStock] = useState<number | ''>('');
  const [tipoIdSeleccionado, setTipoIdSeleccionado] = useState('');
  const [deleteItem, setDeleteItem] = useState<Insumo | null>(null);

  // CARGA INICIAL + NOTIFICACIÓN AUTOMÁTICA DE STOCK BAJO
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const [lista, tipos] = await Promise.all([
          insumoService.listar(),
          insumoService.listarTipos(),
        ]);
        setInsumos(lista.map(aInsumo));
        setTiposDisponibles(tipos);

        const insumosBajos = lista.filter(i => i.stock <= STOCK_BAJO);
        if (insumosBajos.length > 0) {
          toast.warning(`¡Atención! Hay ${insumosBajos.length} insumo(s) con stock bajo en el taller.`, {
            style: ESTILO_ERROR
          });
        }
      } catch (e) {
        notificarError(mensajeError(e));
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const bg = dark ? "#121212" : "#F8F9FA";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormId('Se genera al guardar');
    setNombre('');
    setDescripcion('');
    setStock('');
    setTipoIdSeleccionado(tiposDisponibles[0]?.id ?? '');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (insumo: Insumo) => {
    setEditingId(insumo.id);
    setFormId(insumo.id);
    setNombre(insumo.nombre);
    setDescripcion(insumo.descripcion);
    setStock(insumo.stock);
    setTipoIdSeleccionado(insumo.tipoId);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!nombre.trim()) {
      notificarError('El nombre es obligatorio');
      return;
    }

    if (!editingId && (stock === '' || Number(stock) < 0 || !Number.isInteger(Number(stock)))) {
      notificarError('Ingrese un stock válido (número entero, 0 o mayor)');
      return;
    }

    if (!tipoIdSeleccionado) {
      notificarError('Seleccione un tipo de insumo');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // El stock no se envía: lo modifican las compras y la producción
        const actualizado = await insumoService.actualizar(editingId, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          tipo_id: tipoIdSeleccionado,
        });
        setInsumos(prev => prev.map(i => i.id === editingId ? aInsumo(actualizado) : i));
        notificarOk('Insumo actualizado correctamente');
      } else {
        const nuevo = await insumoService.crear({
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          stock: Number(stock),
          tipo_id: tipoIdSeleccionado,
        });
        setInsumos(prev => [...prev, aInsumo(nuevo)]);
        notificarOk('Insumo creado correctamente');
      }
      setIsModalOpen(false);
    } catch (err) {
      notificarError(mensajeError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await insumoService.eliminar(deleteItem.id);
      setInsumos(prev => prev.filter(i => i.id !== deleteItem.id));
      notificarOk('Insumo eliminado');
    } catch (err) {
      notificarError(mensajeError(err));
    } finally {
      setDeleteItem(null);
    }
  };

  const insumosFiltrados = insumos.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    i.tipoNombre.toLowerCase().includes(busqueda.toLowerCase())
  );
     
  // Lógica para seccionar los datos por página
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = insumosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(insumosFiltrados.length / itemsPerPage);

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO DEL MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Insumos</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Materiales e insumos disponibles en el taller</p>
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
            <Plus size={14} /> Nuevo insumo
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
                ID Insumo
              </th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                Nombre
              </th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                Descripción
              </th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                Stock
              </th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                ID Tip. Insumo
              </th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: subtle, fontSize: 13 }}>
                  {loading ? 'Cargando insumos...' : 'No se encontraron registros.'}
                </td>
              </tr>
            ) : (
              currentItems.map((insumo) => {
                const stockBajo = insumo.stock <= STOCK_BAJO;
                return (
                  <tr key={insumo.id} style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                    
                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        background: `${GOLD}1F`, color: GOLD,
                        fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                        padding: '3px 8px', borderRadius: 6
                      }}>
                        {insumo.id}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: 600, fontSize: 13, color: fg }}>
                      {insumo.nombre}
                    </td>

                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 12, color: subtle, maxWidth: 320 }}>
                      {insumo.descripcion}
                    </td>

                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: 700, fontSize: 13, color: stockBajo ? DANGER : fg }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {insumo.stock}
                        {stockBajo && <AlertTriangle size={14} color={DANGER} />}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          background: `${GOLD}1F`, color: GOLD,
                          fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                          padding: '3px 8px', borderRadius: 6
                        }}>
                          {insumo.tipoId}
                        </span>
                        <span style={{ fontSize: 12, color: subtle, fontWeight: 500 }}>
                          {insumo.tipoNombre}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <button
                          onClick={() => handleOpenEdit(insumo)}
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
                          onClick={() => setDeleteItem(insumo)}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px' }}>
        <span style={{ fontSize: 12, color: subtle, fontFamily: 'Montserrat, sans-serif' }}>
          Mostrando de {insumosFiltrados.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, insumosFiltrados.length)} de {insumosFiltrados.length} registros
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
                {editingId ? 'Editar Insumo' : 'Nuevo Insumo'}
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
                    placeholder="Ej: Hilo de coser"
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
                  placeholder="Descripción del insumo"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: subtle, display: 'block', marginBottom: 6 }}>
                    {editingId ? 'Stock actual' : 'Stock Inicial'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={stock}
                    disabled={!!editingId}
                    title={editingId ? 'El stock se actualiza con las compras y la producción' : undefined}
                    onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ej: 20"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                      backgroundColor: editingId ? (dark ? '#222222' : '#EFEFEF') : inputBg,
                      color: editingId ? subtle : fg, border: `1px solid ${borderNormal}`,
                      cursor: editingId ? 'not-allowed' : 'text',
                      outline: 'none', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = GOLD; }}
                    onBlur={(e) => { e.target.style.borderColor = borderNormal; }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: subtle, display: 'block', marginBottom: 6 }}>
                    Tipo de Insumo
                  </label>
                  <select
                    value={tipoIdSeleccionado}
                    onChange={(e) => setTipoIdSeleccionado(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                      backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`,
                      outline: 'none', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    {tiposDisponibles.length === 0 && <option value="">Sin tipos registrados</option>}
                    {tiposDisponibles.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} - {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
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
                  disabled={saving}
                  style={{
                    padding: '8px 24px', borderRadius: 8, border: 'none',
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif'
                  }}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
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
                ¿Eliminar insumo?
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
                <span>Se eliminará el insumo <strong>{deleteItem.nombre}</strong> permanentemente.</span>
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