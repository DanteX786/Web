import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, ExternalLink, FileText, Layers, Package, Scale, Search, Server, ShieldCheck, Wrench, Globe,
  Palette, Bell, Zap, Lock, Upload, MailCheck, Network, Database,
} from 'lucide-react';

import { EMPRESA } from './Footer';
import {
  CATEGORIAS, COMPONENTES, LICENCIAS, RESUMEN_NPM,
  type Categoria, type CodigoLicencia, type Componente, type IconoGenerico,
} from '../data/licencias';
import { LOGOS } from '../data/logos';

const GOLD = '#C9A227';
const GOLD_LIGHT = '#E6B84A';
const FONT = 'Montserrat, sans-serif';

interface LicenciasViewProps {
  dark?: boolean;
  /** Si se pasa, muestra el botón "Volver" (cuando se abre desde la página pública). */
  onVolver?: () => void;
}

/** Color de cada familia de licencia (mismo criterio en chips y tarjetas). */
const colorTipo = (codigo: CodigoLicencia) => {
  const tipo = LICENCIAS[codigo].tipo;
  if (tipo === 'Copyleft débil') return '#FD7E14';
  if (tipo === 'Fuente / datos') return '#4A90E2';
  if (tipo === 'Servicio') return '#8A8A8A';
  return '#28A745';
};

const ICONO_CATEGORIA: Record<Categoria, React.ElementType> = {
  frontend: Layers, desarrollo: Wrench, backend: Server, plataforma: Globe,
};

/** Ícono para los proyectos que no tienen logo público. */
const ICONO_GENERICO: Record<IconoGenerico, React.ElementType> = {
  estilos: Palette, notificacion: Bell, navegador: Globe, rayo: Zap, servidor: Server,
  candado: Lock, archivo: Upload, correo: MailCheck, red: Network, base: Database,
};

