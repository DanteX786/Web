import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Tooltip,
  GlobalStyles
} from '@mui/material';
import { FileText, Factory, ClipboardCheck, Truck, Target, Eye, Award, Clock3, Users, MapPin } from 'lucide-react';
import { Footer } from './Footer';

// --- ICONOS SVG PERSONALIZADOS ---
const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

interface LandingPageProps {
  onNavigateToLogin?: () => void;
}

export default function LandingPage({ onNavigateToLogin }: LandingPageProps) {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const themeColors = {
    bgPage: darkMode ? '#121212' : '#F8F9FA',
    bgCard: darkMode ? '#1E1E1E' : '#FFFFFF',
    bgInput: darkMode ? '#2D2D2D' : '#F9FAFB',
    border: darkMode ? '#333333' : '#E5E7EB',
    textPrimary: darkMode ? '#F3F4F6' : '#121212',
    textSecondary: darkMode ? '#9CA3AF' : '#6B7280',
    primary: '#D4A017',
    primaryHover: '#C59210',
    badgeBg: darkMode ? 'rgba(212, 160, 23, 0.15)' : '#FEF3C7',
    uploadBg: darkMode ? '#1A1813' : '#FFFCF5',
    uploadBorder: darkMode ? '#5A4610' : '#F3E8C4',
  };

  const handleLoginRedirect = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      console.log('Redirigiendo a Iniciar Sesión...');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const uniformGallery = [
    {
      title: 'Uniformes Industriales y Operativos',
      desc: 'Confección de alta durabilidad con costuras reforzadas y telas de alta resistencia para trabajo pesado.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Dotación Empresarial y Ejecutiva',
      desc: 'Diseños modernos y elegantes ajustados a la línea corporativa e identidad visual de su organización.',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Uniformes Médicos y Sanitarios',
      desc: 'Prendas antifluido con acabado ergonómico para garantizar el máximo confort y protección biomédica.',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const pasos = [
    { Icono: FileText, titulo: 'Envías tu remisión', texto: 'Desde tu cuenta registras las prendas, tallas, cantidades, la ficha técnica y los insumos que nos envías.' },
    { Icono: ClipboardCheck, titulo: 'La revisamos y aprobamos', texto: 'Validamos la información y te confirmamos la aprobación para iniciar la producción.' },
    { Icono: Factory, titulo: 'Confeccionamos', texto: 'Asignamos cada pieza a nuestros operarios y registramos el avance diario de la producción.' },
    { Icono: Truck, titulo: 'Entregamos', texto: 'Entregamos tus prendas con la remisión de entrega firmada por ambas partes.' },
  ];

  const pilares = [
    { Icono: Target, titulo: 'Misión', texto: 'Confeccionar uniformes y dotaciones de alta calidad, cumpliendo los tiempos pactados y siguiendo con precisión las especificaciones de cada cliente.' },
    { Icono: Eye, titulo: 'Visión', texto: 'Ser en 2030 un taller de confección reconocido en Antioquia por su cumplimiento, su calidad y el uso de tecnología en la gestión de sus procesos.' },
    { Icono: Award, titulo: 'Valores', texto: 'Calidad en cada costura, puntualidad, compromiso con el cliente, trabajo en equipo y responsabilidad.' },
  ];

  const cifras = [
    { Icono: Clock3, valor: '+2 años', texto: 'de experiencia' },
    { Icono: Users, valor: 'Empresas', texto: 'y marcas aliadas' },
    { Icono: MapPin, valor: 'Medellín', texto: 'Antioquia' },
  ];

  const navegar = (destino: string) => {
    if (destino === 'login') { handleLoginRedirect(); return; }
    if (destino === 'inicio') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.getElementById(destino)?.scrollIntoView({ behavior: 'smooth' });
  };

  const enlacesMenu = [
    { id: 'catalogo', texto: 'Servicios' },
    { id: 'proceso', texto: 'Cómo trabajamos' },
    { id: 'nosotros', texto: 'Sobre nosotros' },
  ];

  return (
    <Box
      sx={{
        backgroundColor: themeColors.bgPage,
        minHeight: '100vh',
        width: '100%',
        fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", sans-serif',
        color: themeColors.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        overflowX: 'hidden'
      }}
    >
      {/* ELIMINA BORDES Y MÁRGENES NATIVOS DEL NAVEGADOR */}
      <GlobalStyles
        styles={{
          'html, body': {
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            width: '100%',
            overflowX: 'hidden',
            backgroundColor: themeColors.bgPage
          },
          '*, *::before, *::after': {
            boxSizing: 'inherit'
          }
        }}
      />

      {/* 1. BARRA DE NAVEGACIÓN */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: themeColors.bgCard,
          borderBottom: `1px solid ${themeColors.border}`,
          py: 0.5,
          width: '100%',
          transition: 'background-color 0.3s ease, border-color 0.3s ease'
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Typography
              variant="h5"
              onClick={() => navegar('inicio')}
              sx={{
                cursor: 'pointer',
                fontWeight: 800,
                color: themeColors.textPrimary,
                letterSpacing: '-0.5px',
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }}
            >
              ESLABÓN
            </Typography>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
              {enlacesMenu.map((e) => (
                <Button key={e.id} onClick={() => navegar(e.id)} sx={{ color: themeColors.textSecondary, fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', '&:hover': { color: themeColors.primary, backgroundColor: 'transparent' } }}>
                  {e.texto}
                </Button>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
              <Tooltip title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
                <IconButton
                  onClick={toggleDarkMode}
                  sx={{
                    width: { xs: 38, sm: 42 },
                    height: { xs: 38, sm: 42 },
                    borderRadius: '50%',
                    backgroundColor: darkMode ? '#2D2D2D' : '#FFFFFF',
                    color: themeColors.textPrimary,
                    border: `1px solid ${themeColors.border}`,
                    boxShadow: darkMode ? 'none' : '0px 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: darkMode ? '#3A3A3A' : '#F3F4F6'
                    }
                  }}
                >
                  {darkMode ? <SunIcon /> : <MoonIcon />}
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                onClick={handleLoginRedirect}
                disableElevation
                sx={{
                  backgroundColor: themeColors.primary,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 0.8, sm: 1 },
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: themeColors.primaryHover
                  }
                }}
              >
                Iniciar Sesión
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* 2. HERO SECTION */}
      <Box
        sx={{
          backgroundColor: themeColors.bgCard,
          pt: { xs: 6, sm: 8, md: 10 },
          pb: { xs: 6, sm: 8, md: 10 },
          borderBottom: `1px solid ${themeColors.border}`,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          transition: 'background-color 0.3s ease'
        }}
      >
        <Container maxWidth="md" sx={{ px: { xs: 2.5, sm: 3 }, textAlign: 'center' }}>
          <Typography
            component="span"
            sx={{
              backgroundColor: themeColors.badgeBg,
              color: themeColors.primary,
              fontWeight: 700,
              fontSize: { xs: '0.75rem', sm: '0.8rem' },
              px: 2,
              py: 0.8,
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'inline-block',
              mb: 2.5
            }}
          >
            Taller de Confección 
          </Typography>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: themeColors.textPrimary,
              fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3.2rem' },
              lineHeight: 1.2,
              mb: 2.5
            }}
          >
            Especialistas en Confección de Uniformes y Dotaciones
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: themeColors.textSecondary,
              fontWeight: 400,
              fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
              lineHeight: 1.6,
              mb: 4,
              maxWidth: '750px',
              mx: 'auto'
            }}
          >
            Envía tus remisiones en línea, sigue el estado de tu pedido y recibe tus prendas a tiempo, con la calidad que tu empresa necesita.
          </Typography>

          {/* BOTONES CENTRADOS Y ADAPTABLES */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 2, sm: 2 },
              flexDirection: { xs: 'column', sm: 'row' },
              width: '100%',
              maxWidth: '500px',
              mx: 'auto'
            }}
          >
            <Button
              variant="contained"
              disableElevation
              onClick={handleLoginRedirect}
              sx={{
                backgroundColor: themeColors.primary,
                color: '#FFFFFF',
                fontWeight: 700,
                px: 3.5,
                py: 1.4,
                borderRadius: '8px',
                fontSize: { xs: '0.95rem', sm: '1rem' },
                textTransform: 'none',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': { backgroundColor: themeColors.primaryHover }
              }}
            >
              Comenzar Pedido
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const element = document.getElementById('catalogo');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                borderColor: themeColors.primary,
                color: themeColors.primary,
                fontWeight: 700,
                px: 3.5,
                py: 1.4,
                borderRadius: '8px',
                fontSize: { xs: '0.95rem', sm: '1rem' },
                textTransform: 'none',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  borderColor: themeColors.primaryHover,
                  backgroundColor: themeColors.badgeBg
                }
              }}
            >
              Ver Galería de Uniformes
            </Button>
          </Box>
        </Container>
      </Box>

      {/* 3. GALERÍA / PORTAFOLIO DE UNIFORMES */}
      <Container id="catalogo" maxWidth="lg" sx={{ scrollMarginTop: '80px', py: { xs: 6, sm: 8 }, px: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ mb: { xs: 4, sm: 5 }, textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: themeColors.primary,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Nuestra Experiencia
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: themeColors.textPrimary,
              mt: 0.5,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Uniformes Confeccionados
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: { xs: 2.5, sm: 3, md: 3.5 }
          }}
        >
          {uniformGallery.map((item, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                borderRadius: '16px',
                border: `1px solid ${themeColors.border}`,
                backgroundColor: themeColors.bgCard,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: darkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 12px 24px rgba(0,0,0,0.06)'
                }
              }}
            >
              <CardMedia
                component="img"
                height="200"
                image={item.image}
                alt={item.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ p: { xs: 2.5, sm: 3 }, flexGrow: 1 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: themeColors.textPrimary, mb: 1, fontSize: '1.05rem' }}
                >
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color: themeColors.textSecondary, lineHeight: 1.6, fontWeight: 400 }}>
                  {item.desc}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* 4. CÓMO TRABAJAMOS */}
      <Box id="proceso" sx={{ scrollMarginTop: '80px', backgroundColor: themeColors.bgCard, borderTop: `1px solid ${themeColors.border}`, borderBottom: `1px solid ${themeColors.border}`, py: { xs: 6, sm: 8 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 3 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5 } }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: themeColors.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Cómo trabajamos
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: themeColors.textPrimary, mt: 0.5, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              De tu remisión a la entrega
            </Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
            {pasos.map((paso, i) => (
              <Box key={paso.titulo} sx={{ position: 'relative', p: 3, borderRadius: '16px', border: `1px solid ${themeColors.border}`, backgroundColor: themeColors.bgPage }}>
                <Typography sx={{ position: 'absolute', top: 12, right: 16, fontSize: '2.2rem', fontWeight: 800, color: themeColors.primary, opacity: 0.18 }}>
                  {String(i + 1).padStart(2, '0')}
                </Typography>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: themeColors.badgeBg, color: themeColors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <paso.Icono size={22} />
                </Box>
                <Typography sx={{ fontWeight: 700, color: themeColors.textPrimary, mb: 1 }}>{paso.titulo}</Typography>
                <Typography variant="body2" sx={{ color: themeColors.textSecondary, lineHeight: 1.6 }}>{paso.texto}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* 5. SOBRE NOSOTROS */}
      <Container id="nosotros" maxWidth="lg" sx={{ scrollMarginTop: '80px', py: { xs: 6, sm: 8 }, px: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, gap: { xs: 4, md: 6 }, alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: themeColors.primary, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Sobre nosotros
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: themeColors.textPrimary, mt: 0.5, mb: 2, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Taller y Confecciones CDS
            </Typography>
            <Typography sx={{ color: themeColors.textSecondary, lineHeight: 1.8, mb: 2 }}>
              Somos una microempresa de Medellín dedicada a la confección de uniformes empresariales y vestimenta casual.
              Trabajamos con empresas de sectores como el automotriz y la seguridad privada, que confían en nosotros
              la confección de sus dotaciones a partir de sus telas cortadas y fichas técnicas.
            </Typography>
            <Typography sx={{ color: themeColors.textSecondary, lineHeight: 1.8, mb: 3 }}>
              Nuestro diferencial es el <b style={{ color: themeColors.textPrimary }}>cumplimiento estricto de los tiempos de entrega</b> y
              los altos estándares de calidad en cada acabado. Con <b style={{ color: themeColors.textPrimary }}>Eslabón</b>, nuestros clientes
              envían sus remisiones en línea y siguen el estado de su pedido en todo momento.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {cifras.map((c) => (
                <Box key={c.texto} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${themeColors.border}`, backgroundColor: themeColors.bgCard, textAlign: 'center' }}>
                  <Box sx={{ color: themeColors.primary, display: 'flex', justifyContent: 'center', mb: 0.5 }}><c.Icono size={20} /></Box>
                  <Typography sx={{ fontWeight: 800, color: themeColors.textPrimary, fontSize: { xs: '1rem', sm: '1.2rem' } }}>{c.valor}</Typography>
                  <Typography variant="caption" sx={{ color: themeColors.textSecondary }}>{c.texto}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pilares.map((p) => (
              <Box key={p.titulo} sx={{ display: 'flex', gap: 2, p: 2.5, borderRadius: '16px', border: `1px solid ${themeColors.border}`, backgroundColor: themeColors.bgCard }}>
                <Box sx={{ width: 44, height: 44, flexShrink: 0, borderRadius: '12px', backgroundColor: themeColors.badgeBg, color: themeColors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p.Icono size={20} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: themeColors.textPrimary, mb: 0.5 }}>{p.titulo}</Typography>
                  <Typography variant="body2" sx={{ color: themeColors.textSecondary, lineHeight: 1.6 }}>{p.texto}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      {/* 6. PIE DE PÁGINA */}
      <Footer variant="landing" dark={darkMode} onNavegar={navegar} />
    </Box>
  );
}