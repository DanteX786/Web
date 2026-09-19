import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle, ChevronDown } from 'lucide-react';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([
    { id: 'PROV-001', nit: '1923091231', nombre: 'TextilsCOL', contacto: 'Andres Cadavid', telefono: '23032193', estado: 'ACTIVO' },
    { id: 'PROV-002', nit: '1923091231', nombre: 'INSUMOMED', contacto: 'Axebiel Gayvils', telefono: '31239903', estado: 'ACTIVO' },
    { id: 'PROV-003', nit: '1923091231', nombre: 'HILOSAS', contacto: 'Emerson Aguemaya', telefono: '39138913', estado: 'INACTIVO' },
  ]);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentProv, setCurrentProv] = useState(null);

  const [formData, setFormData] = useState({ nit: '', nombre: '', contacto: '', telefono: '', estado: 'ACTIVO' });

  const handleSaveNew = (e) => {
    e.preventDefault();
    const newId = `PROV-00${proveedores.length + 1}`;
    setProveedores([...proveedores, { id: newId, ...formData }]);
    setModalOpen(false);
    setFormData({ nit: '', nombre: '', contacto: '', telefono: '', estado: 'ACTIVO' });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setProveedores(proveedores.map(p => p.id === currentProv.id ? currentProv : p));
    setEditModalOpen(false);
  };

  const handleDelete = () => {
    setProveedores(proveedores.filter(p => p.id !== currentProv.id));
    setDeleteModalOpen(false);
  };

  const handleEstadoChange = (id, nuevoEstado) => {
    setProveedores(proveedores.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
  };

  const filtered = proveedores.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-wide">Proveedores</h1>
          <p className="text-sm text-gray-400 mt-1">Proveedores de insumos y materiales del taller</p>
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
            <Plus size={16} /> Nuevo proveedor
          </button>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2a2a2a] text-[#FACC15] text-xs uppercase tracking-wider">
              <th className="p-4">ID Proveedor</th>
              <th className="p-4">NIT</th>
              <th className="p-4">Nombre</th>
              <th className="p-4">Contacto</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626] text-sm">
            {filtered.map((prov) => (
              <tr key={prov.id} className="hover:bg-[#202020] transition-colors">
                <td className="p-4 font-mono text-xs text-[#FACC15] bg-[#222]/50 rounded w-max">{prov.id}</td>
                <td className="p-4 text-gray-300">{prov.nit}</td>
                <td className="p-4 font-bold text-white">{prov.nombre}</td>
                <td className="p-4 text-gray-300">{prov.contacto}</td>
                <td className="p-4 text-gray-300">{prov.telefono}</td>
                <td className="p-4">
                  <div className="relative inline-block">
                    <select
                      value={prov.estado}
                      onChange={(e) => handleEstadoChange(prov.id, e.target.value)}
                      className={`appearance-none px-3.5 py-1.5 pr-8 rounded-full text-xs font-bold cursor-pointer outline-none transition-all ${
                        prov.estado === 'ACTIVO' 
                          ? 'bg-[#132e1d] text-[#4ade80] border border-[#1e462d]' 
                          : 'bg-[#3b1515] text-[#f87171] border border-[#521d1d]'
                      }`}
                    >
                      <option value="ACTIVO" className="bg-[#181818] text-[#4ade80]">ACTIVO</option>
                      <option value="INACTIVO" className="bg-[#181818] text-[#f87171]">INACTIVO</option>
                    </select>
                    <ChevronDown size={12} className={`absolute right-2.5 top-2.5 pointer-events-none ${prov.estado === 'ACTIVO' ? 'text-[#4ade80]' : 'text-[#f87171]'}`} />
                  </div>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <button onClick={() => { setCurrentProv(prov); setEditModalOpen(true); }} className="p-2 border border-[#333] rounded-full hover:border-[#FACC15] text-[#FACC15] transition-all">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { setCurrentProv(prov); setDeleteModalOpen(true); }} className="p-2 border border-[#333] rounded-full hover:border-red-500 text-red-400 transition-all">
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
            <h2 className="text-lg font-bold mb-6">Nuevo Proveedor</h2>
            <form onSubmit={handleSaveNew} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">ID (AUTO)</label>
                <input type="text" disabled value={`PROV-00${proveedores.length + 1}`} className="w-full bg-[#121212] border border-[#333] rounded-xl px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">NIT</label>
                <input type="text" placeholder="Ej: 1923091231" required value={formData.nit} onChange={(e)=>setFormData({...formData, nit: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">NOMBRE</label>
                <input type="text" placeholder="Nombre del proveedor" required value={formData.nombre} onChange={(e)=>setFormData({...formData, nombre: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">CONTACTO</label>
                <input type="text" placeholder="Nombre del contacto" required value={formData.contacto} onChange={(e)=>setFormData({...formData, contacto: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">TELÉFONO</label>
                <input type="text" placeholder="300 000 0000" required value={formData.telefono} onChange={(e)=>setFormData({...formData, telefono: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">ESTADO</label>
                <select value={formData.estado} onChange={(e)=>setFormData({...formData, estado: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none">
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
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

      {editModalOpen && currentProv && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#181818] border border-[#333] w-[500px] rounded-2xl p-6 shadow-2xl relative">
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={18}/></button>
            <h2 className="text-lg font-bold mb-6">Editar Proveedor</h2>
            <form onSubmit={handleSaveEdit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">ID PROVEEDOR</label>
                <input type="text" disabled value={currentProv.id} className="w-full bg-[#121212] border border-[#333] rounded-xl px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">NIT</label>
                <input type="text" value={currentProv.nit} onChange={(e)=>setCurrentProv({...currentProv, nit: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">NOMBRE</label>
                <input type="text" value={currentProv.nombre} onChange={(e)=>setCurrentProv({...currentProv, nombre: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">CONTACTO</label>
                <input type="text" value={currentProv.contacto} onChange={(e)=>setCurrentProv({...currentProv, contacto: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">TELÉFONO</label>
                <input type="text" value={currentProv.telefono} onChange={(e)=>setCurrentProv({...currentProv, telefono: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">ESTADO</label>
                <select value={currentProv.estado} onChange={(e)=>setCurrentProv({...currentProv, estado: e.target.value})} className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-sm focus:border-[#FACC15] outline-none">
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
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
