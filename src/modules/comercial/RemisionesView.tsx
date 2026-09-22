import React, { useState } from 'react';
import { 
  FileText, Plus, Pencil, Trash2, Eye, Search, AlertTriangle, X
} from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// PALETA DE COLORES - SISTEMA BASE
// ==========================================
const GOLD         = "#C9A227";
const GOLD_LIGHT   = "#E6B84A";
const DANGER       = "#DC3545";
const DANGER_BG    = "#FDECEA";
const DANGER_TXT   = "#721c24";
const SUCCESS      = "#28A745";
const SUCCESS_BG   = "#DCF7E6";
const SUCCESS_TXT  = "#155724";
const INFO         = "#4A90E2";
const INFO_BG      = "#E3F2FD";

// ==========================================
// INTERFACES Y MODELOS DE DATOS
// ==========================================
export interface FilaTalla {
  id: string;
  idCliente: string;
  idInsumo: string;
  nombreInsumo: string;
  cantidades: Record<string, number>; // Ej: { '36': 39, '38': 63, '40': 130 }
  total: number;
}

export interface Remision {
  id: string;
  fichaTecnica: string;
  entregaInsumos: 'SÍ' | 'NO';
  cantidadPrendasTotal: number;
  idCliente: string;
  nombreCliente: string;
  fechaEntrega: string;
  filasTallas: FilaTalla[];
}

// Configuración de las Matrices de Tallas según la estructura Excel
const TALLAS_ADULTO = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'];
const TALLAS_NINOS  = ['4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24', '26'];
const TALLAS_LETRAS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

