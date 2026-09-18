import React, { useState } from 'react';
import { Toaster } from 'sonner';
import MainLayout from './components/MainLayout';
import {AuthView} from './modules/auth/components/AuthView';
import {ProduccionView} from './modules/produccion/ProduccionView';
import TiposPieza from './modules/parametros/TiposPieza';
import TiposMaquinaria from './modules/parametros/TiposMaquinaria';

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
      
      {/* Módulo de Producción - CORREGIDO */}
      {currentView === 'produccion' && <ProduccionView dark={dark} />}

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