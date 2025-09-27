'use client';

import { 
  ResponsiveContainer, 
  ScatterChart, 
  XAxis, 
  YAxis, 
  ZAxis,
  Tooltip, 
  CartesianGrid, 
  Scatter,
  Cell // Importamos Cell para poder cambiar colores
} from 'recharts';

// El Tooltip personalizado se mantiene igual
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
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

export default function CurvaRendimientoChart({ data, filtroTicker }: { data: any[], filtroTicker: string }) {
  return (
    <div style={{ width: '100%', height: 450 }}>
      <ResponsiveContainer>
        <ScatterChart
          margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="dias_vto" 
            name="Días al Vencimiento" 
            unit=" días" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            type="number" 
            dataKey="tir" 
            name="TIR" 
            tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`}
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
          />
          <ZAxis type="category" dataKey="ticker" name="Ticker" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Scatter name="Bonos" data={data}>
            {/* Lógica para colorear los puntos */}
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={
                  filtroTicker && entry.ticker.toUpperCase().includes(filtroTicker.toUpperCase()) 
                  ? '#ff7300' // Color resaltado si coincide con el filtro
                  : '#8884d8' // Color por defecto
                } 
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}