import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, X, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';

// ==========================================
// CONSTANTES DE DISEÑO - SISTEMA STITCHER
// ==========================================
const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const BLUE_ACCENT = "#3182CE";
const DANGER = "#DC3545";
const DANGER_BG = "#FDECEA";
const DANGER_TXT = "#721c24";
const SUCCESS_BG = "#DCF7E6";
const SUCCESS_TXT = "#155724";

interface DetalleItem {
  idDetalle: string;
  idInsumo: string;
  nombreInsumo: string;
  cantidad: number;
  valorUnitario: number;
}

interface Compra {
  id: string;
  fecha: string;
  idProveedor: string;
  nombreProveedor: string;
  descripcion: string;
  detalles: DetalleItem[];
}

interface Props {
  dark?: boolean;
}

// Lista de insumos disponibles para el selector en el detalle
const INSUMOS_DISPONIBLES = [
  { idInsumo: 'INS-001', nombre: 'Hilo' },
  { idInsumo: 'INS-002', nombre: 'Botones presión' },
  { idInsumo: 'INS-003', nombre: 'Marquillas' },
  { idInsumo: 'INS-004', nombre: 'Tela Algodón' },
  { idInsumo: 'INS-005', nombre: 'Cierres metálicos' },
  { idInsumo: 'INS-006', nombre: 'Elástico 2cm' },
  { idInsumo: 'INS-007', nombre: 'Hilo Poliéster' },
  { idInsumo: 'INS-008', nombre: 'Tela Fleece' },
  { idInsumo: 'INS-009', nombre: 'Ojales metálicos' },
  { idInsumo: 'INS-010', nombre: 'Sesgo elastizado' }
];

