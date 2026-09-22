import React, { useState } from 'react';
import { 
  Plus, Trash2, Pencil, X, Search, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// PALETA DE COLORES - SISTEMA DE DISEÑO BASE
// ==========================================
const GOLD         = "#C9A227";
const GOLD_LIGHT   = "#E6B84A";
const DANGER       = "#DC3545";
const DANGER_BG    = "#FDECEA";
const DANGER_TXT   = "#721c24";
const SUCCESS      = "#28A745";
const SUCCESS_BG   = "#DCF7E6";
const SUCCESS_TXT  = "#155724";

export interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  direccion: string;
  correo: string;
  telefono: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

// ==========================================
// COMPONENTES DE DISEÑO BASE COMPARTIDOS
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

export const TableShell: React.FC<{
  headers: string[];
  children: React.ReactNode;
  dark?: boolean;
}> = ({ headers, children, dark }) => (
  <div style={{
    borderRadius: 12, overflowX: 'auto',
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

export const Field: React.FC<{ label: string; dark?: boolean; children: React.ReactNode }> = ({ label, dark, children }) => (
  <div style={{ width: '100%' }}>
    <label style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      color: dark ? '#9A9A9A' : '#6B6B6B', display: 'block', marginBottom: 6
    }}>
      {label}
    </label>
    {children}
  </div>
);

export const ModuleHeader: React.FC<{
  title: string;
  subtitle: string;
  onAdd: () => void;
  addLabel: string;
  search: string;
  onSearch: (val: string) => void;
  dark?: boolean;
}> = ({ title, subtitle, onAdd, addLabel, search, onSearch, dark }) => {
  const fg = dark ? '#F8F9FA' : '#121212';
  const subtle = dark ? '#9A9A9A' : '#6B6B6B';
  const surfaceBg = dark ? '#252525' : '#F8F8F8';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg, fontFamily: 'Montserrat, sans-serif' }}>{title}</h2>
        <p style={{ fontSize: 13, color: subtle, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px', borderRadius: 8,
              border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              background: surfaceBg, color: fg, fontSize: 13, outline: 'none',
              fontFamily: 'Montserrat, sans-serif'
            }}
          />
        </div>
        <button
          onClick={onAdd}
          style={{
            background: `linear-gradient(135deg, #C9A227, ${GOLD}, ${GOLD_LIGHT})`,
            color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10,
            padding: '8px 16px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif'
          }}
        >
          <Plus size={16} /> {addLabel}
        </button>
      </div>
    </div>
  );
};

export const ConfirmDelete: React.FC<{
  onCancel: () => void;
  onConfirm: () => void;
  message: string;
  dark?: boolean;
}> = ({ onCancel, onConfirm, message, dark }) => {
  const cardBg = dark ? '#1E1E1E' : '#FFFFFF';
  const fg = dark ? '#F8F9FA' : '#121212';
  return (
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
          <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 12px', fontFamily: 'Montserrat, sans-serif' }}>
            ¿Eliminar cliente?
          </h3>
          <div style={{
            background: DANGER_BG, border: `1px solid ${DANGER}4D`,
            borderRadius: 10, padding: '10px 14px', fontSize: 12,
            color: DANGER_TXT, fontWeight: 600, marginBottom: 20
          }}>
            Esta acción eliminará el registro del cliente de forma permanente.
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)',
                background: dark ? '#2A2A2A' : '#EAEAEA', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                toast.success(message);
              }}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: DANGER, color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer'
              }}
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL: CLIENTES VIEW
// ==========================================
interface ClientesViewProps {
  dark?: boolean;
}

