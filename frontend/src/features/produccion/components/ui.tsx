import React from 'react';
import { Search, Plus, X, AlertTriangle, Loader2 } from 'lucide-react';

// ==========================================
// PALETA DE COLORES - SISTEMA DE DISEÑO BASE
// ==========================================
export const GOLD = "#C9A227";
export const GOLD_LIGHT = "#E6B84A";
export const DANGER = "#DC3545";
export const DANGER_BG = "#FDECEA";
export const DANGER_TXT = "#721c24";
export const SUCCESS = "#28A745";
export const SUCCESS_BG = "#DCF7E6";
export const SUCCESS_TXT = "#155724";
export const WARNING = "#FD7E14";
export const WARNING_BG = "#FFF3E0";
export const INFO = "#4A90E2";
export const INFO_BG = "#E3F2FD";
export const FONT = 'Montserrat, sans-serif';

/** Colores según el modo claro / oscuro. */
export const tema = (dark: boolean) => ({
  fg: dark ? "#F8F9FA" : "#121212",
  subtle: dark ? "#9A9A9A" : "#6B6B6B",
  cardBg: dark ? "#1E1E1E" : "#FFFFFF",
  bg: dark ? "#121212" : "#F8F9FA",
  surface: dark ? "#252525" : "#F8F8F8",
  inputBg: dark ? "#2A2A2A" : "#F3F3F5",
  border: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
});

export const estiloInput = (dark: boolean, extra: React.CSSProperties = {}): React.CSSProperties => {
  const t = tema(dark);
  return {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, backgroundColor: t.inputBg,
    color: t.fg, border: `1px solid ${t.border}`, outline: 'none', boxSizing: 'border-box', fontFamily: FONT, ...extra,
  };
};

/** "2026-11-09T02:36:14Z" -> "8/11/2026, 9:36 p. m." (hora de Colombia) */
export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

/** "2026-11-09" -> "09/11/2026" sin correr el día por la zona horaria */
export const fecha = (yyyyMmDd: string | null | undefined) => {
  if (!yyyyMmDd) return '—';
  const [y, m, d] = yyyyMmDd.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const IdBadge: React.FC<{ id: string }> = ({ id }) => (
  <span style={{
    background: GOLD + "1F", color: GOLD, fontFamily: "monospace", fontWeight: 700, fontSize: 11,
    padding: "3px 8px", borderRadius: 6, display: "inline-flex", whiteSpace: 'nowrap',
  }}>{id}</span>
);

export const Pill: React.FC<{ texto: string; color: string; bg: string }> = ({ texto, color, bg }) => (
  <span style={{
    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, backgroundColor: bg, color,
    whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
  }}>{texto}</span>
);

export const ActionCircleBtn: React.FC<{
  variant?: 'blue' | 'gold' | 'danger' | 'success';
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}> = ({ variant = 'gold', onClick, children, title, disabled }) => {
  const color = { blue: INFO, gold: GOLD, danger: DANGER, success: SUCCESS }[variant];
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent',
        border: `1.5px solid ${color}`, color, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background-color 0.15s',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = `${color}15`; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {children}
    </button>
  );
};

