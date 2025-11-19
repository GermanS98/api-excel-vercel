'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format, differenceInDays, startOfDay, endOfMonth, isSameDay, parseISO } from 'date-fns';
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
// 1. DEFINICIÓN DE TIPOS
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

// Nuevo tipo para la tabla de Bandas
type BandaRow = {
  fc: string; // Fecha cierre (YYYY-MM-DD)
  bi: number; // Banda inferior
  bs: number; // Banda superior
};

// Tipo para el gráfico (fusión de bandas + futuro)
type ChartDataPoint = {
  date: string;      // Para el eje X
  dateObj: Date;     // Para ordenamiento
  bi: number;
  bs: number;
  precioFuturo: number | null; // Será null si no hay vto ese día
  ticker?: string;   // Para el tooltip
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// ==================================================================
// 2. FUNCIONES AUXILIARES
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
// 3. COMPONENTE DE GRÁFICO (ESTILO FINO Y LIMPIO)
// ==================================================================
const ChartBandas = ({ data }: { data: ChartDataPoint[] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '1rem', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#374151', textAlign: 'center' }}>
        Proyección de Bandas vs. Futuros
      </h3>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            
            {/* Ejes */}
            <XAxis 
              dataKey="date" 
              tickFormatter={(val) => format(parseISO(val), 'MMM yy', { locale: es })}
              minTickGap={30}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(val) => `$${val}`}
            />

            {/* Tooltip Limpio */}
            <Tooltip 
              // 1. Fecha solo en el encabezado
              labelFormatter={(label) => format(parseISO(label as string), 'dd MMMM yyyy', { locale: es })}
              
              // 2. Estilo de la caja
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', fontSize: '0.9rem' }}
              
              // 3. Ordenar: Primero Bandas, luego Futuro
              itemSorter={(item) => {
                if (item.name === 'Banda Superior') return -1;
                if (item.name === 'Banda Inferior') return 0;
                return 1;
              }}

              // 4. Formato estricto y limpieza de datos
              formatter={(value: any, name: string, props: any) => {
                 // Si por alguna razón entra 'date', lo ignoramos, pero Recharts no debería pasarlo aquí.
                 if (name === 'precioFuturo' && props.payload.ticker) {
                    return [`$${value}`, `Futuro (${props.payload.ticker})`];
                 }
                 if (name === 'bi') return [`$${value}`, 'Banda Inferior'];
                 if (name === 'bs') return [`$${value}`, 'Banda Superior'];
                 return [value, name];
              }}
            />
            
            {/* Hemos quitado <Legend /> aquí */}

            {/* Líneas de Bandas: Finas (width 1) y Punteadas (dasharray 4 4) */}
            <Line 
                type="monotone" 
                dataKey="bs" 
                stroke="#021751" 
                strokeWidth={1} 
                strokeDasharray="4 4" 
                dot={false} 
                name="Banda Superior" 
                activeDot={false} 
            />
            <Line 
                type="monotone" 
                dataKey="bi" 
                stroke="#021751" 
                strokeWidth={1} 
                strokeDasharray="4 4" 
                dot={false} 
                name="Banda Inferior" 
                activeDot={false} 
            />
            
            {/* Futuros: Usamos Line con stroke="none" para controlar mejor el tamaño del punto (r:3) */}
            <Line
                type="monotone"
                dataKey="precioFuturo"
                stroke="none"
                name="Precio Futuro"
                dot={{ r: 3, fill: '#1036E2', strokeWidth: 0 }} // Punto fino y sólido
                activeDot={{ r: 5, fill: '#1036E2' }} // Un poco más grande al pasar el mouse
                connectNulls={false} // No unir los puntos con líneas invisibles
            />

          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ==================================================================
// 4. COMPONENTES DE TABLA (Sin cambios, solo renderizado)
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
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, background: '#03206b' }}>TNA Impl.</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, background: '#042b8a' }}>TEA Impl.</th>
              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600 }}>T. Fwd (Mes)</th>
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
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Hora</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((item) => (
                <tr key={item.ticker} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 500, color: '#4b5563' }}>{item.ticker}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#111827', fontWeight: 'bold' }}>{formatPrice(item.last)}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#6b7280' }}>{formatTimestamp(item.timestamp)}</td>
                </tr>
            ))}
            {datos.length === 0 && <tr><td colSpan={3} style={{textAlign:'center', padding: '1rem', color: '#9ca3af'}}>Sin datos</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
);

