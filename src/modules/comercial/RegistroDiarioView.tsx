import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Trash2, Pencil, X, Search, AlertTriangle 
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

export interface RegistroDiario {
  id: string;
  idEmpleado: string;
  idPieza: string;
  idProduccion: string;
  cantidadRealizada: number;
  fecha: string;
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
            ¿Eliminar registro?
          </h3>
          <div style={{
            background: DANGER_BG, border: `1px solid ${DANGER}4D`,
            borderRadius: 10, padding: '10px 14px', fontSize: 12,
            color: DANGER_TXT, fontWeight: 600, marginBottom: 20
          }}>
            Esta acción eliminará el registro diario de producción de forma permanente.
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
// COMPONENTE PRINCIPAL: REGISTRO DIARIO VIEW
// ==========================================
interface RegistroDiarioViewProps {
  dark?: boolean;
}

export const RegistroDiarioView: React.FC<RegistroDiarioViewProps> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [registros, setRegistros] = useState<RegistroDiario[]>([
    { id: 'REG-001', idEmpleado: 'EMP-001', idPieza: 'TIP-001', idProduccion: 'PRD-001', cantidadRealizada: 20, fecha: '2026-06-26' },
    { id: 'REG-002', idEmpleado: 'EMP-002', idPieza: 'TIP-002', idProduccion: 'PRD-001', cantidadRealizada: 30, fecha: '2026-06-26' },
    { id: 'REG-003', idEmpleado: 'EMP-003', idPieza: 'TIP-003', idProduccion: 'PRD-001', cantidadRealizada: 10, fecha: '2026-06-26' },
    { id: 'REG-004', idEmpleado: 'EMP-001', idPieza: 'TIP-001', idProduccion: 'PRD-001', cantidadRealizada: 40, fecha: '2026-06-27' }
  ]);

  const [modalForm, setModalForm] = useState(false);
  const [registroEditar, setRegistroEditar] = useState<RegistroDiario | null>(null);
  const [modalDelete, setModalDelete] = useState<RegistroDiario | null>(null);

  // Catálogos simulados para selects
  const empleadosLista = ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004'];
  const piezasLista = ['TIP-001', 'TIP-002', 'TIP-003', 'TIP-004'];
  const produccionesLista = ['PRD-001 — ORD-001', 'PRD-002 — ORD-002', 'PRD-003 — ORD-003'];

  // Estados del formulario
  const [formEmpleado, setFormEmpleado] = useState('EMP-001');
  const [formPieza, setFormPieza] = useState('TIP-001');
  const [formProduccion, setFormProduccion] = useState('PRD-001 — ORD-001');
  const [formCantidad, setFormCantidad] = useState(0);
  const [formFecha, setFormFecha] = useState('2026-09-22');

