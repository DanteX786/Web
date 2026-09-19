import React from 'react';
import { Menu, Search, Bell, Sun, ChevronDown } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  return (
    <header className="h-16 bg-[#181818] border-b border-[#2a2a2a] px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Parte izquierda: Botón menú colapsable y Buscador */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleSidebar}
          className="text-gray-400 hover:text-[#FACC15] transition-colors p-2 rounded-xl hover:bg-[#222]"
          title="Ocultar / Mostrar menú"
        >
          <Menu size={22} />
        </button>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3.5 top-2.5 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Buscar en el sistema..." 
            className="bg-[#121212] border border-[#2c2c2c] rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#FACC15] w-72 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Parte derecha: Notificaciones, Modo Claro/Oscuro y Perfil */}
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 bg-[#121212] border border-[#2c2c2c] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-[#FACC15] transition-all">
          <Bell size={16} />
        </button>
        <button className="w-10 h-10 bg-[#121212] border border-[#2c2c2c] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-[#FACC15] transition-all">
          <Sun size={16} />
        </button>
        
        <div className="flex items-center gap-2.5 bg-[#121212] border border-[#2c2c2c] py-1.5 px-3.5 rounded-full ml-2 cursor-pointer hover:border-[#FACC15] transition-all">
          <div className="w-7 h-7 rounded-full bg-[#FACC15] text-black font-bold flex items-center justify-center text-xs">
            A
          </div>
          <span className="text-sm font-semibold text-white">Admin</span>
          <ChevronDown size={14} className="text-gray-400" />
        </div>
      </div>
    </header>
  );
}
