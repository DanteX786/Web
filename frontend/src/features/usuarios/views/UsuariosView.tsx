import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Mail, Pencil, UsersRound } from 'lucide-react';
import { toast } from 'sonner';

import { mensajeError } from '../../../shared/utils/api';
import { exportarExcel, subtituloExportacion } from '../../../shared/utils/excel';
import { nombreTipoDocumento, type EstadoCuenta, type TipoUsuario } from '../../auth/services/authService';
import { usuarioService, type UsuarioMaestro } from '../services/usuarioService';
import { clienteService } from '../services/clienteService';
import { empleadoService } from '../services/empleadoService';
import {
  GOLD, INFO, SUCCESS, WARNING, DANGER, FONT, tema, estiloInput, fechaHora, coincide,
  IdBadge, Pill, ActionCircleBtn, TableShell, FilaMensaje, Modal, ModuleHeader, Paginacion, Kpi, ConfirmDialog,
} from '../../produccion/components/ui';

interface Props {
  dark?: boolean;
  /** Ir a Empleados o Clientes para editar los datos (App le pasa setCurrentView). */
  onNavegar?: (vista: string) => void;
}

const POR_PAGINA = 10;

const COLOR_CUENTA: Record<EstadoCuenta, string> = {
  'Activa': SUCCESS,
  'Invitado': WARNING,
  'Sin acceso': '#8A8A8A',
};

const TEXTO_CUENTA: Record<EstadoCuenta, string> = {
  'Activa': 'Puede entrar al aplicativo.',
  'Invitado': 'Se le envió el acceso y aún no lo usa.',
  'Sin acceso': 'Lo registró el taller; todavía no tiene cuenta.',
};

/**
 * Módulo Usuarios: tabla maestra con TODOS los empleados y clientes.
 * Es de consulta: los datos se editan en Empleados o en Clientes y la base de datos
 * los copia solos aquí. Desde aquí se puede (re)enviar el acceso a quien no ha entrado.
 */
