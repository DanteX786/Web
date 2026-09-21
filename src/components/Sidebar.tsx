import React from 'react';
import { LayoutDashboard, Users, Package, FileText, ShoppingCart, TrendingUp, Truck, Tag, Layers } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpen: boolean;
}

export default function Sidebar({ currentView, setCurrentView, isOpen }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'clientes', name: 'Clientes', icon: Users },
    { id: 'proveedores', name: 'Proveedores', icon: Package },
    { id: 'remisiones', name: 'Remisiones', icon: FileText },
    { id: 'ordenes', name: 'Órdenes de Pedido', icon: ShoppingCart },
    { id: 'ventas', name: 'Ventas', icon: TrendingUp },
    { id: 'envios', name: 'Envíos', icon: Truck },
    { id: 'tipo-insumos', name: 'Tipo de Insumos', icon: Tag },
    { id: 'insumos', name: 'Insumos', icon: Layers },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-[#141414] text-gray-300 flex flex-col justify-between border-r border-[#242424] h-screen sticky top-0 shadow-2xl transition-all duration-300 z-40">
      <div>
        <div className="p-4 flex justify-center border-b border-[#242424] bg-[#181818]">
          <div className="bg-white px-4 py-2 rounded-xl shadow-md flex items-center justify-center border border-gray-200 w-full max-w-[200px]">
            <img src="/logo.png" alt="ESLABÓN Logo" className="h-9 object-contain" />
          </div>
        </div>

        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-130px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1f1d15] text-[#FACC15] border-l-4 border-[#FACC15] shadow-inner font-bold'
                    : 'hover:bg-[#1b1b1b] text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#FACC15]' : 'text-gray-400'} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 border-t border-[#242424] bg-[#111] flex items-center gap-3.5 m-3 rounded-2xl">
        <div className="w-9 h-9 rounded-full bg-[#FACC15] text-black font-bold flex items-center justify-center text-xs shadow">
          A
        </div>
        <div>
          <h4 className="text-sm font-bold text-white leading-tight">Admin</h4>
          <span className="text-xs text-gray-400">Admin</span>
        </div>
      </div>
    </aside>
  );
}

