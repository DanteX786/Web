import React, { useEffect, useRef, useState } from 'react';
import {
  FileText, Factory, ClipboardCheck, Truck, Target, Eye, Award, Clock3, Users, MapPin,
  Sun, Moon, ArrowRight, Menu, X, Sparkles, CheckCircle2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Footer } from './Footer';

import logo_blanco from '../../../public/images/logo blanco.png';
import logo_negro from '../../../public/images/logo negro.png';

// ==========================================
// MISMA PALETA DEL APLICATIVO (dorado Eslabón + Montserrat)
// ==========================================
const GOLD = '#C9A227';
const GOLD_LIGHT = '#E6B84A';
const FONT = 'Montserrat, sans-serif';
const DEGRADADO = `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`;

interface LandingPageProps {
  onNavigateToLogin?: () => void;
  onNavigateToLicencias?: () => void;
}

const uniformGallery = [
  {
    title: 'Uniformes Industriales y Operativos',
    desc: 'Confección de alta durabilidad con costuras reforzadas y telas de alta resistencia para trabajo pesado.',
    tag: 'Industrial',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    productos: [
      { nombre: 'Overoles y camisas de trabajo', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Dotación para técnicos', image: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Prendas de alta resistencia', image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  {
    title: 'Dotación Empresarial y Ejecutiva',
    desc: 'Diseños modernos y elegantes ajustados a la línea corporativa e identidad visual de su organización.',
    tag: 'Corporativo',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    productos: [
      { nombre: 'Trajes ejecutivos', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Blazers y chalecos', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Camisas formales', image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Camisas institucionales', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  {
    title: 'Uniformes Médicos y Sanitarios',
    desc: 'Prendas antifluido con acabado ergonómico para garantizar el máximo confort y protección biomédica.',
    tag: 'Salud',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
    productos: [
      { nombre: 'Uniformes antifluido', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Uniformes de enfermería', image: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Batas de laboratorio', image: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Ropa quirúrgica', image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=800&q=80' },
    ],
  },
  {
    title: 'Fast Fashion y Línea Casual',
    desc: 'Producción ágil de colecciones de moda en tendencia para marcas y tiendas, con tiempos cortos y lotes flexibles.',
    tag: 'Fast Fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    productos: [
      { nombre: 'Colecciones de temporada', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Camisetas estampadas', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Busos y sacos', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80' },
      { nombre: 'Joggers y pantalones', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80' },
    ],
  },
];

/** Misma foto en alta resolución para la portada a todo lo ancho. */
const fotoGrande = (url: string) => url.replace('w=800', 'w=1920');

const pasos = [
  { Icono: FileText, titulo: 'Envías tu remisión', texto: 'Desde tu cuenta registras las prendas, tallas, cantidades, la ficha técnica y los insumos que nos envías.' },
  { Icono: ClipboardCheck, titulo: 'La revisamos y aprobamos', texto: 'Validamos la información y te confirmamos la aprobación para iniciar la producción.' },
  { Icono: Factory, titulo: 'Confeccionamos', texto: 'Asignamos cada pieza a nuestros operarios y registramos el avance diario de la producción.' },
  { Icono: Truck, titulo: 'Entregamos', texto: 'Entregamos tus prendas con la remisión de entrega firmada por ambas partes.' },
];

const pilares = [
  { Icono: Target, titulo: 'Misión', texto: 'Confeccionar uniformes, dotaciones y prendas de moda de alta calidad, cumpliendo los tiempos pactados y siguiendo con precisión las especificaciones de cada cliente.' },
  { Icono: Eye, titulo: 'Visión', texto: 'Ser en 2030 un taller de confección reconocido en Antioquia por su cumplimiento, su calidad y el uso de tecnología en la gestión de sus procesos.' },
  { Icono: Award, titulo: 'Valores', texto: 'Calidad en cada costura, puntualidad, compromiso con el cliente, trabajo en equipo y responsabilidad.' },
];

const cifras = [
  { Icono: Clock3, valor: '+2 años', texto: 'de experiencia' },
  { Icono: Users, valor: 'Empresas', texto: 'y marcas aliadas' },
  { Icono: MapPin, valor: 'Medellín', texto: 'Antioquia' },
];

const enlacesMenu = [
  { id: 'catalogo', texto: 'Servicios' },
  { id: 'proceso', texto: 'Cómo trabajamos' },
  { id: 'nosotros', texto: 'Sobre nosotros' },
];

/** Aparece suavemente (sube y se aclara) cuando entra en pantalla. Respeta "reducir movimiento". */
const Aparecer: React.FC<{ children: React.ReactNode; retraso?: number; style?: React.CSSProperties }> = ({ children, retraso = 0, style }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${retraso}ms, transform 0.6s ease ${retraso}ms`,
    }}>
      {children}
    </div>
  );
};

/**
 * Portada: carrusel a todo lo ancho que se desliza horizontalmente.
 * Rota sola cada 6 s, tiene flechas, puntos y se puede deslizar con el dedo.
 * El texto de la portada (children) queda fijo encima de las fotos.
 */
const CarruselPortada: React.FC<{ dark: boolean; c: Record<string, string>; children: React.ReactNode }> = ({ dark, c, children }) => {
  const [actual, setActual] = useState(0);
  const toqueX = useRef<number | null>(null);
  const total = uniformGallery.length;
  const ir = (i: number) => setActual((i + total) % total);
  const INTERVALO = 6000;

  useEffect(() => {
    const t = window.setTimeout(() => setActual((a) => (a + 1) % total), INTERVALO);
    return () => window.clearTimeout(t);
  }, [actual, total]);

  const item = uniformGallery[actual];
  const flecha = (lado: 'izq' | 'der') => (
    <button
      className="lp-flecha"
      onClick={() => ir(actual + (lado === 'izq' ? -1 : 1))}
      aria-label={lado === 'izq' ? 'Anterior' : 'Siguiente'}
      style={{
        position: 'absolute', top: '50%', [lado === 'izq' ? 'left' : 'right']: 20, transform: 'translateY(-50%)',
        width: 46, height: 46, borderRadius: '50%', cursor: 'pointer', zIndex: 3,
        background: dark ? '#1E1E1E' : '#FFFFFF',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.08)'}`, color: dark ? '#FFFFFF' : '#121212',
        boxShadow: dark ? 'none' : '0 6px 18px rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {lado === 'izq' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  );

  return (
    <section
      className="lp-portada"
      style={{ position: 'relative', overflow: 'hidden', minHeight: 'min(86vh, 720px)', display: 'flex', alignItems: 'center', background: c.bg }}
      onTouchStart={(e) => { toqueX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (toqueX.current === null) return;
        const dx = e.changedTouches[0].clientX - toqueX.current;
        if (Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1));
        toqueX.current = null;
      }}
    >
      {/* Pista de fotos que se desliza horizontalmente */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, display: 'flex', width: `${total * 100}%`,
        transform: `translateX(-${(actual * 100) / total}%)`, transition: 'transform 0.9s cubic-bezier(0.65, 0, 0.35, 1)',
      }}>
        {uniformGallery.map((u, i) => (
          <div key={u.title} style={{ position: 'relative', width: `${100 / total}%`, height: '100%', overflow: 'hidden' }}>
            <img src={fotoGrande(u.image)} alt="" loading={i === 0 ? 'eager' : 'lazy'} style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            }} />
          </div>
        ))}
      </div>

      {/* Degradado negro desde la izquierda para que el texto blanco se lea (igual en claro y oscuro) */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(90deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.62) 45%, rgba(10,10,10,0.18) 100%)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(520px 320px at 8% 100%, ${GOLD}33, transparent 70%)` }} />

      {flecha('izq')}
      {flecha('der')}

      {/* Contenido fijo encima */}
      <div className="lp-hero" style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '80px 84px 110px',
        display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 40, alignItems: 'end' }}>
        <div>{children}</div>

        {/* Nombre de la prenda actual, sin recuadro, sobre la foto */}
        <div className="lp-info-slide" style={{ justifySelf: 'end', textAlign: 'right', maxWidth: 340, paddingBottom: 6 }}>
          <div key={actual} style={{ animation: 'lp-entrar 0.6s ease' }}>
            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: '#121212', background: DEGRADADO,
              padding: '4px 12px', borderRadius: 999, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{item.tag}</span>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: '10px 0 0', lineHeight: 1.3, textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}>{item.title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}>
              {String(actual + 1).padStart(2, '0')}
            </span>
            <div style={{ width: 140, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.55)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              <div key={`b${actual}`} style={{ height: '100%', background: DEGRADADO, borderRadius: 3,
                animation: `lp-barra-tiempo ${INTERVALO}ms linear forwards` }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}>
              {String(total).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Puntos */}
      <div style={{ position: 'absolute', bottom: 34, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 3 }}>
        {uniformGallery.map((u, i) => (
          <button key={u.title} onClick={() => ir(i)} aria-label={`Ver ${u.tag}`} style={{
            width: i === actual ? 30 : 9, height: 9, borderRadius: 9, border: 'none', padding: 0, cursor: 'pointer',
            background: i === actual ? DEGRADADO : 'rgba(255,255,255,0.85)', boxShadow: '0 1px 4px rgba(0,0,0,0.45)', transition: 'width 0.3s ease',
          }} />
        ))}
      </div>
    </section>
  );
};

/** Tarjeta de una línea de confección: carrusel interno de productos y zoom al pasar el cursor. */
const TarjetaLinea: React.FC<{
  item: (typeof uniformGallery)[number];
  paso: number;                       // contador compartido: todas las tarjetas cambian a la vez
  onPaso: (n: number) => void;
  c: Record<string, string>;
}> = ({ item, paso, onPaso, c }) => {
  const [encima, setEncima] = useState(false);
  const total = item.productos.length;
  const actual = paso % total;
  const ir = (i: number) => onPaso(paso + (i - actual));

  const flecha = (lado: 'izq' | 'der') => (
    <button
      onClick={(e) => { e.stopPropagation(); ir(actual + (lado === 'izq' ? -1 : 1)); }}
      aria-label={lado === 'izq' ? 'Producto anterior' : 'Producto siguiente'}
      style={{
        position: 'absolute', top: '50%', [lado === 'izq' ? 'left' : 'right']: 10, transform: 'translateY(-50%)',
        width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: 2,
        background: 'rgba(255,255,255,0.92)', color: '#121212', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: encima ? 1 : 0, transition: 'opacity 0.25s ease',
      }}
    >
      {lado === 'izq' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );

  return (
    <article
      className="lp-linea"
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      style={{ height: '100%', borderRadius: 20, overflow: 'hidden', border: `1px solid ${c.borde}`, background: c.card, position: 'relative' }}
    >
      <div style={{ position: 'relative', height: 240, overflow: 'hidden' }}>
        {/* Pista de fotos */}
        <div style={{ display: 'flex', height: '100%', width: `${total * 100}%`, transform: `translateX(-${(actual * 100) / total}%)`,
          transition: 'transform 0.7s cubic-bezier(0.65, 0, 0.35, 1)' }}>
          {item.productos.map((pr) => (
            <div key={pr.nombre} style={{ width: `${100 / total}%`, height: '100%', overflow: 'hidden' }}>
              <img className="lp-linea-img" src={pr.image} alt={pr.nombre} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)', pointerEvents: 'none' }} />
        <span style={{ position: 'absolute', left: 14, top: 14, background: 'rgba(255,255,255,0.92)', color: '#121212', fontSize: 11, fontWeight: 800,
          padding: '5px 10px', borderRadius: 999, letterSpacing: '0.04em' }}>{item.tag}</span>
        {flecha('izq')}
        {flecha('der')}
        {/* Nombre del producto + puntos */}
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <span key={actual} style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.5)', animation: 'lp-entrar 0.4s ease' }}>
            {item.productos[actual].nombre}
          </span>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0, paddingBottom: 4 }}>
            {item.productos.map((pr, i) => (
              <button key={pr.nombre} onClick={() => ir(i)} aria-label={`Ver ${pr.nombre}`} style={{
                width: i === actual ? 18 : 6, height: 6, borderRadius: 6, border: 'none', padding: 0, cursor: 'pointer',
                background: i === actual ? DEGRADADO : 'rgba(255,255,255,0.65)', transition: 'width 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: 22 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: c.fg }}>{item.title}</h3>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: c.subtle }}>{item.desc}</p>
      </div>
    </article>
  );
};

/** Las tarjetas de "Lo que confeccionamos" comparten un mismo contador para cambiar sincronizadas. */
const GaleriaLineas: React.FC<{ c: Record<string, string> }> = ({ c }) => {
  const CICLO = 12; // múltiplo común de 3 y 4 productos, para que el contador nunca sea negativo
  const [paso, setPaso] = useState(0);
  const cambiar = (n: number) => setPaso(((n % CICLO) + CICLO) % CICLO);

  useEffect(() => {
    const t = window.setTimeout(() => setPaso((p) => (p + 1) % CICLO), 4000);
    return () => window.clearTimeout(t);
  }, [paso]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 22 }}>
      {uniformGallery.map((item, i) => (
        <Aparecer key={item.title} retraso={i * 120}>
          <TarjetaLinea item={item} paso={paso} onPaso={cambiar} c={c} />
        </Aparecer>
      ))}
    </div>
  );
};

export default function LandingPage({ onNavigateToLogin, onNavigateToLicencias }: LandingPageProps) {
  const [dark, setDark] = useState<boolean>(() => {
    try { return localStorage.getItem('landing-oscuro') === '1'; } catch { return false; }
  });
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [conScroll, setConScroll] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('landing-oscuro', dark ? '1' : '0'); } catch { /* sin almacenamiento */ }
  }, [dark]);

  useEffect(() => {
    const alMover = () => setConScroll(window.scrollY > 8);
    alMover();
    window.addEventListener('scroll', alMover, { passive: true });
    return () => window.removeEventListener('scroll', alMover);
  }, []);

  const c = {
    bg: dark ? '#121212' : '#F8F9FA',
    card: dark ? '#1E1E1E' : '#FFFFFF',
    alt: dark ? '#181818' : '#FFFFFF',
    fg: dark ? '#F8F9FA' : '#121212',
    subtle: dark ? '#9A9A9A' : '#6B6B6B',
    borde: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    suave: dark ? 'rgba(201,162,39,0.14)' : 'rgba(201,162,39,0.12)',
  };

  const irALogin = () => onNavigateToLogin?.();
  const navegar = (destino: string) => {
    setMenuAbierto(false);
    if (destino === 'login') { irALogin(); return; }
    if (destino === 'licencias') { onNavigateToLicencias?.(); return; }
    if (destino === 'inicio') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.getElementById(destino)?.scrollIntoView({ behavior: 'smooth' });
  };

  const titulo = (etiqueta: string, texto: string, descripcion?: string) => (
    <Aparecer style={{ textAlign: 'center', marginBottom: 44 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        <span style={{ width: 18, height: 2, background: DEGRADADO, borderRadius: 2 }} /> {etiqueta} <span style={{ width: 18, height: 2, background: DEGRADADO, borderRadius: 2 }} />
      </span>
      <h2 className="lp-h2" style={{ fontSize: 34, fontWeight: 800, color: c.fg, margin: '10px 0 0', letterSpacing: '-0.02em' }}>{texto}</h2>
      {descripcion && <p style={{ fontSize: 15, color: c.subtle, margin: '12px auto 0', maxWidth: 620, lineHeight: 1.7 }}>{descripcion}</p>}
    </Aparecer>
  );

  const botonPrincipal = (texto: string, onClick: () => void, grande = false) => (
    <button className="lp-btn-dorado" onClick={onClick} style={{
      background: DEGRADADO, color: '#121212', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: FONT,
      fontWeight: 800, fontSize: grande ? 15 : 14, padding: grande ? '14px 26px' : '10px 18px',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 20px rgba(201,162,39,0.30)',
    }}>
      {texto} <ArrowRight size={grande ? 18 : 16} />
    </button>
  );

  return (
    <div style={{ backgroundColor: c.bg, color: c.fg, minHeight: '100vh', fontFamily: FONT, overflowX: 'hidden', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
      <style>{`
        html, body { margin: 0; padding: 0; background: ${c.bg}; }
        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        .lp-enlace { position: relative; }
        .lp-enlace::after { content: ''; position: absolute; left: 12px; right: 12px; bottom: 4px; height: 2px; border-radius: 2px;
          background: ${DEGRADADO}; transform: scaleX(0); transform-origin: center; transition: transform 0.25s ease; }
        .lp-enlace:hover { color: ${c.fg} !important; }
        .lp-enlace:hover::after { transform: scaleX(1); }
        .lp-btn-dorado { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .lp-btn-dorado:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(201,162,39,0.40) !important; filter: brightness(1.03); }
        .lp-btn-borde { transition: background-color 0.2s ease, transform 0.2s ease; }
        .lp-btn-borde:hover { background-color: ${c.suave} !important; transform: translateY(-2px); }
        .lp-card { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .lp-card:hover { transform: translateY(-6px); border-color: ${GOLD}66 !important;
          box-shadow: ${dark ? '0 18px 40px rgba(0,0,0,0.5)' : '0 18px 40px rgba(0,0,0,0.10)'}; }
        .lp-card img { transition: transform 0.6s ease; }
        .lp-card:hover img { transform: scale(1.07); }
        .lp-linea { transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease, border-color 0.35s ease; will-change: transform; }
        .lp-linea:hover { transform: scale(1.06); z-index: 5; border-color: ${GOLD}88 !important;
          box-shadow: ${dark ? '0 26px 50px rgba(0,0,0,0.6)' : '0 26px 50px rgba(0,0,0,0.16)'}; }
        .lp-linea-img { transition: transform 0.8s ease; }
        .lp-linea:hover .lp-linea-img { transform: scale(1.08); }
        @media (hover: none) { .lp-linea:hover { transform: none; } }
        .lp-paso:hover .lp-num { background: ${DEGRADADO} !important; color: #121212 !important; }
        @keyframes lp-flotar { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes lp-barra-tiempo { from { width: 0; } to { width: 100%; } }
        @keyframes lp-entrar { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .lp-flecha { transition: background-color 0.2s ease; }
        .lp-flecha:hover { background-color: rgba(201,162,39,0.85) !important; color: #121212 !important; }
        .lp-btn-claro { transition: background-color 0.2s ease, transform 0.2s ease; }
        .lp-btn-claro:hover { background-color: rgba(255,255,255,0.22) !important; transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) { .lp-flota { animation: none !important; } }
        @media (max-width: 900px) {
          .lp-hero { grid-template-columns: 1fr !important; text-align: center; padding: 64px 20px 90px !important; }
          .lp-info-slide { display: none !important; }
          .lp-flecha { top: auto !important; bottom: 22px; transform: none !important; width: 38px !important; height: 38px !important; }
          .lp-hero-acciones, .lp-hero-confianza { justify-content: center; }
          .lp-nosotros { grid-template-columns: 1fr !important; }
          .lp-menu-escritorio { display: none !important; }
          .lp-menu-boton { display: inline-flex !important; }
          .lp-pasos-linea { display: none; }
        }
        @media (max-width: 600px) {
          .lp-h1 { font-size: 32px !important; }
          .lp-h2 { font-size: 26px !important; }
          .lp-login-nav { display: none !important; }
          .lp-cifras { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ================= 1. BARRA DE NAVEGACIÓN ================= */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: dark ? 'rgba(18,18,18,0.82)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${conScroll ? c.borde : 'transparent'}`,
        boxShadow: conScroll ? (dark ? '0 6px 20px rgba(0,0,0,0.35)' : '0 6px 20px rgba(0,0,0,0.05)') : 'none',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease',
      }}>
        <div style={{ height: 3, background: DEGRADADO }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <button onClick={() => navegar('inicio')} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <img src={dark ? logo_negro : logo_blanco} alt="Eslabón" style={{ height: 50, width: 'auto', objectFit: 'contain' }} />
          </button>

          <nav className="lp-menu-escritorio" style={{ display: 'flex', gap: 4 }}>
            {enlacesMenu.map((e) => (
              <button key={e.id} className="lp-enlace" onClick={() => navegar(e.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', fontFamily: FONT,
                fontSize: 14, fontWeight: 600, color: c.subtle, transition: 'color 0.2s ease',
              }}>
                {e.texto}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setDark(!dark)} title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} style={{
              width: 40, height: 40, borderRadius: '50%', border: `1px solid ${c.borde}`, background: c.card, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {dark ? <Sun size={18} color={GOLD} /> : <Moon size={18} color={c.fg} />}
            </button>
            <span className="lp-login-nav">{botonPrincipal('Iniciar Sesión', irALogin)}</span>
            <button className="lp-menu-boton" onClick={() => setMenuAbierto(!menuAbierto)} title="Menú" style={{
              display: 'none', width: 40, height: 40, borderRadius: 10, border: `1px solid ${c.borde}`, background: c.card,
              cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
            }}>
              {menuAbierto ? <X size={18} color={c.fg} /> : <Menu size={18} color={c.fg} />}
            </button>
          </div>
        </div>

        {/* Menú en celular */}
        {menuAbierto && (
          <div style={{ borderTop: `1px solid ${c.borde}`, padding: '10px 20px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {enlacesMenu.map((e) => (
              <button key={e.id} onClick={() => navegar(e.id)} style={{ textAlign: 'left', background: 'none', border: 'none', padding: '12px 4px', fontSize: 15, fontWeight: 600, color: c.fg, cursor: 'pointer', fontFamily: FONT }}>
                {e.texto}
              </button>
            ))}
            <div style={{ marginTop: 6 }}>{botonPrincipal('Iniciar Sesión', irALogin)}</div>
          </div>
        )}
      </header>

      {/* ================= 2. PORTADA: CARRUSEL A TODO LO ANCHO ================= */}
      <CarruselPortada dark={dark} c={c}>
        <Aparecer>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,162,39,0.22)', color: GOLD_LIGHT, border: `1px solid ${GOLD}88`,
            fontWeight: 800, fontSize: 12, padding: '7px 14px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Sparkles size={14} /> Taller de Confección
          </span>
          <h1 className="lp-h1" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.03em', margin: '20px 0 18px', color: '#FFFFFF', textShadow: '0 2px 18px rgba(0,0,0,0.35)' }}>
            Confección de{' '}
            <span style={{ background: DEGRADADO, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', textShadow: 'none' }}>Uniformes, Dotaciones y Fast Fashion</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.9)', margin: '0 0 30px', maxWidth: 560, textShadow: '0 2px 18px rgba(0,0,0,0.35)' }}>
            Envía tus remisiones en línea, sigue el estado de tu pedido y recibe tus prendas a tiempo, con la calidad que tu empresa o tu marca necesita.
          </p>
          <div className="lp-hero-acciones" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {botonPrincipal('Comenzar Pedido', irALogin, true)}
            <button className="lp-btn-claro" onClick={() => navegar('catalogo')} style={{
              background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,0.7)', borderRadius: 12, cursor: 'pointer', fontFamily: FONT,
              fontWeight: 700, fontSize: 15, padding: '13px 24px',
            }}>
              Ver lo que confeccionamos
            </button>
          </div>
          <div className="lp-hero-confianza" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 30 }}>
            {['Entregas a tiempo', 'Calidad en cada costura'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', textShadow: '0 2px 18px rgba(0,0,0,0.35)' }}>
                <CheckCircle2 size={16} color={GOLD_LIGHT} /> {t}
              </span>
            ))}
          </div>
        </Aparecer>
      </CarruselPortada>

      {/* ================= 3. GALERÍA ================= */}
      <section id="catalogo" style={{ scrollMarginTop: 80, padding: '80px 20px', background: c.alt, borderTop: `1px solid ${c.borde}`, borderBottom: `1px solid ${c.borde}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {titulo('Nuestra Experiencia', 'Lo que confeccionamos')}
          <GaleriaLineas c={c} />
        </div>
      </section>

      {/* ================= 4. CÓMO TRABAJAMOS ================= */}
      <section id="proceso" style={{ scrollMarginTop: 80, padding: '80px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {titulo('Cómo trabajamos', 'De tu remisión a la entrega')}
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 24 }}>
            <div className="lp-pasos-linea" aria-hidden style={{ position: 'absolute', top: 32, left: '12%', right: '12%', height: 2,
              background: `repeating-linear-gradient(90deg, ${GOLD}80 0 10px, transparent 10px 18px)` }} />
            {pasos.map((paso, i) => (
              <Aparecer key={paso.titulo} retraso={i * 120}>
                <div className="lp-paso" style={{ position: 'relative', textAlign: 'center', padding: '0 8px' }}>
                  <div className="lp-num" style={{
                    width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: c.card, border: `2px solid ${GOLD}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, position: 'relative',
                    boxShadow: `0 0 0 6px ${c.bg}`, transition: 'background 0.3s ease, color 0.3s ease',
                  }}>
                    <paso.Icono size={26} />
                    <span style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: '50%', background: DEGRADADO,
                      color: '#121212', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: c.fg }}>{paso.titulo}</h3>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: c.subtle }}>{paso.texto}</p>
                </div>
              </Aparecer>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 5. SOBRE NOSOTROS ================= */}
      <section id="nosotros" style={{ scrollMarginTop: 80, padding: '80px 20px', background: c.alt, borderTop: `1px solid ${c.borde}` }}>
        <div className="lp-nosotros" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 48, alignItems: 'center' }}>
          <Aparecer>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              <span style={{ width: 18, height: 2, background: DEGRADADO, borderRadius: 2 }} /> Sobre nosotros
            </span>
            <h2 className="lp-h2" style={{ fontSize: 34, fontWeight: 800, color: c.fg, margin: '10px 0 18px', letterSpacing: '-0.02em' }}>Taller y Confecciones CDS</h2>
            <p style={{ color: c.subtle, lineHeight: 1.8, margin: '0 0 14px', fontSize: 15 }}>
              Somos una microempresa de Medellín dedicada a la confección de uniformes empresariales, dotaciones
              y prendas de fast fashion. Trabajamos con empresas de sectores como el automotriz y la seguridad privada,
              y con marcas de ropa que necesitan producir sus colecciones en tiempos cortos, siempre a partir de
              sus telas cortadas y fichas técnicas.
            </p>
            <p style={{ color: c.subtle, lineHeight: 1.8, margin: '0 0 26px', fontSize: 15 }}>
              Nuestro diferencial es el <b style={{ color: c.fg }}>cumplimiento estricto de los tiempos de entrega</b> y
              los altos estándares de calidad en cada acabado. Con <b style={{ color: c.fg }}>Eslabón</b>, nuestros clientes
              envían sus remisiones en línea y siguen el estado de su pedido en todo momento.
            </p>
            <div className="lp-cifras" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {cifras.map((cf) => (
                <div key={cf.texto} className="lp-card" style={{ padding: 18, borderRadius: 16, border: `1px solid ${c.borde}`, background: c.card, textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, margin: '0 auto 8px', borderRadius: 12, background: c.suave, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <cf.Icono size={20} color={GOLD} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: c.fg }}>{cf.valor}</div>
                  <div style={{ fontSize: 12, color: c.subtle }}>{cf.texto}</div>
                </div>
              ))}
            </div>
          </Aparecer>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pilares.map((p, i) => (
              <Aparecer key={p.titulo} retraso={i * 120}>
                <div className="lp-card" style={{ display: 'flex', gap: 16, padding: 22, borderRadius: 18, border: `1px solid ${c.borde}`, background: c.card, borderLeft: `4px solid ${GOLD}` }}>
                  <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 12, background: c.suave, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p.Icono size={22} color={GOLD} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: c.fg }}>{p.titulo}</h3>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: c.subtle }}>{p.texto}</p>
                  </div>
                </div>
              </Aparecer>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. LLAMADO A LA ACCIÓN ================= */}
      <section style={{ padding: '0 20px 80px', background: c.alt }}>
        <Aparecer style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: '44px 32px', textAlign: 'center',
            background: dark ? '#1E1E1E' : 'linear-gradient(135deg, #FFF8E4, #FCEFC9)', border: `1px solid ${dark ? c.borde : `${GOLD}40`}` }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(500px 220px at 50% 0%, ${GOLD}${dark ? '40' : '30'}, transparent 70%)` }} />
            <div style={{ position: 'relative' }}>
              <h2 className="lp-h2" style={{ margin: '0 0 10px', fontSize: 30, fontWeight: 800, color: c.fg, letterSpacing: '-0.02em' }}>
                ¿Listo para tu próxima producción?
              </h2>
              <p style={{ margin: '0 auto 24px', maxWidth: 560, color: dark ? '#BDBDBD' : '#5A5A5A', fontSize: 15, lineHeight: 1.7 }}>
                Uniformes, dotaciones o tu nueva colección: crea tu cuenta, envía tu remisión y sigue cada paso de la confección desde cualquier lugar.
              </p>
              {botonPrincipal('Comenzar Pedido', irALogin, true)}
            </div>
          </div>
        </Aparecer>
      </section>

      {/* ================= 7. PIE DE PÁGINA ================= */}
      <Footer variant="landing" dark={dark} onNavegar={navegar} />
    </div>
  );
}
