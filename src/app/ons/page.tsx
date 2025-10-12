'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

// ==================================================================
// DEFINICIÓN DE TIPOS
// ==================================================================
type Bono = {
  t: string;       // ticker
  vto: string;
  p: number | null;  // precio
  v: number;       // var
  tir: number;
  s: string;       // segmento
  dv: number;      // dias_vto
  pd: number;      // paridad
  md: number | null; // modify_duration
  RD: number | null;
  dm: number | null; // duracion_macaulay
  // --- Campos de 'caracteristicas' (opcionales) ---
  ley?: string;
  mpago?: string;   // monedadepago
  frec?: string;
  lmin?: string;
  nom?: string;     // cantnominales
  amort?: string;   // tipoamort
};

// Objeto de configuración para la tabla dinámica (CORREGIDO con nombres cortos)
const columnConfig: Record<string, { label: string, type: 'text' | 'date' | 'number', isPercentage?: boolean }> = {
    t: { label: 'Ticker', type: 'text' },
    vto: { label: 'Vto', type: 'date' },
    p: { label: 'Precio', type: 'number' },
    v: { label: 'Var', type: 'number', isPercentage: true },
    tir: { label: 'TIR', type: 'number', isPercentage: true },
    pd: { label: 'Paridad', type: 'number' },
    md: { label: 'MD', type: 'number' },
    ley: { label: 'Ley', type: 'text' },
    mpago: { label: 'Moneda', type: 'text' },
    frec: { label: 'Frec.', type: 'text' },
    lmin: { label: 'L. Mín', type: 'text' },
    nom: { label: 'Nominales', type: 'text' },
    amort: { label: 'Amort.', type: 'text' },
};

type FilterableColumn = keyof typeof columnConfig;

