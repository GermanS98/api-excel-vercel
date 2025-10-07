'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
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
type FilterableColumn = keyof typeof columnConfig;
const TablaGeneral = ({ 
    titulo, datos, filtros, onFiltroChange
}: { 
    titulo: string, datos: Bono[], filtros: { [key: string]: string },
    // CORRECCIÓN: Usamos nuestro nuevo tipo preciso
    onFiltroChange: (columna: FilterableColumn, valor: string) => void,
}) => {
    const getPlaceholder = (columna: FilterableColumn) => {
        const type = columnConfig[columna]?.type || 'text';
        if (type === 'number') return "Ej: >50, 10-20";
        if (type === 'date') return "dd/mm/yyyy";
        return `Filtrar...`;
    };

    return (
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>{titulo}</h2>
            <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr style={{ background: '#1036E2', color: 'white' }}>
                            {(Object.keys(columnConfig) as FilterableColumn[]).map(key => <th key={key} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>{columnConfig[key].label}</th>)}
                        </tr>
                        <tr style={{ background: '#f0f2f5' }}>
                            {(Object.keys(columnConfig) as FilterableColumn[]).map(key => (
                                <th key={`${key}-filter`} style={{ padding: '0.25rem 0.5rem' }}>
                                    <input type="text" placeholder={getPlaceholder(key)} value={filtros[key] || ''} onChange={(e) => onFiltroChange(key, e.target.value)} style={{ width: '100%', border: '1px solid #ccc', borderRadius: '4px', padding: '4px' }} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length > 0 ? (
                            datos.map((item, index) => (
                                <tr key={item.ticker + index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    {(Object.keys(columnConfig) as FilterableColumn[]).map(key => {
                                        const value = item[key];
                                        let displayValue: React.ReactNode = '-';
                                        if (value !== null && value !== undefined) {
                                            const config = columnConfig[key];
                                            if (config.type === 'date') displayValue = formatDate(String(value));
                                            else if (config.type === 'number') displayValue = formatValue(Number(value), config.isPercentage ? '%' : '', 2);
                                            else displayValue = String(value);
                                        }
                                        return <td key={key} style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{displayValue}</td>
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={Object.keys(columnConfig).length} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No hay resultados para los filtros aplicados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
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
// --- COMPONENTE PRINCIPAL ---
export default function LecapsPage() {
    const [datosHistoricos, setDatosHistoricos] = useState<any[]>([]);
    const [caracteristicasMap, setCaracteristicasMap] = useState<Map<string, any>>(new Map());
    const [estado, setEstado] = useState('Cargando...');
    const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);
    const [filtros, setFiltros] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const cargarCaracteristicas = async () => {
            const { data } = await supabase.from('caracteristicas').select('*');
            if (data) setCaracteristicasMap(new Map(data.map(item => [item.ticker, item])));
        };
        cargarCaracteristicas();
    }, []);

    useEffect(() => {
        const cargarDatosDelDia = async () => {
          const inicioDelDia = new Date();
          inicioDelDia.setHours(0, 0, 0, 0);
          const { data, error } = await supabase.from('datos_financieros').select('*').gte('created_at', inicioDelDia.toISOString()).order('created_at', { ascending: false });
          if (error) setEstado(`Error: ${error.message}`);
          else if (data && data.length > 0) {
            setDatosHistoricos(data);
            setEstado('Datos actualizados');
          } else setEstado('Esperando los primeros datos del día...');
        };
        cargarDatosDelDia();
        const channel = supabase.channel('custom-all-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'datos_financieros' }, () => cargarDatosDelDia()).subscribe();
        return () => { supabase.removeChannel(channel) };
    }, []);
    
    // CORRECCIÓN: Usamos nuestro nuevo tipo preciso
    const handleFiltroChange = (columna: FilterableColumn, valor: string) => {
        setFiltros(prev => ({ ...prev, [columna]: valor }));
    };

    const datosCompletos: Bono[] = useMemo(() => {
        if (datosHistoricos.length > 0 && datosHistoricos[0].datos && caracteristicasMap.size > 0) {
            return datosHistoricos[0].datos.map((bono: any) => ({
                ...bono, ...(caracteristicasMap.get(bono.ticker) || {}),
            }));
        }
        return [];
    }, [datosHistoricos, caracteristicasMap]);

    const datosParaTabla = useMemo(() => {
        const datosDeSegmento = datosCompletos.filter(b => b.segmento === 'ON');
        if (Object.values(filtros).every(v => !v)) {
            return datosDeSegmento.sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
        }

        return datosDeSegmento.filter(bono => {
            return (Object.entries(filtros) as [FilterableColumn, string][]).every(([key, filterValue]) => {
                if (!filterValue) return true;

                // CORRECCIÓN: Ahora `key` es del tipo correcto, por lo que el acceso es seguro.
                const config = columnConfig[key];
                const cellValue = bono[key];
                
                if (cellValue === null || cellValue === undefined) return false;
                
                switch (config.type) {
                    // ... (la lógica de switch no cambia)
                    case 'number':
                        let numericValue = Number(cellValue);
                        if (config.isPercentage) numericValue *= 100;
                        if (filterValue.includes('-')) {
                            const [min, max] = filterValue.split('-').map(parseFloat);
                            return numericValue >= (min || -Infinity) && numericValue <= (max || Infinity);
                        }
                        const match = filterValue.match(/^(>=|<=|>|<)?\s*(-?\d+\.?\d*)$/);
                        if (match) {
                            const [, operator, numStr] = match;
                            const num = parseFloat(numStr);
                            switch (operator) {
                                case '>': return numericValue > num;
                                case '<': return numericValue < num;
                                case '>=': return numericValue >= num;
                                case '<=': return numericValue <= num;
                                default: return numericValue === num;
                            }
                        }
                        return String(numericValue).toLowerCase().includes(filterValue.toLowerCase());

                    case 'date':
                        const cellDate = new Date(cellValue as string);
                        cellDate.setHours(0, 0, 0, 0);
                        if (filterValue.includes('-')) {
                            const [startStr, endStr] = filterValue.split('-').map(s => s.trim());
                            const [startDay, startMonth, startYear] = startStr.split('/').map(Number);
                            const [endDay, endMonth, endYear] = endStr.split('/').map(Number);
                            if (!startDay || !endDay) return false;
                            const startDate = new Date(startYear, startMonth - 1, startDay);
                            const endDate = new Date(endYear, endMonth - 1, endDay);
                            return cellDate >= startDate && cellDate <= endDate;
                        }
                        const [day, month, year] = filterValue.split('/').map(Number);
                        if (!day || !month || !year) return false;
                        const filterDate = new Date(year, month - 1, day);
                        return cellDate.getTime() === filterDate.getTime();

                    case 'text':
                    default:
                        return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
                }
            });
        }).sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    }, [datosCompletos, filtros]);

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
                    {datosHistoricos.length > 0 && ( <span style={{ marginLeft: '1rem' }}>Última act: <strong>{new Date(datosHistoricos[0].created_at).toLocaleTimeString()}</strong></span> )}
                </div>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '1.5rem' }}>
                    <div style={{ padding: '0 10px', marginBottom: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Filtrar por Días al Vencimiento:</label>
                        <Slider range min={0} max={maxDiasDelSegmento > 0 ? maxDiasDelSegmento : 1} value={rangoDias} onChange={(value) => setRangoDias(value as [number, number])} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                            <span style={{ fontSize: '12px' }}>{rangoDias[0]} días</span>
                            <span style={{ fontSize: '12px' }}>{maxDiasDelSegmento} días</span>
                        </div>
                    </div>
                      <CurvaRendimientoChart data={datosParaGrafico} segmentoActivo="ON" xAxisKey="dias_vto" /> 
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                    <TablaGeneral 
                        titulo="ONs HD" 
                        datos={datosParaTabla}
                        filtros={filtros}
                        onFiltroChange={handleFiltroChange}
                    />
                </div>
            </div>
        </Layout>
    );
}