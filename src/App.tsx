import React, { useState } from 'react';
import { Toaster } from 'sonner';
import MainLayout from './components/MainLayout';
import { AuthView } from './modules/auth/components/AuthView';
import { ProduccionView } from './modules/produccion/ProduccionView';
import TiposPieza from './modules/parametros/TiposPieza';
import TiposMaquinaria from './modules/parametros/TiposMaquinaria';
import { TipoInsumoView } from './modules/inventario/Tipo_Insumo_view';
import { InsumosView } from './modules/inventario/Insumo_view';
import { ComprasView } from './modules/inventario/Compras_View';
import InsumosEnviados from './modules/inventario/InsumosEnviados';
import OrdenesPedido from './modules/comercial/OrdenesPedido';
import Proveedores from './modules/configuracion/Proveedores';

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
      
      {currentView === 'produccion' && <ProduccionView dark={dark} />}

      {currentView === 'tipoInsumos' && <TipoInsumoView dark={dark} />}
      {currentView === 'insumos' && <InsumosView dark={dark} />}
      {currentView === 'compras' && <ComprasView dark={dark} />}
      {currentView === 'insumosEnviados' && <InsumosEnviados dark={dark} />}

      {currentView === 'ordenPedido' && <OrdenesPedido dark={dark} />}

      {currentView === 'proveedores' && <Proveedores dark={dark} />}

      {currentView === 'catalogoPiezas' && <TiposPieza dark={dark} />}
      {currentView === 'tiposMaquinaria' && <TiposMaquinaria dark={dark} />}
      
      {currentView === 'dashboard' && (
        <div style={{ padding: 24, color: dark ? '#F8F9FA' : '#121212', fontSize: 24, fontWeight: 800 }}>
          Dashboard Principal de Eslabón
        </div>
      )}
    </MainLayout>
  );
}