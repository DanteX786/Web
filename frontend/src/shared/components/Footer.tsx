import React from 'react';
import {
  MapPin, Phone, Mail, Clock, Camera, Globe, MessageCircle, Music2, Briefcase, ArrowUp, ShieldCheck,
} from 'lucide-react';

import logo_blanco from '../../../public/images/logo blanco.png';
import logo_negro from '../../../public/images/logo negro.png';

// ==========================================
// DATOS DE LA EMPRESA (editar aquí)
// Las redes sociales son de ejemplo hasta que el taller cree las suyas.
// ==========================================
export const EMPRESA = {
  marca: 'Eslabón',
  razonSocial: 'Taller y Confecciones CDS',
  eslogan: 'Confección de uniformes y dotaciones con calidad y cumplimiento.',
  direccion: 'Cra 24C #90-279, Medellín, Antioquia',
  telefono: '+57 313 524 7497',
  telefonoLink: 'tel:+573135247497',
  correo: 'eslabonadcje@gmail.com',
  horario: ['Lunes a viernes: 7:00 a. m. – 5:00 p. m.', 'Sábados: 8:00 a. m. – 12:00 m.'],
  version: '1.0.0',
};

export const REDES = [
  { nombre: 'Instagram', usuario: '@eslabon.cds', url: 'https://instagram.com/eslabon.cds', Icono: Camera },
  { nombre: 'Facebook', usuario: 'Eslabón Confecciones', url: 'https://facebook.com/eslabon.cds', Icono: Globe },
  { nombre: 'WhatsApp', usuario: '+57 313 524 7497', url: 'https://wa.me/573135247497', Icono: MessageCircle },
  { nombre: 'TikTok', usuario: '@eslabon.cds', url: 'https://tiktok.com/@eslabon.cds', Icono: Music2 },
  { nombre: 'LinkedIn', usuario: 'Taller y Confecciones CDS', url: 'https://linkedin.com/company/eslabon-cds', Icono: Briefcase },
];

const GOLD = '#C9A227';
const GOLD_LIGHT = '#E6B84A';
const FONT = 'Montserrat, sans-serif';

interface FooterProps {
  /** "landing": pie de página completo. "app": barra compacta dentro del aplicativo. */
  variant: 'landing' | 'app';
  dark?: boolean;
  /** Solo landing: navegar a una sección (#id) o al inicio de sesión. */
  onNavegar?: (destino: string) => void;
}

