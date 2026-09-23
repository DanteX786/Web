import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

interface Employee {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  correo: string;
  codRol: string;
  rol: string;
  identificacion: string;
  estado: string;
  password?: string; 
}

interface EmpleadosModuloProps {
  dark?: boolean;
}

const initialEmployees: Employee[] = [
  { id: 'EMP-001', nombre: 'Andres', telefono: '3024243019', direccion: 'Cra 45099', correo: 'andres@taller.com', codRol: 'ROL-02', rol: 'Empleado', identificacion: '10293120', estado: 'ACTIVO' },
  { id: 'EMP-002', nombre: 'Juan', telefono: '3024243019', direccion: 'Cra 567', correo: 'juan@taller.com', codRol: 'ROL-02', rol: 'Empleado', identificacion: '10293121', estado: 'ACTIVO' },
  { id: 'EMP-003', nombre: 'Emerson', telefono: '3024243019', direccion: 'Cra 4577', correo: 'emerson@taller.com', codRol: 'ROL-02', rol: 'Empleado', identificacion: '10293122', estado: 'ACTIVO' },
];

const styles = {
  goldText: { color: '#d6a848', fontWeight: 'bold', fontSize: '0.85rem' },
  badgeGold: { backgroundColor: '#fcf8eb', color: '#d6a848', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', display: 'inline-block' },
  btnGold: { backgroundColor: '#dfb754', color: '#000', textTransform: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: '#cda542' } },
  tableHeader: { borderBottom: '2px solid #dfb754' },
  
  getStatusStyle: (status: string) => ({
    backgroundColor: status === 'ACTIVO' ? '#e6f4ea' : '#fce8e8',
    color: status === 'ACTIVO' ? '#1e8e3e' : '#d93025',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    borderRadius: '20px',
    padding: '0',
    display: 'flex',
    alignItems: 'center'
  }),

  modalInput: {
    backgroundColor: '#f4f5f7',
    borderRadius: '8px',
    mt: 0.5,
    '& .MuiOutlinedInput-root': {
      '& fieldset': { border: 'none' },
    },
    '& .MuiInputBase-input': {
      padding: '10px 14px',
    }
  },
  modalLabel: {
    fontWeight: 'bold',
    color: '#888',
    fontSize: '0.75rem',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  }
};

