import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Tag, Package, ShoppingCart,
  Factory, Scissors, Wrench, TrendingUp, Users,
  FileText, ClipboardList, ShoppingBag, BarChart2,
  SlidersHorizontal, Shield, Key, Truck, Send,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Sun, Moon, Bell, Search, Menu, LogOut,
  User, Sliders
} from "lucide-react";

// Importamos los logos subiendo un nivel desde 'components' hacia 'assets'
import logoBlanco from '../assets/logo blanco.jpg';
import logoNegro from '../assets/logo negro.jpg';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
  onLogout?: () => void;
  userName?: string;
  userRole?: string;
}

export default function MainLayout({
  children,
  currentView,
  setCurrentView,
  dark,
  setDark,
  onLogout,
  userName = "Juan Valle",
  userRole = "Administrador"
}: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Grupos colapsables del sidebar
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    inventario: true,
    produccion: false,
    parametros: false,
    comercial: false,
    configuracion: false
  });

  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [tooltipY, setTooltipY] = useState<number>(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const GOLD = "#C9A227";
  const GOLD_LIGHT = "#E6B84A";
  const DANGER = "#DC3545";
  const SUCCESS = "#28A745";
  const INFO = "#4A90E2";

  const sidebarBg = dark ? "#1A1A1A" : "#FFFFFF";
  const headerBg = dark ? "rgba(18,18,18,0.85)" : "rgba(255,255,255,0.85)";
  const borderCol = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const renderNavBtn = (id: string, label: string, Icon: any, isSub = false) => {
    const isActive = currentView === id;
    return (
      <button
        key={id}
        onClick={() => {
          setCurrentView(id);
          setMobileOpen(false);
        }}
        onMouseEnter={(e) => {
          if (collapsed) {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipText(label);
            setTooltipY(rect.top + rect.height / 2);
          }
        }}
        onMouseLeave={() => setTooltipText(null)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: isActive ? '10px 12px 10px 9px' : '10px 12px',
          paddingLeft: isSub ? (collapsed ? 12 : 36) : (isActive ? 9 : 12),
          borderRadius: 10,
          background: isActive ? `linear-gradient(135deg, ${GOLD}20, ${GOLD}12)` : 'transparent',
          border: 'none',
          borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
          cursor: 'pointer',
          color: isActive ? fg : subtle,
          fontWeight: isActive ? 700 : 600,
          fontSize: 13,
          fontFamily: 'Montserrat, sans-serif',
          textAlign: 'left',
          transition: 'background 0.15s ease, color 0.15s ease',
          position: 'relative'
        }}
      >
        <Icon size={16} color={isActive ? GOLD : subtle} style={{ flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </span>
        )}
      </button>
    );
  };

  const renderAccordionGroup = (groupKey: string, groupLabel: string, ParentIcon: any, items: { id: string, label: string, icon: any }[]) => {
    const isOpen = openGroups[groupKey];
    const isChildActive = items.some(i => i.id === currentView);

    return (
      <div key={groupKey} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!collapsed && (
          <div style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: `${GOLD}80`, paddingLeft: 12, marginTop: 8, marginBottom: 4
          }}>
            {groupKey === 'inventario' ? 'Inventario' : groupKey === 'produccion' ? 'Producción' : groupKey === 'parametros' ? 'Configuración' : groupKey === 'comercial' ? 'Comercial' : 'Sistema'}
          </div>
        )}
        
        <button
          onClick={() => toggleGroup(groupKey)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 10, background: isChildActive ? `${GOLD}0D` : 'transparent',
            border: 'none', cursor: 'pointer', color: isChildActive ? fg : subtle,
            fontWeight: 600, fontSize: 13, fontFamily: 'Montserrat, sans-serif'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ParentIcon size={16} color={isChildActive ? GOLD : subtle} style={{ flexShrink: 0 }} />
            {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{groupLabel}</span>}
          </div>
          {!collapsed && (
            isOpen ? <ChevronUp size={14} color={subtle} /> : <ChevronDown size={14} color={subtle} />
          )}
        </button>

        {isOpen && !collapsed && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            marginLeft: 18, paddingLeft: 12, borderLeft: `2px solid ${GOLD}30`
          }}>
            {items.map(sub => renderNavBtn(sub.id, sub.label, sub.icon, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: dark ? '#121212' : '#F8F9FA', fontFamily: 'Montserrat, sans-serif', overflowX: 'hidden' }}>
      
      {/* 1. SIDEBAR */}
      <aside style={{
        width: collapsed ? 72 : 256,
        background: sidebarBg,
        borderRight: `1px solid ${borderCol}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 50,
        transition: 'width 0.25s ease',
        boxShadow: mobileOpen ? '5px 0 25px rgba(0,0,0,0.3)' : 'none'
      }}>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', right: -12, top: 28, width: 24, height: 24,
            borderRadius: '50%', background: cardBg, border: `1px solid ${borderCol}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', zIndex: 60, color: subtle
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* LOGO SECTION - Altura ampliada para hacer el logo más grande */}
        <div style={{ padding: '16px 8px', borderBottom: `1px solid ${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 85 }}>
          {collapsed ? (
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: `${GOLD}15`,
              color: GOLD, fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              E
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {dark ? (
                // Logo para Modo Dark (más grande)
                <img 
                  src={logoNegro} 
                  alt="Stitcher Taller CDS" 
                  style={{ width: '100%', maxHeight: 65, objectFit: 'contain' }} 
                />
              ) : (
                // Logo para Modo Light (más grande)
                <img 
                  src={logoBlanco} 
                  alt="Stitcher Taller CDS" 
                  style={{ width: '100%', maxHeight: 65, objectFit: 'contain' }} 
                />
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          
          {/* Grupo PRINCIPAL */}
          {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: `${GOLD}80`, paddingLeft: 12, marginTop: 4, marginBottom: 4 }}>Principal</div>}
          {renderNavBtn("dashboard", "Dashboard", LayoutDashboard)}

          {/* Grupo INVENTARIO */}
          {renderAccordionGroup("inventario", "Inventario", Package, [
            { id: "tipoInsumos", label: "Tipo de Insumo", icon: Tag },
            { id: "insumos", label: "Insumos", icon: Package },
            { id: "compras", label: "Compras", icon: ShoppingCart },
          ])}

          {/* Grupo PRODUCCIÓN */}
          {renderAccordionGroup("produccion", "Producción", Factory, [
            { id: "produccion", label: "Gestión Producción", icon: Factory },
          ])}

          {/* Grupo ADM. DE PARÁMETROS */}
          {renderAccordionGroup("parametros", "Adm. de Parámetros", Sliders, [
            { id: "catalogoPiezas", label: "Tipo de Pieza", icon: Scissors },
            { id: "tiposMaquinaria", label: "Tipo de Máquina", icon: Wrench },
          ])}

          {/* Grupo COMERCIAL */}
          {renderAccordionGroup("comercial", "Comercial", TrendingUp, [
            { id: "clientes", label: "Clientes", icon: Users },
            { id: "remisiones", label: "Remisiones", icon: FileText },
            { id: "registroDiario", label: "Registro Diario", icon: ClipboardList },
            { id: "ordenPedido", label: "Orden de Pedido", icon: ShoppingBag },
            { id: "ventas", label: "Ventas", icon: BarChart2 },
          ])}

          {/* Grupo CONFIGURACIÓN */}
          {renderAccordionGroup("configuracion", "Configuración", SlidersHorizontal, [
            { id: "permisos", label: "Permisos", icon: Shield },
            { id: "roles", label: "Roles", icon: Key },
            { id: "empleados", label: "Empleados", icon: Users },
            { id: "proveedores", label: "Proveedores", icon: Truck },
            { id: "envios", label: "Envíos", icon: Send },
          ])}

          <div style={{ borderTop: `1px solid ${GOLD}30`, marginTop: 8, paddingTop: 8 }}>
            {renderNavBtn("documentacion", "Documentación", FileText)}
          </div>
        </div>

        {/* Perfil inferior */}
        <div 
          onClick={() => setProfileOpen(!profileOpen)}
          style={{
            marginTop: 'auto', borderTop: `1px solid ${borderCol}`, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            background: profileOpen ? `${GOLD}08` : 'transparent', transition: 'background 0.2s'
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
            color: '#FFFFFF', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {userName.charAt(0)}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: GOLD, fontWeight: 600 }}>
                {userRole}
              </div>
            </div>
          )}
          {!collapsed && <ChevronDown size={14} color={subtle} />}
        </div>

      </aside>

      {/* 2. CONTENEDOR DERECHO */}
      <div style={{
        flex: 1,
        marginLeft: collapsed ? 72 : 256,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.25s ease'
      }}>
        
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: headerBg, backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${borderCol}`, height: 56, padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: fg, textTransform: 'capitalize' }}>
              {currentView.replace(/([A-Z])/g, ' $1')}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar en el sistema…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: 320, padding: '8px 12px 8px 36px', borderRadius: 10, fontSize: 13,
                backgroundColor: inputBg, color: fg, border: `1px solid ${borderCol}`, outline: 'none', fontFamily: 'Montserrat, sans-serif'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setDark(!dark)}
              style={{
                width: 36, height: 36, borderRadius: '50%', background: surfaceBg,
                border: `1px solid ${borderCol}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              {dark ? <Sun size={16} color={GOLD} /> : <Moon size={16} color={subtle} />}
            </button>

            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: surfaceBg,
                  border: `1px solid ${borderCol}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative'
                }}
              >
                <Bell size={16} color={subtle} />
                <span style={{
                  position: 'absolute', top: 2, right: 2, width: 16, height: 16,
                  borderRadius: '50%', background: DANGER, color: '#FFFFFF',
                  fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  3
                </span>
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 48, right: 0, width: 320,
                  background: cardBg, border: `1px solid ${GOLD}30`, borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden'
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${borderCol}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: fg }}>Notificaciones</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, background: `${GOLD}15`, padding: '2px 8px', borderRadius: 99 }}>3 nuevas</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {[
                      { title: 'Nueva orden asignada', sub: 'Se creó la orden ORD-005', time: 'Hace 5m', type: INFO },
                      { title: 'Insumo con stock bajo', sub: 'Hilo blanco por debajo del mínimo', time: 'Hace 1h', type: DANGER },
                      { title: 'Producción finalizada', sub: 'Lote de camisas completado con éxito', time: 'Hace 3h', type: SUCCESS },
                    ].map((n, i) => (
                      <div key={i} style={{ padding: '12px 16px', borderBottom: i < 2 ? `1px solid ${borderCol}` : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${n.type}15`, color: n.type, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, fontSize: 12 }}>●</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: subtle, marginTop: 2 }}>{n.sub}</div>
                        </div>
                        <span style={{ fontSize: 10, color: subtle }}>{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} ref={profileRef}>
              <div
                onClick={() => setProfileOpen(!profileOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                  color: '#FFFFFF', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {userName.charAt(0)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>{userName}</span>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>{userRole}</span>
                </div>
                <ChevronDown size={14} color={subtle} />
              </div>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 48, right: 0, width: 240,
                  background: cardBg, border: `1px solid ${GOLD}30`, borderRadius: 14,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden'
                }}>
                  <div style={{ padding: 16, borderBottom: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                        color: '#FFFFFF', fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {userName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: fg }}>{userName}</div>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', color: GOLD, fontWeight: 600 }}>{userRole}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: `1px solid ${borderCol}`, padding: 8 }}>
                    <button
                      onClick={onLogout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 8,
                        color: DANGER, fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left'
                      }}
                    >
                      <LogOut size={15} color={DANGER} /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {children}
        </main>

      </div>

      {tooltipText && collapsed && (
        <div style={{
          position: 'fixed', left: 82, top: tooltipY, transform: 'translateY(-50%)',
          background: cardBg, border: `1px solid ${GOLD}30`, borderRadius: 8,
          padding: '4px 10px', fontSize: 11, fontWeight: 600, color: fg,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, whiteSpace: 'nowrap'
        }}>
          {tooltipText}
        </div>
      )}

    </div>
  );
}