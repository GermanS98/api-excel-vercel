'use client';

import { 
  ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, 
  CartesianGrid, Scatter, Line, LabelList, Cell, Legend
} from 'recharts';
import { linearRegression } from 'simple-statistics';

// CAMBIO: Paleta de colores más granular para cada segmento
const PALETA_SEGMENTOS: { [key: string]: string } = {
  'LECAP': '#1036E2', 'BONCAP': '#1036E2', 'BONTE': '#1036E2', 'DUAL TAMAR': '#1036E2',
  'CER': '#00C600', 'ON CER': '#99E899',
  'DL': '#4C68E9', 'ON DL': '#4C68E9', 'ON HD': '#4C68E9',
  'TAMAR': '#283A6B', 'ON TAMAR': '#283A6B',
  'BONAR': '#808080', // Color único para Bonares
  'GLOBAL': '#4b5563', // Color único para Globales
  'BOPREAL': '#a1a1aa', // Color único para Bopreales
  'ON': '#021751',
  'default': '#d1d5db'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data.ticker) return null;
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc',
        padding: '10px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{`Ticker: ${data.ticker}`}</p>
        <p style={{ margin: 0, color: '#666' }}>{`TIR: ${(data.tir * 100).toFixed(2)}%`}</p>
        <p style={{ margin: 0, color: '#666' }}>{`Días al Vto: ${data.dias_vto}`}</p>
      </div>
    );
  }
  return null;
};

// Función auxiliar para calcular una línea de tendencia para un segmento específico
const calcularTendencia = (datos: any[], segmento?: string) => {
  const datosParaRegresion = segmento ? datos.filter(p => p.segmento === segmento) : datos;
  
  if (datosParaRegresion.length < 2) return [];

  const regressionPoints = datosParaRegresion
    .filter(p => p.dias_vto > 0 && typeof p.tir === 'number' && isFinite(p.tir))
    .map(p => [Math.log(p.dias_vto), p.tir]);

  if (regressionPoints.length < 2) return [];

  const { m, b } = linearRegression(regressionPoints);
  
  const uniqueXPoints = [...new Set(datosParaRegresion.map(p => p.dias_vto).filter(d => d > 0))].sort((a,b) => a - b);
  
  return uniqueXPoints.map(x => ({
    dias_vto: x,
    trend: m * Math.log(x) + b
  }));
};

export default function CurvaRendimientoChart({ data }: { data: any[] }) {
  // CAMBIO: Lógica para múltiples líneas de tendencia
  const segmentosSoberanos = ['BONAR', 'GLOBAL', 'BOPREAL'];
  const contieneSoberanos = data.some(p => segmentosSoberanos.includes(p.segmento));

  const trendlineBonar = contieneSoberanos ? calcularTendencia(data, 'BONAR') : [];
  const trendlineGlobal = contieneSoberanos ? calcularTendencia(data, 'GLOBAL') : [];
  const trendlineBopreal = contieneSoberanos ? calcularTendencia(data, 'BOPREAL') : [];
  const trendlineGeneral = !contieneSoberanos ? calcularTendencia(data) : [];

  return (
    <div style={{ width: '100%', height: 450, userSelect: 'none' }}>
      <ResponsiveContainer>
        <ComposedChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="dias_vto" name="Días al Vencimiento" tick={{ fontSize: 12 }} domain={['dataMin', 'dataMax']} />
          <YAxis type="number" dataKey="tir" name="TIR" tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} domain={['auto', 'auto']} tick={{ fontSize: 12 }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Scatter name="Bonos" data={data}>
            <LabelList dataKey="ticker" position="top" style={{ fontSize: 10, fill: '#666' }} />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PALETA_SEGMENTOS[entry.segmento] || PALETA_SEGMENTOS.default} />
            ))}
          </Scatter>
          
          {/* CAMBIO: Renderizado condicional de líneas de tendencia */}
          {contieneSoberanos ? (
            <>
              <Line name="Tendencia Bonares" data={trendlineBonar} dataKey="trend" stroke="#1036E2" dot={false} strokeWidth={2} type="monotone" />
              <Line name="Tendencia Globales" data={trendlineGlobal} dataKey="trend" stroke="#283A6B" dot={false} strokeWidth={2} type="monotone" />
              <Line name="Tendencia Bopreales" data={trendlineBopreal} dataKey="trend" stroke="#4C68E9" dot={false} strokeWidth={2} type="monotone" />
            </>
          ) : (
            <Line name="Tendencia" data={trendlineGeneral} dataKey="trend" stroke="#1036E2" dot={false} strokeWidth={2} strokeDasharray="5 5" type="monotone" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}