import React, { useEffect, useState } from 'react';
import {
  Mail, Lock, User, Hash, MapPin, Phone,
  UserPlus, KeyRound, ArrowLeft, CheckCircle,
  AlertTriangle, Eye, EyeOff, LogOut, Sun, Moon, Info, ShieldCheck, RotateCw, Timer
} from 'lucide-react';
import { toast } from 'sonner';

import logo_blanco from '../../../../public/images/logo blanco.png';
import logo_negro from '../../../../public/images/logo negro.png';

import {
  authService, guardarSesion,
  type Usuario, type TipoDocumento, type TipoTelefono,
} from '../services/authService';
import {
  REGLAS_CONTRASENA, soloDigitos, validarConfirmacion, validarContrasenaNueva, validarCorreo,
  validarDireccion, validarDocumento, validarNombre, validarTelefono,
} from '../utils/validaciones';
import { mensajeError } from '../../../shared/utils/api';

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const DANGER = "#DC3545";
const SUCCESS = "#28A745";
const INFO = "#4A90E2";
const FONT = 'Montserrat, sans-serif';

interface AuthViewProps {
  onLoginSuccess: (usuario: Usuario) => void;
  /** Mensaje al llegar (ej. "Tu sesión se cerró porque la contraseña cambió"). */
  mensajeInicial?: string;
}

type Vista = 'login' | 'register' | 'recover';
type PasoRecuperar = 'correo' | 'codigo' | 'nueva';
type CampoRegistro = 'documento' | 'nombre' | 'correo' | 'telefono' | 'direccion' | 'contrasena' | 'confirmar';

