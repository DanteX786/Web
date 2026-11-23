import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, UploadCloud, Receipt, FileSignature, X, BadgeCheck, Loader2, Info, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { mensajeError } from '../../../shared/utils/api';
import { coincideBusqueda } from '../../../shared/utils/busqueda';
import { ACEPTA_ARCHIVOS, errorArchivo, urlArchivo } from '../../../shared/utils/archivos';
import { entregaService, type Entrega } from '../services/entregaService';

const GOLD         = "#C9A227";
const DANGER       = "#DC3545";
const SUCCESS      = "#28A745";
const INFO         = "#4A90E2";
const WARNING      = "#FD7E14";

interface RemisionEntregaProps {
  dark?: boolean;
}

const pesos = (n: number) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const esPdf = (url: string) => url.toLowerCase().endsWith('.pdf');

export const IdBadge: React.FC<{ id: string, color?: string }> = ({ id, color = GOLD }) => (
  <span style={{
    background: color + "1F", color: color,
    fontFamily: "monospace", fontWeight: 700, fontSize: 11,
    padding: "3px 8px", borderRadius: 6, display: "inline-flex"
  }}>
    {id}
  </span>
);

export const ActionCircleBtn: React.FC<{
  variant?: 'blue' | 'gold' | 'danger' | 'success';
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}> = ({ variant = 'gold', onClick, children, title, disabled = false }) => {
  const color = disabled ? '#9A9A9A'
    : variant === 'blue' ? INFO : variant === 'danger' ? DANGER : variant === 'success' ? SUCCESS : GOLD;

  return (
  <button
    onClick={onClick} title={title} disabled={disabled}
    style={{
      width: 32, height: 32, borderRadius: '50%', backgroundColor: 'transparent',
      border: `1.5px solid ${color}`, color, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
    }}
  >
    {children}
  </button>
  );
};

