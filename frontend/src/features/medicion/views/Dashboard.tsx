import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Box,
  AlertTriangle,
  ShoppingCart,
  ShoppingBag,
  Scissors,
  TrendingUp,
  FileText,
  Truck,
  Wallet,
  PiggyBank,
  CheckCircle2,
  Clock,
  CalendarClock,
  Users,
  Filter,
  Factory,
  ArrowRight,
  UserCheck,
  Timer,
  BadgeCheck,
  Award,
  Medal,
} from 'lucide-react';
import { toast } from 'sonner';
import { mensajeError } from '../../../shared/utils/api';
import {
  dashboardService,
  type Atencion,
  type Clientes,
  type Dinero,
  type Empleados,
  type Indicador,
  type Produccion,
  type TipoPeriodo,
  type FiltroPeriodo,
  type DesempenoEmpleado as DesempenoEmpleadoT,
  type MejorPorProceso as MejorPorProcesoT,
} from '../services/dashboardService';
import { remisionService, type Remision } from '../../ventas/services/remisionService';

interface DashboardProps {
  dark?: boolean;
  /** Para ir a un módulo al hacer clic en una tarjeta (App le pasa setCurrentView). */
  onNavegar?: (vista: string) => void;
}

// ==========================================
// PALETA (la misma del dashboard original)
// ==========================================
const GOLD = '#C9A227';
const SUCCESS = '#28A745';
const BLUE = '#4A90E2';
const PURPLE = '#9B6DFF';
const DANGER = '#DC3545';

// ==========================================
// FILTROS DE TIEMPO (los mismos en el filtro general y en cada sección)
// Tipo (mes, trimestre, semestre, año) + cuál (ej. Trimestre 3) + año.
// ==========================================
const TIPOS: Array<{ value: TipoPeriodo; label: string }> = [
  { value: 'mes', label: 'Mes' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'semestre', label: 'Semestre' },
  { value: 'anio', label: 'Año' },
];
const MESES_LARGOS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_POR_TIPO: Record<TipoPeriodo, number> = { mes: 1, trimestre: 3, semestre: 6, anio: 12 };

const ANIO_ACTUAL = new Date().getFullYear();
/** El mes / trimestre / semestre en el que estamos hoy. */
const numeroActual = (tipo: TipoPeriodo) => Math.floor(new Date().getMonth() / MESES_POR_TIPO[tipo]) + 1;
/** Por defecto: el periodo en curso. */
const filtroActual = (tipo: TipoPeriodo): FiltroPeriodo => ({ tipo, anio: ANIO_ACTUAL, numero: numeroActual(tipo) });

/** Opciones del segundo selector: los meses, los 4 trimestres o los 2 semestres del año. */
const opcionesNumero = (tipo: TipoPeriodo): Array<{ numero: number; label: string }> => {
  if (tipo === 'anio') return [];
  if (tipo === 'mes') return MESES_LARGOS.map((m, i) => ({ numero: i + 1, label: m }));
  const n = MESES_POR_TIPO[tipo];
  return Array.from({ length: 12 / n }, (_, i) => ({
    numero: i + 1,
    label: `${tipo === 'trimestre' ? 'Trimestre' : 'Semestre'} ${i + 1} (${MESES_CORTOS[i * n]}–${MESES_CORTOS[i * n + n - 1]})`,
  }));
};

/** No se puede elegir un periodo que todavía no empieza. */
const esFuturo = (tipo: TipoPeriodo, anio: number, numero: number) =>
  anio > ANIO_ACTUAL || (anio === ANIO_ACTUAL && numero > numeroActual(tipo));

/** Al cambiar el tipo: el periodo de ese tipo en el que cae hoy (o el mismo del año elegido). */
const conTipo = (f: FiltroPeriodo, tipo: TipoPeriodo): FiltroPeriodo => ({
  tipo, anio: f.anio, numero: tipo === 'anio' ? 1 : numeroActual(tipo),
});
/** Al cambiar el año se conserva el mes/trimestre, salvo que en ese año todavía no haya llegado. */
const conAnio = (f: FiltroPeriodo, anio: number): FiltroPeriodo => ({
  ...f, anio, numero: esFuturo(f.tipo, anio, f.numero) ? numeroActual(f.tipo) : f.numero,
});

/** Lo que se muestra junto al título de cada sección, ej. "Trimestre 4 de 2026 · hasta hoy". */
const descPeriodo = (p?: { etiqueta: string; completo: boolean }) =>
  p ? `${p.etiqueta}${p.completo ? '' : ' · hasta hoy'}` : undefined;

/** Texto corto del filtro, ej. "Trimestre 4 de 2026", "Marzo 2025", "Año 2024". */
const nombreFiltro = (f: FiltroPeriodo) =>
  f.tipo === 'anio' ? `Año ${f.anio}`
    : f.tipo === 'mes' ? `${MESES_LARGOS[f.numero - 1]} ${f.anio}`
    : `${f.tipo === 'trimestre' ? 'Trimestre' : 'Semestre'} ${f.numero} de ${f.anio}`;

const NOMBRE_PERIODO_ANTERIOR: Record<TipoPeriodo, string> = {
  mes: 'el mes anterior',
  trimestre: 'el trimestre anterior',
  semestre: 'el semestre anterior',
  anio: 'el año anterior',
};

