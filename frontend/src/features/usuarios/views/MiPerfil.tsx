import React, { useEffect, useState } from "react";
import {
  User, Mail, Phone, MapPin, Hash, Shield, Lock, Eye, EyeOff,
  Pencil, Save, X, CheckCircle, Key, Info, Building2,
} from "lucide-react";
import { toast } from "sonner";

import { authService, obtenerUsuario, type TipoTelefono, type Usuario } from "../../auth/services/authService";
import {
  REGLAS_CONTRASENA, soloDigitos, validarConfirmacion, validarContrasenaNueva,
  validarCorreo, validarDireccion, validarNombre, validarTelefono,
} from "../../auth/utils/validaciones";
import { mensajeError } from "../../../shared/utils/api";

// ==========================================
// CONSTANTES
// ==========================================
const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const DANGER = "#DC3545";
const SUCCESS = "#28A745";
const SUCCESS_BG = "#DCF7E6";
const INFO = "#4A90E2";
const FONT = "Montserrat, sans-serif";

type CampoPerfil = "nombre" | "correo" | "telefono" | "direccion";

interface FormPerfil {
  nombre: string;
  correo: string;
  tipo_telefono: TipoTelefono;
  telefono: string;
  direccion: string;
}

const formDesde = (u: Usuario | null): FormPerfil => ({
  nombre: u?.nombre ?? "",
  correo: u?.correo ?? "",
  tipo_telefono: u?.tipo_telefono ?? "Empresarial",
  telefono: u?.telefono ?? "",
  direccion: u?.direccion ?? "",
});

interface Tema { fg: string; subtle: string; cardBg: string; borderCol: string }

/** Tarjeta con título. Va fuera de MiPerfil para que los inputs no pierdan el foco al escribir. */
const Tarjeta = ({ t, titulo, icono, children, accion }: { t: Tema; titulo: string; icono: React.ReactNode; children: React.ReactNode; accion?: React.ReactNode }) => (
  <div style={{ background: t.cardBg, borderRadius: 16, border: `1px solid ${GOLD}25`, padding: 24 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${t.borderCol}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 4, height: 20, borderRadius: 999, background: GOLD }} />
        {icono}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: t.fg, margin: 0 }}>{titulo}</h3>
      </div>
      {accion}
    </div>
    {children}
  </div>
);

/**
 * Mi perfil.
 * - Cliente: consulta y EDITA sus datos y cambia su contraseña.
 * - Empleado: solo CONSULTA (sus datos y su contraseña los administra el taller).
 * - Administrador: no tiene Mi perfil (gestiona las cuentas desde Usuarios).
 */
