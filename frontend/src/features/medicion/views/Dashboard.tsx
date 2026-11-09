import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  AlertTriangle,
  ShoppingCart,
  ShoppingBag,
  Scissors,
  TrendingUp
} from 'lucide-react';

interface DashboardProps {
  dark?: boolean;
}

export const DashboardPage: React.FC<DashboardProps> = ({ dark = false }) => {
  const [filtroInsumos, setFiltroInsumos] = useState('Mes');
  const [filtroCompras, setFiltroCompras] = useState('Mes');
  const [filtroRegistros, setFiltroRegistros] = useState('Diario');
  const [filtroProduccion, setFiltroProduccion] = useState('Mes');
  
  const [filtroGraficaProd, setFiltroGraficaProd] = useState('Mes');
  const [filtroGraficaCompras, setFiltroGraficaCompras] = useState('Mes');
  const [filtroGraficaRegistros, setFiltroGraficaRegistros] = useState('Diario');

  const bgStyle = dark ? '#121212' : '#F8F9FA';
  const cardBg = dark ? '#1E1E1E' : '#FFFFFF';
  const textColor = dark ? '#F8F9FA' : '#121212';
  const textSecColor = dark ? '#9A9A9A' : '#6B6B6B';
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const GOLD = '#C9A227';
  const SUCCESS = '#28A745';

  const periodosOpciones = [
    { value: 'Diario', label: 'Día' },
    { value: 'Semanal', label: 'Semana' },
    { value: 'Mes', label: 'Mes' },
    { value: 'Trimestre', label: 'Trimestre' },
    { value: 'Semestre', label: 'Semestre' },
    { value: 'Año', label: 'Año' }
  ];

  const datosInsumos: { [key: string]: { total: string; alerta: string } } = {
    Diario: { total: '24 Tipos', alerta: '3 con Stock Bajo' },
    Semanal: { total: '24 Tipos', alerta: '3 con Stock Bajo' },
    Mes: { total: '24 Tipos', alerta: '3 con Stock Bajo' },
    Trimestre: { total: '25 Tipos', alerta: '4 con Stock Bajo' },
    Semestre: { total: '26 Tipos', alerta: '2 con Stock Bajo' },
    Año: { total: '28 Tipos', alerta: '1 con Stock Bajo' }
  };

  const datosCompras: { [key: string]: { valor: string; subtitulo: string } } = {
    Diario: { valor: '$65.000', subtitulo: 'Gastos de hoy' },
    Semanal: { valor: '$320.000', subtitulo: 'Inversión semanal' },
    Mes: { valor: '$1.450.000', subtitulo: 'Inversión este mes' },
    Trimestre: { valor: '$4.300.000', subtitulo: 'Inversión trimestral' },
    Semestre: { valor: '$8.900.000', subtitulo: 'Inversión semestral' },
    Año: { valor: '$17.500.000', subtitulo: 'Inversión anual' }
  };

  const datosRegistros: { [key: string]: { valor: string; subtitulo: string } } = {
    Diario: { valor: '105 unds', subtitulo: 'Piezas hechas hoy' },
    Semanal: { valor: '520 unds', subtitulo: 'Piezas de la semana' },
    Mes: { valor: '2.100 unds', subtitulo: 'Piezas este mes' },
    Trimestre: { valor: '6.400 unds', subtitulo: 'Piezas trimestrales' },
    Semestre: { valor: '12.800 unds', subtitulo: 'Piezas semestrales' },
    Año: { valor: '25.500 unds', subtitulo: 'Piezas anuales' }
  };

  const datosProduccion: { [key: string]: { valor: string; subtitulo: string } } = {
    Diario: { valor: '1 Lote', subtitulo: 'En proceso hoy' },
    Semanal: { valor: '1 Lote', subtitulo: 'Completado esta semana' },
    Mes: { valor: '4 Lotes', subtitulo: 'Máximo mensual' },
    Trimestre: { valor: '12 Lotes', subtitulo: 'Producción trimestral' },
    Semestre: { valor: '24 Lotes', subtitulo: 'Producción semestral' },
    Año: { valor: '48 Lotes', subtitulo: 'Producción anual' }
  };

  // DATOS COHERENTES SEGÚN CADA FILTRO SELECCIONADO
  const datasetsProduccion: { [key: string]: { valores: number[]; etiquetas: string[] } } = {
    Diario: { valores: [1], etiquetas: ['Hoy'] },
    Semanal: { valores: [1, 2, 1, 2, 1, 1, 1], etiquetas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] },
    Mes: { valores: [1, 1, 1, 1], etiquetas: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'] },
    Trimestre: { valores: [3, 4, 5], etiquetas: ['Mes 1', 'Mes 2', 'Mes 3'] },
    Semestre: { valores: [4, 4, 3, 4, 5, 4], etiquetas: ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6'] },
    Año: { valores: [3, 4, 4, 5, 4, 4, 5, 4, 4, 3, 4, 4], etiquetas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] }
  };

  const datasetsCompras: { [key: string]: { valores: number[]; etiquetas: string[] } } = {
    Diario: { valores: [65000], etiquetas: ['Gastos del día'] },
    Semanal: { valores: [50000, 80000, 45000, 60000, 85000], etiquetas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
    Mes: { valores: [350000, 400000, 320000, 380000], etiquetas: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'] },
    Trimestre: { valores: [1200000, 1400000, 1700000], etiquetas: ['Mes 1', 'Mes 2', 'Mes 3'] },
    Semestre: { valores: [1400000, 1500000, 1600000, 1400000, 1500000, 1500000], etiquetas: ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6'] },
    Año: { valores: [1200000, 1300000, 1400000, 1500000, 1400000, 1300000, 1500000, 1400000, 1500000, 1400000, 1300000, 1500000], etiquetas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] }
  };

  const datasetsRegistros: { [key: string]: { valores: number[]; etiquetas: string[] } } = {
    Diario: { valores: [105], etiquetas: ['Total hoy'] },
    Semanal: { valores: [80, 110, 95, 130, 105], etiquetas: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'] },
    Mes: { valores: [450, 550, 520, 580], etiquetas: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'] },
    Trimestre: { valores: [1800, 2100, 2500], etiquetas: ['Mes 1', 'Mes 2', 'Mes 3'] },
    Semestre: { valores: [2100, 2200, 2150, 2200, 2150, 2100], etiquetas: ['Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6'] },
    Año: { valores: [2000, 2100, 2200, 2150, 2200, 2100, 2150, 2200, 2100, 2150, 2200, 2100], etiquetas: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgStyle, color: textColor, padding: '24px', fontFamily: 'Montserrat, sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ENCABEZADO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${borderColor}`, paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard style={{ width: '28px', height: '28px', color: GOLD }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: textColor, fontFamily: 'Montserrat, sans-serif' }}>Dashboard General</h1>
              <p style={{ fontSize: '13px', color: textSecColor, margin: '4px 0 0 0', fontFamily: 'Montserrat, sans-serif' }}>Resumen analítico de producción e inventario en Eslabón[cite: 5].</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: `${SUCCESS}15`, color: SUCCESS, fontSize: '12px', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: SUCCESS }}></span>
            Sistema en Línea
          </div>
        </div>

        {/* KPIS PRINCIPALES */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: textColor }}>Indicadores Clave</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            
            <KpiCardWithFilter 
              titulo="Inventario de Insumos" 
              valor={datosInsumos[filtroInsumos].total} 
              alertaTexto={datosInsumos[filtroInsumos].alerta}
              icono={<Box style={{ width: '20px', height: '20px', color: GOLD }} />} 
              colorFondo={`${GOLD}20`} 
              cardBg={cardBg} 
              textColor={textColor} 
              textSecColor={textSecColor} 
              borderColor={borderColor}
              filtro={filtroInsumos}
              setFiltro={setFiltroInsumos}
              opciones={periodosOpciones}
              dark={dark}
              hasAlert={true}
            />

            <KpiCardWithFilter 
              titulo="Compras de Insumos" 
              valor={datosCompras[filtroCompras].valor} 
              subtitulo={datosCompras[filtroCompras].subtitulo}
              icono={<ShoppingCart style={{ width: '20px', height: '20px', color: '#4A90E2' }} />} 
              colorFondo="#4A90E220" 
              cardBg={cardBg} 
              textColor={textColor} 
              textSecColor={textSecColor} 
              borderColor={borderColor}
              filtro={filtroCompras}
              setFiltro={setFiltroCompras}
              opciones={periodosOpciones}
              dark={dark}
            />

            <KpiCardWithFilter 
              titulo="Producción Diaria" 
              valor={datosRegistros[filtroRegistros].valor} 
              subtitulo={datosRegistros[filtroRegistros].subtitulo}
              icono={<Scissors style={{ width: '20px', height: '20px', color: '#9B6DFF' }} />} 
              colorFondo="#9B6DFF20" 
              cardBg={cardBg} 
              textColor={textColor} 
              textSecColor={textSecColor} 
              borderColor={borderColor}
              filtro={filtroRegistros}
              setFiltro={setFiltroRegistros}
              opciones={periodosOpciones}
              dark={dark}
            />

            <KpiCardWithFilter 
              titulo="Lotes Terminados" 
              valor={datosProduccion[filtroProduccion].valor} 
              subtitulo={datosProduccion[filtroProduccion].subtitulo}
              icono={<ShoppingBag style={{ width: '20px', height: '20px', color: SUCCESS }} />} 
              colorFondo={`${SUCCESS}20`} 
              cardBg={cardBg} 
              textColor={textColor} 
              textSecColor={textSecColor} 
              borderColor={borderColor}
              filtro={filtroProduccion}
              setFiltro={setFiltroProduccion}
              opciones={periodosOpciones}
              dark={dark}
            />

          </div>
        </div>

        {/* ANÁLISIS DE RENDIMIENTO (GRÁFICAS COHERENTES Y DINÁMICAS) */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: textColor }}>Análisis de Rendimiento</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            
            <GraficaCard 
              titulo="Historial de Producción" 
              valor={datosProduccion[filtroGraficaProd].valor} 
              porcentaje="Óptimo" 
              colorBadge={SUCCESS} 
              cardBg={cardBg} 
              textColor={textColor} 
              textSecColor={textSecColor} 
              borderColor={borderColor} 
              filtro={filtroGraficaProd} 
              setFiltro={setFiltroGraficaProd} 
              opciones={periodosOpciones}
              dark={dark}
            >
              <BarChartCoherent dataObj={datasetsProduccion[filtroGraficaProd]} color={SUCCESS} dark={dark} tipoUnidad="Lotes" />
            </GraficaCard>

            <GraficaCard 
              titulo="Flujo de Inversión en Compras" 
              valor={datosCompras[filtroGraficaCompras].valor} 
              porcentaje="Controlado" 
              colorBadge="#4A90E2" 
              cardBg={cardBg} 
              textColor={textColor} 
              textSecColor={textSecColor} 
              borderColor={borderColor} 
              filtro={filtroGraficaCompras} 
              setFiltro={setFiltroGraficaCompras} 
              opciones={periodosOpciones}
              dark={dark}
            >
              <BarChartCoherent dataObj={datasetsCompras[filtroGraficaCompras]} color="#4A90E2" dark={dark} tipoUnidad="$" />
            </GraficaCard>

            <GraficaCard 
              titulo="Avance de Piezas por Operarios" 
              valor={datosRegistros[filtroGraficaRegistros].valor} 
              porcentaje="Activo" 
              colorBadge="#9B6DFF" 
              cardBg={cardBg} 
              textColor={textColor} 
              textSecColor={textSecColor} 
              borderColor={borderColor} 
              filtro={filtroGraficaRegistros} 
              setFiltro={setFiltroGraficaRegistros} 
              opciones={periodosOpciones}
              dark={dark}
            >
              <BarChartCoherent dataObj={datasetsRegistros[filtroGraficaRegistros]} color="#9B6DFF" dark={dark} tipoUnidad="unds" />
            </GraficaCard>

          </div>
        </div>

        {/* ÚLTIMAS TRANSACCIONES */}
        <UltimasTransacciones cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} />

      </div>
    </div>
  );
};