const pesos = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;
/** Para el eje Y: $1,5 M · $350 mil · $800 */
const pesosCorto = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`
    : n >= 1_000 ? `$${(n / 1_000).toLocaleString('es-CO', { maximumFractionDigits: 0 })} mil`
    : `$${Math.round(n)}`;
const numero = (n: number) => Math.round(n || 0).toLocaleString('es-CO');
// "2026-11-17" se lee como fecha local (sin la hora se correría un día por la zona horaria)
const fechaCorta = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
const hace = (dias: number | null) =>
  dias === null ? '' : dias === 0 ? 'hoy' : dias === 1 ? 'hace 1 día' : `hace ${dias} días`;

// Colores de los estados de remisión (los mismos de la vista de Remisiones)
const COLOR_ESTADO: Record<string, string> = {
  'Pendiente': '#FD7E14',
  'Aprobada': BLUE,
  'Rechazada': DANGER,
  'En producción': '#7C4DFF',
  'Terminada': SUCCESS,
  'Entregada': GOLD,
};

export const DashboardPage: React.FC<DashboardProps> = ({ dark = false, onNavegar }) => {
  const bgStyle = dark ? '#121212' : '#F8F9FA';
  const cardBg = dark ? '#1E1E1E' : '#FFFFFF';
  const textColor = dark ? '#F8F9FA' : '#121212';
  const textSecColor = dark ? '#9A9A9A' : '#6B6B6B';
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const tema = { cardBg, textColor, textSecColor, borderColor, dark };

  // Filtro general (arriba): null = "Ninguno". Si tiene valor, manda sobre todas las secciones.
  const [filtroGeneral, setFiltroGeneral] = useState<FiltroPeriodo | null>(null);
  // Filtro propio de cada sección (se usa cuando el general está en "Ninguno")
  const [periodoDinero, setPeriodoDinero] = useState<FiltroPeriodo>(() => filtroActual('trimestre'));
  const [periodoProduccion, setPeriodoProduccion] = useState<FiltroPeriodo>(() => filtroActual('trimestre'));
  const [periodoEmpleados, setPeriodoEmpleados] = useState<FiltroPeriodo>(() => filtroActual('trimestre'));
  const [periodoClientes, setPeriodoClientes] = useState<FiltroPeriodo>(() => filtroActual('trimestre'));
  const [anios, setAnios] = useState<number[]>([ANIO_ACTUAL]);
  const usarGeneral = filtroGeneral !== null;
  const efectivo = (propio: FiltroPeriodo): FiltroPeriodo => filtroGeneral ?? propio;
  const pDinero = efectivo(periodoDinero);
  const pProduccion = efectivo(periodoProduccion);
  const pEmpleados = efectivo(periodoEmpleados);
  const pClientes = efectivo(periodoClientes);
  // Clave estable para los useEffect (el objeto cambia en cada render)
  const clave = (f: FiltroPeriodo) => `${f.tipo}-${f.anio}-${f.numero}`;
  const elegirTipoGeneral = (tipo: TipoPeriodo | null) =>
    setFiltroGeneral(actual => (tipo === null ? null : conTipo(actual ?? filtroActual(tipo), tipo)));

  const [atencion, setAtencion] = useState<Atencion | null>(null);
  const [dinero, setDinero] = useState<Dinero | null>(null);
  const [produccion, setProduccion] = useState<Produccion | null>(null);
  const [empleados, setEmpleados] = useState<Empleados | null>(null);
  const [clientes, setClientes] = useState<Clientes | null>(null);
  const [enProceso, setEnProceso] = useState<Remision[] | null>(null);

  const [conectado, setConectado] = useState<boolean | null>(null);
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [recargar, setRecargar] = useState(0);

  const avisarError = (error: unknown) => {
    setConectado(false);
    toast.error(`No se pudo cargar el dashboard: ${mensajeError(error)}`, { id: 'error-dashboard' });
  };

  // Filas sin periodo: se cargan al abrir y al pulsar "Actualizar"
  useEffect(() => {
    Promise.all([dashboardService.atencion(), remisionService.listar()])
      .then(([a, rems]) => {
        setAtencion(a);
        setEnProceso(rems.filter(r => ESTADOS_EN_PROCESO.includes(r.estado)));
        setConectado(true);
        setActualizado(new Date());
      })
      .catch(avisarError);
  }, [recargar]);

  useEffect(() => { dashboardService.anios().then(a => setAnios(a.length ? a : [ANIO_ACTUAL])).catch(() => undefined); }, [recargar]);
  /* eslint-disable react-hooks/exhaustive-deps -- se recarga cuando cambia el periodo (su clave) */
  useEffect(() => { dashboardService.dinero(pDinero).then(setDinero).catch(avisarError); }, [clave(pDinero), recargar]);
  useEffect(() => { dashboardService.produccion(pProduccion).then(setProduccion).catch(avisarError); }, [clave(pProduccion), recargar]);
  useEffect(() => { dashboardService.empleados(pEmpleados).then(setEmpleados).catch(avisarError); }, [clave(pEmpleados), recargar]);
  useEffect(() => { dashboardService.clientes(pClientes).then(setClientes).catch(avisarError); }, [clave(pClientes), recargar]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const ir = (vista: string) => onNavegar?.(vista);
  const enCurso = atencion?.producciones_en_curso[0];
  const atrasadas = atencion?.remisiones_atrasadas ?? [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgStyle, color: textColor, padding: '24px', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ENCABEZADO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${borderColor}`, paddingBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard style={{ width: '28px', height: '28px', color: GOLD }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: textColor, fontFamily: 'Montserrat, sans-serif' }}>Dashboard General</h1>
              <p style={{ fontSize: '13px', color: textSecColor, margin: '4px 0 0 0', fontFamily: 'Montserrat, sans-serif' }}>Resumen del taller: lo pendiente, ingresos y gastos, la producción, los empleados y los clientes.</p>
            </div>
          </div>
          <button
            onClick={() => setRecargar(n => n + 1)}
            title="Clic para actualizar los datos"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
              background: conectado === false ? `${DANGER}15` : `${SUCCESS}15`, color: conectado === false ? DANGER : SUCCESS, fontSize: '12px', fontWeight: 700 }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: conectado === false ? DANGER : SUCCESS }}></span>
            {conectado === false ? 'Sin conexión · Reintentar'
              : actualizado ? `Actualizado ${actualizado.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : 'Cargando...'}
          </button>
        </div>

        {/* FILTRO GENERAL: si no es "Ninguno", aplica a todos los KPIs y gráficas con periodo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', background: cardBg, border: `1px solid ${usarGeneral ? `${GOLD}80` : borderColor}`, borderRadius: '16px', padding: '14px 18px', marginTop: '-12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Filter style={{ width: '18px', height: '18px', color: GOLD }} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: textColor, display: 'block' }}>Filtro general</span>
              <span style={{ fontSize: '11px', color: textSecColor }}>
                {filtroGeneral
                  ? <>Todas las secciones muestran <b style={{ color: textColor }}>{nombreFiltro(filtroGeneral)}</b>. Elige "Ninguno" para filtrar cada sección por separado.</>
                  : 'Cada sección usa su propio filtro.'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '12px', background: dark ? '#2A2A2A' : '#F3F3F5', flexWrap: 'wrap' }}>
              {[{ value: null, label: 'Ninguno' } as { value: TipoPeriodo | null; label: string }, ...TIPOS].map(f => {
                const activo = (filtroGeneral?.tipo ?? null) === f.value;
                return (
                  <button key={f.label} onClick={() => elegirTipoGeneral(f.value)}
                    style={{ border: 'none', borderRadius: '9px', padding: '7px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                      background: activo ? GOLD : 'transparent', color: activo ? '#121212' : textSecColor, transition: 'all 0.2s ease' }}>
                    {f.label}
                  </button>
                );
              })}
            </div>
            {filtroGeneral && (
              <SelectorPeriodo valor={filtroGeneral} onChange={setFiltroGeneral} anios={anios} sinTipo {...tema} />
            )}
          </div>
        </div>

        {/* FILA 1: REQUIERE ATENCIÓN (estado de hoy, sin periodo) */}
        <section>
          <TituloFila titulo="Requiere atención hoy" descripcion="Haz clic en una tarjeta para ir al módulo." textColor={textColor} textSecColor={textSecColor} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            <KpiCard
              {...tema}
              titulo="Remisiones por aprobar"
              valor={atencion ? numero(atencion.remisiones_por_aprobar.cantidad) : '—'}
              subtitulo={!atencion ? 'Cargando...' : atencion.remisiones_por_aprobar.cantidad === 0 ? 'Todo al día'
                : `Más antigua: ${atencion.remisiones_por_aprobar.mas_antigua}, ${hace(atencion.remisiones_por_aprobar.dias_esperando)}`}
              icono={<FileText style={{ width: '20px', height: '20px', color: GOLD }} />}
              colorFondo={`${GOLD}20`}
              onClick={() => ir('remisiones')}
            />
            <KpiCard
              {...tema}
              titulo="Producción en curso"
              valor={!atencion ? '—' : enCurso ? `${Math.round(enCurso.porcentaje_avance)} %` : 'Ninguna'}
              subtitulo={!atencion ? 'Cargando...' : !enCurso ? 'Sin producción en proceso'
                : `${enCurso.id_remision} · ${enCurso.cliente}`}
              alerta={enCurso && enCurso.dias_para_entrega !== null && enCurso.dias_para_entrega < 0
                ? `Atrasada ${Math.abs(enCurso.dias_para_entrega)} días` : undefined}
              icono={<Scissors style={{ width: '20px', height: '20px', color: PURPLE }} />}
              colorFondo={`${PURPLE}20`}
              onClick={() => ir('produccion')}
            >
              {enCurso && (
                <div>
                  <div style={{ height: '6px', borderRadius: '6px', background: dark ? '#2A2A2A' : '#F3F3F5', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(enCurso.porcentaje_avance, 100)}%`, height: '100%', background: PURPLE, borderRadius: '6px', transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontSize: '10px', color: textSecColor, display: 'block', marginTop: '4px' }}>
                    {numero(enCurso.total_realizado)} de {numero(enCurso.total_asignado)} unds
                    {enCurso.dias_para_entrega !== null && enCurso.dias_para_entrega >= 0 && ` · entrega en ${enCurso.dias_para_entrega} días`}
                  </span>
                </div>
              )}
            </KpiCard>
            <KpiCard
              {...tema}
              titulo="Listas para entregar"
              valor={atencion ? numero(atencion.listas_para_entregar) : '—'}
              subtitulo={!atencion ? 'Cargando...' : 'Ninguna remisión atrasada'}
              alerta={atrasadas.length > 0
                ? `${atrasadas.length} atrasada${atrasadas.length > 1 ? 's' : ''}: ${atrasadas.map(r => `${r.id_remision} (${r.dias_atraso} d)`).join(', ')}`
                : undefined}
              icono={<Truck style={{ width: '20px', height: '20px', color: SUCCESS }} />}
              colorFondo={`${SUCCESS}20`}
              onClick={() => ir('remisionEntrega')}
            />
            <KpiCard
              {...tema}
              titulo="Por cobrar"
              valor={atencion ? pesos(atencion.por_cobrar.total) : '—'}
              subtitulo={!atencion ? 'Cargando...' : atencion.por_cobrar.entregas === 0 ? 'Nada pendiente de pago'
                : `${atencion.por_cobrar.entregas} entrega${atencion.por_cobrar.entregas > 1 ? 's' : ''} sin pagar · la más antigua ${hace(atencion.por_cobrar.dias_sin_pagar)}`}
              icono={<Wallet style={{ width: '20px', height: '20px', color: BLUE }} />}
              colorFondo={`${BLUE}20`}
              onClick={() => ir('remisionEntrega')}
            />
            <KpiCard
              {...tema}
              titulo="Insumos con stock bajo"
              valor={atencion ? numero(atencion.stock_bajo.length) : '—'}
              subtitulo={!atencion ? 'Cargando...' : 'Inventario en orden'}
              alerta={atencion && atencion.stock_bajo.length > 0 ? atencion.stock_bajo.map(i => i.nombre).join(', ') : undefined}
              icono={<Box style={{ width: '20px', height: '20px', color: GOLD }} />}
              colorFondo={`${GOLD}20`}
              onClick={() => ir('insumos')}
            />
          </div>
        </section>

        {/* FILA 2: INGRESOS Y GASTOS */}
        <section>
          <TituloFila titulo="Ingresos y gastos" descripcion={descPeriodo(dinero?.periodo)} textColor={textColor} textSecColor={textSecColor}>
            <SelectorPeriodo valor={pDinero} onChange={setPeriodoDinero} anios={anios} bloqueado={usarGeneral} {...tema} />
          </TituloFila>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <KpiCard {...tema} titulo="Ventas" valor={dinero ? pesos(dinero.facturado.valor) : '—'}
              subtitulo="Valor de las prendas entregadas"
              icono={<TrendingUp style={{ width: '20px', height: '20px', color: SUCCESS }} />} colorFondo={`${SUCCESS}20`}
              badge={<Variacion indicador={dinero?.facturado} periodo={pDinero.tipo} />} />
            <KpiCard {...tema} titulo="Pagos recibidos" valor={dinero ? pesos(dinero.cobrado.valor) : '—'}
              subtitulo={dinero ? (dinero.cobrado.pendiente > 0 ? `Falta cobrar ${pesos(dinero.cobrado.pendiente)}` : 'Todas las ventas están pagas') : ''}
              icono={<CheckCircle2 style={{ width: '20px', height: '20px', color: GOLD }} />} colorFondo={`${GOLD}20`}
              badge={<Variacion indicador={dinero?.cobrado} periodo={pDinero.tipo} />} />
            <KpiCard {...tema} titulo="Gastos en insumos" valor={dinero ? pesos(dinero.gastos_compras.valor) : '—'}
              subtitulo={dinero ? `${dinero.gastos_compras.compras} compra${dinero.gastos_compras.compras === 1 ? '' : 's'} de insumos` : ''}
              icono={<ShoppingCart style={{ width: '20px', height: '20px', color: BLUE }} />} colorFondo={`${BLUE}20`}
              badge={<Variacion indicador={dinero?.gastos_compras} periodo={pDinero.tipo} subirEsMalo />}
              onClick={() => ir('compras')} />
            <KpiCard {...tema} titulo="Balance" valor={dinero ? pesos(dinero.ganancia.valor) : '—'}
              subtitulo="Ventas menos gastos en insumos"
              icono={<PiggyBank style={{ width: '20px', height: '20px', color: PURPLE }} />} colorFondo={`${PURPLE}20`}
              badge={<Variacion indicador={dinero?.ganancia} periodo={pDinero.tipo} />} />
          </div>
          <GraficaCard {...tema}
            titulo="Ventas vs. gastos en insumos"
            valor={dinero ? pesos(dinero.facturado.valor - dinero.gastos_compras.valor) : '—'}
            etiquetaValor="de diferencia en el periodo"
            porcentaje={!dinero ? '...' : dinero.ganancia.valor >= 0 ? 'Ganancia' : 'Pérdida'}
            colorBadge={!dinero || dinero.ganancia.valor >= 0 ? SUCCESS : DANGER}
          >
            {dinero && (
              <BarChartDoble
                etiquetas={dinero.grafica.etiquetas}
                series={[
                  { nombre: 'Ventas', valores: dinero.grafica.facturado, color: SUCCESS },
                  { nombre: 'Gastos', valores: dinero.grafica.compras, color: BLUE },
                ]}
                ejeX={dinero.periodo.unidad_tramo} ejeY="Pesos ($)"
                dark={dark}
              />
            )}
          </GraficaCard>
        </section>

        {/* FILA 3: PRODUCCIÓN */}
        <section>
          <TituloFila titulo="Producción" descripcion={descPeriodo(produccion?.periodo)} textColor={textColor} textSecColor={textSecColor}>
            <SelectorPeriodo valor={pProduccion} onChange={setPeriodoProduccion} anios={anios} bloqueado={usarGeneral} {...tema} />
          </TituloFila>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <KpiCard {...tema} titulo="Unidades confeccionadas" valor={produccion ? `${numero(produccion.unidades_confeccionadas.valor)} unds` : '—'}
              subtitulo="Reportadas en el registro diario"
              icono={<Scissors style={{ width: '20px', height: '20px', color: PURPLE }} />} colorFondo={`${PURPLE}20`}
              badge={<Variacion indicador={produccion?.unidades_confeccionadas} periodo={pProduccion.tipo} />}
              onClick={() => ir('registroDiario')} />
            <KpiCard {...tema} titulo="Prendas entregadas" valor={produccion ? `${numero(produccion.prendas_entregadas.valor)} unds` : '—'}
              subtitulo={produccion ? `${produccion.prendas_entregadas.remisiones} ${produccion.prendas_entregadas.remisiones === 1 ? 'remisión entregada' : 'remisiones entregadas'}` : ''}
              icono={<ShoppingBag style={{ width: '20px', height: '20px', color: SUCCESS }} />} colorFondo={`${SUCCESS}20`}
              badge={<Variacion indicador={produccion?.prendas_entregadas} periodo={pProduccion.tipo} />} />
            <KpiCard {...tema} titulo="Entregas a tiempo"
              valor={!produccion ? '—' : produccion.entregas_a_tiempo.porcentaje === null ? 'Sin entregas' : `${Math.round(produccion.entregas_a_tiempo.porcentaje)} %`}
              subtitulo={produccion ? `${produccion.entregas_a_tiempo.a_tiempo} a tiempo · ${produccion.entregas_a_tiempo.tarde} tarde` : ''}
              alerta={produccion && produccion.entregas_a_tiempo.tarde > 0 ? `${produccion.entregas_a_tiempo.tarde} entregada${produccion.entregas_a_tiempo.tarde > 1 ? 's' : ''} tarde` : undefined}
              icono={<Clock style={{ width: '20px', height: '20px', color: GOLD }} />} colorFondo={`${GOLD}20`} />
            <KpiCard {...tema} titulo="Días por remisión"
              valor={!produccion ? '—' : produccion.dias_promedio === null ? 'Sin entregas' : `${produccion.dias_promedio.toLocaleString('es-CO')} días`}
              subtitulo="Promedio desde que llega hasta que se entrega"
              icono={<CalendarClock style={{ width: '20px', height: '20px', color: BLUE }} />} colorFondo={`${BLUE}20`} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            <GraficaCard {...tema} titulo="Unidades confeccionadas"
              valor={produccion ? `${numero(produccion.unidades_confeccionadas.valor)} unds` : '—'}
              porcentaje="Producción" colorBadge={PURPLE}>
              {produccion && <BarChartCoherent dataObj={produccion.grafica_unidades} color={PURPLE} dark={dark} tipoUnidad="unds" ejeX={produccion.periodo.unidad_tramo} ejeY="Unidades" />}
            </GraficaCard>
            <GraficaCard {...tema} titulo="Unidades por empleado"
              valor={produccion?.por_empleado[0] ? produccion.por_empleado[0].empleado : 'Sin reportes'}
              etiquetaValor={produccion?.por_empleado[0] ? 'es quien más produjo' : undefined}
              porcentaje="Rendimiento" colorBadge={SUCCESS}>
              {produccion && (produccion.por_empleado.length === 0
                ? <SinDatos texto="No hay reportes diarios en este periodo" dark={dark} />
                : <BarChartCoherent
                    dataObj={{ etiquetas: produccion.por_empleado.map(e => e.empleado.split(' ')[0]), valores: produccion.por_empleado.map(e => e.unidades) }}
                    color={SUCCESS} dark={dark} tipoUnidad="unds" ejeX="Empleado" ejeY="Unidades" />)}
            </GraficaCard>
          </div>
        </section>

        {/* FILA: EMPLEADOS (asistencia y desempeño según la producción) */}
        <section>
          <TituloFila titulo="Empleados" descripcion={empleados ? `${descPeriodo(empleados.periodo)} · asistencia y desempeño` : undefined} textColor={textColor} textSecColor={textSecColor}>
            <SelectorPeriodo valor={pEmpleados} onChange={setPeriodoEmpleados} anios={anios} bloqueado={usarGeneral} {...tema} />
          </TituloFila>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <KpiCard {...tema} titulo="Hoy en el taller"
              valor={empleados ? `${empleados.hoy.en_taller} de ${empleados.hoy.activos}` : '—'}
              subtitulo={empleados ? `${empleados.hoy.con_tarea} con tarea asignada${empleados.hoy.con_novedad ? ` · ${empleados.hoy.con_novedad} con permiso o incapacidad` : ''}` : ''}
              icono={<UserCheck style={{ width: '20px', height: '20px', color: SUCCESS }} />} colorFondo={`${SUCCESS}20`}
              onClick={() => ir('asistencia')} />
            <KpiCard {...tema} titulo="Asistencia"
              valor={!empleados ? '—' : empleados.asistencia.porcentaje === null ? 'Sin registros' : `${empleados.asistencia.porcentaje.toLocaleString('es-CO')} %`}
              subtitulo={empleados ? `${empleados.asistencia.faltas} falta${empleados.asistencia.faltas === 1 ? '' : 's'} · ${empleados.asistencia.novedades} permiso${empleados.asistencia.novedades === 1 ? '' : 's'} o novedades` : ''}
              icono={<CalendarClock style={{ width: '20px', height: '20px', color: BLUE }} />} colorFondo={`${BLUE}20`}
              badge={<VariacionPuntos puntos={empleados?.asistencia.variacion ?? null} visible={!!empleados} />}
              onClick={() => ir('asistencia')} />
            <KpiCard {...tema} titulo="Horas trabajadas"
              valor={empleados ? `${numero(empleados.horas_trabajadas.valor)} h` : '—'}
              subtitulo={empleados && empleados.desempeno.length ? `Promedio ${numero(empleados.horas_trabajadas.valor / empleados.desempeno.length)} h por empleado` : 'Según las marcaciones de entrada y salida'}
              icono={<Timer style={{ width: '20px', height: '20px', color: PURPLE }} />} colorFondo={`${PURPLE}20`}
              badge={<Variacion indicador={empleados?.horas_trabajadas} periodo={pEmpleados.tipo} />} />
            <KpiCard {...tema} titulo="Calidad de la producción"
              valor={!empleados ? '—' : empleados.calidad.porcentaje === null ? 'Sin reportes' : `${empleados.calidad.porcentaje.toLocaleString('es-CO')} %`}
              subtitulo={empleados ? `${numero(empleados.calidad.buenas)} buenas · ${numero(empleados.calidad.defectuosas)} defectuosas` : ''}
              alerta={empleados && empleados.calidad.porcentaje !== null && empleados.calidad.porcentaje < 90 ? 'Más del 10 % de piezas defectuosas' : undefined}
              icono={<BadgeCheck style={{ width: '20px', height: '20px', color: GOLD }} />} colorFondo={`${GOLD}20`}
              onClick={() => ir('registroDiario')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <GraficaCard {...tema} titulo={`Asistencia por ${(empleados?.periodo.unidad_tramo ?? 'Mes').toLowerCase()}`}
              valor={!empleados ? '—' : empleados.asistencia.porcentaje === null ? 'Sin registros' : `${empleados.asistencia.porcentaje.toLocaleString('es-CO')} %`}
              etiquetaValor={empleados?.asistencia.porcentaje != null ? 'de asistencia en el periodo' : undefined}
              porcentaje="Asistencia" colorBadge={BLUE}>
              {empleados && <BarChartCoherent dataObj={empleados.grafica_asistencia} color={BLUE} dark={dark} tipoUnidad="%" ejeX={empleados.periodo.unidad_tramo} ejeY="Asistencia (%)" />}
            </GraficaCard>
            <MejorPorProceso datos={empleados?.mejor_por_proceso ?? null} {...tema} />
          </div>

          <DesempenoEmpleados datos={empleados?.desempeno ?? null} {...tema} />
        </section>

        {/* FILA 4: CLIENTES */}
        <section>
          <TituloFila titulo="Clientes" descripcion={descPeriodo(clientes?.periodo)} textColor={textColor} textSecColor={textSecColor}>
            <SelectorPeriodo valor={pClientes} onChange={setPeriodoClientes} anios={anios} bloqueado={usarGeneral} {...tema} />
          </TituloFila>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '16px', boxSizing: 'border-box' }}>
              <CabeceraCard titulo="Clientes que más facturan" icono={<Users style={{ width: '18px', height: '18px', color: GOLD }} />} colorFondo={`${GOLD}20`} textColor={textColor} />
              {!clientes ? <SinDatos texto="Cargando..." dark={dark} />
                : clientes.top_clientes.length === 0 ? <SinDatos texto="No hubo entregas en este periodo" dark={dark} />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {clientes.top_clientes.map((c, idx) => (
                      <div key={c.nit}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {idx + 1}. {c.cliente}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: textColor, flexShrink: 0 }}>{pesos(c.facturado)}</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '6px', background: dark ? '#2A2A2A' : '#F3F3F5', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(c.participacion, 3)}%`, height: '100%', background: GOLD, borderRadius: '6px' }} />
                        </div>
                        <span style={{ fontSize: '10px', color: textSecColor }}>
                          {numero(c.prendas)} prendas · {c.entregas} entrega{c.entregas === 1 ? '' : 's'} · {c.participacion.toLocaleString('es-CO')} %
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div onClick={() => ir('remisiones')} style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '16px', boxSizing: 'border-box', cursor: onNavegar ? 'pointer' : 'default' }}>
              <CabeceraCard titulo="Remisiones recibidas" icono={<FileText style={{ width: '18px', height: '18px', color: BLUE }} />} colorFondo={`${BLUE}20`} textColor={textColor}
                extra={clientes ? <span style={{ fontSize: '18px', fontWeight: 800, color: textColor }}>{clientes.remisiones_recibidas}</span> : undefined} />
              {!clientes ? <SinDatos texto="Cargando..." dark={dark} />
                : clientes.remisiones_por_estado.length === 0 ? <SinDatos texto="No llegaron remisiones en este periodo" dark={dark} />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {clientes.remisiones_por_estado.map(e => {
                      const color = COLOR_ESTADO[e.estado] ?? textSecColor;
                      return (
                        <div key={e.estado} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: `${color}20`, color }}>{e.estado}</span>
                          <span style={{ fontSize: '12px', color: textSecColor }}>
                            <b style={{ color: textColor }}>{e.cantidad}</b> {e.cantidad === 1 ? 'remisión' : 'remisiones'} · {numero(e.prendas)} prendas
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        </section>

        {/* FILA 5: REMISIONES (por aprobar y en proceso) */}
        <RemisionesEnProceso remisiones={enProceso} producciones={atencion?.producciones_en_curso ?? []} onVerTodas={onNavegar ? () => ir('remisiones') : undefined} {...tema} />

      </div>
    </div>
  );
};

// ==========================================
// COMPONENTES AUXILIARES (mismo estilo del dashboard original)
// ==========================================

interface Tema {
  cardBg: string;
  textColor: string;
  textSecColor: string;
  borderColor: string;
  dark: boolean;
}

const TituloFila: React.FC<{ titulo: string; descripcion?: string; textColor: string; textSecColor: string; children?: React.ReactNode }> = ({ titulo, descripcion, textColor, textSecColor, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: textColor }}>{titulo}</h2>
      {descripcion && <span style={{ fontSize: '12px', color: textSecColor }}>{descripcion}</span>}
    </div>
    {children}
  </div>
);

/**
 * Filtro de tiempo: tipo (mes / trimestre / semestre / año) + cuál + año.
 * Es el mismo en el filtro general (allí sin el selector de tipo, que va en los botones)
 * y en cada sección. Con el filtro general activo, el de la sección queda bloqueado mostrando el general.
 */
const SelectorPeriodo: React.FC<Tema & {
  valor: FiltroPeriodo;
  onChange: (v: FiltroPeriodo) => void;
  anios: number[];
  bloqueado?: boolean;
  sinTipo?: boolean;
}> = ({ valor, onChange, anios, bloqueado = false, sinTipo = false, borderColor, dark, textColor }) => {
  const estilo: React.CSSProperties = {
    fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${bloqueado ? `${GOLD}60` : borderColor}`,
    background: dark ? '#2A2A2A' : '#F3F3F5', color: textColor, cursor: bloqueado ? 'not-allowed' : 'pointer',
    opacity: bloqueado ? 0.6 : 1, outline: 'none', fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
  };
  const titulo = bloqueado ? 'Lo controla el filtro general (elige "Ninguno" arriba para cambiarlo aquí)' : undefined;
  const listaAnios = anios.includes(valor.anio) ? anios : [...anios, valor.anio].sort((a, b) => b - a);
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} title={titulo}>
      {!sinTipo && (
        <select value={valor.tipo} disabled={bloqueado} aria-label="Tipo de periodo" style={estilo}
          onChange={(e) => onChange(conTipo(valor, e.target.value as TipoPeriodo))}>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      )}
      {valor.tipo !== 'anio' && (
        <select value={valor.numero} disabled={bloqueado} aria-label="Periodo" style={estilo}
          onChange={(e) => onChange({ ...valor, numero: Number(e.target.value) })}>
          {opcionesNumero(valor.tipo).map(o => (
            <option key={o.numero} value={o.numero} disabled={esFuturo(valor.tipo, valor.anio, o.numero)}>{o.label}</option>
          ))}
        </select>
      )}
      <select value={valor.anio} disabled={bloqueado} aria-label="Año" style={estilo}
        onChange={(e) => onChange(conAnio(valor, Number(e.target.value)))}>
        {listaAnios.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    </div>
  );
};

