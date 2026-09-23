import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Checkbox,
  FormControlLabel,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';

// Interfaz que recibe la prop "dark" desde tu aplicativo global
interface RolesViewProps {
  dark?: boolean;
}

interface RoleData {
  id: string;
  description: string;
  permissionsCount: string;
  permissionsList: string[];
}

const ALL_PERMISSIONS = [
  'Dashboard', 'Clientes', 'Proveedores', 'Remisiones', 
  'Órdenes de Pedido', 'Ventas', 'Envíos', 'Tipo de Insumos', 
  'Insumos', 'Compras', 'Gestión de Producción', 'Registro Diario', 
  'Catálogo de Piezas', 'Tipos de Maquinaria', 'Roles', 'Permisos', 'Empleados'
];

const initialRows: RoleData[] = [
  { 
    id: 'ROL-01', 
    description: 'Admin', 
    permissionsCount: '17 módulos',
    permissionsList: ALL_PERMISSIONS 
  },
  { 
    id: 'ROL-02', 
    description: 'Empleado', 
    permissionsCount: '5 módulos',
    permissionsList: ['Dashboard', 'Ventas', 'Clientes', 'Órdenes de Pedido', 'Envíos']
  },
  { 
    id: 'ROL-03', 
    description: 'Cliente', 
    permissionsCount: '0 módulos',
    permissionsList: [] 
  },
];

