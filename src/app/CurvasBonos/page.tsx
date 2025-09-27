'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';

// --- DEFINICIÓN DEL TIPO PARA TYPESCRIPT ---
type Bono = {
  ticker: string;
  tir: number;
  segmento: string;
  paridad: number | null;
  mep_breakeven: number | null;
  dias_vto: number;
  tna: number | null;
  tem: number | null;
  // La propiedad 'precio' no está en los datos actuales. Ver nota al final.
};

// --- CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// --- COMPONENTE REUTILIZABLE PARA LAS TABLAS ---
const TablaBonos = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
  <div>
    <h2>{titulo}</h2>
    <div style={{ overflowX: 'auto', maxHeight: '400px', border: '1px solid #eee' }}>
      <table>
        <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
          <tr>
            <th>Ticker</th>
            <th>TIR</th>
            <th>TNA</th>
            <th>TEM</th>
            {/*<th>Precio</th>*/}
          </tr>
        </thead>
        <tbody>
          {datos.length > 0 ? (
            datos.map((item: Bono, index: number) => (
              <tr key={index}>
                <td>{item.ticker}</td>
                <td>{(item.tir * 100).toFixed(2)}%</td>
                <td>{item.tna ? (item.tna * 100).toFixed(2) + '%' : 'N/A'}</td>
                <td>{item.tem ? (item.tem * 100).toFixed(2) + '%' : 'N/A'}</td>
                {/*<td>{item.precio ?? 'N/A'}</td>*/}
              </tr>
            ))
          ) : (
            <tr><td colSpan={4}>No se encontraron datos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function HomePage() {
  const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
  const [estado, setEstado] = useState('Cargando...');
  const [tickersSeleccionados, setTickersSeleccionados] = useState<string[]>([]);

// useEffect para cargar datos y suscribirse a cambios
  useEffect(() => {
    const cargarDatosDelDia = async () => {
      const inicioDelDia = new Date();
      inicioDelDia.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('datos_financieros')
        .select('*')
        .gte('creado_en', inicioDelDia.toISOString())
        .order('creado_en', { ascending: false });

      if (error) {
        console.error("Error cargando los datos:", error);
        setEstado(`Error: ${error.message}`);
      } else if (data.length === 0) {
        setEstado('Esperando los primeros datos del día...');
        setDatosHistoricos([]);
      } else {
        setDatosHistoricos(data);
        setEstado('Datos actualizados');
      }
    };

    cargarDatosDelDia();

    // --- CORRECCIÓN APLICADA AQUÍ ---
    const channel = supabase
      .channel('custom-all-channel') // Dale un nombre único a tu canal
      .on(
        'postgres_changes', // Escucha los cambios en la base de datos
        { event: '*', schema: 'public', table: 'datos_financieros' }, // Filtra por tu tabla
        (payload) => {
          console.log('¡Cambio detectado en Supabase!', payload);
          cargarDatosDelDia();
        }
      )
      .subscribe();

    // Función de limpieza
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // El array vacío asegura que esto se ejecute solo una vez.

  // --- LÓGICA DE PREPARACIÓN Y FILTRADO DE DATOS ---
  const ultimoLoteDeDatos: Bono[] = useMemo(() => 
    datosHistoricos.length > 0 ? datosHistoricos[0].datos : [], 
    [datosHistoricos]
  );

  const todosLosTickers = useMemo(() => 
    [...new Set(ultimoLoteDeDatos.map(b => b.ticker))].sort(), 
    [ultimoLoteDeDatos]
  );
  
  const handleTickerClick = (ticker: string) => {
    setTickersSeleccionados(prev =>
      prev.includes(ticker)
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    );
  };
  
  const datosParaGrafico = useMemo(() => 
    tickersSeleccionados.length === 0 
      ? ultimoLoteDeDatos 
      : ultimoLoteDeDatos.filter(b => tickersSeleccionados.includes(b.ticker)),
    [ultimoLoteDeDatos, tickersSeleccionados]
  );

  // Filtros para cada una de las 4 tablas
  const tabla1 = useMemo(() => ultimoLoteDeDatos.filter(b => ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'].includes(b.segmento)), [ultimoLoteDeDatos]);
  const tabla2 = useMemo(() => ultimoLoteDeDatos.filter(b => ['CER', 'ON CER'].includes(b.segmento)), [ultimoLoteDeDatos]);
  const tabla3 = useMemo(() => ultimoLoteDeDatos.filter(b => ['ON DL', 'DL'].includes(b.segmento)), [ultimoLoteDeDatos]);
  const tabla4 = useMemo(() => ultimoLoteDeDatos.filter(b => ['TAMAR', 'ON TAMAR'].includes(b.segmento)), [ultimoLoteDeDatos]);


  // --- RENDERIZADO DE LA PÁGINA ---
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <h1>Bonos en Tiempo Real</h1>
      <p>Estado: <strong>{estado}</strong></p>
      {datosHistoricos.length > 0 && (
        <p>Última actualización: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></p>
      )}
      <hr style={{ margin: '2rem 0' }} />

      <h2>Curva de Rendimiento (TIR vs Días al Vencimiento)</h2>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Seleccionar tickers para filtrar en la curva:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '20px', maxHeight: '110px', overflowY: 'auto', padding: '10px', border: '1px solid #eee' }}>
        {todosLosTickers.map(ticker => (
          <button 
            key={ticker}
            onClick={() => handleTickerClick(ticker)}
            style={{ /* Estilos de botones */ }}
          >
            {ticker}
          </button>
        ))}
      </div>
      
      <CurvaRendimientoChart data={datosParaGrafico} />

      <hr style={{ margin: '2rem 0' }} />

      {/* --- NUEVAS TABLAS SEPARADAS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <TablaBonos titulo="Segmento: LECAP, BONCAP, BONTE, DUAL TAMAR" datos={tabla1} />
        <TablaBonos titulo="Segmento: CER y ON CER" datos={tabla2} />
        <TablaBonos titulo="Segmento: ON DL y DL" datos={tabla3} />
        <TablaBonos titulo="Segmento: TAMAR y ON TAMAR" datos={tabla4} />
      </div>
    </main>
  );
}