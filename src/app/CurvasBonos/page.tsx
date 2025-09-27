'use client';

import { useState, useEffect, useMemo } from 'react';
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
  precio: number | null; // Añadimos precio
};

// --- CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// --- COMPONENTE REUTILIZABLE Y MEJORADO PARA LAS TABLAS ---
const TablaBonos = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
  <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>{titulo}</h2>
    <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
          <tr>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Ticker</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>TIR</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>TNA</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>TEM</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Precio</th>
          </tr>
        </thead>
        <tbody>
          {datos.length > 0 ? (
            datos.map((item: Bono, index: number) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{item.ticker}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{(item.tir * 100).toFixed(2)}%</td>
                <td style={{ padding: '0.75rem 1rem' }}>{item.tna ? (item.tna * 100).toFixed(2) + '%' : 'N/A'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{item.tem ? (item.tem * 100).toFixed(2) + '%' : 'N/A'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{item.precio ?? 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
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
  const [segmentosSeleccionados, setSegmentosSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    const cargarDatosDelDia = async () => {
      const inicioDelDia = new Date();
      inicioDelDia.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('datos_financieros')
        .select('*')
        .gte('created_at', inicioDelDia.toISOString())
        .order('created_at', { ascending: false });
      if (error) setEstado(`Error: ${error.message}`);
      else if (data.length === 0) setEstado('Esperando los primeros datos del día...');
      else {
        setDatosHistoricos(data);
        setEstado('Datos actualizados');
      }
    };
    cargarDatosDelDia();
    const channel = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_financieros' }, 
        (payload) => cargarDatosDelDia()
      ).subscribe();
    return () => { supabase.removeChannel(channel) };
  }, []);

  const ultimoLoteDeDatos: Bono[] = useMemo(() => 
    datosHistoricos.length > 0 ? datosHistoricos[0].datos : [], 
    [datosHistoricos]
  );
  
  const todosLosSegmentos = useMemo(() => 
    [...new Set(ultimoLoteDeDatos.map(b => b.segmento))].sort(),
    [ultimoLoteDeDatos]
  );
  
  const handleSegmentoClick = (segmento: string) => {
    setSegmentosSeleccionados(prev =>
      prev.includes(segmento) ? prev.filter(s => s !== segmento) : [...prev, segmento]
    );
  };
  
  const datosParaGrafico = useMemo(() => 
    segmentosSeleccionados.length === 0 
      ? ultimoLoteDeDatos 
      : ultimoLoteDeDatos.filter(b => segmentosSeleccionados.includes(b.segmento)),
    [ultimoLoteDeDatos, segmentosSeleccionados]
  );

  const tabla1 = useMemo(() => ultimoLoteDeDatos.filter(b => ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'].includes(b.segmento)), [ultimoLoteDeDatos]);
  const tabla2 = useMemo(() => ultimoLoteDeDatos.filter(b => ['CER', 'ON CER'].includes(b.segmento)), [ultimoLoteDeDatos]);
  const tabla3 = useMemo(() => ultimoLoteDeDatos.filter(b => ['ON DL', 'DL'].includes(b.segmento)), [ultimoLoteDeDatos]);
  const tabla4 = useMemo(() => ultimoLoteDeDatos.filter(b => ['TAMAR', 'ON TAMAR'].includes(b.segmento)), [ultimoLoteDeDatos]);

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
            <span style={{ fontWeight: 'bold' }}>Filtrar por Segmento:</span>
            {todosLosSegmentos.map(segmento => (
              <button 
                key={segmento}
                onClick={() => handleSegmentoClick(segmento)}
                style={{
                  padding: '8px 16px', fontSize: '14px', cursor: 'pointer', borderRadius: '20px',
                  border: '1px solid',
                  borderColor: segmentosSeleccionados.includes(segmento) ? '#3b82f6' : '#d1d5db',
                  backgroundColor: segmentosSeleccionados.includes(segmento) ? '#3b82f6' : 'white',
                  color: segmentosSeleccionados.includes(segmento) ? 'white' : '#374151',
                  transition: 'all 0.2s'
                }}
              >
                {segmento}
              </button>
            ))}
            {segmentosSeleccionados.length > 0 && (
              <button onClick={() => setSegmentosSeleccionados([])} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                <X size={18} />
              </button>
            )}
          </div>
          <CurvaRendimientoChart data={datosParaGrafico} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginTop: '2rem' }}>
          <TablaBonos titulo="Segmento: LECAP, BONCAP, BONTE, DUAL TAMAR" datos={tabla1} />
          <TablaBonos titulo="Segmento: CER y ON CER" datos={tabla2} />
          <TablaBonos titulo="Segmento: ON DL y DL" datos={tabla3} />
          <TablaBonos titulo="Segmento: TAMAR y ON TAMAR" datos={tabla4} />
        </div>
      </div>
    </main>
  );
}