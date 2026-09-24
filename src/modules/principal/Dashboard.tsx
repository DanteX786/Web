import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  ShoppingBag,
  Users,
  ChevronDown
} from 'lucide-react';

interface DashboardProps {
  dark?: boolean;
}

export const DashboardPage: React.FC<DashboardProps> = ({ dark = false }) => {
  const [filtroVentas, setFiltroVentas] = useState('Diario');
  const [filtroCompras, setFiltroCompras] = useState('Diario');
  const [filtroRegistros, setFiltroRegistros] = useState('Diario');
  const [filtroInsumos, setFiltroInsumos] = useState('Diario');
  const [filtroProveedores, setFiltroProveedores] = useState('Diario');
  const [filtroClientes, setFiltroClientes] = useState('Diario');

  const bgStyle = dark ? '#0f1115' : '#f8fafc';
  const cardBg = dark ? '#181b22' : '#ffffff';
  const textColor = dark ? '#ffffff' : '#0f172a';
  const textSecColor = dark ? '#94a3b8' : '#64748b';
  const borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgStyle, color: textColor, padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ENCABEZADO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${borderColor}`, paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(201, 162, 39, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard style={{ width: '28px', height: '28px', color: '#C9A227' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Dashboard General</h1>
              <p style={{ fontSize: '14px', color: textSecColor, margin: '4px 0 0 0' }}>Resumen analítico del sistema.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(66, 201, 90, 0.1)', color: '#42C95A', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#42C95A' }}></span>
            Sistema en Línea
          </div>
        </div>

        {/* KPIS */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Indicadores Clave</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <MiniStat titulo="Insumos Totales" valor="24" subtitulo="Registrados" icono={<Box style={{ width: '20px', height: '20px', color: '#C9A227' }} />} colorFondo="rgba(201, 162, 39, 0.15)" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} />
            <MiniStat titulo="Stock Bajo" valor="3" subtitulo="Por revisar" icono={<AlertTriangle style={{ width: '20px', height: '20px', color: '#FF453A' }} />} colorFondo="rgba(255, 69, 58, 0.15)" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} />
            <MiniStat titulo="Ventas del Mes" valor="128" subtitulo="Completadas" icono={<ShoppingCart style={{ width: '20px', height: '20px', color: '#42C95A' }} />} colorFondo="rgba(66, 201, 90, 0.15)" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} />
            <MiniStat titulo="Ingresos" valor="$18.4M" subtitulo="Este mes" icono={<DollarSign style={{ width: '20px', height: '20px', color: '#C9A227' }} />} colorFondo="rgba(201, 162, 39, 0.15)" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} />
          </div>
        </div>

        {/* GRAFICAS GRID */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Análisis de Rendimiento</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            <GraficaCard titulo="Comportamiento de Ventas" valor="$18.450.000" porcentaje="+12.5%" colorBadge="#C9A227" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} filtro={filtroVentas} setFiltro={setFiltroVentas} dark={dark}><VentasChart dark={dark} /></GraficaCard>
            <GraficaCard titulo="Flujo de Compras" valor="$8.750.000" porcentaje="+8.4%" colorBadge="#4D8DFF" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} filtro={filtroCompras} setFiltro={setFiltroCompras} dark={dark}><ComprasChart dark={dark} /></GraficaCard>
            <GraficaCard titulo="Registros Diarios" valor="32" porcentaje="+6.2%" colorBadge="#9B6DFF" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} filtro={filtroRegistros} setFiltro={setFiltroRegistros} dark={dark}><RegistrosChart dark={dark} /></GraficaCard>
            <GraficaCard titulo="Distribución de Insumos" valor="24" porcentaje="Actualizado" colorBadge="#C9A227" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} filtro={filtroInsumos} setFiltro={setFiltroInsumos} dark={dark}><InsumosChart dark={dark} /></GraficaCard>
            <GraficaCard titulo="Proveedores Activos" valor="15" porcentaje="+4.1%" colorBadge="#4D8DFF" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} filtro={filtroProveedores} setFiltro={setFiltroProveedores} dark={dark}><ProveedoresChart dark={dark} /></GraficaCard>
            <GraficaCard titulo="Segmentación de Clientes" valor="340" porcentaje="+15.3%" colorBadge="#42C95A" cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} filtro={filtroClientes} setFiltro={setFiltroClientes} dark={dark}><ClientesChart dark={dark} /></GraficaCard>
          </div>
        </div>

        {/* ULTIMAS VENTAS */}
        <UltimasVentas cardBg={cardBg} textColor={textColor} textSecColor={textSecColor} borderColor={borderColor} />

      </div>
    </div>
  );
};

// COMPONENTES AUXILIARES CON ESTILOS EN LÍNEA SEGUROS
const MiniStat: React.FC<any> = ({ titulo, valor, subtitulo, icono, colorFondo, cardBg, textColor, textSecColor, borderColor }) => (
  <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <span style={{ fontSize: '11px', fontWeight: 600, color: textSecColor, textTransform: 'uppercase' }}>{titulo}</span>
      <h4 style={{ fontSize: '22px', fontWeight: 'bold', margin: '4px 0' }}>{valor}</h4>
      <span style={{ fontSize: '11px', color: textSecColor }}>{subtitulo}</span>
    </div>
    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: colorFondo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icono}
    </div>
  </div>
);

const GraficaCard: React.FC<any> = ({ titulo, valor, porcentaje, colorBadge, cardBg, textColor, textSecColor, borderColor, filtro, setFiltro, dark, children }) => (
  <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      <div>
        <span style={{ fontSize: '12px', color: textSecColor, fontWeight: 600 }}>{titulo}</span>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '4px 0 0 0' }}>{valor}</h3>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: dark ? '#222' : '#f1f5f9', color: textColor, cursor: 'pointer', outline: 'none' }}>
          <option value="Diario">Diario</option>
          <option value="Mensual">Mensual</option>
          <option value="6 Meses">6 Meses</option>
        </select>
        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', background: `${colorBadge}20`, color: colorBadge }}>{porcentaje}</span>
      </div>
    </div>
    <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </div>
  </div>
);

const VentasChart = ({ dark }: { dark: boolean }) => {
  const datos = [35, 52, 42, 72, 65, 88, 78];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <div style={{ width: '100%', height: '150px', position: 'relative' }}>
        <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={datos.reduce((acc, val, idx) => { const x = (idx / (datos.length - 1)) * 100; const y = 100 - (val / 100) * 100; return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`; }, '')} fill="none" stroke="#C9A227" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {datos.map((val, idx) => <circle key={idx} cx={(idx / (datos.length - 1)) * 100} cy={100 - (val / 100) * 100} r="3.5" fill="#C9A227" />)}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: dark ? '#888' : '#aaa' }}><span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span></div>
    </div>
  );
};