export default function MiPerfil({ dark }: { dark: boolean }) {
  // --- Tema ---
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const bg = dark ? "#121212" : "#F8F9FA";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const borderCol = dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const tema: Tema = { fg, subtle, cardBg, borderCol };

  // --- Datos reales del usuario con sesión ---
  const [usuario, setUsuario] = useState<Usuario | null>(() => obtenerUsuario());
  const esCliente = usuario?.tipo === "Cliente";

  useEffect(() => {
    authService.me()
      .then((u) => { setUsuario(u); localStorage.setItem("usuario", JSON.stringify(u)); })
      .catch(() => undefined); // si la sesión cerró, el interceptor ya manda al login
  }, []);

  // --- Edición (solo cliente) ---
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<FormPerfil>(() => formDesde(obtenerUsuario()));
  const [errores, setErrores] = useState<Partial<Record<CampoPerfil, string | null>>>({});
  const [guardando, setGuardando] = useState(false);

  // --- Contraseña (solo cliente) ---
  const [pass, setPass] = useState({ actual: "", nueva: "", confirmar: "" });
  const [ver, setVer] = useState({ actual: false, nueva: false, confirmar: false });
  const [cambiando, setCambiando] = useState(false);

  const validar = (campo: CampoPerfil, f: FormPerfil = form): string | null => {
    switch (campo) {
      case "nombre": return validarNombre(f.nombre, usuario?.tipo_documento ?? "NIT");
      case "correo": return validarCorreo(f.correo);
      case "telefono": return validarTelefono(f.tipo_telefono, f.telefono);
      case "direccion": return validarDireccion(f.direccion);
    }
  };

  const empezarEdicion = () => {
    setForm(formDesde(usuario));
    setErrores({});
    setEditando(true);
  };

  const guardarPerfil = async () => {
    const campos: CampoPerfil[] = ["nombre", "correo", "telefono", "direccion"];
    const errs = Object.fromEntries(campos.map((c) => [c, validar(c)])) as Partial<Record<CampoPerfil, string | null>>;
    setErrores(errs);
    if (Object.values(errs).some(Boolean)) { toast.error("Revisa los campos marcados en rojo."); return; }
    setGuardando(true);
    try {
      const u = await authService.actualizarPerfil({
        nombre: form.nombre.trim(),
        correo: form.correo.trim().toLowerCase(),
        tipo_telefono: form.tipo_telefono,
        telefono: form.telefono,
        direccion: form.direccion.trim() || null,
      });
      setUsuario(u);
      setEditando(false);
      toast.success("Perfil actualizado correctamente");
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarContrasena = async () => {
    if (!pass.actual) { toast.error("Ingresa tu contraseña actual"); return; }
    const problema = validarContrasenaNueva(pass.nueva) ?? validarConfirmacion(pass.nueva, pass.confirmar);
    if (problema) { toast.error(problema); return; }
    if (pass.nueva === pass.actual) { toast.error("La nueva contraseña debe ser diferente a la actual"); return; }
    setCambiando(true);
    try {
      // Si sale bien, se cierra la sesión en todos los dispositivos y App.tsx muestra el login
      await authService.cambiarContrasena(pass.actual, pass.nueva, pass.confirmar);
      toast.success("Contraseña actualizada. Inicia sesión con la nueva contraseña.");
    } catch (e) {
      toast.error(mensajeError(e));
      setCambiando(false);
    }
  };

  // ==========================================
  // PIEZAS DE INTERFAZ
  // ==========================================
  const inputStyle = (error?: string | null, disabled = false): React.CSSProperties => ({
    width: "100%", padding: "10px 12px 10px 36px", background: disabled ? surfaceBg : inputBg,
    border: `1px solid ${error ? DANGER : borderNormal}`, borderRadius: 8, fontSize: 13, color: disabled ? subtle : fg,
    outline: "none", boxSizing: "border-box", fontFamily: FONT,
  });

  const Etiqueta = ({ texto }: { texto: string }) => (
    <label style={{ display: "block", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtle, marginBottom: 6 }}>
      {texto}
    </label>
  );

  const Dato = ({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: string | null | undefined }) => (
    <div>
      <Etiqueta texto={etiqueta} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: surfaceBg, borderRadius: 8, border: `1px solid ${borderCol}`, minHeight: 20 }}>
        <span style={{ color: GOLD, display: "flex" }}>{icono}</span>
        <span style={{ fontSize: 13, color: valor ? fg : subtle, fontWeight: 600 }}>{valor || "—"}</span>
      </div>
    </div>
  );

  const Error = ({ msg }: { msg?: string | null }) =>
    msg ? <div style={{ color: DANGER, fontSize: 11, fontWeight: 600, marginTop: 4 }}>{msg}</div> : null;

  // Se usa como función {campoPass(...)} y no como <Componente/>, así el input conserva el foco
  const campoPass = (campo: "actual" | "nueva" | "confirmar", etiqueta: string) => (
    <div key={campo} style={{ marginBottom: 12 }}>
      <Etiqueta texto={etiqueta} />
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <Lock size={14} color={subtle} style={{ position: "absolute", left: 12 }} />
        <input
          type={ver[campo] ? "text" : "password"} value={pass[campo]} maxLength={64} placeholder="••••••••"
          autoComplete={campo === "actual" ? "current-password" : "new-password"}
          onChange={(e) => setPass({ ...pass, [campo]: e.target.value })}
          onPaste={campo === "confirmar" ? (e) => e.preventDefault() : undefined}
          style={{ ...inputStyle(), paddingRight: 38 }}
        />
        <button type="button" onClick={() => setVer({ ...ver, [campo]: !ver[campo] })} title={ver[campo] ? "Ocultar" : "Ver contraseña"}
          style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          {ver[campo] ? <EyeOff size={15} color={subtle} /> : <Eye size={15} color={subtle} />}
        </button>
      </div>
    </div>
  );

  const botonOro: React.CSSProperties = {
    padding: "8px 16px", border: "none", borderRadius: 8, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
    color: "#121212", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT,
  };
  const botonSuave: React.CSSProperties = {
    padding: "8px 16px", border: `1px solid ${borderNormal}`, borderRadius: 8, background: inputBg,
    color: fg, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: FONT,
  };

  if (!usuario) return null;

  const etiquetaDocumento = esCliente ? (usuario.tipo_documento ?? "Documento") : "Identificación";

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div style={{ backgroundColor: bg, minHeight: "100vh", padding: 24, fontFamily: FONT, color: fg }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Mi Perfil</h2>
        <p style={{ fontSize: 13, color: subtle, margin: 0 }}>
          {esCliente ? "Consulta y actualiza los datos de tu cuenta." : "Consulta los datos de tu cuenta en el taller."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* ----- Encabezado ----- */}
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${GOLD}25`, overflow: "hidden" }}>
            <div style={{ height: 70, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` }} />
            <div style={{ padding: "0 24px 24px", marginTop: -34 }}>
              <div style={{
                width: 68, height: 68, borderRadius: "50%", background: cardBg, border: `3px solid ${cardBg}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 800, color: GOLD,
              }}>
                {usuario.nombre.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 12 }}>{usuario.nombre}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", color: GOLD, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Shield size={12} /> {usuario.rol ?? usuario.tipo}
                </span>
                <span style={{ background: SUCCESS_BG, color: SUCCESS, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>● Activo</span>
              </div>
            </div>
          </div>

          {/* ----- Contraseña: solo cliente ----- */}
          {esCliente ? (
            <Tarjeta t={tema} titulo="Seguridad" icono={<Key size={15} color={GOLD} />}>
              {campoPass("actual", "Contraseña actual")}
              {campoPass("nueva", "Nueva contraseña")}
              <div style={{ background: surfaceBg, borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {REGLAS_CONTRASENA.map((r) => {
                  const ok = r.cumple(pass.nueva);
                  return (
                    <div key={r.texto} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: ok ? SUCCESS : subtle }}>
                      <CheckCircle size={12} style={{ color: ok ? SUCCESS : subtle, opacity: ok ? 1 : 0.4 }} /> {r.texto}
                    </div>
                  );
                })}
              </div>
              {campoPass("confirmar", "Confirmar nueva contraseña")}
              <div style={{ fontSize: 11, color: subtle, marginBottom: 12 }}>
                Por seguridad, al cambiarla se cerrará tu sesión en todos los dispositivos.
              </div>
              <button onClick={cambiarContrasena} disabled={cambiando} style={{ ...botonOro, width: "100%", justifyContent: "center", padding: 12, opacity: cambiando ? 0.6 : 1 }}>
                <Key size={14} /> {cambiando ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </Tarjeta>
          ) : (
            <div style={{ background: `${INFO}12`, border: `1px solid ${INFO}40`, borderRadius: 12, padding: 16, display: "flex", gap: 10 }}>
              <Info size={18} color={INFO} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, color: fg, lineHeight: 1.5 }}>
                Tus datos y tu contraseña los administra el taller porque son información de la empresa.
                Si algo está mal o necesitas una nueva contraseña, comunícate con el administrador.
              </div>
            </div>
          )}
        </div>

        {/* ----- Datos de la cuenta ----- */}
        <Tarjeta
          t={tema}
          titulo="Datos de la cuenta"
          icono={<User size={15} color={GOLD} />}
          accion={esCliente && (editando ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditando(false)} disabled={guardando} style={botonSuave}><X size={14} /> Cancelar</button>
              <button onClick={guardarPerfil} disabled={guardando} style={{ ...botonOro, opacity: guardando ? 0.6 : 1 }}>
                <Save size={14} /> {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          ) : (
            <button onClick={empezarEdicion} style={botonOro}><Pencil size={14} /> Editar</button>
          ))}
        >
          {!editando ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Dato icono={<Hash size={14} />} etiqueta={etiquetaDocumento} valor={usuario.documento} />
              <Dato icono={<Shield size={14} />} etiqueta="Rol" valor={usuario.rol} />
              <div style={{ gridColumn: "span 2" }}>
                <Dato icono={esCliente && usuario.tipo_documento === "NIT" ? <Building2 size={14} /> : <User size={14} />}
                  etiqueta={esCliente && usuario.tipo_documento === "NIT" ? "Razón social" : "Nombre completo"} valor={usuario.nombre} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <Dato icono={<Mail size={14} />} etiqueta="Correo electrónico" valor={usuario.correo} />
              </div>
              <Dato icono={<Phone size={14} />} etiqueta={esCliente ? `Teléfono ${(usuario.tipo_telefono ?? "").toLowerCase()}` : "Teléfono"} valor={usuario.telefono} />
              <Dato icono={<MapPin size={14} />} etiqueta="Dirección" valor={usuario.direccion} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Dato icono={<Hash size={14} />} etiqueta={`${etiquetaDocumento} (no se puede cambiar)`} valor={usuario.documento} />
              <div />
              <div style={{ gridColumn: "span 2" }}>
                <Etiqueta texto={usuario.tipo_documento === "NIT" ? "Razón social *" : "Nombre completo *"} />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <User size={14} color={subtle} style={{ position: "absolute", left: 12 }} />
                  <input value={form.nombre} maxLength={100} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    onBlur={() => setErrores((x) => ({ ...x, nombre: validar("nombre") }))} style={inputStyle(errores.nombre)} />
                </div>
                <Error msg={errores.nombre} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <Etiqueta texto="Correo electrónico *" />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Mail size={14} color={subtle} style={{ position: "absolute", left: 12 }} />
                  <input type="email" value={form.correo} maxLength={100} onChange={(e) => setForm({ ...form, correo: e.target.value })}
                    onBlur={() => setErrores((x) => ({ ...x, correo: validar("correo") }))} style={inputStyle(errores.correo)} />
                </div>
                <Error msg={errores.correo} />
                <div style={{ fontSize: 11, color: subtle, marginTop: 4 }}>Con este correo inicias sesión y recibes el código de recuperación.</div>
              </div>
              <div>
                <Etiqueta texto="Tipo de teléfono *" />
                <select value={form.tipo_telefono}
                  onChange={(e) => { const f = { ...form, tipo_telefono: e.target.value as TipoTelefono }; setForm(f); setErrores((x) => ({ ...x, telefono: form.telefono ? validar("telefono", f) : null })); }}
                  style={{ ...inputStyle(), paddingLeft: 12 }}>
                  <option value="Empresarial">Empresarial</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
              <div>
                <Etiqueta texto={`Teléfono ${form.tipo_telefono.toLowerCase()} *`} />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Phone size={14} color={subtle} style={{ position: "absolute", left: 12 }} />
                  <input type="tel" inputMode="numeric" maxLength={10} value={form.telefono}
                    placeholder={form.tipo_telefono === "Personal" ? "3001234567" : "6044440000"}
                    onChange={(e) => setForm({ ...form, telefono: soloDigitos(e.target.value) })}
                    onBlur={() => setErrores((x) => ({ ...x, telefono: validar("telefono") }))} style={inputStyle(errores.telefono)} />
                </div>
                <Error msg={errores.telefono} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <Etiqueta texto="Dirección (opcional)" />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <MapPin size={14} color={subtle} style={{ position: "absolute", left: 12 }} />
                  <input value={form.direccion} maxLength={150} onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    onBlur={() => setErrores((x) => ({ ...x, direccion: validar("direccion") }))} style={inputStyle(errores.direccion)} />
                </div>
                <Error msg={errores.direccion} />
              </div>
            </div>
          )}
        </Tarjeta>
      </div>
    </div>
  );
}
