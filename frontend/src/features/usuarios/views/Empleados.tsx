import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserCog, Eye, Pencil, Power, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { mensajeError } from '../../../shared/utils/api';
import { empleadoService, type Empleado, type EmpleadoDatos, type EstadoEmpleado } from '../services/empleadoService';
import { rolService, type Rol } from '../../configuracion/services/rolService';
import { obtenerUsuario } from '../../auth/services/authService';
import { soloDigitos, validarCorreo, validarDireccion, validarTelefono } from '../../auth/utils/validaciones';
import {
  GOLD, SUCCESS, SUCCESS_BG, DANGER, DANGER_BG, WARNING, WARNING_BG, INFO, FONT,
  tema, estiloInput, coincide, useAutoRefresco,
  IdBadge, Pill, ActionCircleBtn, TableShell, FilaMensaje, Modal, Field, ModuleHeader, Paginacion, ConfirmDialog,
} from '../../produccion/components/ui';

interface EmpleadosModuloProps {
  dark?: boolean;
}

const POR_PAGINA = 8;

// ==========================================
// FORMULARIO Y VALIDACIONES (las mismas reglas del backend)
// ==========================================
type Campo = 'nombre' | 'identificacion' | 'correo' | 'telefono' | 'direccion' | 'id_rol';

interface Formulario {
  nombre: string;
  identificacion: string;
  correo: string;
  telefono: string;
  direccion: string;
  id_rol: string;
}

const formularioVacio = (idRol = ''): Formulario => ({
  nombre: '', identificacion: '', correo: '', telefono: '', direccion: '', id_rol: idRol,
});

const validarNombrePersona = (v: string): string | null => {
  const valor = v.trim().replace(/\s+/g, ' ');
  if (!valor) return 'Escribe el nombre completo.';
  if (valor.length > 100) return 'Máximo 100 caracteres.';
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü .'-]+$/.test(valor)) return 'Solo letras y espacios.';
  if (valor.split(' ').filter((p) => p.length >= 2).length < 2) return 'Escribe nombre y apellido.';
  return null;
};

const validarCedula = (v: string): string | null => {
  if (!v) return 'Escribe la cédula.';
  return /^\d{6,10}$/.test(v) ? null : 'La cédula tiene entre 6 y 10 dígitos, sin puntos.';
};

const validarCampo = (campo: Campo, f: Formulario): string | null => {
  switch (campo) {
    case 'nombre': return validarNombrePersona(f.nombre);
    case 'identificacion': return validarCedula(f.identificacion);
    case 'correo': return validarCorreo(f.correo);
    case 'telefono': return validarTelefono('Personal', f.telefono);
    case 'direccion': return validarDireccion(f.direccion);
    case 'id_rol': return f.id_rol ? null : 'Elige el rol.';
  }
};

const CAMPOS: Campo[] = ['nombre', 'identificacion', 'correo', 'telefono', 'direccion', 'id_rol'];

/**
 * Empleados del taller.
 * El administrador registra los datos del empleado; la CONTRASEÑA NO se escribe aquí:
 * el sistema genera una contraseña temporal y la envía al correo del empleado, que debe
 * crear la suya la primera vez que entra. "Reenviar acceso" le manda otra temporal.
 */
