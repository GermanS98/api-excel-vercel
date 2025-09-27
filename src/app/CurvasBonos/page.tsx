'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import { X } from 'lucide-react'; // Importamos el icono para el botón de limpiar

// --- 1. CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// --- 2. EL COMPONENTE DE TU PÁGINA ---
export default function HomePage() {
  // --- Estados del componente ---
  const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
  const [estado, setEstado] = useState('Cargando...');
  const [filtroTicker, setFiltroTicker] = useState('');
  // Nuevo estado para los filtros de segmento
  const [segmentosSeleccionados, setSegmentosSeleccionados] = useState<string[]>([]);

  // useEffect para cargar datos (sin cambios)
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_financieros' }, 
        (payload) => cargarDatosDelDia()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Lógica de preparación y filtrado de datos ---
  const ultimoLoteDeDatos = datosHistoricos.length > 0 ? datosHistoricos[0].datos : [];
  
  // Lista de todos los segmentos posibles para los botones
  const todosLosSegmentos = ['LECAP', 'BONCAP', 'BONTE', 'TAMAR', 'CER', 'DL'];

  const handleSegmentoClick = (segmento: string) => {
    setSegmentosSeleccionados(prev => 
      prev.includes(segmento) 
        ? prev.filter(s => s !== segmento) // Si ya está, lo quita
        : [...prev, segmento] // Si no está, lo añade
    );
  };

  // Los datos se filtran primero por segmento, y luego por ticker
  const datosFiltrados = ultimoLoteDeDatos.filter(bono => {
    // Si no hay segmentos seleccionados, se muestran todos
    const pasaFiltroSegmento = segmentosSeleccionados.length === 0 ? true : segmentosSeleccionados.includes(bono.segmento);
    // El filtro de ticker se aplica sobre el resultado del filtro de segmento
    const pasaFiltroTicker = filtroTicker.trim() === '' ? true : bono.ticker.toUpperCase().includes(filtroTicker.toUpperCase());

    return pasaFiltroSegmento && pasaFiltroTicker;
  });

  // --- Renderizado de la página ---
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <h1>Bonos en Tiempo Real</h1>
      <p>Estado: <strong>{estado}</strong></p>
      {datosHistoricos.length > 0 && (
        <p>Última actualización: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></p>
      )}
      
      <hr style={{ margin: '2rem 0' }} />

      <h2>Curva de Rendimiento (TIR vs Días al Vencimiento)</h2>
      
      {/* --- NUEVOS FILTROS DE BOTONES --- */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontWeight: 'bold' }}>Filtrar por Segmento:</span>
        {todosLosSegmentos.map(segmento => (
          <button 
            key={segmento}
            onClick={() => handleSegmentoClick(segmento)}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: segmentosSeleccionados.includes(segmento) ? '#3b82f6' : '#ccc',
              backgroundColor: segmentosSeleccionados.includes(segmento) ? '#3b82f6' : 'white',
              color: segmentosSeleccionados.includes(segmento) ? 'white' : 'black',
            }}
          >
            {segmento}
          </button>
        ))}
        {segmentosSeleccionados.length > 0 && (
          <button onClick={() => setSegmentosSeleccionados([])} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#999' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          placeholder="Buscar ticker en el gráfico..."
          value={filtroTicker}
          onChange={(e) => setFiltroTicker(e.target.value)}
          style={{ padding: '8px', fontSize: '14px', width: '250px' }}
        />
      </div>

      <CurvaRendimientoChart data={datosFiltrados} filtroTicker={filtroTicker} />

      <hr style={{ margin: '2rem 0' }} />

      <h2>Datos de Bonos (Filtrados)</h2>
      <div style={{ overflowX: 'auto' }}>
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
              <tr><td colSpan={5}>No se encontraron datos para los filtros seleccionados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}