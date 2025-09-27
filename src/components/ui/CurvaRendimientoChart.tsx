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
  LabelList
} from 'recharts';
import { linearRegression } from 'simple-statistics';

// El componente CustomTooltip se mantiene igual
const CustomTooltip = ({ active, payload }: any) => { /* ...código sin cambios... */ };

export default function CurvaRendimientoChart({ data }: { data: any[] }) {
  // El cálculo de la línea de tendencia se mantiene igual
  let trendlineData: any[] = [];
  if (data.length > 1) { /* ...código sin cambios... */ }

  return (
    <div style={{ width: '100%', height: 450, userSelect: 'none' }}>
      <ResponsiveContainer>
        <ComposedChart
          // CAMBIO: Se reduce el margen izquierdo para mejor ajuste en móviles
          margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
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
            width={70} // Se ajusta el ancho para compensar el margen
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} fill="#3b82f6">
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
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}