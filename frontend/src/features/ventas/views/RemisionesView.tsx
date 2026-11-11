import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText, Plus, Trash2, UploadCloud, Save, ArrowLeft, ToggleLeft, ToggleRight, Box, Search, Eye, Pencil, ShieldAlert, User, X, AlertTriangle,
  CheckCircle2, XCircle, History, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { mensajeError } from '../../../shared/utils/api';
import { ACEPTA_ARCHIVOS, errorArchivo, urlArchivo } from '../../../shared/utils/archivos';
import {
  remisionService,
  type EstadoRemision,
  type Remision,
} from '../services/remisionService';
import { seguimientoService, type Seguimiento } from '../../produccion/services/seguimientoService';
import { clienteService, type Cliente } from '../../usuarios/services/clienteService';

// ==========================================
// PALETA DE COLORES Y ESTILOS BASE
// ==========================================
const GOLD         = "#C9A227";
const GOLD_LIGHT   = "#E6B84A";
const DANGER       = "#DC3545";
const DANGER_BG    = "#FDECEA";
const SUCCESS      = "#28A745";
const INFO         = "#4A90E2";
const WARNING      = "#FD7E14";
const WARNING_BG   = "#FFF3E0";
const PURPLE       = "#7C4DFF";

// Mismos estados que la base de datos (tb_remision.estado)
const ESTADOS_STYLES: Record<EstadoRemision, { bg: string; color: string }> = {
  "Pendiente":     { bg: WARNING_BG, color: WARNING },
  "Aprobada":      { bg: `${INFO}20`, color: INFO },
  "Rechazada":     { bg: DANGER_BG, color: DANGER },
  "En producción": { bg: `${PURPLE}20`, color: PURPLE },
  "Terminada":     { bg: `${SUCCESS}20`, color: SUCCESS },
  "Entregada":     { bg: `${GOLD}25`, color: GOLD },
};
const estiloEstado = (estado: string) => ESTADOS_STYLES[estado as EstadoRemision] ?? { bg: '#EEE', color: '#555' };

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];
const UNIDADES = ['Unidad', 'Metros', 'Conos', 'Rollos', 'Pares'];

// TEMPORAL mientras no hay login de clientes: el NIT del "cliente actual" se guarda aquí
const CLAVE_NIT_SESION = 'nit_cliente';

// ==========================================
// INTERFACES (formulario)
// ==========================================
interface RemisionProps {
  dark?: boolean;
  rolInicial?: 'ADMIN' | 'CLIENTE';
}

interface DetallePieza {
  nombre: string;
  talla: string;
  cantidad: number;
}

interface InsumoForm {
  nombre: string;
  cantidad: number;
  unidad: string;
}

const hoy = () => new Date().toISOString().split('T')[0];
const pesos = (n: number) => `$${Number(n || 0).toLocaleString('es-CO')}`;


