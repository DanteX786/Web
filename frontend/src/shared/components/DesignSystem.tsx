import React from 'react';
import { Pencil, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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

export const fontFam = "Montserrat, sans-serif";

export function nextId(prefix: string, existing: string[]): string {
  const nums = existing.map(id => parseInt(id.replace(prefix + "-", "")) || 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

export const IdBadge = ({ id, dark = false }: { id: string, dark?: boolean }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    background: GOLD + (dark ? "33" : "1F"), color: GOLD,
    fontFamily: "monospace", fontWeight: 700, fontSize: 11,
    padding: "3px 8px", borderRadius: 6,
  }}>{id}</span>
);

export const IconBtn = ({ type, onClick, dark = false }: { type: 'edit' | 'delete' | 'view', onClick: () => void, dark?: boolean }) => {
  const borderColor = type === 'view' ? INFO : GOLD;
  return (
    <button onClick={onClick} title={type === 'edit' ? 'Editar' : type === 'delete' ? 'Eliminar' : 'Ver'} style={{ background: dark ? "rgba(255,255,255,0.03)" : "transparent", border: `1px solid ${borderColor}`, borderRadius: "50%", width: 34, height: 34, padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {type === 'edit' && <Pencil size={14} style={{ color: GOLD }} />}
      {type === 'delete' && <Trash2 size={14} style={{ color: GOLD }} />}
      {type === 'view' && <Eye size={14} style={{ color: INFO }} />}
    </button>
  );
};

export const ConfirmDelete = ({ onCancel, onConfirm, message, dark = false }: { onCancel: ()=>void, onConfirm: ()=>void, message: string, dark?: boolean }) => {
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const dangerBgModal = dark ? "rgba(220, 53, 69, 0.15)" : DANGER_BG;
  const dangerTxtModal = dark ? "#F28B82" : DANGER_TXT;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 400, background: cardBg, borderRadius: 16, overflow: 'hidden', border: `1px solid ${borderNormal}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ height: 4, background: `linear-gradient(135deg, ${DANGER}, #f56565)` }} />
        <div style={{ padding: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, background: dangerBgModal, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={28} color={DANGER} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 4px 0', fontFamily: fontFam }}>¿Eliminar registro?</h3>
            <p style={{ fontSize: 13, color: subtle, margin: 0, fontFamily: fontFam }}>Esta acción no se puede deshacer.</p>
          </div>
          <div style={{ background: dangerBgModal, border: `1px solid ${DANGER}4D`, borderRadius: 10, padding: '10px 14px', color: dangerTxtModal, fontSize: 12, fontFamily: fontFam, width: '100%', boxSizing: 'border-box' }}>
            El registro se eliminará de forma permanente.
          </div>
          <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 8 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${borderNormal}`, background: inputBg, color: fg, fontWeight: 600, cursor: 'pointer', fontFamily: fontFam }}>Cancelar</button>
            <button onClick={() => { onConfirm(); toast.success(message); }} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: DANGER, color: '#FFF', fontWeight: 600, cursor: 'pointer', fontFamily: fontFam }}>Sí, eliminar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Field = ({ label, dark = false, children }: { label: string, dark?: boolean, children: React.ReactNode }) => {
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtle, marginBottom: 6, fontFamily: fontFam }}>
        {label}
      </label>
      {children}
    </div>
  );
};

export const FInput = ({ dark = false, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { dark?: boolean }) => {
  const fg = dark ? "#F8F9FA" : "#121212";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  return (
    <input 
      {...props}
      style={{ width: "100%", padding: "10px 12px", background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, fontSize: 14, color: fg, fontFamily: fontFam, outline: "none", boxSizing: "border-box", ...props.style }}
      onFocus={e => e.currentTarget.style.border = `1px solid ${GOLD}`}
      onBlur={e => e.currentTarget.style.border = `1px solid ${borderNormal}`} 
    />
  );
};