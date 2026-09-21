import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Proveedores from './components/Proveedores';
import OrdenesPedido from './components/OrdenesPedido';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('proveedores');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex bg-[#121212] min-h-screen font-sans text-white">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isOpen={isSidebarOpen} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-[#121212] p-6">
          {currentView === 'proveedores' && <Proveedores />}
          {currentView === 'ordenes' && <OrdenesPedido />}
          {currentView !== 'proveedores' && currentView !== 'ordenes' && (
            <div className="p-4">
              <h1 className="text-2xl font-bold capitalize">{currentView.replace('-', ' ')}</h1>
              <p className="text-gray-400 mt-2">Módulo listo para ser desarrollado.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