/** Logo de la librería (o ícono genérico) dentro de un recuadro con el color de la marca. */
const LogoComponente: React.FC<{ c: Componente; fg: string }> = ({ c, fg }) => {
  const logo = c.logo ? LOGOS[c.logo] : undefined;
  const color = logo ? (logo.color || fg) : GOLD;
  const Icono = ICONO_GENERICO[c.icono ?? 'navegador'];
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${logo && logo.color ? logo.color : GOLD}1A`, border: `1px solid ${logo && logo.color ? logo.color : GOLD}33`,
    }}>
      {logo ? (
        <svg viewBox="0 0 24 24" width={20} height={20} fill={color} role="img" aria-label={`Logo de ${c.nombre}`}>
          <path d={logo.path} />
        </svg>
      ) : (
        <Icono size={19} color={color} />
      )}
    </div>
  );
};

const ChipLicencia: React.FC<{ codigo: CodigoLicencia }> = ({ codigo }) => {
  const color = colorTipo(codigo);
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
      background: `${color}1F`, color,
    }}>
      {codigo === 'Servicio' ? 'Términos del servicio' : codigo}
    </span>
  );
};

export const LicenciasView: React.FC<LicenciasViewProps> = ({ dark = false, onVolver }) => {
  const t = {
    bg: dark ? '#121212' : '#F8F9FA',
    card: dark ? '#1E1E1E' : '#FFFFFF',
    fg: dark ? '#F3F4F6' : '#121212',
    subtle: dark ? '#9CA3AF' : '#6B7280',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    input: dark ? '#2A2A2A' : '#F3F3F5',
  };

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<'todas' | Categoria>('todas');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return COMPONENTES.filter((c) =>
      (categoria === 'todas' || c.categoria === categoria) &&
      (!q || [c.nombre, c.licencia, c.uso].some((v) => v.toLowerCase().includes(q))));
  }, [busqueda, categoria]);

  // Licencias que realmente aparecen en el proyecto, con cuántos componentes listados usan cada una
  const licenciasUsadas = useMemo(() => {
    const conteo = new Map<CodigoLicencia, number>();
    COMPONENTES.forEach((c) => conteo.set(c.licencia, (conteo.get(c.licencia) ?? 0) + 1));
    RESUMEN_NPM.porLicencia.forEach((l) => { if (!conteo.has(l.licencia)) conteo.set(l.licencia, 0); });
    return [...conteo.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const kpis = [
    { Icono: Package, valor: COMPONENTES.length, texto: 'Componentes principales' },
    { Icono: Layers, valor: RESUMEN_NPM.total, texto: 'Paquetes npm en total' },
    { Icono: Scale, valor: licenciasUsadas.filter(([c]) => c !== 'Servicio').length, texto: 'Tipos de licencia' },
    { Icono: ShieldCheck, valor: '100%', texto: 'Permiten uso en el proyecto' },
  ];

  const tarjeta: React.CSSProperties = {
    background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20,
  };

  const grupos = (Object.keys(CATEGORIAS) as Categoria[])
    .map((cat) => ({ cat, items: filtrados.filter((c) => c.categoria === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <div style={{ background: t.bg, color: t.fg, minHeight: '100vh', fontFamily: FONT }}>
      {/* Encabezado */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT}, ${GOLD})` }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
        {onVolver && (
          <button onClick={onVolver} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: `1px solid ${GOLD}`,
            color: GOLD, borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: FONT, marginBottom: 24,
          }}>
            <ArrowLeft size={16} /> Volver al inicio
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212',
          }}>
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Licencias de software</h1>
            <div style={{ fontSize: 14, color: t.subtle }}>
              Componentes de terceros que hacen posible {EMPRESA.marca} y las licencias bajo las que se usan.
            </div>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, margin: '28px 0' }}>
          {kpis.map(({ Icono, valor, texto }) => (
            <div key={texto} style={{ ...tarjeta, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${GOLD}1F`, color: GOLD, flexShrink: 0,
              }}>
                <Icono size={20} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{valor}</div>
                <div style={{ fontSize: 12, color: t.subtle }}>{texto}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Buscador y filtros */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
            <Search size={16} color={t.subtle} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, licencia o uso"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px', borderRadius: 10,
                border: `1px solid ${t.border}`, background: t.input, color: t.fg, fontSize: 13, fontFamily: FONT, outline: 'none',
              }}
            />
          </div>
          {(['todas', ...Object.keys(CATEGORIAS)] as ('todas' | Categoria)[]).map((c) => {
            const activo = categoria === c;
            return (
              <button key={c} onClick={() => setCategoria(c)} style={{
                padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                border: `1px solid ${activo ? GOLD : t.border}`,
                background: activo ? `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})` : 'transparent',
                color: activo ? '#121212' : t.subtle,
              }}>
                {c === 'todas' ? 'Todas' : CATEGORIAS[c].titulo}
              </button>
            );
          })}
        </div>

        {/* Componentes por categoría */}
        {grupos.length === 0 && (
          <div style={{ ...tarjeta, textAlign: 'center', color: t.subtle, fontSize: 14 }}>
            No hay componentes que coincidan con la búsqueda.
          </div>
        )}
        {grupos.map(({ cat, items }) => {
          const Icono = ICONO_CATEGORIA[cat];
          return (
            <section key={cat} style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Icono size={18} color={GOLD} />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{CATEGORIAS[cat].titulo}</h2>
                <span style={{ fontSize: 12, color: t.subtle }}>({items.length})</span>
              </div>
              <div style={{ fontSize: 13, color: t.subtle, marginBottom: 14 }}>{CATEGORIAS[cat].descripcion}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {items.map((c: Componente) => (
                  <a key={c.nombre} href={c.url} target="_blank" rel="noopener noreferrer" style={{
                    ...tarjeta, padding: 16, textDecoration: 'none', color: t.fg, display: 'flex', flexDirection: 'column', gap: 8,
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <LogoComponente c={c} fg={t.fg} />
                      <div style={{ fontWeight: 700, fontSize: 14, flex: 1, minWidth: 0 }}>{c.nombre}</div>
                      <ExternalLink size={14} color={t.subtle} style={{ flexShrink: 0, marginTop: 2 }} />
                    </div>
                    <div style={{ fontSize: 12, color: t.subtle, flex: 1 }}>{c.uso}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <ChipLicencia codigo={c.licencia} />
                      {c.version && <span style={{ fontSize: 11, color: t.subtle, fontFamily: 'monospace' }}>v{c.version}</span>}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}

        {/* Licencias explicadas */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Scale size={18} color={GOLD} />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>¿Qué permite cada licencia?</h2>
          </div>
          <div style={{ fontSize: 13, color: t.subtle, marginBottom: 14 }}>
            Resumen informativo. El texto oficial de cada licencia está en el enlace.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {licenciasUsadas.filter(([c]) => c !== 'Servicio').map(([codigo]) => {
              const info = LICENCIAS[codigo];
              const enNpm = RESUMEN_NPM.porLicencia.find((l) => l.licencia === codigo)?.cantidad;
              return (
                <div key={codigo} style={{ ...tarjeta, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{info.nombre}</div>
                    <ChipLicencia codigo={codigo} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: colorTipo(codigo), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {info.tipo}
                  </div>
                  <div style={{ fontSize: 13, color: t.subtle, lineHeight: 1.6, flex: 1 }}>{info.resumen}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ color: t.subtle }}>{enNpm ? `${enNpm} paquetes npm` : ''}</span>
                    <a href={info.url} target="_blank" rel="noopener noreferrer"
                      style={{ color: GOLD, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Ver texto oficial <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Nota final */}
        <div style={{ ...tarjeta, borderColor: `${GOLD}55`, background: dark ? 'rgba(201,162,39,0.06)' : 'rgba(201,162,39,0.05)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <ShieldCheck size={20} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13, lineHeight: 1.7, color: t.subtle }}>
              <b style={{ color: t.fg }}>{EMPRESA.marca}</b> fue desarrollado por aprendices del SENA (Tecnólogo en Análisis y
              Desarrollo de Software, ficha 3228140) para {EMPRESA.razonSocial}. Todas las librerías de terceros se usan
              sin modificar y bajo licencias que permiten su uso en este proyecto. Los avisos de copyright de cada paquete se
              conservan en sus carpetas dentro de <code>node_modules</code> y del entorno de Python. El listado completo de
              paquetes npm proviene de <code>package-lock.json</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenciasView;
