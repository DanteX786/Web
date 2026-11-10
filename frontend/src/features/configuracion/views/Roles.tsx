
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

import { mensajeError } from '../../../shared/utils/api';
import { rolService, type Permiso, type Rol } from '../services/rolService';

interface RolesViewProps {
  dark?: boolean;
}

interface RoleData {
  id: string;
  description: string;
  permissionsList: string[]; // IDs de los permisos asignados
  isActive: boolean;
}

/** Convierte un rol de la API al formato que usa esta vista. */
const aRoleData = (rol: Rol): RoleData => ({
  id: rol.id,
  description: rol.descripcion,
  permissionsList: rol.permisos.map((p) => p.id),
  isActive: rol.estado === 'Activo',
});

const esRolAdmin = (descripcion: string) =>
  ['admin', 'administrador'].includes(descripcion.trim().toLowerCase());

interface RoleRowProps {
  row: RoleData;
  allPermissions: Permiso[];
  isDarkMode: boolean;
  onEdit: (role: RoleData) => void;
  onDelete: (role: RoleData) => void;
  onToggleStatus: (id: string) => void;
}

function RoleRow({
  row,
  allPermissions,
  isDarkMode,
  onEdit,
  onDelete,
  onToggleStatus,
}: RoleRowProps) {
  const [openView, setOpenView] = useState(false);

  const goldColor = '#D6A848';
  const lightGoldBg = isDarkMode ? '#2A2514' : '#FCF7E8';
  const borderCol = isDarkMode ? '#333333' : '#E0E0E0';
  const textCol = isDarkMode ? '#FFFFFF' : '#111111';
  const textSec = isDarkMode ? '#AAAAAA' : '#828282';

  return (
    <React.Fragment>
      <TableRow
        sx={{
          '& > *': {
            borderBottom: openView ? 'none' : `1px solid ${borderCol}`,
          },
        }}
      >
        <TableCell>
          <Chip
            label={row.id}
            size="small"
            sx={{
              backgroundColor: lightGoldBg,
              color: goldColor,
              fontWeight: 'bold',
              borderRadius: 1,
              px: 0.5,
            }}
          />
        </TableCell>

        <TableCell>
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bold', color: textCol }}
          >
            {row.description}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Switch
              size="small"
              checked={row.isActive}
              onChange={() => onToggleStatus(row.id)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#137333',
                  '&:hover': {
                    backgroundColor: 'rgba(19, 115, 51, 0.08)',
                  },
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
                backgroundColor: row.isActive
                  ? isDarkMode
                    ? '#0A2E1A'
                    : '#E6F4EA'
                  : isDarkMode
                    ? '#3C1414'
                    : '#FCE8E6',
                color: row.isActive ? '#137333' : '#C5221F',
                fontWeight: 'bold',
                borderRadius: 4,
                px: 1,
                minWidth: '70px',
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
              px: 1,
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
                padding: '4px',
              }}
            >
              <VisibilityOutlinedIcon
                sx={{
                  fontSize: '1.2rem',
                  color: openView ? goldColor : '#4A90E2',
                }}
              />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => onEdit(row)}
              sx={{
                border: `1px solid ${goldColor}`,
                padding: '4px',
              }}
            >
              <EditOutlinedIcon
                sx={{
                  fontSize: '1.2rem',
                  color: isDarkMode ? '#CCC' : '#555',
                }}
              />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => onDelete(row)}
              sx={{
                border: `1px solid ${goldColor}`,
                padding: '4px',
              }}
            >
              <DeleteOutlinedIcon
                sx={{
                  fontSize: '1.2rem',
                  color: isDarkMode ? '#CCC' : '#555',
                }}
              />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell
          style={{
            paddingBottom: 0,
            paddingTop: 0,
            border: 0,
          }}
          colSpan={5}
        >
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
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 'bold',
                  color: goldColor,
                  mb: 2,
                }}
              >
                Detalles del Rol
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 'bold',
                      color: textSec,
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    ID DEL ROL
                  </Typography>

                  <TextField
                    fullWidth
                    size="small"
                    value={row.id}
                    disabled
                    sx={{
                      backgroundColor: isDarkMode ? '#2A2A2A' : '#EAEAEA',
                      input: {
                        color: textCol,
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 'bold',
                      color: textSec,
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    DESCRIPCIÓN
                  </Typography>

                  <TextField
                    fullWidth
                    size="small"
                    value={row.description}
                    disabled
                    sx={{
                      backgroundColor: isDarkMode ? '#2A2A2A' : '#EAEAEA',
                      input: {
                        color: textCol,
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 'bold',
                      color: textSec,
                      mb: 1,
                      display: 'block',
                    }}
                  >
                    ESTADO
                  </Typography>

                  <TextField
                    fullWidth
                    size="small"
                    value={row.isActive ? 'Activo' : 'Inactivo'}
                    disabled
                    sx={{
                      backgroundColor: isDarkMode ? '#2A2A2A' : '#EAEAEA',
                      input: {
                        color: row.isActive ? '#137333' : '#C5221F',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    width: '4px',
                    height: '18px',
                    backgroundColor: goldColor,
                    borderRadius: '2px',
                  }}
                />

                <Typography
                  variant="subtitle2"
                  sx={{ color: goldColor, fontWeight: 'bold' }}
                >
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
                  overflow: 'hidden',
                }}
              >
                {allPermissions.map((perm, index) => {
                  const hasPerm = row.permissionsList.includes(perm.id);

                  return (
                    <Box
                      key={perm.id}
                      sx={{
                        p: 1.5,
                        borderBottom:
                          index < allPermissions.length - 2
                            ? `1px solid ${borderCol}`
                            : 'none',
                        borderRight:
                          index % 2 === 0
                            ? `1px solid ${borderCol}`
                            : 'none',
                        opacity: hasPerm ? 1 : 0.4,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={hasPerm}
                            disabled
                            sx={{
                              color: borderCol,
                              '&.Mui-checked': { color: goldColor },
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              color: isDarkMode ? '#CCC' : '#555',
                            }}
                          >
                            {perm.descripcion}
                          </Typography>
                        }
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

  const [rows, setRows] = useState<RoleData[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [formDesc, setFormDesc] = useState('');
  const [formPerms, setFormPerms] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);

  const [adminAlertOpen, setAdminAlertOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const goldColor = '#D6A848';
  const lightGoldBg = isDarkMode ? '#2A2514' : '#FCF7E8';
  const bgMain = isDarkMode ? '#121212' : '#F8F9FA';
  const paperBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const borderCol = isDarkMode ? '#333333' : '#E0E0E0';
  const textCol = isDarkMode ? '#FFFFFF' : '#111111';
  const textSec = isDarkMode ? '#AAAAAA' : '#828282';

  const itemsPerPage = 5;

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [roles, permisos] = await Promise.all([
        rolService.listar(),
        rolService.listarPermisos(),
      ]);
      setRows(roles.map(aRoleData));
      setAllPermissions(permisos);
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  };

  const handleToggleAll = () => {
    if (formPerms.length === allPermissions.length) {
      setFormPerms([]);
    } else {
      setFormPerms(allPermissions.map((p) => p.id));
    }
  };

  const handleToggleStatus = async (id: string) => {
    const role = rows.find((r) => r.id === id);
    if (!role) return;
    try {
      const actualizado = await rolService.cambiarEstado(
        id,
        role.isActive ? 'Inactivo' : 'Activo'
      );
      setRows((prev) =>
        prev.map((r) => (r.id === id ? aRoleData(actualizado) : r))
      );
      toast.success(`Rol ${actualizado.estado.toLowerCase()}`);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const handleSaveRole = async () => {
    if (!formDesc.trim() || formPerms.length === 0 || saving) return;

    const datos = {
      descripcion: formDesc.trim(),
      estado: formIsActive ? ('Activo' as const) : ('Inactivo' as const),
      permisos: formPerms,
    };

    setSaving(true);
    try {
      if (editingRole) {
        const actualizado = await rolService.actualizar(editingRole.id, datos);
        setRows((prev) =>
          prev.map((r) => (r.id === editingRole.id ? aRoleData(actualizado) : r))
        );
        toast.success('Rol actualizado correctamente');
      } else {
        const nuevo = await rolService.crear(datos);
        setRows((prev) => [...prev, aRoleData(nuevo)]);
        setCurrentPage(Math.ceil((rows.length + 1) / itemsPerPage));
        toast.success('Rol creado correctamente');
      }
      handleCloseModal();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoleAttempt = async (role: RoleData) => {
    if (esRolAdmin(role.description)) {
      setAdminAlertOpen(true);
      return;
    }

    if (!window.confirm(`¿Seguro deseas eliminar el rol ${role.description}?`)) return;

    try {
      await rolService.eliminar(role.id);
      setRows((prev) => prev.filter((r) => r.id !== role.id));
      toast.success('Rol eliminado');
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const filteredRows = rows.filter(
    (r) =>
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const indexOfLastItem = safePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRows = filteredRows.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: bgMain,
        color: textCol,
        transition: 'background-color 0.3s ease',
      }}
    >
      <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto' }}>
        {/* CABECERA */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ mb: 0.5, color: textCol, fontWeight: 800 }}
            >
              Roles
            </Typography>

            <Typography variant="body2" sx={{ color: textSec }}>
              Roles del sistema con permisos asignados
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* BUSCADOR CON DISEÑO IGUAL AL DE LA IMAGEN */}
            <TextField
              variant="outlined"
              placeholder="Buscar rol..."
              size="small"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              sx={{
                width: '270px',
                backgroundColor: isDarkMode ? '#1E1E1E' : '#F9F9F9',
                borderRadius: '10px',

                '& .MuiOutlinedInput-root': {
                  height: '34px',
                  borderRadius: '10px',
                  paddingLeft: '10px',
                  fontSize: '13px',
                  fontFamily: 'Arial, sans-serif',

                  '& fieldset': {
                    borderColor: isDarkMode ? '#383838' : '#E1E1E1',
                    borderWidth: '1px',
                  },

                  '&:hover fieldset': {
                    borderColor: isDarkMode ? '#555555' : '#D5D5D5',
                  },

                  '&.Mui-focused fieldset': {
                    borderColor: isDarkMode ? '#777777' : '#D1D1D1',
                    borderWidth: '1px',
                  },
                },

                '& .MuiInputBase-input': {
                  padding: '7px 0',
                  color: isDarkMode ? '#E0E0E0' : '#555555',
                  fontSize: '13px',

                  '&::placeholder': {
                    color: isDarkMode ? '#999999' : '#777777',
                    opacity: 1,
                  },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ marginRight: '8px' }}
                    >
                      <SearchIcon
                        sx={{
                          fontSize: '16px',
                          color: isDarkMode ? '#999999' : '#777777',
                        }}
                      />
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

        {/* TABLA */}
        <TableContainer
          component={Paper}
          sx={{
            boxShadow: 'none',
            border: `1px solid ${borderCol}`,
            borderRadius: 2,
            backgroundColor: paperBg,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                {[
                  'ID ROL',
                  'DESCRIPCIÓN',
                  'ESTADO',
                  'PERMISOS',
                  'ACCIONES',
                ].map((headCell) => (
                  <TableCell
                    key={headCell}
                    sx={{
                      color: goldColor,
                      fontWeight: 'bold',
                      borderBottom: `2px solid ${goldColor}`,
                      letterSpacing: '0.5px',
                      backgroundColor: paperBg,
                    }}
                  >
                    {headCell}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {currentRows.map((row) => (
                <RoleRow
                  key={row.id}
                  row={row}
                  allPermissions={allPermissions}
                  isDarkMode={isDarkMode}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteRoleAttempt}
                  onToggleStatus={handleToggleStatus}
                />
              ))}

              {currentRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="center"
                    sx={{ py: 4, color: textSec }}
                  >
                    {loading ? 'Cargando roles...' : 'No se encontraron roles.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINACIÓN */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            px: 1,
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" sx={{ color: textSec }}>
            Mostrando de{' '}
            {filteredRows.length === 0 ? 0 : indexOfFirstItem + 1} a{' '}
            {Math.min(indexOfLastItem, filteredRows.length)} de{' '}
            {filteredRows.length} roles
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              }
              disabled={safePage === 1}
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                color: textCol,
                borderColor: borderCol,
              }}
            >
              Anterior
            </Button>

            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', px: 1, color: textCol }}
            >
              Página {safePage} de {totalPages || 1}
            </Typography>

            <Button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, totalPages)
                )
              }
              disabled={safePage >= totalPages || totalPages === 0}
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                color: textCol,
                borderColor: borderCol,
              }}
            >
              Siguiente
            </Button>
          </Box>
        </Box>
      </Box>

      {/* MODAL CREAR / EDITAR ROL */}
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
              border: `1px solid ${borderCol}`,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
          </Typography>

          <IconButton
            onClick={handleCloseModal}
            size="small"
            sx={{ color: textCol }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            borderTop: `1px solid ${borderCol}`,
            borderBottom: `1px solid ${borderCol}`,
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, mb: 4, mt: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color: textSec,
                  mb: 1,
                  display: 'block',
                }}
              >
                ID (AUTO)
              </Typography>

              <TextField
                fullWidth
                size="small"
                value={editingRole ? editingRole.id : 'Se genera al guardar'}
                disabled
                sx={{
                  backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6',
                  input: { color: textCol },
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color: textSec,
                  mb: 1,
                  display: 'block',
                }}
              >
                DESCRIPCIÓN *
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Ej: Admin"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                error={!formDesc.trim()}
                helperText={
                  !formDesc.trim()
                    ? 'La descripción es obligatoria'
                    : ''
                }
                sx={{
                  backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB',
                  input: { color: textCol },
                }}
              />
            </Box>

            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 'bold',
                  color: textSec,
                  mb: 1,
                  display: 'block',
                }}
              >
                ESTADO
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={formIsActive}
                    onChange={(e) =>
                      setFormIsActive(e.target.checked)
                    }
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#137333',
                        '&:hover': {
                          backgroundColor: 'rgba(19, 115, 51, 0.08)',
                        },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                        {
                          backgroundColor: '#137333',
                        },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      color: formIsActive ? '#137333' : '#C5221F',
                    }}
                  >
                    {formIsActive ? 'Activo' : 'Inactivo'}
                  </Typography>
                }
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Box
                sx={{
                  width: '4px',
                  height: '18px',
                  backgroundColor: goldColor,
                  borderRadius: '2px',
                }}
              />

              <Typography
                variant="subtitle2"
                sx={{
                  color: goldColor,
                  fontWeight: 'bold',
                  letterSpacing: '0.5px',
                }}
              >
                ASIGNAR PERMISOS *
              </Typography>

              <Chip
                label={`${formPerms.length}/${allPermissions.length}`}
                size="small"
                sx={{
                  backgroundColor: lightGoldBg,
                  color: goldColor,
                  fontWeight: 'bold',
                  height: '20px',
                }}
              />
            </Box>

            <Button
              size="small"
              onClick={handleToggleAll}
              sx={{
                backgroundColor: isDarkMode ? '#333' : '#F3F4F6',
                color: textCol,
                textTransform: 'none',
                fontWeight: 'bold',
                borderRadius: 2,
              }}
            >
              {allPermissions.length > 0 && formPerms.length === allPermissions.length
                ? 'Desmarcar todos'
                : 'Marcar todos'}
            </Button>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
              },
              border: `1px solid ${borderCol}`,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            {allPermissions.map((perm, index) => (
              <Box
                key={perm.id}
                sx={{
                  p: 1.5,
                  borderBottom:
                    index < allPermissions.length - 2
                      ? `1px solid ${borderCol}`
                      : 'none',
                  borderRight: {
                    xs: 'none',
                    sm: index % 2 === 0
                      ? `1px solid ${borderCol}`
                      : 'none',
                  },
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={formPerms.includes(perm.id)}
                      onChange={() => handleTogglePermission(perm.id)}
                      sx={{
                        color: borderCol,
                        '&.Mui-checked': { color: goldColor },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: isDarkMode ? '#CCC' : '#555',
                      }}
                    >
                      {perm.descripcion}
                    </Typography>
                  }
                  sx={{ margin: 0 }}
                />
              </Box>
            ))}
          </Box>

          {formPerms.length === 0 && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 1, display: 'block' }}
            >
              Debe seleccionar al menos un permiso.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseModal}
            variant="outlined"
            sx={{
              color: textSec,
              borderColor: borderCol,
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSaveRole}
            variant="contained"
            disabled={!formDesc.trim() || formPerms.length === 0 || saving}
            sx={{
              backgroundColor: goldColor,
              color: '#000',
              fontWeight: 'bold',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: '#C59A3D',
                boxShadow: 'none',
              },
              '&.Mui-disabled': {
                backgroundColor: isDarkMode ? '#333' : '#E0E0E0',
                color: '#888',
              },
            }}
          >
            {saving ? 'Guardando...' : 'Guardar rol'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL ADVERTENCIA ROL ADMINISTRADOR */}
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
              border: `1px solid ${borderCol}`,
            },
          },
        }}
      >
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            pt: 2,
          }}
        >
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: lightGoldBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningAmberRoundedIcon
              sx={{ color: goldColor, fontSize: '2rem' }}
            />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Acción no permitida
          </Typography>

          <Typography variant="body2" sx={{ color: textSec }}>
            Por razones de seguridad del sistema,{' '}
            <strong>
              no se puede eliminar el rol de Administrador
            </strong>
            .
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
              '&:hover': {
                backgroundColor: '#C59A3D',
                boxShadow: 'none',
              },
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
