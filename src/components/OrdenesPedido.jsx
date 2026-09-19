import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, ChevronDown } from 'lucide-react';

export default function OrdenesPedido() {
  const [ordenes, setOrdenes] = useState([
    { id: 'ORDP-001', remision: 'REM-001', fecha: '2026-06-24', estado: 'PENDIENTE' },
    { id: 'ORDP-002', remision: 'REM-002', fecha: '2026-06-29', estado: 'EN PROCESO' },
    { id: 'ORDP-003', remision: 'REM-003', fecha: '2026-06-30', estado: 'COMPLETADA' },
  ]);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  const [formData, setFormData] = useState({ remision: 'REM-001', fecha: '2026-09-19', estado: 'PENDIENTE' });

  const handleSaveNew = (e) => {
    e.preventDefault();
    const newId = `ORDP-00${ordenes.length + 1}`;
    setOrdenes([...ordenes, { id: newId, ...formData }]);
    setModalOpen(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setOrdenes(ordenes.map(o => o.id === currentOrder.id ? currentOrder : o));
    setEditModalOpen(false);
  };

  const handleDelete = () => {
    setOrdenes(ordenes.filter(o => o.id !== currentOrder.id));
    setDeleteModalOpen(false);
  };

  const handleEstadoChange = (id, nuevoEstado) => {
    setOrdenes(ordenes.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o));
  };

  // Función para obtener los estilos dinámicos de color según el estado
  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-[#2a2312] text-[#FACC15] border border-[#3f3213]';
      case 'EN PROCESO':
        return 'bg-[#152338] text-[#3b82f6] border border-[#1e3a8a]';
      case 'COMPLETADA':
        return 'bg-[#132e1d] text-[#4ade80] border border-[#1e462d]';
      case 'CANCELADA':
        return 'bg-[#3b1515] text-[#f87171] border border-[#521d1d]';
      default:
        return 'bg-[#2a2312] text-[#FACC15] border border-[#3f3213]';
    }
  };

  const filtered = ordenes.filter(o => o.id.toLowerCase().includes(search.toLowerCase()) || o.remision.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Órdenes de Pedido</h1>
          <p className="text-sm text-gray-400 mt-1">Registro de órdenes vinculadas a remisiones</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1b1b1b] border border-[#333] rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#FACC15] w-64 text-white"
            />
          </div>
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-[#FACC15] text-black font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-[#e0b80e] transition-all shadow-lg"
          >
            <Plus size={16} /> Nueva orden
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2a2a2a] text-[#FACC15] text-xs uppercase tracking-wider">
              <th className="p-4">ID Orden</th>
              <th className="p-4">ID Remisión</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626] text-sm">
            {filtered.map((ord) => (
              <tr key={ord.id} className="hover:bg-[#202020] transition-colors">
                <td className="p-4 font-mono text-xs text-[#FACC15] bg-[#222]/50 rounded w-max">{ord.id}</td>
                <td className="p-4 text-[#FACC15]">{ord.remision}</td>
                <td className="p-4 text-gray-300">{ord.fecha}</td>
                <td className="p-4">
                  <div className="relative inline-block">
                    <select
                      value={ord.estado}
                      onChange={(e) => handleEstadoChange(ord.id, e.target.value)}
                      className={`appearance-none px-3.5 py-1.5 pr-8 rounded-full text-xs font-bold cursor-pointer outline-none transition-all ${getEstadoStyle(ord.estado)}`}
                    >
                      <option value="PENDIENTE" className="bg-[#181818] text-[#FACC15]">PENDIENTE</option>
                      <option value="EN PROCESO" className="bg-[#181818] text-[#3b82f6]">EN PROCESO</option>
                      <option value="COMPLETADA" className="bg-[#181818] text-[#4ade80]">COMPLETADA</option>
                      <option value="CANCELADA" className="bg-[#181818] text-[#f87171]">CANCELADA</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-2.5 pointer-events-none opacity-75" />
                  </div>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => { setCurrentOrder(ord); setEditModalOpen(true); }} className="p-2 border border-[#333] rounded-full hover:border-[#FACC15] text-[#FACC15] transition-all">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { setCurrentOrder(ord); setDeleteModalOpen(true); }} className="p-2 border border-[#333] rounded-full hover:border-red-500 text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 text-xs text-gray-500 border-t border-[#2a2a2a]">
          {filtered.length} registros
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#181818] border border-[#333] w-[500px] rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18}/></button>
            <h2 className="text-lg font-bold mb-6">Nueva Orden de Pedido</h2>
            <form onSubmit={handleSaveNew} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">ID (AUTO)</label>
                <input type="text" disabled value={`ORDP-00${ordenes.length + 1}`} className="w-full bg-[#121212] border border-[#333] rounded-xl px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">ID REMISIÓN</label>
                <select value={formData.remision} onChange={(e)=>setFormData({...formData, remision: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none">
                  <option value="REM-001">REM-001</option>
                  <option value="REM-002">REM-002</option>
                  <option value="REM-003">REM-003</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">FECHA</label>
                <input type="date" value={formData.fecha} onChange={(e)=>setFormData({...formData, fecha: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">ESTADO</label>
                <select value={formData.estado} onChange={(e)=>setFormData({...formData, estado: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none">
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN PROCESO">EN PROCESO</option>
                  <option value="COMPLETADA">COMPLETADA</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-[#252525] text-sm font-semibold rounded-xl hover:bg-[#333]">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#FACC15] text-black text-sm font-semibold rounded-xl hover:bg-[#e0b80e]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalOpen && currentOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#181818] border border-[#333] w-[500px] rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18}/></button>
            <h2 className="text-lg font-bold mb-6">Editar Orden de Pedido</h2>
            <form onSubmit={handleSaveEdit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">ID ORDEN</label>
                <input type="text" disabled value={currentOrder.id} className="w-full bg-[#121212] border border-[#333] rounded-xl px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">ID REMISIÓN</label>
                <select value={currentOrder.remision} onChange={(e)=>setCurrentOrder({...currentOrder, remision: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none">
                  <option value="REM-001">REM-001</option>
                  <option value="REM-002">REM-002</option>
                  <option value="REM-003">REM-003</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">FECHA</label>
                <input type="date" value={currentOrder.fecha} onChange={(e)=>setCurrentOrder({...currentOrder, fecha: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">ESTADO</label>
                <select value={currentOrder.estado} onChange={(e)=>setCurrentOrder({...currentOrder, estado: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none">
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="EN PROCESO">EN PROCESO</option>
                  <option value="COMPLETADA">COMPLETADA</option>
                  <option value="CANCELADA">CANCELADA</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-[#252525] text-sm font-semibold rounded-xl hover:bg-[#333]">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#FACC15] text-black text-sm font-semibold rounded-xl hover:bg-[#e0b80e]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#181818] border border-[#333] w-[420px] rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-lg font-bold mb-1">¿Eliminar registro?</h2>
            <p className="text-xs text-gray-400 mb-6">Esta acción es permanente y no se puede deshacer.</p>
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs py-2 px-3 rounded-xl mb-6 flex items-center gap-2 justify-center">
              <AlertTriangle size={14} /> El registro se eliminará permanentemente del sistema.
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-[#252525] text-sm font-semibold rounded-xl hover:bg-[#333] w-1/2">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 w-1/2">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

