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
  if (value === null || typeof value === 'undefined' || !isFinite(value)) return '-';
  return `${(value * (unit === '%' ? 100 : 1)).toFixed(decimals)}${unit}`;
};
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// --- COMPONENTES REUTILIZABLES PARA LAS TABLAS ---
const TablaGeneral = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
  // ... (código del componente sin cambios)
);
const TablaSoberanosYONs = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
  // ... (código del componente sin cambios)
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
    'Bonares y Globales': ['BONAR', 'GLOBAL', 'BOPREAL'], // Se añade BOPREAL
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

  const ordenarPorVencimiento = (datos: Bono[]) => {
    return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
  };

  const tabla1 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['LECAPs y Similares'].includes(b.segmento)));
  const tabla2 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Ajustados por CER'].includes(b.segmento)));
  const tabla3 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Dollar Linked'].includes(b.segmento)));
  const tabla4 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Tasa Fija (TAMAR)'].includes(b.segmento)));
  const tabla5 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Bonares y Globales'].includes(b.segmento)));
  const tabla6 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Obligaciones Negociables'].includes(b.segmento)));

  return (
    <main style={{ background: '#f3f4f6', fontFamily: 'Albert Sans, sans-serif', padding: '10px' }}>
      <div style={{ maxWidth: '1400px', margin: 'auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Bonos en Tiempo Real</h1>
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', fontFamily: 'SF Pro Display, sans-serif' }}>
            <span>Estado: <strong>{estado}</strong></span>
            {datosHistoricos.length > 0 && (
              <span style={{ marginLeft: '1rem' }}>Última act: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></span>
            )}
        </div>
        
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#021751' }}>Curva de Rendimiento (TIR vs Días al Vencimiento)</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '10px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
            {Object.keys(gruposDeSegmentos).map(grupo => (
              <button key={grupo} onClick={() => setSegmentoSeleccionado(grupo)}
                style={{ /* Estilos de botones sin cambios */ }}>
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