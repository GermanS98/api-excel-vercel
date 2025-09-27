'use client';

import { 
  ResponsiveContainer, 
  ComposedChart, // Cambiamos a ComposedChart
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Scatter,
  Line // Añadimos el componente Line
} from 'recharts';
import { linearRegression } from 'simple-statistics';

// El Tooltip personalizado se mantiene igual
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data.ticker) return null; // No mostrar tooltip para la línea de tendencia
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
  // --- Cálculo de la Línea de Tendencia Logarítmica ---
  let trendlineData: any[] = [];
  if (data.length > 1) {
    // 1. Preparamos los datos para una regresión lineal sobre el logaritmo de X
    const regressionPoints = data
      .filter(p => p.dias_vto > 0) // El logaritmo solo funciona para X > 0
      .map(p => [Math.log(p.dias_vto), p.tir]);

    if (regressionPoints.length > 1) {
      // 2. Calculamos la regresión lineal: y = m*x + b (donde x es log(dias_vto))
      const { m, b } = linearRegression(regressionPoints);

      // 3. Generamos los puntos para dibujar la línea en el gráfico
      const xDomain = data.map(p => p.dias_vto).filter(d => d > 0);
      const minX = Math.min(...xDomain);
      const maxX = Math.max(...xDomain);
      
      for (let i = 0; i < data.length; i++) {
        const x = data[i].dias_vto;
        if (x > 0) {
            const y = m * Math.log(x) + b;
            trendlineData.push({ dias_vto: x, trend: y, ticker: null });
        }
      }
      trendlineData.sort((a,b) => a.dias_vto - b.dias_vto)
    }
  }

  return (
    <div style={{ width: '100%', height: 450 }}>
      <ResponsiveContainer>
        <ComposedChart
          margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="dias_vto" 
            name="Días al Vencimiento" 
            unit=" días" 
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
          <Scatter data={data} fill="#8884d8" />
          {/* Añadimos la línea de tendencia al gráfico */}
          <Line 
            data={trendlineData} 
            dataKey="trend" 
            stroke="#ff7300" 
            dot={false} 
            strokeWidth={2}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}