export default function UsuariosView({ dark = false, onNavegar }: Props) {
  const t = tema(dark);
  const [usuarios, setUsuarios] = useState<UsuarioMaestro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'' | TipoUsuario>('');
  const [filtroCuenta, setFiltroCuenta] = useState<'' | EstadoCuenta>('');
  const [pagina, setPagina] = useState(1);
  const [detalle, setDetalle] = useState<UsuarioMaestro | null>(null);
  const [paraInvitar, setParaInvitar] = useState<UsuarioMaestro | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = async () => {
    try {
      setUsuarios(await usuarioService.listar());
    } catch (e) {
      toast.error(`No se pudieron cargar los usuarios: ${mensajeError(e)}`);
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => { cargar(); }, []);

  const filtrados = useMemo(() => usuarios
    .filter((u) => !filtroTipo || u.tipo_usuario === filtroTipo)
    .filter((u) => !filtroCuenta || u.estado_cuenta === filtroCuenta)
    .filter((u) => coincide(busqueda, [
      u.id_usuario, u.id_origen, u.tipo_usuario, u.documento, nombreTipoDocumento(u.tipo_documento), u.nombre,
      u.correo, u.telefono, u.rol, u.estado, u.estado_cuenta, u.origen, u.creado_por_nombre,
    ])), [usuarios, busqueda, filtroTipo, filtroCuenta]);

  useEffect(() => { setPagina(1); }, [busqueda, filtroTipo, filtroCuenta]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const cuenta = (e: EstadoCuenta) => usuarios.filter((u) => u.estado_cuenta === e).length;

  /** Cliente: enlace para activar la cuenta. Empleado: nueva contraseña temporal. */
  const puedeInvitar = (u: UsuarioMaestro) => u.estado === 'Activo' && u.estado_cuenta !== 'Activa';

  const confirmarInvitacion = async () => {
    if (!paraInvitar) return;
    setEnviando(true);
    try {
      if (paraInvitar.tipo_usuario === 'Cliente') {
        await clienteService.invitar(paraInvitar.id_origen);
        toast.success(`Le enviamos a ${paraInvitar.correo} el enlace para activar su cuenta.`);
      } else {
        await empleadoService.reenviarAcceso(paraInvitar.id_origen);
        toast.success(`Le enviamos a ${paraInvitar.correo} una nueva contraseña temporal.`);
      }
      setParaInvitar(null);
      await cargar();
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  };

  const descargarExcel = () => exportarExcel({
    archivo: 'usuarios', hoja: 'Usuarios', titulo: 'Usuarios (empleados y clientes)',
    subtitulo: subtituloExportacion(busqueda, filtrados.length)
      + (filtroTipo ? ` · Tipo: ${filtroTipo}` : '') + (filtroCuenta ? ` · Cuenta: ${filtroCuenta}` : ''),
    filas: filtrados,
    columnas: [
      { titulo: 'ID usuario', valor: (u) => u.id_usuario },
      { titulo: 'Tipo', valor: (u) => u.tipo_usuario },
      { titulo: 'Tipo de documento', valor: (u) => (u.tipo_documento ? nombreTipoDocumento(u.tipo_documento) : 'Identificación') },
      { titulo: 'Documento', valor: (u) => u.documento },
      { titulo: 'Nombre', valor: (u) => u.nombre },
      { titulo: 'Correo', valor: (u) => u.correo },
      { titulo: 'Teléfono', valor: (u) => u.telefono },
      { titulo: 'Rol', valor: (u) => u.rol },
      { titulo: 'Estado', valor: (u) => u.estado },
      { titulo: 'Cuenta', valor: (u) => u.estado_cuenta },
      { titulo: 'Origen', valor: (u) => u.origen },
      { titulo: 'Creado por', valor: (u) => u.creado_por_nombre },
      { titulo: 'Fecha de creación', valor: (u) => u.fecha_creacion?.slice(0, 10), tipo: 'fecha' },
      { titulo: 'Fecha de activación', valor: (u) => u.fecha_activacion?.slice(0, 10), tipo: 'fecha' },
    ],
  });

  const celda: React.CSSProperties = { padding: '12px 14px', fontSize: 12 };
  const fila = (etiqueta: string, valor: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
      <span style={{ color: t.subtle }}>{etiqueta}</span>
      <span style={{ color: t.fg, fontWeight: 600, textAlign: 'right' }}>{valor ?? '—'}</span>
    </div>
  );

  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <ModuleHeader
        title="Usuarios"
        subtitle="Todos los empleados y clientes en un solo lugar, con su rol y el estado de su cuenta."
        search={busqueda}
        onSearch={setBusqueda}
        excel={{ onClick: descargarExcel, cantidad: filtrados.length }}
        dark={dark}
        extra={
          <>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as '' | TipoUsuario)}
              style={estiloInput(dark, { width: 150, padding: '8px 10px' })}>
              <option value="">Todos los tipos</option>
              <option value="Empleado">Empleados</option>
              <option value="Cliente">Clientes</option>
            </select>
            <select value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value as '' | EstadoCuenta)}
              style={estiloInput(dark, { width: 170, padding: '8px 10px' })}>
              <option value="">Todas las cuentas</option>
              <option value="Activa">Activa</option>
              <option value="Invitado">Invitado</option>
              <option value="Sin acceso">Sin acceso</option>
            </select>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Kpi label="Usuarios" valor={usuarios.length} color={GOLD} dark={dark}
          nota={`${usuarios.filter((u) => u.tipo_usuario === 'Empleado').length} empleados · ${usuarios.filter((u) => u.tipo_usuario === 'Cliente').length} clientes`} />
        <Kpi label="Cuenta activa" valor={cuenta('Activa')} color={SUCCESS} dark={dark} />
        <Kpi label="Invitados" valor={cuenta('Invitado')} color={WARNING} dark={dark} nota="Aún no entran" />
        <Kpi label="Sin acceso" valor={cuenta('Sin acceso')} color="#8A8A8A" dark={dark} nota="Clientes sin cuenta" />
      </div>

      <TableShell headers={['Usuario', 'Tipo', 'Documento', 'Nombre', 'Correo', 'Rol', 'Estado', 'Cuenta', 'Acciones']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={9} dark={dark} cargando={cargando}
            texto={usuarios.length === 0 ? 'Todavía no hay usuarios.' : 'No hay usuarios con ese filtro.'} />
        ) : visibles.map((u) => (
          <tr key={u.id_usuario} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={celda}><IdBadge id={u.id_usuario} /></td>
            <td style={celda}>
              <Pill texto={u.tipo_usuario} color={u.tipo_usuario === 'Empleado' ? INFO : GOLD}
                bg={u.tipo_usuario === 'Empleado' ? `${INFO}1A` : `${GOLD}1F`} />
            </td>
            <td style={{ ...celda, fontFamily: 'monospace' }}>
              {u.documento}
              <div style={{ fontSize: 10, color: t.subtle, fontFamily: FONT }}>{u.tipo_documento ?? 'Identificación'}</div>
            </td>
            <td style={{ ...celda, fontWeight: 700, color: t.fg, fontSize: 13 }}>{u.nombre}</td>
            <td style={{ ...celda, color: INFO }}>{u.correo}</td>
            <td style={{ ...celda, color: t.subtle }}>{u.rol}</td>
            <td style={celda}>
              <Pill texto={u.estado} color={u.estado === 'Activo' ? SUCCESS : DANGER}
                bg={u.estado === 'Activo' ? `${SUCCESS}1A` : `${DANGER}1A`} />
            </td>
            <td style={celda} title={TEXTO_CUENTA[u.estado_cuenta]}>
              <Pill texto={u.estado_cuenta} color={COLOR_CUENTA[u.estado_cuenta]} bg={`${COLOR_CUENTA[u.estado_cuenta]}1F`} />
            </td>
            <td style={celda}>
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionCircleBtn variant="blue" onClick={() => setDetalle(u)} title="Ver detalle"><Eye size={14} /></ActionCircleBtn>
                <ActionCircleBtn variant="success" onClick={() => setParaInvitar(u)} disabled={!puedeInvitar(u)}
                  title={!puedeInvitar(u)
                    ? (u.estado_cuenta === 'Activa' ? 'Ya tiene su cuenta activa' : 'El usuario está inactivo')
                    : u.tipo_usuario === 'Cliente'
                      ? (u.estado_cuenta === 'Invitado' ? 'Reenviar invitación' : 'Enviar invitación para activar la cuenta')
                      : 'Reenviar contraseña temporal'}>
                  <Mail size={14} />
                </ActionCircleBtn>
                {onNavegar && (
                  <ActionCircleBtn variant="gold" onClick={() => onNavegar(u.tipo_usuario === 'Cliente' ? 'clientes' : 'empleados')}
                    title={`Editar sus datos en ${u.tipo_usuario === 'Cliente' ? 'Clientes' : 'Empleados'}`}>
                    <Pencil size={14} />
                  </ActionCircleBtn>
                )}
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      <Paginacion pagina={pagina} total={totalPaginas} registros={filtrados.length} porPagina={POR_PAGINA} onCambiar={setPagina} dark={dark} />

      {detalle && (
        <Modal title={`Usuario ${detalle.id_usuario}`} icon={<UsersRound size={16} color={GOLD} />} onClose={() => setDetalle(null)} dark={dark} maxWidth="520px">
          {fila('Tipo', detalle.tipo_usuario)}
          {fila(detalle.tipo_usuario === 'Cliente' ? 'NIT / documento' : 'ID de empleado', detalle.id_origen)}
          {fila(detalle.tipo_documento ? nombreTipoDocumento(detalle.tipo_documento) : 'Identificación', detalle.documento)}
          {fila('Nombre', detalle.nombre)}
          {fila('Correo', detalle.correo)}
          {fila('Teléfono', detalle.telefono)}
          {fila('Dirección', detalle.direccion)}
          {fila('Rol', detalle.rol)}
          {fila('Estado', detalle.estado)}
          {fila('Cuenta', <Pill texto={detalle.estado_cuenta} color={COLOR_CUENTA[detalle.estado_cuenta]} bg={`${COLOR_CUENTA[detalle.estado_cuenta]}1F`} />)}
          {fila('Origen', detalle.origen)}
          {fila('Creado por', detalle.creado_por_nombre)}
          {fila('Fecha de creación', fechaHora(detalle.fecha_creacion))}
          {fila('Última invitación', detalle.fecha_invitacion ? fechaHora(detalle.fecha_invitacion) : null)}
          {fila('Activó su cuenta', detalle.fecha_activacion ? fechaHora(detalle.fecha_activacion) : null)}
          {detalle.tipo_usuario === 'Cliente' && fila('Aceptó tratamiento de datos',
            detalle.acepto_tratamiento_datos && detalle.fecha_aceptacion_datos ? `Sí, ${fechaHora(detalle.fecha_aceptacion_datos)}` : 'No')}
          <p style={{ fontSize: 11, color: t.subtle, margin: '14px 0 0' }}>
            Los datos personales se editan en {detalle.tipo_usuario === 'Cliente' ? 'Clientes' : 'Empleados'} y se copian solos a esta tabla.
          </p>
        </Modal>
      )}

      {paraInvitar && (
        <ConfirmDialog
          titulo={paraInvitar.tipo_usuario === 'Cliente'
            ? `¿${paraInvitar.estado_cuenta === 'Invitado' ? 'Reenviar' : 'Enviar'} invitación a ${paraInvitar.nombre}?`
            : `¿Reenviar el acceso a ${paraInvitar.nombre}?`}
          mensaje={paraInvitar.tipo_usuario === 'Cliente'
            ? `Le llegará a ${paraInvitar.correo} un enlace para crear su contraseña (vence en 72 horas). Si ya tenía uno, el anterior deja de servir.`
            : `Le llegará a ${paraInvitar.correo} una nueva contraseña temporal. Al entrar deberá crear la suya.`}
          confirmarLabel="Sí, enviar"
          variante="success"
          icono={<Mail size={28} color={SUCCESS} />}
          procesando={enviando}
          onCancel={() => setParaInvitar(null)}
          onConfirm={confirmarInvitacion}
          dark={dark}
        />
      )}
    </div>
  );
}
