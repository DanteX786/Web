import React, { useState } from 'react';
import { 
  Factory, Scissors, Wrench, Plus, Pencil, Trash2, X,
  Eye, Search, AlertTriangle, FileText
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
const WARNING      = "#FD7E14";
const WARNING_BG   = "#FFF3E0";
const WARNING_TXT  = "#7a3000";
const INFO         = "#4A90E2";
const INFO_BG      = "#E3F2FD";
const INFO_TXT     = "#0c3060";

const ESTADOS_STYLES: Record<string, { bg: string; color: string }> = {
  "En proceso": { bg: WARNING_BG, color: WARNING },
  "Finalizado": { bg: SUCCESS_BG, color: SUCCESS },
  "Pausado":    { bg: INFO_BG,    color: INFO },
  "Cancelado":  { bg: DANGER_BG,  color: DANGER }
};

function nextId(prefix: string, existing: string[]): string {
  const nums = existing.map(id => parseInt(id.replace(prefix + "-", "")) || 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

export interface DetalleProduccion {
  id: string;
  empleado: string;
  pieza: string;
  maquina: string;
  insumo: string;
  cantidad: number;
  fechaAsignada: string;
  fichaTecnica?: string;
}

export interface Produccion {
  id: string;
  ordenPedido: string;
  remision: string;
  fechaInicio: string;
  fechaEntrega: string;
  estado: 'En proceso' | 'Finalizado' | 'Pausado' | 'Cancelado';
  detalles: DetalleProduccion[];
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg, fontFamily: 'Montserrat, sans-serif' }}>{title}</h2>
        <p style={{ fontSize: 13, color: subtle, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>{subtitle}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
          <Plus size={14} /> {addLabel}
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
            ¿Eliminar registro?
          </h3>

          <div style={{
            background: DANGER_BG, border: `1px solid ${DANGER}4D`,
            borderRadius: 10, padding: '10px 14px', fontSize: 12,
            color: DANGER_TXT, fontWeight: 600, marginBottom: 20
          }}>
            Esta acción eliminará el registro de producción y sus asignaciones asociadas.
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

interface ProduccionViewProps {
  dark?: boolean;
}

export const ProduccionView: React.FC<ProduccionViewProps> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');

  const [producciones, setProducciones] = useState<Produccion[]>([
    {
      id: 'PRD-001',
      ordenPedido: 'ORD-001',
      remision: 'REM-101',
      fechaInicio: '2026-09-01',
      fechaEntrega: '2026-09-15',
      estado: 'En proceso',
      detalles: [
        { id: 'DET-001', empleado: 'Juan Pérez', pieza: 'Manga Larga', maquina: 'Plana Industrial', insumo: 'INS-001 — Hilo Blanco 40/2', cantidad: 50, fechaAsignada: '2026-09-02', fichaTecnica: 'FICHA-ML.pdf' }
      ]
    },
    {
      id: 'PRD-002',
      ordenPedido: 'ORD-002',
      remision: 'REM-102',
      fechaInicio: '2026-09-05',
      fechaEntrega: '2026-09-20',
      estado: 'Finalizado',
      detalles: []
    },
    {
      id: 'PRD-003',
      ordenPedido: 'ORD-003',
      remision: 'REM-103',
      fechaInicio: '2026-09-10',
      fechaEntrega: '2026-09-25',
      estado: 'Pausado',
      detalles: []
    },
    {
      id: 'PRD-004',
      ordenPedido: 'ORD-004',
      remision: 'REM-104',
      fechaInicio: '2026-09-12',
      fechaEntrega: '2026-09-28',
      estado: 'Cancelado',
      detalles: []
    }
  ]);

  const ordenesDisponibles = ['ORD-001', 'ORD-002', 'ORD-003', 'ORD-004', 'ORD-005'];
  const operariosLista = ['Juan Pérez', 'María Rodríguez', 'Carlos López', 'Ana Gómez'];
  const piezasLista = ['Manga Larga', 'Cuello Polo', 'Frente Camisa', 'Bolsillo'];
  const maquinasLista = ['Plana Industrial', 'Fileteadora', 'Colcollarin', 'Ojaladora'];
  const insumosStock = [
    { id: 'INS-001', nombre: 'Hilo Blanco 40/2', stock: 120 },
    { id: 'INS-002', nombre: 'Botón 14mm', stock: 500 },
    { id: 'INS-003', nombre: 'Cierre 20cm Negro', stock: 85 }
  ];

  const [modalVer, setModalVer] = useState<Produccion | null>(null);
  const [modalForm, setModalForm] = useState(false);
  const [itemEditar, setItemEditar] = useState<Produccion | null>(null);
  const [modalDelete, setModalDelete] = useState<Produccion | null>(null);

  const [formOrden, setFormOrden] = useState('ORD-001');
  const [formEstado, setFormEstado] = useState<'En proceso' | 'Finalizado' | 'Pausado' | 'Cancelado'>('En proceso');
  const [formFechaInicio, setFormFechaInicio] = useState('');
  const [formFechaEntrega, setFormFechaEntrega] = useState('');
  const [formDetalles, setFormDetalles] = useState<Omit<DetalleProduccion, 'id'>[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenForm = (prod?: Produccion) => {
    if (prod) {
      setItemEditar(prod);
      setFormOrden(prod.ordenPedido);
      setFormEstado(prod.estado);
      setFormFechaInicio(prod.fechaInicio);
      setFormFechaEntrega(prod.fechaEntrega);
      setFormDetalles(prod.detalles.map(({ id, ...rest }) => rest));
    } else {
      setItemEditar(null);
      setFormOrden('ORD-001');
      setFormEstado('En proceso');
      setFormFechaInicio(new Date().toISOString().split('T')[0]);
      setFormFechaEntrega('');
      setFormDetalles([
        { 
          empleado: operariosLista[0], 
          pieza: piezasLista[0], 
          maquina: maquinasLista[0], 
          insumo: `${insumosStock[0].id} — ${insumosStock[0].nombre}`, 
          cantidad: 10, 
          fechaAsignada: new Date().toISOString().split('T')[0] 
        }
      ]);
    }
    setErrors({});
    setModalForm(true);
  };

  const handleSaveProduccion = () => {
    const errs: Record<string, string> = {};
    if (!formFechaInicio) errs.fechaInicio = 'Requerido';
    if (!formFechaEntrega) errs.fechaEntrega = 'Requerido';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Completa los campos obligatorios');
      return;
    }

    if (itemEditar) {
      setProducciones(producciones.map(p => p.id === itemEditar.id ? {
        ...p,
        ordenPedido: formOrden,
        estado: formEstado,
        fechaInicio: formFechaInicio,
        fechaEntrega: formFechaEntrega,
        detalles: formDetalles.map((d, i) => ({ ...d, id: `DET-00${i + 1}` }))
      } : p));
      toast.success('Producción actualizada');
    } else {
      const newId = nextId('PRD', producciones.map(p => p.id));
      const remId = `REM-${100 + producciones.length + 1}`;
      const nueva: Produccion = {
        id: newId,
        ordenPedido: formOrden,
        remision: remId,
        fechaInicio: formFechaInicio,
        fechaEntrega: formFechaEntrega,
        estado: formEstado,
        detalles: formDetalles.map((d, i) => ({ ...d, id: `DET-00${i + 1}` }))
      };
      setProducciones([nueva, ...producciones]);
      toast.success('Producción creada');
    }
    setModalForm(false);
  };

  const handleStateChangeInline = (id: string, nuevoEstado: 'En proceso' | 'Finalizado' | 'Pausado' | 'Cancelado') => {
    setProducciones(producciones.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
    toast.success(`Estado actualizado a "${nuevoEstado}"`);
  };

  const produccionesFiltradas = producciones.filter(p =>
    p.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.ordenPedido.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.estado.toLowerCase().includes(busqueda.toLowerCase())
  );

  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const bg = dark ? "#121212" : "#F8F9FA";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      
      <ModuleHeader
        title="Producción"
        subtitle="Gestión y seguimiento de órdenes de producción"
        onAdd={() => handleOpenForm()}
        addLabel="Nueva Producción"
        search={busqueda}
        onSearch={setBusqueda}
        dark={dark}
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'TOTAL PRODUCCIONES', count: producciones.length, color: INFO, bg: INFO_BG },
          { label: 'EN PROCESO', count: producciones.filter(p => p.estado === 'En proceso').length, color: WARNING, bg: WARNING_BG },
          { label: 'FINALIZADAS', count: producciones.filter(p => p.estado === 'Finalizado').length, color: SUCCESS, bg: SUCCESS_BG },
          { label: 'CANCELADAS / PAUSADAS', count: producciones.filter(p => p.estado === 'Cancelado' || p.estado === 'Pausado').length, color: DANGER, bg: DANGER_BG },
        ].map((kpi, i) => (
          <div key={i} style={{
            padding: 16, borderRadius: 12, backgroundColor: cardBg,
            borderLeft: `4px solid ${kpi.color}`,
            borderTop: `1px solid ${borderNormal}`, borderRight: `1px solid ${borderNormal}`, borderBottom: `1px solid ${borderNormal}`
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: subtle, marginBottom: 4 }}>
              {kpi.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: fg }}>{kpi.count}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, backgroundColor: kpi.bg, color: kpi.color }}>
                {kpi.count} de {producciones.length}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* TABLA PRINCIPAL */}
      <TableShell headers={['ID PRODUCCIÓN', 'ORDEN DE PEDIDO', 'FECHA INICIO', 'FECHA ENTREGA', 'ESTADO', 'ACCIONES']} dark={dark}>
        {produccionesFiltradas.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
              No se encontraron registros de producción.
            </td>
          </tr>
        ) : (
          produccionesFiltradas.map((prod) => {
            const st = ESTADOS_STYLES[prod.estado];
            return (
              <tr key={prod.id} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                <td style={{ padding: '12px 14px' }}>
                  <IdBadge id={prod.id} />
                </td>

                <td style={{ padding: '12px 14px' }}>
                  <IdBadge id={prod.ordenPedido} />
                </td>

                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: subtle }}>
                  {prod.fechaInicio}
                </td>

                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: subtle }}>
                  {prod.fechaEntrega}
                </td>

                <td style={{ padding: '12px 14px' }}>
                  <select
                    value={prod.estado}
                    onChange={(e) => handleStateChangeInline(prod.id, e.target.value as any)}
                    style={{
                      backgroundColor: st.bg, color: st.color, border: 'none',
                      borderRadius: 999, padding: '4px 12px', fontSize: 11,
                      fontWeight: 700, cursor: 'pointer', outline: 'none',
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  >
                    <option value="En proceso">En proceso</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </td>

                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ActionCircleBtn variant="blue" onClick={() => setModalVer(prod)} title="Ver Detalle">
                      <Eye size={14} />
                    </ActionCircleBtn>

                    <ActionCircleBtn variant="gold" onClick={() => handleOpenForm(prod)} title="Editar">
                      <Pencil size={14} />
                    </ActionCircleBtn>

                    <ActionCircleBtn variant="gold" onClick={() => setModalDelete(prod)} title="Eliminar">
                      <Trash2 size={14} />
                    </ActionCircleBtn>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </TableShell>

      {/* MODAL VER DETALLE */}
      {modalVer && (
        <Modal
          title="Detalle de Producción"
          icon={<Eye size={16} color={INFO} />}
          onClose={() => setModalVer(null)}
          dark={dark}
          maxWidth="950px"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: dark ? '#252525' : '#F8F8F8', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.05em', color: subtle, marginBottom: 4 }}>ID PRODUCCIÓN</div>
              <IdBadge id={modalVer.id} />
            </div>

            <div style={{ background: dark ? '#252525' : '#F8F8F8', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.05em', color: subtle, marginBottom: 4 }}>ESTADO</div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                backgroundColor: ESTADOS_STYLES[modalVer.estado].bg, color: ESTADOS_STYLES[modalVer.estado].color
              }}>
                {modalVer.estado}
              </span>
            </div>

            <div style={{ gridColumn: 'span 2', background: dark ? '#252525' : '#F8F8F8', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.05em', color: subtle, marginBottom: 4 }}>ORDEN DE PEDIDO</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IdBadge id={modalVer.ordenPedido} />
                <span style={{ fontSize: 12, fontWeight: 600, color: GOLD }}>↳ Remisión incluida: {modalVer.remision}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px', color: fg }}>Detalle de Asignaciones</h4>
            <TableShell headers={['ID', 'EMPLEADO', 'PIEZA', 'MÁQUINA', 'INSUMO', 'CANT.', 'FECHA']} dark={dark}>
              {modalVer.detalles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: subtle, fontSize: 12 }}>Sin asignaciones.</td>
                </tr>
              ) : (
                modalVer.detalles.map((det) => (
                  <tr key={det.id} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                    <td style={{ padding: '8px 10px' }}><IdBadge id={det.id} /></td>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: fg }}>{det.empleado}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: fg }}>{det.pieza}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: fg }}>{det.maquina}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: subtle }}>{det.insumo}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 700, color: fg }}>{det.cantidad}</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, fontFamily: 'monospace', color: subtle }}>{det.fechaAsignada}</td>
                  </tr>
                ))
              )}
            </TableShell>
          </div>
        </Modal>
      )}

      {/* MODAL FORMULARIO (NUEVA / EDITAR) */}
      {modalForm && (
        <Modal
          title={itemEditar ? "Editar Producción" : "Nueva Producción"}
          icon={<Factory size={16} color="#C9A227" />}
          onClose={() => setModalForm(false)}
          onSave={handleSaveProduccion}
          dark={dark}
          maxWidth="900px"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16, rowGap: 16, width: '100%', boxSizing: 'border-box' }}>
            <Field label="Orden de Pedido" dark={dark}>
              <select
                value={formOrden}
                onChange={(e) => setFormOrden(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
              >
                {ordenesDisponibles.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>

            <Field label="Estado" dark={dark}>
              <select
                value={formEstado}
                onChange={(e) => setFormEstado(e.target.value as any)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="En proceso">En proceso</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Pausado">Pausado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </Field>

            <Field label="Fecha Inicio" dark={dark}>
              <input
                type="date"
                value={formFechaInicio}
                onChange={(e) => setFormFechaInicio(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
              />
            </Field>

            <Field label="Fecha Entrega" dark={dark}>
              <input
                type="date"
                value={formFechaEntrega}
                onChange={(e) => setFormFechaEntrega(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
              />
            </Field>
          </div>

          <div style={{ marginTop: 16, borderTop: `1px solid ${borderNormal}`, paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: fg, fontFamily: 'Montserrat, sans-serif' }}>
                Asignación de Operarios y Tareas
              </h4>
              <button
                type="button"
                onClick={() => {
                  setFormDetalles([
                    ...formDetalles,
                    {
                      empleado: operariosLista[0],
                      pieza: piezasLista[0],
                      maquina: maquinasLista[0],
                      insumo: `${insumosStock[0].id} — ${insumosStock[0].nombre}`,
                      cantidad: 10,
                      fechaAsignada: new Date().toISOString().split('T')[0]
                    }
                  ]);
                }}
                style={{
                  background: 'transparent', border: '1px solid #C9A227', color: '#C9A227',
                  borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <Plus size={12} /> Agregar Tarea
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '320px', overflowY: 'auto', paddingRight: 4 }}>
              {formDetalles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 16, color: subtle, fontSize: 12 }}>
                  No hay tareas asignadas. Haz clic en "Agregar Tarea".
                </div>
              ) : (
                formDetalles.map((det, index) => (
                  <div key={index} style={{
                    background: dark ? '#252525' : '#F9F9F9',
                    border: `1px solid ${borderNormal}`, borderRadius: 10, padding: 14,
                    display: 'flex', flexDirection: 'column', gap: 10
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                      
                      {/* EMPLEADO */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: subtle, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          Empleado
                        </label>
                        <select
                          value={det.empleado}
                          onChange={(e) => {
                            const updated = [...formDetalles];
                            updated[index].empleado = e.target.value;
                            setFormDetalles(updated);
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }}
                        >
                          {operariosLista.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                      </div>

                      {/* PIEZA */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: subtle, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          Pieza
                        </label>
                        <select
                          value={det.pieza}
                          onChange={(e) => {
                            const updated = [...formDetalles];
                            updated[index].pieza = e.target.value;
                            setFormDetalles(updated);
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }}
                        >
                          {piezasLista.map(pz => <option key={pz} value={pz}>{pz}</option>)}
                        </select>
                      </div>

                      {/* MÁQUINA */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: subtle, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          Máquina
                        </label>
                        <select
                          value={det.maquina}
                          onChange={(e) => {
                            const updated = [...formDetalles];
                            updated[index].maquina = e.target.value;
                            setFormDetalles(updated);
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }}
                        >
                          {maquinasLista.map(mq => <option key={mq} value={mq}>{mq}</option>)}
                        </select>
                      </div>

                      {/* ELIMINAR */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: 2 }}>
                        <button
                          type="button"
                          onClick={() => { setFormDetalles(formDetalles.filter((_, i) => i !== index)); }}
                          style={{ background: 'transparent', border: 'none', color: DANGER, cursor: 'pointer', padding: 6 }}
                          title="Eliminar tarea"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* SEGUNDA FILA: INSUMO Y CANTIDAD */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: subtle, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          Insumo Asignado
                        </label>
                        <select
                          value={det.insumo}
                          onChange={(e) => {
                            const updated = [...formDetalles];
                            updated[index].insumo = e.target.value;
                            setFormDetalles(updated);
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }}
                        >
                          {insumosStock.map(ins => (
                            <option key={ins.id} value={`${ins.id} — ${ins.nombre}`}>
                              {ins.id} — {ins.nombre} (Stock: {ins.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: subtle, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          Cantidad
                        </label>
                        <input
                          type="number"
                          value={det.cantidad}
                          onChange={(e) => {
                            const updated = [...formDetalles];
                            updated[index].cantidad = Number(e.target.value);
                            setFormDetalles(updated);
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: subtle, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                          Fecha Asignación
                        </label>
                        <input
                          type="date"
                          value={det.fechaAsignada}
                          onChange={(e) => {
                            const updated = [...formDetalles];
                            updated[index].fechaAsignada = e.target.value;
                            setFormDetalles(updated);
                          }}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL ELIMINAR */}
      {modalDelete && (
        <ConfirmDelete
          message="Producción eliminada correctamente"
          dark={dark}
          onCancel={() => setModalDelete(null)}
          onConfirm={() => {
            setProducciones(producciones.filter(p => p.id !== modalDelete.id));
            setModalDelete(null);
          }}
        />
      )}

    </div>
  );
};


{/* Sección de Insumos / Materia Prima */}
<div className="mb-4">
    <div className="flex justify-between items-center mb-2">
        <label className="font-semibold text-gray-700">Insumos Utilizados</label>
        <button type="button" className="text-sm text-amber-600 hover:underline">
            + Agregar Insumo
        </button>
    </div>
    
    {/* Cabeceras de los campos */}
    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 mb-1 px-1">
        <div className="col-span-6">Insumo</div>
        <div className="col-span-4">Cantidad</div>
        <div className="col-span-2">Acción</div>
    </div>

    {/* Fila dinámica de insumos */}
    <div className="flex items-center gap-2 mb-2">
        <select className="flex-1 border rounded p-2 text-sm">
            <option>Seleccionar insumo...</option>
            {/* Opciones de insumos desde la BD */}
        </select>
        <input type="number" placeholder="Cant." className="w-24 border rounded p-2 text-sm" />
        <button type="button" className="text-red-500 hover:text-red-700 p-2">
            🗑️
        </button>
    </div>
</div>