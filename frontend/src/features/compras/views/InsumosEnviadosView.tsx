import React, { useEffect, useMemo, useState } from 'react';
import {
  Package, Pencil, Trash2, X,
  Search, AlertTriangle, Plus, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { mensajeError } from '../../../shared/utils/api';
import { insumoEnviadoService, type InsumoEnviado } from '../services/insumoEnviadoService';
import { remisionService, type Remision } from '../../ventas/services/remisionService';

// PALETA DE DISEÑO ESLABÓN
const GOLD       = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const DANGER     = "#DC3545";
const DANGER_BG  = "#FDECEA";
const DANGER_TXT = "#721c24";
const SUCCESS    = "#28A745";

// Mientras la remisión esté en uno de estos estados se pueden registrar o corregir insumos
const ESTADOS_EDITABLES = ['Pendiente', 'Aprobada', 'En producción'];
const UNIDADES = ['Unidad', 'Metros', 'Conos', 'Rollos', 'Pares'];

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
  variant?: 'gold' | 'danger';
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}> = ({ variant = 'gold', onClick, children, title, disabled = false }) => {
  const borderColor = disabled ? '#9A9A9A' : variant === 'danger' ? DANGER : GOLD;
  const iconColor = borderColor;

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: '50%',
        backgroundColor: 'transparent', border: `1.5px solid ${borderColor}`,
        color: iconColor, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.15s, background-color 0.15s'
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${borderColor}15`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
    >
      {children}
    </button>
  );
};

export const TableShell: React.FC<{ headers: string[]; children: React.ReactNode; dark?: boolean }> = ({ headers, children, dark }) => (
  <div style={{
    borderRadius: 12, overflow: 'hidden',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
    background: dark ? '#1E1E1E' : '#FFFFFF'
  }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'Montserrat, sans-serif' }}>
      <thead>
        <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
          {headers.map((h, i) => (
            <th key={i} style={{
              textTransform: 'uppercase', fontSize: 10, fontWeight: 700,
              color: GOLD, letterSpacing: '0.05em', padding: '12px 14px'
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const Modal: React.FC<{
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  onSave?: () => void;
  dark?: boolean;
  maxWidth?: string;
  children: React.ReactNode;
}> = ({ title, icon, onClose, onSave, dark, maxWidth = "650px", children }) => {
  const cardBg = dark ? '#1E1E1E' : '#FFFFFF';
  const fg = dark ? '#F8F9FA' : '#121212';
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24
    }}>
      <div style={{
        width: '100%', maxWidth, borderRadius: 16, backgroundColor: cardBg,
        border: `1px solid #C9A22740`, boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ height: 3, background: `linear-gradient(to right, #C9A227, #E6B84A, transparent)` }} />
        <div style={{
          padding: '16px 24px', borderBottom: `1px solid #C9A22725`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon}
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
        {onSave && (
          <div style={{
            padding: '16px 24px', borderTop: `1px solid #C9A22725`,
            display: 'flex', justifyContent: 'flex-end', gap: 12,
            backgroundColor: dark ? '#252525' : '#FAFAFA'
          }}>
            <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', background: dark ? '#2A2A2A' : '#EAEAEA', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={onSave} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, #C9A227, #E6B84A)`, color: '#121212', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; dark?: boolean; children: React.ReactNode }> = ({ label, dark, children }) => (
  <div style={{ width: '100%' }}>
    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dark ? '#9A9A9A' : '#6B6B6B', display: 'block', marginBottom: 6 }}>
      {label}
    </label>
    {children}
  </div>
);

interface InsumosEnviadosViewProps {
  dark?: boolean;
}

export const InsumosEnviadosView: React.FC<InsumosEnviadosViewProps> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');

  const [insumos, setInsumos] = useState<InsumoEnviado[]>([]);
  const [remisiones, setRemisiones] = useState<Remision[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // modalEdit = null: cerrado | 'nuevo': crear | InsumoEnviado: editar ese
  const [modalEdit, setModalEdit] = useState<InsumoEnviado | 'nuevo' | null>(null);
  const [modalDelete, setModalDelete] = useState<InsumoEnviado | null>(null);

  const [formRemision, setFormRemision] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCantidad, setFormCantidad] = useState<number | ''>('');
  const [formUnidad, setFormUnidad] = useState('Unidad');

  useEffect(() => {
    const cargar = async () => {
      try {
        const [lista, rems] = await Promise.all([insumoEnviadoService.listar(), remisionService.listar()]);
        setInsumos(lista);
        setRemisiones(rems);
      } catch (error) {
        toast.error(`No se pudieron cargar los insumos enviados: ${mensajeError(error)}`);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const remisionesAbiertas = remisiones.filter(r => ESTADOS_EDITABLES.includes(r.estado));
  const esEditable = (item: InsumoEnviado) => ESTADOS_EDITABLES.includes(item.estado_remision ?? '');

  const handleOpenNuevo = () => {
    setModalEdit('nuevo');
    setFormRemision(remisionesAbiertas[0]?.id_remision ?? '');
    setFormNombre('');
    setFormCantidad('');
    setFormUnidad('Unidad');
  };

  const handleOpenEdit = (item: InsumoEnviado) => {
    setModalEdit(item);
    setFormRemision(item.id_remision);
    setFormNombre(item.nombre);
    setFormCantidad(item.cantidad);
    setFormUnidad(item.unidad);
  };

  const handleSaveEdit = async () => {
    if (!formNombre.trim() || formCantidad === '' || Number(formCantidad) <= 0 || (modalEdit === 'nuevo' && !formRemision)) {
      toast.error('Por favor completa todos los campos correctamente');
      return;
    }
    if (modalEdit && modalEdit !== 'nuevo' && Number(formCantidad) < modalEdit.cantidad_usada) {
      toast.error(`Ya se usaron ${modalEdit.cantidad_usada} ${modalEdit.unidad} en producción: la cantidad no puede ser menor.`);
      return;
    }

    setGuardando(true);
    try {
      const datos = { nombre: formNombre.trim(), cantidad: Number(formCantidad), unidad: formUnidad };
      if (modalEdit === 'nuevo') {
        const nuevo = await insumoEnviadoService.crear({ ...datos, id_remision: formRemision });
        setInsumos([nuevo, ...insumos]);
        toast.success(`Insumo ${nuevo.id_insumo_enviado} registrado en la remisión ${nuevo.id_remision}`);
      } else if (modalEdit) {
        const actualizado = await insumoEnviadoService.actualizar(modalEdit.id_insumo_enviado, datos);
        setInsumos(insumos.map(i => i.id_insumo_enviado === actualizado.id_insumo_enviado ? actualizado : i));
        toast.success('Insumo enviado actualizado');
      }
      setModalEdit(null);
    } catch (error) {
      toast.error(mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!modalDelete) return;
    try {
      await insumoEnviadoService.eliminar(modalDelete.id_insumo_enviado);
      setInsumos(insumos.filter(i => i.id_insumo_enviado !== modalDelete.id_insumo_enviado));
      toast.success('Insumo eliminado correctamente');
    } catch (error) {
      toast.error(mensajeError(error));
    } finally {
      setModalDelete(null);
    }
  };

  const insumosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return insumos.filter(i =>
      i.nombre.toLowerCase().includes(q) ||
      i.id_remision.toLowerCase().includes(q) ||
      i.id_insumo_enviado.toLowerCase().includes(q) ||
      (i.cliente ?? '').toLowerCase().includes(q)
    );
  }, [insumos, busqueda]);

  // Lógica para seccionar los datos por página
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [busqueda]);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = insumosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(insumosFiltrados.length / itemsPerPage);

  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const bg = dark ? "#121212" : "#F8F9FA";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const inputEstilo: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: GOLD, fontFamily: 'Montserrat, sans-serif' }}>
            Insumos Enviados por Cliente
          </h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
            Materias primas que manda el cliente con cada remisión. Lo disponible baja al asignarlas en producción.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Buscar insumo, remisión o cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px', borderRadius: 8,
                border: `1px solid ${borderNormal}`, background: dark ? '#252525' : '#F8F8F8',
                color: fg, fontSize: 13, outline: 'none', fontFamily: 'Montserrat, sans-serif'
              }}
            />
          </div>
          <button onClick={handleOpenNuevo} disabled={remisionesAbiertas.length === 0} title={remisionesAbiertas.length === 0 ? 'No hay remisiones abiertas' : ''} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '8px 16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: remisionesAbiertas.length === 0 ? 0.5 : 1 }}>
            <Plus size={14} /> Registrar Insumo
          </button>
        </div>
      </div>

      {/* TABLA */}
      <TableShell headers={['ID INSUMO', 'ID REMISIÓN', 'CLIENTE', 'NOMBRE DEL INSUMO', 'ENVIADO', 'DISPONIBLE', 'ESTADO REMISIÓN', 'ACCIONES']} dark={dark}>
        {cargando ? (
          <tr>
            <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
              <Loader2 size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Cargando insumos...
            </td>
          </tr>
        ) : insumosFiltrados.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
              No se encontraron insumos enviados registrados.
            </td>
          </tr>
        ) : (
          currentItems.map((item) => {
            const editable = esEditable(item);
            return (
            <tr key={item.id_insumo_enviado} style={{ borderBottom: `1px solid ${borderNormal}` }}>
              <td style={{ padding: '12px 14px' }}><IdBadge id={item.id_insumo_enviado} /></td>
              <td style={{ padding: '12px 14px' }}><IdBadge id={item.id_remision} /></td>
              <td style={{ padding: '12px 14px', fontSize: 12, color: subtle }}>{item.cliente ?? '—'}</td>
              <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: fg }}>{item.nombre}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{item.cantidad} <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 500, color: subtle, fontSize: 11 }}>{item.unidad}</span></td>
              <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: item.cantidad_disponible === 0 ? DANGER : SUCCESS }}>{item.cantidad_disponible}</td>
              <td style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, color: subtle }}>{item.estado_remision ?? '—'}</td>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ActionCircleBtn variant="gold" onClick={() => handleOpenEdit(item)} disabled={!editable}
                    title={editable ? 'Editar' : 'La remisión ya está cerrada'}>
                    <Pencil size={14} />
                  </ActionCircleBtn>
                  <ActionCircleBtn variant="danger" onClick={() => setModalDelete(item)} disabled={!editable || item.cantidad_usada > 0}
                    title={!editable ? 'La remisión ya está cerrada' : item.cantidad_usada > 0 ? 'Ya se usó en producción' : 'Eliminar'}>
                    <Trash2 size={14} />
                  </ActionCircleBtn>
                </div>
              </td>
            </tr>
          )})
        )}
      </TableShell>

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

      {/* MODAL CREAR / EDITAR */}
      {modalEdit && (
        <Modal
          title={modalEdit === 'nuevo' ? 'Registrar Insumo Enviado' : `Editar Insumo ${modalEdit.id_insumo_enviado}`}
          icon={<Package size={16} color={GOLD} />}
          onClose={() => setModalEdit(null)}
          onSave={guardando ? undefined : handleSaveEdit}
          dark={dark}
          maxWidth="500px"
        >
          <Field label="Remisión asociada" dark={dark}>
            {modalEdit === 'nuevo' ? (
              <select value={formRemision} onChange={(e) => setFormRemision(e.target.value)} style={inputEstilo}>
                {remisionesAbiertas.map(r => (
                  <option key={r.id_remision} value={r.id_remision}>{r.id_remision} · {r.cliente} ({r.estado})</option>
                ))}
              </select>
            ) : (
              <input type="text" disabled value={`${modalEdit.id_remision} · ${modalEdit.cliente ?? ''}`}
                style={{ ...inputEstilo, backgroundColor: dark ? '#333' : '#EAEAEA', color: subtle, cursor: 'not-allowed' }} />
            )}
          </Field>
          <Field label="Nombre del Insumo" dark={dark}>
            <input type="text" value={formNombre} maxLength={100} onChange={(e) => setFormNombre(e.target.value)} placeholder="Ej. Botones blancos 4 huecos" style={inputEstilo} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Cantidad enviada" dark={dark}>
              <input type="number" min={1} value={formCantidad}
                onChange={(e) => setFormCantidad(e.target.value === '' ? '' : Number(e.target.value))} style={inputEstilo} />
            </Field>
            <Field label="Unidad" dark={dark}>
              <select value={formUnidad} onChange={(e) => setFormUnidad(e.target.value)} style={inputEstilo}>
                {(UNIDADES.includes(formUnidad) ? UNIDADES : [formUnidad, ...UNIDADES]).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          {modalEdit !== 'nuevo' && modalEdit.cantidad_usada > 0 && (
            <div style={{ fontSize: 12, color: subtle }}>
              Ya se usaron <b>{modalEdit.cantidad_usada} {modalEdit.unidad}</b> en producción; la cantidad no puede quedar por debajo de eso.
            </div>
          )}
        </Modal>
      )}

      {/* MODAL ELIMINAR */}
      {modalDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400, borderRadius: 16, backgroundColor: cardBg, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'center', paddingBottom: 24 }}>
            <div style={{ height: 4, background: DANGER }} />
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: DANGER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={28} color={DANGER} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 12px' }}>¿Eliminar insumo?</h3>
              <div style={{ background: DANGER_BG, border: `1px solid ${DANGER}4D`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: DANGER_TXT, fontWeight: 600, marginBottom: 20 }}>
                Se eliminará "{modalDelete.nombre}" de la remisión {modalDelete.id_remision}.
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setModalDelete(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', background: dark ? '#2A2A2A' : '#EAEAEA', color: fg, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={confirmarEliminar} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: DANGER, color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
