'use client';

import { 
  ResponsiveContainer, 
  ComposedChart,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Scatter,
  Line,
  LabelList,
  Cell
} from 'recharts';
import { linearRegression } from 'simple-statistics';

// Asocia cada segmento con un color del manual de VetaCap.
const PALETA_SEGMENTOS: { [key: string]: string } = {
  'LECAP': '#1036E2', // Azul Impulso
  'BONCAP': '#1036E2',
  'BONTE': '#1036E2',
  'DUAL TAMAR': '#1036E2',
  'CER': '#00C600', // Verde Activo
  'ON CER': '#00C600',
  'DL': '#4C68E9', // Azul secundario
  'ON DL': '#4C68E9',
  'ON HD': '#4C68E9',
  'TAMAR': '#283A6B', // Azul Respaldo
  'ON TAMAR': '#283A6B',
  'BONAR': '#808080', // Gris
  'GLOBAL': '#808080',
  'ON': '#021751', // Azul oscuro
  'default': '#8884d8'
};

// --- CORRECCIÓN APLICADA AQUÍ ---
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data.ticker) return null;
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid #ccc',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{`Ticker: ${data.ticker}`}</p>
        <p style={{ margin: 0, color: '#666' }}>{`TIR: ${(data.tir * 100).toFixed(2)}%`}</p>
        <p style={{ margin: 0, color: '#666' }}>{`Días al Vto: ${data.dias_vto}`}</p>
      </div>
    );
  }
  
  // Añade esta línea para que la función siempre devuelva algo
  return null;
};

export default function CurvaRendimientoChart({ data }: { data: any[] }) {
  let trendlineData: any[] = [];
  if (data.length > 1) {
    const regressionPoints = data
      .filter(p => p.dias_vto > 0 && typeof p.tir === 'number')
      .map(p => [Math.log(p.dias_vto), p.tir]);

    if (regressionPoints.length > 1) {
      const { m, b } = linearRegression(regressionPoints);
      const uniqueXPoints = [...new Set(data.map(p => p.dias_vto).filter(d => d > 0))].sort((a,b) => a - b);
      
      trendlineData = uniqueXPoints.map(x => ({
        dias_vto: x,
        trend: m * Math.log(x) + b
      }));
    }
  }

  return (
    <div style={{ width: '100%', height: 450, userSelect: 'none' }}>
      <ResponsiveContainer>
        <ComposedChart
          margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="dias_vto" 
            name="Días al Vencimiento" 
            tick={{ fontSize: 12 }}
            domain={['dataMin', 'dataMax']}
          />
          <YAxis 
            type="number" 
            dataKey="tir" 
            name="TIR" 
            tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`}
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data}>
            <LabelList dataKey="ticker" position="top" style={{ fontSize: 10, fill: '#666' }} />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PALETA_SEGMENTOS[entry.segmento] || PALETA_SEGMENTOS.default} />
            ))}
          </Scatter>
          <Line 
            data={trendlineData} 
            dataKey="trend" 
            stroke="#ff7300" 
            dot={false} 
            strokeWidth={2}
            strokeDasharray="5 5"
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}