// ==================================================================
// 5. COMPONENTE PRINCIPAL
// ==================================================================
export default function DolarFuturoPage() {
    const [marketData, setMarketData] = useState<{ [key: string]: MarketDataItem }>({});
    const [bandas, setBandas] = useState<BandaRow[]>([]); // Estado para las bandas
    const [rawBandas, setRawBandas] = useState<any[]>([]);
    const [estado, setEstado] = useState('Conectando...');
    const TABLE_NAME = 'dlrfx2';

    // Fetch de datos de mercado (Futuros)
    useEffect(() => {
        const fetchData = async () => {
            setEstado('Obteniendo precios...');
            const { data, error } = await supabase.from(TABLE_NAME).select('t, l, ts');
            if (error) { setEstado('Error conexión'); return; }

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
                setEstado('Mercado en vivo');
            }

            const channel = supabase.channel(`realtime-${TABLE_NAME}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME }, (payload) => {
                        const newRow = payload.new as any;
                        if (newRow && newRow.t) {
                            setMarketData(prev => ({
                                ...prev,
                                [newRow.t]: {
                                    ticker: newRow.t,
                                    last: newRow.l,
                                    timestamp: newRow.ts,
                                    expirationDate: getExpirationDate(newRow.t)
                                }
                            }));
                        }
                    }
                ).subscribe();
            return () => { supabase.removeChannel(channel); };
        };
        fetchData();
    }, []);

    // Fetch de BANDAS (Solo una vez al cargar)
    useEffect(() => {
      const fetchBandas = async () => {
        const hoy = new Date().toISOString().split('T')[0];
        // Traemos las bandas desde hoy en adelante
        const { data, error } = await supabase
          .from('bandas')
          .select('*')
          .gte('fc', hoy)
          .order('fc', { ascending: true });
        
        if (error) {
          console.error('Error cargando bandas:', error);
        } else if (data) {
          console.log('bandas raw', data);
          setRawBandas(data as any[]);
          // Normalizar nombres posibles de columnas y forzar números
          const normalized: BandaRow[] = (data as any[]).map(d => {
            const fc = String(d.fc || d.fecha || d.fecha_cierre || d.date);
            const biRaw = d.bi ?? d.b_inf ?? d.b_inferior ?? d.banda_inferior ?? d.bandaInf ?? d.banda_inferior_val;
            const bsRaw = d.bs ?? d.b_sup ?? d.b_superior ?? d.banda_superior ?? d.bandaSup ?? d.banda_superior_val;
            const bi = biRaw !== undefined && biRaw !== null ? Number(biRaw) : NaN;
            const bs = bsRaw !== undefined && bsRaw !== null ? Number(bsRaw) : NaN;
            return { fc, bi, bs } as BandaRow;
          });
          setBandas(normalized);
        }
      };
      fetchBandas();
    }, []);

    // ==================================================================
    // LÓGICA DE CÁLCULO Y PREPARACIÓN DEL CHART
    // ==================================================================
    const { 
      dlrCalculados, 
      dlrComplejos, 
      oroData, 
      ypfGgalData, 
      al30Data, 
      rfx20Data, 
      precioSpot,
      chartData // Datos combinados para el gráfico
    } = useMemo(() => {
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
            if (item.expirationDate) {
                dias = differenceInDays(item.expirationDate, hoy);
            }
            
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
                const prevPrice = prevItem.last;
                const prevDays = prevItem.diasVto;
                const deltaDias = dias - prevDays;

                if (prevPrice && item.last && deltaDias > 0) {
                    fwd = ((item.last / prevPrice) - 1) * (365 / deltaDias);
                }
            } else {
                fwd = tna;
            }

            calculados.push({
                ...item,
                diasVto: dias > 0 ? dias : 0,
                tnaImplicita: tna,
                teaImplicita: tea,
                tasaForward: fwd
            });
        });

        // --- PREPARACIÓN DATOS DEL CHART ---
        // Intentamos priorizar las `bandas` (si existen). Si no hay bandas, construimos
        // puntos de gráfico a partir de los futuros calculados para que el chart siempre muestre datos.
        let dataForChart: ChartDataPoint[] = [];

        // Mapeamos los futuros a un diccionario por fecha string YYYY-MM-DD para búsqueda rápida
        const futurosMap = new Map<string, { price: number, ticker: string }>();
        calculados.forEach(f => {
          if (f.expirationDate) {
            const fechaStr = format(f.expirationDate, 'yyyy-MM-dd');
            futurosMap.set(fechaStr, { price: f.last, ticker: f.ticker });
          }
        });

        // Usamos exclusivamente las bandas que vienen de la base de datos.
        // Para cada fila de `bandas` intentamos adjuntar el precio del futuro
        // que venza en la misma fecha (si existe). No generamos bandas a partir
        // de los futuros en ningún caso.
        if (bandas.length > 0) {
          dataForChart = bandas.map(bandasItem => {
            const futuroEnFecha = futurosMap.get(bandasItem.fc);
            return {
              date: bandasItem.fc,
              dateObj: parseISO(bandasItem.fc),
              bi: bandasItem.bi,
              bs: bandasItem.bs,
              precioFuturo: futuroEnFecha ? futuroEnFecha.price : null,
              ticker: futuroEnFecha ? futuroEnFecha.ticker : undefined
            };
          });
        } else {
          dataForChart = [];
        }

        const dlrComplejos = allData.filter(d => d.ticker.startsWith('DLR/') && (d.ticker.match(/\//g) || []).length >= 2).sort(sortByDate);
        const oroData = allData.filter(d => d.ticker.includes('ORO')).sort((a,b) => a.ticker.localeCompare(b.ticker));
        const ypfGgalData = allData.filter(d => d.ticker.includes('YPF') || d.ticker.includes('GGAL')).sort((a,b) => a.ticker.localeCompare(b.ticker));
        const al30Data = allData.filter(d => d.ticker.includes('AL30')).sort((a,b) => a.ticker.localeCompare(b.ticker));
        const rfx20Data = allData.filter(d => d.ticker.toLowerCase().includes('rfx20')).sort(sortByDate);

        return { 
          dlrCalculados: calculados, 
          dlrComplejos, 
          oroData, 
          ypfGgalData, 
          al30Data, 
          rfx20Data, 
          precioSpot: spotPrice,
          chartData: dataForChart
        };
    }, [marketData, bandas]);

    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto', padding: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', color: '#111827' }}>Monitor de Futuros</h1>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                     <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {estado}
                     </span>
                </div>

                {/* AQUÍ INICIA EL GRÁFICO DE BANDAS */}
                {chartData.length > 0 && (
                   <>
                     <ChartBandas data={chartData} />
                     <div style={{ background: '#fff', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', border: '1px dashed #e5e7eb' }}>
                       <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
                         <strong>Depuración:</strong> bandas: <strong>{bandas.length}</strong>, futuros: <strong>{dlrCalculados.length}</strong>, puntos en chart: <strong>{chartData.length}</strong>
                       </div>
                       <div style={{ maxHeight: '180px', overflow: 'auto', background: '#f8fafc', padding: '8px', borderRadius: '6px' }}>
                         <pre style={{ margin: 0, fontSize: '0.75rem', color: '#111827' }}>
{JSON.stringify({ bandas: bandas.slice(0,6), primerosFuturos: dlrCalculados.slice(0,6).map(f=>({ticker:f.ticker,last:f.last,expirationDate: f.expirationDate ? f.expirationDate.toISOString().split('T')[0] : null})), chartData: chartData.slice(0,6) }, null, 2)}
                         </pre>
                       </div>
                     </div>
                   </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', alignItems: 'start' }}>
                    
                    {/* TABLA PRINCIPAL */}
                    <div style={{ gridColumn: '1 / -1' }}> 
                        <TablaFuturos 
                            titulo="Curva Dólar Futuro (Rofex)" 
                            datos={dlrCalculados} 
                            spotPrice={precioSpot}
                        />
                    </div>

                    {/* TABLAS SECUNDARIAS */}
                    <TablaSimple titulo="Dólar (Spreads/Pases)" datos={dlrComplejos} />
                    <TablaSimple titulo="Índice RFX20" datos={rfx20Data} />
                    <TablaSimple titulo="Bonos (AL30)" datos={al30Data} />
                    <TablaSimple titulo="Acciones (YPF / GGAL)" datos={ypfGgalData} />
                    <TablaSimple titulo="Metales (ORO)" datos={oroData} />
                </div>
            </div>
        </Layout>
    );
}