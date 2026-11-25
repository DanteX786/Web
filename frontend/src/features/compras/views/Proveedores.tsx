import React, { useState, useEffect } from 'react';
import { Search, Plus, X, AlertTriangle, Pencil, Trash2, Eye, Phone, Mail, MapPin, ChevronDown, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { BotonExcel } from '../../../shared/components/BotonExcel';
import { exportarExcel, subtituloExportacion } from '../../../shared/utils/excel';
import { proveedorService, type Proveedor, type EstadoProveedor } from '../services/proveedorService';
import { mensajeError } from '../../../shared/utils/api';
import {
  limpiarDocumento,
  soloDigitos,
  validarDocumento,
  validarNombre,
  validarCorreo,
  validarTelefono,
  validarContacto,
  validarDireccion,
} from '../../auth/utils/validaciones';

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

type Campo = 'nit' | 'nombre' | 'telefono' | 'correo' | 'contacto' | 'direccion';
const TODOS_LOS_CAMPOS: Campo[] = ['nit', 'nombre', 'telefono', 'correo', 'contacto', 'direccion'];

/** Quita tildes y pasa a minúsculas, para que "medellin" encuentre "Medellín". */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Valida el formulario con las mismas reglas del equipo (auth/utils/validaciones.ts).
 * - NIT y nombre: obligatorios, y solo se validan al CREAR (al editar no se pueden cambiar).
 * - Los demás campos son opcionales: solo se validan si tienen algo escrito.
 */
function validarFormulario(f: Partial<Proveedor>, existentes: Proveedor[], esNuevo: boolean): Partial<Record<Campo, string>> {
  const errores: Partial<Record<Campo, string>> = {};

  if (esNuevo) {
    const nit = (f.nit ?? '').trim();
    const errorNit = validarDocumento('NIT', nit);
    if (errorNit) errores.nit = errorNit;
    else if (existentes.some(p => p.nit === nit)) errores.nit = 'Ya existe un proveedor con este NIT.';

    const errorNombre = validarNombre(f.nombre ?? '', 'NIT');
    if (errorNombre) errores.nombre = errorNombre;
  }

  if (f.telefono?.trim()) {
    const e = validarTelefono('Empresarial', f.telefono.trim());
    if (e) errores.telefono = e;
  }
  if (f.correo?.trim()) {
    const e = validarCorreo(f.correo);
    if (e) errores.correo = e;
  }
  if (f.contacto?.trim()) {
    const e = validarContacto('NIT', f.contacto);
    if (e) errores.contacto = e;
  }
  const errorDireccion = validarDireccion(f.direccion ?? '');
  if (errorDireccion) errores.direccion = errorDireccion;

  return errores;
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

  const [data, setData] = useState<Proveedor[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | null>(null);
  const [current, setCurrent] = useState<Proveedor | null>(null);
  const [deleteItem, setDeleteItem] = useState<Proveedor | null>(null);
  const [formData, setFormData] = useState<Partial<Proveedor>>({ estado: 'Activo' });
  // Campos que el usuario ya tocó: solo a esos se les muestra el error mientras escribe
  const [tocados, setTocados] = useState<Set<Campo>>(new Set());

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Carga inicial desde el backend
  useEffect(() => {
    proveedorService.listar()
      .then(setData)
      .catch((e) => toast.error(mensajeError(e), { style: estiloError }));
  }, []);

  // ---------- Buscador: filtra por ID, NIT, nombre, contacto, teléfono, correo y estado ----------
  const termino = normalizar(busqueda.trim());
  const filtered = termino
    ? data.filter(p =>
        [p.id, p.nit, p.nombre, p.contacto, p.telefono, p.correo, p.estado]
          .some(valor => valor && normalizar(valor).includes(termino))
      )
    : data;

  /** Exporta los proveedores de la tabla (con la búsqueda aplicada, todas las páginas). */
  const descargarExcel = () => exportarExcel({
    archivo: 'proveedores', hoja: 'Proveedores', titulo: 'Proveedores',
    subtitulo: subtituloExportacion(busqueda, filtered.length),
    filas: filtered,
    columnas: [
      { titulo: 'ID', valor: p => p.id },
      { titulo: 'NIT', valor: p => p.nit },
      { titulo: 'Nombre', valor: p => p.nombre },
      { titulo: 'Contacto', valor: p => p.contacto },
      { titulo: 'Teléfono', valor: p => p.telefono },
      { titulo: 'Correo', valor: p => p.correo },
      { titulo: 'Dirección', valor: p => p.direccion, ancho: 36 },
      { titulo: 'Estado', valor: p => p.estado },
    ],
  });

  const buscar = (texto: string) => {
    setBusqueda(texto);
    setCurrentPage(1); // al buscar siempre se vuelve a la primera página
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // ---------- Validación en tiempo real ----------
  const esNuevo = modalMode === 'add';
  const errores = validarFormulario(formData, data, esNuevo);
  const hayErrores = Object.keys(errores).length > 0;
  const errorDe = (campo: Campo) => (tocados.has(campo) ? errores[campo] : undefined);

  const cambiar = (campo: Campo, valor: string) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setTocados(prev => new Set(prev).add(campo));
  };

  const openAdd = () => {
    setCurrent(null);
    setFormData({ nit: '', nombre: '', direccion: '', correo: '', telefono: '', contacto: '', estado: 'Activo' });
    setTocados(new Set());
    setModalMode('add');
  };

  const openEdit = (p: Proveedor) => {
    setCurrent(p);
    setFormData(p);
    setTocados(new Set());
    setModalMode('edit');
  };

  const openView = (p: Proveedor) => {
    setCurrent(p);
    setModalMode('view');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hayErrores) {
      setTocados(new Set(TODOS_LOS_CAMPOS)); // muestra todos los errores
      toast.error("Revisa los campos marcados en rojo", { style: estiloError });
      return;
    }

    // Campos que se pueden escribir en ambos casos
    const editables = {
      contacto: formData.contacto,
      telefono: formData.telefono,
      correo: formData.correo,
      direccion: formData.direccion,
      estado: formData.estado,
    };

    try {
      if (modalMode === 'add') {
        // Al crear se envían también el NIT y el nombre. El id lo genera la base de datos.
        const creado = await proveedorService.crear({ nit: formData.nit, nombre: formData.nombre, ...editables });
        setData(prev => [...prev, creado]);
        toast.success(`Proveedor ${creado.id} registrado`, { style: estiloExito });
      } else if (modalMode === 'edit' && current) {
        // Al editar NO se envían el NIT ni el nombre: no se pueden cambiar
        const actualizado = await proveedorService.actualizar(current.id, editables);
        setData(prev => prev.map(d => d.id === actualizado.id ? actualizado : d));
        toast.success("Proveedor actualizado", { style: estiloExito });
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
      await proveedorService.eliminar(deleteItem.id);
      setData(prev => prev.filter(d => d.id !== deleteItem.id));
      toast.success("Proveedor eliminado", { style: estiloExito });
    } catch (e) {
      toast.error(mensajeError(e), { style: estiloError });
    } finally {
      setDeleteItem(null);
    }
  };

  const handleStateChangeInline = async (id: string, nuevoEstado: EstadoProveedor) => {
    try {
      const actualizado = await proveedorService.cambiarEstado(id, nuevoEstado);
      setData(prev => prev.map(d => d.id === id ? actualizado : d));
      toast.success(`Estado actualizado a "${nuevoEstado}"`, { style: estiloExito });
    } catch (e) {
      toast.error(mensajeError(e), { style: estiloError });
    }
  };

  const getEstadoBadgeStyle = (estado: EstadoProveedor) => {
    switch (estado) {
      case "Activo":   return { bg: "#DCF7E6", color: "#28A745" };
      case "Inactivo": return { bg: "#FDECEA", color: "#DC3545" };
    }
  };

  // ---------- Estilos del formulario ----------
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 };
  const inputStyle = (campo: Campo): React.CSSProperties => ({
    width: '100%', padding: '10px 12px', background: inputBg,
    border: `1px solid ${errorDe(campo) ? DANGER : borderNormal}`,
    borderRadius: 8, color: fg, outline: 'none', boxSizing: 'border-box',
  });
  const bloqueadoStyle: React.CSSProperties = {
    width: '100%', padding: '10px 36px 10px 12px', background: surfaceBg,
    border: `1px solid ${borderNormal}`, borderRadius: 8, color: subtle,
    outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed',
  };
  const Obligatorio = () => <span style={{ color: DANGER }}> *</span>;
  const MensajeError = ({ campo }: { campo: Campo }) =>
    errorDe(campo) ? <div style={{ fontSize: 11, color: DANGER, marginTop: 4 }}>{errorDe(campo)}</div> : null;
  const NoEditable = () => <div style={{ fontSize: 11, color: subtle, marginTop: 4 }}>No se puede modificar</div>;

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}>

      {/* ENCABEZADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Proveedores</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Gestión de proveedores e insumos del taller</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Buscador */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Buscar por NIT, nombre, contacto..."
              value={busqueda}
              onChange={(e) => buscar(e.target.value)}
              style={{
                width: 260, padding: '8px 32px 8px 36px', borderRadius: 8,
                border: `1px solid ${borderNormal}`, background: surfaceBg, color: fg,
                fontSize: 13, outline: 'none', fontFamily: 'Montserrat, sans-serif'
              }}
              onFocus={(e) => { e.target.style.borderColor = GOLD; }}
              onBlur={(e) => { e.target.style.borderColor = borderNormal; }}
            />
            {busqueda && (
              <button
                onClick={() => buscar('')}
                title="Limpiar búsqueda"
                style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: subtle, display: 'flex', padding: 2 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <BotonExcel onClick={descargarExcel} cantidad={filtered.length} dark={dark} />

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
                  {busqueda ? `No hay proveedores que coincidan con "${busqueda}".` : 'No hay proveedores registrados.'}
                </td>
              </tr>
            ) : (
             currentItems.map((row) => {
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

      {/* CONTROLES DE PAGINACIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <div style={{ fontSize: 13, color: subtle }}>
          Mostrando de {filtered.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filtered.length)} de {filtered.length} registros
          {busqueda && ` (filtrados de ${data.length})`}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '6px 16px', borderRadius: 8, border: `1px solid ${borderNormal}`,
              background: surfaceBg, color: currentPage === 1 ? subtle : fg,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600
            }}
          >
            Anterior
          </button>

          <span style={{ fontSize: 13, color: fg, fontWeight: 600, padding: '0 8px' }}>
            Página {currentPage} de {totalPages || 1}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            style={{
              padding: '6px 16px', borderRadius: 8, border: `1px solid ${borderNormal}`,
              background: surfaceBg, color: currentPage === totalPages || totalPages === 0 ? subtle : fg,
              cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600
            }}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, maxHeight: '95vh', borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif' }}>
                {modalMode === 'add' ? 'Registrar Proveedor' : 'Editar Proveedor'}
              </h3>
              <button onClick={() => setModalMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}><X size={18}/></button>
            </div>

            <form onSubmit={handleSave} noValidate style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
              <div style={{ fontSize: 11, color: subtle }}>
                Los campos con <span style={{ color: DANGER }}>*</span> son obligatorios.
              </div>

              {/* 1. NIT (primer campo) */}
              <div>
                <label style={labelStyle}>NIT<Obligatorio /></label>
                {esNuevo ? (
                  <>
                    <input
                      value={formData.nit || ''}
                      onChange={e => cambiar('nit', limpiarDocumento('NIT', e.target.value))}
                      onBlur={() => setTocados(prev => new Set(prev).add('nit'))}
                      placeholder="900123456-1"
                      autoFocus
                      style={inputStyle('nit')}
                    />
                    <MensajeError campo="nit" />
                  </>
                ) : (
                  <>
                    <div style={{ position: 'relative' }}>
                      <input value={formData.nit || ''} disabled style={bloqueadoStyle} />
                      <Lock size={14} color={subtle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                    <NoEditable />
                  </>
                )}
              </div>

              {/* 2. Nombre de la empresa */}
              <div>
                <label style={labelStyle}>Nombre de la Empresa<Obligatorio /></label>
                {esNuevo ? (
                  <>
                    <input
                      value={formData.nombre || ''}
                      onChange={e => cambiar('nombre', e.target.value)}
                      onBlur={() => setTocados(prev => new Set(prev).add('nombre'))}
                      placeholder="Ej. Textiles del Norte S.A.S."
                      style={inputStyle('nombre')}
                    />
                    <MensajeError campo="nombre" />
                  </>
                ) : (
                  <>
                    <div style={{ position: 'relative' }}>
                      <input value={formData.nombre || ''} disabled style={bloqueadoStyle} />
                      <Lock size={14} color={subtle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                    <NoEditable />
                  </>
                )}
              </div>

              {/* 3. Teléfono y correo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input
                    value={formData.telefono || ''}
                    onChange={e => cambiar('telefono', soloDigitos(e.target.value).slice(0, 10))}
                    onBlur={() => setTocados(prev => new Set(prev).add('telefono'))}
                    placeholder="3001234567"
                    inputMode="numeric"
                    style={inputStyle('telefono')}
                  />
                  <MensajeError campo="telefono" />
                </div>
                <div>
                  <label style={labelStyle}>Correo</label>
                  <input
                    value={formData.correo || ''}
                    onChange={e => cambiar('correo', e.target.value)}
                    onBlur={() => setTocados(prev => new Set(prev).add('correo'))}
                    placeholder="correo@empresa.com"
                    style={inputStyle('correo')}
                  />
                  <MensajeError campo="correo" />
                </div>
              </div>

              {/* 4. Contacto */}
              <div>
                <label style={labelStyle}>Contacto Principal</label>
                <input
                  value={formData.contacto || ''}
                  onChange={e => cambiar('contacto', e.target.value)}
                  onBlur={() => setTocados(prev => new Set(prev).add('contacto'))}
                  placeholder="Nombre de la persona"
                  style={inputStyle('contacto')}
                />
                <MensajeError campo="contacto" />
              </div>

              {/* 5. Dirección */}
              <div>
                <label style={labelStyle}>Dirección</label>
                <input
                  value={formData.direccion || ''}
                  onChange={e => cambiar('direccion', e.target.value)}
                  onBlur={() => setTocados(prev => new Set(prev).add('direccion'))}
                  placeholder="Calle 0 #0-0"
                  style={inputStyle('direccion')}
                />
                <MensajeError campo="direccion" />
              </div>

              {/* 6. Estado */}
              <div>
                <label style={labelStyle}>Estado</label>
                <select
                  value={formData.estado || 'Activo'}
                  onChange={e => setFormData({...formData, estado: e.target.value as EstadoProveedor})}
                  style={{ width: '100%', padding: '10px 12px', background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, color: fg, outline: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}
                >
                  {(["Activo", "Inactivo"] as EstadoProveedor[]).map(est => <option key={est} value={est}>{est}</option>)}
                </select>
              </div>

              <div style={{ padding: '16px 24px', margin: '0 -24px -20px', borderTop: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: dark ? '#252525' : '#FAFAFA' }}>
                <button type="button" onClick={() => setModalMode(null)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: dark ? '#2A2A2A' : '#E8E8E8', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: hayErrores && tocados.size > 0 ? 0.6 : 1 }}>Guardar</button>
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
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>NIT</div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: fg }}>{current.nit}</span>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Empresa</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: GOLD }}>{current.nombre}</div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={14} color={subtle} />
                <div>
                  <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase' }}>Dirección</div>
                  <div style={{ fontSize: 13, color: fg }}>{current.direccion || '—'}</div>
                </div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} color={subtle} />
                <div>
                  <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase' }}>Teléfono</div>
                  <div style={{ fontSize: 13, color: fg }}>{current.telefono || '—'}</div>
                </div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} color={subtle} />
                <div>
                  <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase' }}>Correo</div>
                  <div style={{ fontSize: 13, color: fg }}>{current.correo || '—'}</div>
                </div>
              </div>
              <div style={{ background: surfaceBg, padding: 12, borderRadius: 8, gridColumn: 'span 2' }}>
                <div style={{ fontSize: 10, color: subtle, textTransform: 'uppercase', marginBottom: 4 }}>Contacto Principal</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{current.contacto || '—'}</div>
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
