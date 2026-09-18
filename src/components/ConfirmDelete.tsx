import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const DANGER = "#DC3545";
const DANGER_BG = "#FDECEA";

interface ConfirmDeleteProps {
  onCancel: () => void;
  onConfirm: () => void;
  dark?: boolean;
  message?: string;
}

export const ConfirmDelete: React.FC<ConfirmDeleteProps> = ({ onCancel, onConfirm, dark, message = "Registro eliminado con éxito" }) => {
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";

  const handleConfirmAction = () => {
    onConfirm();
    toast.success(message);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: cardBg, borderRadius: 16,
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(201,162,39,0.2)'
      }}>
        <div style={{ height: 4, background: `linear-gradient(135deg, ${DANGER}, #f56565)` }} />
        
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: DANGER_BG,
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <AlertTriangle size={28} color={DANGER} />
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 8px' }}>¿Eliminar registro?</h3>
          <p style={{ fontSize: 13, color: subtle, margin: '0 0 20px' }}>Esta acción no se puede deshacer y borrará los datos del sistema permanentemente.</p>

          <div style={{ background: DANGER_BG, border: `1px solid ${DANGER}4D`, borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#721c24' }}>Advertencia: Se perderá la vinculación de este elemento.</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#e0e0e0',
                color: '#333', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmAction}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: DANGER,
                color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer'
              }}
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};