// ==========================================
// COMPONENTES REUTILIZABLES
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
  variant?: 'blue' | 'gold' | 'danger';
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}> = ({ variant = 'gold', onClick, children, title, disabled = false }) => {
  let borderColor = disabled ? '#9A9A9A' : GOLD;
  let iconColor = disabled ? '#9A9A9A' : GOLD;

  if (variant === 'blue' && !disabled) { borderColor = INFO; iconColor = INFO; } 
  else if (variant === 'danger' && !disabled) { borderColor = DANGER; iconColor = DANGER; }

  return (
    <button
      onClick={onClick} title={title} disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent', 
        border: `1.5px solid ${borderColor}`, color: iconColor, 
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
};

export const Modal: React.FC<{
  title: string; icon?: React.ReactNode; onClose: () => void; dark?: boolean; maxWidth?: string; children: React.ReactNode;
}> = ({ title, icon, onClose, dark, maxWidth = "650px", children }) => {
  const cardBg = dark ? '#1E1E1E' : '#FFFFFF';
  const fg = dark ? '#F8F9FA' : '#121212';
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ width: '100%', maxWidth, borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 3, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon}
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif' }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL: RemisionesView
// ==========================================
export const RemisionesView: React.FC<RemisionProps> = ({ dark = false, rolInicial = 'CLIENTE' }) => {
  const [rolActivo, setRolActivo] = useState<'ADMIN' | 'CLIENTE'>(rolInicial);
  const [vistaActual, setVistaActual] = useState<'listado' | 'formulario'>('listado');
  const [modalDetalle, setModalDetalle] = useState<Remision | null>(null);
  const [historial, setHistorial] = useState<Seguimiento[]>([]);

  // Modales de confirmación
  const [idParaEliminar, setIdParaEliminar] = useState<string | null>(null);
  const [rechazo, setRechazo] = useState<{ id: string; motivo: string } | null>(null);

  const [remisionEnEdicion, setRemisionEnEdicion] = useState<string | null>(null);

  const bg = dark ? "#121212" : "#F8F9FA";
  const fg = dark ? "#F8F9FA" : "#121212";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";

  // ---------- Datos de la API ----------
  const [remisiones, setRemisiones] = useState<Remision[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const leerNitSesion = () => {
    try { return localStorage.getItem(CLAVE_NIT_SESION) || ''; } catch { return ''; }
  };
  const [nitSesion, setNitSesion] = useState<string>(leerNitSesion);

  const cambiarNitSesion = (nit: string) => {
    setNitSesion(nit);
    try { localStorage.setItem(CLAVE_NIT_SESION, nit); } catch { /* sin almacenamiento */ }
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const [lista, listaClientes] = await Promise.all([
          remisionService.listar(),
          clienteService.listar('Activo'),
        ]);
        setRemisiones(lista);
        setClientes(listaClientes);
        // Si no hay "cliente actual" guardado, se toma el primero (solo para pruebas)
        if (!leerNitSesion() && listaClientes.length > 0) cambiarNitSesion(listaClientes[0].nit);
      } catch (error) {
        toast.error(`No se pudieron cargar las remisiones: ${mensajeError(error)}`);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const reemplazarEnLista = (rem: Remision) =>
    setRemisiones(prev => prev.some(r => r.id_remision === rem.id_remision)
      ? prev.map(r => r.id_remision === rem.id_remision ? rem : r)
      : [rem, ...prev]);

  // ---------- Formulario ----------
  const [busqueda, setBusqueda] = useState('');

  const [fichaTecnica, setFichaTecnica] = useState<File | null>(null);
  const [nombreArchivoFicha, setNombreArchivoFicha] = useState<string>('');

  const [fechaRecibo, setFechaRecibo] = useState(hoy());
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [nit, setNit] = useState('');
  const [costoPrenda, setCostoPrenda] = useState<number | ''>('');
  const [habilitarInsumos, setHabilitarInsumos] = useState(false);
  const [detalles, setDetalles] = useState<DetallePieza[]>([{ nombre: '', talla: 'S', cantidad: 0 }]);
  const [insumosEnviados, setInsumosEnviados] = useState<InsumoForm[]>([]);

  // El total lo vuelve a calcular la base de datos; aquí solo se muestra
  const totalPrendas = detalles.reduce((s, d) => s + (Number(d.cantidad) || 0), 0);

  const resetForm = () => {
    setRemisionEnEdicion(null);
    setFechaEntrega('');
    setCostoPrenda('');
    setDetalles([{ nombre: '', talla: 'S', cantidad: 0 }]);
    setHabilitarInsumos(false);
    setInsumosEnviados([]);
    setFichaTecnica(null);
    setNombreArchivoFicha('');
  };

  const handleNuevaRemision = () => {
    resetForm();
    setNit(rolActivo === 'CLIENTE' ? nitSesion : '');
    setFechaRecibo(hoy());
    setVistaActual('formulario');
  };

  const handleEditarRemision = (remision: Remision) => {
    setRemisionEnEdicion(remision.id_remision);
    setNit(remision.nit_cliente);
    setFechaRecibo(remision.fecha_recibo);
    setFechaEntrega(remision.fecha_entrega ?? '');
    setCostoPrenda(remision.costo_prenda);
    setHabilitarInsumos(remision.insumos.length > 0);
    setDetalles(remision.detalles.map(d => ({ nombre: d.nombre_de_la_pieza, talla: d.talla, cantidad: d.cantidad })));
    setInsumosEnviados(remision.insumos.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, unidad: i.unidad })));
    setNombreArchivoFicha(remision.ficha_tecnica_url ? remision.ficha_tecnica_nombre : '');
    setFichaTecnica(null);
    setVistaActual('formulario');
  };

  const seleccionarFicha = (archivo: File | null) => {
    if (archivo) {
      const error = errorArchivo(archivo);
      if (error) { toast.error(error); return; }
    }
    setFichaTecnica(archivo);
  };

  const handleSaveRemision = async () => {
    if (!nit) {
      toast.error('Seleccione el cliente de la remisión.');
      return;
    }
    if (!fichaTecnica && !nombreArchivoFicha) {
      toast.error('La Ficha Técnica es un documento obligatorio.');
      return;
    }
    if (!fechaEntrega || costoPrenda === '' || Number(costoPrenda) < 0 || detalles.some(d => !d.nombre.trim() || d.cantidad <= 0)) {
      toast.error('Por favor completa todos los campos obligatorios del detalle.');
      return;
    }
    if (fechaEntrega < fechaRecibo) {
      toast.error('La fecha de entrega no puede ser anterior a la fecha de recibo.');
      return;
    }
    const claves = detalles.map(d => `${d.nombre.trim().toLowerCase()}|${d.talla.toLowerCase()}`);
    if (new Set(claves).size !== claves.length) {
      toast.error('Hay prendas repetidas con la misma talla. Sume las cantidades en una sola línea.');
      return;
    }
    const insumos = habilitarInsumos ? insumosEnviados : [];
    if (insumos.some(i => !i.nombre.trim() || i.cantidad <= 0)) {
      toast.error('Completa el nombre y la cantidad de cada insumo, o quita las filas vacías.');
      return;
    }

    const datos = {
      ficha_tecnica_nombre: fichaTecnica ? fichaTecnica.name : nombreArchivoFicha,
      fecha_recibo: fechaRecibo,
      fecha_entrega: fechaEntrega,
      costo_prenda: Number(costoPrenda),
      detalles: detalles.map(d => ({ nombre_de_la_pieza: d.nombre.trim(), talla: d.talla, cantidad: Number(d.cantidad) })),
      insumos: insumos.map(i => ({ nombre: i.nombre.trim(), cantidad: Number(i.cantidad), unidad: i.unidad })),
    };

    setGuardando(true);
    try {
      let rem = remisionEnEdicion
        ? await remisionService.actualizar(remisionEnEdicion, datos)
        : await remisionService.crear({ ...datos, nit_cliente: nit });

      // La ficha se sube después de guardar los datos (va como archivo, no como JSON)
      if (fichaTecnica) {
        try {
          rem = await remisionService.subirFicha(rem.id_remision, fichaTecnica, true);
        } catch (error) {
          toast.warning(`La remisión ${rem.id_remision} se guardó, pero la ficha no se pudo subir: ${mensajeError(error)}. Edítela para intentarlo de nuevo.`);
        }
      }
      reemplazarEnLista(rem);
      toast.success(remisionEnEdicion
        ? `Remisión ${rem.id_remision} actualizada correctamente.`
        : `Remisión ${rem.id_remision} creada. Queda Pendiente de aprobación.`);
      setVistaActual('listado');
      resetForm();
    } catch (error) {
      toast.error(mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  // ---------- Acciones del administrador ----------
  const aprobar = async (id: string) => {
    try {
      reemplazarEnLista(await remisionService.aprobar(id));
      toast.success(`Remisión ${id} aprobada. Ya puede pasar a producción.`);
    } catch (error) {
      toast.error(mensajeError(error));
    }
  };

  const confirmarRechazo = async () => {
    if (!rechazo) return;
    if (rechazo.motivo.trim().length < 3) {
      toast.error('Escriba el motivo del rechazo.');
      return;
    }
    try {
      reemplazarEnLista(await remisionService.rechazar(rechazo.id, rechazo.motivo.trim()));
      toast.success(`Remisión ${rechazo.id} rechazada.`);
      setRechazo(null);
    } catch (error) {
      toast.error(mensajeError(error));
    }
  };

  const confirmarEliminacion = async () => {
    if (!idParaEliminar) return;
    try {
      await remisionService.eliminar(idParaEliminar);
      setRemisiones(prev => prev.filter(r => r.id_remision !== idParaEliminar));
      toast.success('Remisión eliminada.');
    } catch (error) {
      toast.error(mensajeError(error));
    } finally {
      setIdParaEliminar(null);
    }
  };

  const verDetalle = async (rem: Remision) => {
    setModalDetalle(rem);
    setHistorial([]);
    try {
      setHistorial(await seguimientoService.historialRemision(rem.id_remision));
    } catch {
      /* el historial es informativo; si falla se muestra vacío */
    }
  };

  // ---------- Filtro y paginación ----------
  const datosMostrar = rolActivo === 'CLIENTE' ? remisiones.filter(r => r.nit_cliente === nitSesion) : remisiones;
  const remisionesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return datosMostrar.filter(r =>
      r.id_remision.toLowerCase().includes(q) || r.nit_cliente.includes(q) || r.cliente.toLowerCase().includes(q));
  }, [datosMostrar, busqueda]);

  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [busqueda, rolActivo, nitSesion]);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = remisionesFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(remisionesFiltradas.length / itemsPerPage);

  const inputEstilo: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' };

  // ==========================================
  // RENDER DE VISTA 1: LISTADO
  // ==========================================
  if (vistaActual === 'listado') {
    return (
      <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>{rolActivo === 'ADMIN' ? 'Gestión de Remisiones (Admin)' : 'Mis Remisiones (Cliente)'}</h2>
            <p style={{ fontSize: 13, color: subtle, margin: 0 }}>{rolActivo === 'ADMIN' ? 'Aprueba o rechaza las remisiones de todos los clientes.' : 'Consulta el estado de tus envíos y crea nuevas remisiones.'}</p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: inputBg, padding: '4px', borderRadius: 8, display: 'flex', border: `1px solid ${borderNormal}` }}>
              <button onClick={() => setRolActivo('CLIENTE')} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: rolActivo === 'CLIENTE' ? cardBg : 'transparent', color: rolActivo === 'CLIENTE' ? GOLD : subtle, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: rolActivo === 'CLIENTE' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                <User size={14} /> Vista Cliente
              </button>
              <button onClick={() => setRolActivo('ADMIN')} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: rolActivo === 'ADMIN' ? cardBg : 'transparent', color: rolActivo === 'ADMIN' ? INFO : subtle, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: rolActivo === 'ADMIN' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}>
                <ShieldAlert size={14} /> Vista Admin
              </button>
            </div>

            {/* TEMPORAL hasta tener login de clientes: elegir qué cliente "está conectado" */}
            {rolActivo === 'CLIENTE' && (
              <select value={nitSesion} onChange={(e) => cambiarNitSesion(e.target.value)} title="Cliente actual (temporal hasta tener login)" style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, fontSize: 12, outline: 'none', maxWidth: 220 }}>
                {clientes.length === 0 && <option value="">No hay clientes activos</option>}
                {clientes.map(c => <option key={c.nit} value={c.nit}>{c.nombre} ({c.nit})</option>)}
              </select>
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
              <input type="text" placeholder="Buscar remisión o cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ padding: '8px 12px 8px 36px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, fontSize: 13, outline: 'none' }} />
            </div>

            <button onClick={handleNuevaRemision} disabled={rolActivo === 'CLIENTE' && !nitSesion} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '8px 16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: rolActivo === 'CLIENTE' && !nitSesion ? 0.5 : 1 }}>
              <Plus size={14} /> Nueva Remisión
            </button>
          </div>
        </div>

        <div style={{ borderRadius: 12, overflow: 'auto', border: `1px solid ${borderNormal}`, background: cardBg }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
                {['ID', rolActivo === 'ADMIN' ? 'CLIENTE' : '', 'FECHA RECIBO', 'FECHA ENTREGA', 'TOTAL PRENDAS', 'COSTO TOTAL', 'INSUMOS ENVIADOS', 'ESTADO', 'ACCIONES'].filter(Boolean).map(h => (
                  <th key={h} style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 14px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: subtle }}><Loader2 size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Cargando remisiones...</td></tr>
              ) : remisionesFiltradas.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: subtle }}>No hay remisiones registradas.</td></tr>
              ) : (
                currentItems.map(rem => {
                  const st = estiloEstado(rem.estado);
                  return (
                  <tr key={rem.id_remision} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                    <td style={{ padding: '12px 14px' }}><IdBadge id={rem.id_remision} /></td>
                    {rolActivo === 'ADMIN' && (
                      <td style={{ padding: '12px 14px', fontSize: 12 }}>
                        <div style={{ fontWeight: 700 }}>{rem.cliente}</div>
                        <div style={{ fontSize: 11, color: subtle }}>{rem.nit_cliente}</div>
                      </td>
                    )}
                    <td style={{ padding: '12px 14px', fontSize: 11, color: subtle }}>{rem.fecha_recibo}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: subtle }}>{rem.fecha_entrega ?? '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700 }}>{rem.total_prendas}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600 }}>{pesos(rem.costo_total)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12 }}>{rem.insumos_enviados ? 'Sí' : 'No'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{rem.estado}</span>
                    </td>

                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionCircleBtn variant="blue" onClick={() => verDetalle(rem)} title="Ver Detalle"><Eye size={14} /></ActionCircleBtn>
                        <ActionCircleBtn variant="gold" onClick={() => handleEditarRemision(rem)} title="Editar (solo Pendiente)" disabled={rem.estado !== 'Pendiente'}><Pencil size={14} /></ActionCircleBtn>
                        {rolActivo === 'ADMIN' && (
                          <>
                            <ActionCircleBtn variant="blue" onClick={() => aprobar(rem.id_remision)} title="Aprobar" disabled={rem.estado !== 'Pendiente'}><CheckCircle2 size={14} /></ActionCircleBtn>
                            <ActionCircleBtn variant="danger" onClick={() => setRechazo({ id: rem.id_remision, motivo: '' })} title="Rechazar" disabled={rem.estado !== 'Pendiente' && rem.estado !== 'Aprobada'}><XCircle size={14} /></ActionCircleBtn>
                            <ActionCircleBtn variant="danger" onClick={() => setIdParaEliminar(rem.id_remision)} title="Eliminar (Pendiente o Rechazada)" disabled={rem.estado !== 'Pendiente' && rem.estado !== 'Rechazada'}><Trash2 size={14} /></ActionCircleBtn>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px' }}>
          <span style={{ fontSize: 12, color: subtle, fontFamily: 'Montserrat, sans-serif' }}>
            Mostrando de {remisionesFiltradas.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, remisionesFiltradas.length)} de {remisionesFiltradas.length} registros
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

        {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {idParaEliminar && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
            <div style={{ background: '#1E1E1E', borderRadius: 16, width: '100%', maxWidth: 420, padding: 32, textAlign: 'center', border: `1px solid rgba(255,255,255,0.08)`, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: DANGER }}>
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#F8F9FA', margin: '0 0 12px' }}>¿Eliminar la remisión {idParaEliminar}?</h3>
              <div style={{ background: '#FDEDED', color: DANGER, padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 24, border: '1px solid #FCA5A5' }}>
                Se eliminarán también sus prendas, los insumos enviados y su historial de estados.
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setIdParaEliminar(null)} style={{ flex: 1, backgroundColor: '#2A2A2A', color: '#F8F9FA', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={confirmarEliminacion} style={{ flex: 1, backgroundColor: DANGER, color: '#FFF', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE RECHAZO (pide el motivo) */}
        {rechazo && (
          <Modal title={`Rechazar remisión ${rechazo.id}`} icon={<XCircle size={18} color={DANGER} />} onClose={() => setRechazo(null)} dark={dark} maxWidth="480px">
            <label style={{ fontSize: 11, fontWeight: 700, color: subtle }}>MOTIVO DEL RECHAZO <span style={{ color: DANGER }}>*</span></label>
            <textarea value={rechazo.motivo} onChange={(e) => setRechazo({ ...rechazo, motivo: e.target.value })} rows={4} maxLength={500} placeholder="Ej. Faltan piezas de la talla M / La ficha técnica no es legible" style={{ ...inputEstilo, resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setRechazo(null)} style={{ backgroundColor: inputBg, color: fg, border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarRechazo} style={{ backgroundColor: DANGER, color: '#FFF', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Rechazar remisión</button>
            </div>
          </Modal>
        )}

        {/* MODAL DE VER DETALLE */}
        {modalDetalle && (
          <Modal title={`Detalle de Remisión ${modalDetalle.id_remision}`} icon={<FileText size={18} color={INFO} />} onClose={() => setModalDetalle(null)} dark={dark} maxWidth="750px">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                ['ESTADO', <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: estiloEstado(modalDetalle.estado).bg, color: estiloEstado(modalDetalle.estado).color }}>{modalDetalle.estado}</span>],
                ['CLIENTE', <span style={{ fontSize: 13, fontWeight: 800, color: fg }}>{modalDetalle.cliente} <span style={{ color: subtle, fontWeight: 600 }}>({modalDetalle.nit_cliente})</span></span>],
                ['COSTO POR PRENDA', <span style={{ fontSize: 13, fontWeight: 800, color: fg }}>{pesos(modalDetalle.costo_prenda)}</span>],
                ['FECHA RECIBO', <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>{modalDetalle.fecha_recibo}</span>],
                ['FECHA ENTREGA ESPERADA', <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>{modalDetalle.fecha_entrega ?? '—'}</span>],
                ['TOTAL PRENDAS / COSTO TOTAL', <span style={{ fontSize: 16, fontWeight: 800, color: GOLD }}>{modalDetalle.total_prendas} · {pesos(modalDetalle.costo_total)}</span>],
              ].map(([titulo, valor]) => (
                <div key={String(titulo)} style={{ background: inputBg, padding: '12px 16px', borderRadius: 10, border: `1px solid ${borderNormal}` }}>
                  <span style={{ fontSize: 10, color: subtle, fontWeight: 700, display: 'block', marginBottom: 4 }}>{titulo}</span>
                  {valor}
                </div>
              ))}
            </div>

            {modalDetalle.observaciones && (
              <div style={{ padding: 12, borderRadius: 8, backgroundColor: modalDetalle.estado === 'Rechazada' ? DANGER_BG : inputBg, color: modalDetalle.estado === 'Rechazada' ? DANGER : fg, fontSize: 12, fontWeight: 600 }}>
                {modalDetalle.estado === 'Rechazada' ? 'Motivo del rechazo: ' : 'Observaciones: '}{modalDetalle.observaciones}
              </div>
            )}

            {/* Ficha Técnica */}
            <div style={{ marginTop: 8, padding: 12, backgroundColor: `${INFO}15`, borderRadius: 8, border: `1px solid ${INFO}40`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color={INFO} />
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: INFO, display: 'block' }}>Ficha Técnica Asociada</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: fg }}>{modalDetalle.ficha_tecnica_nombre}{!modalDetalle.ficha_tecnica_url && ' (sin archivo adjunto)'}</span>
                </div>
              </div>
              {modalDetalle.ficha_tecnica_url && (
                <a href={urlArchivo(modalDetalle.ficha_tecnica_url) ?? '#'} target="_blank" rel="noreferrer" style={{ background: INFO, color: '#FFF', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Ver / Descargar</a>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: fg, margin: '0 0 10px 0' }}>Prendas a Confeccionar</h4>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${borderNormal}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: inputBg }}>
                      <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>PRENDA</th>
                      <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>TALLA</th>
                      <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>CANTIDAD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalDetalle.detalles.map(d => (
                      <tr key={d.id_detalle_de_remision} style={{ borderTop: `1px solid ${borderNormal}` }}>
                        <td style={{ padding: '8px 12px', color: fg, fontWeight: 600 }}>{d.nombre_de_la_pieza}</td>
                        <td style={{ padding: '8px 12px', color: fg }}>{d.talla}</td>
                        <td style={{ padding: '8px 12px', color: fg, fontWeight: 700 }}>{d.cantidad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {modalDetalle.insumos.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: fg, margin: '0 0 10px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Box size={14} color={INFO}/> Insumos Enviados por el Cliente
                </h4>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${borderNormal}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: inputBg }}>
                        <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>INSUMO</th>
                        <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>ENVIADO</th>
                        <th style={{ padding: '8px 12px', color: subtle, fontWeight: 700 }}>DISPONIBLE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalDetalle.insumos.map(ins => (
                        <tr key={ins.id_insumo_enviado} style={{ borderTop: `1px solid ${borderNormal}` }}>
                          <td style={{ padding: '8px 12px', color: fg, fontWeight: 600 }}>{ins.nombre}</td>
                          <td style={{ padding: '8px 12px', color: fg }}>{ins.cantidad} {ins.unidad}</td>
                          <td style={{ padding: '8px 12px', color: fg }}>{ins.cantidad_disponible} {ins.unidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Historial de estados (tb_seguimiento_remision) */}
            <div style={{ marginTop: 8 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: fg, margin: '0 0 10px 0', display: 'flex', gap: 6, alignItems: 'center' }}>
                <History size={14} color={GOLD} /> Seguimiento de estados
              </h4>
              {historial.length === 0 ? (
                <div style={{ fontSize: 12, color: subtle }}>Sin registros de seguimiento.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {historial.map(h => (
                    <div key={h.id_seguimiento} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 12px', borderRadius: 8, background: inputBg, fontSize: 12 }}>
                      <span style={{ color: fg, fontWeight: 600 }}>
                        {h.estado_anterior ? `${h.estado_anterior} → ` : 'Creada · '}
                        <span style={{ color: estiloEstado(h.estado_nuevo).color, fontWeight: 800 }}>{h.estado_nuevo}</span>
                      </span>
                      <span style={{ color: subtle }}>{h.responsable} ({h.tipo_responsable}) · {new Date(h.fecha_hora).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER DE VISTA 2: FORMULARIO (CREAR O EDITAR)
  // ==========================================
  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => setVistaActual('listado')} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>
              {remisionEnEdicion ? `Editar Remisión ${remisionEnEdicion}` : 'Crear Remisión'}
            </h2>
            <p style={{ fontSize: 13, color: subtle, margin: 0 }}>
              {remisionEnEdicion ? 'Actualiza los datos de la remisión pendiente.' : 'Diligencia la información general y detalles de las prendas a confeccionar.'}
            </p>
          </div>
        </div>
        <button onClick={handleSaveRemision} disabled={guardando} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '10px 20px', border: 'none', cursor: guardando ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: guardando ? 0.7 : 1 }}>
          {guardando ? <Loader2 size={18} /> : <Save size={18} />} {guardando ? 'Guardando...' : remisionEnEdicion ? 'Actualizar Remisión' : 'Enviar Remisión'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${borderNormal}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color={GOLD} /> Información General</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>CLIENTE</label>
                {rolActivo === 'ADMIN' && !remisionEnEdicion ? (
                  <select value={nit} onChange={(e) => setNit(e.target.value)} style={inputEstilo}>
                    <option value="">Seleccione...</option>
                    {clientes.map(c => <option key={c.nit} value={c.nit}>{c.nombre} ({c.nit})</option>)}
                  </select>
                ) : (
                  <input type="text" value={clientes.find(c => c.nit === nit)?.nombre ? `${clientes.find(c => c.nit === nit)?.nombre} (${nit})` : nit} disabled style={{ ...inputEstilo, color: subtle }} />
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>COSTO POR PRENDA PACTADO ($)</label>
                <input type="number" min={0} value={costoPrenda} onChange={(e) => setCostoPrenda(e.target.value === '' ? '' : Number(e.target.value))} style={inputEstilo} placeholder="Ej. 13400" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>FECHA DE RECIBO</label>
                <input type="date" value={fechaRecibo} onChange={(e) => setFechaRecibo(e.target.value)} disabled={rolActivo === 'CLIENTE'} style={{ ...inputEstilo, color: rolActivo === 'CLIENTE' ? subtle : fg, opacity: rolActivo === 'CLIENTE' ? 0.7 : 1 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>FECHA DE ENTREGA ESPERADA</label>
                <input type="date" value={fechaEntrega} min={fechaRecibo} onChange={(e) => setFechaEntrega(e.target.value)} style={inputEstilo} />
              </div>

              {/* FICHA TÉCNICA OBLIGATORIA */}
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  FICHA TÉCNICA <span style={{ color: DANGER, fontSize: 14 }}>*</span>
                </label>
                <div style={{ border: `2px dashed ${GOLD}60`, borderRadius: 10, padding: 20, textAlign: 'center', backgroundColor: `${GOLD}0A`, cursor: 'pointer' }}>
                  <input type="file" onChange={(e) => seleccionarFicha(e.target.files?.[0] || null)} style={{ display: 'none' }} id="ficha-upload" accept={ACEPTA_ARCHIVOS} />
                  <label htmlFor="ficha-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <UploadCloud size={24} color={GOLD} />
                    <span style={{ fontSize: 13, color: fg, fontWeight: 600 }}>
                      {fichaTecnica ? fichaTecnica.name : (nombreArchivoFicha ? `Archivo actual: ${nombreArchivoFicha} (Clic para cambiar)` : "Clic para subir Ficha Técnica (PDF o imagen, máx. 5 MB)")}
                    </span>
                  </label>
                  {fichaTecnica && (
                    <button onClick={() => setFichaTecnica(null)} style={{ marginTop: 8, background: 'none', border: 'none', color: DANGER, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={12} /> Quitar archivo</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${borderNormal}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: habilitarInsumos ? 20 : 0 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}><Box size={18} color={INFO} /> Habilitar insumos enviados</h3>
                <p style={{ fontSize: 11, color: subtle, margin: 0 }}>¿Se enviarán insumos propios para esta producción?</p>
              </div>
              <button onClick={() => { setHabilitarInsumos(!habilitarInsumos); if (habilitarInsumos) setInsumosEnviados([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {habilitarInsumos ? <ToggleRight size={36} color={SUCCESS} /> : <ToggleLeft size={36} color={subtle} />}
              </button>
            </div>

            {habilitarInsumos && (
              <div style={{ borderTop: `1px solid ${borderNormal}`, paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: fg }}>Listado de Insumos</span>
                  <button onClick={() => setInsumosEnviados([...insumosEnviados, { nombre: '', cantidad: 0, unidad: 'Unidad' }])} style={{ background: `${INFO}15`, color: INFO, border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} /> Agregar Insumo</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {insumosEnviados.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 16, color: subtle, fontSize: 12, backgroundColor: inputBg, borderRadius: 8 }}>Aún no has agregado insumos.</div>
                  ) : (
                    insumosEnviados.map((ins, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                        <input type="text" placeholder="Nombre insumo" value={ins.nombre} onChange={(e) => setInsumosEnviados(insumosEnviados.map((x, i) => i === idx ? { ...x, nombre: e.target.value } : x))} style={{ ...inputEstilo, padding: '8px 10px', fontSize: 12 }} />
                        <input type="number" min={1} placeholder="Cant." value={ins.cantidad || ''} onChange={(e) => setInsumosEnviados(insumosEnviados.map((x, i) => i === idx ? { ...x, cantidad: Number(e.target.value) } : x))} style={{ ...inputEstilo, padding: '8px 10px', fontSize: 12 }} />
                        <select value={ins.unidad} onChange={(e) => setInsumosEnviados(insumosEnviados.map((x, i) => i === idx ? { ...x, unidad: e.target.value } : x))} style={{ ...inputEstilo, padding: '8px 10px', fontSize: 12 }}>
                          {(UNIDADES.includes(ins.unidad) ? UNIDADES : [ins.unidad, ...UNIDADES]).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <button onClick={() => setInsumosEnviados(insumosEnviados.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: DANGER, cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${borderNormal}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={18} color={GOLD} /> Detalle de Prendas</h3>
            <button onClick={() => setDetalles([...detalles, { nombre: '', talla: 'S', cantidad: 0 }])} style={{ background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={14} /> Añadir Prenda</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
            {detalles.map((det, index) => (
              <div key={index} style={{ background: inputBg, borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end', border: `1px solid ${borderNormal}` }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>PRENDA</label>
                  <input type="text" value={det.nombre} onChange={(e) => setDetalles(detalles.map((x, i) => i === index ? { ...x, nombre: e.target.value } : x))} placeholder="Ej. Camisa polo" style={{ ...inputEstilo, padding: '8px 10px', fontSize: 12, backgroundColor: cardBg }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>TALLA</label>
                  <select value={det.talla} onChange={(e) => setDetalles(detalles.map((x, i) => i === index ? { ...x, talla: e.target.value } : x))} style={{ ...inputEstilo, padding: '8px 10px', fontSize: 12, backgroundColor: cardBg }}>
                    {(TALLAS.includes(det.talla) ? TALLAS : [det.talla, ...TALLAS]).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: subtle, display: 'block', marginBottom: 6 }}>CANTIDAD</label>
                  <input type="number" min={1} value={det.cantidad || ''} onChange={(e) => setDetalles(detalles.map((x, i) => i === index ? { ...x, cantidad: Number(e.target.value) } : x))} placeholder="0" style={{ ...inputEstilo, padding: '8px 10px', fontSize: 12, backgroundColor: cardBg }} />
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <button onClick={() => setDetalles(detalles.filter((_, i) => i !== index))} disabled={detalles.length === 1} style={{ background: 'transparent', border: 'none', color: detalles.length === 1 ? subtle : DANGER, cursor: detalles.length === 1 ? 'not-allowed' : 'pointer' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `2px dashed ${borderNormal}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: subtle }}>Total de prendas a confeccionar:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: GOLD }}>{totalPrendas}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: subtle }}>Costo total estimado:</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: fg }}>{pesos(totalPrendas * (Number(costoPrenda) || 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