// Componente para cada fila y su sección colapsable de edición
function RoleRow({ row, isDarkMode }: { row: RoleData; isDarkMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [editDesc, setEditDesc] = useState(row.description);
  const [editPerms, setEditPerms] = useState<string[]>(row.permissionsList);

  const goldColor = '#D6A848';
  const lightGoldBg = isDarkMode ? '#2A2514' : '#FCF7E8';
  const borderCol = isDarkMode ? '#333333' : '#E0E0E0';
  const textCol = isDarkMode ? '#FFFFFF' : '#111111';

  const handleTogglePermission = (perm: string) => {
    setEditPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleToggleAll = () => {
    if (editPerms.length === ALL_PERMISSIONS.length) {
      setEditPerms([]);
    } else {
      setEditPerms(ALL_PERMISSIONS);
    }
  };

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: open ? 'none' : `1px solid ${borderCol}` } }}>
        <TableCell>
          <Chip 
            label={row.id} 
            size="small"
            sx={{ 
              backgroundColor: lightGoldBg, 
              color: goldColor, 
              fontWeight: 'bold',
              borderRadius: 1,
              px: 0.5
            }} 
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: textCol }}>
            {row.description}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip 
            label={`${editPerms.length} módulos`} 
            size="small"
            sx={{ 
              backgroundColor: lightGoldBg, 
              color: goldColor, 
              fontWeight: 'bold',
              borderRadius: 4,
              px: 1
            }} 
          />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
            <IconButton 
              size="small" 
              onClick={() => setOpen(!open)}
              sx={{ 
                border: `1px solid ${open ? goldColor : '#4A90E2'}`, 
                backgroundColor: open ? lightGoldBg : 'transparent',
                padding: '4px' 
              }}
            >
              <VisibilityOutlinedIcon sx={{ fontSize: '1.2rem', color: open ? goldColor : '#4A90E2' }} />
            </IconButton>
            <IconButton size="small" sx={{ border: `1px solid ${goldColor}`, padding: '4px' }}>
              <EditOutlinedIcon sx={{ fontSize: '1.2rem', color: isDarkMode ? '#CCC' : '#555' }} />
            </IconButton>
            <IconButton size="small" sx={{ border: `1px solid ${goldColor}`, padding: '4px' }}>
              <DeleteOutlinedIcon sx={{ fontSize: '1.2rem', color: isDarkMode ? '#CCC' : '#555' }} />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, border: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box 
              sx={{ 
                p: 3, 
                mb: 2, 
                backgroundColor: isDarkMode ? '#1E1E1E' : '#FAFAFA', 
                border: `1px solid ${borderCol}`,
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: isDarkMode ? '#AAA' : '#828282', mb: 1, display: 'block' }}>
                    ID (AUTO)
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small" 
                    value={row.id} 
                    disabled 
                    sx={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#EAEAEA', input: { color: textCol } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: isDarkMode ? '#AAA' : '#828282', mb: 1, display: 'block' }}>
                    DESCRIPCIÓN
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small" 
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    sx={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFF', input: { color: textCol } }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: '4px', height: '18px', backgroundColor: goldColor, borderRadius: '2px' }} />
                  <Typography variant="subtitle2" sx={{ color: goldColor, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    PERMISOS ASIGNADOS
                  </Typography>
                  <Chip 
                    label={`${editPerms.length}/${ALL_PERMISSIONS.length}`} 
                    size="small" 
                    sx={{ backgroundColor: lightGoldBg, color: goldColor, fontWeight: 'bold', height: '20px' }} 
                  />
                </Box>
                <Button 
                  size="small" 
                  onClick={handleToggleAll}
                  sx={{ backgroundColor: isDarkMode ? '#333' : '#EEEEEE', color: textCol, textTransform: 'none', fontWeight: 'bold', borderRadius: 2 }}
                >
                  {editPerms.length === ALL_PERMISSIONS.length ? 'Desmarcar todos' : 'Marcar todos'}
                </Button>
              </Box>

              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  border: `1px solid ${borderCol}`, 
                  borderRadius: 2,
                  backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
                  overflow: 'hidden'
                }}
              >
                {ALL_PERMISSIONS.map((perm, index) => (
                  <Box 
                    key={perm} 
                    sx={{ 
                      p: 1.5, 
                      borderBottom: index < ALL_PERMISSIONS.length - 2 ? `1px solid ${borderCol}` : 'none',
                      borderRight: index % 2 === 0 ? `1px solid ${borderCol}` : 'none',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox 
                          size="small"
                          checked={editPerms.includes(perm)}
                          onChange={() => handleTogglePermission(perm)}
                          sx={{ color: borderCol, '&.Mui-checked': { color: goldColor } }}
                        />
                      }
                      label={<Typography variant="body2" sx={{ fontWeight: 'bold', color: isDarkMode ? '#CCC' : '#555' }}>{perm}</Typography>}
                      sx={{ margin: 0 }}
                    />
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setOpen(false)}
                  sx={{ color: isDarkMode ? '#AAA' : '#828282', borderColor: borderCol, textTransform: 'none' }}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => setOpen(false)}
                  sx={{ backgroundColor: goldColor, color: '#000', fontWeight: 'bold', textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: '#C59A3D', boxShadow: 'none' } }}
                >
                  Guardar Cambios
                </Button>
              </Box>

            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

// ================= VISTA PRINCIPAL =================
export default function RolesView({ dark = false }: RolesViewProps) {
  // Sincronizamos el estado interno con la prop 'dark' que viene de tu app
  const isDarkMode = !!dark;

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);

  const goldColor = '#D6A848';
  const lightGoldBg = isDarkMode ? '#2A2514' : '#FCF7E8';
  const bgMain = isDarkMode ? '#121212' : '#F8F9FA';
  const paperBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const borderCol = isDarkMode ? '#333333' : '#E0E0E0';
  const textCol = isDarkMode ? '#FFFFFF' : '#111111';
  const textSec = isDarkMode ? '#AAAAAA' : '#828282';

  const handleToggleNewPermission = (perm: string) => {
    setNewRolePerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleToggleAllNew = () => {
    if (newRolePerms.length === ALL_PERMISSIONS.length) {
      setNewRolePerms([]);
    } else {
      setNewRolePerms(ALL_PERMISSIONS);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: bgMain, color: textCol, transition: 'background-color 0.3s ease' }}>
      
      <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Cabecera */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 0.5, color: textCol, fontWeight: 800 }}>
              Roles
            </Typography>
            <Typography variant="body2" sx={{ color: textSec }}>
              Roles del sistema con permisos asignados
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <TextField
              variant="outlined"
              placeholder="Buscar..."
              size="small"
              sx={{
                width: '200px',
                backgroundColor: isDarkMode ? '#1E1E1E' : '#FAFAFA',
                '& fieldset': { borderColor: borderCol },
                borderRadius: 1,
                input: { color: textCol }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: textSec }} fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddModalOpen(true)}
              sx={{
                backgroundColor: goldColor,
                color: '#000',
                fontWeight: 'bold',
                textTransform: 'none',
                boxShadow: 'none',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#C59A3D',
                  boxShadow: 'none',
                },
              }}
            >
              Nuevo rol
            </Button>
          </Box>
        </Box>

        {/* Tabla */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            boxShadow: 'none', 
            border: `1px solid ${borderCol}`, 
            borderRadius: 2,
            backgroundColor: paperBg
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                {['ID ROL', 'DESCRIPCIÓN', 'PERMISOS', 'ACCIONES'].map((headCell) => (
                  <TableCell
                    key={headCell}
                    sx={{
                      color: goldColor,
                      fontWeight: 'bold',
                      borderBottom: `2px solid ${goldColor}`,
                      letterSpacing: '0.5px',
                      backgroundColor: paperBg
                    }}
                  >
                    {headCell}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {initialRows.map((row) => (
                <RoleRow key={row.id} row={row} isDarkMode={isDarkMode} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="body2" sx={{ color: textSec, mt: 2, ml: 1 }}>
          3 roles • 2 asignaciones
        </Typography>

      </Box>

      {/* ================= MODAL NUEVO ROL ================= */}
      <Dialog 
        open={isAddModalOpen} 
        onClose={() => setAddModalOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { 
              borderRadius: 3, 
              p: 1, 
              backgroundColor: paperBg, 
              color: textCol,
              border: `1px solid ${borderCol}`
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Nuevo Rol</Typography>
          <IconButton onClick={() => setAddModalOpen(false)} size="small" sx={{ color: textCol }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ borderTop: `1px solid ${borderCol}`, borderBottom: 'none' }}>
          
          <Box sx={{ display: 'flex', gap: 3, mb: 4, mt: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: textSec, mb: 1, display: 'block' }}>
                ID (AUTO)
              </Typography>
              <TextField 
                fullWidth 
                size="small" 
                value="ROL-04" 
                disabled 
                sx={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6', input: { color: textCol } }} 
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: textSec, mb: 1, display: 'block' }}>
                DESCRIPCIÓN
              </Typography>
              <TextField 
                fullWidth 
                size="small" 
                placeholder="Ej: Admin" 
                sx={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB', input: { color: textCol } }} 
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: '4px', height: '18px', backgroundColor: goldColor, borderRadius: '2px' }} />
              <Typography variant="subtitle2" sx={{ color: goldColor, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                ASIGNAR PERMISOS
              </Typography>
              <Chip 
                label={`${newRolePerms.length}/${ALL_PERMISSIONS.length}`} 
                size="small" 
                sx={{ backgroundColor: lightGoldBg, color: goldColor, fontWeight: 'bold', height: '20px' }} 
              />
            </Box>
            <Button 
              size="small" 
              onClick={handleToggleAllNew}
              sx={{ backgroundColor: isDarkMode ? '#333' : '#F3F4F6', color: textCol, textTransform: 'none', fontWeight: 'bold', borderRadius: 2 }}
            >
              {newRolePerms.length === ALL_PERMISSIONS.length ? 'Desmarcar todos' : 'Marcar todos'}
            </Button>
          </Box>

          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              border: `1px solid ${borderCol}`, 
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            {ALL_PERMISSIONS.map((perm, index) => (
              <Box 
                key={perm} 
                sx={{ 
                  p: 1.5, 
                  borderBottom: index < ALL_PERMISSIONS.length - 2 ? `1px solid ${borderCol}` : 'none',
                  borderRight: index % 2 === 0 ? `1px solid ${borderCol}` : 'none',
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox 
                      size="small"
                      checked={newRolePerms.includes(perm)}
                      onChange={() => handleToggleNewPermission(perm)}
                      sx={{ color: borderCol, '&.Mui-checked': { color: goldColor } }}
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 'bold', color: isDarkMode ? '#CCC' : '#555' }}>{perm}</Typography>}
                  sx={{ margin: 0 }}
                />
              </Box>
            ))}
          </Box>

        </DialogContent>
      </Dialog>
    </Box>
  );
}