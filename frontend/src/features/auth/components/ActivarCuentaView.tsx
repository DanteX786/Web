import React, { useEffect, useState } from 'react';
import { CheckCircle, Eye, EyeOff, KeyRound, Loader2, Lock, Moon, ShieldCheck, Sun, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import logo_blanco from '../../../../public/images/logo blanco.png';
import logo_negro from '../../../../public/images/logo negro.png';

import { authService, guardarSesion, nombreTipoDocumento, type InvitacionInfo, type Usuario } from '../services/authService';
import { REGLAS_CONTRASENA, validarConfirmacion, validarContrasenaNueva } from '../utils/validaciones';
import { mensajeError } from '../../../shared/utils/api';

const GOLD = '#C9A227';
const GOLD_LIGHT = '#E6B84A';
const DANGER = '#DC3545';
const SUCCESS = '#28A745';
const FONT = 'Montserrat, sans-serif';

interface Props {
  /** Token que llega en el enlace del correo (?activar=...). */
  token: string;
  /** La cuenta quedó activa: se entra al aplicativo con la sesión nueva. */
  onActivada: (usuario: Usuario) => void;
  /** Ir al inicio de sesión (enlace vencido, ya usado, etc.). */
  onIrALogin: () => void;
}

/**
 * Pantalla pública "Activar cuenta" para el cliente que registró el taller.
 * El cliente crea su contraseña, acepta el tratamiento de datos y entra de una vez.
 */
export const ActivarCuentaView: React.FC<Props> = ({ token, onActivada, onIrALogin }) => {
  const [dark, setDark] = useState(false);
  const [info, setInfo] = useState<InvitacionInfo | null>(null);
  const [errorEnlace, setErrorEnlace] = useState('');
  const [cargando, setCargando] = useState(true);

  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [ver1, setVer1] = useState(false);
  const [ver2, setVer2] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    authService.infoInvitacion(token)
      .then(setInfo)
      .catch((e) => setErrorEnlace(mensajeError(e)))
      .finally(() => setCargando(false));
  }, [token]);

  const bg = dark ? '#121212' : '#F8F9FA';
  const cardBg = dark ? '#1E1E1E' : '#FFFFFF';
  const fg = dark ? '#F8F9FA' : '#121212';
  const subtle = dark ? '#9A9A9A' : '#6B6B6B';
  const inputBg = dark ? '#2A2A2A' : '#F3F3F5';
  const borde = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const input: React.CSSProperties = {
    width: '100%', padding: '10px 38px 10px 32px', borderRadius: 8, fontSize: 13, backgroundColor: inputBg,
    color: fg, border: `1px solid ${borde}`, outline: 'none', boxSizing: 'border-box', fontFamily: FONT,
  };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: fg, display: 'block', marginBottom: 6 };

  const activar = async (e: React.FormEvent) => {
    e.preventDefault();
    const problema = validarContrasenaNueva(contrasena) ?? validarConfirmacion(contrasena, confirmar)
      ?? (acepta ? null : 'Debes aceptar la política de tratamiento de datos.');
    if (problema) { setError(problema); return; }
    setGuardando(true);
    setError('');
    try {
      const sesion = await authService.activarCuenta(token, contrasena, confirmar, acepta);
      guardarSesion(sesion);
      toast.success('¡Tu cuenta quedó activa! Bienvenido a Eslabón.');
      onActivada(sesion.usuario);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  };

  const ojo = (visible: boolean, cambiar: () => void) => (
    <button type="button" onClick={cambiar} title={visible ? 'Ocultar' : 'Mostrar'}
      style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
      {visible ? <EyeOff size={15} color={subtle} /> : <Eye size={15} color={subtle} />}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT})` }} />
      <button onClick={() => setDark(!dark)} title="Cambiar modo" style={{
        position: 'absolute', top: 20, right: 20, background: cardBg, border: `1px solid ${borde}`, borderRadius: '50%',
        width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        {dark ? <Sun size={18} color={GOLD} /> : <Moon size={18} color="#333" />}
      </button>

      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={dark ? logo_negro : logo_blanco} alt="Logo" style={{ height: 90, width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: subtle, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 10 }}>
            Sistema de Gestión — Eslabón
          </div>
        </div>

        <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${dark ? borde : 'rgba(201,162,39,0.25)'}`, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
          <div style={{ padding: 32 }}>
            {cargando ? (
              <div style={{ textAlign: 'center', color: subtle, padding: 24 }}>
                <Loader2 size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Revisando tu invitación...
              </div>
            ) : errorEnlace ? (
              <div style={{ textAlign: 'center' }}>
                <AlertTriangle size={40} color={DANGER} style={{ marginBottom: 12 }} />
                <h1 style={{ fontSize: 20, fontWeight: 800, color: fg, margin: '0 0 8px' }}>No pudimos usar este enlace</h1>
                <p style={{ fontSize: 13, color: subtle, margin: '0 0 20px' }}>{errorEnlace}</p>
                <p style={{ fontSize: 12, color: subtle, margin: '0 0 20px' }}>
                  Si el enlace venció, pide al taller que te reenvíe la invitación, o usa «¿Olvidaste tu contraseña?» en el inicio de sesión.
                </p>
                <button onClick={onIrALogin} style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontFamily: FONT }}>
                  Ir al inicio de sesión
                </button>
              </div>
            ) : info && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ShieldCheck size={20} color={GOLD} />
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: fg, margin: 0 }}>Activa tu cuenta</h1>
                </div>
                <p style={{ fontSize: 13, color: subtle, margin: '0 0 18px' }}>
                  Hola <b style={{ color: fg }}>{info.nombre}</b>, el taller te registró como cliente. Crea tu contraseña para seguir tus remisiones en línea.
                </p>

                <div style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}40`, borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: fg }}>
                  <div><span style={{ color: subtle }}>Correo con el que entrarás:</span> <b>{info.correo}</b></div>
                  {info.documento && (
                    <div style={{ marginTop: 4 }}><span style={{ color: subtle }}>{nombreTipoDocumento(info.tipo_documento)}:</span> <b>{info.documento}</b></div>
                  )}
                </div>

                {error && (
                  <div style={{ background: `${DANGER}12`, border: `1px solid ${DANGER}40`, color: DANGER, borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                    {error}
                  </div>
                )}

                <form onSubmit={activar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={label}>Contraseña *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type={ver1 ? 'text' : 'password'} autoComplete="new-password" autoFocus maxLength={64} placeholder="••••••••"
                        value={contrasena} onChange={(e) => { setContrasena(e.target.value); setError(''); }} style={input} />
                      {ojo(ver1, () => setVer1(!ver1))}
                    </div>
                  </div>
                  <div>
                    <label style={label}>Confirmar contraseña *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Lock size={14} color={subtle} style={{ position: 'absolute', left: 10 }} />
                      <input type={ver2 ? 'text' : 'password'} autoComplete="new-password" maxLength={64} placeholder="••••••••"
                        value={confirmar} onChange={(e) => { setConfirmar(e.target.value); setError(''); }}
                        onPaste={(e) => e.preventDefault()} style={input} />
                      {ojo(ver2, () => setVer2(!ver2))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {REGLAS_CONTRASENA.map((r) => {
                      const ok = r.cumple(contrasena);
                      return (
                        <div key={r.texto} style={{ fontSize: 11, color: ok ? SUCCESS : subtle, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} color={ok ? SUCCESS : subtle} /> {r.texto}
                        </div>
                      );
                    })}
                  </div>

                  <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: fg, cursor: 'pointer' }}>
                    <input type="checkbox" checked={acepta} onChange={(e) => { setAcepta(e.target.checked); setError(''); }}
                      style={{ marginTop: 2, accentColor: GOLD }} />
                    <span>
                      Autorizo al Taller y Confecciones CDS a tratar mis datos personales para gestionar mis remisiones y
                      comunicarse conmigo, de acuerdo con la Ley 1581 de 2012 (protección de datos personales).
                    </span>
                  </label>

                  <button type="submit" disabled={guardando} style={{
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14,
                    border: 'none', borderRadius: 10, padding: '12px', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONT,
                  }}>
                    {guardando ? <Loader2 size={16} /> : <KeyRound size={16} />} {guardando ? 'Activando...' : 'Activar mi cuenta'}
                  </button>
                </form>

                <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12, color: subtle }}>
                  ¿Ya tienes contraseña?{' '}
                  <button onClick={onIrALogin} style={{ background: 'none', border: 'none', color: GOLD, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: FONT }}>
                    Inicia sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
