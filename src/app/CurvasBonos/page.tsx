// Esta línea es crucial para que el código interactivo (hooks) funcione en Next.js
'use client';
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

// --- 2. EL COMPONENTE DE TU PÁGINA ---
export default function HomePage() {
  // Usamos 'useState' para guardar los datos y que la página se actualice sola
  const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
  const [estado, setEstado] = useState('Cargando...');

  // 'useEffect' es un hook que se ejecuta cuando el componente carga.
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

  // --- 3. LO QUE SE MUESTRA EN PANTALLA (JSX) ---
  const ultimoLoteDeDatos = datosHistoricos.length > 0 ? datosHistoricos[0].datos : [];
  // --- Se filtra por fijas
  const segmentosPermitidos = ['LECAP', 'BONCAP', 'BONTE', 'TAMAR', 'CER', 'DL'];

  // CAMBIO 2: Filtra la lista de datos usando la lista de segmentos permitidos
  const datosFiltrados = ultimoLoteDeDatos.filter((bono: any) => 
    segmentosPermitidos.includes(bono.segmento)
  );
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Bonos en Tiempo Real</h1>
      <p>Estado: <strong>{estado}</strong></p>
      {datosHistoricos.length > 0 && (
        <p>Última actualización: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></p>
      )}
      
      <hr />

      <h2>Últimos Datos Recibidos</h2>
      <table>

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
