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
// Esta configuración es la misma, la librería la manejará eficientemente.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// ==================================================================
// 3. FUNCIONES AUXILIARES DE FORMATO
// ==================================================================
// Reutilizamos tu función para formatear precios
const formatValue = (value: number | null | undefined, unit: string = '', decimals: number = 2) => {
    if (value === null || typeof value === 'undefined' || !isFinite(value)) return '-';
    const numeroFormateado = value.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${numeroFormateado}${unit}`;
};

// Nueva función para formatear el timestamp a una hora legible
const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return '-';
  // El timestamp parece estar en milisegundos, lo convertimos a fecha
  const date = new Date(timestamp);
  return format(date, 'HH:mm:ss', { locale: es });
};


// ==================================================================
// 4. COMPONENTE DE LA TABLA (ADAPTADO)
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
    // Suponemos que tu columna JSONB se llama 'dlr' como en el ejemplo anterior
    const nombreColumnaJsonb = 'dlr';

    useEffect(() => {
        // --- Función para obtener y procesar los datos ---
        const fetchData = async () => {
          setEstado('Cargando datos de Dólar Futuro...');
          
          // Obtenemos la última fila insertada en la tabla 'dlrfx'
          const { data, error } = await supabase
            .from('dlrfx')
            .select(nombreColumnaJsonb) // Seleccionamos solo la columna con el JSON
            .order('created_at', { ascending: false }) // La más reciente primero
            .limit(1) // Solo queremos una
            .single(); // Nos aseguramos de que devuelva un objeto, no un array

          if (error) {
            setEstado(`Error al cargar datos: ${error.message}`);
          } else if (data && data[nombreColumnaJsonb]) {
            // La data viene como un objeto, la convertimos en un array para poder mapearla
            const datosComoArray = Object.values(data[nombreColumnaJsonb]) as MarketDataItem[];
            setMarketData(datosComoArray);
            setEstado('Datos cargados. Escuchando actualizaciones en tiempo real...');
          }
        };

        fetchData();

        // --- Suscripción a cambios en tiempo real ---
        const channel = supabase
          .channel('realtime-dolar-futuro')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'dlrfx' },
            (payload) => {
              console.log('Cambio recibido!', payload);
              const updatedData = payload.new[nombreColumnaJsonb];
              if (updatedData) {
                const datosComoArray = Object.values(updatedData) as MarketDataItem[];
                setMarketData(datosComoArray);
              }
            }
          )
          .subscribe();

        // --- Limpieza al desmontar el componente ---
        return () => {
          supabase.removeChannel(channel);
        };
    }, []);
    
    // Ordenamos los datos por ticker para una visualización consistente
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
