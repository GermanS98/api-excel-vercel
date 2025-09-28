'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

// --- DEFINICIÓN DEL TIPO PARA TYPESCRIPT ---
type Bono = {
  ticker: string;
  vto: string;
  precio: number | null;
  tir: number;
  tna: number | null;
  tem: number | null;
  segmento: string;
  modify_duration: number | null;
  dias_vto: number;
};

// --- CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// --- FUNCIONES AUXILIARES DE FORMATO ---
const formatValue = (value: number | null | undefined, unit: string = '%', decimals: number = 2) => {
  if (value === null || typeof value === 'undefined' || !isFinite(value)) {
    return '-';
  }
  return `${(value * (unit === '%' ? 100 : 1)).toFixed(decimals)}${unit}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// --- COMPONENTES REUTILIZABLES PARA LAS TABLAS ---
const TablaGeneral = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
  <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>{titulo}</h2>
    <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
          <tr>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Ticker</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>VTO</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Precio</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>TIR</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>TNA</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>TEM</th>
          </tr>
        </thead>
        <tbody>
          {datos.length > 0 ? (
            datos.map((item: Bono, index: number) => (
              <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{item.ticker}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{formatDate(item.vto)}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{item.precio ?? '-'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{formatValue(item.tir)}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{formatValue(item.tna)}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{formatValue(item.tem)}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const TablaSoberanosYONs = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
  <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>{titulo}</h2>
    <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
          <tr>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Ticker</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>VTO</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>Precio</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>TIR</th>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#4b5563' }}>MD</th>
          </tr>
        </thead>
        <tbody>
          {datos.length > 0 ? (
            datos.map((item: Bono, index: number) => (
              <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{item.ticker}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{formatDate(item.vto)}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{item.precio ?? '-'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{formatValue(item.tir)}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{formatValue(item.modify_duration, '', 2)}</td>
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
  
  const gruposDeSegmentos: { [key: string]: string[] } = {
    'LECAPs y Similares': ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'],
    'Ajustados por CER': ['CER', 'ON CER'],
    'Dollar Linked': ['ON DL', 'DL', 'ON HD'],
    'Tasa Fija (TAMAR)': ['TAMAR', 'ON TAMAR'],
    'Bonares y Globales': ['BONAR', 'GLOBAL'],
    'Obligaciones Negociables': ['ON']
  };
  
  const [segmentoSeleccionado, setSegmentoSeleccionado] = useState<string>(Object.keys(gruposDeSegmentos)[0]);
  const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const cargarDatosDelDia = async () => {
      const inicioDelDia = new Date();
      inicioDelDia.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from('datos_financieros').select('*').gte('created_at', inicioDelDia.toISOString()).order('created_at', { ascending: false });
      if (error) setEstado(`Error: ${error.message}`);
      else if (data && data.length > 0) {
        setDatosHistoricos(data);
        setEstado('Datos actualizados');
      } else {
        setEstado('Esperando los primeros datos del día...');
      }
    };
    cargarDatosDelDia();
    const channel = supabase.channel('custom-all-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'datos_financieros' }, () => cargarDatosDelDia()).subscribe();
    return () => { supabase.removeChannel(channel) };
  }, []);

  // --- LÓGICA DE PREPARACIÓN DE DATOS (SIN useMemo) ---
  const ultimoLoteDeDatos: Bono[] = (datosHistoricos.length > 0 && datosHistoricos[0].datos) ? datosHistoricos[0].datos : [];

  const datosDelSegmentoSeleccionado = (() => {
    const segmentosActivos = gruposDeSegmentos[segmentoSeleccionado] || [];
    return ultimoLoteDeDatos.filter(b => segmentosActivos.includes(b.segmento));
  })();

  const maxDiasDelSegmento = (() => {
    if (datosDelSegmentoSeleccionado.length === 0) return 1000;
    const maxDias = Math.max(...datosDelSegmentoSeleccionado.map(b => b.dias_vto));
    return isFinite(maxDias) ? maxDias : 1000;
  })();

  useEffect(() => {
    setRangoDias([0, maxDiasDelSegmento]);
  }, [maxDiasDelSegmento]);
  
  const datosParaGrafico = datosDelSegmentoSeleccionado.filter(b => b.dias_vto >= rangoDias[0] && b.dias_vto <= rangoDias[1]);

  // Función auxiliar para ordenar por fecha de vencimiento
  const ordenarPorVencimiento = (datos: Bono[]) => {
    return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
  };

  // Se crean y ordenan los datos para cada tabla
  const tabla1 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['LECAPs y Similares'].includes(b.segmento)));
  const tabla2 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Ajustados por CER'].includes(b.segmento)));
  const tabla3 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Dollar Linked'].includes(b.segmento)));
  const tabla4 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Tasa Fija (TAMAR)'].includes(b.segmento)));
  const tabla5 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Bonares y Globales'].includes(b.segmento)));
  const tabla6 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Obligaciones Negociables'].includes(b.segmento)));

  return (
    <main style={{ background: '#f3f4f6', fontFamily: 'sans-serif', padding: '10px' }}>
      <div style={{ maxWidth: '1400px', margin: 'auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Bonos en Tiempo Real</h1>
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
            <span>Estado: <strong>{estado}</strong></span>
            {datosHistoricos.length > 0 && (
              <span style={{ marginLeft: '1rem' }}>Última act: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></span>
            )}
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '1.5rem' }}>
          <h2>Curva de Rendimiento (TIR vs Días al Vencimiento)</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '10px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
            {Object.keys(gruposDeSegmentos).map(grupo => (
              <button key={grupo} onClick={() => setSegmentoSeleccionado(grupo)}
                style={{
                  padding: '8px 16px', fontSize: '14px', cursor: 'pointer', borderRadius: '20px',
                  border: '1px solid',
                  borderColor: segmentoSeleccionado === grupo ? '#3b82f6' : '#d1d5db',
                  backgroundColor: segmentoSeleccionado === grupo ? '#3b82f6' : 'white',
                  color: segmentoSeleccionado === grupo ? 'white' : '#374151',
                  transition: 'all 0.2s'
                }}>
                {grupo}
              </button>
            ))}
          </div>
          
          <div style={{ padding: '0 10px', marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Filtrar por Días al Vencimiento:</label>
            <Slider
              range min={0} max={maxDiasDelSegmento > 0 ? maxDiasDelSegmento : 1}
              value={rangoDias}
              onChange={(value) => setRangoDias(value as [number, number])}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span style={{ fontSize: '12px' }}>{rangoDias[0]} días</span>
              <span style={{ fontSize: '12px' }}>{maxDiasDelSegmento} días</span>
            </div>
          </div>
          
          <CurvaRendimientoChart data={datosParaGrafico} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
          <TablaGeneral titulo="LECAPs y Similares" datos={tabla1} />
          <TablaGeneral titulo="Ajustados por CER" datos={tabla2} />
          <TablaGeneral titulo="Dollar Linked" datos={tabla3} />
          <TablaGeneral titulo="Tasa Fija (TAMAR)" datos={tabla4} />
          <TablaSoberanosYONs titulo="Bonares y Globales" datos={tabla5} />
          <TablaSoberanosYONs titulo="Obligaciones Negociables" datos={tabla6} />
        </div>
      </div>
    </main>
  );
}