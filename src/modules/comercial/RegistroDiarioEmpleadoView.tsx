import React, { useState } from 'react';
import { 
  Send, Save, Check, PlayCircle 
} from 'lucide-react';
import { toast } from 'sonner';

const GOLD       = "#C9A227";
const SUCCESS    = "#28A745";
const SUCCESS_BG = "#DCF7E6";

export interface TareaAsignadaEmpleado {
  id_detalle_produccion: string;
  id_remision: string; // Actualizado: ya no usamos orden de pedido
  pieza: string;
  maquina: string;
  cantidadAsignada: number;
  cantidadProducida: number | '';
  fechaAsignada: string;
  guardado: boolean;
}

export const IdBadge: React.FC<{ id: string }> = ({ id }) => (
  <span style={{
    background: GOLD + "1F", color: GOLD,
    fontFamily: "monospace", fontWeight: 700, fontSize: 11,
    padding: "3px 8px", borderRadius: 6, display: "inline-flex"
  }}>
    {id}
  </span>
);

export const TableShell: React.FC<{ headers: string[]; children: React.ReactNode; dark?: boolean }> = ({ headers, children, dark }) => (
  <div style={{
    borderRadius: 12, overflow: 'hidden',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
    background: dark ? '#1E1E1E' : '#FFFFFF'
  }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'Montserrat, sans-serif' }}>
      <thead>
        <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
          {headers.map((h, i) => (
            <th key={i} style={{
              textTransform: 'uppercase', fontSize: 10, fontWeight: 700,
              color: GOLD, letterSpacing: '0.05em', padding: '12px 14px'
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

interface RegistroDiarioEmpleadoViewProps {
  dark?: boolean;
}

export const RegistroDiarioEmpleadoView: React.FC<RegistroDiarioEmpleadoViewProps> = ({ dark = false }) => {
  const [tareas, setTareas] = useState<TareaAsignadaEmpleado[]>([
    { 
      id_detalle_produccion: 'DET-001', 
      id_remision: 'REM-101', 
      pieza: 'Manga Larga', 
      maquina: 'Plana Industrial', 
      cantidadAsignada: 100, 
      cantidadProducida: '', 
      fechaAsignada: new Date().toISOString().split('T')[0], 
      guardado: false 
    },
    { 
      id_detalle_produccion: 'DET-002', 
      id_remision: 'REM-102', 
      pieza: 'Cuello Polo', 
      maquina: 'Fileteadora', 
      cantidadAsignada: 80, 
      cantidadProducida: '', 
      fechaAsignada: new Date().toISOString().split('T')[0], 
      guardado: false 
    }
  ]);

  const [jornadaEnviada, setJornadaEnviada] = useState(false);
  const [modalConfirmarEnvio, setModalConfirmarEnvio] = useState(false);

  const handleCantidadChange = (id: string, val: string) => {
    if (jornadaEnviada) return;
    const num = val === '' ? '' : Number(val);
    if (typeof num === 'number' && num > 10000) {
      toast.warning('¿Estás seguro de la cantidad? Es un valor muy alto.');
    }
    setTareas(tareas.map(t => t.id_detalle_produccion === id ? { ...t, cantidadProducida: num } : t));
  };

  const handleGuardarTarea = (id: string) => {
    const tarea = tareas.find(t => t.id_detalle_produccion === id);
    if (!tarea || tarea.cantidadProducida === '' || Number(tarea.cantidadProducida) <= 0) {
      toast.error('Debes ingresar una cantidad válida antes de guardar');
      return;
    }
    setTareas(tareas.map(t => t.id_detalle_produccion === id ? { ...t, guardado: true } : t));
    toast.success('Cantidad guardada temporalmente');
  };

  const handleEnviarJornada = () => {
    const hayGuardados = tareas.some(t => t.guardado);
    if (!hayGuardados) {
      toast.error('No hay producción guardada para reportar');
      setModalConfirmarEnvio(false);
      return;
    }
    setJornadaEnviada(true);
    setModalConfirmarEnvio(false);
    toast.success('Jornada enviada y consolidada exitosamente.');
  };

  const fg = dark ? "#F8F9FA" : "#121212";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div style={{ backgroundColor: dark ? "#121212" : "#F8F9FA", color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: GOLD, fontFamily: 'Montserrat, sans-serif' }}>
            Mis Tareas Asignadas — Producción
          </h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
            Información cargada automáticamente por sistema. Ingresa tu producción diaria.
          </p>
        </div>

        <div>
          {!jornadaEnviada ? (
            <button
              onClick={() => setModalConfirmarEnvio(true)}
              style={{
                background: `linear-gradient(135deg, ${SUCCESS}, #218838)`,
                color: '#FFFFFF', fontWeight: 700, fontSize: 14, borderRadius: 10,
                padding: '10px 20px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Montserrat, sans-serif'
              }}
            >
              <Send size={16} /> Enviar Registro Diario
            </button>
          ) : (
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 999,
              backgroundColor: SUCCESS_BG, color: SUCCESS, display: 'inline-flex', alignItems: 'center', gap: 6
            }}>
              <Check size={14} /> Jornada Consolidada (Solo Lectura)
            </span>
          )}
        </div>
      </div>

      {/* Cabecera actualizada a Remisión */}
      <TableShell headers={['ID DETALLE', 'REMISIÓN', 'PIEZA', 'MÁQUINA', 'FECHA AUTOMÁTICA', 'CANTIDAD PRODUCIDA', 'ESTADO']} dark={dark}>
        {tareas.map((tarea) => (
          <tr key={tarea.id_detalle_produccion} style={{ borderBottom: `1px solid ${borderNormal}` }}>
            <td style={{ padding: '12px 14px' }}><IdBadge id={tarea.id_detalle_produccion} /></td>
            <td style={{ padding: '12px 14px' }}><IdBadge id={tarea.id_remision} /></td>
            <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: fg }}>{tarea.pieza}</td>
            <td style={{ padding: '12px 14px', fontSize: 12, color: subtle }}>{tarea.maquina}</td>
            <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: 'monospace', color: subtle }}>{tarea.fechaAsignada}</td>
            
            <td style={{ padding: '12px 14px' }}>
              <input
                type="number"
                min="0"
                disabled={jornadaEnviada || tarea.guardado}
                placeholder="Ej: 30"
                value={tarea.cantidadProducida}
                onChange={(e) => handleCantidadChange(tarea.id_detalle_produccion, e.target.value)}
                style={{
                  width: '100px', padding: '8px 10px', borderRadius: 8, fontSize: 13,
                  backgroundColor: jornadaEnviada || tarea.guardado ? (dark ? '#222' : '#EAEAEA') : inputBg,
                  color: fg, border: `1px solid ${borderNormal}`, outline: 'none', fontFamily: 'Montserrat, sans-serif',
                  cursor: jornadaEnviada || tarea.guardado ? 'not-allowed' : 'text'
                }}
              />
            </td>

            <td style={{ padding: '12px 14px' }}>
              {tarea.guardado ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: SUCCESS, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Check size={14} /> Guardado
                </span>
              ) : (
                !jornadaEnviada && (
                  <button
                    onClick={() => handleGuardarTarea(tarea.id_detalle_produccion)}
                    style={{
                      background: 'transparent', border: `1.5px solid ${GOLD}`, color: GOLD,
                      borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontFamily: 'Montserrat, sans-serif'
                    }}
                  >
                    <Save size={12} /> Guardar
                  </button>
                )
              )}
            </td>
          </tr>
        ))}
      </TableShell>

      {modalConfirmarEnvio && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 420, borderRadius: 16, backgroundColor: cardBg, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', textAlign: 'center', paddingBottom: 24 }}>
            <div style={{ height: 4, background: `linear-gradient(135deg, ${SUCCESS}, #218838)` }} />
            <div style={{ padding: '24px 24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: SUCCESS_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <PlayCircle size={28} color={SUCCESS} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: fg, margin: '0 0 12px', fontFamily: 'Montserrat, sans-serif' }}>
                ¿Finalizar y enviar jornada?
              </h3>
              <div style={{ background: SUCCESS_BG, border: `1px solid ${SUCCESS}4D`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#155724', fontWeight: 600, marginBottom: 20 }}>
                Se enviarán tus registros diarios y se cerrará tu edición a modo de solo lectura.
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setModalConfirmarEnvio(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', background: dark ? '#2A2A2A' : '#EAEAEA', color: fg, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEnviarJornada}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: SUCCESS, color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                >
                  Sí, enviar reporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};