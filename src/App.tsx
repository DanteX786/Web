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

// IMPORTACIÓN DE MÓDULOS DE COMERCIAL
import { ClientesView } from './modules/comercial/ClientesView';
import { RegistroDiarioView } from './modules/comercial/RegistroDiarioView';
import { RemisionesView } from './modules/comercial/RemisionesView';

// Empleados
import EmpleadosView from './modules/configuracion/Empleados';

// Roles
import Roles from './modules/configuracion/Roles';

// Ventas
import Ventas from './modules/comercial/Ventas';


// IMPORTACIÓN DE MI PERFIL
// Ajusta la ruta dependiendo de dónde guardaste exactamente el archivo MiPerfil.tsx
import MiPerfil from './modules/auth/components/MiPerfil';

import { DashboardPage } from './modules/principal/Dashboard';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<string>('remisiones');
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
      userName="Juan Camilo"
      userRole="Administrador"
    >
      <Toaster position="top-right" richColors />
      
      {/* MÓDULO PRODUCCIÓN */}
      {currentView === 'produccion' && <ProduccionView dark={dark} />}

      {/* MÓDULO INVENTARIO */}
      {currentView === 'tipoInsumos' && <TipoInsumoView dark={dark} />}
      {currentView === 'insumos' && <InsumosView dark={dark} />}
      {currentView === 'compras' && <ComprasView dark={dark} />}
      {currentView === 'insumosEnviados' && <InsumosEnviados dark={dark} />}

      {/* MÓDULO COMERCIAL */}
      {currentView === 'ordenPedido' && <OrdenesPedido dark={dark} />}
      {currentView === 'clientes' && <ClientesView dark={dark} />}
      {currentView === 'registroDiario' && <RegistroDiarioView dark={dark} />}
      {currentView === 'remisiones' && <RemisionesView dark={dark} />}
      {currentView === 'ventas' && <Ventas dark={dark} />}

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

      {currentView === 'dashboard' && (
        <div style={{ padding: 24, color: dark ? '#F8F9FA' : '#121212', fontSize: 24, fontWeight: 800 }}>
          Dashboard Principal de Eslabón
        </div>
      )}
=========
      {currentView === 'ventas' && <Ventas dark={dark} />}
      {currentView === 'dashboard' && <DashboardPage dark={dark} />}
    </MainLayout>
  );
}