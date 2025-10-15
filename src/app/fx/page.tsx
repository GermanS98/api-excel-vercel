'use client';
import Layout from '@/components/layout/Layout'; // Asegúrate de que la ruta a tu Layout es correcta
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================================================================
// 1. DEFINICIÓN DE TIPOS PARA MARKET DATA
// ==================================================================
type MarketDataItem = {
  ticker: string;
  last: number | null;
  dateLA: number | null; // Lo mantenemos por si lo usas en el futuro
  timestamp: number;
};

// ==================================================================
// 2. CONFIGURACIÓN DE SUPABASE
// ==================================================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// ==================================================================
// 3. FUNCIONES AUXILIARES DE FORMATO
// ==================================================================
const formatValue = (value: number | null | undefined, unit: string = '', decimals: number = 2) => {
    if (value === null || typeof value === 'undefined' || !isFinite(value)) return '-';
    const numeroFormateado = value.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${numeroFormateado}${unit}`;
};

const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return format(date, 'HH:mm:ss', { locale: es });
};


// ==================================================================
// 4. COMPONENTE DE LA TABLA
// ==================================================================
const TablaMarketData = ({ titulo, datos }: { titulo: string, datos: MarketDataItem[] }) => (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
          {titulo}
        </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Último Precio</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Hora (Timestamp)</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((item: MarketDataItem) => (
                <tr key={item.ticker} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563' }}>{item.ticker}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.last)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatTimestamp(item.timestamp)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
);


// ==================================================================
// 5. COMPONENTE PRINCIPAL DE LA PÁGINA
// ==================================================================
export default function DolarFuturoPage() {
    const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
    const [estado, setEstado] = useState('Cargando...');
    const nombreColumnaJsonb = 'dlr';
    const nombreTabla = 'dlrfx';

    useEffect(() => {
        const fetchData = async () => {
          setEstado('Cargando datos de Dólar Futuro...');
          
          const { data, error } = await supabase
            .from(nombreTabla)
            .select(nombreColumnaJsonb)
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            setEstado(`Error al cargar datos: ${error.message}`);
          } 
          else if (data && data.length > 0) {
            const latestRow = data[0];
            const marketDataJson = latestRow[nombreColumnaJsonb];

            if (marketDataJson) {
                const datosComoArray = Object.values(marketDataJson) as MarketDataItem[];
                setMarketData(datosComoArray);
                setEstado('Datos cargados. Escuchando actualizaciones...');
            } else {
                 setEstado('La fila más reciente no contiene datos de mercado.');
            }
          } 
          else {
            setEstado('No se encontraron datos en la tabla. Esperando inserción...');
          }
        };

        fetchData();

        const channel = supabase
          .channel(`realtime-${nombreTabla}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: nombreTabla },
            (payload) => {
              console.log('Cambio en tiempo real recibido:', payload);
              const updatedData = payload.new[nombreColumnaJsonb];
              if (updatedData) {
                const datosComoArray = Object.values(updatedData) as MarketDataItem[];
                setMarketData(datosComoArray);
                setEstado('Datos actualizados en tiempo real.');
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
    }, []);
    
    const datosParaTabla = [...marketData].sort((a, b) => a.ticker.localeCompare(b.ticker));

    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto', padding: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Market Data - Futuros de Dólar</h1>
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    <span>Estado: <strong>{estado}</strong></span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    <TablaMarketData titulo="Precios en Tiempo Real" datos={datosParaTabla} />
                </div>
            </div>
        </Layout>
    );
}
