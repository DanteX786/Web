import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

interface Venta {
  id_ventas: string;
  Id_orden_pedido: string;
  valor_ventas: number;
  fecha_ventas: string;
  comprobante_pago?: string;
}

interface VentasModuleProps {
  dark?: boolean;
}

export default function VentasModule({ dark }: VentasModuleProps) {
  const theme = useTheme();
  const isDarkMode = dark ?? (theme.palette.mode === 'dark');

  // Paleta exacta de referencia ("Tipos de Insumos")
  const colors = {
    bgMain: isDarkMode ? '#121212' : '#ffffff',
    cardBg: isDarkMode ? '#1e1e1e' : '#ffffff',
    titleText: isDarkMode ? '#f9fafb' : '#111827',
    subtitleText: isDarkMode ? '#9ca3af' : '#6b7280',
    tableHeader: isDarkMode ? '#facc15' : '#b49a3e',
    tableBorder: isDarkMode ? '#27272a' : '#f3f4f6',
    chipBg: isDarkMode ? '#3f3607' : '#fef9c3',
    chipText: isDarkMode ? '#fef08a' : '#854d0e',
    chipSecondaryBg: isDarkMode ? '#0c4a6e' : '#f0fdf4',
    chipSecondaryText: isDarkMode ? '#bae6fd' : '#166534',
    primaryGold: isDarkMode ? '#eab308' : '#ca8a04',
    inputBg: isDarkMode ? '#27272a' : '#f9fafb',
    inputBorder: isDarkMode ? '#3f3f46' : '#e5e7eb',
  };

  const [ventas, setVentas] = useState<Venta[]>([
    {
      id_ventas: 'VEN-001',
      Id_orden_pedido: 'ORD-001',
      valor_ventas: 150000.0,
      fecha_ventas: '2026-09-22 10:30',
      comprobante_pago: 'comp_001.png',
    },
    {
      id_ventas: 'VEN-002',
      Id_orden_pedido: 'ORD-002',
      valor_ventas: 320000.5,
      fecha_ventas: '2026-09-21 14:15',
      comprobante_pago: 'comp_002.jpg',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<Venta>({
    id_ventas: '',
    Id_orden_pedido: '',
    valor_ventas: 0,
    fecha_ventas: '',
    comprobante_pago: '',
  });

  const filteredVentas = ventas.filter(
    (v) =>
      v.id_ventas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.Id_orden_pedido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      id_ventas: `VEN-00${ventas.length + 1}`,
      Id_orden_pedido: '',
      valor_ventas: 0,
      fecha_ventas: new Date().toISOString().slice(0, 16),
      comprobante_pago: '',
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (venta: Venta) => {
    setIsEditing(true);
    setFormData(venta);
    setOpenModal(true);
  };

  const handleOpenDetail = (venta: Venta) => {
    setSelectedVenta(venta);
    setOpenDetailModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, comprobante_pago: file.name });
    }
  };

  const handleSave = () => {
    if (isEditing) {
      setVentas(ventas.map((v) => (v.id_ventas === formData.id_ventas ? formData : v)));
    } else {
      setVentas([...ventas, formData]);
    }
    setOpenModal(false);
  };

  const handleDelete = (id_ventas: string) => {
    setVentas(ventas.filter((v) => v.id_ventas !== id_ventas));
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: colors.bgMain,
        color: colors.titleText,
        minHeight: '100vh',
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Cabecera */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: colors.titleText,
              fontSize: '1.5rem',
              letterSpacing: '-0.025em',
            }}
          >
            Ventas
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.subtitleText,
              mt: 0.5,
              fontSize: '0.875rem',
            }}
          >
            Gestión y control de ventas y órdenes de pedido
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: colors.subtitleText }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              backgroundColor: colors.inputBg,
              borderRadius: 2,
              width: 260,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': { borderColor: colors.inputBorder },
                '&:hover fieldset': { borderColor: colors.primaryGold },
                '&.M-focused fieldset': { borderColor: colors.primaryGold },
              },
              input: { color: colors.titleText, fontSize: '0.875rem' },
            }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              backgroundColor: '#eab308',
              color: '#000000',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
              borderRadius: 2,
              px: 2.5,
              py: 1,
              fontSize: '0.875rem',
              '&:hover': {
                backgroundColor: '#ca8a04',
                boxShadow: 'none',
              },
            }}
          >
            Nueva venta
          </Button>
        </Box>
      </Box>

      {/* Tabla Principal */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.tableBorder}`,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ borderBottom: `2px solid ${colors.tableHeader}` }}>
              <TableCell sx={{ fontWeight: 700, color: colors.tableHeader, fontSize: '0.75rem', letterSpacing: '0.05em', py: 2 }}>
                ID VENTA
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: colors.tableHeader, fontSize: '0.75rem', letterSpacing: '0.05em', py: 2 }}>
                ID ORDEN PEDIDO
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: colors.tableHeader, fontSize: '0.75rem', letterSpacing: '0.05em', py: 2 }}>
                VALOR VENTAS
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: colors.tableHeader, fontSize: '0.75rem', letterSpacing: '0.05em', py: 2 }}>
                FECHA
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: colors.tableHeader, fontSize: '0.75rem', letterSpacing: '0.05em', py: 2 }}>
                COMPROBANTE
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: colors.tableHeader, fontSize: '0.75rem', letterSpacing: '0.05em', py: 2 }} align="center">
                ACCIONES
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVentas.map((venta) => (
              <TableRow
                key={venta.id_ventas}
                sx={{
                  '&:last-child td': { border: 0 },
                  borderBottom: `1px solid ${colors.tableBorder}`,
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.01)' : 'rgba(234, 179, 8, 0.015)',
                  },
                }}
              >
                <TableCell sx={{ py: 2.2 }}>
                  <Chip
                    label={venta.id_ventas}
                    size="small"
                    sx={{
                      backgroundColor: colors.chipBg,
                      color: colors.chipText,
                      fontWeight: 700,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      height: '24px',
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 2.2 }}>
                  <Chip
                    label={venta.Id_orden_pedido}
                    size="small"
                    sx={{
                      backgroundColor: colors.chipSecondaryBg,
                      color: colors.chipSecondaryText,
                      fontWeight: 700,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      height: '24px',
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: colors.titleText, fontSize: '0.875rem', py: 2.2 }}>
                  ${venta.valor_ventas.toLocaleString()}
                </TableCell>
                <TableCell sx={{ color: colors.subtitleText, fontSize: '0.875rem', py: 2.2 }}>
                  {venta.fecha_ventas}
                </TableCell>
                <TableCell sx={{ py: 2.2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      cursor: 'pointer',
                      color: colors.primaryGold,
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {venta.comprobante_pago || 'Sin comprobante'}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ py: 2.2 }}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDetail(venta)}
                      sx={{
                        border: `1px solid ${isDarkMode ? '#3f3f46' : '#e5e7eb'}`,
                        color: colors.primaryGold,
                        width: 32,
                        height: 32,
                        '&:hover': { backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(202, 138, 4, 0.05)' },
                      }}
                    >
                      <VisibilityIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEdit(venta)}
                      sx={{
                        border: `1px solid ${isDarkMode ? '#3f3f46' : '#e5e7eb'}`,
                        color: colors.primaryGold,
                        width: 32,
                        height: 32,
                        '&:hover': { backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(202, 138, 4, 0.05)' },
                      }}
                    >
                      <EditIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(venta.id_ventas)}
                      sx={{
                        border: `1px solid ${isDarkMode ? '#3f3f46' : '#e5e7eb'}`,
                        color: colors.primaryGold,
                        width: 32,
                        height: 32,
                        '&:hover': { backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(202, 138, 4, 0.05)' },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Agregar / Editar */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: colors.cardBg,
              color: colors.titleText,
              borderRadius: 3,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.tableBorder}`, fontSize: '1.125rem', py: 2.5 }}>
          {isEditing ? 'Editar Venta' : 'Agregar Nueva Venta'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.tableBorder, py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="ID Ventas"
              fullWidth
              size="small"
              value={formData.id_ventas}
              disabled={isEditing}
              onChange={(e) => setFormData({ ...formData, id_ventas: e.target.value })}
            />
            <TextField
              label="ID Orden de Pedido (Asignar)"
              fullWidth
              size="small"
              placeholder="Ej: ORD-001"
              value={formData.Id_orden_pedido}
              onChange={(e) => setFormData({ ...formData, Id_orden_pedido: e.target.value })}
            />
            <TextField
              label="Valor Ventas"
              type="number"
              fullWidth
              size="small"
              value={formData.valor_ventas}
              onChange={(e) => setFormData({ ...formData, valor_ventas: parseFloat(e.target.value) || 0 })}
            />
            <TextField
              label="Fecha y Hora"
              type="datetime-local"
              fullWidth
              size="small"
              slotProps={{
                inputLabel: { shrink: true },
              }}
              value={formData.fecha_ventas}
              onChange={(e) => setFormData({ ...formData, fecha_ventas: e.target.value })}
            />

            {/* Campo de Comprobante de Pago modificado con Selector de Archivos (Imagen) */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                p: 2,
                borderRadius: 2,
                border: `1px dashed ${colors.inputBorder}`,
                backgroundColor: colors.inputBg,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.subtitleText }}>
                Comprobante de Pago (Imagen)
              </Typography>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                size="small"
                sx={{
                  textTransform: 'none',
                  borderColor: colors.primaryGold,
                  color: colors.primaryGold,
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : 'rgba(202, 138, 4, 0.05)',
                    borderColor: colors.primaryGold,
                  },
                }}
              >
                Buscar imagen en equipo
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              <Typography variant="caption" sx={{ color: colors.subtitleText, mt: 0.5 }}>
                {formData.comprobante_pago ? `Archivo seleccionado: ${formData.comprobante_pago}` : 'Ningún archivo seleccionado'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${colors.tableBorder}` }}>
          <Button onClick={() => setOpenModal(false)} sx={{ color: colors.subtitleText, textTransform: 'none', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              backgroundColor: '#eab308',
              color: '#000',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': { backgroundColor: '#ca8a04', boxShadow: 'none' },
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Ver Detalle */}
      <Dialog
        open={openDetailModal}
        onClose={() => setOpenDetailModal(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: colors.cardBg,
              color: colors.titleText,
              borderRadius: 3,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: `1px solid ${colors.tableBorder}`, fontSize: '1.125rem', py: 2.5 }}>
          Detalle de la Venta
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: colors.tableBorder, py: 3 }}>
          {selectedVenta && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2"><strong>ID Venta:</strong> {selectedVenta.id_ventas}</Typography>
              <Typography variant="body2"><strong>ID Orden Pedido:</strong> {selectedVenta.Id_orden_pedido}</Typography>
              <Typography variant="body2"><strong>Valor Ventas:</strong> ${selectedVenta.valor_ventas.toLocaleString()}</Typography>
              <Typography variant="body2"><strong>Fecha:</strong> {selectedVenta.fecha_ventas}</Typography>
              <Typography variant="body2"><strong>Comprobante:</strong> {selectedVenta.comprobante_pago || 'Ninguno'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${colors.tableBorder}` }}>
          <Button
            onClick={() => setOpenDetailModal(false)}
            variant="contained"
            sx={{
              backgroundColor: '#eab308',
              color: '#000',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
              borderRadius: 2,
              width: '100%',
              '&:hover': { backgroundColor: '#ca8a04' },
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}