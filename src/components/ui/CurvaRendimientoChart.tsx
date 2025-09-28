'use client';

import { 
  ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, 
  CartesianGrid, Scatter, Line, LabelList, Cell 
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

const CustomTooltip = ({ active, payload }: any) => { /* ...código sin cambios... */ };

export default function CurvaRendimientoChart({ data }: { data: any[] }) {
  let trendlineData: any[] = [];
  // El cálculo de la línea de tendencia se mantiene igual...
  if (data.length > 1) { /* ...código sin cambios... */ }

  return (
    <div style={{ width: '100%', height: 450, userSelect: 'none' }}>
      <ResponsiveContainer>
        <ComposedChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis /* ...código sin cambios... */ />
          <YAxis /* ...código sin cambios... */ />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data}>
            <LabelList dataKey="ticker" position="top" style={{ fontSize: 10, fill: '#666' }} />
            {/* CAMBIO: Asigna un color a cada punto según su segmento */}
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PALETA_SEGMENTOS[entry.segmento] || PALETA_SEGMENTOS.default} />
            ))}
          </Scatter>
          <Line data={trendlineData} dataKey="trend" stroke="#ff7300" dot={false} strokeWidth={2} strokeDasharray="5 5" type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}