import React, { useState } from 'react';
import { 
  Plus, Trash2, Calendar, Package, Save, CheckCircle, Layers, Eye, ArrowLeft, FileText, X, AlertTriangle, Search
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
const INFO         = "#4A90E2";

interface FilaMatriz {
  id_cliente: string;
  id_insumo: string;
  cantidades: { [talla: string]: number };
}

interface FilaPiezaSinTalla {
  id_tipo_pieza: string;
  cantidad: number;
}

interface RemisionItem {
  id: string;
  id_cliente: string;
  fichaTecnicaNombre: string;
  fichaTecnicaUrl: string | null;
  fechaEntrega: string;
  filasAdulto: FilaMatriz[];
  filasNinos: FilaMatriz[];
  filasLetras: FilaMatriz[];
  filasPiezas: FilaPiezaSinTalla[];
  resumen: { codigo: string; nombre: string; total: number }[];
}

const CATALOGO_INSUMOS: { [id: string]: string } = {
  '00-1': 'Camisa',
  '00-2': 'Pantalón',
  '00-3': 'Chaqueta',
  '00-4': 'Overol'
};

const CATALOGO_PIEZAS: { [id: string]: string } = {
  'P-01': 'Botones',
  'P-02': 'Cierres',
  'P-03': 'Hilos',
  'P-04': 'Etiquetas'
};

const OPCIONES_CLIENTES = [
  { value: '00-1', label: '00-1 — Cliente Principal' },
  { value: '00-2', label: '00-2 — Confecciones del Valle' },
  { value: '00-3', label: '00-3 — Textiles Andinos' },
  { value: '00-4', label: '00-4 — Confecciones El Tigre' }
];

const OPCIONES_INSUMOS = [
  { value: '00-1', label: '00-1' },
  { value: '00-2', label: '00-2' },
  { value: '00-3', label: '00-3' },
  { value: '00-4', label: '00-4' }
];

const OPCIONES_PIEZAS = [
  { value: 'P-01', label: 'P-01' },
  { value: 'P-02', label: 'P-02' },
  { value: 'P-03', label: 'P-03' },
  { value: 'P-04', label: 'P-04' }
];

const MATRIZ_ADULTO = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'];
const MATRIZ_NINOS = ['4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24', '26'];
const MATRIZ_LETRAS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '', '', ''];

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
            ¿Eliminar registro?
          </h3>
          <div style={{
            background: DANGER_BG, border: `1px solid ${DANGER}4D`,
            borderRadius: 10, padding: '10px 14px', fontSize: 12,
            color: DANGER_TXT, fontWeight: 600, marginBottom: 20
          }}>
            Esta acción eliminará el registro de remisión de forma permanente.
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
// COMPONENTE PRINCIPAL: REMISIONES VIEW
// ==========================================
export const RemisionesView = ({ dark = false }: { dark?: boolean }) => {
  const [vista, setVista] = useState<'lista' | 'formulario'>('lista');
  const [busqueda, setBusqueda] = useState('');
  const [remisionSeleccionadaModal, setRemisionSeleccionadaModal] = useState<RemisionItem | null>(null);
  const [modalDelete, setModalDelete] = useState<RemisionItem | null>(null);

  const [remisiones, setRemisiones] = useState<RemisionItem[]>([
    {
      id: 'REM-001',
      id_cliente: '00-1',
      fichaTecnicaNombre: 'IMG-01.jpg',
      fichaTecnicaUrl: null,
      fechaEntrega: '2026-05-22',
      filasAdulto: [{ id_cliente: '00-1', id_insumo: '00-1', cantidades: { '36': 39, '38': 63, '40': 130 } }],
      filasNinos: [{ id_cliente: '00-1', id_insumo: '00-2', cantidades: {} }],
      filasLetras: [{ id_cliente: '00-1', id_insumo: '00-3', cantidades: {} }],
      filasPiezas: [{ id_tipo_pieza: 'P-01', cantidad: 20 }],
      resumen: [
        { codigo: 'id_insumo: 00-1', nombre: 'Camisa', total: 232 },
        { codigo: 'id_tipo_pieza: P-01', nombre: 'Botones', total: 20 }
      ]
    }
  ]);

  const [remisionEditandoId, setRemisionEditandoId] = useState<string | null>(null);
  const [idClienteInput, setIdClienteInput] = useState('00-2');
  const [fichaTecnicaNombre, setFichaTecnicaNombre] = useState('Seleccionar imagen...');
  const [fichaTecnicaUrl, setFichaTecnicaUrl] = useState<string | null>(null);
  const [fechaEntrega, setFechaEntrega] = useState('2026-05-22');

  const [filasAdulto, setFilasAdulto] = useState<FilaMatriz[]>([
    { id_cliente: '00-2', id_insumo: '00-1', cantidades: {} }
  ]);
  const [filasNinos, setFilasNinos] = useState<FilaMatriz[]>([
    { id_cliente: '00-2', id_insumo: '00-2', cantidades: {} }
  ]);
  const [filasLetras, setFilasLetras] = useState<FilaMatriz[]>([
    { id_cliente: '00-2', id_insumo: '00-3', cantidades: {} }
  ]);
  const [filasPiezas, setFilasPiezas] = useState<FilaPiezaSinTalla[]>([
    { id_tipo_pieza: 'P-01', cantidad: 0 }
  ]);

  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  const abrirNuevaRemision = () => {
    setRemisionEditandoId(null);
    const nuevoIdCliente = '00-2';
    setIdClienteInput(nuevoIdCliente);
    setFichaTecnicaNombre('Seleccionar imagen...');
    setFichaTecnicaUrl(null);
    setFechaEntrega('2026-05-22');
    setFilasAdulto([{ id_cliente: nuevoIdCliente, id_insumo: '00-1', cantidades: {} }]);
    setFilasNinos([{ id_cliente: nuevoIdCliente, id_insumo: '00-2', cantidades: {} }]);
    setFilasLetras([{ id_cliente: nuevoIdCliente, id_insumo: '00-3', cantidades: {} }]);
    setFilasPiezas([{ id_tipo_pieza: 'P-01', cantidad: 0 }]);
    setVista('formulario');
  };

  const abrirEditarRemision = (rem: RemisionItem) => {
    setRemisionEditandoId(rem.id);
    setIdClienteInput(rem.id_cliente);
    setFichaTecnicaNombre(rem.fichaTecnicaNombre);
    setFichaTecnicaUrl(rem.fichaTecnicaUrl);
    setFechaEntrega(rem.fechaEntrega);
    setFilasAdulto(rem.filasAdulto.length ? rem.filasAdulto : [{ id_cliente: rem.id_cliente, id_insumo: '00-1', cantidades: {} }]);
    setFilasNinos(rem.filasNinos.length ? rem.filasNinos : [{ id_cliente: rem.id_cliente, id_insumo: '00-2', cantidades: {} }]);
    setFilasLetras(rem.filasLetras.length ? rem.filasLetras : [{ id_cliente: rem.id_cliente, id_insumo: '00-3', cantidades: {} }]);
    setFilasPiezas(rem.filasPiezas.length ? rem.filasPiezas : [{ id_tipo_pieza: 'P-01', cantidad: 0 }]);
    setVista('formulario');
  };

  const handleCambioClientePrincipal = (nuevoCliente: string) => {
    setIdClienteInput(nuevoCliente);
    setFilasAdulto(prev => prev.map(f => ({ ...f, id_cliente: nuevoCliente })));
    setFilasNinos(prev => prev.map(f => ({ ...f, id_cliente: nuevoCliente })));
    setFilasLetras(prev => prev.map(f => ({ ...f, id_cliente: nuevoCliente })));
  };

  const handleCambioImagenFicha = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      setFichaTecnicaNombre(archivo.name);
      setFichaTecnicaUrl(URL.createObjectURL(archivo));
      toast.success('Imagen de ficha técnica cargada');
    }
  };

  const agregarFila = (setFilas: React.Dispatch<React.SetStateAction<FilaMatriz[]>>) => {
    setFilas(prev => [...prev, { id_cliente: idClienteInput, id_insumo: '00-1', cantidades: {} }]);
  };

  const eliminarFila = (index: number, setFilas: React.Dispatch<React.SetStateAction<FilaMatriz[]>>, filas: FilaMatriz[]) => {
    if (filas.length > 1) {
      setFilas(filas.filter((_, i) => i !== index));
    }
  };

  const handleMetaChange = (index: number, field: 'id_insumo', value: string, setFilas: React.Dispatch<React.SetStateAction<FilaMatriz[]>>) => {
    setFilas(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleCantidadChange = (index: number, talla: string, valor: string, setFilas: React.Dispatch<React.SetStateAction<FilaMatriz[]>>) => {
    const num = parseInt(valor, 10) || 0;
    setFilas(prev => {
      const copy = [...prev];
      copy[index].cantidades = { ...copy[index].cantidades, [talla]: num };
      return copy;
    });
  };

  const handlePiezaChange = (index: number, field: 'id_tipo_pieza' | 'cantidad', value: string | number) => {
    const copy = [...filasPiezas];
    if (field === 'cantidad') {
      copy[index].cantidad = parseInt(value as string, 10) || 0;
    } else {
      copy[index].id_tipo_pieza = value as string;
    }
    setFilasPiezas(copy);
  };

  const calcularTotalFila = (cantidades: { [talla: string]: number }) => {
    return Object.values(cantidades).reduce((acc, curr) => acc + (curr || 0), 0);
  };

  const obtenerResumenConsolidado = () => {
    const resumenInsumos: { [idInsumo: string]: number } = {};
    const todasLasFilasTallas = [...filasAdulto, ...filasNinos, ...filasLetras];

    todasLasFilasTallas.forEach((fila) => {
      if (fila.id_insumo) {
        const total = calcularTotalFila(fila.cantidades);
        resumenInsumos[fila.id_insumo] = (resumenInsumos[fila.id_insumo] || 0) + total;
      }
    });

    const listaInsumos = Object.entries(resumenInsumos).map(([id, total]) => ({
      codigo: `id_insumo: ${id}`,
      nombre: CATALOGO_INSUMOS[id] || `Insumo ${id}`,
      total
    }));

    const listaPiezas = filasPiezas.map(p => ({
      codigo: `id_tipo_pieza: ${p.id_tipo_pieza}`,
      nombre: CATALOGO_PIEZAS[p.id_tipo_pieza] || `Pieza ${p.id_tipo_pieza}`,
      total: p.cantidad
    }));

    return [...listaInsumos, ...listaPiezas];
  };

  const resumenConsolidado = obtenerResumenConsolidado();

  const handleGuardarRemision = () => {
    const nuevoItem: RemisionItem = {
      id: remisionEditandoId || `REM-00${remisiones.length + 1}`,
      id_cliente: idClienteInput,
      fichaTecnicaNombre,
      fichaTecnicaUrl,
      fechaEntrega,
      filasAdulto,
      filasNinos,
      filasLetras,
      filasPiezas,
      resumen: resumenConsolidado
    };

    if (remisionEditandoId) {
      setRemisiones(remisiones.map(r => r.id === remisionEditandoId ? nuevoItem : r));
      toast.success('Remisión actualizada exitosamente');
    } else {
      setRemisiones([...remisiones, nuevoItem]);
      toast.success('Nueva remisión guardada con éxito');
    }

    setGuardadoExitoso(true);
    setTimeout(() => {
      setGuardadoExitoso(false);
      setVista('lista');
    }, 1200);
  };

  const remisionesFiltradas = remisiones.filter(r =>
    r.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.id_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    r.fichaTecnicaNombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const bg = dark ? "#121212" : "#F8F9FA";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  // ================= VISTA 1: TABLA PRINCIPAL =================
  if (vista === 'lista') {
    return (
      <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
        <ModuleHeader
          title="Remisiones"
          subtitle="Órdenes de remisión vinculadas a clientes e insumos"
          onAdd={abrirNuevaRemision}
          addLabel="Nueva remisión"
          search={busqueda}
          onSearch={setBusqueda}
          dark={dark}
        />

        <TableShell headers={['ID REMISIÓN', 'FICHA TÉCNICA', 'ID CLIENTE', 'MUESTRA REMISIÓN', 'ACCIONES']} dark={dark}>
          {remisionesFiltradas.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: subtle, fontSize: 13 }}>
                No se encontraron registros de remisiones.
              </td>
            </tr>
          ) : (
            remisionesFiltradas.map((rem) => (
              <tr key={rem.id} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                <td style={{ padding: '12px 14px' }}>
                  <IdBadge id={rem.id} />
                </td>
                <td style={{ padding: '12px 14px', color: INFO, fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {rem.fichaTecnicaUrl && (
                    <img src={rem.fichaTecnicaUrl} alt="Ficha" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4 }} />
                  )}
                  {rem.fichaTecnicaNombre}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <IdBadge id={rem.id_cliente} />
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button
                    type="button"
                    onClick={() => setRemisionSeleccionadaModal(rem)}
                    style={{
                      background: dark ? '#2A2A2A' : '#EFF6FF',
                      color: INFO,
                      border: `1px solid ${INFO}40`,
                      borderRadius: 6,
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <FileText size={14} /> Ver Resumen Insumos / Piezas
                  </button>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ActionCircleBtn variant="blue" onClick={() => abrirEditarRemision(rem)} title="Ver / Editar Detalle">
                      <Eye size={14} />
                    </ActionCircleBtn>
                    <ActionCircleBtn variant="danger" onClick={() => setModalDelete(rem)} title="Eliminar Remisión">
                      <Trash2 size={14} />
                    </ActionCircleBtn>
                  </div>
                </td>
              </tr>
            ))
          )}
        </TableShell>

        {/* MODAL MUESTRA REMISIÓN */}
        {remisionSeleccionadaModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24
          }}>
            <div style={{
              width: '100%', maxWidth: 550, borderRadius: 16, backgroundColor: cardBg,
              border: `1px solid ${GOLD}40`, boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
            }}>
              <div style={{ height: 3, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg }}>Resumen - {remisionSeleccionadaModal.id}</h3>
                <button onClick={() => setRemisionSeleccionadaModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: subtle }}>
                  Cliente: <strong style={{ color: fg }}>{remisionSeleccionadaModal.id_cliente}</strong> | Fecha de Entrega: <strong style={{ color: fg }}>{remisionSeleccionadaModal.fechaEntrega}</strong>
                </p>
                <TableShell headers={['CÓDIGO', 'NOMBRE INSUMO / PIEZA', 'CANTIDAD']} dark={dark}>
                  {remisionSeleccionadaModal.resumen.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace' }}>{item.codigo}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: fg }}>{item.nombre}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: GOLD, textAlign: 'right' }}>{item.total}</td>
                    </tr>
                  ))}
                  <tr style={{ background: dark ? '#252525' : SUCCESS_BG }}>
                    <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700, color: fg }}>Entrega insumos</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: remisionSeleccionadaModal.resumen.some(r => r.codigo.startsWith('id_insumo')) ? SUCCESS : DANGER }}>
                      {remisionSeleccionadaModal.resumen.some(r => r.codigo.startsWith('id_insumo')) ? 'Sí' : 'No'}
                    </td>
                  </tr>
                </TableShell>
                <button
                  type="button"
                  onClick={() => setRemisionSeleccionadaModal(null)}
                  style={{
                    width: '100%', background: GOLD, color: '#121212', border: 'none',
                    borderRadius: 8, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 8
                  }}
                >
                  Cerrar Vista Previa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ELIMINAR */}
        {modalDelete && (
          <ConfirmDelete
            message="Remisión eliminada correctamente"
            dark={dark}
            onCancel={() => setModalDelete(null)}
            onConfirm={() => {
              setRemisiones(remisiones.filter(r => r.id !== modalDelete.id));
              setModalDelete(null);
            }}
          />
        )}
      </div>
    );
  }

  // ================= VISTA 2: FORMULARIO DETALLE / MATRICES =================
  const totalInsumosTallas = resumenConsolidado.filter(r => r.codigo.startsWith('id_insumo')).reduce((acc, r) => acc + r.total, 0);
  const entregaInsumos = totalInsumosTallas > 0;

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      <button
        type="button"
        onClick={() => setVista('lista')}
        style={{
          background: 'none', border: 'none', color: GOLD, cursor: 'pointer',
          fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16
        }}
      >
        <ArrowLeft size={16} /> Volver al listado de remisiones
      </button>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>
          {remisionEditandoId ? `Editando Remisión: ${remisionEditandoId}` : 'Nueva Remisión'}
        </h2>
        <p style={{ fontSize: 13, color: subtle, margin: 0 }}>
          Selecciona el cliente, carga la ficha técnica y configura las matrices de insumos
        </p>
      </div>

      {/* DATOS GENERALES */}
      <div style={{
        background: cardBg, borderRadius: 12, padding: 18, marginBottom: 20,
        border: `1px solid ${borderNormal}`, display: 'flex', gap: 20, flexWrap: 'wrap', maxWidth: 650, alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <Field label="ID Cliente de la Remisión" dark={dark}>
            <select
              value={idClienteInput}
              onChange={(e) => handleCambioClientePrincipal(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }}
            >
              {OPCIONES_CLIENTES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <Field label="Ficha Técnica (Imagen)" dark={dark}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{
                flex: 1, padding: '9px 12px', borderRadius: 8,
                border: `1px dashed ${GOLD}`, background: inputBg,
                color: GOLD, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                📁 {fichaTecnicaNombre}
                <input type="file" accept="image/*" onChange={handleCambioImagenFicha} style={{ display: 'none' }} />
              </label>
              {fichaTecnicaUrl && (
                <img src={fichaTecnicaUrl} alt="Preview" style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 6, border: `1px solid ${GOLD}` }} />
              )}
            </div>
          </Field>
        </div>
      </div>

      {/* MATRICES DE TALLAS */}
      {renderBloqueMatriz('Adultos (28-50)', MATRIZ_ADULTO, filasAdulto, setFilasAdulto, dark, handleMetaChange, handleCantidadChange, calcularTotalFila, agregarFila, eliminarFila, idClienteInput, inputBg, borderNormal, subtle, fg)}
      {renderBloqueMatriz('Niños (4-26)', MATRIZ_NINOS, filasNinos, setFilasNinos, dark, handleMetaChange, handleCantidadChange, calcularTotalFila, agregarFila, eliminarFila, idClienteInput, inputBg, borderNormal, subtle, fg)}
      {renderBloqueMatriz('Letras (XS-5XL)', MATRIZ_LETRAS, filasLetras, setFilasLetras, dark, handleMetaChange, handleCantidadChange, calcularTotalFila, agregarFila, eliminarFila, idClienteInput, inputBg, borderNormal, subtle, fg)}

      {/* SECCIÓN PIEZAS SIN TALLA */}
      <div style={{ background: cardBg, borderRadius: 12, padding: 18, marginBottom: 24, border: `1px solid ${borderNormal}`, maxWidth: 650 }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 700, color: fg, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color={GOLD} /> Piezas / Insumos Sin Talla
        </h3>

        <TableShell headers={['ID TIPO PIEZA', 'NOMBRE PIEZA', 'CANTIDAD', '']} dark={dark}>
          {filasPiezas.map((pieza, idx) => (
            <tr key={idx} style={{ borderBottom: `1px solid ${borderNormal}` }}>
              <td style={{ padding: '8px 10px' }}>
                <select
                  value={pieza.id_tipo_pieza}
                  onChange={(e) => handlePiezaChange(idx, 'id_tipo_pieza', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none' }}
                >
                  {OPCIONES_PIEZAS.map(opt => <option key={opt.value} value={opt.value}>{opt.value}</option>)}
                </select>
              </td>
              <td style={{ padding: '8px 10px', fontSize: 12, color: subtle }}>
                {CATALOGO_PIEZAS[pieza.id_tipo_pieza] || 'Pieza'}
              </td>
              <td style={{ padding: '8px 10px', width: 100 }}>
                <input
                  type="number"
                  min="0"
                  value={pieza.cantidad || ''}
                  onChange={(e) => handlePiezaChange(idx, 'cantidad', e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, textAlign: 'center', outline: 'none' }}
                />
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setFilasPiezas(filasPiezas.filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', color: DANGER, cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </TableShell>

        <button
          type="button"
          onClick={() => setFilasPiezas([...filasPiezas, { id_tipo_pieza: 'P-01', cantidad: 0 }])}
          style={{ marginTop: 12, background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Plus size={14} /> Agregar otra pieza / insumo
        </button>
      </div>

      {/* RESUMEN FINAL */}
      <div style={{ background: cardBg, borderRadius: 12, padding: 20, marginTop: 24, border: `1px solid ${borderNormal}`, maxWidth: 650 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: GOLD, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={18} /> Resumen de Insumos / Piezas
        </h3>

        <TableShell headers={['CÓDIGO', 'NOMBRE INSUMO / PIEZA', 'CANTIDAD']} dark={dark}>
          {resumenConsolidado.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: `1px solid ${borderNormal}` }}>
              <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace' }}>{item.codigo}</td>
              <td style={{ padding: '10px 12px', fontSize: 12, color: fg }}>{item.nombre}</td>
              <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: GOLD, textAlign: 'right' }}>{item.total}</td>
            </tr>
          ))}
          <tr style={{ background: dark ? '#252525' : SUCCESS_BG }}>
            <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700, color: fg }}>Entrega insumos</td>
            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: entregaInsumos ? SUCCESS : DANGER }}>
              {entregaInsumos ? 'Sí' : 'No'}
            </td>
          </tr>
        </TableShell>

        <div style={{ borderTop: `1px solid ${borderNormal}`, paddingTop: 16, marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Field label="Fecha de Entrega" dark={dark}>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}
            />
          </Field>

          <button
            type="button"
            onClick={handleGuardarRemision}
            style={{
              background: guardadoExitoso ? SUCCESS : `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
              color: guardadoExitoso ? '#FFFFFF' : '#121212',
              border: 'none', borderRadius: 8, padding: '10px 24px',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background 0.3s'
            }}
          >
            {guardadoExitoso ? (
              <>
                <CheckCircle size={18} /> ¡Remisión Guardada y Actualizada!
              </>
            ) : (
              <>
                <Save size={18} /> Guardar Remisión
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para renderizar cada bloque de matriz de tallas
function renderBloqueMatriz(
  titulo: string,
  tallas: string[],
  filas: FilaMatriz[],
  setFilas: React.Dispatch<React.SetStateAction<FilaMatriz[]>>,
  dark: boolean,
  handleMetaChange: any,
  handleCantidadChange: any,
  calcularTotalFila: any,
  agregarFila: any,
  eliminarFila: any,
  idCliente: string,
  inputBg: string,
  borderNormal: string,
  subtle: string,
  fg: string
) {
  return (
    <div style={{ background: dark ? '#1E1E1E' : '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, border: `1px solid ${borderNormal}` }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: 12 }}>{titulo}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
          <thead>
            <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
              <th style={headerStyle(dark)}>ID CLIENTE</th>
              <th style={headerStyle(dark)}>ID INSUMO</th>
              <th style={headerStyle(dark)}>TALLA</th>
              {tallas.map((t, idx) => (
                <th key={idx} style={{ ...headerStyle(dark), minWidth: 32 }}>{t}</th>
              ))}
              <th style={{ ...headerStyle(dark), fontWeight: 700, color: GOLD }}>TOTAL</th>
              <th style={{ border: 'none', width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, index) => {
              const total = calcularTotalFila(fila.cantidades);
              return (
                <tr key={index} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                  <td style={cellStyle(dark, borderNormal)}>
                    <span style={{ color: fg, fontWeight: 600 }}>{idCliente}</span>
                  </td>
                  <td style={cellStyle(dark, borderNormal)}>
                    <select
                      value={fila.id_insumo}
                      onChange={(e) => handleMetaChange(index, 'id_insumo', e.target.value, setFilas)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: GOLD, fontWeight: 700, fontSize: 13, textAlign: 'center', outline: 'none', cursor: 'pointer' }}
                    >
                      {OPCIONES_INSUMOS.map(opt => (
                        <option key={opt.value} value={opt.value} style={{ background: dark ? '#1E1E1E' : '#FFFFFF', color: fg }}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...cellStyle(dark, borderNormal), fontWeight: 600, color: subtle }}>
                    Cantidad
                  </td>
                  {tallas.map((talla, tIdx) => (
                    <td key={tIdx} style={cellStyle(dark, borderNormal)}>
                      {talla !== '' ? (
                        <input
                          type="number"
                          min="0"
                          value={fila.cantidades[talla] || ''}
                          onChange={(e) => handleCantidadChange(index, talla, e.target.value, setFilas)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: fg, fontSize: 13, textAlign: 'center', fontWeight: fila.cantidades[talla] ? 700 : 400 }}
                        />
                      ) : null}
                    </td>
                  ))}
                  <td style={{ ...cellStyle(dark, borderNormal), fontWeight: 700, color: GOLD, fontSize: 14 }}>
                    {total > 0 ? total : ''}
                  </td>
                  <td style={{ border: 'none', textAlign: 'center', paddingLeft: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                      {index === filas.length - 1 && (
                        <button
                          type="button"
                          onClick={() => agregarFila(setFilas)}
                          title="Agregar nueva fila"
                          style={{
                            background: GOLD, border: 'none', color: '#121212', cursor: 'pointer',
                            borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      )}
                      {filas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarFila(index, setFilas, filas)}
                          title="Eliminar fila"
                          style={{ background: 'none', border: 'none', color: DANGER, cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const headerStyle = (dark: boolean): React.CSSProperties => ({
  padding: '8px 10px',
  border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
  fontSize: '11px',
  fontWeight: 700,
  color: GOLD,
  textTransform: 'uppercase'
});

const cellStyle = (dark: boolean, borderNormal: string): React.CSSProperties => ({
  padding: '6px 8px',
  border: `1px solid ${borderNormal}`
});