/** Botón redondo de red social (ícono + nombre en el tooltip). */
const BotonRed: React.FC<{ red: (typeof REDES)[number]; dark: boolean; tamano?: number }> = ({ red, dark, tamano = 36 }) => {
  const { Icono } = red;
  return (
    <a
      href={red.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${red.nombre}: ${red.usuario}`}
      aria-label={red.nombre}
      style={{
        width: tamano, height: tamano, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${GOLD}55`, color: GOLD, background: dark ? 'rgba(201,162,39,0.08)' : 'rgba(201,162,39,0.06)',
        transition: 'all 0.2s ease', textDecoration: 'none',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#121212'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = dark ? 'rgba(201,162,39,0.08)' : 'rgba(201,162,39,0.06)'; e.currentTarget.style.color = GOLD; e.currentTarget.style.transform = 'none'; }}
    >
      <Icono size={Math.round(tamano * 0.45)} />
    </a>
  );
};

export const Footer: React.FC<FooterProps> = ({ variant, dark = false, onNavegar }) => {
  const anio = new Date().getFullYear();
  const fg = dark ? '#F3F4F6' : '#121212';
  const subtle = dark ? '#9CA3AF' : '#6B7280';
  const border = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  // ================= PIE COMPACTO DENTRO DEL APLICATIVO =================
  if (variant === 'app') {
    return (
      <footer style={{
        borderTop: `1px solid ${border}`, background: dark ? '#161616' : '#FFFFFF', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        fontFamily: FONT, fontSize: 12, color: subtle,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>© {anio} <b style={{ color: fg }}>{EMPRESA.marca}</b> · {EMPRESA.razonSocial}</span>
          <span style={{ background: `${GOLD}1F`, color: GOLD, fontWeight: 700, fontSize: 10, padding: '2px 8px', borderRadius: 999 }}>
            v{EMPRESA.version}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <a href={`mailto:${EMPRESA.correo}`} style={{ color: subtle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Mail size={13} color={GOLD} /> Soporte: {EMPRESA.correo}
          </a>
          <div style={{ display: 'flex', gap: 6 }}>
            {REDES.slice(0, 3).map((r) => <BotonRed key={r.nombre} red={r} dark={dark} tamano={26} />)}
          </div>
        </div>
      </footer>
    );
  }

  // ================= PIE COMPLETO DE LA LANDING =================
  const titulo: React.CSSProperties = {
    fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: GOLD, margin: '0 0 16px',
  };
  const enlace: React.CSSProperties = {
    background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: subtle, fontSize: 14, fontFamily: FONT,
    textAlign: 'left', textDecoration: 'none', transition: 'color 0.2s',
  };
  const ir = (destino: string) => (onNavegar ? onNavegar(destino) : document.getElementById(destino)?.scrollIntoView({ behavior: 'smooth' }));
  const hover = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = GOLD; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.color = subtle; },
  };

  return (
    <footer style={{ background: dark ? '#0F0F0F' : '#FFFFFF', borderTop: `1px solid ${border}`, fontFamily: FONT, width: '100%', marginTop: 'auto' }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT}, ${GOLD})` }} />

      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '56px 24px 32px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40,
      }}>
        {/* Marca */}
        <div>
          <img src={dark ? logo_negro : logo_blanco} alt={EMPRESA.marca} style={{ height: 64, width: 'auto', objectFit: 'contain', marginBottom: 12 }} />
          <p style={{ color: subtle, fontSize: 14, lineHeight: 1.7, margin: '0 0 20px' }}>
            <b style={{ color: fg }}>{EMPRESA.razonSocial}</b>. {EMPRESA.eslogan}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {REDES.map((r) => <BotonRed key={r.nombre} red={r} dark={dark} />)}
          </div>
        </div>

        {/* Navegación */}
        <div>
          <h4 style={titulo}>Navegación</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button style={enlace} {...hover} onClick={() => ir('inicio')}>Inicio</button>
            <button style={enlace} {...hover} onClick={() => ir('catalogo')}>Servicios</button>
            <button style={enlace} {...hover} onClick={() => ir('proceso')}>Cómo trabajamos</button>
            <button style={enlace} {...hover} onClick={() => ir('nosotros')}>Sobre nosotros</button>
            <button style={enlace} {...hover} onClick={() => ir('login')}>Iniciar sesión</button>
          </div>
        </div>

        {/* Servicios */}
        <div>
          <h4 style={titulo}>Servicios</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: subtle, fontSize: 14 }}>
            <span>Uniformes industriales</span>
            <span>Dotación empresarial</span>
            <span>Uniformes de seguridad privada</span>
            <span>Prendas médicas antifluido</span>
            <span>Línea casual de marca propia</span>
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h4 style={titulo}>Contacto</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, color: subtle }}>
            <span style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><MapPin size={16} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} /> {EMPRESA.direccion}</span>
            <a href={EMPRESA.telefonoLink} style={{ ...enlace, display: 'flex', gap: 10, alignItems: 'center' }} {...hover}>
              <Phone size={16} color={GOLD} style={{ flexShrink: 0 }} /> {EMPRESA.telefono}
            </a>
            <a href={`mailto:${EMPRESA.correo}`} style={{ ...enlace, display: 'flex', gap: 10, alignItems: 'center', wordBreak: 'break-all' }} {...hover}>
              <Mail size={16} color={GOLD} style={{ flexShrink: 0 }} /> {EMPRESA.correo}
            </a>
            <span style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Clock size={16} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{EMPRESA.horario.map((h) => <span key={h} style={{ display: 'block' }}>{h}</span>)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div style={{ borderTop: `1px solid ${border}` }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '18px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 13, color: subtle,
        }}>
          <span>© {anio} {EMPRESA.razonSocial} · {EMPRESA.marca}. Todos los derechos reservados.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color={GOLD} /> Tus datos se tratan conforme a la Ley 1581 de 2012 (Habeas Data).
          </span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Volver arriba"
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`, color: '#121212',
            }}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