export default function EmpleadosModulo({ dark }: EmpleadosModuloProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [formData, setFormData] = useState<Partial<Employee>>({});

  const filteredEmployees = employees.filter(emp => 
    emp.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.identificacion.includes(searchQuery) ||
    emp.correo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = (id: string, newStatus: string) => {
    setEmployees(employees.map(emp => emp.id === id ? { ...emp, estado: newStatus } : emp));
  };

  const handleOpenModal = (mode: 'ADD' | 'EDIT', employee: Employee | null = null) => {
    setModalMode(mode);
    setFormData(employee || { id: '', nombre: '', telefono: '', direccion: '', correo: '', codRol: 'ROL-02', rol: 'Empleado', identificacion: '', estado: 'ACTIVO', password: '' });
    setOpenModal(true);
  };

  const handleSave = () => {
    if (modalMode === 'ADD') {
      const newId = `EMP-00${employees.length + 1}`;
      const newEmployee = { ...formData, id: newId } as Employee;
      setEmployees([...employees, newEmployee]);
    } else {
      setEmployees(employees.map(emp => emp.id === formData.id ? (formData as Employee) : emp));
    }
    setOpenModal(false);
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const autoId = `EMP-00${employees.length + 1}`;

  return (
    <Box sx={{ p: 4, backgroundColor: dark ? '#121212' : '#f8f9fa', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: dark ? '#fff' : '#1a1a1a' }}>Empleados</Typography>
          <Typography variant="body1" sx={{ color: '#888' }}>Personal registrado en el taller</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Buscar..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              backgroundColor: dark ? '#333' : '#fff', 
              borderRadius: '8px', 
              minWidth: '250px',
              '& .MuiOutlinedInput-root': { borderRadius: '8px' }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#aaa' }} />
                  </InputAdornment>
                ),
              }
            }}
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            sx={styles.btnGold}
            onClick={() => handleOpenModal('ADD')}
          >
            Nuevo empleado
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', backgroundColor: dark ? '#1e1e1e' : '#fff' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }}>ID EMPLEADO</TableCell>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }}>NOMBRE</TableCell>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }}>TELÉFONO</TableCell>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }}>DIRECCIÓN</TableCell>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }}>CORREO</TableCell>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }}>ROL</TableCell>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }}>IDENTIFICACIÓN</TableCell>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }}>ESTADO</TableCell>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }}>CONTRASEÑA</TableCell>
              <TableCell sx={{ ...styles.goldText, ...styles.tableHeader }} align="center">ACCIONES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((row) => (
              <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, backgroundColor: dark ? '#1e1e1e' : '#fafafa' }}>
                <TableCell><Box sx={styles.badgeGold}>{row.id}</Box></TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: dark ? '#ddd' : 'inherit' }}>{row.nombre}</TableCell>
                <TableCell sx={{ color: '#666' }}>{row.telefono}</TableCell>
                <TableCell sx={{ color: '#666' }}>{row.direccion}</TableCell>
                <TableCell>
                  <Link href={`mailto:${row.correo}`} sx={{ color: '#4da6ff', textDecoration: 'none' }}>
                    {row.correo}
                  </Link>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={styles.badgeGold}>{row.codRol}</Box>
                    <Typography variant="body2" sx={{ color: '#666' }}>{row.rol}</Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: '500', color: dark ? '#ddd' : 'inherit' }}>{row.identificacion}</TableCell>
                <TableCell>
                  <Select
                    value={row.estado}
                    onChange={(e) => handleStatusChange(row.id, e.target.value as string)}
                    size="small"
                    disableUnderline
                    variant="standard"
                    sx={{ ...styles.getStatusStyle(row.estado), pl: 1.5, pr: 0.5, '& .MuiSelect-select': { paddingRight: '24px !important' }, '&::before, &::after': { display: 'none' } }}
                  >
                    <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                    <MenuItem value="INACTIVO">INACTIVO</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ letterSpacing: '2px', mt: 1, color: dark ? '#ddd' : 'inherit' }}>
                      {showPassword[row.id] ? (row.password || 'password123') : '••••••••'}
                    </Typography>
                    <IconButton size="small" onClick={() => togglePasswordVisibility(row.id)}>
                      {showPassword[row.id] ? <VisibilityIcon fontSize="small" sx={{ color: '#bbb' }}/> : <VisibilityOffIcon fontSize="small" sx={{ color: '#bbb' }}/>}
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpenModal('EDIT', row)} size="small" sx={{ color: '#dfb754' }}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box sx={{ p: 2, backgroundColor: dark ? '#121212' : '#fcfcfc', borderTop: '1px solid #eee' }}>
          <Typography variant="body2" sx={{ color: '#888' }}>{filteredEmployees.length} registros</Typography>
        </Box>
      </TableContainer>

      {/* Modal Rediseñado sin Componente Grid y actualizando slotProps para el paper */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        maxWidth="sm" 
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '12px',
              borderTop: '4px solid #dfb754' 
            }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          {modalMode === 'ADD' ? 'Nuevo Empleado' : 'Editar Empleado'}
          <IconButton onClick={() => setOpenModal(false)} size="small" sx={{ color: '#aaa' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderBottom: 'none', px: 4, py: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
            <Box>
              <Typography sx={styles.modalLabel}>ID (AUTO)</Typography>
              <TextField fullWidth disabled value={modalMode === 'ADD' ? autoId : formData.id} sx={styles.modalInput} />
            </Box>
            <Box>
              <Typography sx={styles.modalLabel}>NOMBRE</Typography>
              <TextField fullWidth placeholder="Nombre completo" value={formData.nombre || ''} onChange={(e) => setFormData({...formData, nombre: e.target.value})} sx={styles.modalInput} />
            </Box>

            <Box>
              <Typography sx={styles.modalLabel}>TELÉFONO</Typography>
              <TextField fullWidth placeholder="300 000 0000" value={formData.telefono || ''} onChange={(e) => setFormData({...formData, telefono: e.target.value})} sx={styles.modalInput} />
            </Box>
            <Box>
              <Typography sx={styles.modalLabel}>IDENTIFICACIÓN</Typography>
              <TextField fullWidth placeholder="Ej: 10293120" value={formData.identificacion || ''} onChange={(e) => setFormData({...formData, identificacion: e.target.value})} sx={styles.modalInput} />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={styles.modalLabel}>CORREO</Typography>
              <TextField fullWidth placeholder="correo@ejemplo.com" value={formData.correo || ''} onChange={(e) => setFormData({...formData, correo: e.target.value})} sx={styles.modalInput} />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={styles.modalLabel}>DIRECCIÓN</Typography>
              <TextField fullWidth placeholder="Ej: Cra 45 #099" value={formData.direccion || ''} onChange={(e) => setFormData({...formData, direccion: e.target.value})} sx={styles.modalInput} />
            </Box>

            <Box>
              <Typography sx={styles.modalLabel}>ROL</Typography>
              <Select 
                value={formData.rol || 'Empleado'} 
                onChange={(e) => {
                   const val = e.target.value as string;
                   const cod = val === 'Administrador' ? 'ROL-01' : 'ROL-02';
                   setFormData({...formData, rol: val, codRol: cod});
                }}
                fullWidth 
                sx={styles.modalInput}
              >
                <MenuItem value="Administrador">ROL-01 — Admin</MenuItem>
                <MenuItem value="Empleado">ROL-02 — Empleado</MenuItem>
              </Select>
            </Box>
            <Box>
              <Typography sx={styles.modalLabel}>ESTADO</Typography>
              <Select 
                value={formData.estado || 'ACTIVO'} 
                onChange={(e) => setFormData({...formData, estado: e.target.value})} 
                fullWidth 
                sx={styles.modalInput}
              >
                <MenuItem value="ACTIVO">Activo</MenuItem>
                <MenuItem value="INACTIVO">Inactivo</MenuItem>
              </Select>
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography sx={styles.modalLabel}>CONTRASEÑA</Typography>
              <TextField fullWidth type="password" placeholder="........" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})} sx={styles.modalInput} />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 3, pt: 0, gap: 1 }}>
          <Button 
            onClick={() => setOpenModal(false)} 
            sx={{ backgroundColor: '#e2e8f0', color: '#1a1a1a', fontWeight: 'bold', textTransform: 'none', px: 3, '&:hover': { backgroundColor: '#cbd5e1' } }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            sx={{ ...styles.btnGold, px: 4 }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}