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
  ticker: string;
  vto: string;
  precio: number | null;
  var: number; // Nuevo campo
  tir: number;
  segmento: string;
  dias_vto: number;
  paridad: number;
  modify_duration: number | null;
  RD: number | null; // Nuevo campo
  duracion_macaulay: number | null; // Nuevo campo
  ley: string;
  monedadepago: string;
  frec: string;
  lmin: string;
  cantnominales: string;
  tipoamort: string;
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
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Vto</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600}}>Precio</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Var</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TIR</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Paridad</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>MD</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Ley</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Moneda</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Frec.</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>L. Mín</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Nominales</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Amort.</th>            
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((item: Bono, index: number) => (
                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563' }}>{item.ticker}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatDate(item.vto)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.precio,'',2)}</td>
                  <td style={{ 
                                padding: '0.75rem 1rem', 
                                color: item.var >= 0 ? '#22c55e' : '#ef4444', // Misma lógica: Verde o Rojo
                                fontWeight: 500
                                }}>
                    {formatValue(item.var)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tir)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.paridad, '', 2)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.modify_duration, '', 2)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.ley || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.monedadepago || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.frec || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.lmin || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.cantnominales || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.tipoamort || '-'}</td>                
                </tr>
              ))
            ) : (
              // --- COLSPAN ACTUALIZADO A 8 ---
              <tr><td colSpan={13} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
);

