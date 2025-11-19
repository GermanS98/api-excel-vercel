'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format, differenceInDays, startOfDay, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter
} from 'recharts';

// ==================================================================
// 1. TIPOS
// ==================================================================
type MarketDataItem = {
  ticker: string;
  last: number;
  timestamp: number;
  expirationDate?: Date; 
};

type FuturoCalculado = MarketDataItem & {
  diasVto: number;
  tnaImplicita: number | null;
  teaImplicita: number | null;
  tasaForward: number | null;
};

type BandaRow = {
  fc: string; 
  bi: number; 
  bs: number; 
};

type ChartDataPoint = {
  date: string;      
  dateObj: Date;     
  bi: number;
  bs: number;
  precioFuturo: number | null; 
  ticker?: string;   
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// ==================================================================
// 2. AUXILIARES
// ==================================================================
const formatPrice = (value: number) => {
  if (value === null || typeof value === 'undefined') return '-';
  return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPercent = (value: number | null) => {
  if (value === null || !isFinite(value)) return '-';
  return (value * 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
};

const formatTimestamp = (ts: number) => {
  if (!ts) return '-';
  try { return format(new Date(ts), 'HH:mm:ss'); } catch (e) { return '-'; }
};

const getExpirationDate = (ticker: string): Date | undefined => {
  try {
    if (ticker.includes('SPOT')) return undefined;
    const parts = ticker.split('/');
    const mesCode = parts.find(p => /^[A-Z]{3}\d{2}$/.test(p));
    if (!mesCode) return undefined;

    const meses: { [key: string]: number } = {
      ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5,
      JUL: 6, AGO: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11
    };

    const mesStr = mesCode.substring(0, 3);
    const anioStr = mesCode.substring(3);
    const mes = meses[mesStr];
    const anio = 2000 + parseInt(anioStr);

    if (mes === undefined || isNaN(anio)) return undefined;
    return endOfMonth(new Date(anio, mes, 1));
  } catch (e) {
    return undefined;
  }
};

// ==================================================================
// 3. COMPONENTE DE GRÁFICO (Con altura forzada)
// ==================================================================
const ChartBandas = ({ data }: { data: ChartDataPoint[] }) => {
  return (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '1rem', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#374151', textAlign: 'center' }}>
        Proyección de Bandas vs. Futuros
      </h3>
      {/* Altura forzada de 400px */}
      <div style={{ width: '100%', height: '400px', minHeight: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(val) => { try { return format(parseISO(val), 'MMM yy', { locale: es }) } catch(e) { return val } }}
              minTickGap={30}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              width={80}
              tickFormatter={(val) => `$${Math.round(val)}`}
            />
            <Tooltip 
              labelFormatter={(label) => { try { return format(parseISO(label as string), 'dd/MM/yyyy') } catch(e) { return label } }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              formatter={(value: any, name: string) => [value.toLocaleString('es-AR'), name === 'precioFuturo' ? 'Futuro' : name]}
            />
            <Legend verticalAlign="top" height={36}/>
            <Line type="monotone" dataKey="bs" stroke="#93c5fd" strokeWidth={2} dot={false} name="Banda Sup." />
            <Line type="monotone" dataKey="bi" stroke="#93c5fd" strokeWidth={2} dot={false} name="Banda Inf." />
            <Scatter name="Precio Futuro" dataKey="precioFuturo" fill="#ef4444" shape="circle" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==================================================================
// 4. COMPONENTE DE TABLA
// ==================================================================
const TablaFuturos = ({ titulo, datos, spotPrice }: { titulo: string, datos: FuturoCalculado[], spotPrice: number | undefined }) => (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#1f2937' }}>{titulo}</h2>
            {spotPrice && (
                <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600, background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                    Spot: ${formatPrice(spotPrice)}
                </span>
            )}
        </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>Precio</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>Días</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, background: '#03206b' }}>TNA</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, background: '#042b8a' }}>TEA</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>T. Fwd</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>Hora</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((item) => (
                <tr key={item.ticker} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 500, color: '#374151' }}>{item.ticker}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#111827' }}>{formatPrice(item.last)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: '#6b7280' }}>{item.diasVto > 0 ? item.diasVto : '-'}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 600, color: (item.tnaImplicita || 0) > 0 ? '#059669' : '#ef4444', background: '#f9fafb' }}>{formatPercent(item.tnaImplicita)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', fontWeight: 600, color: (item.teaImplicita || 0) > 0 ? '#059669' : '#ef4444', background: '#f0fdfa' }}>{formatPercent(item.teaImplicita)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: '#4b5563', fontSize: '0.85rem' }}>{formatPercent(item.tasaForward)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>{formatTimestamp(item.timestamp)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Esperando datos...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
);

const TablaSimple = ({ titulo, datos }: { titulo: string, datos: MarketDataItem[] }) => (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>{titulo}</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Precio</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((item) => (
                <tr key={item.ticker} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500, color: '#4b5563' }}>{item.ticker}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#111827', fontWeight: 'bold' }}>{formatPrice(item.last)}</td>
                </tr>
            ))}
            {datos.length === 0 && <tr><td colSpan={2} style={{textAlign:'center', padding: '1rem', color: '#9ca3af'}}>Sin datos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
);

// ==================================================================
// 5. PÁGINA PRINCIPAL
// ==================================================================
export default function DolarFuturoPage() {
    const [marketData, setMarketData] = useState<{ [key: string]: MarketDataItem }>({});
    const [bandas, setBandas] = useState<BandaRow[]>([]);
    const [estado, setEstado] = useState('Iniciando...');
    const [errorBandas, setErrorBandas] = useState<string | null>(null);
    const TABLE_NAME = 'dlfx2';

    // 1. Cargar FUTUROS
    useEffect(() => {
        const fetchData = async () => {
            setEstado('Obteniendo futuros...');
            const { data, error } = await supabase.from(TABLE_NAME).select('t, l, ts');
            if (error) { setEstado('Error Supabase Futuros'); return; }

            if (data) {
                const initialMap: { [key: string]: MarketDataItem } = {};
                data.forEach((row: any) => {
                   initialMap[row.t] = {
                     ticker: row.t,
                     last: row.l,
                     timestamp: row.ts,
                     expirationDate: getExpirationDate(row.t)
                   };
                });
                setMarketData(initialMap);
                setEstado('Datos cargados');
            }

            const channel = supabase.channel(`realtime-${TABLE_NAME}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, (payload) => {
                        const newRow = payload.new as any;
                        if (newRow && newRow.t) {
                            setMarketData(prev => ({ ...prev, [newRow.t]: { ticker: newRow.t, last: newRow.l, timestamp: newRow.ts, expirationDate: getExpirationDate(newRow.t) }}));
                        }
                    }
                ).subscribe();
            return () => { supabase.removeChannel(channel); };
        };
        fetchData();
    }, []);

    // 2. Cargar BANDAS (Con debug)
    useEffect(() => {
      const fetchBandas = async () => {
        // Ponemos una fecha muy antigua para asegurar que traiga algo si hay datos
        const fechaInicio = '2024-01-01'; 
        
        const { data, error } = await supabase
          .from('bandas')
          .select('*')
          .gte('fc', fechaInicio) 
          .order('fc', { ascending: true });
        
        if (error) {
          console.error("Error Bandas:", error);
          setErrorBandas(error.message);
        } else if (data && data.length > 0) {
          setBandas(data as BandaRow[]);
        } else {
          setErrorBandas('Consulta exitosa pero array vacío (0 filas)');
        }
      };
      fetchBandas();
    }, []);

    // 3. Cálculos
    const { dlrCalculados, dlrComplejos, oroData, ypfGgalData, al30Data, rfx20Data, precioSpot, chartData } = useMemo(() => {
        const allData = Object.values(marketData);
        const hoy = startOfDay(new Date());
        const spotItem = allData.find(d => d.ticker === 'DLR/SPOT');
        const spotPrice = spotItem?.last;

        const sortByDate = (a: MarketDataItem, b: MarketDataItem) => {
            if (a.expirationDate && b.expirationDate) return a.expirationDate.getTime() - b.expirationDate.getTime();
            return a.ticker.localeCompare(b.ticker);
        };

        const rawFuturos = allData
            .filter(d => d.ticker.startsWith('DLR/') && !d.ticker.includes('SPOT') && (d.ticker.match(/\//g) || []).length <= 1)
            .sort(sortByDate);

        const calculados: FuturoCalculado[] = [];
        rawFuturos.forEach((item, index) => {
            let dias = 0;
            if (item.expirationDate) dias = differenceInDays(item.expirationDate, hoy);
            
            let tna: number | null = null;
            let tea: number | null = null;
            if (spotPrice && item.last && dias > 0) {
                tna = ((item.last / spotPrice) - 1) * (365 / dias);
                const ratio = item.last / spotPrice;
                tea = Math.pow(ratio, 365 / dias) - 1;
            }

            let fwd: number | null = null;
            if (index > 0) {
                const prevItem = calculados[index - 1]; 
                const deltaDias = dias - prevItem.diasVto;
                if (prevItem.last && item.last && deltaDias > 0) {
                    fwd = ((item.last / prevItem.last) - 1) * (365 / deltaDias);
                }
            } else {
                fwd = tna;
            }
            calculados.push({ ...item, diasVto: dias > 0 ? dias : 0, tnaImplicita: tna, teaImplicita: tea, tasaForward: fwd });
        });

        // Chart Data Logic
        let dataForChart: ChartDataPoint[] = [];
        if (bandas.length > 0) {
          const futurosMap = new Map<string, { price: number, ticker: string }>();
          calculados.forEach(f => {
            if (f.expirationDate) {
              const fechaStr = format(f.expirationDate, 'yyyy-MM-dd');
              futurosMap.set(fechaStr, { price: f.last, ticker: f.ticker });
            }
          });
          dataForChart = bandas.map(banda => {
            const futuroEnFecha = futurosMap.get(banda.fc);
            return {
              date: banda.fc,
              dateObj: parseISO(banda.fc),
              bi: banda.bi,
              bs: banda.bs,
              precioFuturo: futuroEnFecha ? futuroEnFecha.price : null,
              ticker: futuroEnFecha ? futuroEnFecha.ticker : undefined
            };
          });
        }

        const dlrComplejos = allData.filter(d => d.ticker.startsWith('DLR/') && (d.ticker.match(/\//g) || []).length >= 2).sort(sortByDate);
        const oroData = allData.filter(d => d.ticker.includes('ORO')).sort((a,b) => a.ticker.localeCompare(b.ticker));
        const ypfGgalData = allData.filter(d => d.ticker.includes('YPF') || d.ticker.includes('GGAL')).sort((a,b) => a.ticker.localeCompare(b.ticker));
        const al30Data = allData.filter(d => d.ticker.includes('AL30')).sort((a,b) => a.ticker.localeCompare(b.ticker));
        const rfx20Data = allData.filter(d => d.ticker.toLowerCase().includes('rfx20')).sort(sortByDate);

        return { dlrCalculados, dlrComplejos, oroData, ypfGgalData, al30Data, rfx20Data, precioSpot: spotPrice, chartData: dataForChart };
    }, [marketData, bandas]);

    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto', padding: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', color: '#111827' }}>Monitor de Futuros</h1>
                
                {/* --- DEBUG AREA (Cuadro Azul) --- */}
                {bandas.length === 0 && (
                  <div style={{ background: '#eff6ff', border: '1px solid #1d4ed8', color: '#1e3a8a', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <strong>Diagnóstico de Bandas:</strong> <br/>
                    Status: {errorBandas || 'Cargando...'} <br/>
                    Filas cargadas: {bandas.length} <br/>
                    Si ves "Consulta exitosa pero array vacío", significa que Supabase responde bien pero la tabla 'bandas' no tiene datos posteriores a 2024-01-01 o el RLS está bloqueando la lectura.
                  </div>
                )}

                {/* GRÁFICO */}
                {chartData.length > 0 ? (
                   <ChartBandas data={chartData} />
                ) : null}

                {/* GRILLA */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', alignItems: 'start' }}>
                    <div style={{ gridColumn: '1 / -1' }}> 
                        <TablaFuturos titulo="Curva Dólar Futuro (Rofex)" datos={dlrCalculados} spotPrice={precioSpot} />
                    </div>
                    <TablaSimple titulo="Dólar (Spreads)" datos={dlrComplejos} />
                    <TablaSimple titulo="Índice RFX20" datos={rfx20Data} />
                    <TablaSimple titulo="Bonos (AL30)" datos={al30Data} />
                    <TablaSimple titulo="Acciones (YPF/GGAL)" datos={ypfGgalData} />
                    <TablaSimple titulo="Metales (ORO)" datos={oroData} />
                </div>
            </div>
        </Layout>
    );
}