'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip,
    CartesianGrid, Scatter, Line, LabelList, Cell, ZAxis
} from 'recharts';
import { linearRegression } from 'simple-statistics';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
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
    // --- Campos de 'caracteristicas' (opcionales) ---
    ley?: string;
    mpago?: string;   // monedadepago
    frec?: string;
    lmin?: string;
    nom?: string;     // cantnominales
    amort?: string;   // tipoamort
    nomb?: string;    // nombre
    ua?: string | null; // ultimo_anuncio
    pc: boolean; // indica se si el precio es Cierre Anterior
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
    nomb: { label: 'Nombre', type: 'text' },
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
    const date = toZonedTime(dateString, 'UTC');
    return format(date, 'dd/MM/yy');
};
const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
        const date = parseISO(dateString);
        return format(date, 'dd/MM/yy HH:mm:ss');
    } catch (e) {
        return 'Fecha inv.';
    }
};

// ==================================================================
// GRÁFICO LOCAL ONS2 CON ETIQUETAS EN DOS LÍNEAS (TICKER + TIR)
// ==================================================================
const CustomLabelONS2 = (props: any) => {
    const { x, y, index, payload } = props;
    const yOffset = index % 2 === 0 ? -12 : 22;

    const ticker = payload?.t || '';
    const tir = payload?.tir;
    const tirText = typeof tir === 'number' && isFinite(tir)
        ? `${(tir * 100).toFixed(1)}%`
        : '';

    return (
        <text x={x} y={y + yOffset} textAnchor="middle" fill="#555" fontSize={9}>
            <tspan x={x} dy={0}>{ticker}</tspan>
            <tspan x={x} dy={10} fontWeight="bold">{tirText}</tspan>
        </text>
    );
};

const calcularTendenciaONS2 = (datos: any[]) => {
    if (datos.length < 2) return [];
    const regressionPoints = datos
        .filter((p: any) => p.dv > 0 && typeof p.tir === 'number' && isFinite(p.tir))
        .map((p: any) => [Math.log(p.dv), p.tir]);
    if (regressionPoints.length < 2) return [];
    const { m, b } = linearRegression(regressionPoints);
    const uniqueXPoints = [...new Set(datos.map((p: any) => p.dv).filter((d: number) => d > 0))].sort((a: number, b: number) => a - b);
    return uniqueXPoints.map((x: number) => ({ dv: x, trend: m * Math.log(x) + b }));
};

