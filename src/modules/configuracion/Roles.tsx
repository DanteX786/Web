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
  DialogActions,
  Checkbox,
  FormControlLabel,
  Collapse,
  Switch,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

interface RolesViewProps {
  dark?: boolean;
}

interface RoleData {
  id: string;
  description: string;
  permissionsCount: string;
  permissionsList: string[];
  isActive: boolean;
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
    permissionsList: ALL_PERMISSIONS,
    isActive: true 
  },
  { 
    id: 'ROL-02', 
    description: 'Empleado', 
    permissionsCount: '5 módulos',
    permissionsList: ['Dashboard', 'Ventas', 'Clientes', 'Órdenes de Pedido', 'Envíos'],
    isActive: true 
  },
  { 
    id: 'ROL-03', 
    description: 'Cliente', 
    permissionsCount: '0 módulos',
    permissionsList: [],
    isActive: false 
  },
];

interface RoleRowProps {
  row: RoleData;
  isDarkMode: boolean;
  onEdit: (role: RoleData) => void;
  onDelete: (role: RoleData) => void;
  onToggleStatus: (id: string) => void; // <-- Nueva función para cambiar estado directo
}

// Componente para cada fila
function RoleRow({ row, isDarkMode, onEdit, onDelete, onToggleStatus }: RoleRowProps) {
  const [openView, setOpenView] = useState(false);

  const goldColor = '#D6A848';
  const lightGoldBg = isDarkMode ? '#2A2514' : '#FCF7E8';
  const borderCol = isDarkMode ? '#333333' : '#E0E0E0';
  const textCol = isDarkMode ? '#FFFFFF' : '#111111';
  const textSec = isDarkMode ? '#AAAAAA' : '#828282';

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: openView ? 'none' : `1px solid ${borderCol}` } }}>
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
        
        {/* Columna de Estado interactiva con Switch y Chip */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Switch 
              size="small"
              checked={row.isActive}
              onChange={() => onToggleStatus(row.id)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#137333',
                  '&:hover': { backgroundColor: 'rgba(19, 115, 51, 0.08)' },
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#137333',
                },
              }}
            />
            <Chip 
              label={row.isActive ? 'Activo' : 'Inactivo'} 
              size="small"
              sx={{ 
                backgroundColor: row.isActive ? (isDarkMode ? '#0A2E1A' : '#E6F4EA') : (isDarkMode ? '#3C1414' : '#FCE8E6'), 
                color: row.isActive ? '#137333' : '#C5221F', 
                fontWeight: 'bold',
                borderRadius: 4,
                px: 1,
                minWidth: '70px'
              }} 
            />
          </Box>
        </TableCell>

        <TableCell>
          <Chip 
            label={`${row.permissionsList.length} módulos`} 
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
              onClick={() => setOpenView(!openView)}
              sx={{ 
                border: `1px solid ${openView ? goldColor : '#4A90E2'}`, 
                backgroundColor: openView ? lightGoldBg : 'transparent',
                padding: '4px' 
              }}
            >
              <VisibilityOutlinedIcon sx={{ fontSize: '1.2rem', color: openView ? goldColor : '#4A90E2' }} />
            </IconButton>

            <IconButton 
              size="small" 
              onClick={() => onEdit(row)}
              sx={{ border: `1px solid ${goldColor}`, padding: '4px' }}
            >
              <EditOutlinedIcon sx={{ fontSize: '1.2rem', color: isDarkMode ? '#CCC' : '#555' }} />
            </IconButton>

            <IconButton 
              size="small" 
              onClick={() => onDelete(row)}
              sx={{ border: `1px solid ${goldColor}`, padding: '4px' }}
            >
              <DeleteOutlinedIcon sx={{ fontSize: '1.2rem', color: isDarkMode ? '#CCC' : '#555' }} />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0, border: 0 }} colSpan={5}>
          <Collapse in={openView} timeout="auto" unmountOnExit>
            <Box 
              sx={{ 
                p: 3, 
                mb: 2, 
                backgroundColor: isDarkMode ? '#1E1E1E' : '#FAFAFA', 
                border: `1px solid ${borderCol}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: goldColor, mb: 2 }}>
                Detalles del Rol
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: textSec, mb: 1, display: 'block' }}>
                    ID DEL ROL
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small" 
                    value={row.id} 
                    disabled 
                    sx={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#EAEAEA', input: { color: textCol, fontWeight: 'bold' } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: textSec, mb: 1, display: 'block' }}>
                    DESCRIPCIÓN
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small" 
                    value={row.description} 
                    disabled 
                    sx={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#EAEAEA', input: { color: textCol, fontWeight: 'bold' } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: textSec, mb: 1, display: 'block' }}>
                    ESTADO
                  </Typography>
                  <TextField 
                    fullWidth 
                    size="small" 
                    value={row.isActive ? 'Activo' : 'Inactivo'} 
                    disabled 
                    sx={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#EAEAEA', input: { color: row.isActive ? '#137333' : '#C5221F', fontWeight: 'bold' } }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: '4px', height: '18px', backgroundColor: goldColor, borderRadius: '2px' }} />
                <Typography variant="subtitle2" sx={{ color: goldColor, fontWeight: 'bold' }}>
                  PERMISOS ASIGNADOS
                </Typography>
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
                {ALL_PERMISSIONS.map((perm, index) => {
                  const hasPerm = row.permissionsList.includes(perm);
                  return (
                    <Box 
                      key={perm} 
                      sx={{ 
                        p: 1.5, 
                        borderBottom: index < ALL_PERMISSIONS.length - 2 ? `1px solid ${borderCol}` : 'none',
                        borderRight: index % 2 === 0 ? `1px solid ${borderCol}` : 'none',
                        opacity: hasPerm ? 1 : 0.4
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox 
                            size="small"
                            checked={hasPerm}
                            disabled
                            sx={{ color: borderCol, '&.Mui-checked': { color: goldColor } }}
                          />
                        }
                        label={<Typography variant="body2" sx={{ fontWeight: 'bold', color: isDarkMode ? '#CCC' : '#555' }}>{perm}</Typography>}
                        sx={{ margin: 0 }}
                      />
                    </Box>
                  );
                })}
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
  const isDarkMode = !!dark;

  const [rows, setRows] = useState<RoleData[]>(initialRows);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para el Modal (Crear / Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [formDesc, setFormDesc] = useState('');
  const [formPerms, setFormPerms] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);

  const [adminAlertOpen, setAdminAlertOpen] = useState(false);

  const goldColor = '#D6A848';
  const lightGoldBg = isDarkMode ? '#2A2514' : '#FCF7E8';
  const bgMain = isDarkMode ? '#121212' : '#F8F9FA';
  const paperBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const borderCol = isDarkMode ? '#333333' : '#E0E0E0';
  const textCol = isDarkMode ? '#FFFFFF' : '#111111';
  const textSec = isDarkMode ? '#AAAAAA' : '#828282';

  const handleOpenAdd = () => {
    setEditingRole(null);
    setFormDesc('');
    setFormPerms([]);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: RoleData) => {
    setEditingRole(role);
    setFormDesc(role.description);
    setFormPerms([...role.permissionsList]);
    setFormIsActive(role.isActive);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormDesc('');
    setFormPerms([]);
    setFormIsActive(true);
  };

  const handleTogglePermission = (perm: string) => {
    setFormPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleToggleAll = () => {
    if (formPerms.length === ALL_PERMISSIONS.length) {
      setFormPerms([]);
    } else {
      setFormPerms(ALL_PERMISSIONS);
    }
  };

  // Función para cambiar el estado directamente desde la tabla (Switch)
  const handleToggleStatus = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleSaveRole = () => {
    if (!formDesc.trim() || formPerms.length === 0) return;

    if (editingRole) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === editingRole.id
            ? { 
                ...r, 
                description: formDesc, 
                permissionsList: formPerms, 
                permissionsCount: `${formPerms.length} módulos`,
                isActive: formIsActive 
              }
            : r
        )
      );
    } else {
      const newId = `ROL-0${rows.length + 1}`;
      const newRole: RoleData = {
        id: newId,
        description: formDesc,
        permissionsCount: `${formPerms.length} módulos`,
        permissionsList: formPerms,
        isActive: formIsActive,
      };
      setRows((prev) => [...prev, newRole]);
    }

    handleCloseModal();
  };

  const handleDeleteRoleAttempt = (role: RoleData) => {
    if (role.id === 'ROL-01' || role.description.toLowerCase() === 'admin') {
      setAdminAlertOpen(true);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== role.id));
  };

  const filteredRows = rows.filter((r) => 
    r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isFormValid = formDesc.trim().length > 0 && formPerms.length > 0;

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={handleOpenAdd}
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
                {['ID ROL', 'DESCRIPCIÓN', 'ESTADO', 'PERMISOS', 'ACCIONES'].map((headCell) => (
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
              {filteredRows.map((row) => (
                <RoleRow 
                  key={row.id} 
                  row={row} 
                  isDarkMode={isDarkMode} 
                  onEdit={handleOpenEdit} 
                  onDelete={handleDeleteRoleAttempt}
                  onToggleStatus={handleToggleStatus} 
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="body2" sx={{ color: textSec, mt: 2, ml: 1 }}>
          {rows.length} roles • {rows.reduce((acc, r) => acc + r.permissionsList.length, 0)} asignaciones
        </Typography>

      </Box>

      {/* ================= MODAL CREAR / EDITAR ROL ================= */}
      <Dialog 
        open={isModalOpen} 
        onClose={handleCloseModal}
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
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
          </Typography>
          <IconButton onClick={handleCloseModal} size="small" sx={{ color: textCol }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ borderTop: `1px solid ${borderCol}`, borderBottom: `1px solid ${borderCol}` }}>
          
          <Box sx={{ display: 'flex', gap: 3, mb: 4, mt: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: textSec, mb: 1, display: 'block' }}>
                ID (AUTO)
              </Typography>
              <TextField 
                fullWidth 
                size="small" 
                value={editingRole ? editingRole.id : `ROL-0${rows.length + 1}`} 
                disabled 
                sx={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6', input: { color: textCol } }} 
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: textSec, mb: 1, display: 'block' }}>
                DESCRIPCIÓN *
              </Typography>
              <TextField 
                fullWidth 
                size="small" 
                placeholder="Ej: Admin" 
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                error={!formDesc.trim()}
                helperText={!formDesc.trim() ? 'La descripción es obligatoria' : ''}
                sx={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB', input: { color: textCol } }} 
              />
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: textSec, mb: 1, display: 'block' }}>
                ESTADO
              </Typography>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#137333',
                        '&:hover': { backgroundColor: 'rgba(19, 115, 51, 0.08)' },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#137333',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: formIsActive ? '#137333' : '#C5221F' }}>
                    {formIsActive ? 'Activo' : 'Inactivo'}
                  </Typography>
                }
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: '4px', height: '18px', backgroundColor: goldColor, borderRadius: '2px' }} />
              <Typography variant="subtitle2" sx={{ color: goldColor, fontWeight: 'bold', letterSpacing: '0.5px' }}>
                ASIGNAR PERMISOS *
              </Typography>
              <Chip 
                label={`${formPerms.length}/${ALL_PERMISSIONS.length}`} 
                size="small" 
                sx={{ backgroundColor: lightGoldBg, color: goldColor, fontWeight: 'bold', height: '20px' }} 
              />
            </Box>
            <Button 
              size="small" 
              onClick={handleToggleAll}
              sx={{ backgroundColor: isDarkMode ? '#333' : '#F3F4F6', color: textCol, textTransform: 'none', fontWeight: 'bold', borderRadius: 2 }}
            >
              {formPerms.length === ALL_PERMISSIONS.length ? 'Desmarcar todos' : 'Marcar todos'}
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
                      checked={formPerms.includes(perm)}
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
          {formPerms.length === 0 && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              Debe seleccionar al menos un permiso.
            </Typography>
          )}

        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleCloseModal}
            variant="outlined"
            sx={{ color: textSec, borderColor: borderCol, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveRole}
            variant="contained"
            disabled={!isFormValid}
            sx={{ 
              backgroundColor: goldColor, 
              color: '#000', 
              fontWeight: 'bold', 
              textTransform: 'none', 
              boxShadow: 'none', 
              '&:hover': { backgroundColor: '#C59A3D', boxShadow: 'none' },
              '&.Mui-disabled': { backgroundColor: isDarkMode ? '#333' : '#E0E0E0', color: '#888' }
            }}
          >
            Guardar rol
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= MODAL ADVERTENCIA ROL ADMINISTRADOR ================= */}
      <Dialog 
        open={adminAlertOpen} 
        onClose={() => setAdminAlertOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { 
              borderRadius: 3, 
              p: 2, 
              textAlign: 'center',
              backgroundColor: paperBg, 
              color: textCol,
              border: `1px solid ${borderCol}`
            }
          }
        }}
      >
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pt: 2 }}>
          <Box 
            sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: '50%', 
              backgroundColor: lightGoldBg, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <WarningAmberRoundedIcon sx={{ color: goldColor, fontSize: '2rem' }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Acción no permitida
          </Typography>
          <Typography variant="body2" sx={{ color: textSec }}>
            Por razones de seguridad del sistema, **no se puede eliminar el rol de Administrador**.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 1 }}>
          <Button 
            onClick={() => setAdminAlertOpen(false)}
            variant="contained"
            sx={{ 
              backgroundColor: goldColor, 
              color: '#000', 
              fontWeight: 'bold', 
              textTransform: 'none', 
              boxShadow: 'none',
              px: 4,
              '&:hover': { backgroundColor: '#C59A3D', boxShadow: 'none' } 
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}