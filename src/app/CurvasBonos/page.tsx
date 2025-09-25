// Esta línea es crucial para que el código interactivo (hooks) funcione en Next.js
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 1. CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
// Leemos las variables de entorno de forma segura
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!; // CORRECCIÓN: Usar ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- 2. EL COMPONENTE DE TU PÁGINA ---
export default function HomePage() {
  // Usamos 'useState' para guardar los datos y que la página se actualice sola
  const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
  const [estado, setEstado] = useState('Cargando...');

  // 'useEffect' se ejecuta cuando el componente carga.
  // Es perfecto para cargar datos y suscribirse a cambios.
  useEffect(() => {
    // --- FUNCIÓN PARA CARGAR LOS DATOS DEL DÍA ---
    const cargarDatosDelDia = async () => {
      const inicioDelDia = new Date();
      inicioDelDia.setHours(0, 0, 0, 0);

      // Hacemos la consulta a Supabase
      const { data, error } = await supabase
        .from('datos_financieros') // El nombre de tu tabla
        .select('*') // Pedimos todas las columnas (id, created_at, datos)
        .gte('created_at', inicioDelDia.toISOString()) // Filtra por hoy
        .order('created_at', { ascending: false }); // Ordena del más nuevo al más viejo

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

    // --- CARGA INICIAL ---
    cargarDatosDelDia();

    // --- SUSCRIPCIÓN EN TIEMPO REAL ---
    const channel = supabase.channel('datos_financieros_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'datos_financieros' },
        (payload) => {
          console.log('¡Cambio detectado en Supabase!', payload);
          // Cuando Supabase nos avisa de un cambio, volvemos a cargar todo
          cargarDatosDelDia();
        }
      )
      .subscribe();

    // --- FUNCIÓN DE LIMPIEZA ---
    // Esto es muy importante para evitar que la conexión quede abierta si el usuario se va.
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // El array vacío asegura que esto se ejecute solo una vez.

  // --- 3. LÓGICA DE PREPARACIÓN DE DATOS (antes del return) ---
  const ultimoLoteDeDatos = datosHistoricos.length > 0 ? datosHistoricos[0].datos : [];
  const segmentosPermitidos = ['LECAP', 'BONCAP', 'BONTE', 'TAMAR', 'CER', 'DL'];

  // Filtra la lista de datos usando la lista de segmentos permitidos
  const datosFiltrados = ultimoLoteDeDatos.filter((bono: any) => 
    segmentosPermitidos.includes(bono.segmento)
  );

  // --- 4. RETURN PRINCIPAL (con todo el JSX adentro) ---
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Bonos en Tiempo Real</h1>
      <p>Estado: <strong>{estado}</strong></p>
      {datosHistoricos.length > 0 && (
        <p>Última actualización: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></p>
      )}
      
      <hr />

      <h2>Últimos Datos Recibidos (Filtrados)</h2>
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
          {datosFiltrados.length > 0 ? (
            datosFiltrados.map((item: any, index: number) => (
              <tr key={index}>
                <td>{item.ticker}</td>
                <td>{(item.tir * 100).toFixed(2)}%</td>
                <td>{item.segmento}</td>
                <td>{item.paridad?.toFixed(4) ?? 'N/A'}</td>
                <td>{item.mep_breakeven ? item.mep_breakeven.toFixed(2) : 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={5}>Cargando o no hay datos para los segmentos seleccionados...</td></tr>
          )}
        </tbody>
      </table>

      <hr />

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
