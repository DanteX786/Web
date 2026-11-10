import React, { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Eye, X, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { compraService, type Compra as CompraApi } from '../services/compraService';
import { insumoService } from '../services/insumoService';
import { proveedorService, type Proveedor } from '../services/proveedorService';

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
  idDetalle: string;   // solo para mostrar en la tabla (la base de datos identifica la línea por compra + insumo)
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
  total: number;       // lo calcula la base de datos
  detalles: DetalleItem[];
}

interface Insumo {
  idInsumo: string;
  nombre: string;
}

interface Props {
  dark?: boolean;
}

/** Convierte la compra que llega de la API al formato que usa esta pantalla. */
const aCompraVista = (c: CompraApi): Compra => ({
  id: c.id,
  fecha: c.fecha,
  idProveedor: c.id_proveedor ?? '',
  nombreProveedor: c.nombre_proveedor ?? 'Proveedor',
  descripcion: c.descripcion ?? '',
  total: c.total,
  detalles: c.detalles.map((d, i) => ({
    idDetalle: `${c.id}-${String(i + 1).padStart(2, '0')}`,
    idInsumo: d.id_insumo,
    nombreInsumo: d.nombre_insumo ?? 'Insumo',
    cantidad: d.cantidad,
    valorUnitario: d.valor_unitario,
  })),
});

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