export const ComprasView: React.FC<Props> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');
  
  const [compras, setCompras] = useState<Compra[]>([
    {
      id: 'COM-001',
      fecha: '2026-05-22',
      idProveedor: 'PROV-001',
      nombreProveedor: 'TextilsCOL',
      descripcion: 'Se hizo una compra de hilos y marquillas',
      detalles: [
        { idDetalle: 'DC-001', idInsumo: 'INS-001', nombreInsumo: 'Hilo', cantidad: 50, valorUnitario: 4000 },
        { idDetalle: 'DC-002', idInsumo: 'INS-003', nombreInsumo: 'Marquillas', cantidad: 12, valorUnitario: 8000 }
      ]
    },
    {
      id: 'COM-002',
      fecha: '2026-05-20',
      idProveedor: 'PROV-002',
      nombreProveedor: 'Botones y Herrajes SAS',
      descripcion: 'Se hizo una compra de botones',
      detalles: [
        { idDetalle: 'DC-003', idInsumo: 'INS-002', nombreInsumo: 'Botones presión', cantidad: 90, valorUnitario: 4000 }
      ]
    },
    {
      id: 'COM-003',
      fecha: '2026-05-18',
      idProveedor: 'PROV-003',
      nombreProveedor: 'Telas e Insumos del Centro',
      descripcion: 'Compra de tela algodón para producción',
      detalles: [
        { idDetalle: 'DC-004', idInsumo: 'INS-004', nombreInsumo: 'Tela Algodón', cantidad: 35, valorUnitario: 25000 }
      ]
    },
    {
      id: 'COM-004',
      fecha: '2026-05-15',
      idProveedor: 'PROV-004',
      nombreProveedor: 'Hilos Medellín',
      descripcion: 'Adquisición de hilo poliéster adicional',
      detalles: [
        { idDetalle: 'DC-005', idInsumo: 'INS-007', nombreInsumo: 'Hilo Poliéster', cantidad: 20, valorUnitario: 6500 }
      ]
    },
    {
      id: 'COM-005',
      fecha: '2026-05-12',
      idProveedor: 'PROV-001',
      nombreProveedor: 'TextilsCOL',
      descripcion: 'Compra de cierres metálicos para chaquetas',
      detalles: [
        { idDetalle: 'DC-006', idInsumo: 'INS-005', nombreInsumo: 'Cierres metálicos', cantidad: 100, valorUnitario: 3500 }
      ]
    },
    {
      id: 'COM-006',
      fecha: '2026-05-10',
      idProveedor: 'PROV-002',
      nombreProveedor: 'Botones y Herrajes SAS',
      descripcion: 'Compra de ojales metálicos',
      detalles: [
        { idDetalle: 'DC-007', idInsumo: 'INS-009', nombreInsumo: 'Ojales metálicos', cantidad: 500, valorUnitario: 1200 }
      ]
    },
    {
      id: 'COM-007',
      fecha: '2026-05-08',
      idProveedor: 'PROV-003',
      nombreProveedor: 'Telas e Insumos del Centro',
      descripcion: 'Adquisición de tela fleece para buzos',
      detalles: [
        { idDetalle: 'DC-008', idInsumo: 'INS-008', nombreInsumo: 'Tela Fleece', cantidad: 40, valorUnitario: 28000 }
      ]
    },
    {
      id: 'COM-008',
      fecha: '2026-05-05',
      idProveedor: 'PROV-004',
      nombreProveedor: 'Hilos Medellín',
      descripcion: 'Compra de elástico de 2cm',
      detalles: [
        { idDetalle: 'DC-009', idInsumo: 'INS-006', nombreInsumo: 'Elástico 2cm', cantidad: 60, valorUnitario: 5000 }
      ]
    },
    {
      id: 'COM-009',
      fecha: '2026-05-02',
      idProveedor: 'PROV-001',
      nombreProveedor: 'TextilsCOL',
      descripcion: 'Compra de sesgo elastizado y hilos',
      detalles: [
        { idDetalle: 'DC-010', idInsumo: 'INS-010', nombreInsumo: 'Sesgo elastizado', cantidad: 30, valorUnitario: 7000 },
        { idDetalle: 'DC-011', idInsumo: 'INS-001', nombreInsumo: 'Hilo', cantidad: 15, valorUnitario: 4000 }
      ]
    },
    {
      id: 'COM-010',
      fecha: '2026-04-28',
      idProveedor: 'PROV-002',
      nombreProveedor: 'Botones y Herrajes SAS',
      descripcion: 'Compra inicial de avíos y marquillas',
      detalles: [
        { idDetalle: 'DC-012', idInsumo: 'INS-002', nombreInsumo: 'Botones presión', cantidad: 150, valorUnitario: 4000 },
        { idDetalle: 'DC-013', idInsumo: 'INS-003', nombreInsumo: 'Marquillas', cantidad: 50, valorUnitario: 8000 }
      ]
    }
  ]);

  const [expandedId, setExpandedId] = useState<string | null>('COM-001');

  // Control para agregar un nuevo ítem dentro del acordeón de detalle
  const [isAddingDetalle, setIsAddingDetalle] = useState(false);
  const [nuevoDetInsumoId, setNuevoDetInsumoId] = useState('INS-001');
  const [nuevoDetCantidad, setNuevoDetCantidad] = useState<number>(1);
  const [nuevoDetValorUnitario, setNuevoDetValorUnitario] = useState<number>(0);

  // Control de edición en línea de detalle existente
  const [editingDetalleId, setEditingDetalleId] = useState<string | null>(null);
  const [editInsumoId, setEditInsumoId] = useState('');
  const [editCantidad, setEditCantidad] = useState<number>(0);
  const [editValorUnitario, setEditValorUnitario] = useState<number>(0);

  // Estados de modales generales (Maestro)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCompra, setEditCompra] = useState<Compra | null>(null);
  const [deleteItem, setDeleteItem] = useState<Compra | null>(null);

  // Formulario temporal maestro
  const [formFecha, setFormFecha] = useState('');
  const [formProveedor, setFormProveedor] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');

  const bg = dark ? "#121212" : "#F8F9FA";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const nextIdNum = compras.length + 1;
  const autoNuevoId = `COM-${String(nextIdNum).padStart(3, '0')}`;

  const handleOpenCreate = () => {
    setFormFecha(new Date().toISOString().split('T')[0]);
    setFormProveedor('');
    setFormDescripcion('');
    setIsCreateOpen(true);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const proveedoresMap: Record<string, string> = {
      'PROV-001': 'TextilsCOL',
      'PROV-002': 'Botones y Herrajes SAS',
      'PROV-003': 'Telas e Insumos del Centro',
      'PROV-004': 'Hilos Medellín'
    };

    const nuevaCompra: Compra = {
      id: autoNuevoId,
      fecha: formFecha || new Date().toISOString().split('T')[0],
      idProveedor: formProveedor || 'PROV-001',
      nombreProveedor: proveedoresMap[formProveedor] || 'Proveedor General',
      descripcion: formDescripcion || 'Compra general de insumos',
      detalles: []
    };

    setCompras([nuevaCompra, ...compras]);
    setExpandedId(autoNuevoId);
    setIsCreateOpen(false);
    toast.success('Compra creada correctamente', {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  const handleOpenEdit = (compra: Compra) => {
    setEditCompra(compra);
    setFormFecha(compra.fecha);
    setFormProveedor(compra.idProveedor);
    setFormDescripcion(compra.descripcion);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompra) return;
    const proveedoresMap: Record<string, string> = {
      'PROV-001': 'TextilsCOL',
      'PROV-002': 'Botones y Herrajes SAS',
      'PROV-003': 'Telas e Insumos del Centro',
      'PROV-004': 'Hilos Medellín'
    };

    setCompras(compras.map(c => c.id === editCompra.id ? {
      ...c,
      fecha: formFecha,
      idProveedor: formProveedor,
      nombreProveedor: proveedoresMap[formProveedor] || 'Proveedor General',
      descripcion: formDescripcion
    } : c));
    setEditCompra(null);
    toast.success('Compra actualizada correctamente', {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteItem) return;
    setCompras(compras.filter(c => c.id !== deleteItem.id));
    setDeleteItem(null);
    toast.success('Compra eliminada correctamente', {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setEditingDetalleId(null);
    setIsAddingDetalle(false);
  };

  // Funciones para gestionar detalles dentro del acordeón
  const handleStartAddDetalle = () => {
    setIsAddingDetalle(true);
    setNuevoDetInsumoId('INS-001');
    setNuevoDetCantidad(1);
    setNuevoDetValorUnitario(0);
  };

  const handleSaveNewDetalle = (compraId: string) => {
    const insumoObj = INSUMOS_DISPONIBLES.find(i => i.idInsumo === nuevoDetInsumoId);
    const nombreInsumo = insumoObj ? insumoObj.nombre : 'Insumo';

    const nuevoItem: DetalleItem = {
      idDetalle: `DC-${String(Date.now()).slice(-4)}`,
      idInsumo: nuevoDetInsumoId,
      nombreInsumo: nombreInsumo,
      cantidad: Number(nuevoDetCantidad) || 0,
      valorUnitario: Number(nuevoDetValorUnitario) || 0
    };

    setCompras(compras.map(c => {
      if (c.id !== compraId) return c;
      return { ...c, detalles: [...c.detalles, nuevoItem] };
    }));

    setIsAddingDetalle(false);
    toast.success('Ítem agregado al detalle', {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  const handleStartEditDetalle = (det: DetalleItem) => {
    setEditingDetalleId(det.idDetalle);
    setEditInsumoId(det.idInsumo);
    setEditCantidad(det.cantidad);
    setEditValorUnitario(det.valorUnitario);
  };

  const handleSaveDetalle = (compraId: string, idDetalle: string) => {
    const insumoObj = INSUMOS_DISPONIBLES.find(i => i.idInsumo === editInsumoId);
    const nombreInsumo = insumoObj ? insumoObj.nombre : 'Insumo';

    setCompras(compras.map(c => {
      if (c.id !== compraId) return c;
      const nuevosDetalles = c.detalles.map(d => {
        if (d.idDetalle !== idDetalle) return d;
        return {
          ...d,
          idInsumo: editInsumoId,
          nombreInsumo: nombreInsumo,
          cantidad: Number(editCantidad) || 0,
          valorUnitario: Number(editValorUnitario) || 0
        };
      });
      return { ...c, detalles: nuevosDetalles };
    }));

    setEditingDetalleId(null);
    toast.success('Detalle actualizado', {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  const handleDeleteDetalleItem = (compraId: string, idDetalle: string) => {
    setCompras(compras.map(c => {
      if (c.id !== compraId) return c;
      return { ...c, detalles: c.detalles.filter(d => d.idDetalle !== idDetalle) };
    }));
    toast.success('Ítem eliminado del detalle', {
      style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT, fontFamily: 'Montserrat, sans-serif' }
    });
  };

  const comprasFiltradas = compras.filter(c =>
    c.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.idProveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.nombreProveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.fecha.includes(busqueda)
  );

  const totalGeneralItems = compras.reduce((acc, c) => acc + c.detalles.length, 0);

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}>
      
      {/* ENCABEZADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Compras</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Maestro de compras con detalle de insumos por compra</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: 220, padding: '8px 12px 8px 36px', borderRadius: 8,
                border: `1px solid ${borderNormal}`, background: surfaceBg, color: fg,
                fontSize: 13, outline: 'none', fontFamily: 'Montserrat, sans-serif'
              }}
            />
          </div>

          <button
            onClick={handleOpenCreate}
            style={{
              background: `linear-gradient(135deg, #C9A227, ${GOLD}, ${GOLD_LIGHT})`,
              color: '#121212', fontWeight: 700, fontSize: 14, borderRadius: 10,
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif'
            }}
          >
            <Plus size={14} /> Nueva compra
          </button>
        </div>
      </div>

      {/* TABLA MAESTRA DE COMPRAS */}
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        background: cardBg
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', whiteSpace: 'nowrap' }}>ID COMPRA</th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', whiteSpace: 'nowrap' }}>FECHA</th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', whiteSpace: 'nowrap' }}>ID PROVEEDOR</th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', whiteSpace: 'nowrap' }}>DESCRIPCIÓN</th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', whiteSpace: 'nowrap' }}>TOTAL COMPRA</th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: subtle, fontSize: 13 }}>
                  No se encontraron compras registradas.
                </td>
              </tr>
            ) : (
              comprasFiltradas.map((compra) => {
                const totalCompra = compra.detalles.reduce((sum, item) => sum + (item.cantidad * item.valorUnitario), 0);
                const isExpanded = expandedId === compra.id;

                return (
                  <React.Fragment key={compra.id}>
                    <tr style={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', background: `${GOLD}1F`, color: GOLD,
                            fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6
                          }}>
                            {compra.id}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 600, background: dark ? '#333' : '#F0EAD6', color: subtle, padding: '2px 6px', borderRadius: 4 }}>
                            {compra.detalles.length} {compra.detalles.length === 1 ? 'ítem' : 'ítems'}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 13, color: fg }}>
                        {compra.fecha}
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', background: `${GOLD}14`, color: GOLD,
                          fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6
                        }} title={compra.nombreProveedor}>
                          {compra.idProveedor}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontSize: 12, color: subtle, maxWidth: 300 }}>
                        {compra.descripcion}
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', fontWeight: 700, fontSize: 13, color: fg }}>
                        {totalCompra > 0 ? `$ ${totalCompra.toLocaleString('es-CO')}` : '—'}
                      </td>

                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            onClick={() => toggleExpand(compra.id)}
                            title="Ver detalle"
                            style={{
                              width: 32, height: 32, borderRadius: '50%', backgroundColor: isExpanded ? `${BLUE_ACCENT}26` : 'transparent',
                              border: `1.5px solid ${BLUE_ACCENT}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: fg, transition: 'background-color 0.15s'
                            }}
                          >
                            <Eye size={14} color={BLUE_ACCENT} />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(compra)}
                            title="Editar maestro"
                            style={{
                              width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent',
                              border: `1.5px solid ${GOLD}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: fg, transition: 'background-color 0.15s'
                            }}
                          >
                            <Pencil size={14} color={fg} />
                          </button>

                          <button
                            onClick={() => setDeleteItem(compra)}
                            title="Eliminar"
                            style={{
                              width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent',
                              border: `1.5px solid ${GOLD}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: fg, transition: 'background-color 0.15s'
                            }}
                          >
                            <Trash2 size={14} color={fg} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* DESPLEGABLE DE DETALLE DE COMPRA */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: '16px 24px', background: dark ? '#181818' : '#FAF9F6', borderBottom: `2px solid ${GOLD}40` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 3, height: 14, background: BLUE_ACCENT, borderRadius: 2 }} />
                              <span style={{ fontSize: 11, fontWeight: 800, color: BLUE_ACCENT, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                DETALLE_COMPRA — {compra.id} ({compra.nombreProveedor})
                              </span>
                            </div>

                            <button
                              onClick={handleStartAddDetalle}
                              style={{
                                background: `${GOLD}20`, border: `1px solid ${GOLD}`, color: GOLD,
                                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Montserrat, sans-serif'
                              }}
                            >
                              <Plus size={12} /> Agregar ítem
                            </button>
                          </div>

                          <div style={{ background: cardBg, borderRadius: 10, overflow: 'hidden', border: `1px solid ${borderNormal}` }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ background: dark ? '#222' : '#F4F2EB', borderBottom: `1px solid ${GOLD}40` }}>
                                  <th style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '10px 14px' }}>ID DETALLE</th>
                                  <th style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '10px 14px' }}>ID INSUMO</th>
                                  <th style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '10px 14px' }}>CANTIDAD</th>
                                  <th style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '10px 14px' }}>VALOR UNITARIO</th>
                                  <th style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '10px 14px' }}>SUBTOTAL</th>
                                  <th style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '10px 14px', textAlign: 'right' }}>ACCIONES</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* FILA PARA AGREGAR NUEVO ÍTEM EN EL DETALLE */}
                                {isAddingDetalle && (
                                  <tr style={{ background: dark ? '#2A2A2A' : '#FFFDF0', borderBottom: `1px solid ${GOLD}` }}>
                                    <td style={{ padding: '10px 14px', fontSize: 11, color: GOLD, fontWeight: 700 }}>NUEVO</td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <select
                                        value={nuevoDetInsumoId}
                                        onChange={(e) => setNuevoDetInsumoId(e.target.value)}
                                        style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${GOLD}`, background: inputBg, color: fg, fontSize: 12, outline: 'none', width: '100%' }}
                                      >
                                        {INSUMOS_DISPONIBLES.map(ins => (
                                          <option key={ins.idInsumo} value={ins.idInsumo}>{ins.idInsumo} — {ins.nombre}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <input
                                        type="number"
                                        value={nuevoDetCantidad}
                                        onChange={(e) => setNuevoDetCantidad(Number(e.target.value))}
                                        style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: `1px solid ${GOLD}`, background: inputBg, color: fg, fontSize: 12, outline: 'none' }}
                                      />
                                    </td>
                                    <td style={{ padding: '10px 14px' }}>
                                      <input
                                        type="number"
                                        value={nuevoDetValorUnitario}
                                        onChange={(e) => setNuevoDetValorUnitario(Number(e.target.value))}
                                        style={{ width: 85, padding: '6px 8px', borderRadius: 6, border: `1px solid ${GOLD}`, background: inputBg, color: fg, fontSize: 12, outline: 'none' }}
                                      />
                                    </td>
                                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: GOLD }}>
                                      $ {(nuevoDetCantidad * nuevoDetValorUnitario).toLocaleString('es-CO')}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                        <button
                                          onClick={() => handleSaveNewDetalle(compra.id)}
                                          title="Guardar nuevo ítem"
                                          style={{ width: 28, height: 28, borderRadius: '50%', background: SUCCESS_BG, border: '1px solid #28A745', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                          <Check size={14} color={SUCCESS_TXT} />
                                        </button>
                                        <button
                                          onClick={() => setIsAddingDetalle(false)}
                                          title="Cancelar"
                                          style={{ width: 28, height: 28, borderRadius: '50%', background: 'transparent', border: `1px solid ${subtle}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                          <X size={14} color={subtle} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {compra.detalles.length === 0 && !isAddingDetalle ? (
                                  <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: subtle, fontSize: 12 }}>
                                      No hay ítems registrados en esta compra. Haz clic en "Agregar ítem" para comenzar.
                                    </td>
                                  </tr>
                                ) : (
                                  compra.detalles.map((det) => {
                                    const isEditing = editingDetalleId === det.idDetalle;
                                    const subtotalItem = det.cantidad * det.valorUnitario;

                                    return (
                                      <tr key={det.idDetalle} style={{ borderBottom: `1px solid ${borderNormal}`, background: isEditing ? (dark ? '#222' : '#FFFDF5') : 'transparent' }}>
                                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                                          <span style={{ background: `${GOLD}1F`, color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                                            {det.idDetalle}
                                          </span>
                                        </td>

                                        <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: 12, color: fg }}>
                                          {isEditing ? (
                                            <select
                                              value={editInsumoId}
                                              onChange={(e) => setEditInsumoId(e.target.value)}
                                              style={{
                                                padding: '6px 10px', borderRadius: 6, border: `1px solid ${GOLD}`,
                                                background: inputBg, color: fg, fontSize: 12, outline: 'none', fontFamily: 'Montserrat, sans-serif', width: '100%'
                                              }}
                                            >
                                              {INSUMOS_DISPONIBLES.map(ins => (
                                                <option key={ins.idInsumo} value={ins.idInsumo}>
                                                  {ins.idInsumo} — {ins.nombre}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                              <span style={{ background: `${GOLD}14`, color: GOLD, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                                                {det.idInsumo}
                                              </span>
                                              <span style={{ fontWeight: 600 }}>{det.nombreInsumo}</span>
                                            </div>
                                          )}
                                        </td>

                                        <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: 12, fontWeight: 600, color: fg }}>
                                          {isEditing ? (
                                            <input
                                              type="number"
                                              value={editCantidad}
                                              onChange={(e) => setEditCantidad(Number(e.target.value))}
                                              style={{
                                                width: 70, padding: '6px 8px', borderRadius: 6, border: `1px solid ${GOLD}`,
                                                background: inputBg, color: fg, fontSize: 12, outline: 'none', fontFamily: 'Montserrat, sans-serif'
                                              }}
                                            />
                                          ) : (
                                            det.cantidad
                                          )}
                                        </td>

                                        <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: 12, color: subtle }}>
                                          {isEditing ? (
                                            <input
                                              type="number"
                                              value={editValorUnitario}
                                              onChange={(e) => setEditValorUnitario(Number(e.target.value))}
                                              style={{
                                                width: 90, padding: '6px 8px', borderRadius: 6, border: `1px solid ${GOLD}`,
                                                background: inputBg, color: fg, fontSize: 12, outline: 'none', fontFamily: 'Montserrat, sans-serif'
                                              }}
                                            />
                                          ) : (
                                            `$ ${det.valorUnitario.toLocaleString('es-CO')}`
                                          )}
                                        </td>

                                        <td style={{ padding: '10px 14px', verticalAlign: 'middle', fontSize: 12, fontWeight: 700, color: GOLD }}>
                                          $ {subtotalItem.toLocaleString('es-CO')}
                                        </td>

                                        <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            {isEditing ? (
                                              <button
                                                onClick={() => handleSaveDetalle(compra.id, det.idDetalle)}
                                                title="Guardar cambios"
                                                style={{
                                                  width: 28, height: 28, borderRadius: '50%', background: SUCCESS_BG,
                                                  border: '1px solid #28A745', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                              >
                                                <Check size={14} color={SUCCESS_TXT} />
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => handleStartEditDetalle(det)}
                                                title="Editar ítem"
                                                style={{
                                                  width: 28, height: 28, borderRadius: '50%', background: 'transparent',
                                                  border: `1px solid ${GOLD}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                              >
                                                <Pencil size={12} color={GOLD} />
                                              </button>
                                            )}

                                            <button
                                              onClick={() => handleDeleteDetalleItem(compra.id, det.idDetalle)}
                                              title="Eliminar ítem"
                                              style={{
                                                width: 28, height: 28, borderRadius: '50%', background: 'transparent',
                                                border: `1px solid ${DANGER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                              }}
                                            >
                                              <Trash2 size={12} color={DANGER} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                              <tfoot>
                                <tr style={{ background: dark ? '#222' : '#F9F8F4' }}>
                                  <td colSpan={4} style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, fontSize: 11, color: GOLD, textTransform: 'uppercase' }}>
                                    TOTAL COMPRA
                                  </td>
                                  <td colSpan={2} style={{ padding: '10px 14px', fontWeight: 800, fontSize: 13, color: GOLD }}>
                                    $ {totalCompra.toLocaleString('es-CO')}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 12, color: subtle, marginTop: 12 }}>
        {compras.length} compras · {totalGeneralItems} detalles en total
      </div>

      {/* MODAL NUEVA COMPRA (SOLO MAESTRO) */}
      {isCreateOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 500, borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
            
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg }}>Nueva Compra</h3>
              <button onClick={() => setIsCreateOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: subtle }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveCreate} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>ID (AUTO)</label>
                  <input type="text" value={autoNuevoId} disabled style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: dark ? '#222' : '#EFEFEF', color: subtle, border: `1px solid ${borderNormal}`, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>FECHA</label>
                  <input type="date" value={formFecha} onChange={(e) => setFormFecha(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>PROVEEDOR</label>
                <select value={formProveedor} onChange={(e) => setFormProveedor(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">— Seleccionar proveedor —</option>
                  <option value="PROV-001">PROV-001 — TextilsCOL</option>
                  <option value="PROV-002">PROV-002 — Botones y Herrajes SAS</option>
                  <option value="PROV-003">PROV-003 — Telas e Insumos del Centro</option>
                  <option value="PROV-004">PROV-004 — Hilos Medellín</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>DESCRIPCIÓN</label>
                <input type="text" placeholder="Descripción general de la compra" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ padding: '16px 24px', margin: '-20px -24px -20px', marginTop: 12, borderTop: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: dark ? '#252525' : '#FAFAFA' }}>
                <button type="button" onClick={() => setIsCreateOpen(false)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: dark ? '#2A2A2A' : '#E8E8E8', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Guardar Compra</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR COMPRA MAESTRA */}
      {editCompra && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 500, borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
            
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: fg }}>Editar Compra (Maestro)</h3>
              <button onClick={() => setEditCompra(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: subtle }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>ID COMPRA</label>
                  <input type="text" value={editCompra.id} disabled style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: dark ? '#222' : '#EFEFEF', color: subtle, border: `1px solid ${borderNormal}`, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>FECHA</label>
                  <input type="date" value={formFecha} onChange={(e) => setFormFecha(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>PROVEEDOR</label>
                <select value={formProveedor} onChange={(e) => setFormProveedor(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}>
                  <option value="PROV-001">PROV-001 — TextilsCOL</option>
                  <option value="PROV-002">PROV-002 — Botones y Herrajes SAS</option>
                  <option value="PROV-003">PROV-003 — Telas e Insumos del Centro</option>
                  <option value="PROV-004">PROV-004 — Hilos Medellín</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>DESCRIPCIÓN</label>
                <input type="text" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ padding: '16px 24px', margin: '-20px -24px -20px', marginTop: 12, borderTop: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: dark ? '#252525' : '#FAFAFA' }}>
                <button type="button" onClick={() => setEditCompra(null)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: dark ? '#2A2A2A' : '#E8E8E8', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
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
              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 8px' }}>¿Eliminar compra?</h3>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 16px' }}>Esta acción no se puede deshacer.</p>

              <div style={{ background: DANGER_BG, border: `1px solid ${DANGER}4D`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: DANGER_TXT, fontWeight: 600, marginBottom: 20, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color={DANGER} style={{ flexShrink: 0 }} />
                <span>Se eliminará la compra <strong>{deleteItem.id}</strong> junto con sus detalles asociados.</span>
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
};