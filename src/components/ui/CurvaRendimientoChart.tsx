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
  Brush,
  LabelList // Importamos LabelList para las etiquetas fijas
} from 'recharts';
import { linearRegression } from 'simple-statistics';

// El Tooltip personalizado se mantiene igual
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
    <div style={{ width: '100%', height: 450 }}>
      <ResponsiveContainer>
        <ComposedChart
          margin={{ top: 20, right: 30, bottom: 40, left: 20 }} // Más margen inferior para Brush
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
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} fill="#3b82f6">
             {/* Añadimos la etiqueta fija del ticker a cada punto */}
            <LabelList 
              dataKey="ticker" 
              position="top" 
              style={{ fontSize: 10, fill: '#666' }} 
            />
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
          {/* El Brush necesita un dataKey y se posiciona con 'y' */}
          <Brush 
            dataKey="dias_vto" 
            height={30} 
            stroke="#8884d8"
            y={380} // Ajusta esta posición si es necesario
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}