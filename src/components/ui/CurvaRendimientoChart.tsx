'use client';

import {
  ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip,
  CartesianGrid, Scatter, Line, LabelList, Cell, Legend, ZAxis
} from 'recharts';
import { linearRegression } from 'simple-statistics';

const PALETA_SEGMENTOS: { [key: string]: string } = {
  'LECAP': '#1036E2', 'BONCAP': '#1036E2', 'BONTE': '#1036E2', 'DUAL TAMAR': '#1036E2',
  'CER': '#1036E2', 'ON CER': '#1036E2',
  'DL': '#1036E2', 'ON DL': '#1036E2', 'ON HD': '#1036E2',
  'TAMAR': '#1036E2', 'ON TAMAR': '#1036E2',
  'BONAR': '#1036E2',      // Color único para Bonares
  'GLOBAL': '#00C600',    // Color único para Globales
  'BOPREAL': '#021751',   // Color único para Bopreales
  'ON': '#1036E2',
  'default': '#1036E2'
};

const calcularTendencia = (datos: any[], xAxisKey: 'dv' | 'md', segmento?: string) => {
  const datosParaRegresion = segmento ? datos.filter(p => p.s === segmento) : datos;
  if (datosParaRegresion.length < 2) return [];

  const regressionPoints = datosParaRegresion
    .filter(p => p[xAxisKey] > 0 && typeof p.tir === 'number' && isFinite(p.tir))
    .map(p => [Math.log(p[xAxisKey]), p.tir]);

  if (regressionPoints.length < 2) return [];

  const { m, b } = linearRegression(regressionPoints);

  const uniqueXPoints = [...new Set(datosParaRegresion.map(p => p[xAxisKey]).filter(d => d > 0))].sort((a, b) => a - b);

  return uniqueXPoints.map(x => ({ [xAxisKey]: x, trend: m * Math.log(x) + b }));
};

type ChartProps = {
  data: any[];
  segmentoActivo: string;
  xAxisKey: 'dv' | 'md';
};

const CustomLabel = (props: any) => {
  const { x, y, index, value } = props;

  // Si el valor contiene '|', lo separamos en dos líneas
  if (typeof value === 'string' && value.includes('|')) {
    const [line1, line2] = value.split('|');
    const yOffset = index % 2 === 0 ? -12 : 22;
    return (
      <text x={x} y={y + yOffset} textAnchor="middle" fill="#555" fontSize={9}>
        <tspan x={x} dy={0}>{line1}</tspan>
        <tspan x={x} dy={10} fontWeight="bold">{line2}</tspan>
      </text>
    );
  }

  // Comportamiento original (una sola línea)
  const yOffset = index % 2 === 0 ? -8 : 18;
  return (
    <text x={x} y={y + yOffset} dy={0} textAnchor="middle" fill="#555" fontSize={9}>
      {value}
    </text>
  );
};

export default function CurvaRendimientoChart({ data, segmentoActivo, xAxisKey }: ChartProps) {
  const segmentosSoberanos = ['BONAR', 'GLOBAL', 'BOPREAL'];
  const esGrupoSoberano = segmentoActivo === 'Bonares y Globales';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (!data.t) return null;

      const xValueLabel = xAxisKey === 'md' ? 'Mod. Duration' : 'Días al Vto';
      const xValue = data[xAxisKey];
      const formattedXValue = typeof xValue === 'number'
        ? xValue.toFixed(xAxisKey === 'md' ? 2 : 0)
        : '-';

      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc',
          padding: '10px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{`Ticker: ${data.t.split('|')[0]}`}</p>
          <p style={{ margin: 0, color: '#666' }}>{`TIR: ${(data.tir * 100).toFixed(2)}%`}</p>
          <p style={{ margin: 0, color: '#666' }}>{`${xValueLabel}: ${formattedXValue}`}</p>
        </div>
      );
    }
    return null;
  };

  const trendlineBonar = esGrupoSoberano ? calcularTendencia(data, xAxisKey, 'BONAR') : [];
  const trendlineGlobal = esGrupoSoberano ? calcularTendencia(data, xAxisKey, 'GLOBAL') : [];
  const trendlineBopreal = esGrupoSoberano ? calcularTendencia(data, xAxisKey, 'BOPREAL') : [];
  const trendlineGeneral = !esGrupoSoberano ? calcularTendencia(data, xAxisKey) : [];

  return (
    <div style={{ width: '100%', height: 450, userSelect: 'none' }}>
      <ResponsiveContainer>
        <ComposedChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey={xAxisKey}
            name={xAxisKey === 'md' ? 'Modified Duration' : 'Días al Vencimiento'}
            tick={{ fontSize: 12 }}
            domain={['dataMin', 'dataMax']}
            allowDuplicatedCategory={false}
            tickFormatter={(tick) => tick.toFixed(xAxisKey === 'md' ? 2 : 0)}
          />
          <YAxis type="number" dataKey="tir" name="TIR" tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} domain={['auto', 'auto']} tick={{ fontSize: 12 }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ display: esGrupoSoberano ? 'block' : 'none' }} />
          <ZAxis type="number" range={[25, 25]} />

          {esGrupoSoberano ? (
            segmentosSoberanos.map(segmento => (
              <Scatter
                key={segmento}
                name={segmento} // <-- Con 'name', aparece en la leyenda
                data={data.filter(p => p.s === segmento)}
                fill={PALETA_SEGMENTOS[segmento]}
              >
                {/* CAMBIO 1.2: Usamos nuestro componente personalizado */}
                <LabelList dataKey="t" content={CustomLabel} />
              </Scatter>
            ))
          ) : (
            <Scatter data={data}>
              {/* CAMBIO 1.2: Usamos nuestro componente personalizado */}
              <LabelList dataKey="t" content={CustomLabel} />
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PALETA_SEGMENTOS[entry.s] || PALETA_SEGMENTOS.default} />
              ))}
            </Scatter>
          )}

          {esGrupoSoberano ? (
            <>
              <Line name="Tendencia Bonares" data={trendlineBonar} dataKey="trend" stroke={PALETA_SEGMENTOS['BONAR']} dot={false} strokeWidth={1} strokeDasharray="5 5" type="monotone" />
              <Line name="Tendencia Globales" data={trendlineGlobal} dataKey="trend" stroke={PALETA_SEGMENTOS['GLOBAL']} dot={false} strokeWidth={1} strokeDasharray="5 5" type="monotone" />
              <Line name="Tendencia Bopreales" data={trendlineBopreal} dataKey="trend" stroke={PALETA_SEGMENTOS['BOPREAL']} dot={false} strokeWidth={1} strokeDasharray="5 5" type="monotone" />
            </>
          ) : (
            // CAMBIO 2: Se quita 'name' para ocultarlo de la leyenda
            <Line data={trendlineGeneral} dataKey="trend" stroke="#1036E2" dot={false} strokeWidth={1} strokeDasharray="5 5" type="monotone" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}