// ==========================================
// COMPONENTES DE UI REUTILIZABLES
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
}> = ({ variant = 'gold', onClick, children, title }) => {
  let borderColor = GOLD;
  let iconColor = GOLD;
  if (variant === 'blue') {
    borderColor = INFO;
    iconColor = INFO;
  } else if (variant === 'danger') {
    borderColor = DANGER;
    iconColor = DANGER;
  }
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
}> = ({ title, icon, onClose, onSave, dark, maxWidth = "950px", children }) => {
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
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
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
        <div style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box' }}>
          {children}
        </div>
        {onSave && (
          <div style={{
            padding: '16px 24px', borderTop: `1px solid #C9A22725`,
            display: 'flex', justifyContent: 'flex-end', gap: 12,
            backgroundColor: dark ? '#252525' : '#FAFAFA'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)',
                background: dark ? '#2A2A2A' : '#EAEAEA', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: `linear-gradient(135deg, #C9A227, #C9A227, #E6B84A)`,
                color: '#121212', fontWeight: 700, fontSize: 13, cursor: 'pointer'
              }}
            >
              Guardar Remisión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL DE REMISIONES
// ==========================================
export const RemisionesView: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');

  // Lista de clientes y prendas predefinidas
  const clientesLista = [
    { id: '00-1', nombre: 'QueNOTA' },
    { id: '00-2', nombre: 'Offcors' },
    { id: '00-3', nombre: 'Nike' }
  ];

  const insumosLista = [
    { id: '00-1', nombre: 'Camisa' },
    { id: '00-2', nombre: 'Pantalón Niños' },
    { id: '00-3', nombre: 'Chaqueta Deportiva' }
  ];

  // Estado inicial con datos simulados exactos a los ejemplos
  const [remisiones, setRemisiones] = useState<Remision[]>([
    {
      id: 'REM-001',
      fichaTecnica: 'IMG-01',
      entregaInsumos: 'SÍ',
      cantidadPrendasTotal: 359,
      idCliente: '00-1',
      nombreCliente: 'QueNOTA',
      fechaEntrega: '2026-05-22',
      filasTallas: [
        {
          id: 'FILA-01',
          idCliente: '00-1',
          idInsumo: '00-1',
          nombreInsumo: 'Camisa',
          cantidades: { '36': 39, '38': 63, '40': 130, '42': 99, '44': 25, '50': 3 },
          total: 359
        }
      ]
    },
    {
      id: 'REM-002',
      fichaTecnica: 'IMG-02',
      entregaInsumos: 'NO',
      cantidadPrendasTotal: 450,
      idCliente: '00-2',
      nombreCliente: 'Offcors',
      fechaEntrega: '2026-06-10',
      filasTallas: []
    },
    {
      id: 'REM-003',
      fichaTecnica: 'IMG-03',
      entregaInsumos: 'SÍ',
      cantidadPrendasTotal: 200,
      idCliente: '00-3',
      nombreCliente: 'Nike',
      fechaEntrega: '2026-06-15',
      filasTallas: []
    }
  ]);

  // Estados de Modales
  const [modalForm, setModalForm] = useState(false);
  const [modalVer, setModalVer] = useState<Remision | null>(null);
  const [itemEditar, setItemEditar] = useState<Remision | null>(null);
  const [modalDelete, setModalDelete] = useState<Remision | null>(null);

  // Campos del Formulario
  const [formFicha, setFormFicha] = useState('IMG-01');
  const [formEntrega, setFormEntrega] = useState<'SÍ' | 'NO'>('SÍ');
  const [formClienteId, setFormClienteId] = useState('00-1');
  const [formFechaEntrega, setFormFechaEntrega] = useState('2026-05-22');
  const [formFilasTallas, setFormFilasTallas] = useState<FilaTalla[]>([]);

  // Abrir Formulario (Crear / Editar)
  const handleOpenForm = (rem?: Remision) => {
    if (rem) {
      setItemEditar(rem);
      setFormFicha(rem.fichaTecnica);
      setFormEntrega(rem.entregaInsumos);
      setFormClienteId(rem.idCliente);
      setFormFechaEntrega(rem.fechaEntrega);
      setFormFilasTallas(rem.filasTallas);
    } else {
      setItemEditar(null);
      setFormFicha(`IMG-0${remisiones.length + 1}`);
      setFormEntrega('SÍ');
      setFormClienteId('00-1');
      setFormFechaEntrega(new Date().toISOString().split('T')[0]);
      setFormFilasTallas([
        {
          id: 'FILA-01',
          idCliente: '00-1',
          idInsumo: '00-1',
          nombreInsumo: 'Camisa',
          cantidades: { '36': 39, '38': 63, '40': 130, '42': 99, '44': 25, '50': 3 },
          total: 359
        }
      ]);
    }
    setModalForm(true);
  };

  // Función para agregar filas dinámicas (+ al darle en este más salga otra fila)
  const handleAgregarFila = (tipoMatriz: 'ADULTO' | 'NINOS' | 'LETRAS') => {
    let insumoPredeterminado = insumosLista[0];
    if (tipoMatriz === 'NINOS') insumoPredeterminado = insumosLista[1];
    if (tipoMatriz === 'LETRAS') insumoPredeterminado = insumosLista[2];

    const nuevaFila: FilaTalla = {
      id: `FILA-${String(formFilasTallas.length + 1).padStart(2, '0')}`,
      idCliente: formClienteId,
      idInsumo: insumoPredeterminado.id,
      nombreInsumo: insumoPredeterminado.nombre,
      cantidades: {},
      total: 0
    };

    setFormFilasTallas([...formFilasTallas, nuevaFila]);
    toast.info("Nueva fila de tallas agregada");
  };

  // Manejar cambio de cantidades por casilla de talla
  const handleCantidadChange = (filaIndex: number, talla: string, valorStr: string) => {
    const val = parseInt(valorStr) || 0;
    const nuevasFilas = [...formFilasTallas];
    const filaActual = { ...nuevasFilas[filaIndex] };

    filaActual.cantidades = {
      ...filaActual.cantidades,
      [talla]: val
    };

    // Recalcular total de la fila
    filaActual.total = Object.values(filaActual.cantidades).reduce((a, b) => a + b, 0);
    nuevasFilas[filaIndex] = filaActual;

    setFormFilasTallas(nuevasFilas);
  };

  // Guardar Remisión
  const handleSaveRemision = () => {
    const clienteObj = clientesLista.find(c => c.id === formClienteId);
    const totalPrendas = formFilasTallas.reduce((acc, f) => acc + f.total, 0);

    if (itemEditar) {
      setRemisiones(remisiones.map(r => r.id === itemEditar.id ? {
        ...r,
        fichaTecnica: formFicha,
        entregaInsumos: formEntrega,
        idCliente: formClienteId,
        nombreCliente: clienteObj?.nombre || 'Cliente',
        fechaEntrega: formFechaEntrega,
        cantidadPrendasTotal: totalPrendas,
        filasTallas: formFilasTallas
      } : r));
      toast.success("Remisión actualizada correctamente");
    } else {
      const nueva: Remision = {
        id: `REM-00${remisiones.length + 1}`,
        fichaTecnica: formFicha,
        entregaInsumos: formEntrega,
        idCliente: formClienteId,
        nombreCliente: clienteObj?.nombre || 'Cliente',
        fechaEntrega: formFechaEntrega,
        cantidadPrendasTotal: totalPrendas,
        filasTallas: formFilasTallas
      };
      setRemisiones([nueva, ...remisiones]);
      toast.success("Nueva remisión registrada");
    }
    setModalForm(false);
  };

  // Estilos visuales
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const bg = dark ? "#121212" : "#F8F9FA";
  const inputBg = dark ? "#2A2A2A" : "#FFFFFF";
  const borderNormal = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const remisionesFiltradas = remisiones.filter(r => 
    r.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.nombreCliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.fichaTecnica.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* ENCABEZADO Y BUSCADOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Remisiones</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Órdenes de remisión vinculadas a clientes e insumos</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                padding: '8px 12px 8px 36px', borderRadius: 8,
                border: `1px solid ${borderNormal}`,
                background: dark ? '#252525' : '#FFFFFF', color: fg, fontSize: 13, outline: 'none'
              }}
            />
          </div>
          <button
            onClick={() => handleOpenForm()}
            style={{
              background: `linear-gradient(135deg, #C9A227, ${GOLD}, ${GOLD_LIGHT})`,
              color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10,
              padding: '10px 18px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <Plus size={16} /> Nueva remisión
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE REMISIONES */}
      <TableShell headers={['ID REMISIÓN', 'FICHA TÉCNICA', 'ENTREGA INSUMOS', 'CANTIDAD PRENDAS', 'ID CLIENTE', 'ACCIONES']} dark={dark}>
        {remisionesFiltradas.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
              No se encontraron remisiones registradas.
            </td>
          </tr>
        ) : (
          remisionesFiltradas.map((rem) => (
            <tr key={rem.id} style={{ borderBottom: `1px solid ${borderNormal}` }}>
              <td style={{ padding: '12px 14px' }}>
                <IdBadge id={rem.id} />
                <span style={{ fontSize: 11, color: subtle, marginLeft: 6 }}>{rem.filasTallas.length} ins.</span>
              </td>
              <td style={{ padding: '12px 14px', fontWeight: 700, color: INFO }}>
                {rem.fichaTecnica}
              </td>
              <td style={{ padding: '12px 14px' }}>
                <span style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                  backgroundColor: rem.entregaInsumos === 'SÍ' ? SUCCESS_BG : DANGER_BG,
                  color: rem.entregaInsumos === 'SÍ' ? SUCCESS : DANGER
                }}>
                  {rem.entregaInsumos} ▾
                </span>
              </td>
              <td style={{ padding: '12px 14px', fontWeight: 800, fontSize: 13, color: fg }}>
                {rem.cantidadPrendasTotal} und.
              </td>
              <td style={{ padding: '12px 14px' }}>
                <IdBadge id={rem.idCliente} />
                <span style={{ fontSize: 12, fontWeight: 600, color: subtle, marginLeft: 8 }}>{rem.nombreCliente}</span>
              </td>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ActionCircleBtn variant="blue" onClick={() => setModalVer(rem)} title="Ver Detalle">
                    <Eye size={14} />
                  </ActionCircleBtn>
                  <ActionCircleBtn variant="gold" onClick={() => handleOpenForm(rem)} title="Editar">
                    <Pencil size={14} />
                  </ActionCircleBtn>
                  <ActionCircleBtn variant="danger" onClick={() => setModalDelete(rem)} title="Eliminar">
                    <Trash2 size={14} />
                  </ActionCircleBtn>
                </div>
              </td>
            </tr>
          ))
        )}
      </TableShell>

      {/* ========================================================= */}
      {/* MODAL FORMULARIO: CREAR/EDITAR CON TABLA DE TALLAS EXCEL */}
      {/* ========================================================= */}
      {modalForm && (
        <Modal
          title={itemEditar ? "Editar Remisión" : "Nueva Remisión"}
          icon={<FileText size={18} color={GOLD} />}
          onClose={() => setModalForm(false)}
          onSave={handleSaveRemision}
          dark={dark}
          maxWidth="1000px"
        >
          {/* Fila 1: Selección de Datos de Cabecera */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 4 }}>CLIENTE</label>
              <select
                value={formClienteId}
                onChange={(e) => setFormClienteId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13 }}
              >
                {clientesLista.map(c => <option key={c.id} value={c.id}>{c.id} — {c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 4 }}>ENTREGA INSUMOS</label>
              <select
                value={formEntrega}
                onChange={(e) => setFormEntrega(e.target.value as 'SÍ' | 'NO')}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13 }}
              >
                <option value="SÍ">SÍ</option>
                <option value="NO">NO</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: subtle, display: 'block', marginBottom: 4 }}>FECHA DE ENTREGA</label>
              <input
                type="date"
                value={formFechaEntrega}
                onChange={(e) => setFormFechaEntrega(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ height: 1, background: borderNormal, margin: '8px 0' }} />

          {/* =================================================== */}
          {/* MATRICES DE TALLAS - ESTRUCTURA EXACTA A ARCHIVO EXCEL */}
          {/* =================================================== */}
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: fg }}>Matriz de Tallas e Insumos</h4>

          {/* BLOQUE 1: TALLAS NUMÉRICAS ADULTO (28 - 50) */}
          <div style={{ overflowX: 'auto', border: `1px solid ${borderNormal}`, borderRadius: 8, padding: 8, background: dark ? '#222' : '#FFF' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'center' }}>
              <thead>
                <tr style={{ background: dark ? '#2A2A2A' : '#F1F1F1', fontWeight: 700 }}>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>id_cliente</td>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>id_insumo</td>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>Talla</td>
                  {TALLAS_ADULTO.map(t => <td key={t} style={{ padding: 6, border: `1px solid ${borderNormal}`, minWidth: 32 }}>{t}</td>)}
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}`, fontWeight: 800 }}>TOTAL</td>
                </tr>
              </thead>
              <tbody>
                {formFilasTallas.map((fila, idx) => (
                  <tr key={fila.id}>
                    <td style={{ padding: 4, border: `1px solid ${borderNormal}`, fontWeight: 700 }}>{fila.idCliente}</td>
                    <td style={{ padding: 4, border: `1px solid ${borderNormal}`, fontWeight: 700 }}>{fila.idInsumo}</td>
                    <td style={{ padding: 4, border: `1px solid ${borderNormal}`, fontWeight: 700, color: subtle }}>Cantidad</td>
                    {TALLAS_ADULTO.map(talla => (
                      <td key={talla} style={{ padding: 2, border: `1px solid ${borderNormal}` }}>
                        <input
                          type="number"
                          value={fila.cantidades[talla] || ''}
                          onChange={(e) => handleCantidadChange(idx, talla, e.target.value)}
                          style={{ width: '100%', textAlign: 'center', border: 'none', background: 'transparent', outline: 'none', color: fg, fontWeight: 600 }}
                        />
                      </td>
                    ))}
                    <td style={{ padding: 4, border: `1px solid ${borderNormal}`, fontWeight: 800, color: GOLD }}>
                      {fila.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 6, textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => handleAgregarFila('ADULTO')}
                style={{ background: 'none', border: 'none', color: GOLD, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                (+) al darle en este mas salga otra fila
              </button>
            </div>
          </div>

          {/* RESUMEN CENTRAL DEL INSUMO Y FECHA DE ENTREGA */}
          <div style={{ border: `1px solid ${borderNormal}`, borderRadius: 8, overflow: 'hidden', margin: '8px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'center' }}>
              <thead>
                <tr style={{ background: dark ? '#2A2A2A' : '#F1F1F1', fontWeight: 700 }}>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>id_insumo</td>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}`, width: '60%' }}>Nombre insumo</td>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>Cantidad</td>
                </tr>
              </thead>
              <tbody>
                {formFilasTallas.map((fila) => (
                  <tr key={fila.id}>
                    <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>{fila.idInsumo}</td>
                    <td style={{ padding: 6, border: `1px solid ${borderNormal}`, fontWeight: 700 }}>{fila.nombreInsumo}</td>
                    <td style={{ padding: 6, border: `1px solid ${borderNormal}`, fontWeight: 800 }}>{fila.total}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} style={{ padding: 8, background: dark ? '#252525' : '#FAFAFA', fontWeight: 700, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: subtle }}>Fecha de entrega</div>
                    <div style={{ fontSize: 13, color: GOLD }}>{formFechaEntrega}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* BLOQUE 2: TALLAS NIÑOS (4 - 26) */}
          <div style={{ overflowX: 'auto', border: `1px solid ${borderNormal}`, borderRadius: 8, padding: 8, background: dark ? '#222' : '#FFF' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'center' }}>
              <thead>
                <tr style={{ background: dark ? '#2A2A2A' : '#F1F1F1', fontWeight: 700 }}>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>id_cliente</td>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>id_insumo</td>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>Talla</td>
                  {TALLAS_NINOS.map(t => <td key={t} style={{ padding: 6, border: `1px solid ${borderNormal}`, minWidth: 32 }}>{t}</td>)}
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}`, fontWeight: 800 }}>TOTAL</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 4, border: `1px solid ${borderNormal}` }}>{formClienteId}</td>
                  <td style={{ padding: 4, border: `1px solid ${borderNormal}` }}>00-2</td>
                  <td style={{ padding: 4, border: `1px solid ${borderNormal}`, color: subtle }}>Cantidad</td>
                  {TALLAS_NINOS.map(t => <td key={t} style={{ padding: 4, border: `1px solid ${borderNormal}` }}></td>)}
                  <td style={{ padding: 4, border: `1px solid ${borderNormal}` }}>0</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: 6, textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => handleAgregarFila('NINOS')}
                style={{ background: 'none', border: 'none', color: GOLD, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                (+) al darle en este mas salga otra fila
              </button>
            </div>
          </div>

          {/* BLOQUE 3: TALLAS LETRAS (XS - 5XL) */}
          <div style={{ overflowX: 'auto', border: `1px solid ${borderNormal}`, borderRadius: 8, padding: 8, background: dark ? '#222' : '#FFF' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'center' }}>
              <thead>
                <tr style={{ background: dark ? '#2A2A2A' : '#F1F1F1', fontWeight: 700 }}>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>id_cliente</td>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>id_insumo</td>
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}` }}>Talla</td>
                  {TALLAS_LETRAS.map(t => <td key={t} style={{ padding: 6, border: `1px solid ${borderNormal}`, minWidth: 32 }}>{t}</td>)}
                  <td style={{ padding: 6, border: `1px solid ${borderNormal}`, fontWeight: 800 }}>TOTAL</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 4, border: `1px solid ${borderNormal}` }}>{formClienteId}</td>
                  <td style={{ padding: 4, border: `1px solid ${borderNormal}` }}>00-3</td>
                  <td style={{ padding: 4, border: `1px solid ${borderNormal}`, color: subtle }}>Cantidad</td>
                  {TALLAS_LETRAS.map(t => <td key={t} style={{ padding: 4, border: `1px solid ${borderNormal}` }}></td>)}
                  <td style={{ padding: 4, border: `1px solid ${borderNormal}` }}>0</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: 6, textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => handleAgregarFila('LETRAS')}
                style={{ background: 'none', border: 'none', color: GOLD, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                (+) al darle en este mas salga otra fila
              </button>
            </div>
          </div>

        </Modal>
      )}

      {/* MODAL VER DETALLE */}
      {modalVer && (
        <Modal
          title={`Detalle de Remisión — ${modalVer.id}`}
          icon={<Eye size={18} color={INFO} />}
          onClose={() => setModalVer(null)}
          dark={dark}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><strong>Cliente:</strong> {modalVer.nombreCliente} ({modalVer.idCliente})</div>
            <div><strong>Ficha Técnica:</strong> {modalVer.fichaTecnica}</div>
            <div><strong>Entrega Insumos:</strong> {modalVer.entregaInsumos}</div>
            <div><strong>Fecha Entrega:</strong> {modalVer.fechaEntrega}</div>
            <div style={{ gridColumn: 'span 2' }}>
              <strong>Cantidad Total Prendas:</strong> <span style={{ color: GOLD, fontWeight: 800 }}>{modalVer.cantidadPrendasTotal} unidades</span>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL CONFIRMAR ELIMINAR */}
      {modalDelete && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16
        }}>
          <div style={{ width: '100%', maxWidth: 400, borderRadius: 16, backgroundColor: dark ? '#1E1E1E' : '#FFFFFF', padding: 24, textAlign: 'center' }}>
            <AlertTriangle size={36} color={DANGER} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px', color: fg }}>¿Eliminar Remisión?</h3>
            <p style={{ fontSize: 13, color: subtle, marginBottom: 20 }}>Esta acción eliminará el registro {modalDelete.id} permanentemente.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setModalDelete(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #CCC', background: 'transparent', color: fg }}>Cancelar</button>
              <button onClick={() => {
                setRemisiones(remisiones.filter(r => r.id !== modalDelete.id));
                setModalDelete(null);
                toast.success("Remisión eliminada");
              }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: DANGER, color: '#FFF', fontWeight: 700 }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};