/** Pastilla con el % de cambio frente al periodo anterior. */
const Variacion: React.FC<{ indicador?: Indicador; periodo: TipoPeriodo; subirEsMalo?: boolean }> = ({ indicador, periodo, subirEsMalo = false }) => {
  if (!indicador) return null;
  const v = indicador.variacion;
  const titulo = `Comparado con ${NOMBRE_PERIODO_ANTERIOR[periodo]} (si el periodo está en curso, hasta el mismo día)`;
  if (v === null) {
    return <span title={titulo} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', background: '#6B6B6B20', color: '#6B6B6B', whiteSpace: 'nowrap' }}>Sin comparar</span>;
  }
  const bueno = subirEsMalo ? v <= 0 : v >= 0;
  const color = v === 0 ? '#6B6B6B' : bueno ? SUCCESS : DANGER;
  return (
    <span title={titulo} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', background: `${color}20`, color, whiteSpace: 'nowrap' }}>
      {v > 0 ? '▲' : v < 0 ? '▼' : '='} {Math.abs(v).toLocaleString('es-CO')} %
    </span>
  );
};

/** Cambio en puntos porcentuales (para la asistencia: 88 % -> 91 % = ▲ 3 pts). */
const VariacionPuntos: React.FC<{ puntos: number | null; visible: boolean }> = ({ puntos, visible }) => {
  if (!visible) return null;
  const titulo = 'Diferencia frente al mismo tramo del periodo anterior';
  if (puntos === null) {
    return <span title={titulo} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', background: '#6B6B6B20', color: '#6B6B6B', whiteSpace: 'nowrap' }}>Sin comparar</span>;
  }
  const color = puntos === 0 ? '#6B6B6B' : puntos > 0 ? SUCCESS : DANGER;
  return (
    <span title={titulo} style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', background: `${color}20`, color, whiteSpace: 'nowrap' }}>
      {puntos > 0 ? '▲' : puntos < 0 ? '▼' : '='} {Math.abs(puntos).toLocaleString('es-CO')} pts
    </span>
  );
};

