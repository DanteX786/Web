import React, { useState } from 'react';
import { 
  Mail, Lock, User, Hash, MapPin, Phone, 
  UserPlus, KeyRound, ArrowLeft, CheckCircle, 
  AlertTriangle, Eye, EyeOff, LogOut, Sun, Moon 
} from 'lucide-react';
import { toast } from 'sonner';

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const DANGER = "#DC3545";
const SUCCESS = "#28A745";

interface AuthViewProps {
  onLoginSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'register' | 'recover'>('login');
  
  // Estado para controlar el Modo Oscuro / Claro
  const [isDark, setIsDark] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados de registro
  const [regName, setRegName] = useState('');
  const [regNit, setRegNit] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Estados de recuperación
  const [recoverSent, setRecoverSent] = useState(false);

  // Colores dinámicos basados en el estado isDark
  const bg = isDark ? "#121212" : "#F8F9FA";
  const cardBg = isDark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = isDark ? "#2A2A2A" : "#F3F3F5";
  const fg = isDark ? "#F8F9FA" : "#121212";
  const subtle = isDark ? "#9A9A9A" : "#6B6B6B";
  const borderNormal = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor complete todos los campos');
      return;
    }
    setErrorMsg('');
    toast.success('¡Bienvenido al sistema!');
    onLoginSuccess();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !email || !password || !regConfirmPass || !regNit) {
      toast.error('Complete los campos obligatorios');
      return;
    }
    if (password !== regConfirmPass) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setRegisterSuccess(true);
    toast.success('Cuenta creada con éxito');
    setTimeout(() => {
      setRegisterSuccess(false);
      setView('login');
    }, 2200);
  };

  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Ingrese su correo electrónico');
      return;
    }
    setRecoverSent(true);
    toast.success('Instrucciones enviadas al correo');
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden', fontFamily: 'Montserrat, sans-serif',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT})` }} />

      {/* BOTÓN FLOTANTE PARA CAMBIAR MODO OSCURO / CLARO */}
      <button 
        onClick={() => setIsDark(!isDark)}
        style={{
          position: 'absolute', top: 20, right: 20, background: cardBg, border: `1px solid ${borderNormal}`,
          borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10
        }}
        title="Cambiar Modo"
      >
        {isDark ? <Sun size={18} color={GOLD} /> : <Moon size={18} color="#333" />}
      </button>

      <div style={{ width: '100%', maxWidth: 480 }}>
        
        {/* LOGO SUPERIOR DINÁMICO (USA LA CARPETA PUBLIC) */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img 
            src={isDark ? "/logo negro.jpg" : "/logo blanco.jpg"} 
            alt="Logo Stitcher" 
            style={{ height: 100, width: 'auto', display: 'inline-block', objectFit: 'contain' }} 
          />
          <div style={{ fontSize: 11, fontWeight: 700, color: subtle, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 10 }}>
            Sistema de Gestión — Stitcher
          </div>
        </div>

        {/* CARD PRINCIPAL */}
        <div style={{
          background: cardBg, borderRadius: 16, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(201,162,39,0.25)'}`,
          boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden', position: 'relative',
          transition: 'background-color 0.3s ease, border-color 0.3s ease'
        }}>
          <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />

          {/* VISTA A: INICIAR SESIÓN */}
          {view === 'login' && (
            <div style={{ padding: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: fg, margin: '0 0 4px' }}>Iniciar Sesión</h1>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 24px' }}>Accede con tus credenciales</p>

              {errorMsg && (
                <div style={{ background: `${DANGER}15`, border: `1px solid ${DANGER}30`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <AlertTriangle size={14} color={DANGER} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: DANGER }}>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: subtle, display: 'block', marginBottom: 6 }}>Correo electrónico</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={15} color={subtle} style={{ position: 'absolute', left: 12 }} />
                    <input 
                      type="email" 
                      placeholder="admin@stitcher.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 14, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: subtle, display: 'block', marginBottom: 6 }}>Contraseña</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={15} color={subtle} style={{ position: 'absolute', left: 12 }} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 38px 10px 38px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 14, outline: 'none' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showPassword ? <EyeOff size={15} color={subtle} /> : <Eye size={15} color={subtle} />}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button type="button" onClick={() => setView('recover')} style={{ background: 'none', border: 'none', color: GOLD, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button 
                  type="submit"
                  style={{
                    width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <LogOut size={15} style={{ transform: 'rotate(180deg)' }} />
                  Iniciar Sesión
                </button>
              </form>

              <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: subtle }}>
                ¿No tienes cuenta?{' '}
                <button onClick={() => setView('register')} style={{ background: 'none', border: 'none', color: GOLD, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                  Registrarse
                </button>
              </div>

              <div style={{ marginTop: 20, background: isDark ? 'rgba(201,162,39,0.08)' : '#C9A22708', border: `1px dashed ${GOLD}40`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', marginBottom: 4 }}>Acceso demo</div>
                <div style={{ fontSize: 12, color: subtle }}>admin@stitcher.com / Admin123</div>
              </div>
            </div>
          )}

          {/* VISTA B: REGISTRARSE */}
          {view === 'register' && (
            <div style={{ padding: 28 }}>
              <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: subtle, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14, padding: 0 }}>
                <ArrowLeft size={13} /> Volver al inicio de sesión
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <UserPlus size={18} color={GOLD} />
                <h1 style={{ fontSize: 22, fontWeight: 800, color: fg, margin: 0 }}>Crear cuenta</h1>
              </div>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 18px' }}>Ingresa los datos de tu empresa y usuario</p>

              {registerSuccess ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <CheckCircle size={40} color={SUCCESS} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: fg, marginBottom: 6 }}>¡Cuenta creada con éxito!</div>
                  <div style={{ fontSize: 13, color: subtle }}>Redirigiendo al inicio de sesión...</div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 4 }}>NIT de Empresa *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Hash size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="text" placeholder="900123456" value={regNit} onChange={(e) => setRegNit(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 4 }}>Nombre Completo *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <User size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="text" placeholder="Juan Pérez" value={regName} onChange={(e) => setRegName(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 4 }}>Dirección *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <MapPin size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="text" placeholder="Calle 50 # 45-67" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 4 }}>Correo Electrónico *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 4 }}>Teléfono *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Phone size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="text" placeholder="3001234567" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 4 }}>Contraseña *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 1' }}>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 4 }}>Confirmar Contraseña *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="password" placeholder="••••••••" value={regConfirmPass} onChange={(e) => setRegConfirmPass(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 13, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ gridColumn: 'span 2', marginTop: 10 }}>
                    <button type="submit" style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <UserPlus size={15} /> Crear cuenta
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* VISTA C: RECUPERAR CONTRASEÑA */}
          {view === 'recover' && (
            <div style={{ padding: 32 }}>
              <button onClick={() => setView('login')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: subtle, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
                <ArrowLeft size={13} /> Volver al inicio de sesión
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <KeyRound size={18} color={GOLD} />
                <h1 style={{ fontSize: 24, fontWeight: 800, color: fg, margin: 0 }}>Recuperar Contraseña</h1>
              </div>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 24px' }}>Te enviaremos las instrucciones de recuperación</p>

              {recoverSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${SUCCESS}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle size={28} color={SUCCESS} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: fg, marginBottom: 6 }}>¡Correo enviado!</div>
                  <div style={{ fontSize: 13, color: subtle, marginBottom: 24 }}>Revisa tu bandeja de entrada para continuar...</div>
                  <button onClick={() => { setRecoverSent(false); setView('login'); }} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: isDark ? '#2A2A2A' : '#e0e0e0', color: fg, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    Volver al inicio de sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecoverSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: subtle, display: 'block', marginBottom: 6 }}>Correo electrónico</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={15} color={subtle} style={{ position: 'absolute', left: 12 }} />
                      <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontSize: 14, outline: 'none' }} />
                    </div>
                  </div>

                  <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Mail size={15} /> Enviar instrucciones
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};