const ComprasChart = ({ dark }: { dark: boolean }) => {
  const datos = [25, 40, 34, 55, 48, 68, 60];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
      <div style={{ width: '100%', height: '150px', position: 'relative' }}>
        <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={datos.reduce((acc, val, idx) => { const x = (idx / (datos.length - 1)) * 100; const y = 100 - (val / 100) * 100; return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`; }, '')} fill="none" stroke="#4D8DFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {datos.map((val, idx) => <circle key={idx} cx={(idx / (datos.length - 1)) * 100} cy={100 - (val / 100) * 100} r="3.5" fill="#4D8DFF" />)}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: dark ? '#888' : '#aaa' }}><span>Sem 1</span><span>Sem 2</span><span>Sem 3</span><span>Sem 4</span></div>
    </div>
  );
};

const RegistrosChart = ({ dark }: { dark: boolean }) => {
  const datos = [35, 55, 42, 70, 62, 82, 58];
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ width: '100%', height: '150px', display: 'flex', alignItems: 'flex-end', justifyContent: 'around' }}>
        {datos.map((val, idx) => <div key={idx} style={{ flex: 1, display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'flex-end' }}><div style={{ height: `${val}%`, width: '14px', background: '#9B6DFF', borderRadius: '4px 4px 0 0' }} /></div>)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '10px', color: dark ? '#888' : '#aaa' }}>{dias.map((d, i) => <span key={i}>{d}</span>)}</div>
    </div>
  );
};

const InsumosChart = ({ dark }: { dark: boolean }) => {
  const items = [
    { label: 'Hilos', color: '#C9A227', porcentaje: 35 },
    { label: 'Botones', color: '#4D8DFF', porcentaje: 25 },
    { label: 'Cierres', color: '#42C95A', porcentaje: 20 },
    { label: 'Telas', color: '#FFB300', porcentaje: 20 },
  ];
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="3.8" />
          {(() => {
            let acumulado = 0;
            return items.map((item, idx) => {
              const offset = acumulado;
              acumulado += item.porcentaje;
              return <circle key={idx} cx="18" cy="18" r="15.9155" fill="none" stroke={item.color} strokeWidth="3.8" strokeDasharray={`${item.porcentaje} ${100 - item.porcentaje}`} strokeDashoffset={-offset} />;
            });
          })()}
        </svg>
        <div style={{ position: 'absolute', fontWeight: 'bold', fontSize: '18px' }}>24</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProveedoresChart = ({ dark }: { dark: boolean }) => {
  const proveedores = [
    { nombre: 'Textiles S.A.', entregas: 85, color: '#4D8DFF' },
    { nombre: 'Botones & Co.', entregas: 60, color: '#C9A227' },
    { nombre: 'Hilos del Sur', entregas: 75, color: '#42C95A' },
    { nombre: 'Cierres Express', entregas: 45, color: '#9B6DFF' },
  ];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ width: '100%', height: '150px', display: 'flex', alignItems: 'flex-end', justifyContent: 'around' }}>
        {proveedores.map((prov, idx) => <div key={idx} style={{ flex: 1, display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'flex-end' }}><div style={{ height: `${prov.entregas}%`, width: '18px', background: prov.color, borderRadius: '4px 4px 0 0' }} /></div>)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '9px', color: dark ? '#888' : '#aaa' }}>{proveedores.map((prov, i) => <span key={i} style={{ textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}>{prov.nombre}</span>)}</div>
    </div>
  );
};

const ClientesChart = ({ dark }: { dark: boolean }) => {
  const segmentos = [
    { label: 'Frecuentes', color: '#42C95A', porcentaje: 50 },
    { label: 'Ocasionales', color: '#4D8DFF', porcentaje: 30 },
    { label: 'Nuevos', color: '#9B6DFF', porcentaje: 20 },
  ];
  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
      <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth="3.8" />
          {(() => {
            let acumulado = 0;
            return segmentos.map((item, idx) => {
              const offset = acumulado;
              acumulado += item.porcentaje;
              return <circle key={idx} cx="18" cy="18" r="15.9155" fill="none" stroke={item.color} strokeWidth="3.8" strokeDasharray={`${item.porcentaje} ${100 - item.porcentaje}`} strokeDashoffset={-offset} />;
            });
          })()}
        </svg>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px', lineHeight: 1 }}>340</span>
          <span style={{ fontSize: '9px', color: dark ? '#888' : '#aaa' }}>Total</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segmentos.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
            <span>{item.label} ({item.porcentaje}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const UltimasVentas = ({ cardBg, textColor, textSecColor, borderColor }: any) => {
  const ventas = [
    { cliente: 'Carlos Pérez', producto: 'Camisa clásica', precio: '$180.000', estado: 'Completada' },
    { cliente: 'María Gómez', producto: 'Pantalón formal', precio: '$220.000', estado: 'Completada' },
    { cliente: 'Juan Rodríguez', producto: 'Camisa Oxford', precio: '$195.000', estado: 'Pendiente' },
    { cliente: 'Laura Martínez', producto: 'Pantalón ejecutivo', precio: '$250.000', estado: 'Completada' },
  ];
  return (
    <div style={{ background: cardBg, border: `1px solid ${borderColor}`, padding: '24px', borderRadius: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Últimas Transacciones de Venta</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {ventas.map((v, idx) => (
          <div key={idx} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(201, 162, 39, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag style={{ width: '18px', height: '18px', color: '#C9A227' }} />
              </div>
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>{v.cliente}</h4>
                <p style={{ fontSize: '11px', color: textSecColor, margin: '2px 0 0 0' }}>{v.producto}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${borderColor}`, paddingTop: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{v.precio}</span>
              <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', background: v.estado === 'Completada' ? 'rgba(66, 201, 90, 0.15)' : 'rgba(255, 179, 0, 0.15)', color: v.estado === 'Completada' ? '#42C95A' : '#FFB300' }}>
                {v.estado}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};