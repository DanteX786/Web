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
  TextField,
  Box,
  Switch,
  IconButton,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  GlobalStyles
} from '@mui/material';

// --- ICONOS SVG PERSONALIZADOS ---
const DeleteOutlineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z" />
  </svg>
);

const AddIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const CloudUploadIcon = ({ isDark }: { isDark?: boolean }) => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill={isDark ? "#E5A823" : "#D4A017"}>
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
  </svg>
);

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

interface PieceRow {
  id: number;
  pieza: string;
  talla: string;
  cantidad: number | string;
}

export default function LandingPage({ onNavigateToLogin }: LandingPageProps) {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [insumosEnviados, setInsumosEnviados] = useState<boolean>(false);
  const [fichaTecnicaFile, setFichaTecnicaFile] = useState<File | null>(null);

  const [nit, setNit] = useState<string>('');
  const [costoPrenda, setCostoPrenda] = useState<string>('');
  const [fechaCreacion, setFechaCreacion] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaEntrega, setFechaEntrega] = useState<string>('');

  const [pieces, setPieces] = useState<PieceRow[]>([
    { id: 1, pieza: 'Mangas', talla: 'S', cantidad: 10 }
  ]);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error'
  });

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

  const handleAddPiece = () => {
    setPieces([
      ...pieces,
      { id: Date.now(), pieza: '', talla: 'M', cantidad: 1 }
    ]);
  };

  const handleRemovePiece = (id: number) => {
    if (pieces.length === 1) {
      setSnackbar({
        open: true,
        message: 'Debe existir al menos una pieza en el detalle.',
        severity: 'error'
      });
      return;
    }
    setPieces(pieces.filter((p) => p.id !== id));
  };

  const handlePieceChange = (id: number, field: keyof PieceRow, value: any) => {
    setPieces(
      pieces.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFichaTecnicaFile(event.target.files[0]);
    }
  };

  const totalPrendas = pieces.reduce(
    (acc, item) => acc + (Number(item.cantidad) || 0),
    0
  );

  const handleSaveRemision = () => {
    if (!nit.trim()) {
      setSnackbar({ open: true, message: 'Por favor, ingrese el NIT del Cliente.', severity: 'error' });
      return;
    }
    if (!costoPrenda || Number(costoPrenda) <= 0) {
      setSnackbar({ open: true, message: 'Ingrese un costo por prenda válido.', severity: 'error' });
      return;
    }
    if (!fechaEntrega) {
      setSnackbar({ open: true, message: 'Seleccione la fecha de entrega esperada.', severity: 'error' });
      return;
    }
    if (!fichaTecnicaFile) {
      setSnackbar({ open: true, message: 'Es obligatorio adjuntar la Ficha Técnica.', severity: 'error' });
      return;
    }

    for (const piece of pieces) {
      if (!piece.pieza.trim()) {
        setSnackbar({ open: true, message: 'Todas las filas de piezas deben tener un nombre.', severity: 'error' });
        return;
      }
      if (Number(piece.cantidad) <= 0) {
        setSnackbar({ open: true, message: 'La cantidad de cada pieza debe ser mayor a 0.', severity: 'error' });
        return;
      }
    }

    setSnackbar({
      open: true,
      message: '¡Remisión creada y guardada con éxito!',
      severity: 'success'
    });
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
              sx={{
                fontWeight: 800,
                color: themeColors.textPrimary,
                letterSpacing: '-0.5px',
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }}
            >
              ESLABÓN
            </Typography>

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
            Gestiona la producción de tu taller, solicita cotizaciones y registra tus remisiones de prendas de forma ágil, organizada y segura.
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
      <Container id="catalogo" maxWidth="lg" sx={{ py: { xs: 6, sm: 8 }, px: { xs: 2.5, sm: 3 } }}>
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

      {/* 4. FORMULARIO DE REMISIÓN / CREACIÓN DE PEDIDO */}
      <Box sx={{ backgroundColor: themeColors.bgPage, py: { xs: 6, sm: 8 }, borderTop: `1px solid ${themeColors.border}`, width: '100%' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2.5, sm: 3 } }}>
          <Box sx={{ mb: { xs: 3.5, sm: 4 } }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: themeColors.primary,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Módulo de Solicitud
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: themeColors.textPrimary,
                mt: 0.5,
                fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.1rem' }
              }}
            >
              Crear Nueva Remisión de Producción
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: { xs: 3, sm: 3.5 }
            }}
          >
            {/* COLUMNA IZQUIERDA: INFORMACIÓN GENERAL */}
            <Box
              sx={{
                backgroundColor: themeColors.bgCard,
                borderRadius: '16px',
                p: { xs: 2.5, sm: 3.5 },
                border: `1px solid ${themeColors.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '1.2rem', color: themeColors.primary }}>📋</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: themeColors.textPrimary, fontSize: '1.1rem' }}>
                  Información General
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: themeColors.textSecondary, textTransform: 'uppercase', mb: 0.8, display: 'block' }}
                  >
                    NIT CLIENTE <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="900123456"
                    variant="outlined"
                    size="small"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: themeColors.bgInput,
                        borderRadius: '8px',
                        color: themeColors.textPrimary,
                        '& fieldset': { borderColor: themeColors.border }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: themeColors.textSecondary, textTransform: 'uppercase', mb: 0.8, display: 'block' }}
                  >
                    COSTO POR PRENDA ($) <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder="Ej. 13400"
                    variant="outlined"
                    size="small"
                    value={costoPrenda}
                    onChange={(e) => setCostoPrenda(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: themeColors.bgInput,
                        borderRadius: '8px',
                        color: themeColors.textPrimary,
                        '& fieldset': { borderColor: themeColors.border }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: themeColors.textSecondary, textTransform: 'uppercase', mb: 0.8, display: 'block' }}
                  >
                    FECHA DE CREACIÓN
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={fechaCreacion}
                    onChange={(e) => setFechaCreacion(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: themeColors.bgInput,
                        borderRadius: '8px',
                        color: themeColors.textPrimary,
                        '& fieldset': { borderColor: themeColors.border }
                      }
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: themeColors.textSecondary, textTransform: 'uppercase', mb: 0.8, display: 'block' }}
                  >
                    FECHA DE ENTREGA ESPERADA <span style={{ color: '#EF4444' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: themeColors.bgInput,
                        borderRadius: '8px',
                        color: themeColors.textPrimary,
                        '& fieldset': { borderColor: themeColors.border }
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* FICHA TÉCNICA UPLOAD */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: themeColors.textSecondary, textTransform: 'uppercase', mb: 0.8, display: 'block' }}
                >
                  FICHA TÉCNICA <span style={{ color: '#EF4444' }}>*</span>
                </Typography>
                <Button
                  component="label"
                  fullWidth
                  sx={{
                    border: `2px dashed ${themeColors.uploadBorder}`,
                    borderRadius: '12px',
                    p: 2.5,
                    textAlign: 'center',
                    backgroundColor: themeColors.uploadBg,
                    cursor: 'pointer',
                    textTransform: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: themeColors.badgeBg
                    }
                  }}
                >
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                  />
                  <CloudUploadIcon isDark={darkMode} />
                  <Typography sx={{ fontWeight: 600, color: themeColors.textPrimary, fontSize: '0.88rem', mt: 1, wordBreak: 'break-word' }}>
                    {fichaTecnicaFile ? `Archivo: ${fichaTecnicaFile.name}` : 'Clic para subir Ficha Técnica (.PDF, .JPG)'}
                  </Typography>
                </Button>
              </Box>

              {/* HABILITAR INSUMOS ENVIADOS */}
              <Box
                sx={{
                  mt: 'auto',
                  pt: 2,
                  borderTop: `1px solid ${themeColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '1.1rem', color: themeColors.primary }}>📦</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: themeColors.textPrimary }}>
                      Habilitar insumos enviados
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: themeColors.textSecondary, fontWeight: 400 }}>
                    ¿Enviarás insumos propios para esta producción?
                  </Typography>
                </Box>
                <Switch
                  checked={insumosEnviados}
                  onChange={(e) => setInsumosEnviados(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: themeColors.primary
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: themeColors.primary
                    }
                  }}
                />
              </Box>
            </Box>

            {/* COLUMNA DERECHA: DETALLE DE PRENDAS */}
            <Box
              sx={{
                backgroundColor: themeColors.bgCard,
                borderRadius: '16px',
                p: { xs: 2.5, sm: 3.5 },
                border: `1px solid ${themeColors.border}`,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                  gap: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '1.2rem', color: themeColors.primary }}>✂️</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: themeColors.textPrimary, fontSize: '1.1rem' }}>
                    Detalle de Prendas
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddPiece}
                  sx={{
                    borderColor: themeColors.primary,
                    color: themeColors.primary,
                    fontWeight: 700,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: { xs: '0.8rem', sm: '0.85rem' },
                    px: { xs: 1.5, sm: 2 },
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: themeColors.primaryHover,
                      backgroundColor: themeColors.badgeBg
                    }
                  }}
                >
                  Añadir Pieza
                </Button>
              </Box>

              {/* FILAS DE PIEZAS */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {pieces.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      backgroundColor: themeColors.bgInput,
                      p: { xs: 1.8, sm: 2 },
                      borderRadius: '12px',
                      border: `1px solid ${themeColors.border}`,
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: 1.5
                    }}
                  >
                    <Box sx={{ flex: { sm: 2 } }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: themeColors.textSecondary, textTransform: 'uppercase', mb: 0.5, display: 'block' }}
                      >
                        PIEZA
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Ej. Mangas"
                        value={item.pieza}
                        onChange={(e) => handlePieceChange(item.id, 'pieza', e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: themeColors.bgCard,
                            borderRadius: '8px',
                            color: themeColors.textPrimary,
                            '& fieldset': { borderColor: themeColors.border }
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, flex: { sm: 2 } }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: themeColors.textSecondary, textTransform: 'uppercase', mb: 0.5, display: 'block' }}
                        >
                          TALLA
                        </Typography>
                        <Select
                          fullWidth
                          size="small"
                          value={item.talla}
                          onChange={(e) => handlePieceChange(item.id, 'talla', e.target.value)}
                          sx={{
                            backgroundColor: themeColors.bgCard,
                            borderRadius: '8px',
                            color: themeColors.textPrimary,
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: themeColors.border }
                          }}
                        >
                          <MenuItem value="XS">XS</MenuItem>
                          <MenuItem value="S">S</MenuItem>
                          <MenuItem value="M">M</MenuItem>
                          <MenuItem value="L">L</MenuItem>
                          <MenuItem value="XL">XL</MenuItem>
                        </Select>
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 600, color: themeColors.textSecondary, textTransform: 'uppercase', mb: 0.5, display: 'block' }}
                        >
                          CANTIDAD
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          value={item.cantidad}
                          onChange={(e) => handlePieceChange(item.id, 'cantidad', e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: themeColors.bgCard,
                              borderRadius: '8px',
                              color: themeColors.textPrimary,
                              '& fieldset': { borderColor: themeColors.border }
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: { xs: 0.5, sm: 2 } }}>
                      <IconButton
                        onClick={() => handleRemovePiece(item.id)}
                        sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* TOTAL Y ACCIÓN FINAL DE REMISIÓN */}
              <Box sx={{ mt: 3, pt: 3, borderTop: `1px dashed ${themeColors.border}` }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 3
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: themeColors.textPrimary, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Total de prendas a confeccionar:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: themeColors.bgInput,
                      border: `1px solid ${themeColors.border}`,
                      borderRadius: '8px',
                      px: { xs: 2, sm: 2.5 },
                      py: 0.6,
                      fontWeight: 800,
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      color: themeColors.textPrimary
                    }}
                  >
                    {totalPrendas}
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  disableElevation
                  onClick={handleSaveRemision}
                  sx={{
                    backgroundColor: themeColors.primary,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    py: 1.4,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: themeColors.primaryHover
                    }
                  }}
                >
                  Guardar Remisión
                </Button>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 5. PIE DE PÁGINA */}
      <Box
        component="footer"
        sx={{
          backgroundColor: themeColors.bgCard,
          py: 3.5,
          borderTop: `1px solid ${themeColors.border}`,
          mt: 'auto',
          textAlign: 'center',
          width: '100%',
          transition: 'background-color 0.3s ease'
        }}
      >
        <Typography variant="body2" sx={{ color: themeColors.textSecondary, fontWeight: 400, fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} Eslabón. Todos los derechos reservados.
        </Typography>
      </Box>

      {/* FEEDBACK NOTIFICACIÓN */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: '8px', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}