const mmss = (seg: number) => `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess, mensajeInicial }) => {
  const [view, setView] = useState<Vista>('login');
  const [isDark, setIsDark] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState(mensajeInicial ?? '');

  // ---------- Login ----------
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [erroresLogin, setErroresLogin] = useState<{ correo?: string | null; contrasena?: string | null }>({});
  const [bloqMayus, setBloqMayus] = useState(false);

  // ---------- Registro ----------
  const [regTipoDoc, setRegTipoDoc] = useState<TipoDocumento>('NIT');
  const [regDoc, setRegDoc] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regTipoTel, setRegTipoTel] = useState<TipoTelefono>('Empresarial');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [erroresReg, setErroresReg] = useState<Partial<Record<CampoRegistro, string | null>>>({});
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // ---------- Recuperación ----------
  const [paso, setPaso] = useState<PasoRecuperar>('correo');
  const [recEmail, setRecEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tokenRestablecer, setTokenRestablecer] = useState('');
  const [segReenvio, setSegReenvio] = useState(0);
  const [venceEn, setVenceEn] = useState(0);
  const [nueva, setNueva] = useState('');
  const [confirmarNueva, setConfirmarNueva] = useState('');
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmarNueva, setShowConfirmarNueva] = useState(false);
  const [errorRec, setErrorRec] = useState('');

  // Cuentas regresivas: reenviar (15 s) y vigencia del código (5 min)
  useEffect(() => {
    if (view !== 'recover' || paso !== 'codigo') return;
    const t = window.setInterval(() => {
      setSegReenvio((s) => (s > 0 ? s - 1 : 0));
      setVenceEn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [view, paso]);

  // ---------- Colores ----------
  const bg = isDark ? "#121212" : "#F8F9FA";
  const cardBg = isDark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = isDark ? "#2A2A2A" : "#F3F3F5";
  const fg = isDark ? "#F8F9FA" : "#121212";
  const subtle = isDark ? "#9A9A9A" : "#6B6B6B";
  const borderNormal = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const irA = (v: Vista) => {
    setView(v);
    setErrorMsg('');
    setErrorRec('');
    if (v === 'recover') { setPaso('correo'); setCodigo(''); setRecEmail(email); }
  };

  // ==========================================
  // COMPONENTES DE FORMULARIO
  // ==========================================
  const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: subtle, display: 'block', marginBottom: 4 };
  const inputStyle = (error?: string | null, conIcono = true, derecha = false): React.CSSProperties => ({
    width: '100%', padding: `9px ${derecha ? 36 : 10}px 9px ${conIcono ? 32 : 10}px`, borderRadius: 8,
    border: `1px solid ${error ? DANGER : borderNormal}`, background: inputBg, color: fg, fontSize: 13, outline: 'none',
    boxSizing: 'border-box', fontFamily: FONT,
  });
  const ErrorTxt = ({ msg }: { msg?: string | null }) =>
    msg ? <div style={{ color: DANGER, fontSize: 11, fontWeight: 600, marginTop: 4 }}>{msg}</div> : null;

  const Banner = ({ tipo, texto }: { tipo: 'error' | 'info' | 'success'; texto: string }) => {
    const color = tipo === 'error' ? DANGER : tipo === 'success' ? SUCCESS : INFO;
    const Icono = tipo === 'error' ? AlertTriangle : tipo === 'success' ? CheckCircle : Info;
    return (
      <div style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
        <Icono size={14} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color }}>{texto}</span>
      </div>
    );
  };

  const BotonOjo = ({ visible, onClick }: { visible: boolean; onClick: () => void }) => (
    <button type="button" onClick={onClick} title={visible ? 'Ocultar contraseña' : 'Ver contraseña'} aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
      style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 2 }}>
      {visible ? <EyeOff size={15} color={subtle} /> : <Eye size={15} color={subtle} />}
    </button>
  );

  const Reglas = ({ valor }: { valor: string }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px', marginTop: 6 }}>
      {REGLAS_CONTRASENA.map((r) => {
        const ok = r.cumple(valor);
        return (
          <div key={r.texto} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: ok ? SUCCESS : subtle, fontWeight: ok ? 700 : 500 }}>
            <CheckCircle size={11} color={ok ? SUCCESS : subtle} style={{ opacity: ok ? 1 : 0.4 }} /> {r.texto}
          </div>
        );
      })}
    </div>
  );

  const BotonPrincipal = ({ children, deshabilitado }: { children: React.ReactNode; deshabilitado?: boolean }) => (
    <button type="submit" disabled={cargando || deshabilitado} style={{
      width: '100%', padding: 12, borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
      color: '#121212', fontWeight: 700, fontSize: 14, cursor: cargando || deshabilitado ? 'not-allowed' : 'pointer',
      opacity: cargando || deshabilitado ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONT,
    }}>
      {cargando ? 'Procesando...' : children}
    </button>
  );

  const Volver = () => (
    <button type="button" onClick={() => irA('login')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 6, color: subtle, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14, padding: 0, fontFamily: FONT }}>
      <ArrowLeft size={13} /> Volver al inicio de sesión
    </button>
  );

  // ==========================================
  // LOGIN (PBI-13)
  // ==========================================
  const validarLogin = () => {
    const errs = { correo: validarCorreo(email), contrasena: password ? null : 'Ingresa tu contraseña.' };
    setErroresLogin(errs);
    return !errs.correo && !errs.contrasena;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAviso('');
    if (!validarLogin()) return;
    setCargando(true);
    setErrorMsg('');
    try {
      const sesion = await authService.login(email.trim().toLowerCase(), password);
      guardarSesion(sesion);
      toast.success(`¡Bienvenido, ${sesion.usuario.nombre}!`);
      onLoginSuccess(sesion.usuario);
    } catch (err) {
      setErrorMsg(mensajeError(err));
      setPassword('');
    } finally {
      setCargando(false);
    }
  };

  // ==========================================
  // REGISTRO DE CLIENTES (PBI-14, 15, 16, 17)
  // ==========================================
  const validarCampoReg = (campo: CampoRegistro): string | null => {
    switch (campo) {
      case 'documento': return validarDocumento(regTipoDoc, regDoc);
      case 'nombre': return validarNombre(regName, regTipoDoc);
      case 'correo': return validarCorreo(regEmail);
      case 'telefono': return validarTelefono(regTipoTel, regPhone);
      case 'direccion': return validarDireccion(regAddress);
      case 'contrasena': return validarContrasenaNueva(regPass);
      case 'confirmar': return validarConfirmacion(regPass, regConfirmPass);
    }
  };
  const salirReg = (campo: CampoRegistro) => setErroresReg((x) => ({ ...x, [campo]: validarCampoReg(campo) }));

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const campos: CampoRegistro[] = ['documento', 'nombre', 'correo', 'telefono', 'direccion', 'contrasena', 'confirmar'];
    const errs = Object.fromEntries(campos.map((c) => [c, validarCampoReg(c)])) as Partial<Record<CampoRegistro, string | null>>;
    setErroresReg(errs);
    if (Object.values(errs).some(Boolean)) { toast.error('Revisa los campos marcados en rojo.'); return; }

    setCargando(true);
    try {
      const sesion = await authService.registro({
        tipo_documento: regTipoDoc,
        numero_documento: regDoc.replace(/[\s.]/g, ''),
        nombre: regName.trim(),
        correo: regEmail.trim().toLowerCase(),
        tipo_telefono: regTipoTel,
        telefono: regPhone,
        direccion: regAddress.trim() || null,
        contrasena: regPass,
        confirmar_contrasena: regConfirmPass,
      });
      guardarSesion(sesion);
      setRegisterSuccess(true);
      toast.success('Cuenta creada con éxito');
      window.setTimeout(() => onLoginSuccess(sesion.usuario), 1500);
    } catch (err) {
      toast.error(mensajeError(err), { duration: 7000 });
    } finally {
      setCargando(false);
    }
  };

  // ==========================================
  // RECUPERACIÓN (PBI-18, 19, 20)
  // ==========================================
  const pedirCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validarCorreo(recEmail);
    if (problema) { setErrorRec(problema); return; }
    setCargando(true);
    setErrorRec('');
    try {
      const r = await authService.recuperar(recEmail.trim().toLowerCase());
      setSegReenvio(r.segundos_reenvio);
      setVenceEn(r.minutos_vigencia * 60);
      setCodigo('');
      setPaso('codigo');
      toast.success(r.mensaje, { duration: 6000 });
    } catch (err) {
      setErrorRec(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  const reenviar = async () => {
    setCargando(true);
    setErrorRec('');
    try {
      const r = await authService.reenviarCodigo(recEmail.trim().toLowerCase());
      setSegReenvio(r.segundos_reenvio);
      setVenceEn(r.minutos_vigencia * 60);
      setCodigo('');
      toast.success('Te enviamos un código nuevo. El anterior ya no funciona.');
    } catch (err) {
      setErrorRec(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  const verificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) { setErrorRec('El código tiene 6 números.'); return; }
    if (venceEn === 0) { setErrorRec('El código venció. Reenvía uno nuevo.'); return; }
    setCargando(true);
    setErrorRec('');
    try {
      const r = await authService.verificarCodigo(recEmail.trim().toLowerCase(), codigo);
      setTokenRestablecer(r.token_restablecer);
      setNueva('');
      setConfirmarNueva('');
      setPaso('nueva');
    } catch (err) {
      setErrorRec(mensajeError(err));
      setCodigo('');
    } finally {
      setCargando(false);
    }
  };

  const guardarNueva = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validarContrasenaNueva(nueva) ?? validarConfirmacion(nueva, confirmarNueva);
    if (problema) { setErrorRec(problema); return; }
    setCargando(true);
    setErrorRec('');
    try {
      const r = await authService.restablecer(tokenRestablecer, nueva, confirmarNueva);
      setTokenRestablecer('');
      setEmail(recEmail.trim().toLowerCase());
      setPassword('');
      setView('login');
      setAviso(r.mensaje);
      toast.success('Contraseña actualizada');
    } catch (err) {
      setErrorRec(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, position: 'relative', overflow: 'hidden', fontFamily: FONT, transition: 'background-color 0.3s ease',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT})` }} />

      <button onClick={() => setIsDark(!isDark)} title="Cambiar modo" style={{
        position: 'absolute', top: 20, right: 20, background: cardBg, border: `1px solid ${borderNormal}`, borderRadius: '50%',
        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10,
      }}>
        {isDark ? <Sun size={18} color={GOLD} /> : <Moon size={18} color="#333" />}
      </button>

      <div style={{ width: '100%', maxWidth: view === 'register' ? 560 : 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={isDark ? logo_negro : logo_blanco} alt="Logo" style={{ height: 100, width: 'auto', display: 'inline-block', objectFit: 'contain' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: subtle, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 10 }}>
            Sistema de Gestión — Eslabón
          </div>
        </div>

        <div style={{
          background: cardBg, borderRadius: 16, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(201,162,39,0.25)'}`,
          boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          overflow: 'hidden', position: 'relative', transition: 'background-color 0.3s ease, border-color 0.3s ease',
        }}>
          <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />

          {/* ================= LOGIN ================= */}
          {view === 'login' && (
            <div style={{ padding: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: fg, margin: '0 0 4px' }}>Iniciar Sesión</h1>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 24px' }}>Accede con tu correo y contraseña</p>

              {aviso && <Banner tipo="info" texto={aviso} />}
              {errorMsg && <Banner tipo="error" texto={errorMsg} />}

              <form onSubmit={handleLoginSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Correo electrónico</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Mail size={15} color={subtle} style={{ position: 'absolute', left: 10 }} />
                    <input type="email" autoComplete="email" autoFocus placeholder="nombre@gmail.com" value={email} maxLength={100}
                      onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); if (erroresLogin.correo) setErroresLogin((x) => ({ ...x, correo: validarCorreo(e.target.value) })); }}
                      onBlur={() => email && setErroresLogin((x) => ({ ...x, correo: validarCorreo(email) }))}
                      style={inputStyle(erroresLogin.correo)} />
                  </div>
                  <ErrorTxt msg={erroresLogin.correo} />
                </div>

                <div>
                  <label style={labelStyle}>Contraseña</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Lock size={15} color={subtle} style={{ position: 'absolute', left: 10 }} />
                    <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" value={password} maxLength={64}
                      onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); if (erroresLogin.contrasena) setErroresLogin((x) => ({ ...x, contrasena: null })); }}
                      onKeyUp={(e) => setBloqMayus(e.getModifierState('CapsLock'))}
                      style={inputStyle(erroresLogin.contrasena, true, true)} />
                    <BotonOjo visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
                  </div>
                  <ErrorTxt msg={erroresLogin.contrasena} />
                  {bloqMayus && <div style={{ color: GOLD, fontSize: 11, fontWeight: 600, marginTop: 4 }}>Bloq Mayús está activado</div>}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button type="button" onClick={() => irA('recover')} style={{ background: 'none', border: 'none', color: GOLD, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: FONT }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <BotonPrincipal><LogOut size={15} style={{ transform: 'rotate(180deg)' }} /> Iniciar Sesión</BotonPrincipal>
              </form>

              <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: subtle }}>
                ¿Eres cliente y no tienes cuenta?{' '}
                <button onClick={() => irA('register')} style={{ background: 'none', border: 'none', color: GOLD, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: FONT }}>
                  Regístrate
                </button>
              </div>
            </div>
          )}

          {/* ================= REGISTRO ================= */}
          {view === 'register' && (
            <div style={{ padding: 28 }}>
              <Volver />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <UserPlus size={18} color={GOLD} />
                <h1 style={{ fontSize: 22, fontWeight: 800, color: fg, margin: 0 }}>Crear cuenta de cliente</h1>
              </div>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 18px' }}>Regístrate para enviar tus remisiones al taller y seguir su estado</p>

              {registerSuccess ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <CheckCircle size={40} color={SUCCESS} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: fg, marginBottom: 6 }}>¡Cuenta creada con éxito!</div>
                  <div style={{ fontSize: 13, color: subtle }}>Entrando al sistema...</div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} noValidate style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Documento (PBI-15) */}
                  <div>
                    <label style={labelStyle}>Tipo de documento *</label>
                    <select value={regTipoDoc} onChange={(e) => { setRegTipoDoc(e.target.value as TipoDocumento); setRegDoc(''); setErroresReg((x) => ({ ...x, documento: null })); }}
                      style={inputStyle(null, false)}>
                      <option value="NIT">NIT (empresa)</option>
                      <option value="Cédula">Cédula (persona)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>{regTipoDoc === 'NIT' ? 'NIT *' : 'Número de cédula *'}</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Hash size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="text" inputMode="numeric" maxLength={regTipoDoc === 'NIT' ? 12 : 10}
                        placeholder={regTipoDoc === 'NIT' ? '900123456-1' : '1025760798'} value={regDoc}
                        onChange={(e) => setRegDoc(regTipoDoc === 'NIT' ? e.target.value.replace(/[^\d-]/g, '') : soloDigitos(e.target.value))}
                        onBlur={() => salirReg('documento')} style={inputStyle(erroresReg.documento)} />
                    </div>
                    <ErrorTxt msg={erroresReg.documento} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>{regTipoDoc === 'NIT' ? 'Razón social *' : 'Nombre completo *'}</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <User size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="text" maxLength={100} placeholder={regTipoDoc === 'NIT' ? 'Seguridad Atlas S.A.S' : 'Juan Pérez'} value={regName}
                        onChange={(e) => setRegName(e.target.value)} onBlur={() => salirReg('nombre')} style={inputStyle(erroresReg.nombre)} />
                    </div>
                    <ErrorTxt msg={erroresReg.nombre} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Correo electrónico *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="email" autoComplete="email" maxLength={100} placeholder="nombre@gmail.com" value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)} onBlur={() => salirReg('correo')} style={inputStyle(erroresReg.correo)} />
                    </div>
                    <ErrorTxt msg={erroresReg.correo} />
                  </div>

                  {/* Teléfono: uno solo, el cliente elige el tipo (PBI-16) */}
                  <div>
                    <label style={labelStyle}>Tipo de teléfono *</label>
                    <select value={regTipoTel} onChange={(e) => { setRegTipoTel(e.target.value as TipoTelefono); setErroresReg((x) => ({ ...x, telefono: null })); }}
                      style={inputStyle(null, false)}>
                      <option value="Empresarial">Empresarial</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Teléfono {regTipoTel.toLowerCase()} *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Phone size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="tel" inputMode="numeric" maxLength={10} placeholder={regTipoTel === 'Personal' ? '3001234567' : '6044440000'} value={regPhone}
                        onChange={(e) => setRegPhone(soloDigitos(e.target.value))} onBlur={() => salirReg('telefono')} style={inputStyle(erroresReg.telefono)} />
                    </div>
                    <ErrorTxt msg={erroresReg.telefono} />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={labelStyle}>Dirección (opcional)</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <MapPin size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="text" maxLength={150} placeholder="Calle 50 # 45-67, Medellín" value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)} onBlur={() => salirReg('direccion')} style={inputStyle(erroresReg.direccion)} />
                    </div>
                    <ErrorTxt msg={erroresReg.direccion} />
                  </div>

                  {/* Contraseñas con ojo (PBI-17) */}
                  <div>
                    <label style={labelStyle}>Contraseña *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type={showRegPass ? 'text' : 'password'} autoComplete="new-password" maxLength={64} placeholder="••••••••" value={regPass}
                        onChange={(e) => setRegPass(e.target.value)} onBlur={() => salirReg('contrasena')} style={inputStyle(erroresReg.contrasena, true, true)} />
                      <BotonOjo visible={showRegPass} onClick={() => setShowRegPass(!showRegPass)} />
                    </div>
                    <ErrorTxt msg={erroresReg.contrasena} />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirmar contraseña *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type={showRegConfirm ? 'text' : 'password'} autoComplete="new-password" maxLength={64} placeholder="••••••••" value={regConfirmPass}
                        onChange={(e) => setRegConfirmPass(e.target.value)} onBlur={() => salirReg('confirmar')} onPaste={(e) => e.preventDefault()}
                        style={inputStyle(erroresReg.confirmar, true, true)} />
                      <BotonOjo visible={showRegConfirm} onClick={() => setShowRegConfirm(!showRegConfirm)} />
                    </div>
                    <ErrorTxt msg={erroresReg.confirmar} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}><Reglas valor={regPass} /></div>

                  <div style={{ gridColumn: 'span 2', marginTop: 6 }}>
                    <BotonPrincipal><UserPlus size={15} /> Crear cuenta</BotonPrincipal>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================= RECUPERAR CONTRASEÑA ================= */}
          {view === 'recover' && (
            <div style={{ padding: 32 }}>
              <Volver />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <KeyRound size={18} color={GOLD} />
                <h1 style={{ fontSize: 24, fontWeight: 800, color: fg, margin: 0 }}>
                  {paso === 'nueva' ? 'Nueva contraseña' : 'Recuperar contraseña'}
                </h1>
              </div>
              <p style={{ fontSize: 13, color: subtle, margin: '0 0 24px' }}>
                {paso === 'correo' && 'Escribe el correo de tu cuenta y te enviaremos un código de 6 dígitos.'}
                {paso === 'codigo' && <>Enviamos el código a <b style={{ color: fg }}>{recEmail.trim().toLowerCase()}</b>.</>}
                {paso === 'nueva' && 'Crea una contraseña nueva. Al guardarla se cerrará tu sesión en todos los dispositivos.'}
              </p>

              {errorRec && <Banner tipo="error" texto={errorRec} />}

              {paso === 'correo' && (
                <form onSubmit={pedirCodigo} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Correo electrónico</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={15} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type="email" autoComplete="email" autoFocus maxLength={100} placeholder="nombre@gmail.com" value={recEmail}
                        onChange={(e) => { setRecEmail(e.target.value); setErrorRec(''); }} style={inputStyle(null)} />
                    </div>
                  </div>
                  <BotonPrincipal><Mail size={15} /> Enviar código</BotonPrincipal>
                </form>
              )}

              {paso === 'codigo' && (
                <form onSubmit={verificar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <input type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} placeholder="------" value={codigo}
                    onChange={(e) => { setCodigo(soloDigitos(e.target.value).slice(0, 6)); setErrorRec(''); }}
                    style={{ ...inputStyle(null, false), textAlign: 'center', fontSize: 28, letterSpacing: '0.5em', fontWeight: 800, padding: '12px 10px' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: venceEn > 0 ? subtle : DANGER }}>
                    <Timer size={14} />
                    {venceEn > 0 ? <>El código vence en <b style={{ color: venceEn <= 60 ? DANGER : fg }}>{mmss(venceEn)}</b></> : 'El código venció. Reenvía uno nuevo.'}
                  </div>

                  <BotonPrincipal deshabilitado={codigo.length !== 6 || venceEn === 0}><ShieldCheck size={15} /> Verificar código</BotonPrincipal>

                  <div style={{ textAlign: 'center', fontSize: 13, color: subtle }}>
                    ¿No te llegó?{' '}
                    <button type="button" onClick={reenviar} disabled={segReenvio > 0 || cargando} style={{
                      background: 'none', border: 'none', color: segReenvio > 0 ? subtle : GOLD, fontWeight: 700, padding: 0, fontFamily: FONT,
                      cursor: segReenvio > 0 ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <RotateCw size={12} /> {segReenvio > 0 ? `Reenviar código en ${segReenvio}s` : 'Reenviar código'}
                    </button>
                  </div>
                  <button type="button" onClick={() => { setPaso('correo'); setCodigo(''); setErrorRec(''); }}
                    style={{ background: 'none', border: 'none', color: subtle, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: FONT }}>
                    Usar otro correo
                  </button>
                </form>
              )}

              {paso === 'nueva' && (
                <form onSubmit={guardarNueva} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Nueva contraseña</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={15} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type={showNueva ? 'text' : 'password'} autoComplete="new-password" autoFocus maxLength={64} placeholder="••••••••" value={nueva}
                        onChange={(e) => { setNueva(e.target.value); setErrorRec(''); }} style={inputStyle(null, true, true)} />
                      <BotonOjo visible={showNueva} onClick={() => setShowNueva(!showNueva)} />
                    </div>
                    <Reglas valor={nueva} />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirmar nueva contraseña</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={15} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type={showConfirmarNueva ? 'text' : 'password'} autoComplete="new-password" maxLength={64} placeholder="••••••••" value={confirmarNueva}
                        onChange={(e) => { setConfirmarNueva(e.target.value); setErrorRec(''); }} onPaste={(e) => e.preventDefault()} style={inputStyle(null, true, true)} />
                      <BotonOjo visible={showConfirmarNueva} onClick={() => setShowConfirmarNueva(!showConfirmarNueva)} />
                    </div>
                    {confirmarNueva && <ErrorTxt msg={validarConfirmacion(nueva, confirmarNueva)} />}
                  </div>
                  <BotonPrincipal><KeyRound size={15} /> Guardar contraseña</BotonPrincipal>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