// ==========================================
// COMPONENTES AUXILIARES CON COHERENCIA TEMPORAL
// ==========================================

const KpiCardWithFilter: React.FC<{
  titulo: string;
  valor: string;
  subtitulo?: string;
  alertaTexto?: string;
  icono: React.ReactNode;
  colorFondo: string;
  cardBg: string;
  textColor: string;
  textSecColor: string;
  borderColor: string;
  filtro: string;
  setFiltro: (val: string) => void;
  opciones: Array<{ value: string; label: string }>;
  dark: boolean;
  hasAlert?: boolean;
}> = ({ 
  titulo, valor, subtitulo, alertaTexto, icono, colorFondo, 
  cardBg, textColor, textSecColor, borderColor, filtro, setFiltro, opciones, dark, hasAlert 
}) => (
  <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxSizing: 'border-box' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: textSecColor, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>{titulo}</span>
        <h4 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: textColor }}>{valor}</h4>
      </div>
      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: colorFondo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icono}
      </div>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${borderColor}`, paddingTop: '10px', gap: '8px' }}>
      {hasAlert ? (
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC3545', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={12} style={{ flexShrink: 0 }} /> <span>{alertaTexto}</span>
        </span>
      ) : (
        <span style={{ fontSize: '11px', color: textSecColor }}>{subtitulo}</span>
      )}

      <select 
        value={filtro} 
        onChange={(e) => setFiltro(e.target.value)} 
        style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: dark ? '#2A2A2A' : '#F3F3F5', color: textColor, cursor: 'pointer', outline: 'none', fontFamily: 'Montserrat, sans-serif', flexShrink: 0 }}
      >
        {opciones.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>
);

const GraficaCard: React.FC<{
  titulo: string;
  valor: string;
  porcentaje: string;
  colorBadge: string;
  cardBg: string;
  textColor: string;
  textSecColor: string;
  borderColor: string;
  filtro: string;
  setFiltro: (val: string) => void;
  opciones: Array<{ value: string; label: string }>;
  dark: boolean;
  children: React.ReactNode;
}> = ({ titulo, valor, porcentaje, colorBadge, cardBg, textColor, textSecColor, borderColor, filtro, setFiltro, opciones, dark, children }) => (
  <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
      <div>
        <span style={{ fontSize: '12px', color: textSecColor, fontWeight: 700, display: 'block', marginBottom: '2px' }}>{titulo}</span>
        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: textColor }}>{valor}</h3>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
        <select 
          value={filtro} 
          onChange={(e) => setFiltro(e.target.value)} 
          style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: dark ? '#2A2A2A' : '#F3F3F5', color: textColor, cursor: 'pointer', outline: 'none', fontFamily: 'Montserrat, sans-serif' }}
        >
          {opciones.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '8px', background: `${colorBadge}20`, color: colorBadge, whiteSpace: 'nowrap' }}>{porcentaje}</span>
      </div>
    </div>
    
    <div style={{ width: '100%', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
      {children}
    </div>
  </div>
);

// Gráfica de barras coherente con etiquetas temporales dinámicas y tooltip limpio
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
            {etiquetas[hoverIndex]}: {tipoUnidad === '$' ? `$${valores[hoverIndex].toLocaleString()}` : `${valores[hoverIndex]} ${tipoUnidad}`}
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
          const alturaPorq = Math.max((val / maxVal) * 100, 12);
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
                  opacity: isHovered ? 1 : 0.8,
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
          <span key={idx} style={{ fontSize: '9px', fontWeight: hoverIndex === idx ? 700 : 400, color: hoverIndex === idx ? color : (dark ? '#9A9A9A' : '#6B6B6B'), textAlign: 'center', flex: 1 }}>
            {etiq}
          </span>
        ))}
      </div>
    </div>
  );
};

const UltimasTransacciones: React.FC<{
  cardBg: string;
  textColor: string;
  textSecColor: string;
  borderColor: string;
}> = ({ cardBg, textColor, textSecColor, borderColor }) => {
  const transacciones = [
    { referencia: 'REG-001', tipo: 'Producción', detalle: 'Juan Pérez - Manga Larga', valor: '45 unds', estado: 'Completado' },
    { referencia: 'COM-012', tipo: 'Compra', detalle: 'Reabastecimiento de hilos', valor: '$120.000', estado: 'Recibido' },
    { referencia: 'REG-002', tipo: 'Producción', detalle: 'María Rodríguez - Cuello Polo', valor: '60 unds', estado: 'Completado' },
    { referencia: 'COM-013', tipo: 'Compra', detalle: 'Botones y marquillas', valor: '$85.000', estado: 'Pendiente' },
  ];
  return (
    <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '24px', borderRadius: '16px', boxSizing: 'border-box' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: textColor }}>Últimos Movimientos del Taller</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {transacciones.map((t, idx) => {
          const esCompletado = t.estado === 'Completado' || t.estado === 'Recibido';
          return (
            <div key={idx} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#C9A22720', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShoppingBag style={{ width: '18px', height: '18px', color: '#C9A227' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, margin: 0, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.referencia} - {t.tipo}</h4>
                  <p style={{ fontSize: '11px', color: textSecColor, margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.detalle}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${borderColor}`, paddingTop: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: textColor }}>{t.valor}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: esCompletado ? '#28A74520' : '#FFB30020', color: esCompletado ? '#28A745' : '#D9822B', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  {t.estado}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};