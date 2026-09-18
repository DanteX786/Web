import React, { useState } from 'react';
import { Scissors, Plus, Pencil, Trash2, X, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const GOLD = "#C9A227";
const GOLD_LIGHT = "#E6B84A";
const DANGER = "#DC3545";
const DANGER_BG = "#FDECEA";

function nextId(prefix: string, existing: string[]): string {
  const nums = existing.map(id => parseInt(id.replace(prefix + "-", "")) || 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

interface TipoPieza {
  id: string;
  nombre: string;
  desc: string;
}

const seedPiezas: TipoPieza[] = [
  { id: "PIE-001", nombre: "Cuello", desc: "Pieza superior delantera que rodea el cuello de la prenda" },
  { id: "PIE-002", nombre: "Manga", desc: "Parte superior del brazo, larga o corta" },
  { id: "PIE-003", nombre: "Espalda", desc: "Panel posterior principal de la prenda" },
];

const IdBadge = ({ id }: { id: string }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    background: GOLD + "1F", color: GOLD,
    fontFamily: "monospace", fontWeight: 700, fontSize: 11,
    padding: "3px 8px", borderRadius: 6,
  }}>
    {id}
  </span>
);

const IconBtn = ({ variant, onClick, dark }: { variant: "edit" | "delete", onClick: () => void, dark: boolean }) => {
  const [hover, setHover] = useState(false);
  const iconColor = variant === "edit" ? (dark ? "#F8F9FA" : "#121212") : DANGER;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "transparent", border: `1px solid ${GOLD}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", opacity: hover ? 0.7 : 1, transition: "opacity 0.15s"
      }}
    >
      {variant === "edit" ? <Pencil size={14} color={iconColor} /> : <Trash2 size={14} color={iconColor} />}
    </button>
  );
};

const ConfirmDelete = ({ onCancel, onConfirm, dark, message }: { onCancel: () => void, onConfirm: () => void, dark: boolean, message: string }) => {
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 400, background: cardBg, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ height: 4, background: `linear-gradient(135deg, ${DANGER}, #f56565)` }} />
        <div style={{ padding: 28, textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: DANGER_BG, border: `1px solid ${DANGER}30`, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={28} color={DANGER} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: 0, fontFamily: "Montserrat, sans-serif" }}>¿Eliminar registro?</h3>
            <p style={{ fontSize: 13, color: subtle, margin: "4px 0 0 0", fontFamily: "Montserrat, sans-serif" }}>Esta acción no se puede deshacer.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: 10, borderRadius: 10, background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: fg, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}>
              Cancelar
            </button>
            <button onClick={() => { onConfirm(); toast.success(message); }} style={{ flex: 1, padding: 10, borderRadius: 10, background: DANGER, color: "#FFFFFF", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}>
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TiposPieza({ dark }: { dark: boolean }) {
  const [data, setData] = useState<TipoPieza[]>(seedPiezas);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<TipoPieza | null>(null);
  const [form, setForm] = useState({ id: "", nombre: "", desc: "" });
  const [deleting, setDeleting] = useState<string | null>(null);

  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const surfaceBg = dark ? "#252525" : "#F8F8F8";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const filtered = data.filter(d =>
    [d.id, d.nombre, d.desc].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    const nextCode = nextId("PIE", data.map(d => d.id));
    setForm({ id: nextCode, nombre: "", desc: "" });
    setEditing(null);
    setModal("add");
  }

  function openEdit(item: TipoPieza) {
    setForm({ id: item.id, nombre: item.nombre, desc: item.desc });
    setEditing(item);
    setModal("edit");
  }

  function save() {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (modal === "add") {
      setData([...data, { id: form.id, nombre: form.nombre, desc: form.desc }]);
      toast.success("Tipo de pieza creado");
    } else if (editing) {
      setData(data.map(d => d.id === editing.id ? { ...d, nombre: form.nombre, desc: form.desc } : d));
      toast.success("Tipo de pieza actualizado");
    }
    setModal(null);
  }

  function confirmDelete(id: string) {
    setData(data.filter(d => d.id !== id));
    setDeleting(null);
  }

  return (
    <div style={{ padding: 24, fontFamily: "Montserrat, sans-serif" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: fg, margin: 0, fontFamily: "Montserrat, sans-serif" }}>
            Tipo de Pieza
          </h2>
          <p style={{ fontSize: 13, color: subtle, marginTop: 2, margin: 0, fontFamily: "Montserrat, sans-serif" }}>
            Gestión de tipos de pieza registrados
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: subtle }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              style={{
                background: surfaceBg, border: `1px solid ${borderNormal}`,
                borderRadius: 8, padding: "8px 12px 8px 34px",
                fontSize: 13, color: fg, fontFamily: "Montserrat, sans-serif",
                outline: "none", width: 220,
              }}
            />
          </div>
          <button onClick={openAdd} style={{
            background: `linear-gradient(135deg, #C9A227, ${GOLD}, ${GOLD_LIGHT})`,
            color: "#121212", border: "none", borderRadius: 10,
            padding: "8px 16px", fontWeight: 700, fontSize: 14,
            fontFamily: "Montserrat, sans-serif", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ borderRadius: 12, overflow: "hidden", background: cardBg, border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Montserrat, sans-serif" }}>
          <thead>
            <tr style={{ background: dark ? "#252525" : "#FAFAFA", borderBottom: `2px solid ${GOLD}` }}>
              {["ID Tipo", "Nombre de la pieza", "Descripción", "Acciones"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} style={{ borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
                <td style={{ padding: "10px 12px" }}><IdBadge id={item.id} /></td>
                <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 500, color: fg }}>{item.nombre}</td>
                <td style={{ padding: "10px 12px", fontSize: 13, color: subtle, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <IconBtn variant="edit" onClick={() => openEdit(item)} dark={dark} />
                    <IconBtn variant="delete" onClick={() => setDeleting(item.id)} dark={dark} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: subtle, marginTop: 8, fontFamily: "Montserrat, sans-serif" }}>{filtered.length} registro(s) encontrado(s)</p>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 520, borderRadius: 16, background: cardBg, border: `1px solid ${GOLD}40`, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
            <div style={{ height: 2, background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT}, transparent)` }} />
            
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${GOLD}25`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: fg, fontFamily: "Montserrat, sans-serif" }}>
                {modal === "add" ? "Agregar Tipo de Pieza" : "Editar Tipo de Pieza"}
              </span>
              <button onClick={() => setModal(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: subtle }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: subtle, marginBottom: 6 }}>
                    {modal === "add" ? "Código (Auto)" : "Código de Pieza"}
                  </label>
                  <input
                    value={form.id} disabled
                    style={{ width: "100%", padding: "10px 12px", background: surfaceBg, border: `1px solid ${borderNormal}`, borderRadius: 8, fontSize: 14, color: subtle, fontFamily: "Montserrat, sans-serif", outline: "none", boxSizing: "border-box", cursor: "not-allowed" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: subtle, marginBottom: 6 }}>
                    Nombre de la Pieza *
                  </label>
                  <input
                    value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                    placeholder="Ej: Cuello"
                    style={{ width: "100%", padding: "10px 12px", background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, fontSize: 14, color: fg, fontFamily: "Montserrat, sans-serif", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: subtle, marginBottom: 6 }}>
                  Descripción
                </label>
                <textarea
                  value={form.desc} onChange={e => setForm({...form, desc: e.target.value})}
                  placeholder="Descripción de la pieza"
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", background: inputBg, border: `1px solid ${borderNormal}`, borderRadius: 8, fontSize: 14, color: fg, fontFamily: "Montserrat, sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: `1px solid ${GOLD}25`, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ padding: "10px 20px", borderRadius: 10, background: dark ? "#2A2A2A" : "#E8E8E8", color: fg, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}>
                Cancelar
              </button>
              <button onClick={save} style={{ padding: "10px 24px", borderRadius: 10, background: `linear-gradient(135deg, #C9A227, ${GOLD}, ${GOLD_LIGHT})`, color: "#121212", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "Montserrat, sans-serif" }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDelete dark={dark} message="Tipo de pieza eliminado" onCancel={() => setDeleting(null)} onConfirm={() => confirmDelete(deleting)} />
      )}
    </div>
  );
}