import React, { useState } from 'react';
import { Toaster } from 'sonner';
import MainLayout from './components/MainLayout';
import { AuthView } from './modules/auth/components/AuthView';
import LandingPage from './components/LandingPage';

// MÓDULO PRODUCCIÓN
import { ProduccionView } from './modules/produccion/ProduccionView';
import { RegistroDiarioEmpleadoView } from './modules/comercial/RegistroDiarioEmpleadoView';

// MÓDULO INVENTARIO
import { TipoInsumoView } from './modules/inventario/Tipo_Insumo_view';
import { InsumosView } from './modules/inventario/Insumo_view';
import { ComprasView } from './modules/inventario/Compras_View';
import { InsumosEnviadosView } from './modules/inventario/InsumosEnviadosView';

// MÓDULO COMERCIAL
import OrdenesPedido from './modules/comercial/OrdenesPedido';
import { ClientesView } from './modules/comercial/ClientesView';
import { RegistroDiarioView } from './modules/comercial/RegistroDiarioView';
import { RemisionesView } from './modules/comercial/RemisionesView';
import { RemisionEntregaView } from './modules/comercial/RemisionEntregaView';

// MÓDULO CONFIGURACIÓN Y PARÁMETROS
import Proveedores from './modules/configuracion/Proveedores';
import TiposPieza from './modules/parametros/TiposPieza';
import TiposMaquinaria from './modules/parametros/TiposMaquinaria';
import EmpleadosView from './modules/configuracion/Empleados';
import Roles from './modules/configuracion/Roles';

// MÓDULO PRINCIPAL Y AUTH
import { DashboardPage } from './modules/principal/Dashboard';
import MiPerfil from './modules/auth/components/MiPerfil';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [dark, setDark] = useState<boolean>(false);

  // 1. SI LA VISTA ES 'landing', MUESTRA LA LANDING PAGE
  if (currentView === 'landing') {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LandingPage onNavigateToLogin={() => setCurrentView('login')} />
      </>
    );
  }

  // 2. SI NO ESTÁ AUTENTICADO, MUESTRA LA VISTA DE INICIO DE SESIÓN
  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AuthView 
          onLoginSuccess={() => {
            setIsAuthenticated(true);
            setCurrentView('dashboard'); // Redirige al Dashboard tras iniciar sesión
          }} 
        />
      </>
    );
  }

  // 3. VISTAS DEL SISTEMA DENTRO DEL MAINLAYOUT AL INICIAR SESIÓN
  return (
    <MainLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      dark={dark}
      setDark={setDark}
      onLogout={() => {
        setIsAuthenticated(false);
        setCurrentView('landing');
      }}
      userName="Juan Camilo"
      userRole="Administrador"
    >
      <Toaster position="top-right" richColors />

      {/* MÓDULO PRINCIPAL */}
      {currentView === 'dashboard' && <DashboardPage dark={dark} />}

      {/* MÓDULO PRODUCCIÓN */}
      {currentView === 'produccion' && <ProduccionView dark={dark} />}
      {currentView === 'registroDiarioEmpleado' && <RegistroDiarioEmpleadoView dark={dark} />}

      {/* MÓDULO INVENTARIO */}
      {currentView === 'tipoInsumos' && <TipoInsumoView dark={dark} />}
      {currentView === 'insumos' && <InsumosView dark={dark} />}
      {currentView === 'compras' && <ComprasView dark={dark} />}
      {currentView === 'insumosEnviados' && <InsumosEnviadosView dark={dark} />}

      {/* MÓDULO COMERCIAL */}
      {currentView === 'ordenPedido' && <OrdenesPedido dark={dark} />}
      {currentView === 'clientes' && <ClientesView dark={dark} />}
      {currentView === 'registroDiario' && <RegistroDiarioView dark={dark} />}
      {currentView === 'remisiones' && <RemisionesView dark={dark} />}
      {currentView === 'remisionEntrega' && <RemisionEntregaView dark={dark} />}

      {/* MÓDULO CONFIGURACIÓN Y PARÁMETROS */}
      {currentView === 'proveedores' && <Proveedores dark={dark} />}
      {currentView === 'catalogoPiezas' && <TiposPieza dark={dark} />}
      {currentView === 'tiposMaquinaria' && <TiposMaquinaria dark={dark} />}
      {currentView === 'empleados' && <EmpleadosView dark={dark} />}
      {currentView === 'roles' && <Roles dark={dark} />}

      {/* MI PERFIL */}
      {currentView === 'miPerfil' && (
        <MiPerfil 
          dark={dark} 
          currentUser={{ nombre: "Juan Camilo", rol: "Administrador" }} 
        />
      )}
    </MainLayout>
  );
}