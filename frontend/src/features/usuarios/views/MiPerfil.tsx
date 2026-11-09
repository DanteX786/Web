import React, { useState } from "react";
import {
  User, Mail, Phone, MapPin, Hash, Shield,
  Lock, Eye, EyeOff, Pencil, Save, X,
  CheckCircle, AlertTriangle, Camera, Key,
  Calendar, Clock
} from "lucide-react";
import { toast, Toaster } from "sonner";

// ==========================================
// CONSTANTES GLOBALES
// ==========================================
const GOLD        = "#C9A227";
const GOLD_LIGHT  = "#E6B84A";
const DANGER      = "#DC3545";
const DANGER_BG   = "#FDECEA";
// const DANGER_TXT  = "#721c24"; // Declarado por si se requiere después
const SUCCESS     = "#28A745";
const SUCCESS_BG  = "#DCF7E6";
// const SUCCESS_TXT = "#155724";
const INFO        = "#4A90E2";
// const INFO_BG     = "#E3F2FD";
// const INFO_TXT    = "#0c3060";

// ==========================================
// INTERFACES
// ==========================================
interface PerfilUsuario {
  nombre: string;
  nit: string;
  correo: string;
  telefono: string;
  direccion: string;
  rol: string;
  estado: "activo" | "inactivo";
  fechaRegistro: string;
  ultimoAcceso: string;
}

