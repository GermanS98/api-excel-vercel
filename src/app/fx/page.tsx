'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ==================================================================
// 1. TIPOS Y CONFIGURACIÓN
// ==================================================================

// Mapeo de la estructura de tu tabla dlfx2
type DbRow = {
  t: string;       // Ticker (texto)
  l: number;       // Last (numérico)
  ts: number;      // Timestamp (numérico)
  id?: number;     // ID (opcional si no lo usamos en el front)
};

// Estructura interna para nuestro uso
type MarketDataItem = {
  ticker: string;
  last: number;
  timestamp: number;
  expirationDate?: Date; // Para ordenar
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// ==================================================================
// 2. FUNCIONES AUXILIARES (Formato y Fechas)
// ==================================================================

const formatPrice = (value: number) => {
  if (value === null || typeof value === 'undefined') return '-';
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatTime = (ts: number) => {
  if (!ts) return '-';
  return format(new Date(ts), 'HH:mm:ss', { locale: es });
};

// Función para extraer fecha de vencimiento de tickers tipo "DLR/DIC25"
const getExpirationDate = (ticker: string): Date | undefined => {
  try {
    const parts = ticker.split('/');
    // Buscamos la parte que parece una fecha (ej: DIC25)
    // Generalmente es la segunda parte en DLR/DIC25
    const mesCode = parts.find(p => /^[A-Z]{3}\d{2}$/.test(p));
    
    if (!mesCode) return undefined;

    const meses: { [key: string]: number } = {
      ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5,
      JUL: 6, AGO: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11
    };

    const mesStr = mesCode.substring(0, 3);
    const anioStr = mesCode.substring(3); // '25'

    const mes = meses[mesStr];
    const anio = 2000 + parseInt(anioStr);

    if (mes === undefined || isNaN(anio)) return undefined;

    // Retornamos fin de mes aproximado o principio, solo importa para ordenar entre ellos
    return new Date(anio, mes, 1);
  } catch (e) {
    return undefined;
  }
};

// ==================================================================
// 3. COMPONENTE DE TABLA REUTILIZABLE
// ==================================================================
const TablaMarketData = ({ titulo, datos }: { titulo: string, datos: MarketDataItem[] }) => (
  <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
    <h3 style={{ fontSize: '1rem', padding: '0.75rem', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', margin: 0, color: '#111827', fontWeight: 600 }}>
      {titulo} <span style={{fontSize: '0.8em', fontWeight: 400, color: '#6b7280'}}>({datos.length})</span>
    </h3>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#ffffff', borderBottom: '2px solid #f3f4f6' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left', color: '#4b5563' }}>Ticker</th>
            <th style={{ padding: '0.5rem', textAlign: 'right', color: '#4b5563' }}>Precio</th>
            <th style={{ padding: '0.5rem', textAlign: 'right', color: '#4b5563' }}>Hora</th>
          </tr>
        </thead>
        <tbody>
          {datos.length > 0 ? (
            datos.map((item) => (
              <tr key={item.ticker} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td style={{ padding: '0.5rem', fontWeight: 500, color: '#111827' }}>{item.ticker}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{formatPrice(item.last)}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', color: '#6b7280', fontSize: '0.85rem' }}>{formatTime(item.timestamp)}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>Sin datos</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// ==================================================================
// 4. PÁGINA PRINCIPAL
// ==================================================================
export default function MarketDashboard() {
  // Usamos un Objeto/Diccionario para acceso rápido por ticker: { "DLR/DIC25": { ...data } }
  const [marketData, setMarketData] = useState<{ [key: string]: MarketDataItem }>({});
  const [estado, setEstado] = useState('Conectando...');
  
  const TABLE_NAME = 'dlfx2';

  useEffect(() => {
    const fetchData = async () => {
      setEstado('Cargando datos...');
      
      // 1. Carga inicial: Traemos TODOS los datos de la tabla tabular
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('t, l, ts');

      if (error) {
        console.error('Error fetching:', error);
        setEstado('Error de conexión');
        return;
      }

      if (data) {
        const initialMap: { [key: string]: MarketDataItem } = {};
        data.forEach((row: any) => {
           // Mapeamos de columnas DB (t, l, ts) a nuestro objeto
           initialMap[row.t] = {
             ticker: row.t,
             last: row.l,
             timestamp: row.ts,
             expirationDate: getExpirationDate(row.t)
           };
        });
        setMarketData(initialMap);
        setEstado('En línea');
      }

      // 2. Suscripción a Realtime
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
                  expirationDate: getExpirationDate(newRow.t) // Recalculamos fecha si es nuevo
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
  // LÓGICA DE FILTRADO Y CLASIFICACIÓN
  // ==================================================================
  const { dlrSimples, dlrComplejos, oroData, ypfGgalData, al30Data, rfx20Data } = useMemo(() => {
    const allData = Object.values(marketData);

    // Función auxiliar de ordenamiento por fecha
    const sortByDate = (a: MarketDataItem, b: MarketDataItem) => {
        // Si ambos tienen fecha, ordenar por fecha
        if (a.expirationDate && b.expirationDate) {
            return a.expirationDate.getTime() - b.expirationDate.getTime();
        }
        // Si uno es SPOT (sin fecha), ponerlo primero
        if (a.ticker.includes('SPOT')) return -1;
        if (b.ticker.includes('SPOT')) return 1;
        
        return a.ticker.localeCompare(b.ticker);
    };

    // 1. DLR Simples (No más de 2 '/')
    // Interpretación: "DLR/DIC25" tiene 1 barra. split length es 2.
    // "DLR/DIC25/ENE26" (Pase) tiene 2 barras. split length es 3.
    // La condición es "no tengan más de 2 '/'".
    const dlrSimples = allData
      .filter(d => d.ticker.startsWith('DLR/') && (d.ticker.match(/\//g) || []).length <= 1)
      .sort(sortByDate);

    // 2. DLR Complejos / Pases (Más de 2 '/') 
    // Asumo que te refieres a pases o combinaciones que tienen 2 o más barras (ej: DLR/X/Y)
    // Si la instrucción es estricta "más de 2", cambiar condición a > 2. 
    // Si te refieres a Pases (Spreads), suelen tener 2 barras. Lo he ajustado a >= 2 para capturar pases.
    const dlrComplejos = allData
      .filter(d => d.ticker.startsWith('DLR/') && (d.ticker.match(/\//g) || []).length >= 2)
      .sort(sortByDate);

    // 3. ORO
    const oroData = allData.filter(d => d.ticker.includes('ORO')).sort((a,b) => a.ticker.localeCompare(b.ticker));

    // 4. YPF y GGAL (Note: usé GGAL, tu prompt decía GGLA pero en la foto dice GGAL)
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
      <div style={{ maxWidth: '1600px', margin: 'auto', padding: '1.5rem' }}>
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1f2937' }}>Monitor de Mercado</h1>
          <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '999px', background: '#e0f2fe', color: '#0369a1', fontSize: '0.875rem', fontWeight: 500 }}>
             {estado}
          </div>
        </header>

        {/* GRILLA DE TABLAS */}
        {/* Ajustamos columnas para pantallas grandes */}
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '1.5rem',
            alignItems: 'start' 
        }}>
            
            {/* TABLA 1: DLR FUTUROS (Simples) */}
            <TablaMarketData titulo="Dólar Futuro (Outright)" datos={dlrSimples} />

            {/* TABLA 2: DLR PASES/COMPLEJOS */}
            <TablaMarketData titulo="Dólar (Spreads/Complejos)" datos={dlrComplejos} />

            {/* TABLA 6: RFX20 (Lo muevo aquí por relevancia de futuros) */}
            <TablaMarketData titulo="Índice RFX20" datos={rfx20Data} />

            {/* TABLA 4: ACCIONES (YPF / GGAL) */}
            <TablaMarketData titulo="Acciones (YPF / GGAL)" datos={ypfGgalData} />

            {/* TABLA 5: BONOS (AL30) */}
            <TablaMarketData titulo="Bonos (AL30)" datos={al30Data} />

            {/* TABLA 3: ORO */}
            <TablaMarketData titulo="Metales (ORO)" datos={oroData} />

        </div>
      </div>
    </Layout>
  );
}