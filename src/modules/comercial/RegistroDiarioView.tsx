import React, { useState } from 'react';
import { 
  ClipboardList, Pencil, Trash2, X, 
  Search, AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';

const GOLD       = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const DANGER     = "#DC3545";
const DANGER_BG  = "#FDECEA";
const DANGER_TXT = "#721c24";

export interface RegistroDiarioAdmin {
  Id_registro_diario: string;
  empleado: string;
  pieza: string;
  maquina: string;
  Cantidad: number;
  Fecha: string;
}

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
}> = ({ variant = 'gold', onClick, children, title }) => {
  const borderColor = variant === 'danger' ? DANGER : GOLD;
  const iconColor = variant === 'danger' ? DANGER : GOLD;

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 32, height: 32, borderRadius: '50%',
        backgroundColor: 'transparent', border: `1.5px solid ${borderColor}`,
        color: iconColor, cursor: 'pointer', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.15s, background-color 0.15s'
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${borderColor}15`; }}
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
}> = ({ title, icon, onClose, onSave, dark, maxWidth = "500px", children }) => {
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
              Guardar Cambios
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

interface RegistroDiarioViewProps {
  dark?: boolean;
}

export const RegistroDiarioView: React.FC<RegistroDiarioViewProps> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');
  
  const [registros, setRegistros] = useState<RegistroDiarioAdmin[]>([
    { Id_registro_diario: 'REG-001', empleado: 'Juan Pérez', pieza: 'Manga Larga', maquina: 'Plana Industrial', Cantidad: 45, Fecha: '2026-09-26' },
    { Id_registro_diario: 'REG-002', empleado: 'María Rodríguez', pieza: 'Cuello Polo', maquina: 'Fileteadora', Cantidad: 60, Fecha: '2026-09-27' }
  ]);

  const [modalEdit, setModalEdit] = useState<RegistroDiarioAdmin | null>(null);
  const [modalDelete, setModalDelete] = useState<RegistroDiarioAdmin | null>(null);

  // Estados del formulario de edición
  const [formCantidad, setFormCantidad] = useState<number | ''>('');
  const [formFecha, setFormFecha] = useState('');

  const handleOpenEdit = (item: RegistroDiarioAdmin) => {
    setModalEdit(item);
    setFormCantidad(item.Cantidad);
    setFormFecha(item.Fecha);
  };

  const handleSaveEdit = () => {
    if (formCantidad === '' || Number(formCantidad) <= 0) {
      toast.error('Ingresa una cantidad válida mayor a 0');
      return;
    }

    if (modalEdit) {
      setRegistros(registros.map(r => r.Id_registro_diario === modalEdit.Id_registro_diario ? {
        ...r,
        Cantidad: Number(formCantidad),
        Fecha: formFecha
      } : r));
      toast.success('Registro diario actualizado correctamente');
      setModalEdit(null);
    }
  };

  const registrosFiltrados = registros.filter(r =>
    r.Id_registro_diario.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.empleado.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.pieza.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.Fecha.includes(busqueda)
  );

  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div style={{ backgroundColor: dark ? "#121212" : "#F8F9FA", color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: GOLD, fontFamily: 'Montserrat, sans-serif' }}>
            Registro Diario de Producción — Administrador
          </h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
            Control global, búsqueda, edición y auditoría de los registros de producción
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Buscar por empleado, pieza o fecha..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px', borderRadius: 8,
                border: `1px solid ${borderNormal}`, background: dark ? '#252525' : '#F8F8F8',
                color: fg, fontSize: 13, outline: 'none', fontFamily: 'Montserrat, sans-serif'
              }}
            />
          </div>
        </div>
      </div>

      <TableShell headers={['ID REGISTRO', 'EMPLEADO', 'PIEZA', 'MÁQUINA', 'CANTIDAD', 'FECHA', 'ACCIONES']} dark={dark}>
        {registrosFiltrados.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
              0 resultados encontrados.
            </td>
          </tr>
        ) : (
          registrosFiltrados.map((item) => (
            <tr key={item.Id_registro_diario} style={{ borderBottom: `1px solid ${borderNormal}` }}>
              <td style={{ padding: '12px 14px' }}><IdBadge id={item.Id_registro_diario} /></td>
              <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: fg }}>{item.empleado}</td>
              <td style={{ padding: '12px 14px', fontSize: 13, color: fg }}>{item.pieza}</td>
              <td style={{ padding: '12px 14px', fontSize: 12, color: subtle }}>{item.maquina}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{item.Cantidad}</td>
              <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: subtle }}>{item.Fecha}</td>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ActionCircleBtn variant="gold" onClick={() => handleOpenEdit(item)} title="Editar">
                    <Pencil size={14} />
                  </ActionCircleBtn>
                  <ActionCircleBtn variant="danger" onClick={() => setModalDelete(item)} title="Eliminar">
                    <Trash2 size={14} />
                  </ActionCircleBtn>
                </div>
              </td>
            </tr>
          ))
        )}
      </TableShell>

      {/* MODAL EDITAR */}
      {modalEdit && (
        <Modal
          title="Editar Registro Diario"
          icon={<ClipboardList size={16} color={GOLD} />}
          onClose={() => setModalEdit(null)}
          onSave={handleSaveEdit}
          dark={dark}
          maxWidth="450px"
        >
          <Field label="Empleado / Tarea" dark={dark}>
            <input
              type="text"
              disabled
              value={`${modalEdit.empleado} - ${modalEdit.pieza}`}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: dark ? '#333' : '#EAEAEA', color: subtle, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }}
            />
          </Field>
          <Field label="Cantidad Producida" dark={dark}>
            <input
              type="number"
              value={formCantidad}
              onChange={(e) => setFormCantidad(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
            />
          </Field>
          <Field label="Fecha" dark={dark}>
            <input
              type="date"
              value={formFecha}
              onChange={(e) => setFormFecha(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
            />
          </Field>
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
              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 12px' }}>¿Eliminar registro diario?</h3>
              <div style={{ background: DANGER_BG, border: `1px solid ${DANGER}4D`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: DANGER_TXT, fontWeight: 600, marginBottom: 20 }}>
                Esta acción retirará el registro de producción de la base de datos de forma irreversible.
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setModalDelete(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', background: dark ? '#2A2A2A' : '#EAEAEA', color: fg, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={() => {
                  setRegistros(registros.filter(r => r.Id_registro_diario !== modalDelete.Id_registro_diario));
                  setModalDelete(null);
                  toast.success('Registro diario eliminado correctamente');
                }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: DANGER, color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};