const perfilInicial: PerfilUsuario = {
  nombre: "Administrador Principal",
  nit: "10293847-1",
  correo: "admin@eslabon.com",
  telefono: "3001234567",
  direccion: "Cra 45 #12-34, Medellín, Antioquia",
  rol: "Administrador",
  estado: "activo",
  fechaRegistro: "2026-01-15",
  ultimoAcceso: "2026-09-24",
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function MiPerfil({
  dark,
  currentUser,
}: {
  dark: boolean;
  currentUser: { nombre: string; rol: string };
}) {
  // --- TEMA DINÁMICO ---
  const fg           = dark ? "#F8F9FA" : "#121212";
  const subtle       = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg       = dark ? "#1E1E1E" : "#FFFFFF";
  const bg           = dark ? "#121212" : "#F8F9FA";
  const inputBg      = dark ? "#2A2A2A" : "#F3F3F5";
  const surfaceBg    = dark ? "#252525" : "#F8F8F8";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const borderCol    = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  // --- ESTADOS ---
  const [editando, setEditando] = useState(false);
  const [perfil, setPerfil] = useState<PerfilUsuario>(perfilInicial);
  const [formPerfil, setFormPerfil] = useState<PerfilUsuario>(perfilInicial);

  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirm, setShowConfirmPass] = useState(false);
  const [passForm, setPassForm] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  // --- MÉTODOS ---
  function cancelarEdicion() {
    setFormPerfil(perfil);
    setEditando(false);
  }

  function guardarPerfil() {
    if (!formPerfil.nombre.trim() || !formPerfil.correo.trim()) {
      toast.error("Nombre y correo son obligatorios");
      return;
    }
    setPerfil(formPerfil);
    setEditando(false);
    toast.success("Perfil actualizado correctamente");
  }

  function cambiarContrasena() {
    if (!passForm.actual) {
      toast.error("Ingresa tu contraseña actual");
      return;
    }
    if (passForm.nueva.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (passForm.nueva !== passForm.confirmar) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setPassForm({ actual: "", nueva: "", confirmar: "" });
    toast.success("Contraseña actualizada correctamente");
  }

  // --- DATA ---
  const quickData = [
    { icon: <Hash size={14} />, label: "NIT", value: perfil.nit },
    { icon: <Calendar size={14} />, label: "Registro", value: perfil.fechaRegistro },
    { icon: <Clock size={14} />, label: "Último acceso", value: perfil.ultimoAcceso },
  ];

  const requisitos = [
    { texto: "Mínimo 6 caracteres", ok: passForm.nueva.length >= 6 },
    { texto: "Al menos una letra mayúscula", ok: /[A-Z]/.test(passForm.nueva) },
    { texto: "Al menos un número", ok: /[0-9]/.test(passForm.nueva) },
  ];

  const actividades = [
    { accion: "Inicio de sesión", modulo: "Auth", hora: "Hoy, 08:32 am", icon: <CheckCircle size={13} />, color: SUCCESS },
    { accion: "Registro de compra COM-004", modulo: "Compras", hora: "Hoy, 09:15 am", icon: <CheckCircle size={13} />, color: SUCCESS },
    { accion: "Edición de insumo INS-002", modulo: "Insumos", hora: "Hoy, 10:04 am", icon: <Pencil size={13} />, color: INFO },
    { accion: "Eliminación de detalle", modulo: "Producción", hora: "Ayer, 03:45 pm", icon: <AlertTriangle size={13} />, color: DANGER },
    { accion: "Actualización de perfil", modulo: "Mi Perfil", hora: "Ayer, 05:12 pm", icon: <User size={13} />, color: GOLD },
  ];

  // --- RENDERIZADORES REUTILIZABLES ---
  const renderReadField = (label: string, icon: React.ReactNode, valor: string) => (
    <div style={{ background: surfaceBg, borderRadius: 8, padding: "10px 14px" }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.05em", color: subtle, marginBottom: 4
      }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 600, color: fg }}>{valor}</span>
      </div>
    </div>
  );

  const renderEditField = (label: string, campo: keyof PerfilUsuario, type: string = "text") => (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.05em",
        color: subtle, marginBottom: 6
      }}>
        {label}
      </label>
      <input
        type={type}
        value={formPerfil[campo]}
        onChange={(e) => setFormPerfil({ ...formPerfil, [campo]: e.target.value })}
        style={{
          width: "100%", padding: "10px 12px", background: inputBg,
          border: `1px solid ${borderNormal}`, borderRadius: 8,
          fontSize: 14, color: fg, fontFamily: "Montserrat, sans-serif",
          outline: "none", boxSizing: "border-box", transition: "border 0.2s ease"
        }}
        onFocus={(e) => (e.currentTarget.style.border = `1px solid ${GOLD}`)}
        onBlur={(e) => (e.currentTarget.style.border = `1px solid ${borderNormal}`)}
      />
    </div>
  );

  const renderPassField = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    show: boolean,
    toggleShow: () => void
  ) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.05em",
        color: subtle, marginBottom: 6
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: subtle }}>
          <Lock size={15} />
        </div>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", padding: "10px 40px 10px 38px", background: inputBg,
            border: `1px solid ${borderNormal}`, borderRadius: 8,
            fontSize: 14, color: fg, fontFamily: "Montserrat, sans-serif",
            outline: "none", boxSizing: "border-box", transition: "border 0.2s ease"
          }}
          onFocus={(e) => (e.currentTarget.style.border = `1px solid ${GOLD}`)}
          onBlur={(e) => (e.currentTarget.style.border = `1px solid ${borderNormal}`)}
        />
        <button
          onClick={toggleShow}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "transparent", border: "none", color: subtle, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 0
          }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      padding: 24, background: bg, minHeight: "100vh",
      fontFamily: "Montserrat, sans-serif", boxSizing: "border-box"
    }}>
      <Toaster position="top-right" toastOptions={{
        style: {
          fontFamily: "Montserrat, sans-serif",
          fontSize: 13, fontWeight: 600,
          borderRadius: 12,
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        },
        duration: 3200,
      }} richColors />

      {/* GRID PRINCIPAL */}
      <div style={{
        display: "grid", gap: 24,
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        alignItems: "start"
      }}>
        
        {/* ========================================== */}
        {/* COLUMNA IZQUIERDA: AVATAR Y DATOS RÁPIDOS    */}
        {/* ========================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div style={{
            background: cardBg, borderRadius: 16, border: `1px solid ${GOLD}25`,
            padding: "28px 24px", textAlign: "center", position: "relative",
            overflow: "hidden"
          }}>
            {/* Línea decorativa superior */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)`
            }} />

            {/* Avatar */}
            <div style={{
              width: 96, height: 96, borderRadius: "50%",
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", position: "relative",
              boxShadow: `0 0 0 4px ${cardBg}, 0 0 0 6px ${GOLD}40`,
            }}>
              <span style={{
                fontSize: 36, fontWeight: 800, color: "#121212",
                fontFamily: "Montserrat, sans-serif",
              }}>
                {currentUser.nombre.charAt(0).toUpperCase()}
              </span>

              {/* Botón cámara */}
              <button style={{
                position: "absolute", bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: "50%",
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                border: `2px solid ${cardBg}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", padding: 0
              }}>
                <Camera size={13} style={{ color: "#121212" }} />
              </button>
            </div>

            {/* Nombre y rol */}
            <h2 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: "0 0 4px" }}>
              {currentUser.nombre}
            </h2>

            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: GOLD + "1F", color: GOLD,
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.05em", padding: "3px 10px", borderRadius: 999,
            }}>
              <Shield size={10} /> {currentUser.rol}
            </span>

            {/* Badge estado activo */}
            <div style={{ marginTop: 8 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: SUCCESS_BG, color: SUCCESS,
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: SUCCESS, display: "inline-block" }} />
                En línea · Activo
              </span>
            </div>

            {/* Separador */}
            <div style={{ margin: "20px 0", height: 1, background: borderCol }} />

            {/* Datos rápidos */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {quickData.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 0", borderBottom: i !== quickData.length - 1 ? `1px solid ${borderCol}` : "none"
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: GOLD + "15", display: "flex", alignItems: "center", justifyContent: "center", color: GOLD,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtle }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: fg, marginTop: 1, fontFamily: "monospace" }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* COLUMNA DERECHA: INFO, CONTRASEÑA, ACTIVIDAD */}
        {/* ========================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* ----- TARJETA INFORMACIÓN PERSONAL ----- */}
          <div style={{
            background: cardBg, borderRadius: 16, border: `1px solid ${GOLD}25`, padding: 24,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${borderCol}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 4, height: 20, borderRadius: 999, background: GOLD }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: fg, margin: 0 }}>
                  Información Personal
                </h3>
              </div>

              {!editando ? (
                <button onClick={() => setEditando(true)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: GOLD + "15", color: GOLD, border: "none", borderRadius: 8,
                  padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  <Pencil size={13} /> Editar
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={cancelarEdicion} style={{
                    background: "rgba(0,0,0,0.06)", color: subtle, border: "none", borderRadius: 8,
                    padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <X size={13} /> Cancelar
                  </button>
                  <button onClick={guardarPerfil} style={{
                    background: `linear-gradient(135deg, #C9A227, ${GOLD}, ${GOLD_LIGHT})`,
                    color: "#121212", border: "none", borderRadius: 8, padding: "6px 14px",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Save size={13} /> Guardar
                  </button>
                </div>
              )}
            </div>

            <div style={{
              display: "grid", gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
            }}>
              {!editando ? (
                <>
                  {renderReadField("Nombre Completo", <User size={13} color={subtle} />, perfil.nombre)}
                  {renderReadField("NIT", <Hash size={13} color={subtle} />, perfil.nit)}
                  {renderReadField("Correo Electrónico", <Mail size={13} color={subtle} />, perfil.correo)}
                  {renderReadField("Teléfono", <Phone size={13} color={subtle} />, perfil.telefono)}
                  <div style={{ gridColumn: "1 / -1" }}>
                    {renderReadField("Dirección", <MapPin size={13} color={subtle} />, perfil.direccion)}
                  </div>
                </>
              ) : (
                <>
                  {renderEditField("Nombre Completo", "nombre")}
                  {renderEditField("NIT", "nit")}
                  {renderEditField("Correo Electrónico", "correo", "email")}
                  {renderEditField("Teléfono", "telefono", "tel")}
                  <div style={{ gridColumn: "1 / -1" }}>
                    {renderEditField("Dirección", "direccion")}
                  </div>
                </>
              )}
              
              {/* ROL Y ESTADO SIEMPRE SOLO LECTURA */}
              <div style={{ background: surfaceBg, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtle, marginBottom: 4 }}>
                  Rol de Sistema
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4, background: GOLD + "1F", color: GOLD,
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em"
                }}>
                  <Shield size={10} /> {perfil.rol}
                </span>
              </div>
              <div style={{ background: surfaceBg, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtle, marginBottom: 4 }}>
                  Estado de Cuenta
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4, background: SUCCESS_BG, color: SUCCESS,
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999
                }}>
                  ● Activo
                </span>
              </div>
            </div>
          </div>

          {/* ----- TARJETA CAMBIAR CONTRASEÑA ----- */}
          <div style={{
            background: cardBg, borderRadius: 16, border: `1px solid ${GOLD}25`, padding: 24,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${borderCol}`
            }}>
              <div style={{ width: 4, height: 20, borderRadius: 999, background: GOLD }} />
              <Key size={15} color={GOLD} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: fg, margin: 0 }}>
                Seguridad
              </h3>
            </div>

            {renderPassField("Contraseña Actual", passForm.actual, (val) => setPassForm({ ...passForm, actual: val }), showActual, () => setShowActual(!showActual))}
            {renderPassField("Nueva Contraseña", passForm.nueva, (val) => setPassForm({ ...passForm, nueva: val }), showNueva, () => setShowNueva(!showNueva))}
            
            {/* Panel de requisitos */}
            <div style={{ background: surfaceBg, borderRadius: 8, padding: "10px 14px", marginTop: 8, marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {requisitos.map((req, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600 }}>
                  {req.ok ? (
                    <CheckCircle size={12} style={{ color: SUCCESS }} />
                  ) : (
                    <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${borderNormal}`, boxSizing: "border-box" }} />
                  )}
                  <span style={{ color: req.ok ? SUCCESS : subtle }}>{req.texto}</span>
                </div>
              ))}
            </div>

            {renderPassField("Confirmar Nueva Contraseña", passForm.confirmar, (val) => setPassForm({ ...passForm, confirmar: val }), showConfirm, () => setShowConfirmPass(!showConfirm))}

            <button onClick={cambiarContrasena} style={{
              width: "100%", marginTop: 16, padding: "12px", border: "none", borderRadius: 8,
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: "#121212",
              fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, fontFamily: "Montserrat, sans-serif"
            }}>
              <Key size={14} /> Actualizar Contraseña
            </button>
          </div>

          {/* ----- TARJETA ACTIVIDAD RECIENTE ----- */}
          <div style={{
            background: cardBg, borderRadius: 16, border: `1px solid ${GOLD}25`, padding: 24,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              marginBottom: 12, paddingBottom: 16, borderBottom: `1px solid ${borderCol}`
            }}>
              <div style={{ width: 4, height: 20, borderRadius: 999, background: GOLD }} />
              <Clock size={15} color={INFO} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: fg, margin: 0 }}>
                Actividad Reciente
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {actividades.map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                  borderBottom: i !== actividades.length - 1 ? `1px solid ${borderCol}` : "none"
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: item.color + "15", display: "flex", alignItems: "center",
                    justifyContent: "center", color: item.color
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: fg }}>{item.accion}</div>
                    <div style={{ fontSize: 11, color: subtle, marginTop: 2 }}>{item.modulo}</div>
                  </div>
                  <span style={{ fontSize: 11, color: subtle, whiteSpace: "nowrap" }}>
                    {item.hora}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}