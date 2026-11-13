import React, { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import MainLayout from './shared/components/MainLayout';
import { AuthView } from './features/auth/components/AuthView';
import LandingPage from './shared/components/LandingPage';
import { EVENTO_SESION_CERRADA } from './shared/utils/api';
import { EVENTO_USUARIO_ACTUALIZADO, cerrarSesionLocal, obtenerUsuario, vigilarSesion, vistaInicial, type Usuario } from './features/auth/services/authService';
import { puedeVer } from './features/auth/utils/permisos';

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
import { SeguimientoRemisionView } from './features/produccion/views/SeguimientoRemisionView';
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
  // La sesión se recupera del navegador: al recargar la página no se pierde.
  const [usuario, setUsuario] = useState<Usuario | null>(() => obtenerUsuario());
  const isAuthenticated = usuario !== null;
  const [currentView, setCurrentView] = useState<string>(() => {
    const u = obtenerUsuario();
    return u ? vistaInicial(u) : 'landing';
  });
  const [dark, setDark] = useState<boolean>(false);
  const [mensajeLogin, setMensajeLogin] = useState<string>('');

  // Si la sesión termina (token vencido o contraseña cambiada en cualquier dispositivo),
  // se sale del aplicativo de inmediato y se muestra el motivo en el inicio de sesión.
  useEffect(() => {
    const alCerrarse = (e: Event) => {
      setUsuario(null);
      setMensajeLogin((e as CustomEvent<string>).detail || '');
      setCurrentView('login');
    };
    window.addEventListener(EVENTO_SESION_CERRADA, alCerrarse);
    return () => window.removeEventListener(EVENTO_SESION_CERRADA, alCerrarse);
  }, []);

  // Mientras haya sesión, se verifica cada 15 s y al volver a la pestaña (PBI-21)
  useEffect(() => (isAuthenticated ? vigilarSesion() : undefined), [isAuthenticated]);

  // Si el administrador cambia los permisos del rol, se actualizan el usuario y el menú
  useEffect(() => {
    const alActualizar = (e: Event) => setUsuario((e as CustomEvent<Usuario>).detail);
    window.addEventListener(EVENTO_USUARIO_ACTUALIZADO, alActualizar);
    return () => window.removeEventListener(EVENTO_USUARIO_ACTUALIZADO, alActualizar);
  }, []);

  // Nadie puede quedarse en una vista para la que no tiene permiso
  const vistaPermitida = !usuario || ['landing', 'login'].includes(currentView) || puedeVer(usuario, currentView);
  useEffect(() => {
    if (usuario && !vistaPermitida) setCurrentView(vistaInicial(usuario));
  }, [usuario, vistaPermitida]);

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
          key={mensajeLogin}
          mensajeInicial={mensajeLogin}
          onLoginSuccess={(u) => {
            setUsuario(u);
            setMensajeLogin('');
            setCurrentView(vistaInicial(u));
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
        cerrarSesionLocal();
        setUsuario(null);
        setMensajeLogin('');
        setCurrentView('landing');
      }}
      userName={usuario?.nombre ?? ''}
      userRole={usuario?.rol ?? usuario?.tipo ?? ''}
      puedeVer={(vista) => puedeVer(usuario, vista)}
    >
      <Toaster position="top-right" richColors />

      {vistaPermitida && (<>
      {/* MÓDULO PRINCIPAL */}
      {currentView === 'dashboard' && <DashboardPage dark={dark} onNavegar={setCurrentView} />}

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
      {currentView === 'seguimientoRemision' && <SeguimientoRemisionView dark={dark} />}
      {currentView === 'remisionEntrega' && <RemisionEntregaView dark={dark} />}

      {/* MÓDULO CONFIGURACIÓN Y PARÁMETROS */}
      {currentView === 'proveedores' && <Proveedores dark={dark} />}
      {currentView === 'catalogoPiezas' && <TiposPieza dark={dark} />}
      {currentView === 'tiposMaquinaria' && <TiposMaquinaria dark={dark} />}
      {currentView === 'empleados' && <EmpleadosView dark={dark} />}
      {currentView === 'roles' && <Roles dark={dark} />}

      {/* MI PERFIL */}
      {currentView === 'miPerfil' && (
        <MiPerfil dark={dark} />
      )}
      </>)}
    </MainLayout>
  );
}