const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const ComprasView: React.FC<Props> = ({ dark = false }) => {
  const [busqueda, setBusqueda] = useState('');

  // Datos que vienen de la API
  const [compras, setCompras] = useState<Compra[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [listaCompras, listaInsumos, listaProveedores] = await Promise.all([
          compraService.listar(),
          insumoService.listar(),
          proveedorService.listar('Activo'),
        ]);
        setCompras(listaCompras.map(aCompraVista));
        setInsumos(listaInsumos.map(i => ({ idInsumo: i.id, nombre: i.nombre })));
        setProveedores(listaProveedores);
      } catch (error) {
        toast.error(mensajeError(error, 'No se pudieron cargar las compras. ¿Está encendido el backend?'));
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  /** Reemplaza en la lista la compra que devolvió la API después de un cambio. */
  const actualizarEnLista = (c: CompraApi) => {
    const vista = aCompraVista(c);
    setCompras(prev => prev.map(x => x.id === vista.id ? vista : x));
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Control de edición en línea de detalle existente (en el acordeón)
  const [editingDetalleId, setEditingDetalleId] = useState<string | null>(null);
  const [editInsumoId, setEditInsumoId] = useState('');
  const [editCantidad, setEditCantidad] = useState<number>(0);
  const [editValorUnitario, setEditValorUnitario] = useState<number>(0);

  // Estados de modales generales (Maestro)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCompra, setEditCompra] = useState<Compra | null>(null);
  const [deleteItem, setDeleteItem] = useState<Compra | null>(null);

  // Estado para el modal de eliminar ítem del detalle
  const [deleteDetalleItemState, setDeleteDetalleItemState] = useState<{ compraId: string; detalle: DetalleItem } | null>(null);

  // Formulario temporal maestro
  const [formFecha, setFormFecha] = useState('');
  const [formProveedor, setFormProveedor] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');

  // ESTADO PARA LOS DETALLES DINÁMICOS EN EL MODAL DE NUEVA COMPRA
  const [formDetalles, setFormDetalles] = useState<{idInsumo: string, cantidad: number, valorUnitario: number}[]>([
    { idInsumo: '', cantidad: 1, valorUnitario: 0 }
  ]);

  const bg = dark ? "#121212" : "#F8F9FA";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const autoNuevoId = 'Se genera al guardar';

  const handleOpenCreate = () => {
    setFormFecha(hoy());
    setFormProveedor('');
    setFormDescripcion('');
    setFormDetalles([{ idInsumo: '', cantidad: 1, valorUnitario: 0 }]);
    setIsCreateOpen(true);
  };

  // ==========================================
  // FUNCIONES DEL MODAL "NUEVA COMPRA"
  // ==========================================
  const agregarFilaDetalle = () => {
    setFormDetalles([...formDetalles, { idInsumo: '', cantidad: 1, valorUnitario: 0 }]);
  };

  const actualizarFilaDetalle = (index: number, campo: 'idInsumo' | 'cantidad' | 'valorUnitario', valor: string | number) => {
    const nuevosDetalles = [...formDetalles];
    nuevosDetalles[index] = { ...nuevosDetalles[index], [campo]: valor };
    setFormDetalles(nuevosDetalles);
  };

  const eliminarFilaDetalle = (index: number) => {
    const nuevosDetalles = formDetalles.filter((_, i) => i !== index);
    setFormDetalles(nuevosDetalles);
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProveedor) {
      toast.error('Seleccione un proveedor.');
      return;
    }
    const filas = formDetalles.filter(d => d.idInsumo !== '');
    if (filas.length === 0) {
      toast.error('Agregue al menos un insumo a la compra.');
      return;
    }
    const ids = filas.map(d => d.idInsumo);
    if (new Set(ids).size !== ids.length) {
      toast.error('Cada insumo debe aparecer una sola vez. Junte las cantidades en una sola fila.');
      return;
    }
    if (filas.some(d => !(d.cantidad > 0) || !(d.valorUnitario > 0))) {
      toast.error('La cantidad y el valor unitario deben ser mayores que cero.');
      return;
    }

    setGuardando(true);
    try {
      const nueva = await compraService.crear({
        fecha: formFecha || undefined,
        id_proveedor: formProveedor,
        descripcion: formDescripcion.trim() || null,
        detalles: filas.map(d => ({ id_insumo: d.idInsumo, cantidad: d.cantidad, valor_unitario: d.valorUnitario })),
      });
      const vista = aCompraVista(nueva);
      setCompras([vista, ...compras]);
      setExpandedId(vista.id);
      setIsCreateOpen(false);
      toast.success(`Compra ${vista.id} creada correctamente. El stock de los insumos se actualizó.`, {
        style: { background: SUCCESS_BG, border: '1px solid #28A745', color: SUCCESS_TXT }
      });
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo crear la compra.'));
    } finally {
      setGuardando(false);
    }
  };

  // ==========================================
  // FUNCIONES DE EDICIÓN / ELIMINACIÓN MAESTRO
  // ==========================================
  const handleOpenEdit = (compra: Compra) => {
    setEditCompra(compra);
    setFormFecha(compra.fecha);
    setFormProveedor(compra.idProveedor);
    setFormDescripcion(compra.descripcion);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompra) return;
    if (!formProveedor) {
      toast.error('Seleccione un proveedor.');
      return;
    }
    try {
      const actualizada = await compraService.actualizar(editCompra.id, {
        fecha: formFecha,
        id_proveedor: formProveedor,
        descripcion: formDescripcion.trim() || null,
      });
      actualizarEnLista(actualizada);
      setEditCompra(null);
      toast.success('Compra actualizada correctamente');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo actualizar la compra.'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      await compraService.eliminar(deleteItem.id);
      setCompras(compras.filter(c => c.id !== deleteItem.id));
      toast.success('Compra eliminada correctamente. El stock de los insumos se descontó.');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo eliminar la compra.'));
    } finally {
      setDeleteItem(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setEditingDetalleId(null);
  };

  // ==========================================
  // FUNCIONES DE EDICIÓN DETALLE (ACORDEÓN)
  // ==========================================
  const handleStartEditDetalle = (det: DetalleItem) => {
    setEditingDetalleId(det.idDetalle);
    setEditInsumoId(det.idInsumo);
    setEditCantidad(det.cantidad);
    setEditValorUnitario(det.valorUnitario);
  };

  const handleSaveDetalle = async (compraId: string, idDetalle: string) => {
    const compra = compras.find(c => c.id === compraId);
    const det = compra?.detalles.find(d => d.idDetalle === idDetalle);
    if (!det) return;
    if (!(editCantidad > 0) || !(editValorUnitario > 0)) {
      toast.error('La cantidad y el valor unitario deben ser mayores que cero.');
      return;
    }
    try {
      const actualizada = await compraService.actualizarDetalle(compraId, det.idInsumo, {
        id_insumo: editInsumoId,
        cantidad: Number(editCantidad),
        valor_unitario: Number(editValorUnitario),
      });
      actualizarEnLista(actualizada);
      setEditingDetalleId(null);
      toast.success('Detalle actualizado');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo actualizar el detalle.'));
    }
  };

  const handleConfirmDeleteDetalle = async () => {
    if (!deleteDetalleItemState) return;
    const { compraId, detalle } = deleteDetalleItemState;
    try {
      const actualizada = await compraService.eliminarDetalle(compraId, detalle.idInsumo);
      actualizarEnLista(actualizada);
      toast.success('Ítem eliminado del detalle correctamente');
    } catch (error) {
      toast.error(mensajeError(error, 'No se pudo eliminar el ítem.'));
    } finally {
      setDeleteDetalleItemState(null);
    }
  };

  const comprasFiltradas = compras.filter(c =>
    c.id.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.idProveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.nombreProveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.fecha.includes(busqueda)
  );

  // Lógica para seccionar los datos por página
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = comprasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(comprasFiltradas.length / itemsPerPage);

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
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', whiteSpace: 'nowrap' }}>PROVEEDOR</th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', whiteSpace: 'nowrap' }}>DESCRIPCIÓN</th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', whiteSpace: 'nowrap' }}>TOTAL COMPRA</th>
              <th style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: subtle, fontSize: 13 }}>
                  Cargando compras...
                </td>
              </tr>
            ) : comprasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: subtle, fontSize: 13 }}>
                  No se encontraron compras registradas.
                </td>
              </tr>
            ) : (
              currentItems.map((compra) => {
                const totalCompra = compra.total;
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
                        <span style={{ fontSize: 12, color: fg, marginLeft: 6 }}>{compra.nombreProveedor}</span>
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
                              <div style={{ width: 3, height: 14, background: GOLD, borderRadius: 2 }} />
                              <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                DETALLE_COMPRA — {compra.id} ({compra.nombreProveedor})
                              </span>
                            </div>
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
                                {compra.detalles.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: subtle, fontSize: 12 }}>
                                      No hay ítems registrados en esta compra.
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
                                              {insumos.map(ins => (
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
                                              onClick={() => setDeleteDetalleItemState({ compraId: compra.id, detalle: det })}
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

      {/* CONTROLES DE PAGINACIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px' }}>
        <span style={{ fontSize: 12, color: subtle, fontFamily: 'Montserrat, sans-serif' }}>
          Mostrando de {comprasFiltradas.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, comprasFiltradas.length)} de {comprasFiltradas.length} compras · {totalGeneralItems} detalles en total
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

      {/* MODAL NUEVA COMPRA (MAESTRO + DETALLES DINÁMICOS) */}
      {isCreateOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 540, borderRadius: 16, backgroundColor: cardBg, border: `1px solid ${GOLD}40`, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
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
                  <input type="date" max={hoy()} value={formFecha} onChange={(e) => setFormFecha(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>PROVEEDOR</label>
                <select value={formProveedor} onChange={(e) => setFormProveedor(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">— Seleccionar proveedor —</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.id} — {p.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>DESCRIPCIÓN</label>
                <input type="text" placeholder="Descripción general de la compra" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* === SECCIÓN DINÁMICA DE INSÚMOS DENTRO DEL MODAL === */}
              <div style={{ marginTop: 4, borderTop: `1px solid ${GOLD}40`, paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle }}>Insumos de la compra</label>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      type="button" 
                      onClick={agregarFilaDetalle}
                      style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}`, color: GOLD, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <Plus size={12} /> Añadir fila
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                  {formDetalles.map((detalle, index) => (
                    <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center', background: dark ? '#252525' : '#F9F9F9', padding: 8, borderRadius: 8, border: `1px solid ${borderNormal}` }}>
                      
                      <select 
                        value={detalle.idInsumo} 
                        onChange={(e) => actualizarFilaDetalle(index, 'idInsumo', e.target.value)}
                        required
                        style={{ flex: 2, padding: '8px', borderRadius: 6, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 12, outline: 'none', fontFamily: 'Montserrat, sans-serif' }}
                      >
                        <option value="">Seleccionar insumo...</option>
                        {insumos.map(ins => (
                          <option key={ins.idInsumo} value={ins.idInsumo}>{ins.nombre}</option>
                        ))}
                      </select>

                      <input 
                        type="number" 
                        min="1"
                        placeholder="Cant."
                        value={detalle.cantidad}
                        onChange={(e) => actualizarFilaDetalle(index, 'cantidad', Number(e.target.value))}
                        required
                        style={{ width: 70, padding: '8px', borderRadius: 6, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 12, outline: 'none', fontFamily: 'Montserrat, sans-serif' }}
                      />

                      <input 
                        type="number" 
                        min="0"
                        placeholder="$ Unitario"
                        value={detalle.valorUnitario}
                        onChange={(e) => actualizarFilaDetalle(index, 'valorUnitario', Number(e.target.value))}
                        required
                        style={{ width: 90, padding: '8px', borderRadius: 6, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 12, outline: 'none', fontFamily: 'Montserrat, sans-serif' }}
                      />

                      <div style={{ width: 90, fontSize: 12, fontWeight: 700, color: GOLD, textAlign: 'right' }}>
                        $ {(detalle.cantidad * detalle.valorUnitario).toLocaleString('es-CO')}
                      </div>

                      <button 
                        type="button" 
                        onClick={() => eliminarFilaDetalle(index)}
                        disabled={formDetalles.length === 1} 
                        style={{ background: 'transparent', border: 'none', color: formDetalles.length === 1 ? subtle : DANGER, cursor: formDetalles.length === 1 ? 'not-allowed' : 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px 24px', margin: '-20px -24px -20px', marginTop: 12, borderTop: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: dark ? '#252525' : '#FAFAFA' }}>
                <button type="button" onClick={() => setIsCreateOpen(false)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: dark ? '#2A2A2A' : '#E8E8E8', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardando} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 13, cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>{guardando ? 'Guardando...' : 'Guardar Compra'}</button>
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
                  <input type="date" max={hoy()} value={formFecha} onChange={(e) => setFormFecha(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>PROVEEDOR</label>
                <select value={formProveedor} onChange={(e) => setFormProveedor(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, backgroundColor: inputBg, color: fg, border: `1px solid ${borderNormal}`, outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">— Seleccionar proveedor —</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.id} — {p.nombre}</option>
                  ))}
                  {editCompra.idProveedor && !proveedores.some(p => p.id === editCompra.idProveedor) && (
                    <option value={editCompra.idProveedor}>{editCompra.idProveedor} — {editCompra.nombreProveedor} (inactivo)</option>
                  )}
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

      {/* MODAL ELIMINAR COMPRA MAESTRA */}
      {deleteItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400, borderRadius: 16, backgroundColor: cardBg, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'center', paddingBottom: 24 }}>
            <div style={{ height: 4, background: `linear-gradient(135deg, ${DANGER}, #f56565)` }} />
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: DANGER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={28} color={DANGER} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 8px' }}>¿Eliminar compra?</h3>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 16px' }}>Esta acción no se puede deshacer. Se descontará del stock lo que se había comprado.</p>

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

      {/* MODAL ELIMINAR ÍTEM DEL DETALLE DE COMPRA */}
      {deleteDetalleItemState && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400, borderRadius: 16, backgroundColor: cardBg, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'center', paddingBottom: 24 }}>
            <div style={{ height: 4, background: `linear-gradient(135deg, ${DANGER}, #f56565)` }} />
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: DANGER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={28} color={DANGER} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 8px' }}>¿Eliminar ítem del detalle?</h3>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 16px' }}>Esta acción quitará este insumo de la compra actual.</p>

              <div style={{ background: DANGER_BG, border: `1px solid ${DANGER}4D`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: DANGER_TXT, fontWeight: 600, marginBottom: 20, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color={DANGER} style={{ flexShrink: 0 }} />
                <span>Se eliminará el insumo <strong>{deleteDetalleItemState.detalle.nombreInsumo}</strong> ({deleteDetalleItemState.detalle.idDetalle}).</span>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setDeleteDetalleItemState(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: dark ? '#2A2A2A' : '#E8E8E8', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleConfirmDeleteDetalle} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: DANGER, color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};