export default function EmpleadosModulo({ dark = false }: EmpleadosModuloProps) {
  const t = tema(dark);
  const yo = obtenerUsuario();

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'' | EstadoEmpleado>('');
  const [pagina, setPagina] = useState(1);

  // Formulario (crear / editar)
  const [modal, setModal] = useState<{ empleado: Empleado | null } | null>(null);
  const [form, setForm] = useState<Formulario>(formularioVacio());
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [guardando, setGuardando] = useState(false);

  // Otras ventanas
  const [detalle, setDetalle] = useState<Empleado | null>(null);
  const [confirmEstado, setConfirmEstado] = useState<Empleado | null>(null);
  const [confirmAcceso, setConfirmAcceso] = useState<Empleado | null>(null);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const [lista, listaRoles] = await Promise.all([empleadoService.listar(), rolService.listar()]);
      setEmpleados(lista);
      setRoles(listaRoles);
    } catch (e) {
      if (!silencioso) toast.error(mensajeError(e));
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useAutoRefresco(() => { if (!modal) cargar(true); });

  // Roles que se pueden dar a un empleado (no "Cliente")
  const rolesEmpleado = roles.filter((r) => r.estado === 'Activo' && r.descripcion !== 'Cliente');
  const rolPorDefecto = rolesEmpleado.find((r) => r.descripcion === 'Empleado')?.id ?? rolesEmpleado[0]?.id ?? '';

  // ---------- Validación en tiempo real ----------
  const errores = useMemo(() => {
    const e: Partial<Record<Campo, string | null>> = {};
    CAMPOS.forEach((c) => { e[c] = validarCampo(c, form); });
    return e;
  }, [form]);
  const errorVisible = (c: Campo) => (tocados[c] ? errores[c] : null);
  const cambiar = (c: Campo, valor: string) => {
    setForm((f) => ({ ...f, [c]: valor }));
    setTocados((x) => ({ ...x, [c]: true }));   // se valida mientras escribe
  };
  const salir = (c: Campo) => setTocados((x) => ({ ...x, [c]: true }));

  const abrirNuevo = () => {
    setForm(formularioVacio(rolPorDefecto));
    setTocados({});
    setModal({ empleado: null });
  };

  const abrirEditar = (e: Empleado) => {
    setForm({
      nombre: e.nombre, identificacion: e.identificacion, correo: e.correo ?? '', telefono: e.telefono ?? '',
      direccion: e.direccion ?? '', id_rol: e.id_rol ?? '',
    });
    setTocados({});
    setModal({ empleado: e });
  };

  const guardar = async () => {
    if (!modal) return;
    setTocados(Object.fromEntries(CAMPOS.map((c) => [c, true])));
    const primero = CAMPOS.find((c) => errores[c]);
    if (primero) { toast.error(errores[primero] ?? 'Revisa los campos marcados en rojo.'); return; }
    const datos: EmpleadoDatos = {
      nombre: form.nombre.trim().replace(/\s+/g, ' '),
      identificacion: form.identificacion,
      correo: form.correo.trim().toLowerCase(),
      telefono: form.telefono,
      direccion: form.direccion.trim() || null,
      id_rol: form.id_rol,
    };
    setGuardando(true);
    try {
      if (modal.empleado) {
        await empleadoService.actualizar(modal.empleado.id, datos);
        toast.success('Empleado actualizado.');
      } else {
        const nuevo = await empleadoService.crear(datos);
        toast.success(`Empleado ${nuevo.id} registrado. Le enviamos la contraseña temporal a ${nuevo.correo}.`, { duration: 7000 });
      }
      setModal(null);
      await cargar(true);
    } catch (e) {
      toast.error(mensajeError(e), { duration: 8000 });
    } finally {
      setGuardando(false);
    }
  };

  // ---------- Acciones ----------
  const ejecutar = async (accion: () => Promise<unknown>, ok: string, cerrar: () => void) => {
    setProcesando(true);
    try {
      await accion();
      toast.success(ok, { duration: 6000 });
      cerrar();
      await cargar(true);
    } catch (e) {
      toast.error(mensajeError(e), { duration: 8000 });
    } finally {
      setProcesando(false);
    }
  };

  // ---------- Búsqueda, filtro y paginación ----------
  const filtrados = useMemo(() => empleados
    .filter((e) => !filtroEstado || e.estado === filtroEstado)
    .filter((e) => coincide(busqueda, [
      e.id, e.nombre, e.identificacion, e.correo, e.telefono, e.direccion, e.rol, e.estado,
      e.debe_cambiar_contrasena ? 'Pendiente' : 'Activo',
    ])), [empleados, busqueda, filtroEstado]);

  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const esYo = (e: Empleado) => e.id === yo?.id;
  const celda: React.CSSProperties = { padding: '12px 14px' };

  // Campo de texto del formulario
  const entrada = (c: Campo, props: React.InputHTMLAttributes<HTMLInputElement>, transformar?: (v: string) => string) => (
    <input {...props} value={form[c]}
      onChange={(ev) => cambiar(c, transformar ? transformar(ev.target.value) : ev.target.value)}
      onBlur={() => salir(c)}
      style={estiloInput(dark, { border: `1px solid ${errorVisible(c) ? DANGER : tocados[c] && !errores[c] && form[c] ? SUCCESS : t.border}` })} />
  );

  return (
    <div style={{ backgroundColor: t.bg, color: t.fg, minHeight: '100vh', padding: 24, fontFamily: FONT }}>
      <ModuleHeader
        title="Empleados"
        subtitle="Registra al personal del taller. La contraseña le llega a cada empleado a su correo."
        search={busqueda}
        onSearch={setBusqueda}
        onAdd={abrirNuevo}
        addLabel="Nuevo empleado"
        dark={dark}
        extra={
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as '' | EstadoEmpleado)}
            style={estiloInput(dark, { width: 160, padding: '8px 10px' })}>
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        }
      />

      <TableShell headers={['ID', 'Empleado', 'Cédula', 'Correo', 'Teléfono', 'Rol', 'Acceso', 'Estado', 'Acciones']} dark={dark}>
        {cargando || visibles.length === 0 ? (
          <FilaMensaje colSpan={9} dark={dark} cargando={cargando}
            texto={empleados.length === 0 ? 'Todavía no hay empleados registrados.' : 'No se encontraron empleados con ese filtro.'} />
        ) : visibles.map((e) => (
          <tr key={e.id} style={{ borderBottom: `1px solid ${t.border}` }}>
            <td style={celda}><IdBadge id={e.id} /></td>
            <td style={{ ...celda, fontSize: 13, fontWeight: 700 }}>{e.nombre}{esYo(e) && <span style={{ fontSize: 11, color: t.subtle, fontWeight: 500 }}> (tú)</span>}</td>
            <td style={{ ...celda, fontSize: 12, fontFamily: 'monospace', color: t.subtle }}>{e.identificacion}</td>
            <td style={{ ...celda, fontSize: 12 }}>{e.correo ?? '—'}</td>
            <td style={{ ...celda, fontSize: 12 }}>{e.telefono ?? '—'}</td>
            <td style={celda}><Pill texto={e.rol ?? '—'} color={GOLD} bg={`${GOLD}1F`} /></td>
            <td style={celda}>
              {e.debe_cambiar_contrasena
                ? <Pill texto="Pendiente" color={WARNING} bg={WARNING_BG} />
                : <Pill texto="Contraseña creada" color={SUCCESS} bg={SUCCESS_BG} />}
            </td>
            <td style={celda}>
              {e.estado === 'Activo'
                ? <Pill texto="Activo" color={SUCCESS} bg={SUCCESS_BG} />
                : <Pill texto="Inactivo" color={DANGER} bg={DANGER_BG} />}
            </td>
            <td style={celda}>
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionCircleBtn variant="blue" onClick={() => setDetalle(e)} title="Ver detalle"><Eye size={14} /></ActionCircleBtn>
                <ActionCircleBtn variant="gold" onClick={() => abrirEditar(e)} title="Editar"><Pencil size={14} /></ActionCircleBtn>
                <ActionCircleBtn variant="gold" disabled={e.estado !== 'Activo'} onClick={() => setConfirmAcceso(e)}
                  title={e.estado !== 'Activo' ? 'Actívalo para enviarle el acceso' : 'Reenviar acceso (nueva contraseña temporal al correo)'}>
                  <KeyRound size={14} />
                </ActionCircleBtn>
                <ActionCircleBtn variant={e.estado === 'Activo' ? 'danger' : 'success'} disabled={esYo(e)} onClick={() => setConfirmEstado(e)}
                  title={esYo(e) ? 'No puedes inactivar tu propia cuenta' : e.estado === 'Activo' ? 'Inactivar' : 'Activar'}>
                  <Power size={14} />
                </ActionCircleBtn>
              </div>
            </td>
          </tr>
        ))}
      </TableShell>

      <Paginacion pagina={pagina} total={totalPaginas} registros={filtrados.length} porPagina={POR_PAGINA} onCambiar={setPagina} dark={dark} />

      {/* ============ CREAR / EDITAR ============ */}
      {modal && (
        <Modal title={modal.empleado ? `Editar empleado ${modal.empleado.id}` : 'Nuevo empleado'} icon={<UserCog size={16} color={GOLD} />}
          onClose={() => setModal(null)} onSave={guardar} saveLabel={modal.empleado ? 'Guardar cambios' : 'Registrar y enviar acceso'}
          saving={guardando} dark={dark} maxWidth="640px">
          <div style={{ fontSize: 12, color: t.subtle }}>Los campos con <b style={{ color: DANGER }}>*</b> son obligatorios.</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Nombre completo *" dark={dark} error={errorVisible('nombre') ?? undefined}>
                {entrada('nombre', { maxLength: 100, placeholder: 'Ej. Gloria Inés Arango Vélez', autoFocus: true })}
              </Field>
            </div>
            <Field label="Cédula *" dark={dark} error={errorVisible('identificacion') ?? undefined}>
              {entrada('identificacion', { maxLength: 10, inputMode: 'numeric', placeholder: 'Ej. 1017184532' }, (v) => soloDigitos(v).slice(0, 10))}
            </Field>
            <Field label="Teléfono celular *" dark={dark} error={errorVisible('telefono') ?? undefined}>
              {entrada('telefono', { maxLength: 10, inputMode: 'numeric', placeholder: 'Ej. 3001234567' }, (v) => soloDigitos(v).slice(0, 10))}
            </Field>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Correo electrónico *" dark={dark} error={errorVisible('correo') ?? undefined}>
                {entrada('correo', { type: 'email', maxLength: 100, placeholder: 'Ej. nombre@gmail.com' })}
              </Field>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Dirección (opcional)" dark={dark} error={errorVisible('direccion') ?? undefined}>
                {entrada('direccion', { maxLength: 150, placeholder: 'Ej. Cra 65 #97-14, Medellín' })}
              </Field>
            </div>
            <Field label="Rol *" dark={dark} error={errorVisible('id_rol') ?? undefined}>
              <select value={form.id_rol} onChange={(ev) => cambiar('id_rol', ev.target.value)} onBlur={() => salir('id_rol')}
                style={estiloInput(dark, { border: `1px solid ${errorVisible('id_rol') ? DANGER : t.border}` })}>
                <option value="">Seleccionar...</option>
                {rolesEmpleado.map((r) => <option key={r.id} value={r.id}>{r.descripcion}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 10, background: `${INFO}12`, border: `1px solid ${INFO}40`, borderRadius: 10, padding: '12px 14px', fontSize: 12, lineHeight: 1.6 }}>
            <Mail size={18} color={INFO} style={{ flexShrink: 0, marginTop: 2 }} />
            {modal.empleado ? (
              <span>La contraseña no se edita aquí. Si el empleado la olvidó o cambiaste su correo, usa <b>Reenviar acceso</b> (<KeyRound size={11} style={{ verticalAlign: 'middle' }} />): le llega una contraseña temporal nueva.</span>
            ) : (
              <span>No escribas contraseña: al registrar, el sistema genera una <b>contraseña temporal</b> y la envía al correo del empleado.
                La primera vez que entre tendrá que <b>crear su propia contraseña</b>. Revisa bien el correo antes de guardar.</span>
            )}
          </div>
        </Modal>
      )}

      {/* ============ VER DETALLE ============ */}
      {detalle && (
        <Modal title={`Empleado ${detalle.id}`} icon={<Eye size={16} color={GOLD} />} onClose={() => setDetalle(null)} dark={dark} maxWidth="560px">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {([
              ['Nombre', detalle.nombre],
              ['Cédula', detalle.identificacion],
              ['Correo', detalle.correo ?? '—'],
              ['Teléfono', detalle.telefono ?? '—'],
              ['Dirección', detalle.direccion ?? '—'],
              ['Rol', detalle.rol ?? '—'],
              ['Estado', detalle.estado],
              ['Acceso', detalle.debe_cambiar_contrasena ? 'Pendiente: todavía no ha creado su contraseña' : 'Ya creó su contraseña'],
            ] as [string, string][]).map(([label, valor]) => (
              <div key={label} style={{ background: t.surface, borderRadius: 8, padding: '10px 14px', minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.05em', color: t.subtle, marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, overflowWrap: 'anywhere' }}>{valor}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ============ CONFIRMACIONES ============ */}
      {confirmAcceso && (
        <ConfirmDialog
          titulo={`¿Reenviar acceso a ${confirmAcceso.nombre}?`}
          mensaje={`Se genera una contraseña temporal nueva y se envía a ${confirmAcceso.correo}. La anterior deja de servir, se cierran sus sesiones abiertas y al entrar deberá crear su propia contraseña.`}
          confirmarLabel="Sí, enviar"
          variante="success"
          icono={<ShieldCheck size={28} color={SUCCESS} />}
          procesando={procesando}
          onCancel={() => setConfirmAcceso(null)}
          onConfirm={() => ejecutar(() => empleadoService.reenviarAcceso(confirmAcceso.id),
            `Listo: le enviamos una contraseña temporal nueva a ${confirmAcceso.correo}.`, () => setConfirmAcceso(null))}
          dark={dark}
        />
      )}
      {confirmEstado && (
        <ConfirmDialog
          titulo={confirmEstado.estado === 'Activo' ? `¿Inactivar a ${confirmEstado.nombre}?` : `¿Activar a ${confirmEstado.nombre}?`}
          mensaje={confirmEstado.estado === 'Activo'
            ? 'No podrá iniciar sesión ni recibir tareas mientras esté inactivo. Sus registros se conservan.'
            : 'Podrá volver a iniciar sesión y recibir tareas.'}
          confirmarLabel={confirmEstado.estado === 'Activo' ? 'Sí, inactivar' : 'Sí, activar'}
          variante={confirmEstado.estado === 'Activo' ? 'danger' : 'success'}
          icono={<Power size={28} color={confirmEstado.estado === 'Activo' ? DANGER : SUCCESS} />}
          procesando={procesando}
          onCancel={() => setConfirmEstado(null)}
          onConfirm={() => ejecutar(
            () => empleadoService.cambiarEstado(confirmEstado.id, confirmEstado.estado === 'Activo' ? 'Inactivo' : 'Activo'),
            `Empleado ${confirmEstado.estado === 'Activo' ? 'inactivado' : 'activado'}.`, () => setConfirmEstado(null))}
          dark={dark}
        />
      )}
    </div>
  );
}
