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
} from 'lucide-react';
import { toast } from 'sonner';
import { mensajeError } from '../../../shared/utils/api';
import {
  dashboardService,
  type Atencion,
  type Clientes,
  type Dinero,
  type Indicador,
  type Movimiento,
  type Produccion,
  type TipoPeriodo,
} from '../services/dashboardService';

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
const ORANGE = '#D9822B';

const PERIODOS: Array<{ value: TipoPeriodo; label: string }> = [
  { value: 'mes', label: 'Mensual' },
  { value: 'trimestre', label: 'Trimestral' },
  { value: 'semestre', label: 'Semestral' },
  { value: 'anio', label: 'Anual' },
];

const NOMBRE_PERIODO_ANTERIOR: Record<TipoPeriodo, string> = {
  mes: 'el mes anterior',
  trimestre: 'el trimestre anterior',
  semestre: 'el semestre anterior',
  anio: 'el año anterior',
};

const pesos = (n: number) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;
const numero = (n: number) => Math.round(n || 0).toLocaleString('es-CO');
const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
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

  // Cada fila tiene su propio periodo
  const [periodoDinero, setPeriodoDinero] = useState<TipoPeriodo>('mes');
  const [periodoProduccion, setPeriodoProduccion] = useState<TipoPeriodo>('mes');
  const [periodoClientes, setPeriodoClientes] = useState<TipoPeriodo>('trimestre');

  const [atencion, setAtencion] = useState<Atencion | null>(null);
  const [dinero, setDinero] = useState<Dinero | null>(null);
  const [produccion, setProduccion] = useState<Produccion | null>(null);
  const [clientes, setClientes] = useState<Clientes | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);

  const [conectado, setConectado] = useState<boolean | null>(null);
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [recargar, setRecargar] = useState(0);

  const avisarError = (error: unknown) => {
    setConectado(false);
    toast.error(`No se pudo cargar el dashboard: ${mensajeError(error)}`, { id: 'error-dashboard' });
  };

  // Filas sin periodo: se cargan al abrir y al pulsar "Actualizar"
  useEffect(() => {
    Promise.all([dashboardService.atencion(), dashboardService.movimientos(8)])
      .then(([a, m]) => { setAtencion(a); setMovimientos(m); setConectado(true); setActualizado(new Date()); })
      .catch(avisarError);
  }, [recargar]);

  useEffect(() => { dashboardService.dinero(periodoDinero).then(setDinero).catch(avisarError); }, [periodoDinero, recargar]);
  useEffect(() => { dashboardService.produccion(periodoProduccion).then(setProduccion).catch(avisarError); }, [periodoProduccion, recargar]);
  useEffect(() => { dashboardService.clientes(periodoClientes).then(setClientes).catch(avisarError); }, [periodoClientes, recargar]);

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
              <p style={{ fontSize: '13px', color: textSecColor, margin: '4px 0 0 0', fontFamily: 'Montserrat, sans-serif' }}>Resumen del taller: lo pendiente, el dinero, la producción y los clientes.</p>
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

        {/* FILA 2: DINERO */}
        <section>
          <TituloFila titulo="Dinero" descripcion={dinero?.periodo.etiqueta} textColor={textColor} textSecColor={textSecColor}>
            <SelectorPeriodo valor={periodoDinero} onChange={setPeriodoDinero} {...tema} />
          </TituloFila>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <KpiCard {...tema} titulo="Facturado" valor={dinero ? pesos(dinero.facturado.valor) : '—'}
              subtitulo="Entregas del periodo"
              icono={<TrendingUp style={{ width: '20px', height: '20px', color: SUCCESS }} />} colorFondo={`${SUCCESS}20`}
              badge={<Variacion indicador={dinero?.facturado} periodo={periodoDinero} />} />
            <KpiCard {...tema} titulo="Cobrado" valor={dinero ? pesos(dinero.cobrado.valor) : '—'}
              subtitulo={dinero ? (dinero.cobrado.pendiente > 0 ? `Falta cobrar ${pesos(dinero.cobrado.pendiente)}` : 'Todo lo facturado está pago') : ''}
              icono={<CheckCircle2 style={{ width: '20px', height: '20px', color: GOLD }} />} colorFondo={`${GOLD}20`}
              badge={<Variacion indicador={dinero?.cobrado} periodo={periodoDinero} />} />
            <KpiCard {...tema} titulo="Gastos en compras" valor={dinero ? pesos(dinero.gastos_compras.valor) : '—'}
              subtitulo={dinero ? `${dinero.gastos_compras.compras} compra${dinero.gastos_compras.compras === 1 ? '' : 's'} de insumos` : ''}
              icono={<ShoppingCart style={{ width: '20px', height: '20px', color: BLUE }} />} colorFondo={`${BLUE}20`}
              badge={<Variacion indicador={dinero?.gastos_compras} periodo={periodoDinero} subirEsMalo />}
              onClick={() => ir('compras')} />
            <KpiCard {...tema} titulo="Ganancia estimada" valor={dinero ? pesos(dinero.ganancia.valor) : '—'}
              subtitulo="Facturado menos compras"
              icono={<PiggyBank style={{ width: '20px', height: '20px', color: PURPLE }} />} colorFondo={`${PURPLE}20`}
              badge={<Variacion indicador={dinero?.ganancia} periodo={periodoDinero} />} />
          </div>
          <GraficaCard {...tema}
            titulo="Facturado vs. compras"
            valor={dinero ? pesos(dinero.facturado.valor - dinero.gastos_compras.valor) : '—'}
            etiquetaValor="de diferencia en el periodo"
            porcentaje={!dinero ? '...' : dinero.ganancia.valor >= 0 ? 'Ganancia' : 'Pérdida'}
            colorBadge={!dinero || dinero.ganancia.valor >= 0 ? SUCCESS : DANGER}
          >
            {dinero && (
              <BarChartDoble
                etiquetas={dinero.grafica.etiquetas}
                series={[
                  { nombre: 'Facturado', valores: dinero.grafica.facturado, color: SUCCESS },
                  { nombre: 'Compras', valores: dinero.grafica.compras, color: BLUE },
                ]}
                dark={dark}
              />
            )}
          </GraficaCard>
        </section>

        {/* FILA 3: PRODUCCIÓN */}
        <section>
          <TituloFila titulo="Producción" descripcion={produccion?.periodo.etiqueta} textColor={textColor} textSecColor={textSecColor}>
            <SelectorPeriodo valor={periodoProduccion} onChange={setPeriodoProduccion} {...tema} />
          </TituloFila>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <KpiCard {...tema} titulo="Unidades confeccionadas" valor={produccion ? `${numero(produccion.unidades_confeccionadas.valor)} unds` : '—'}
              subtitulo="Reportadas en el registro diario"
              icono={<Scissors style={{ width: '20px', height: '20px', color: PURPLE }} />} colorFondo={`${PURPLE}20`}
              badge={<Variacion indicador={produccion?.unidades_confeccionadas} periodo={periodoProduccion} />}
              onClick={() => ir('registroDiario')} />
            <KpiCard {...tema} titulo="Prendas entregadas" valor={produccion ? `${numero(produccion.prendas_entregadas.valor)} unds` : '—'}
              subtitulo={produccion ? `${produccion.prendas_entregadas.remisiones} ${produccion.prendas_entregadas.remisiones === 1 ? 'remisión entregada' : 'remisiones entregadas'}` : ''}
              icono={<ShoppingBag style={{ width: '20px', height: '20px', color: SUCCESS }} />} colorFondo={`${SUCCESS}20`}
              badge={<Variacion indicador={produccion?.prendas_entregadas} periodo={periodoProduccion} />} />
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
              {produccion && <BarChartCoherent dataObj={produccion.grafica_unidades} color={PURPLE} dark={dark} tipoUnidad="unds" />}
            </GraficaCard>
            <GraficaCard {...tema} titulo="Unidades por empleado"
              valor={produccion?.por_empleado[0] ? produccion.por_empleado[0].empleado : 'Sin reportes'}
              etiquetaValor={produccion?.por_empleado[0] ? 'es quien más produjo' : undefined}
              porcentaje="Rendimiento" colorBadge={SUCCESS}>
              {produccion && (produccion.por_empleado.length === 0
                ? <SinDatos texto="No hay reportes diarios en este periodo" dark={dark} />
                : <BarChartCoherent
                    dataObj={{ etiquetas: produccion.por_empleado.map(e => e.empleado.split(' ')[0]), valores: produccion.por_empleado.map(e => e.unidades) }}
                    color={SUCCESS} dark={dark} tipoUnidad="unds" />)}
            </GraficaCard>
          </div>
        </section>

        {/* FILA 4: CLIENTES */}
        <section>
          <TituloFila titulo="Clientes" descripcion={clientes?.periodo.etiqueta} textColor={textColor} textSecColor={textSecColor}>
            <SelectorPeriodo valor={periodoClientes} onChange={setPeriodoClientes} {...tema} />
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

        {/* FILA 5: ÚLTIMOS MOVIMIENTOS */}
        <UltimasTransacciones movimientos={movimientos} cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} dark={dark} />

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

