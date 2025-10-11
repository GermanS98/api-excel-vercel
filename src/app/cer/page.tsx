'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Sidebar from '@/components/ui/Sidebar';
import Link from 'next/link';

// PASO 1: ACTUALIZAR LA DEFINICIÓN DE TIPO PARA INCLUIR NUEVOS CAMPOS
type Bono = {
  t: string;
  vto: string;
  p: number | null;
  tir: number;
  tna: number | null;
  tem: number | null;
  v: number; // Nuevo campo
  s: string;
  dv: number;
  md: number | null;
  RD: number | null; // Nuevo campo
  dm: number | null; // Nuevo campo
  mb: number | null; // Nuevo campo
};

// --- CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// --- FUNCIONES AUXILIARES DE FORMATO ---
const formatValue = (value: number | null | undefined, unit: string = '%', decimals: number = 2) => {
    // 1. Mantenemos la validación inicial
    if (value === null || typeof value === 'undefined' || !isFinite(value)) return '-';

    // 2. Realizamos el cálculo si es un porcentaje
    const numeroAFormatear = value * (unit === '%' ? 100 : 1);

    // 3. Usamos toLocaleString para aplicar el formato deseado
    const numeroFormateado = numeroAFormatear.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    // 4. Devolvemos el número formateado con su unidad
   return `${numeroFormateado}${unit}`;
};
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// --- COMPONENTE DE TABLA ACTUALIZADO ---
const TablaGeneral = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
          {titulo}
        </h2>
      <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#1036E2', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>VTO</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600}}>Precio</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Var</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TIR</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TNA</th>
              {/* --- COLUMNA AGREGADA --- */}
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TEM</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>RD</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>MEP Breakeven</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((item: Bono, index: number) => (
                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563' }}>{item.t}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatDate(item.vto)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.p,'',2)}</td>
                  <td style={{ 
                                padding: '0.75rem 1rem', 
                                color: item.v >= 0 ? '#22c55e' : '#ef4444', // Misma lógica: Verde o Rojo
                                fontWeight: 500
                                }}>
                    {formatValue(item.v)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tir)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tna)}</td>
                  {/* --- DATO AGREGADO --- */}
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tem)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.RD)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.mb? `$${item.mb.toFixed(2)}` : '-'}</td>
                </tr>
              ))
            ) : (
              // --- COLSPAN ACTUALIZADO A 8 ---
              <tr><td colSpan={8} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
);

// --- COMPONENTE PRINCIPAL DE LA PÁGINA DE LECAPS (sin cambios de lógica) ---
export default function LecapsPage() {
    const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
    const [estado, setEstado] = useState('Cargando...');
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);

    const segmentosDeEstaPagina = ['CER'];
    
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
    const datosDeLecaps = ultimoLoteDeDatos.filter(b => segmentosDeEstaPagina.includes(b.s));
    const maxDiasDelSegmento = (() => {
        if (datosDeLecaps.length === 0) return 1000;
        const maxDias = Math.max(...datosDeLecaps.map(b => b.dias_vto));
        return isFinite(maxDias) ? maxDias : 1000;
    })();

    useEffect(() => {
        setRangoDias([0, maxDiasDelSegmento]);
    }, [maxDiasDelSegmento]);

    const datosParaGrafico = datosDeLecaps.filter(b => b.dias_vto >= rangoDias[0] && b.dias_vto <= rangoDias[1]);
    const datosParaTabla = [...datosDeLecaps].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());

    return (
        <Layout>        
                <div style={{ maxWidth: '1400px', margin: 'auto' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Curva de Rendimiento: Instrumentos CER </h1>
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                        <span>Estado: <strong>{estado}</strong></span>
                        {datosHistoricos.length > 0 && (
                            <span style={{ marginLeft: '1rem' }}>Última act: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></span>
                        )}
                    </div>
                    
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '1.5rem' }}>
                        
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
                        
                          <CurvaRendimientoChart 
                          data={datosParaGrafico} 
                          segmentoActivo="CER" 
                          xAxisKey="dias_vto" // <-- Añadir esta línea
                        />                        
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                        <TablaGeneral titulo="Instrumentos CER" datos={datosParaTabla} />
                    </div>
                </div>
        </Layout>
    );
}