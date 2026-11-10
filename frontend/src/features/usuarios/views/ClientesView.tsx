import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Trash2, Pencil, X, Search, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import {
  clienteService,
  type CategoriaCliente,
  type Cliente,
  type EstadoCliente,
} from '../services/clienteService';

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

export type { Cliente };

/** Saca el mensaje de error que manda el backend (detail) para mostrarlo en el toast. */
const mensajeError = (error: unknown, porDefecto: string): string => {
  const detalle = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detalle === 'string') return detalle;
  if (Array.isArray(detalle) && detalle.length > 0) {
    return detalle.map((d: { loc?: unknown[]; msg?: string }) =>
      `${String(d.loc?.[d.loc.length - 1] ?? '')}: ${d.msg ?? ''}`).join(' | ');
  }
  return porDefecto;
};

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
            ¿Eliminar cliente?
          </h3>
          <div style={{
            background: DANGER_BG, border: `1px solid ${DANGER}4D`,
            borderRadius: 10, padding: '10px 14px', fontSize: 12,
            color: DANGER_TXT, fontWeight: 600, marginBottom: 20
          }}>
            {message}
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
              onClick={onConfirm}
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
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Cargar clientes y categorías desde la API al abrir la pantalla
  useEffect(() => {
    const cargar = async () => {
      try {
        const [listaClientes, listaCategorias] = await Promise.all([
          clienteService.listar(),
          clienteService.listarCategorias(),
        ]);
        setClientes(listaClientes);
        setCategorias(listaCategorias);
      } catch (error) {
        toast.error(mensajeError(error, 'No se pudieron cargar los clientes. ¿Está encendido el backend?'));
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const [modalForm, setModalForm] = useState(false);
  const [clienteEditar, setClienteEditar] = useState<Cliente | null>(null);
  const [modalDelete, setModalDelete] = useState<Cliente | null>(null);

  // Estados del formulario
  const [formNombre, setFormNombre] = useState('');
  const [formNit, setFormNit] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [formContrasena, setFormContrasena] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEstado, setFormEstado] = useState<EstadoCliente>('Activo');

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

  const abrirFormulario = (cli?: Cliente) => {
    if (cli) {
      setClienteEditar(cli);
      setFormNombre(cli.nombre);
      setFormNit(cli.nit);
      setFormCategoria(cli.id_categoria);
      setFormDireccion(cli.direccion ?? '');
      setFormCorreo(cli.correo);
      setFormTelefono(cli.telefono ?? '');
      setFormEstado(cli.estado);
    } else {
      setClienteEditar(null);
      setFormNombre('');
      setFormNit('');
      setFormCategoria(categorias[0]?.id ?? '');
      setFormDireccion('');
      setFormCorreo('');
      setFormTelefono('');
      setFormEstado('Activo');
    }
    setFormContrasena('');
    setModalForm(true);
  };

  const handleGuardarCliente = async () => {
    if (!formNombre.trim() || !formNit.trim() || !formDireccion.trim() || !formCorreo.trim() || !formTelefono.trim() || !formCategoria) {
      toast.error('Todos los campos son obligatorios para guardar el cliente.');
      return;
    }
    if (!clienteEditar && formContrasena.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (clienteEditar && formContrasena && formContrasena.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const datos = {
      nombre: formNombre.trim(),
      direccion: formDireccion.trim(),
      correo: formCorreo.trim(),
      telefono: formTelefono.trim(),
      id_categoria: formCategoria,
      estado: formEstado,
    };

    setGuardando(true);
    try {
      if (clienteEditar) {
        const actualizado = await clienteService.actualizar(clienteEditar.nit, {
          ...datos,
          ...(formContrasena ? { contrasena: formContrasena } : {}),
        });
        setClientes(clientes.map(c => c.nit === actualizado.nit ? actualizado : c));
        toast.success('Cliente actualizado exitosamente');
      } else {
        const nuevo = await clienteService.crear({ ...datos, nit: formNit.trim(), contrasena: formContrasena });
        setClientes([...clientes, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        toast.success('Nuevo cliente registrado con éxito');
      }
      setModalForm(false);
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo guardar el cliente.'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEstadoInline = async (nit: string, nuevoEstado: EstadoCliente) => {
    try {
      const actualizado = await clienteService.cambiarEstado(nit, nuevoEstado);
      setClientes(clientes.map(c => c.nit === nit ? actualizado : c));
      toast.success(`Estado actualizado a ${nuevoEstado}`);
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo cambiar el estado.'));
    }
  };

  const handleEliminar = async () => {
    if (!modalDelete) return;
    try {
      await clienteService.eliminar(modalDelete.nit);
      setClientes(clientes.filter(c => c.nit !== modalDelete.nit));
      toast.success('Cliente eliminado correctamente');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo eliminar el cliente.'));
    } finally {
      setModalDelete(null);
    }
  };

  // Filtrado optimizado para la tabla y las sugerencias desplegables
  const clientesFiltrados = clientes.filter(c => {
    const query = busqueda.toLowerCase().trim();
    if (!query) return true;
    return (
      c.nit.toLowerCase().includes(query) ||
      c.nombre.toLowerCase().includes(query) ||
      c.correo.toLowerCase().includes(query) ||
      (c.nombre_categoria ?? '').toLowerCase().includes(query)
    );
  });

  // Lógica para seccionar los datos por página
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClientes = clientesFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(clientesFiltrados.length / itemsPerPage);

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
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg, fontFamily: 'Montserrat, sans-serif' }}>Clientes</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>Registro de clientes del taller</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          
          {/* CONTENEDOR BUSCADOR CON SUGERENCIAS FLOTANTES */}
          <div ref={searchRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12, zIndex: 2 }} />
            <input
              type="text"
              placeholder="Buscar por NIT, nombre o correo..."
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
                fontFamily: 'Montserrat, sans-serif', width: 220
              }}
            />

            {/* MENÚ DESPLEGABLE HACIA ABAJO CON OPCIONES */}
            {showDropdown && clientesFiltrados.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                background: cardBg, border: `1px solid ${GOLD}40`, borderRadius: 10,
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100, maxHeight: 200, overflowY: 'auto'
              }}>
                {clientesFiltrados.map((c) => (
                  <div
                    key={c.nit}
                    onClick={() => {
                      setBusqueda(c.nit);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: '10px 12px', fontSize: 12, cursor: 'pointer',
                      borderBottom: `1px solid ${borderNormal}`, display: 'flex',
                      alignItems: 'center', justifyContent: 'between', gap: 8,
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = `${GOLD}15`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <span style={{ background: GOLD + "1F", color: GOLD, fontFamily: "monospace", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                      {c.nit}
                    </span>
                    <span style={{ fontWeight: 600, color: fg, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.nombre}
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
            <Plus size={16} /> Nuevo cliente
          </button>
        </div>
      </div>

      <TableShell headers={['NIT', 'NOMBRE', 'CATEGORÍA', 'DIRECCIÓN', 'CORREO', 'TELÉFONO', 'ESTADO', 'ACCIONES']} dark={dark}>
        {cargando ? (
          <tr>
            <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
              Cargando clientes...
            </td>
          </tr>
        ) : clientesFiltrados.length === 0 ? (
          <tr>
            <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
              No se encontraron registros de clientes.
            </td>
          </tr>
        ) : (
          currentClientes.map((cli) => {
            const isActive = cli.estado === 'Activo';
            return (
              <tr key={cli.nit} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                <td style={{ padding: '12px 14px' }}>
                  <IdBadge id={cli.nit} />
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 700, color: fg, fontSize: 13 }}>
                  {cli.nombre}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: subtle }}>
                  {cli.nombre_categoria ?? cli.id_categoria}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: subtle }}>
                  {cli.direccion ?? '—'}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12 }}>
                  <a href={`mailto:${cli.correo}`} style={{ color: '#4A90E2', textDecoration: 'none' }}>
                    {cli.correo}
                  </a>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: subtle }}>
                  {cli.telefono ?? '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <select
                    value={cli.estado}
                    onChange={(e) => handleEstadoInline(cli.nit, e.target.value as EstadoCliente)}
                    style={{
                      backgroundColor: isActive ? SUCCESS_BG : DANGER_BG,
                      color: isActive ? SUCCESS_TXT : DANGER_TXT,
                      border: 'none', borderRadius: 999, padding: '4px 12px',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  >
                    <option value="Activo">ACTIVO</option>
                    <option value="Inactivo">INACTIVO</option>
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

      {/* CONTROLES DE PAGINACIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px' }}>
        <span style={{ fontSize: 13, color: subtle, fontFamily: 'Montserrat, sans-serif' }}>
          Mostrando de {clientesFiltrados.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, clientesFiltrados.length)} de {clientesFiltrados.length} clientes
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
                <Field label={clienteEditar ? 'NIT (no editable)' : 'NIT / Identificación'} dark={dark}>
                  <input
                    type="text"
                    disabled={!!clienteEditar}
                    placeholder="Ej: 10458231"
                    value={formNit}
                    onChange={(e) => setFormNit(e.target.value.replace(/[^0-9-]/g, ''))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: clienteEditar ? subtle : fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
                <Field label="Nombre (Solo Letras)" dark={dark}>
                  <input
                    type="text"
                    placeholder="Nombre del cliente"
                    value={formNombre}
                    onChange={(e) => {
                      const valorLimpio = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                      setFormNombre(valorLimpio);
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
              </div>

              <Field label="Categoría" dark={dark}>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                >
                  {categorias.length === 0 && <option value="">No hay categorías disponibles</option>}
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
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
                <Field label="Teléfono (Solo Números)" dark={dark}>
                  <input
                    type="text"
                    placeholder="3000000000"
                    value={formTelefono}
                    onChange={(e) => {
                      const valorLimpio = e.target.value.replace(/\D/g, '');
                      setFormTelefono(valorLimpio);
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label={clienteEditar ? 'Nueva contraseña (opcional)' : 'Contraseña'} dark={dark}>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={clienteEditar ? 'Dejar vacío para no cambiarla' : 'Mínimo 6 caracteres'}
                    value={formContrasena}
                    onChange={(e) => setFormContrasena(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
                <Field label="Estado" dark={dark}>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as EstadoCliente)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
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
                onClick={handleGuardarCliente}
                disabled={guardando}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                  color: '#121212', fontWeight: 700, fontSize: 13,
                  cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1
                }}
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalDelete && (
        <ConfirmDelete
          message={`Esta acción eliminará a ${modalDelete.nombre} de forma permanente. Si ya tiene remisiones, no se podrá eliminar: en ese caso cámbiele el estado a Inactivo.`}
          dark={dark}
          onCancel={() => setModalDelete(null)}
          onConfirm={handleEliminar}
        />
      )}
    </div>
  );
};