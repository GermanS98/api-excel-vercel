'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import { X } from 'lucide-react';

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
  precio: number | null;
};

// --- CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// --- COMPONENTE REUTILIZABLE PARA LAS TABLAS ---
const TablaBonos = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
    // ... Tu componente TablaBonos se mantiene exactamente igual que antes ...
);

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function HomePage() {
  const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
  const [estado, setEstado] = useState('Cargando...');
  const [segmentoSeleccionado, setSegmentoSeleccionado] = useState<string>('Todos');

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
        console.error("Error al obtener datos de Supabase:", error);
        setEstado(`Error: ${error.message}`);
      } else {
        // --- DIAGNÓSTICO 1: ¿Qué datos llegan de Supabase? ---
        console.log("Datos recibidos de Supabase:", data);
        
        if (data.length === 0) {
          setEstado('Esperando los primeros datos del día...');
          setDatosHistoricos([]);
        } else {
          setDatosHistoricos(data);
          setEstado('Datos actualizados');
        }
      }
    };
    
    cargarDatosDelDia();

    const channel = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_financieros' }, 
        (payload) => {
          console.log('Detectado cambio en Supabase, recargando datos...');
          cargarDatosDelDia();
        }
      ).subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- LÓGICA DE PREPARACIÓN Y FILTRADO DE DATOS (VERSIÓN SIMPLIFICADA) ---
  const ultimoLoteDeDatos: Bono[] = datosHistoricos.length > 0 ? datosHistoricos[0].datos : [];

  // --- DIAGNÓSTICO 2: ¿Cuál es el último lote de datos que estamos usando? ---
  console.log("Último lote de datos a procesar:", ultimoLoteDeDatos);

  const gruposDeSegmentos: { [key: string]: string[] } = {
    'Todos': [],
    'LECAPs y Similares': ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'],
    'Ajustados por CER': ['CER', 'ON CER'],
    'Dollar Linked': ['ON DL', 'DL'],
    'Tasa Fija (TAMAR)': ['TAMAR', 'ON TAMAR'],
    'Bonares y Globales': ['BONAR', 'GLOBAL'],
  };

  const datosParaGrafico = (() => {
    if (segmentoSeleccionado === 'Todos' || !gruposDeSegmentos[segmentoSeleccionado]) {
      return ultimoLoteDeDatos;
    }
    const segmentosActivos = gruposDeSegmentos[segmentoSeleccionado];
    return ultimoLoteDeDatos.filter(b => segmentosActivos.includes(b.segmento));
  })();

  // --- DIAGNÓSTICO 3: ¿Cuántos bonos se van a mostrar en el gráfico? ---
  console.log(`Datos para el gráfico (segmento: ${segmentoSeleccionado}):`, datosParaGrafico.length, "bonos");

  const tabla1 = ultimoLoteDeDatos.filter(b => gruposDeSegmentos['LECAPs y Similares'].includes(b.segmento));
  const tabla2 = ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Ajustados por CER'].includes(b.segmento));
  const tabla3 = ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Dollar Linked'].includes(b.segmento));
  const tabla4 = ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Tasa Fija (TAMAR)'].includes(b.segmento));
  const tabla5 = ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Bonares y Globales'].includes(b.segmento));

  return (
    <main style={{ background: '#f3f4f6', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: 'auto' }}>
        {/* ... Tu JSX se mantiene exactamente igual que antes ... */}
        {/* ... No necesitas cambiar nada en la sección del return ... */}
      </div>
    </main>
  );
}
  return (
    <main style={{ background: '#f3f4f6', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: 'auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Bonos en Tiempo Real</h1>
        <p style={{ color: '#6b7280' }}>Estado: <strong>{estado}</strong></p>
        {datosHistoricos.length > 0 && (
          <p style={{ color: '#6b7280' }}>Última actualización: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></p>
        )}
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
          <h2>Curva de Rendimiento (TIR vs Días al Vencimiento)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
            <span style={{ fontWeight: 'bold' }}>Filtrar por Grupo:</span>
            {Object.keys(gruposDeSegmentos).map(grupo => (
              <button 
                key={grupo}
                onClick={() => setSegmentoSeleccionado(grupo)}
                style={{
                  padding: '8px 16px', fontSize: '14px', cursor: 'pointer', borderRadius: '20px',
                  border: '1px solid',
                  borderColor: segmentoSeleccionado === grupo ? '#3b82f6' : '#d1d5db',
                  backgroundColor: segmentoSeleccionado === grupo ? '#3b82f6' : 'white',
                  color: segmentoSeleccionado === grupo ? 'white' : '#374151',
                  transition: 'all 0.2s'
                }}
              >
                {grupo}
              </button>
            ))}
          </div>
          <CurvaRendimientoChart data={datosParaGrafico} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginTop: '2rem' }}>
          <TablaBonos titulo="LECAPs y Similares" datos={tabla1} />
          <TablaBonos titulo="Ajustados por CER" datos={tabla2} />
          <TablaBonos titulo="Dollar Linked" datos={tabla3} />
          <TablaBonos titulo="Tasa Fija (TAMAR)" datos={tabla4} />
          <TablaBonos titulo="Bonares y Globales" datos={tabla5} />
        </div>
      </div>
    </main>
  );
}