export function RemisionEntregaView({ dark = false }: RemisionEntregaProps) {
  const [modalArchivo, setModalArchivo] = useState<{ url: string; titulo: string } | null>(null);
  const [paraPagar, setParaPagar] = useState<Entrega | null>(null);

  const bg = dark ? "#121212" : "#F8F9FA";
  const fg = dark ? "#F8F9FA" : "#121212";
  const cardBg = dark ? "#1E1E1E" : "#FFFFFF";
  const inputBg = dark ? "#2A2A2A" : "#F3F3F5";
  const borderNormal = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const subtle = dark ? "#9A9A9A" : "#6B6B6B";

  // ---------- Datos de la API ----------
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [porEntregar, setPorEntregar] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
  try {
    const [lista, pendientes] = await Promise.all([entregaService.listar(), entregaService.remisionesPorEntregar()]);
    setEntregas(lista);
    setPorEntregar(pendientes.length);
  } catch (error) {
    toast.error(`No se pudieron cargar las entregas: ${mensajeError(error)}`);
  } finally {
    setCargando(false);
  }
  };

  useEffect(() => { cargar(); }, []);

  const reemplazarEnLista = (ent: Entrega) =>
  setEntregas(prev => prev.map(e => e.id_entrega === ent.id_entrega ? ent : e));

  const [busqueda, setBusqueda] = useState('');

  // ---------- Soportes: se suben UNA sola vez (no se reemplazan ni se editan) ----------
  type TipoSoporte = 'firma' | 'factura';
  const [subida, setSubida] = useState<{ entrega: Entrega; tipo: TipoSoporte; archivo: File } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [elegirPara, setElegirPara] = useState<{ entrega: Entrega; tipo: TipoSoporte } | null>(null);

  const abrirSelector = (entrega: Entrega, tipo: TipoSoporte) => {
  setElegirPara({ entrega, tipo });
  document.getElementById('soporte-upload-input')?.click();
  };

  const archivoElegido = (archivo: File | undefined) => {
  if (!archivo || !elegirPara) return;
  const error = errorArchivo(archivo);
  if (error) { toast.error(error); return; }
  setSubida({ ...elegirPara, archivo });
  };

  const confirmarSubida = async () => {
  if (!subida) return;
  setSubiendo(true);
  try {
    const { entrega, tipo, archivo } = subida;
    reemplazarEnLista(tipo === 'firma'
      ? await entregaService.subirRemisionFirmada(entrega.id_entrega, archivo)
      : await entregaService.subirComprobante(entrega.id_entrega, archivo));
    toast.success(tipo === 'firma'
      ? `Remisión firmada de ${entrega.id_entrega} subida.`
      : `Factura de ${entrega.id_entrega} subida. Ya puede marcarla como Pagada.`);
    setSubida(null);
  } catch (error) {
    toast.error(mensajeError(error));
  } finally {
    setSubiendo(false);
  }
  };

  const confirmarPago = async () => {
  if (!paraPagar) return;
  try {
    reemplazarEnLista(await entregaService.marcarPagada(paraPagar.id_entrega));
    toast.success(`Entrega ${paraPagar.id_entrega} marcada como Pagada.`);
  } catch (error) {
    toast.error(mensajeError(error));
  } finally {
    setParaPagar(null);
  }
  };

  const entregasFiltradas = useMemo(() => {
  // Busca en todos los campos de la entrega (todas las columnas de la tabla)
  return entregas.filter(e => coincideBusqueda(busqueda, [
    e.id_entrega, e.id_remision, e.cliente, e.nit_cliente,
    e.cantidad_entregada, e.precio_total, e.fecha_finalizacion,
    e.remision_firmada_url ? 'Firma adjunta' : 'Firma no adjunta',
    e.comprobante_pago_url ? 'Comprobante adjunto' : 'Comprobante no adjunto',
    e.estado,
  ]));
  }, [entregas, busqueda]);

  // Lógica para seccionar los datos por página
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [busqueda]);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = entregasFiltradas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(entregasFiltradas.length / itemsPerPage);

  const botonArchivo = (url: string | null, titulo: string, tipo: 'firma' | 'pago') => {
  const completa = urlArchivo(url);
  if (!completa) return <span style={{ fontSize: 11, color: subtle }}>{tipo === 'firma' ? 'No adjunta' : 'No adjunto'}</span>;
  const color = tipo === 'firma' ? INFO : GOLD;
  return (
    <button
      onClick={() => setModalArchivo({ url: completa, titulo })}
      style={{ background: `${color}15`, color, border: `1px solid ${color}40`, borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      {tipo === 'firma' ? <><FileSignature size={14} /> Ver Firma</> : <><Receipt size={14} /> Ver Factura</>}
    </button>
  );
  };

  return (
    <div style={{ backgroundColor: bg, color: fg, minHeight: '100vh', padding: 24, fontFamily: 'Montserrat, sans-serif', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: fg }}>Remisión de Entrega</h2>
          <p style={{ fontSize: 13, color: subtle, margin: 0 }}>Gestiona las entregas finales, firmas y pagos del taller.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} color={subtle} style={{ position: 'absolute', left: 12 }} />
            <input type="text" placeholder="Buscar en cualquier campo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ padding: '8px 12px 8px 36px', borderRadius: 8, border: `1px solid ${borderNormal}`, background: cardBg, color: fg, fontSize: 13, outline: 'none', width: '220px' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: subtle, background: `${INFO}10`, border: `1px solid ${INFO}30`, padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>
        <Info size={16} color={INFO} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Las entregas llegan desde <b>Remisiones</b> con el botón de camión cuando la producción queda <b>Terminada</b>.
          El precio (prendas × costo por prenda) y la fecha los pone el sistema y <b>no se pueden editar</b>.
          La remisión firmada y la factura se suben una sola vez.
          {porEntregar > 0 && <> Hay <b>{porEntregar}</b> remisión(es) Terminada(s) esperando ser enviadas.</>}
        </span>
      </div>

      <div style={{ borderRadius: 12, overflow: 'auto', border: `1px solid ${borderNormal}`, background: cardBg }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: dark ? '#252525' : '#FAFAFA', borderBottom: `2px solid ${GOLD}` }}>
              {['ID ENTREGA', 'ID REMISIÓN', 'CLIENTE', 'CANTIDAD', 'PRECIO TOTAL', 'FECHA ENTREGA', 'REM. FIRMADA', 'FACTURA / PAGO', 'ESTADO', 'ACCIONES'].map(h => (
                <th key={h} style={{ fontSize: 10, fontWeight: 700, color: GOLD, padding: '12px 14px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: subtle }}><Loader2 size={18} style={{ verticalAlign: 'middle', marginRight: 8 }} />Cargando entregas...</td></tr>
            ) : entregasFiltradas.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: subtle }}>No hay entregas registradas.</td></tr>
            ) : (
              currentItems.map(ent => {
                const pagada = ent.estado === 'Pagada';
                return (
                <tr key={ent.id_entrega} style={{ borderBottom: `1px solid ${borderNormal}` }}>
                  <td style={{ padding: '12px 14px' }}><IdBadge id={ent.id_entrega} color={GOLD} /></td>
                  <td style={{ padding: '12px 14px' }}><IdBadge id={ent.id_remision} color={INFO} /></td>
                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 600 }}>{ent.cliente}</td>
                  <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700 }}>{ent.cantidad_entregada}</td>
                  <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: fg }}>{pesos(ent.precio_total)}</td>
                  <td style={{ padding: '12px 14px', fontSize: 11, color: subtle }}>{ent.fecha_finalizacion}</td>
                  <td style={{ padding: '12px 14px' }}>{botonArchivo(ent.remision_firmada_url, `Remisión firmada · ${ent.id_entrega}`, 'firma')}</td>
                  <td style={{ padding: '12px 14px' }}>{botonArchivo(ent.comprobante_pago_url, `Factura / comprobante · ${ent.id_entrega}`, 'pago')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', backgroundColor: pagada ? `${SUCCESS}20` : `${WARNING}20`, color: pagada ? SUCCESS : WARNING }}>{ent.estado}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionCircleBtn variant="blue" onClick={() => abrirSelector(ent, 'firma')} disabled={pagada || !!ent.remision_firmada_url} title={ent.remision_firmada_url ? 'La remisión firmada ya se subió (no se puede reemplazar)' : pagada ? 'Ya está pagada' : 'Subir remisión firmada'}><FileSignature size={14} /></ActionCircleBtn>
                      <ActionCircleBtn variant="gold" onClick={() => abrirSelector(ent, 'factura')} disabled={pagada || !!ent.comprobante_pago_url} title={ent.comprobante_pago_url ? 'La factura ya se subió (no se puede reemplazar)' : pagada ? 'Ya está pagada' : 'Subir factura / comprobante de pago'}><Receipt size={14} /></ActionCircleBtn>
                      <ActionCircleBtn variant="success" onClick={() => setParaPagar(ent)} disabled={pagada || !ent.comprobante_pago_url} title={pagada ? 'Ya está pagada' : !ent.comprobante_pago_url ? 'Suba primero la factura' : 'Marcar como pagada'}><BadgeCheck size={14} /></ActionCircleBtn>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      {/* CONTROLES DE PAGINACIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 8px' }}>
        <span style={{ fontSize: 12, color: subtle, fontFamily: 'Montserrat, sans-serif' }}>
          Mostrando de {entregasFiltradas.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, entregasFiltradas.length)} de {entregasFiltradas.length} registros
        </span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px', borderRadius: 6, border: `1px solid ${borderNormal}`,
              background: currentPage === 1 ? (dark ? '#1a1a1a' : '#f5f5f5') : 'transparent',
              color: currentPage === 1 ? subtle : fg,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600
            }}
          >
            Anterior
          </button>

          <span style={{ fontSize: 13, fontWeight: 700, color: fg, fontFamily: 'Montserrat, sans-serif', padding: '0 8px' }}>
            Página {currentPage} de {totalPages || 1}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            style={{
              padding: '6px 12px', borderRadius: 6, border: `1px solid ${borderNormal}`,
              background: (currentPage === totalPages || totalPages === 0) ? (dark ? '#1a1a1a' : '#f5f5f5') : 'transparent',
              color: (currentPage === totalPages || totalPages === 0) ? subtle : fg,
              cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 600
            }}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* MODAL DE PREVISUALIZACIÓN DE ARCHIVO */}
      {modalArchivo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: cardBg, borderRadius: 16, width: '100%', maxWidth: 700, overflow: 'hidden', border: `1px solid ${borderNormal}`, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${borderNormal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: fg }}>{modalArchivo.titulo}</span>
              <button onClick={() => setModalArchivo(null)} style={{ background: 'transparent', border: 'none', color: subtle, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24, textAlign: 'center', maxHeight: '70vh', overflowY: 'auto' }}>
              {esPdf(modalArchivo.url) ? (
                <iframe src={modalArchivo.url} title={modalArchivo.titulo} style={{ width: '100%', height: '60vh', border: `1px solid ${borderNormal}`, borderRadius: 8 }} />
              ) : (
                <img src={modalArchivo.url} alt={modalArchivo.titulo} style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 8, objectFit: 'contain', border: `1px solid ${borderNormal}` }} />
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${borderNormal}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: dark ? '#181818' : '#F1F1F1' }}>
              <a href={modalArchivo.url} target="_blank" rel="noreferrer" style={{ color: INFO, fontSize: 13, fontWeight: 700 }}>Abrir en otra pestaña</a>
              <button onClick={() => setModalArchivo(null)} style={{ background: GOLD, color: '#121212', fontWeight: 700, fontSize: 13, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE PAGO */}
      {paraPagar && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: cardBg, borderRadius: 16, width: '100%', maxWidth: 420, padding: 32, textAlign: 'center', border: `1px solid ${borderNormal}`, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${SUCCESS}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: SUCCESS }}>
              <BadgeCheck size={32} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: fg, margin: '0 0 12px' }}>¿Confirmar pago de {paraPagar.id_entrega}?</h3>
            <p style={{ fontSize: 13, color: subtle, margin: '0 0 24px' }}>
              {paraPagar.cliente} · {pesos(paraPagar.precio_total)}. Después de marcarla como pagada queda cerrada.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setParaPagar(null)} style={{ flex: 1, backgroundColor: inputBg, color: fg, border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarPago} style={{ flex: 1, backgroundColor: SUCCESS, color: '#FFF', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Sí, está pagada</button>
            </div>
          </div>
        </div>
      )}

      {/* SELECTOR DE ARCHIVO (uno solo para firma y factura) */}
      <input
        id="soporte-upload-input"
        type="file"
        accept={ACEPTA_ARCHIVOS}
        style={{ display: 'none' }}
        onChange={(e) => { archivoElegido(e.target.files?.[0]); e.target.value = ''; }}
      />

      {/* CONFIRMACIÓN DE SUBIDA (no se puede reemplazar después) */}
      {subida && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: cardBg, borderRadius: 16, width: '100%', maxWidth: 440, padding: 32, textAlign: 'center', border: `1px solid ${borderNormal}`, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${subida.tipo === 'firma' ? INFO : GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: subida.tipo === 'firma' ? INFO : GOLD }}>
              <UploadCloud size={32} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: fg, margin: '0 0 12px' }}>
              ¿Subir {subida.tipo === 'firma' ? 'la remisión firmada' : 'la factura'} de {subida.entrega.id_entrega}?
            </h3>
            <p style={{ fontSize: 13, color: fg, fontWeight: 700, margin: '0 0 8px', wordBreak: 'break-all' }}>{subida.archivo.name}</p>
            <p style={{ fontSize: 12, color: DANGER, margin: '0 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Lock size={14} /> Una vez subido no se podrá reemplazar ni eliminar.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setSubida(null)} disabled={subiendo} style={{ flex: 1, backgroundColor: inputBg, color: fg, border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmarSubida} disabled={subiendo} style={{ flex: 1, backgroundColor: SUCCESS, color: '#FFF', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: subiendo ? 'wait' : 'pointer', opacity: subiendo ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {subiendo && <Loader2 size={16} />} {subiendo ? 'Subiendo...' : 'Sí, subir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
