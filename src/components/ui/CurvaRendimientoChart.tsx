'use client';

import { 
  ResponsiveContainer, 
  ScatterChart, 
  XAxis, 
  YAxis, 
  ZAxis,
  Tooltip, 
  CartesianGrid, 
  Scatter 
} from 'recharts';

// Un Tooltip personalizado para mostrar la información al pasar el mouse
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`Ticker: ${data.ticker}`}</p>
        <p style={{ margin: 0 }}>{`TIR: ${(data.tir * 100).toFixed(2)}%`}</p>
        <p style={{ margin: 0 }}>{`Días al Vto: ${data.dias_vto}`}</p>
      </div>
    );
  }
  return null;
};

// El componente del gráfico recibe los datos como una propiedad (prop)
export default function CurvaRendimientoChart({ data }: { data: any[] }) {
  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid />
          <XAxis 
            type="number" 
            dataKey="dias_vto" 
            name="Días al Vencimiento" 
            unit=" días" 
          />
          <YAxis 
            type="number" 
            dataKey="tir" 
            name="TIR" 
            unit="%"
            domain={['auto', 'auto']}
            tickFormatter={(tick) => (tick * 100).toFixed(1)}
          />
          {/* Usamos ZAxis para pasar el nombre del ticker al tooltip sin mostrarlo en un eje */}
          <ZAxis type="category" dataKey="ticker" name="Ticker" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Scatter name="Bonos" data={data} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}