const SelectorPeriodo: React.FC<Tema & { valor: TipoPeriodo; onChange: (v: TipoPeriodo) => void }> = ({ valor, onChange, borderColor, dark, textColor }) => (
  <select
    value={valor}
    onChange={(e) => onChange(e.target.value as TipoPeriodo)}
    style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: dark ? '#2A2A2A' : '#F3F3F5', color: textColor, cursor: 'pointer', outline: 'none', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}
  >
    {PERIODOS.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

/** Pastilla con el % de cambio frente al periodo anterior. */
const Variacion: React.FC<{ indicador?: Indicador; periodo: TipoPeriodo; subirEsMalo?: boolean }> = ({ indicador, periodo, subirEsMalo = false }) => {
  if (!indicador) return null;
  const v = indicador.variacion;
  const titulo = `Comparado con el mismo tramo de ${NOMBRE_PERIODO_ANTERIOR[periodo]}`;
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

    <div style={{ width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
      {children}
    </div>
  </div>
);

const formatoValor = (valor: number, tipoUnidad: string) =>
  tipoUnidad === '$' ? pesos(valor) : `${numero(valor)} ${tipoUnidad}`;

// Gráfica de barras con tooltip (la del dashboard original)
const BarChartCoherent = ({ dataObj, color, dark, tipoUnidad }: { dataObj: { valores: number[]; etiquetas: string[] }; color: string; dark: boolean; tipoUnidad: string }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const valores = dataObj.valores;
  const etiquetas = dataObj.etiquetas;
  const maxVal = Math.max(...valores, 5);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box', position: 'relative' }}>

      {/* Tooltip superior limpio */}
      <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
        {hoverIndex !== null ? (
          <span style={{ fontSize: '11px', fontWeight: 700, color: dark ? '#FFF' : '#333', background: dark ? '#333' : '#E9ECEF', padding: '2px 8px', borderRadius: '6px' }}>
            {etiquetas[hoverIndex]}: {formatoValor(valores[hoverIndex], tipoUnidad)}
          </span>
        ) : (
          <span style={{ fontSize: '10px', color: dark ? '#9A9A9A' : '#6B6B6B' }}>
            Pasa el cursor sobre las barras
          </span>
        )}
      </div>

      {/* Barras de datos */}
      <div style={{ width: '100%', height: '90px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px' }}>
        {valores.map((val, idx) => {
          // Los valores en 0 se ven como una línea fina (antes se veían igual que un valor pequeño)
          const alturaPorq = val > 0 ? Math.max((val / maxVal) * 100, 8) : 2;
          const isHovered = hoverIndex === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
            >
              <div
                style={{
                  height: `${alturaPorq}%`,
                  width: '100%',
                  maxWidth: '24px',
                  background: color,
                  opacity: val > 0 ? (isHovered ? 1 : 0.8) : 0.3,
                  transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Etiquetas del eje X acordes al tiempo */}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, paddingTop: '6px', marginTop: '4px' }}>
        {etiquetas.map((etiq, idx) => (
          <span key={idx} style={{ fontSize: '9px', fontWeight: hoverIndex === idx ? 700 : 400, color: hoverIndex === idx ? color : (dark ? '#9A9A9A' : '#6B6B6B'), textAlign: 'center', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {etiq}
          </span>
        ))}
      </div>
    </div>
  );
};

// Igual que la anterior, pero con dos barras por periodo (ej. facturado vs. compras)
const BarChartDoble = ({ etiquetas, series, dark }: { etiquetas: string[]; series: Array<{ nombre: string; valores: number[]; color: string }>; dark: boolean }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const maxVal = Math.max(...series.flatMap(s => s.valores), 5);
  const sutil = dark ? '#9A9A9A' : '#6B6B6B';

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
      <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '4px' }}>
        {hoverIndex !== null ? (
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
      </div>

      <div style={{ width: '100%', height: '90px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px' }}>
        {etiquetas.map((_, idx) => {
          const isHovered = hoverIndex === idx;
          return (
            <div key={idx} onMouseEnter={() => setHoverIndex(idx)} onMouseLeave={() => setHoverIndex(null)}
              style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '3px', height: '100%', cursor: 'pointer' }}>
              {series.map(s => {
                const val = s.valores[idx] ?? 0;
                const altura = val > 0 ? Math.max((val / maxVal) * 100, 8) : 2;
                return (
                  <div key={s.nombre} style={{ height: `${altura}%`, width: '100%', maxWidth: '18px', background: s.color, opacity: val > 0 ? (isHovered ? 1 : 0.8) : 0.3, transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)', borderRadius: '4px 4px 0 0', transition: 'all 0.2s ease' }} />
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`, paddingTop: '6px', marginTop: '4px' }}>
        {etiquetas.map((etiq, idx) => (
          <span key={idx} style={{ fontSize: '9px', fontWeight: hoverIndex === idx ? 700 : 400, color: hoverIndex === idx ? GOLD : sutil, textAlign: 'center', flex: 1 }}>
            {etiq}
          </span>
        ))}
      </div>
    </div>
  );
};

const ESTADOS_OK = ['Pagada', 'Entregada', 'Registrada', 'Aprobada', 'Terminada'];
const ESTADOS_MAL = ['Rechazada'];

const UltimasTransacciones: React.FC<{
  movimientos: Movimiento[] | null;
  cardBg: string;
  textColor: string;
  textSecColor: string;
  borderColor: string;
  dark: boolean;
}> = ({ movimientos, cardBg, textColor, textSecColor, borderColor, dark }) => {
  const info = (m: Movimiento) => {
    if (m.tipo === 'compra') return {
      tipo: 'Compra', icono: <ShoppingCart style={{ width: '18px', height: '18px', color: BLUE }} />, fondo: `${BLUE}20`,
      detalle: m.responsable ? `${m.detalle} · ${m.responsable}` : m.detalle, valor: m.valor !== null ? pesos(m.valor) : '—',
    };
    if (m.tipo === 'entrega') return {
      tipo: 'Entrega', icono: <Truck style={{ width: '18px', height: '18px', color: SUCCESS }} />, fondo: `${SUCCESS}20`,
      detalle: `${m.detalle} · ${m.responsable ?? ''}`, valor: m.valor !== null ? pesos(m.valor) : '—',
    };
    return {
      tipo: 'Remisión', icono: <ShoppingBag style={{ width: '18px', height: '18px', color: GOLD }} />, fondo: `${GOLD}20`,
      detalle: m.responsable && m.responsable !== m.detalle ? `${m.detalle} · por ${m.responsable}` : m.detalle,
      valor: m.valor !== null ? `${numero(m.valor)} prendas` : '—',
    };
  };

  return (
    <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '24px', borderRadius: '16px', boxSizing: 'border-box' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: textColor }}>Últimos Movimientos del Taller</h3>
      {!movimientos ? <SinDatos texto="Cargando..." dark={dark} />
        : movimientos.length === 0 ? <SinDatos texto="Todavía no hay movimientos" dark={dark} />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {movimientos.map((m) => {
              const d = info(m);
              const ok = ESTADOS_OK.includes(m.estado);
              const mal = ESTADOS_MAL.includes(m.estado);
              return (
                <div key={`${m.tipo}-${m.referencia}-${m.fecha}-${m.estado}`} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: d.fondo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {d.icono}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, margin: 0, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.referencia} - {d.tipo}</h4>
                      <p style={{ fontSize: '11px', color: textSecColor, margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d.detalle}>{fechaCorta(m.fecha)} · {d.detalle}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${borderColor}`, paddingTop: '8px', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: textColor, whiteSpace: 'nowrap' }}>{d.valor}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: ok ? '#28A74520' : mal ? `${DANGER}20` : '#FFB30020', color: ok ? '#28A745' : mal ? DANGER : ORANGE, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                      {m.estado}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};