// ==================================================================
// CONFIGURACIONES GLOBALES
// ==================================================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// ==================================================================
// FUNCIONES AUXILIARES
// ==================================================================
const formatValue = (value: number | null | undefined, unit: string = '', decimals: number = 2) => {
    if (value === null || typeof value === 'undefined' || !isFinite(value)) return '-';
    const numeroAFormatear = unit === '%' ? value * 100 : value;
    return `${numeroAFormatear.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${unit}`;
};
const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// ==================================================================
// COMPONENTE TablaGeneral (Actualizado para nombres cortos)
// ==================================================================
const TablaGeneral = ({
    titulo, datos, filtros, onFiltroChange
}: {
    titulo: string, datos: Bono[], filtros: { [key: string]: string },
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
                            datos.map(item => (
                                <tr key={item.t} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    {(Object.keys(columnConfig) as (keyof Bono)[]).map(key => {
                                        const value = item[key];
                                        let displayValue: React.ReactNode = '-';
                                        if (value !== null && value !== undefined) {
                                            const config = columnConfig[key];
                                            if(!config) return <td key={`${item.t}-${key}`}>-</td>; // Safety check

                                            if (config.type === 'date') {
                                                displayValue = formatDate(String(value));
                                            } else if (config.type === 'number') {
                                                displayValue = formatValue(Number(value), config.isPercentage ? '%' : '', 2);
                                            } else {
                                                if (key === 'nom') {
                                                    const numero = parseInt(String(value), 10);
                                                    displayValue = formatValue(numero, '', 0);
                                                } else {
                                                    displayValue = String(value);
                                                }
                                            }
                                        }
                                        return <td key={`${item.t}-${key}`} style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{displayValue}</td>;
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

// ==================================================================
// COMPONENTE PRINCIPAL onspage
// ==================================================================
export default function Onspage() {
    const [bonos, setBonos] = useState<Bono[]>([]);
    const [caracteristicasMap, setCaracteristicasMap] = useState<Map<string, any>>(new Map());
    const [estado, setEstado] = useState('Cargando...');
    const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);
    const [filtros, setFiltros] = useState<{ [key: string]: string }>({});
    
    const segmentosDeEstaPagina = ['ON'];

    useEffect(() => {
        const cargarCaracteristicas = async () => {
            const { data, error } = await supabase
                .from('caracteristicas')
                // CORRECCIÓN: Renombrar 'ticker' a 't' y usar 'segmento' para el filtro
                .select('t:ticker, ley, mpago, frec, lmin, nom, amort')
                .in('segmento', segmentosDeEstaPagina); 

            if (error) {
                console.error("Error al cargar características:", error);
            } else if (data) {
                setCaracteristicasMap(new Map(data.map(item => [item.t, item])));
            }
        };
        cargarCaracteristicas();
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setEstado('Cargando instrumentos...');
            const manana = new Date();
            manana.setDate(manana.getDate() + 1);

            const { data, error } = await supabase
                .from('datosbonos')
                .select('*')
                .in('s', segmentosDeEstaPagina)
                .gte('vto', manana.toISOString());

            if (error) {
                setEstado(`Error al cargar datos: ${error.message}`);
            } else if (data) {
                setBonos(data as Bono[]);
                setEstado('Datos cargados. Escuchando actualizaciones...');
            }
        };

        fetchInitialData();

        const channel = supabase
            .channel('realtime-ons-page')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'datosbonos', filter: `s=in.(${segmentosDeEstaPagina.map(s => `'${s}'`).join(',')})` },
                (payload) => {
                    const bonoActualizado = payload.new as Bono;
                    setBonos(bonosActuales => {
                        if (new Date(bonoActualizado.vto) < new Date()) {
                            return bonosActuales.filter(b => b.t !== bonoActualizado.t);
                        }
                        const existe = bonosActuales.some(b => b.t === bonoActualizado.t);
                        if (existe) {
                            return bonosActuales.map(b => b.t === bonoActualizado.t ? bonoActualizado : b);
                        } else {
                            return [...bonosActuales, bonoActualizado];
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const datosCompletos = useMemo(() => {
        if (bonos.length === 0 || caracteristicasMap.size === 0) {
            return bonos;
        }
        return bonos.map(bono => ({
            ...bono,
            ...(caracteristicasMap.get(bono.t) || {})
        }));
    }, [bonos, caracteristicasMap]);

    const handleFiltroChange = (columna: FilterableColumn, valor: string) => {
        setFiltros(prev => ({ ...prev, [columna]: valor }));
    };

    const datosParaTabla = useMemo(() => {
        let datosFiltrados = datosCompletos;

        if (Object.values(filtros).some(v => v)) {
            datosFiltrados = datosCompletos.filter(bono => {
                return (Object.entries(filtros) as [FilterableColumn, string][]).every(([key, filterValue]) => {
                    if (!filterValue) return true;
                    const config = columnConfig[key];
                    if (!config) return true; 

                    const cellValue = bono[key as keyof Bono];
                    if (cellValue === null || cellValue === undefined) return false;
                    
                    switch (config.type) {
                        case 'number':
                            let numericValue = Number(cellValue);
                            if (config.isPercentage) numericValue *= 100;
                            if (filterValue.includes('-')) {
                                const [min, max] = filterValue.split('-').map(s => parseFloat(s.trim()));
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
                                const startDate = new Date(startYear, startMonth - 1, startDay);
                                const endDate = new Date(endYear, endMonth - 1, endDay);
                                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
                                return cellDate >= startDate && cellDate <= endDate;
                            }
                            const [day, month, year] = filterValue.split('/').map(Number);
                            if (!day || !month || !year) return false;
                            const filterDate = new Date(year, month - 1, day);
                            if (isNaN(filterDate.getTime())) return false;
                            return cellDate.getTime() === filterDate.getTime();

                        case 'text':
                        default:
                            return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
                    }
                });
            });
        }

        return datosFiltrados.sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    }, [datosCompletos, filtros]);
    
    const maxDiasDelSegmento = useMemo(() => {
        if (datosCompletos.length === 0) return 1000;
        const maxDias = Math.max(...datosCompletos.map(b => b.dv));
        return isFinite(maxDias) ? maxDias : 1000;
    }, [datosCompletos]);

    useEffect(() => {
        if (maxDiasDelSegmento > 0) setRangoDias([0, maxDiasDelSegmento]);
    }, [maxDiasDelSegmento]);
    
    const datosParaGrafico = datosParaTabla.filter(b => b.dv >= rangoDias[0] && b.dv <= rangoDias[1]);

    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Curva de Rendimiento: Obligaciones Negociables</h1>
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                    <span>Estado: <strong>{estado}</strong></span>
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
                    <CurvaRendimientoChart data={datosParaGrafico} segmentoActivo="ON" xAxisKey="dv" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                    <TablaGeneral 
                        titulo="Obligaciones Negociables" 
                        datos={datosParaTabla}
                        filtros={filtros}
                        onFiltroChange={handleFiltroChange}
                    />
                </div>
            </div>
        </Layout>
    );
}