  // Cerrar el desplegable si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const abrirFormulario = (reg?: RegistroDiario) => {
    if (reg) {
      setRegistroEditar(reg);
      setFormEmpleado(reg.idEmpleado);
      setFormPieza(reg.idPieza);
      setFormProduccion(reg.idProduccion);
      setFormCantidad(reg.cantidadRealizada);
      setFormFecha(reg.fecha);
    } else {
      setRegistroEditar(null);
      setFormEmpleado('EMP-001');
      setFormPieza('TIP-001');
      setFormProduccion('PRD-001 — ORD-001');
      setFormCantidad(0);
      setFormFecha(new Date().toISOString().split('T')[0]);
    }
    setModalForm(true);
  };

  const handleGuardarRegistro = () => {
    if (formCantidad < 0) {
      toast.error('La cantidad realizada no puede ser negativa');
      return;
    }
    if (registroEditar) {
      setRegistros(registros.map(r => r.id === registroEditar.id ? {
        ...r,
        idEmpleado: formEmpleado,
        idPieza: formPieza,
        idProduccion: formProduccion,
        cantidadRealizada: Number(formCantidad),
        fecha: formFecha
      } : r));
      toast.success('Registro diario actualizado exitosamente');
    } else {
      const nextNum = registros.length + 1;
      const nuevoId = `REG-00${nextNum}`;
      const nuevoRegistro: RegistroDiario = {
        id: nuevoId,
        idEmpleado: formEmpleado,
        idPieza: formPieza,
        idProduccion: formProduccion,
        cantidadRealizada: Number(formCantidad),
        fecha: formFecha
      };
      setRegistros([...registros, nuevoRegistro]);
      toast.success('Nuevo registro diario guardado con éxito');
    }
    setModalForm(false);
  };

  // Filtrado optimizado por ID de registro (similar al filtro por ID de clientes)
  const registrosFiltrados = registros.filter(r => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return true;
    const idLimpio = r.id.toLowerCase();
    const numeroBusqueda = query.replace(/^reg-?0*/i, '');
    return (
      idLimpio.includes(query) ||
      (numeroBusqueda !== '' && idLimpio.includes(numeroBusqueda)) ||
      r.idEmpleado.toLowerCase().includes(query) ||
      r.idPieza.toLowerCase().includes(query) ||
      r.idProduccion.toLowerCase().includes(query) ||
      r.fecha.includes(query)
    );
  });

  const bg = dark ? "#121212" : "#F8F9FA";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* HEADER CON BUSCADOR DESPLEGABLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg, fontFamily: 'Montserrat, sans-serif' }}>Registro Diario</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>Control diario de producción por empleado y pieza</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          
          {/* CONTENEDOR BUSCADOR CON SUGERENCIAS FLOTANTES */}
          <div ref={searchRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12, zIndex: 2 }} />
            <input
              type="text"
              placeholder="Buscar por ID (ej. 1, REG-001)..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              style={{
                padding: '8px 12px 8px 36px', borderRadius: 8,
                border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                background: inputBg, color: fg, fontSize: 13, outline: 'none',
                fontFamily: 'Montserrat, sans-serif', width: 240
              }}
            />
            {/* MENÚ DESPLEGABLE HACIA ABAJO CON OPCIONES */}
            {showDropdown && registrosFiltrados.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: cardBg, border: `1px solid ${GOLD}40`, borderRadius: 10,
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100, maxHeight: 200, overflowY: 'auto'
              }}>
                {registrosFiltrados.map((reg) => (
                  <div
                    key={reg.id}
                    onClick={() => {
                      setBusqueda(reg.id);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: '10px 12px', fontSize: 12, cursor: 'pointer',
                      borderBottom: `1px solid ${borderNormal}`, display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${GOLD}15`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <span style={{ background: GOLD + "1F", color: GOLD, fontFamily: "monospace", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                      {reg.id}
                    </span>
                    <span style={{ fontWeight: 600, color: subtle, fontSize: 11 }}>
                      {reg.fecha} — {reg.cantidadRealizada} und.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => abrirFormulario()}
            style={{
              background: `linear-gradient(135deg, #C9A227, ${GOLD}, ${GOLD_LIGHT})`,
              color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10,
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif'
            }}
          >
            <Plus size={16} /> Nuevo registro
          </button>
        </div>
      </div>

      <TableShell headers={['ID REGISTRO', 'ID EMPLEADO', 'ID PIEZA', 'ID PRODUCCIÓN', 'CANTIDAD REALIZADA', 'FECHA', 'ACCIONES']} dark={dark}>
        {registrosFiltrados.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
              No se encontraron registros diarios.
            </td>
          </tr>
        ) : (
          registrosFiltrados.map((reg) => (
            <tr key={reg.id} style={{ borderBottom: `1px solid ${borderNormal}` }}>
              <td style={{ padding: '12px 14px' }}>
                <IdBadge id={reg.id} />
              </td>
              <td style={{ padding: '12px 14px' }}>
                <IdBadge id={reg.idEmpleado} />
              </td>
              <td style={{ padding: '12px 14px' }}>
                <IdBadge id={reg.idPieza} />
              </td>
              <td style={{ padding: '12px 14px' }}>
                <IdBadge id={reg.idProduccion} />
              </td>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: fg, fontSize: 13 }}>
                {reg.cantidadRealizada} <span style={{ fontWeight: 400, fontSize: 11, color: subtle }}>und.</span>
              </td>
              <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: subtle }}>
                {reg.fecha}
              </td>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ActionCircleBtn variant="gold" onClick={() => abrirFormulario(reg)} title="Editar Registro">
                    <Pencil size={14} />
                  </ActionCircleBtn>
                  <ActionCircleBtn variant="danger" onClick={() => setModalDelete(reg)} title="Eliminar Registro">
                    <Trash2 size={14} />
                  </ActionCircleBtn>
                </div>
              </td>
            </tr>
          ))
        )}
      </TableShell>

      {/* MODAL NUEVO / EDITAR REGISTRO DIARIO */}
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
                {registroEditar ? 'Editar Registro Diario' : 'Nuevo Registro Diario'}
              </h3>
              <button onClick={() => setModalForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="ID Registro" dark={dark}>
                  <input
                    type="text"
                    disabled
                    value={registroEditar ? registroEditar.id : `REG-00${registros.length + 1}`}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: subtle, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
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
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="ID Empleado" dark={dark}>
                  <select
                    value={formEmpleado}
                    onChange={(e) => setFormEmpleado(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  >
                    {empleadosLista.map(emp => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </Field>
                <Field label="ID Pieza" dark={dark}>
                  <select
                    value={formPieza}
                    onChange={(e) => setFormPieza(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  >
                    {piezasLista.map(pz => (
                      <option key={pz} value={pz}>{pz}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <Field label="ID Producción" dark={dark}>
                  <select
                    value={formProduccion}
                    onChange={(e) => setFormProduccion(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  >
                    {produccionesLista.map(prd => (
                      <option key={prd} value={prd}>{prd}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Cantidad Realizada" dark={dark}>
                  <input
                    type="number"
                    min="0"
                    value={formCantidad}
                    onChange={(e) => setFormCantidad(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
              </div>
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
                onClick={handleGuardarRegistro}
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
          message="Registro diario eliminado correctamente"
          dark={dark}
          onCancel={() => setModalDelete(null)}
          onConfirm={() => {
            setRegistros(registros.filter(r => r.id !== modalDelete.id));
            setModalDelete(null);
          }}
        />
      )}
    </div>
  );
};