const ONS2Chart = ({ data }: { data: any[] }) => {
    const CustomTooltipONS2 = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            if (!d.t) return null;
            return (
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc',
                    padding: '10px', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{`Ticker: ${d.t}`}</p>
                    <p style={{ margin: 0, color: '#666' }}>{`TIR: ${(d.tir * 100).toFixed(2)}%`}</p>
                    <p style={{ margin: 0, color: '#666' }}>{`Días al Vto: ${d.dv}`}</p>
                </div>
            );
        }
        return null;
    };

    const trendline = calcularTendenciaONS2(data);

    return (
        <div style={{ width: '100%', height: 450, userSelect: 'none' }}>
            <ResponsiveContainer>
                <ComposedChart margin={{ top: 30, right: 30, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        type="number"
                        dataKey="dv"
                        name="Días al Vencimiento"
                        tick={{ fontSize: 12 }}
                        domain={['dataMin', 'dataMax']}
                        allowDuplicatedCategory={false}
                        tickFormatter={(tick: number) => tick.toFixed(0)}
                    />
                    <YAxis
                        type="number"
                        dataKey="tir"
                        name="TIR"
                        tickFormatter={(tick: number) => `${(tick * 100).toFixed(0)}%`}
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 12 }}
                        width={80}
                    />
                    <Tooltip content={<CustomTooltipONS2 />} />
                    <ZAxis type="number" range={[25, 25]} />
                    <Scatter data={data}>
                        <LabelList dataKey="t" content={CustomLabelONS2} />
                        {data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill="#1036E2" />
                        ))}
                    </Scatter>
                    <Line
                        data={trendline}
                        dataKey="trend"
                        stroke="#1036E2"
                        dot={false}
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        type="monotone"
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
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
                        <tr style={{ background: '#021751', color: 'white' }}>
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
                                            if (!config) return <td key={`${item.t}-${key}`}>-</td>; // Safety check

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
                                        return (
                                            <td
                                                key={`${item.t}-${key}`}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    textAlign: 'center',
                                                    // --- ÚNICO CAMBIO REQUERIDO: Fondo celeste condicional ---
                                                    backgroundColor: (key === 'p' && item.pc) ? '#e0f7fa' : 'transparent',
                                                    // El color del texto se mantiene como el original (o lo forzamos si es necesario)
                                                    color: '#4b5563',
                                                }}
                                            >
                                                {displayValue}
                                            </td>
                                        );
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
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
    const segmentosDeEstaPagina = ['ON'];

    useEffect(() => {
        const cargarCaracteristicas = async () => {
            const { data, error } = await supabase
                .from('caracteristicas')

                .select('t:ticker, ley, mpago, frec, lmin, nom, amort, nomb')
                .in('segmento', segmentosDeEstaPagina);

            if (error) {
                console.error("Error al cargar características:", error);
            } else if (data) {
                setCaracteristicasMap(new Map(data.map(item => [item.t, item])));
            }
        };
        cargarCaracteristicas();
    }, []);

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    useEffect(() => {
        const segmentosRequeridos = segmentosDeEstaPagina;
        const fetchInitialData = async () => {
            const manana = new Date();
            manana.setDate(manana.getDate() + 1);
            const columnasNecesarias = 't,vto,p,tir,tna,tem,v,s,pd,RD,dv,ua,md,pc';

            const { data: bonosData, error: bonosError } = await supabase.from('latest_bonds').select(columnasNecesarias).gte('vto', manana.toISOString()).in('s', segmentosRequeridos);
            if (bonosError) console.error("Error fetching bonds:", bonosError);
            else if (bonosData) {
                setBonos(bonosData as Bono[]);
                if (bonosData.length > 0) {
                    // Encuentra el UA más reciente entre todos los bonos cargados
                    const maxUA = bonosData.reduce((latestUA, bono) => {
                        // ... lógica para encontrar maxUA ...
                        if (!bono.ua) return latestUA;
                        if (!latestUA || new Date(bono.ua) > new Date(latestUA)) {
                            return bono.ua;
                        }
                        return latestUA;
                    }, null as string | null);

                    setUltimaActualizacion(maxUA);
                }
                setEstado('Datos cargados');
            }
        };

        let bondChannel: any = null;
        const setupSuscripciones = () => {
            const realtimeFilter = `s=in.(${segmentosRequeridos.map(s => `"${s}"`).join(',')})`;
            const bondChannel = supabase.channel('realtime-datosbonos').on('postgres_changes', { event: '*', schema: 'public', table: 'datosbonos', filter: realtimeFilter }, payload => {
                const bonoActualizado = payload.new as Bono;
                setBonos(bonosActuales => {
                    const existe = bonosActuales.some(b => b.t === bonoActualizado.t);
                    return existe ? bonosActuales.map(b => b.t === bonoActualizado.t ? bonoActualizado : b) : [...bonosActuales, bonoActualizado];
                });
                setUltimaActualizacion(bonoActualizado.ua || null);
            }).subscribe();

            return { bondChannel };
        };

        fetchInitialData();
        const sub = setupSuscripciones();
        bondChannel = sub.bondChannel;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
            } else {
                fetchInitialData();
                if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
                const sub = setupSuscripciones();
                bondChannel = sub.bondChannel;
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (bondChannel) {
                if (bondChannel.unsubscribe) bondChannel.unsubscribe();
                else supabase.removeChannel(bondChannel);
            }
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

    // Datos filtrados por el rango de días (slider)
    const datosFiltradosPorDias = datosParaTabla.filter(b => b.dv >= rangoDias[0] && b.dv <= rangoDias[1]);

    // Datos para el gráfico con formattedLabel para etiquetas de dos líneas
    const datosParaGrafico = datosFiltradosPorDias.map(b => {
        const tirFormatted = typeof b.tir === 'number' && isFinite(b.tir) ? `${(b.tir * 100).toFixed(1)}%` : '';
        return {
            ...b,
            formattedLabel: `${b.t}|${tirFormatted}`
        };
    });

    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Curva de Rendimiento: Obligaciones Negociables</h1>
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                    {ultimaActualizacion && estado !== 'Cargando instrumentos...' ? (
                        <span style={{ color: '#374151', fontWeight: 500 }}>
                            Estado: <strong>Actualizado el {formatDateTime(ultimaActualizacion)}</strong>
                        </span>
                    ) : (
                        <span>Estado: <strong>{estado}</strong></span>
                    )}
                    {/* ------------------------- */}
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
                    <CurvaRendimientoChart
                        data={datosParaGrafico}
                        segmentoActivo={segmentoActivo}
                        xAxisKey="dv"
                        labelKey="formattedLabel"
                    />
                </div>

                <div style={{ margin: '1rem 0', padding: '0.75rem 1rem', background: '#e0f7fa', borderLeft: '5px solid #00bcd4', borderRadius: '4px', color: '#006064', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span style={{ marginRight: '8px' }}>ⓘ</span>
                    El fondo <strong>celeste</strong> en el precio indica que se utilizó el <strong>Cierre Anterior</strong> en lugar del Último Precio.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                    <TablaGeneral
                        titulo="Obligaciones Negociables"
                        datos={datosFiltradosPorDias}
                        filtros={filtros}
                        onFiltroChange={handleFiltroChange}
                    />
                </div>
            </div>
        </Layout>
    );
}



