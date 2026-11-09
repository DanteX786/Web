import React, { useState } from 'react';
import { Toaster } from 'sonner';
import MainLayout from './shared/components/MainLayout';
import { AuthView } from './features/auth/components/AuthView';
import LandingPage from './shared/components/LandingPage';

// MÓDULO PRODUCCIÓN
import { ProduccionView } from './features/produccion/views/ProduccionView';
import { RegistroDiarioEmpleadoView } from './features/produccion/views/RegistroDiarioEmpleadoView';

// MÓDULO INVENTARIO
import { TipoInsumoView } from './features/compras/views/Tipo_Insumo_view';
import { InsumosView } from './features/compras/views/Insumo_view';
import { ComprasView } from './features/compras/views/Compras_View';
import { InsumosEnviadosView } from './features/compras/views/InsumosEnviadosView';

// MÓDULO COMERCIAL
import OrdenesPedido from './features/ventas/views/producciones';
import { ClientesView } from './features/usuarios/views/ClientesView';
import { RegistroDiarioView } from './features/produccion/views/RegistroDiarioView';
import { RemisionesView } from './features/ventas/views/RemisionesView';
import { RemisionEntregaView } from './features/ventas/views/RemisionEntregaView';

// MÓDULO CONFIGURACIÓN Y PARÁMETROS
import Proveedores from './features/compras/views/Proveedores';
import TiposPieza from './features/parametros/views/TiposPieza';
import TiposMaquinaria from './features/parametros/views/TiposMaquinaria';
import EmpleadosView from './features/usuarios/views/Empleados';
import Roles from './features/configuracion/views/Roles';

// MÓDULO PRINCIPAL Y AUTH
import { DashboardPage } from './features/medicion/views/Dashboard';
import MiPerfil from './features/usuarios/views/MiPerfil';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
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