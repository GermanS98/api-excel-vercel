'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================================================================
// 1. DEFINICIÓN DE TIPOS
// ==================================================================

// Lo que viene de la DB (dlfx2)
type DbRow = {
  t: string;       // Ticker
  l: number;       // Last price
  ts: number;      // Timestamp
};

// Lo que usaremos en el front
type MarketDataItem = {
  ticker: string;
  last: number;
  timestamp: number;
  expirationDate?: Date; // Para ordenar cronológicamente
};

// ==================================================================
// 2. CONFIGURACIÓN DE SUPABASE
// ==================================================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// ==================================================================
// 3. FUNCIONES AUXILIARES
// ==================================================================

const formatPrice = (value: number) => {
  if (value === null || typeof value === 'undefined') return '-';
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatTimestamp = (ts: number) => {
  if (!ts) return '-';
  try {
    return format(new Date(ts), 'HH:mm:ss');
  } catch (e) {
    return '-';
  }
};

// Extrae fecha para ordenar (ej: DIC25 -> Date object)
const getExpirationDate = (ticker: string): Date | undefined => {
  try {
    const parts = ticker.split('/');
    const mesCode = parts.find(p => /^[A-Z]{3}\d{2}$/.test(p)); // Busca pattern AAA99
    
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
    return new Date(anio, mes, 1);
  } catch (e) {
    return undefined;
  }
};

// ==================================================================
// 4. COMPONENTE DE TABLA (Estilo idéntico a TablaGeneral)
// ==================================================================
const TablaMarketData = ({ titulo, datos }: { titulo: string, datos: MarketDataItem[] }) => (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
          {titulo}
        </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Precio</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Hora</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((item) => (
                <tr key={item.ticker} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563' }}>{item.ticker}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'right', fontWeight: 'bold' }}>
                    {formatPrice(item.last)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#6b7280', textAlign: 'right' }}>
                    {formatTimestamp(item.timestamp)}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Sin datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
);

// ==================================================================
// 5. COMPONENTE PRINCIPAL
// ==================================================================
export default function DolarFuturoPage() {
    // Estado tipo Map para actualizaciones rápidas
    const [marketData, setMarketData] = useState<{ [key: string]: MarketDataItem }>({});
    const [estado, setEstado] = useState('Cargando...');
    
    const TABLE_NAME = 'dlfx2';

    useEffect(() => {
        const fetchData = async () => {
            setEstado('Conectando al mercado...');
            
            // 1. Carga inicial completa
            const { data, error } = await supabase
                .from('dlrfx2')
                .select('t, l, ts');

            if (error) {
                console.error('Error fetching:', error);
                setEstado('Error de conexión');
                return;
            }

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
                setEstado('Mercado en tiempo real');
            }

            // 2. Suscripción Realtime
            const channel = supabase
                .channel(`realtime-${TABLE_NAME}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: TABLE_NAME },
                    (payload) => {
                        const newRow = payload.new as DbRow;
                        if (newRow && newRow.t) {
                            setMarketData(prev => ({
                                ...prev,
                                [newRow.t]: {
                                    ticker: newRow.t,
                                    last: newRow.l,
                                    timestamp: newRow.ts,
                                    expirationDate: getExpirationDate(newRow.t) // Recalcular fecha si es un nuevo ticker
                                }
                            }));
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        fetchData();
    }, []);

    // ==================================================================
    // LÓGICA DE CLASIFICACIÓN
    // ==================================================================
    const { dlrSimples, dlrComplejos, oroData, ypfGgalData, al30Data, rfx20Data } = useMemo(() => {
        const allData = Object.values(marketData);

        // Helper para ordenar por fecha (si existe) o alfabéticamente
        const sortByDate = (a: MarketDataItem, b: MarketDataItem) => {
            if (a.expirationDate && b.expirationDate) {
                return a.expirationDate.getTime() - b.expirationDate.getTime();
            }
            // Priorizar SPOT al principio
            if (a.ticker.includes('SPOT')) return -1;
            if (b.ticker.includes('SPOT')) return 1;
            return a.ticker.localeCompare(b.ticker);
        };

        // 1. DLR Outright (máximo 1 barra '/')
        const dlrSimples = allData
            .filter(d => d.ticker.startsWith('DLR/') && (d.ticker.match(/\//g) || []).length <= 1)
            .sort(sortByDate);

        // 2. DLR Spreads/Pases (2 o más barras '/')
        const dlrComplejos = allData
            .filter(d => d.ticker.startsWith('DLR/') && (d.ticker.match(/\//g) || []).length >= 2)
            .sort(sortByDate);

        // 3. ORO
        const oroData = allData.filter(d => d.ticker.includes('ORO')).sort((a,b) => a.ticker.localeCompare(b.ticker));

        // 4. YPF y GGAL
        const ypfGgalData = allData
            .filter(d => d.ticker.includes('YPF') || d.ticker.includes('GGAL'))
            .sort((a,b) => a.ticker.localeCompare(b.ticker));

        // 5. AL30
        const al30Data = allData.filter(d => d.ticker.includes('AL30')).sort((a,b) => a.ticker.localeCompare(b.ticker));

        // 6. RFX20
        const rfx20Data = allData.filter(d => d.ticker.toLowerCase().includes('rfx20')).sort(sortByDate);

        return { dlrSimples, dlrComplejos, oroData, ypfGgalData, al30Data, rfx20Data };
    }, [marketData]);

    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto', padding: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Monitor de Futuros</h1>
                
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    <span>Estado: <strong>{estado}</strong></span>
                </div>

                {/* GRILLA DE TABLAS */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                    gap: '20px',
                    alignItems: 'start' 
                }}>
                    {/* Grupo 1: Dólar */}
                    <TablaMarketData titulo="Dólar Futuro" datos={dlrSimples} />
                    <TablaMarketData titulo="Dólar (Spreads/Pases)" datos={dlrComplejos} />
                    
                    {/* Grupo 2: Índice y Bonos */}
                    <TablaMarketData titulo="Índice RFX20" datos={rfx20Data} />
                    <TablaMarketData titulo="Bonos (AL30)" datos={al30Data} />
                    
                    {/* Grupo 3: Acciones y Metales */}
                    <TablaMarketData titulo="Acciones (YPF / GGAL)" datos={ypfGgalData} />
                    <TablaMarketData titulo="Metales (ORO)" datos={oroData} />
                </div>
            </div>
        </Layout>
    );
}