// --- COMPONENTE PRINCIPAL DE LA PÁGINA DE LECAPS (sin cambios de lógica) ---
export default function LecapsPage() {
    const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
    const [caracteristicasMap, setCaracteristicasMap] = useState<Map<string, any>>(new Map());
    const [estado, setEstado] = useState('Cargando...');
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);
    const [filtros, setFiltros] = useState<{ [key: string]: string }>({});
    // CAMBIO 1: El "Cerebro" de los filtros. Define el tipo de cada columna.
    const columnConfig = {
        ticker: { label: 'Ticker', type: 'text' },
        vto: { label: 'Vto', type: 'date' },
        precio: { label: 'Precio', type: 'number' },
        var: { label: 'Var', type: 'number', isPercentage: true },
        tir: { label: 'TIR', type: 'number', isPercentage: true },
        paridad: { label: 'Paridad', type: 'number' },
        modify_duration: { label: 'MD', type: 'number' },
        ley: { label: 'Ley', type: 'text' },
        monedadepago: { label: 'Moneda', type: 'text' },
        frec: { label: 'Frec.', type: 'text' },
        lmin: { label: 'L. Mín', type: 'text' },
        cantnominales: { label: 'Nominales', type: 'text' },
        tipoamort: { label: 'Amort.', type: 'text' },
    };
    #const segmentosDeEstaPagina = ['ON'];
    //Un nuevo useEffect para cargar las características una sola vez.
    useEffect(() => {
        const cargarCaracteristicas = async () => {
            const { data, error } = await supabase.from('caracteristicas').select('*');
            if (error) {
                console.error("Error cargando características:", error);
                setEstado(`Error en características: ${error.message}`);
            } else if (data) {
                // Convertimos el array en un Map para que la búsqueda por ticker sea instantánea.
                const nuevoMapa = new Map(data.map(item => [item.ticker, item]));
                setCaracteristicasMap(nuevoMapa);
            }
        };
        
        cargarCaracteristicas();
    }, []);

    // useEffect para datos financieros (en tiempo real)
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
    const handleFiltroChange = (columna: keyof Bono, valor: string) => {
        setFiltros(prev => ({ ...prev, [columna]: valor }));
    };
    const datosCompletos = useMemo(() => {
        if (datosHistoricos.length > 0 && datosHistoricos[0].datos && caracteristicasMap.size > 0) {
            return datosHistoricos[0].datos.map((bono: any) => ({
                ...bono, ...(caracteristicasMap.get(bono.ticker) || {}),
            }));
        }
        return [];
    }, [datosHistoricos, caracteristicasMap]);
    
    // CAMBIO 2: La nueva lógica de filtrado avanzado.
    const datosParaTabla = useMemo(() => {
        const datosDeSegmento = datosCompletos.filter(b => b.segmento === 'ON');

        if (Object.values(filtros).every(v => !v)) {
            return datosDeSegmento.sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
        }

        return datosDeSegmento.filter(bono => {
            return Object.entries(filtros).every(([key, filterValue]) => {
                if (!filterValue) return true;

                const config = columnConfig[key as keyof Bono];
                const cellValue = bono[key as keyof Bono];
                
                if (cellValue === null || cellValue === undefined) return false;

                // Lógica para cada tipo de dato
                switch (config.type) {
                    case 'number':
                        let numericValue = cellValue;
                        // Ajustamos valor si es % (TIR/Var vienen como 0.5, no 50)
                        if (config.isPercentage) numericValue *= 100;

                        // Rango (ej: "10-20")
                        if (filterValue.includes('-')) {
                            const [min, max] = filterValue.split('-').map(parseFloat);
                            return numericValue >= (min || -Infinity) && numericValue <= (max || Infinity);
                        }
                        // Operadores (ej: ">50", "<=10")
                        const match = filterValue.match(/^(>=|<=|>|<)?\s*(-?\d+\.?\d*)$/);
                        if (match) {
                            const [, operator, numStr] = match;
                            const num = parseFloat(numStr);
                            switch (operator) {
                                case '>': return numericValue > num;
                                case '<': return numericValue < num;
                                case '>=': return numericValue >= num;
                                case '<=': return numericValue <= num;
                                default: return numericValue == num;
                            }
                        }
                        return String(numericValue).toLowerCase().includes(filterValue.toLowerCase());

                    case 'date':
                        const cellDate = new Date(cellValue);
                        cellDate.setHours(0, 0, 0, 0); // Normalizar
                        
                        // Rango (ej: "10/10/2025 - 20/10/2025")
                        if (filterValue.includes('-')) {
                            const [startStr, endStr] = filterValue.split('-').map(s => s.trim());
                            const [startDay, startMonth, startYear] = startStr.split('/').map(Number);
                            const [endDay, endMonth, endYear] = endStr.split('/').map(Number);
                            const startDate = new Date(startYear, startMonth - 1, startDay);
                            const endDate = new Date(endYear, endMonth - 1, endDay);
                            return cellDate >= startDate && cellDate <= endDate;
                        }
                        
                        // Fecha exacta
                        const [day, month, year] = filterValue.split('/').map(Number);
                        if (!day || !month || !year) return false; // Formato inválido
                        const filterDate = new Date(year, month - 1, day);
                        return cellDate.getTime() === filterDate.getTime();

                    case 'text':
                    default:
                        return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
                }
            });
        }).sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    }, [datosCompletos, filtros]);

    // Lógica para el gráfico y slider
    const maxDiasDelSegmento = useMemo(() => {
        const datosSinFiltro = datosCompletos.filter(b => b.segmento === 'ON');
        if (datosSinFiltro.length === 0) return 1000;
        const maxDias = Math.max(...datosSinFiltro.map(b => b.dias_vto));
        return isFinite(maxDias) ? maxDias : 1000;
    }, [datosCompletos]);

    useEffect(() => {
        if (maxDiasDelSegmento > 0) setRangoDias([0, maxDiasDelSegmento]);
    }, [maxDiasDelSegmento]);
    
    const datosParaGrafico = datosParaTabla.filter(b => b.dias_vto >= rangoDias[0] && b.dias_vto <= rangoDias[1]);

    return (
        <Layout>      
                <div style={{ maxWidth: '1400px', margin: 'auto' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Curva de Rendimiento: Obligaciones negociables HD</h1>
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
                          segmentoActivo="ON" 
                          xAxisKey="dias_vto" // <-- Añadir esta línea
                        />                        
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                        <TablaGeneral titulo="ONs HD" datos={datosParaTabla} />
                    </div>
                </div>
            </Layout>
    );
}