const KpiCard: React.FC<Tema & {
  titulo: string;
  valor: string;
  subtitulo?: string;
  alerta?: string;
  icono: React.ReactNode;
  colorFondo: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
}> = ({ titulo, valor, subtitulo, alerta, icono, colorFondo, badge, onClick, children, cardBg, textColor, textSecColor, borderColor }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: cardBg, border: `1px solid ${hover && onClick ? `${GOLD}80` : borderColor}`, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxSizing: 'border-box', cursor: onClick ? 'pointer' : 'default', transition: 'border-color 0.2s ease' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: textSecColor, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{titulo}</span>
          <h4 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{valor}</h4>
        </div>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: colorFondo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icono}
        </div>
      </div>

      {children}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${borderColor}`, paddingTop: '10px', gap: '8px', minHeight: '24px' }}>
        {alerta ? (
          <span style={{ fontSize: '11px', fontWeight: 700, color: DANGER, display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
            <AlertTriangle size={12} style={{ flexShrink: 0 }} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={alerta}>{alerta}</span>
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: textSecColor }}>{subtitulo}</span>
        )}
        {badge}
      </div>
    </div>
  );
};

const CabeceraCard: React.FC<{ titulo: string; icono: React.ReactNode; colorFondo: string; textColor: string; extra?: React.ReactNode }> = ({ titulo, icono, colorFondo, textColor, extra }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: colorFondo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icono}
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: textColor }}>{titulo}</h3>
    </div>
    {extra}
  </div>
);

const SinDatos: React.FC<{ texto: string; dark: boolean }> = ({ texto, dark }) => (
  <div style={{ width: '100%', minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: dark ? '#9A9A9A' : '#6B6B6B', textAlign: 'center' }}>
    {texto}
  </div>
);

const GraficaCard: React.FC<Tema & {
  titulo: string;
  valor: string;
  etiquetaValor?: string;
  porcentaje: string;
  colorBadge: string;
  children: React.ReactNode;
}> = ({ titulo, valor, etiquetaValor, porcentaje, colorBadge, cardBg, textColor, textSecColor, borderColor, children }) => (
  <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ fontSize: '12px', color: textSecColor, fontWeight: 700, display: 'block', marginBottom: '2px' }}>{titulo}</span>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: textColor }}>
          {valor} {etiquetaValor && <span style={{ fontSize: '11px', fontWeight: 600, color: textSecColor }}>{etiquetaValor}</span>}
        </h3>
      </div>
      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', background: `${colorBadge}20`, color: colorBadge, whiteSpace: 'nowrap', flexShrink: 0 }}>{porcentaje}</span>
    </div>

    <div style={{ width: '100%', height: '215px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
      {children}
    </div>
  </div>
);

const formatoValor = (valor: number, tipoUnidad: string) =>
  tipoUnidad === '$' ? pesos(valor)
    : tipoUnidad === '%' ? `${Number(valor || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`
    : `${numero(valor)} ${tipoUnidad}`;

/** Máximo "redondo" del eje Y y sus marcas (0, 25 %, 50 %, 75 %, 100 %). */
const escalaY = (max: number) => {
  const crudo = Math.max(max, 4) / 4;
  const potencia = 10 ** Math.floor(Math.log10(crudo));
  const f = crudo / potencia;
  const paso = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * potencia;
  return { tope: paso * 4, marcas: [0, 1, 2, 3, 4].map(i => paso * i) };
};

const ALTO_PLOT = 120;   // alto del área de barras (px)
const ANCHO_EJE_Y = 64;  // título del eje Y + valores

/**
 * Marco común de las gráficas: eje Y (título y valores con líneas guía),
 * eje X (etiquetas y título) y, en el centro, las barras.
 */
const EjesGrafica: React.FC<{
  etiquetas: string[];
  max: number;
  formatoY: (n: number) => string;
  ejeX: string;
  ejeY: string;
  dark: boolean;
  hoverIndex: number | null;
  colorHover: string;
  cabecera: React.ReactNode;
  barras: (tope: number) => React.ReactNode;
}> = ({ etiquetas, max, formatoY, ejeX, ejeY, dark, hoverIndex, colorHover, cabecera, barras }) => {
  const { tope, marcas } = escalaY(max);
  const sutil = dark ? '#9A9A9A' : '#6B6B6B';
  const linea = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const eje = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
      <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '6px' }}>
        {cabecera}
      </div>

      <div style={{ display: 'flex', height: `${ALTO_PLOT}px` }}>
        {/* Eje Y: título vertical + valores */}
        <div style={{ width: `${ANCHO_EJE_Y}px`, display: 'flex', flexShrink: 0 }}>
          <div style={{ width: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: sutil, transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>{ejeY}</span>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            {marcas.map(m => (
              <span key={m} style={{ position: 'absolute', right: '6px', bottom: `${(m / tope) * 100}%`, transform: 'translateY(50%)', fontSize: '9px', color: sutil, whiteSpace: 'nowrap' }}>
                {formatoY(m)}
              </span>
            ))}
          </div>
        </div>

        {/* Área de barras con líneas guía */}
        <div style={{ flex: 1, position: 'relative', borderLeft: `1px solid ${eje}`, borderBottom: `1px solid ${eje}` }}>
          {marcas.slice(1).map(m => (
            <div key={m} style={{ position: 'absolute', left: 0, right: 0, bottom: `${(m / tope) * 100}%`, borderTop: `1px dashed ${linea}` }} />
          ))}
          <div style={{ position: 'absolute', inset: '0 4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px' }}>
            {barras(tope)}
          </div>
        </div>
      </div>

      {/* Eje X: etiquetas + título */}
      <div style={{ display: 'flex', paddingTop: '5px' }}>
        <div style={{ width: `${ANCHO_EJE_Y}px`, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', padding: '0 4px', gap: '8px' }}>
          {etiquetas.map((etiq, idx) => (
            <span key={idx} title={etiq} style={{ fontSize: '9px', fontWeight: hoverIndex === idx ? 700 : 400, color: hoverIndex === idx ? colorHover : sutil, textAlign: 'center', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {etiq}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <div style={{ width: `${ANCHO_EJE_Y}px`, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 700, color: sutil, marginTop: '2px' }}>{ejeX}</span>
      </div>
    </div>
  );
};

const altoBarra = (val: number, tope: number) => (val > 0 ? Math.max((val / tope) * 100, 3) : 1.5);

// Gráfica de barras con tooltip y ejes X / Y
const BarChartCoherent = ({ dataObj, color, dark, tipoUnidad, ejeX, ejeY }: {
  dataObj: { valores: number[]; etiquetas: string[] }; color: string; dark: boolean; tipoUnidad: string; ejeX: string; ejeY: string;
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const { valores, etiquetas } = dataObj;

  return (
    <EjesGrafica
      etiquetas={etiquetas}
      max={tipoUnidad === '%' ? 100 : Math.max(...valores, 0)}
      formatoY={tipoUnidad === '$' ? pesosCorto : tipoUnidad === '%' ? (n: number) => `${n} %` : numero}
      ejeX={ejeX} ejeY={ejeY} dark={dark} hoverIndex={hoverIndex} colorHover={color}
      cabecera={hoverIndex !== null ? (
        <span style={{ fontSize: '11px', fontWeight: 700, color: dark ? '#FFF' : '#333', background: dark ? '#333' : '#E9ECEF', padding: '2px 8px', borderRadius: '6px' }}>
          {etiquetas[hoverIndex]}: {formatoValor(valores[hoverIndex], tipoUnidad)}
        </span>
      ) : (
        <span style={{ fontSize: '10px', color: dark ? '#9A9A9A' : '#6B6B6B' }}>Pasa el cursor sobre las barras</span>
      )}
      barras={(tope) => valores.map((val, idx) => {
        const isHovered = hoverIndex === idx;
        return (
          <div key={idx} onMouseEnter={() => setHoverIndex(idx)} onMouseLeave={() => setHoverIndex(null)}
            style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '100%', cursor: 'pointer' }}>
            <div style={{ height: `${altoBarra(val, tope)}%`, width: '100%', maxWidth: '24px', background: color, opacity: val > 0 ? (isHovered ? 1 : 0.8) : 0.3, borderRadius: '4px 4px 0 0', transition: 'all 0.2s ease' }} />
          </div>
        );
      })}
    />
  );
};

// Igual que la anterior, pero con dos barras por periodo (ventas vs. gastos)
const BarChartDoble = ({ etiquetas, series, dark, ejeX, ejeY }: {
  etiquetas: string[]; series: Array<{ nombre: string; valores: number[]; color: string }>; dark: boolean; ejeX: string; ejeY: string;
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const sutil = dark ? '#9A9A9A' : '#6B6B6B';

  return (
    <EjesGrafica
      etiquetas={etiquetas}
      max={Math.max(...series.flatMap(s => s.valores), 0)}
      formatoY={pesosCorto}
      ejeX={ejeX} ejeY={ejeY} dark={dark} hoverIndex={hoverIndex} colorHover={GOLD}
      cabecera={hoverIndex !== null ? (
        <span style={{ fontSize: '11px', fontWeight: 700, color: dark ? '#FFF' : '#333', background: dark ? '#333' : '#E9ECEF', padding: '2px 8px', borderRadius: '6px' }}>
          {etiquetas[hoverIndex]}: {series.map(s => `${s.nombre} ${pesos(s.valores[hoverIndex])}`).join(' · ')}
        </span>
      ) : (
        series.map(s => (
          <span key={s.nombre} style={{ fontSize: '10px', color: sutil, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color }} /> {s.nombre}
          </span>
        ))
      )}
      barras={(tope) => etiquetas.map((_, idx) => {
        const isHovered = hoverIndex === idx;
        return (
          <div key={idx} onMouseEnter={() => setHoverIndex(idx)} onMouseLeave={() => setHoverIndex(null)}
            style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px', height: '100%', cursor: 'pointer' }}>
            {series.map(s => {
              const val = s.valores[idx] ?? 0;
              return (
                <div key={s.nombre} style={{ height: `${altoBarra(val, tope)}%`, width: '100%', maxWidth: '18px', background: s.color, opacity: val > 0 ? (isHovered ? 1 : 0.8) : 0.3, borderRadius: '4px 4px 0 0', transition: 'all 0.2s ease' }} />
              );
            })}
          </div>
        );
      })}
    />
  );
};

// ==========================================
// REMISIONES POR APROBAR Y EN PROCESO
// ==========================================
const ESTADOS_EN_PROCESO: Remision['estado'][] = ['Pendiente', 'Aprobada', 'En producción', 'Terminada'];
const ORDEN_ESTADO: Record<string, number> = { 'Pendiente': 0, 'Aprobada': 1, 'En producción': 2, 'Terminada': 3 };
const NOMBRE_ESTADO: Record<string, string> = {
  'Pendiente': 'Por aprobar',
  'Aprobada': 'Aprobada',
  'En producción': 'En producción',
  'Terminada': 'Lista para entregar',
};
const MAX_TARJETAS = 9;

type FiltroProceso = 'todas' | 'aprobar' | 'proceso';

const RemisionesEnProceso: React.FC<Tema & {
  remisiones: Remision[] | null;
  producciones: Atencion['producciones_en_curso'];
  onVerTodas?: () => void;
}> = ({ remisiones, producciones, onVerTodas, cardBg, textColor, textSecColor, borderColor, dark }) => {
  const [filtro, setFiltro] = useState<FiltroProceso>('todas');
  const hoyIso = new Date().toISOString().slice(0, 10);

  const porAprobar = remisiones?.filter(r => r.estado === 'Pendiente').length ?? 0;
  const enProceso = (remisiones?.length ?? 0) - porAprobar;

  const lista = (remisiones ?? [])
    .filter(r => filtro === 'todas' || (filtro === 'aprobar' ? r.estado === 'Pendiente' : r.estado !== 'Pendiente'))
    .sort((a, b) => (ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado]) || a.fecha_recibo.localeCompare(b.fecha_recibo));
  const visibles = lista.slice(0, MAX_TARJETAS);

  const chips: Array<{ valor: FiltroProceso; label: string; n: number; color: string }> = [
    { valor: 'todas', label: 'Todas', n: remisiones?.length ?? 0, color: GOLD },
    { valor: 'aprobar', label: 'Por aprobar', n: porAprobar, color: COLOR_ESTADO['Pendiente'] },
    { valor: 'proceso', label: 'En proceso', n: enProceso, color: COLOR_ESTADO['En producción'] },
  ];

  return (
    <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '24px', borderRadius: '16px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: textColor }}>Remisiones</h3>
          <span style={{ fontSize: '12px', color: textSecColor }}>Remisiones por aprobar y las que están en proceso (aprobadas, en producción o listas para entregar).</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {chips.map(c => {
            const activo = filtro === c.valor;
            return (
              <button key={c.valor} onClick={() => setFiltro(c.valor)}
                style={{ border: `1px solid ${activo ? c.color : borderColor}`, background: activo ? `${c.color}20` : 'transparent', color: activo ? c.color : textSecColor, borderRadius: '20px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
                {c.label} ({c.n})
              </button>
            );
          })}
        </div>
      </div>

      {!remisiones ? <SinDatos texto="Cargando..." dark={dark} />
        : lista.length === 0 ? <SinDatos texto={filtro === 'aprobar' ? 'No hay remisiones por aprobar' : 'No hay remisiones en proceso'} dark={dark} />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {visibles.map(r => {
              const color = COLOR_ESTADO[r.estado] ?? textSecColor;
              const prod = r.estado === 'En producción' ? producciones.find(p => p.id_remision === r.id_remision) : undefined;
              const atrasada = !!r.fecha_entrega && r.fecha_entrega < hoyIso;
              const icono = r.estado === 'Pendiente' ? <FileText style={{ width: '18px', height: '18px', color }} />
                : r.estado === 'Terminada' ? <Truck style={{ width: '18px', height: '18px', color }} />
                : r.estado === 'En producción' ? <Scissors style={{ width: '18px', height: '18px', color }} />
                : <Factory style={{ width: '18px', height: '18px', color }} />;
              return (
                <div key={r.id_remision} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {icono}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, margin: 0, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.id_remision} · {r.cliente}</h4>
                      <p style={{ fontSize: '11px', color: textSecColor, margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Recibida {fechaCorta(r.fecha_recibo)} · {numero(r.total_prendas)} prendas
                      </p>
                    </div>
                  </div>

                  {prod && (
                    <div>
                      <div style={{ height: '6px', borderRadius: '6px', background: dark ? '#2A2A2A' : '#F3F3F5', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(prod.porcentaje_avance, 100)}%`, height: '100%', background: color, borderRadius: '6px' }} />
                      </div>
                      <span style={{ fontSize: '10px', color: textSecColor }}>{Math.round(prod.porcentaje_avance)} % · {numero(prod.total_realizado)} de {numero(prod.total_asignado)} unds</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${borderColor}`, paddingTop: '8px', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: atrasada ? DANGER : textSecColor, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {atrasada && <AlertTriangle size={12} />}
                      {r.fecha_entrega ? `Entrega ${fechaCorta(r.fecha_entrega)}` : 'Sin fecha de entrega'}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: `${color}20`, color, whiteSpace: 'nowrap' }}>
                      {NOMBRE_ESTADO[r.estado] ?? r.estado}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {remisiones && onVerTodas && lista.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: textSecColor }}>
            {lista.length > MAX_TARJETAS ? `Mostrando ${MAX_TARJETAS} de ${lista.length}` : `${lista.length} remisión${lista.length === 1 ? '' : 'es'}`}
          </span>
          <button onClick={onVerTodas} style={{ border: 'none', background: 'transparent', color: GOLD, fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'Montserrat, sans-serif' }}>
            Ir a Remisiones <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// EMPLEADOS: MEJOR POR PROCESO Y DESEMPEÑO
// ==========================================
const unoDecimal = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 1 });
const COLOR_MEDALLA = ['#C9A227', '#9AA4AE', '#B87333'];

/** En cada proceso, quién rinde mejor (unidades buenas por día, ajustado por calidad). */
const MejorPorProceso: React.FC<Tema & { datos: MejorPorProcesoT[] | null }> = ({ datos, cardBg, textColor, textSecColor, borderColor, dark }) => (
  <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '16px', boxSizing: 'border-box' }}>
    <CabeceraCard titulo="Quién rinde mejor en cada proceso" icono={<Award style={{ width: '18px', height: '18px', color: GOLD }} />} colorFondo={`${GOLD}20`} textColor={textColor} />
    {!datos ? <SinDatos texto="Cargando..." dark={dark} />
      : datos.length === 0 ? <SinDatos texto="No hay reportes del registro diario en este periodo" dark={dark} />
      : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {datos.map(m => (
            <div key={m.proceso} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${PURPLE}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Scissors style={{ width: '16px', height: '16px', color: PURPLE }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: textSecColor, textTransform: 'uppercase' }}>{m.proceso}</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.mejor.empleado}>
                  {m.mejor.empleado}
                </div>
                <span style={{ fontSize: '10px', color: textSecColor }}>
                  {numero(m.mejor.unidades)} unds en el periodo · {m.empleados} empleado{m.empleados === 1 ? '' : 's'} en este proceso
                </span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: textColor }}>{unoDecimal(m.mejor.unidades_por_dia)}</div>
                <span style={{ fontSize: '10px', color: textSecColor }}>unds/día</span>
                <div style={{ fontSize: '10px', fontWeight: 700, color: m.mejor.calidad >= 95 ? SUCCESS : m.mejor.calidad >= 90 ? GOLD : DANGER }}>{unoDecimal(m.mejor.calidad)} % calidad</div>
              </div>
            </div>
          ))}
        </div>
      )}
  </div>
);

/** Tabla de desempeño: ordenada por quien más rinde (unidades buenas por día trabajado). */
const DesempenoEmpleados: React.FC<Tema & { datos: DesempenoEmpleadoT[] | null }> = ({ datos, cardBg, textColor, textSecColor, borderColor, dark }) => {
  const maxDia = Math.max(...(datos ?? []).map(d => d.unidades_por_dia ?? 0), 1);
  const th: React.CSSProperties = { fontSize: '10px', fontWeight: 700, color: GOLD, padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: `2px solid ${GOLD}` };
  const td: React.CSSProperties = { fontSize: '12px', padding: '10px 12px', borderBottom: `1px solid ${borderColor}`, color: textColor, whiteSpace: 'nowrap' };
  const colorPct = (v: number | null, bueno: number, regular: number) => v === null ? textSecColor : v >= bueno ? SUCCESS : v >= regular ? GOLD : DANGER;

  return (
    <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '16px', boxSizing: 'border-box' }}>
      <CabeceraCard titulo="Desempeño por empleado" icono={<Medal style={{ width: '18px', height: '18px', color: GOLD }} />} colorFondo={`${GOLD}20`} textColor={textColor}
        extra={<span style={{ fontSize: '11px', color: textSecColor }}>Ordenado por unidades buenas por día trabajado</span>} />
      {!datos ? <SinDatos texto="Cargando..." dark={dark} />
        : datos.length === 0 ? <SinDatos texto="No hay asistencia ni producción registrada en este periodo" dark={dark} />
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'EMPLEADO', 'PROCESO PRINCIPAL', 'UNIDADES', 'UNDS / DÍA', 'UNDS / HORA', 'CALIDAD', 'ASISTENCIA', 'HORAS'].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {datos.map((d, i) => {
                  const produce = d.unidades > 0;
                  return (
                    <tr key={d.id_empleado}>
                      <td style={td}>
                        {produce && i < 3
                          ? <span title={`Puesto ${i + 1}`} style={{ display: 'inline-flex', width: '22px', height: '22px', borderRadius: '50%', background: `${COLOR_MEDALLA[i]}30`, color: COLOR_MEDALLA[i], alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px' }}>{i + 1}</span>
                          : <span style={{ color: textSecColor, paddingLeft: '6px' }}>{i + 1}</span>}
                      </td>
                      <td style={{ ...td, fontWeight: 700 }}>{d.empleado}</td>
                      <td style={{ ...td, color: textSecColor }}>{d.proceso_principal ?? 'Sin reportes'}</td>
                      <td style={{ ...td, fontWeight: 700 }}>
                        {numero(d.unidades)}
                        {d.defectuosas > 0 && <span style={{ fontSize: '10px', color: DANGER, fontWeight: 600 }}> · {numero(d.defectuosas)} def.</span>}
                      </td>
                      <td style={{ ...td, minWidth: '120px' }}>
                        {d.unidades_por_dia === null ? <span style={{ color: textSecColor }}>—</span> : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', borderRadius: '6px', background: dark ? '#2A2A2A' : '#F3F3F5', overflow: 'hidden', minWidth: '50px' }}>
                              <div style={{ width: `${(d.unidades_por_dia / maxDia) * 100}%`, height: '100%', background: PURPLE, borderRadius: '6px' }} />
                            </div>
                            <b>{unoDecimal(d.unidades_por_dia)}</b>
                          </div>
                        )}
                      </td>
                      <td style={td}>{d.unidades_por_hora === null ? <span style={{ color: textSecColor }}>—</span> : unoDecimal(d.unidades_por_hora)}</td>
                      <td style={{ ...td, fontWeight: 700, color: colorPct(d.calidad, 95, 90) }}>{d.calidad === null ? '—' : `${unoDecimal(d.calidad)} %`}</td>
                      <td style={{ ...td, fontWeight: 700, color: colorPct(d.asistencia, 90, 80) }} title={`${d.dias_presente} días presente · ${d.faltas} falta${d.faltas === 1 ? '' : 's'}`}>
                        {d.asistencia === null ? '—' : `${unoDecimal(d.asistencia)} %`}
                      </td>
                      <td style={{ ...td, color: textSecColor }}>{numero(d.horas)} h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      <p style={{ fontSize: '10px', color: textSecColor, margin: '12px 0 0' }}>
        Unidades buenas del registro diario. Unds/día = unidades ÷ días presente. Calidad = buenas ÷ (buenas + defectuosas).
        "Quién rinde mejor" compara a los empleados dentro de cada proceso, porque no se produce igual cortando que confeccionando.
      </p>
    </div>
  );
};