export const ClientesView: React.FC<ClientesViewProps> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([
    { id: '00-1', nombre: 'QueNOTA', identificacion: '10458231', direccion: 'Cra 45 #20-432', correo: 'guenota@gmail.com', telefono: '3049820982', estado: 'ACTIVO' },
    { id: '00-2', nombre: 'Offcors', identificacion: '9032145', direccion: 'Cra 43 #43s', correo: 'offcors@gmail.com', telefono: '3092903093', estado: 'ACTIVO' },
    { id: '00-3', nombre: 'Nike', identificacion: '8801234', direccion: 'Cra 48 #99', correo: 'nike@gmail.com', telefono: '90980981', estado: 'ACTIVO' }
  ]);

  const [modalForm, setModalForm] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);
  const [modalDelete, setModalDelete] = useState<Cliente | null>(null);

  // Estados del formulario
  const [formNombre, setFormNombre] = useState('');
  const [formIdentificacion, setFormIdentificacion] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEstado, setFormEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');

  const abrirFormulario = (cli?: Cliente) => {
    if (cli) {
      setClienteEditar(cli);
      setFormNombre(cli.nombre);
      setFormIdentificacion(cli.identificacion);
      setFormDireccion(cli.direccion);
      setFormCorreo(cli.correo);
      setFormTelefono(cli.telefono);
      setFormEstado(cli.estado);
    } else {
      setClienteEditar(null);
      setFormNombre('');
      setFormIdentificacion('');
      setFormDireccion('');
      setFormCorreo('');
      setFormTelefono('');
      setFormEstado('ACTIVO');
    }
    setModalForm(true);
  };

  const handleGuardarCliente = () => {
    if (!formNombre.trim() || !formIdentificacion.trim()) {
      toast.error('Completa los campos obligatorios (Nombre e Identificación)');
      return;
    }

    if (clienteEditar) {
      setClientes(clientes.map(c => c.id === clienteEditar.id ? {
        ...c,
        nombre: formNombre,
        identificacion: formIdentificacion,
        direccion: formDireccion,
        correo: formCorreo,
        telefono: formTelefono,
        estado: formEstado
      } : c));
      toast.success('Cliente actualizado exitosamente');
    } else {
      const nextNum = clientes.length + 1;
      const nuevoId = `00-${nextNum}`;
      const nuevoCliente: Cliente = {
        id: nuevoId,
        nombre: formNombre,
        identificacion: formIdentificacion,
        direccion: formDireccion,
        correo: formCorreo,
        telefono: formTelefono,
        estado: formEstado
      };
      setClientes([...clientes, nuevoCliente]);
      toast.success('Nuevo cliente registrado con éxito');
    }
    setModalForm(false);
  };

  const handleEstadoInline = (id: string, nuevoEstado: 'ACTIVO' | 'INACTIVO') => {
    setClientes(clientes.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    toast.success(`Estado actualizado a ${nuevoEstado}`);
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.identificacion.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const bg = dark ? "#121212" : "#F8F9FA";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      
      <ModuleHeader
        title="Clientes"
        subtitle="Registro de clientes del taller"
        onAdd={() => abrirFormulario()}
        addLabel="Nuevo cliente"
        search={busqueda}
        onSearch={setBusqueda}
        dark={dark}
      />

      <TableShell headers={['ID CLIENTE', 'NOMBRE', 'IDENTIFICACIÓN', 'DIRECCIÓN', 'CORREO', 'TELÉFONO', 'ESTADO', 'ACCIONES']} dark={dark}>
        {clientesFiltrados.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
              No se encontraron registros de clientes.
            </td>
          </tr>
        ) : (
          clientesFiltrados.map((cli) => {
            const isActive = cli.estado === 'ACTIVO';
            return (
              <tr key={cli.id} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                <td style={{ padding: '12px 14px' }}>
                  <IdBadge id={cli.id} />
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: fg, fontSize: 13 }}>
                  {cli.nombre}
                </td>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: subtle }}>
                  {cli.identificacion}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: subtle }}>
                  {cli.direccion}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12 }}>
                  <a href={`mailto:${cli.correo}`} style={{ color: '#4A90E2', textDecoration: 'none' }}>
                    {cli.correo}
                  </a>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: subtle }}>
                  {cli.telefono}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <select
                    value={cli.estado}
                    onChange={(e) => handleEstadoInline(cli.id, e.target.value as any)}
                    style={{
                      backgroundColor: isActive ? SUCCESS_BG : DANGER_BG,
                      color: isActive ? SUCCESS_TXT : DANGER_TXT,
                      border: 'none', borderRadius: 999, padding: '4px 12px',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ActionCircleBtn variant="gold" onClick={() => abrirFormulario(cli)} title="Editar Cliente">
                      <Pencil size={14} />
                    </ActionCircleBtn>
                    <ActionCircleBtn variant="danger" onClick={() => setModalDelete(cli)} title="Eliminar Cliente">
                      <Trash2 size={14} />
                    </ActionCircleBtn>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </TableShell>

      {/* MODAL NUEVO / EDITAR CLIENTE */}
      {modalForm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24
        }}>
          <div style={{
            width: '100%', maxWidth: 600, borderRadius: 16, backgroundColor: cardBg,
            border: `1px solid ${GOLD}40`, boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
          }}>
            <div style={{ height: 3, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
            
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif' }}>
                {clienteEditar ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button onClick={() => setModalForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="ID (Auto)" dark={dark}>
                  <input
                    type="text"
                    disabled
                    value={clienteEditar ? clienteEditar.id : `00-${clientes.length + 1}`}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: subtle, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
                <Field label="Nombre" dark={dark}>
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
              </div>

              <Field label="Identificación" dark={dark}>
                <input
                  type="text"
                  placeholder="Ej: 10458231"
                  value={formIdentificacion}
                  onChange={(e) => setFormIdentificacion(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                />
              </Field>

              <Field label="Dirección" dark={dark}>
                <input
                  type="text"
                  placeholder="Ej: Cra 45 #20-432"
                  value={formDireccion}
                  onChange={(e) => setFormDireccion(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Correo" dark={dark}>
                  <input
                    type="email"
                    placeholder="correo@gmail.com"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
                <Field label="Teléfono" dark={dark}>
                  <input
                    type="text"
                    placeholder="300 000 0000"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
              </div>

              <Field label="Estado" dark={dark}>
                <select
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value as any)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </Field>
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: dark ? '#252525' : '#FAFAFA' }}>
              <button
                onClick={() => setModalForm(false)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)',
                  background: dark ? '#2A2A2A' : '#EAEAEA', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarCliente}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                  color: '#121212', fontWeight: 700, fontSize: 13, cursor: 'pointer'
                }}
              >
                Guardar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalDelete && (
        <ConfirmDelete
          message="Cliente eliminado correctamente"
          dark={dark}
          onCancel={() => setModalDelete(null)}
          onConfirm={() => {
            setClientes(clientes.filter(c => c.id !== modalDelete.id));
            setModalDelete(null);
          }}
        />
      )}

    </div>
  );
};