export const TableShell: React.FC<{ headers: string[]; children: React.ReactNode; dark?: boolean }> = ({ headers, children, dark = false }) => {
  const t = tema(dark);
  return (
    <div style={{ borderRadius: 12, overflowX: 'auto', border: `1px solid ${t.border}`, background: t.cardBg }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: FONT }}>
        <thead>
          <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
            {headers.map((h) => (
              <th key={h} style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', padding: '12px 14px', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

/** Fila de "cargando" / "sin datos" dentro de una tabla. */
export const FilaMensaje: React.FC<{ colSpan: number; dark?: boolean; cargando?: boolean; texto: string }> = ({ colSpan, dark = false, cargando, texto }) => (
  <tr>
    <td colSpan={colSpan} style={{ textAlign: 'center', padding: 32, color: tema(dark).subtle, fontSize: 13 }}>
      {cargando ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Cargando...
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </span>
      ) : texto}
    </td>
  </tr>
);

export const Modal: React.FC<{
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saving?: boolean;
  dark?: boolean;
  maxWidth?: string;
  children: React.ReactNode;
}> = ({ title, icon, onClose, onSave, saveLabel = 'Guardar', saving, dark = false, maxWidth = "650px", children }) => {
  const t = tema(dark);
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{
        width: '100%', maxWidth, borderRadius: 16, backgroundColor: t.cardBg, border: `1px solid ${GOLD}40`,
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ height: 3, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${GOLD}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon}
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: t.fg, fontFamily: FONT }}>{title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6B6B' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: FONT }}>{children}</div>
        {onSave && (
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${GOLD}25`, display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: t.surface }}>
            <button onClick={onClose} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', background: dark ? '#2A2A2A' : '#EAEAEA', color: t.fg, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
              Cancelar
            </button>
            <button onClick={onSave} disabled={saving} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
              color: '#121212', fontWeight: 700, fontSize: 13, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: FONT,
            }}>
              {saving ? 'Guardando...' : saveLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; dark?: boolean; error?: string; children: React.ReactNode }> = ({ label, dark = false, error, children }) => (
  <div style={{ width: '100%' }}>
    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: tema(dark).subtle, display: 'block', marginBottom: 6 }}>
      {label}
    </label>
    {children}
    {error && <div style={{ color: DANGER, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{error}</div>}
  </div>
);

export const ModuleHeader: React.FC<{
  title: string;
  subtitle: string;
  onAdd?: () => void;
  addLabel?: string;
  search: string;
  onSearch: (val: string) => void;
  dark?: boolean;
  extra?: React.ReactNode;
}> = ({ title, subtitle, onAdd, addLabel, search, onSearch, dark = false, extra }) => {
  const t = tema(dark);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: t.fg, fontFamily: FONT }}>{title}</h2>
        <p style={{ fontSize: 13, color: t.subtle, margin: 0, fontFamily: FONT }}>{subtitle}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {extra}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color={t.subtle} style={{ position: 'absolute', left: 12 }} />
          <input
            type="text" placeholder="Buscar..." value={search} onChange={(e) => onSearch(e.target.value)}
            style={{ padding: '8px 12px 8px 36px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: t.fg, fontSize: 13, outline: 'none', fontFamily: FONT }}
          />
        </div>
        {onAdd && (
          <button onClick={onAdd} style={{
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212', fontWeight: 700, fontSize: 14,
            borderRadius: 10, padding: '8px 16px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT,
          }}>
            <Plus size={14} /> {addLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export const Kpi: React.FC<{ label: string; valor: number | string; color: string; dark?: boolean; nota?: string }> = ({ label, valor, color, dark = false, nota }) => {
  const t = tema(dark);
  return (
    <div style={{ padding: 16, borderRadius: 12, backgroundColor: t.cardBg, borderLeft: `4px solid ${color}`, borderTop: `1px solid ${t.border}`, borderRight: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: t.subtle, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: t.fg }}>{valor}</span>
        {nota && <span style={{ fontSize: 11, color: t.subtle }}>{nota}</span>}
      </div>
    </div>
  );
};

/** Barra de avance 0–100 %. */
export const BarraAvance: React.FC<{ porcentaje: number; dark?: boolean }> = ({ porcentaje, dark = false }) => {
  const p = Math.max(0, Math.min(100, Number(porcentaje) || 0));
  const color = p >= 100 ? SUCCESS : p >= 50 ? GOLD : WARNING;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 999, background: tema(dark).inputBg, overflow: 'hidden' }}>
        <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 38, textAlign: 'right' }}>{p.toFixed(0)}%</span>
    </div>
  );
};

export const Paginacion: React.FC<{ pagina: number; total: number; registros: number; porPagina: number; onCambiar: (p: number) => void; dark?: boolean }> = ({ pagina, total, registros, porPagina, onCambiar, dark = false }) => {
  const t = tema(dark);
  const desde = registros === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, registros);
  const btn = (deshabilitado: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 6, border: `1px solid ${t.border}`, background: deshabilitado ? (dark ? '#1a1a1a' : '#f5f5f5') : 'transparent',
    color: deshabilitado ? t.subtle : t.fg, cursor: deshabilitado ? 'not-allowed' : 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600,
  });
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px', flexWrap: 'wrap', gap: 8 }}>
      <span style={{ fontSize: 12, color: t.subtle }}>Mostrando de {desde} a {hasta} de {registros} registros</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => onCambiar(Math.max(pagina - 1, 1))} disabled={pagina <= 1} style={btn(pagina <= 1)}>Anterior</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: t.fg, padding: '0 8px' }}>Página {pagina} de {total || 1}</span>
        <button onClick={() => onCambiar(Math.min(pagina + 1, total))} disabled={pagina >= total} style={btn(pagina >= total)}>Siguiente</button>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  titulo: string;
  mensaje: string;
  confirmarLabel: string;
  variante?: 'danger' | 'success';
  icono?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  procesando?: boolean;
  dark?: boolean;
  children?: React.ReactNode;
}> = ({ titulo, mensaje, confirmarLabel, variante = 'danger', icono, onCancel, onConfirm, procesando, dark = false, children }) => {
  const t = tema(dark);
  const color = variante === 'danger' ? DANGER : SUCCESS;
  const bgSuave = variante === 'danger' ? DANGER_BG : SUCCESS_BG;
  const txt = variante === 'danger' ? DANGER_TXT : SUCCESS_TXT;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440, borderRadius: 16, backgroundColor: t.cardBg, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'center', paddingBottom: 24, fontFamily: FONT }}>
        <div style={{ height: 4, background: `linear-gradient(135deg, ${color}, ${color}AA)` }} />
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: bgSuave, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            {icono ?? <AlertTriangle size={28} color={color} />}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: t.fg, margin: '0 0 12px' }}>{titulo}</h3>
          <div style={{ background: bgSuave, border: `1px solid ${color}4D`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: txt, fontWeight: 600, marginBottom: 16 }}>
            {mensaje}
          </div>
          {children}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onCancel} disabled={procesando} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', background: dark ? '#2A2A2A' : '#EAEAEA', color: t.fg, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
              Cancelar
            </button>
            <button onClick={onConfirm} disabled={procesando} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: color, color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: procesando ? 'wait' : 'pointer', opacity: procesando ? 0.7 : 1, fontFamily: FONT }}>
              {procesando ? 'Procesando...' : confirmarLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
