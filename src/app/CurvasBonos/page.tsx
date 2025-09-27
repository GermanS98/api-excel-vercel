// Esta línea es crucial para que el código interactivo (hooks) funcione en Next.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/CurvaRendimientoChart'; // CAMBIO: Importamos el nuevo componente
// --- 1. CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
// Leemos las variables de entorno de forma segura
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- 2. EL COMPONENTE DE TU PÁGINA ---
export default function HomePage() {
  // Usamos 'useState' para guardar los datos y que la página se actualice sola
  const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
  const [estado, setEstado] = useState('Cargando...');

  // 'useEffect' se ejecuta cuando el componente carga.
  // Es perfecto para cargar datos y suscribirse a cambios.
export default function HomePage() {
  const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
  const [estado, setEstado] = useState('Cargando...');
  // CAMBIO: Nuevo estado para guardar el texto del filtro
  const [filtroTicker, setFiltroTicker] = useState('');

  // useEffect se mantiene igual...
  useEffect(() => {
    const cargarDatosDelDia = async () => {
      const inicioDelDia = new Date();
      inicioDelDia.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('datos_financieros')
        .select('*')
        .gte('created_at', inicioDelDia.toISOString())
        .order('created_at', { ascending: false });

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
    const channel = supabase.channel('datos_financieros_channel')
      .on( 'postgres_changes', { event: '*', schema: 'public', table: 'datos_financieros' }, 
        (payload) => {
          console.log('¡Cambio detectado en Supabase!', payload);
          cargarDatosDelDia();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- LÓGICA DE PREPARACIÓN DE DATOS ---
  const ultimoLoteDeDatos = datosHistoricos.length > 0 ? datosHistoricos[0].datos : [];
  const segmentosPermitidos = ['LECAP', 'BONCAP', 'BONTE', 'TAMAR', 'CER', 'DL'];

  const datosFiltradosTabla = ultimoLoteDeDatos.filter((bono: any) => 
    segmentosPermitidos.includes(bono.segmento)
  );
  
  // CAMBIO: Nueva lógica para filtrar los datos para el gráfico
  const datosParaGrafico = ultimoLoteDeDatos.filter((bono: any) => {
    // Si el filtro está vacío, muestra todos los bonos
    if (filtroTicker.trim() === '') return true;
    // Si no, muestra solo los que incluyan el texto del filtro (ignorando mayúsculas)
    return bono.ticker.toUpperCase().includes(filtroTicker.toUpperCase());
  });


  // --- RENDERIZADO DE LA PÁGINA ---
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <h1>Bonos en Tiempo Real</h1>
      <p>Estado: <strong>{estado}</strong></p>
      {datosHistoricos.length > 0 && (
        <p>Última actualización: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></p>
      )}
      
      <hr />

      {/* --- NUEVO GRÁFICO INTERACTIVO --- */}
      <h2>Curva de Rendimiento (TIR vs Días al Vencimiento)</h2>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="filtro-ticker">Filtrar por Ticker: </label>
        <input 
          id="filtro-ticker"
          type="text"
          placeholder="Ej: AL30"
          value={filtroTicker}
          onChange={(e) => setFiltroTicker(e.target.value)}
          style={{ padding: '8px', fontSize: '16px' }}
        />
      </div>
      <CurvaRendimientoChart data={datosParaGrafico} />

      <hr />

      <h2>Últimos Datos Recibidos (Filtrados por Segmento)</h2>
      {/* La tabla de datos filtrados se mantiene igual */}
      <table>
        <thead>
          <tr>
            <th>Ticker</th>
            <th>TIR</th>
            <th>Segmento</th>
            <th>Paridad</th>
            <th>MEP Breakeven</th>
          </tr>
        </thead>
        <tbody>
          {datosFiltradosTabla.length > 0 ? (
            datosFiltradosTabla.map((item: any, index: number) => (
              <tr key={index}>
                <td>{item.ticker}</td>
                <td>{(item.tir * 100).toFixed(2)}%</td>
                <td>{item.segmento}</td>
                <td>{item.paridad?.toFixed(4) ?? 'N/A'}</td>
                <td>{item.mep_breakeven ? item.mep_breakeven.toFixed(2) : 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={5}>Cargando o no hay datos...</td></tr>
          )}
        </tbody>
      </table>

      <hr />

      {/* La tabla de historial se mantiene igual */}
      <h2>Historial Intradía</h2>
      <table>
        <thead>
          <tr>
            <th>Hora de Carga</th>
            <th>Cantidad de Tickers</th>
          </tr>
        </thead>
        <tbody>
          {datosHistoricos.length > 0 ? (
            datosHistoricos.map((registro: any) => (
              <tr key={registro.id}>
                <td>{new Date(registro.created_at).toLocaleTimeString()}</td>
                <td>{registro.datos.length}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={2}>No hay registros para hoy.</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
