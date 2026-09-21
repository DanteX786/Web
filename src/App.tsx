import React, { useState } from 'react';
<<<<<<< HEAD
import { Toaster } from 'sonner';
import MainLayout from './components/MainLayout';
import { AuthView } from './modules/auth/components/AuthView';
import { ProduccionView } from './modules/produccion/ProduccionView';
import TiposPieza from './modules/parametros/TiposPieza';
import TiposMaquinaria from './modules/parametros/TiposMaquinaria';
import { TipoInsumoView } from './modules/inventario/Tipo_Insumo_view';
import { InsumosView } from './modules/inventario/Insumo_view';
import { ComprasView } from './modules/inventario/Compras_View';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<string>('produccion');
  const [dark, setDark] = useState<boolean>(false);

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AuthView onLoginSuccess={() => setIsAuthenticated(true)} />
      </>
    );
  }

  return (
    <MainLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      dark={dark}
      setDark={setDark}
      onLogout={() => setIsAuthenticated(false)}
      userName="Juan Valle"
      userRole="Administrador"
    >
      <Toaster position="top-right" richColors />
      
      {/* Módulo de Producción */}
      {currentView === 'produccion' && <ProduccionView dark={dark} />}

      {/* Módulos de Inventario (Nuevos) */}
      {currentView === 'tipoInsumos' && <TipoInsumoView dark={dark} />}
      {currentView === 'insumos' && <InsumosView dark={dark} />}
      {currentView === 'compras' && <ComprasView dark={dark} />}

      {/* Módulo: Administración de Parámetros */}
      {currentView === 'catalogoPiezas' && <TiposPieza dark={dark} />}
      {currentView === 'tiposMaquinaria' && <TiposMaquinaria dark={dark} />}
      
      {/* Dashboard por defecto */}
      {currentView === 'dashboard' && (
        <div style={{ color: dark ? '#F8F9FA' : '#121212', fontSize: 24, fontWeight: 800 }}>
          Dashboard Principal de Eslabón
        </div>
      )}
    </MainLayout>
  );
}
=======
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
>>>>>>> temp-branch
