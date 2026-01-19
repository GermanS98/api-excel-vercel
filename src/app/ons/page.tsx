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
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';

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
    titulo, datos, filtros, onFiltroChange, sortConfig, onSort
}: {
    titulo: string, datos: Bono[], filtros: { [key: string]: string },
    onFiltroChange: (columna: FilterableColumn, valor: string) => void,
    sortConfig: { key: FilterableColumn | null, direction: 'asc' | 'desc' },
    onSort: (key: FilterableColumn) => void
}) => {
    const getPlaceholder = (columna: FilterableColumn) => {
        const type = columnConfig[columna]?.type || 'text';
        if (type === 'number') return "Ej: >50, 10-20";
        if (type === 'date') return "dd/mm/yyyy";
        return `Filtrar...`;
    };

    const handleDownloadCSV = () => {
        if (!datos.length) return;

        // 1. Cabeceras
        const headers = Object.keys(columnConfig) as FilterableColumn[];
        const headerLabels = headers.map(key => columnConfig[key].label).join(';');

        // 2. Filas
        const rows = datos.map(item => {
            return headers.map(key => {
                const val = item[key as keyof Bono];
                if (val === null || val === undefined) return '';
                // Formatear fechas y números para Excel local (punto/coma según locale, aqui forzamos string simple)
                if (columnConfig[key].type === 'date') return formatDate(String(val));
                if (columnConfig[key].type === 'number') {
                    let num = Number(val);
                    if (columnConfig[key].isPercentage) num = num * 100;
                    // Reemplazar punto por coma para Excel en español si es necesario, 
                    // pero el estándar CSV suele usar punto. Usaremos toLocaleString con es-AR
                    return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\./g, '');
                    // Hack simple: toLocaleString 'es-AR' usa coma decimal y punto de miles. 
                    // CSV delimitado por punto y coma (;) prefiere coma decimal.
                }
                return String(val).replace(/;/g, ','); // Escapar separadores
            }).join(';');
        }).join('\n');

        const csvContent = "\uFEFF" + headerLabels + '\n' + rows; // BOM para UTF-8 en Excel
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'ons_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{titulo}</h2>
                <button
                    onClick={handleDownloadCSV}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#00C600',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '0.9rem'
                    }}
                >
                    Descargar Excel
                </button>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr style={{ background: '#021751', color: 'white' }}>
                            {(Object.keys(columnConfig) as FilterableColumn[]).map(key => (
                                <th
                                    key={key}
                                    onClick={() => onSort(key)}
                                    style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {columnConfig[key].label}
                                        {sortConfig.key === key && (
                                            <span style={{ fontSize: '0.8em' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                        )}
                                        {sortConfig.key !== key && <span style={{ fontSize: '0.8em', opacity: 0.3 }}>⇅</span>}
                                    </div>
                                </th>
                            ))}
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
                                                    // Color condicional para 'v' (Var)
                                                    color: key === 'v'
                                                        ? (Number(item.v) > 0 ? '#16a34a' : (Number(item.v) < 0 ? '#dc2626' : '#4b5563'))
                                                        : '#4b5563',
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
    const [sortConfig, setSortConfig] = useState<{ key: FilterableColumn | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    const segmentosDeEstaPagina = ['ON'];
    const segmentoActivo = segmentosDeEstaPagina[0];

    // Manejador de ordenamiento
    const handleSort = (key: FilterableColumn) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

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
                // Buscar update más reciente
                if (bonosData.length > 0) {
                    const maxUA = bonosData.reduce((latestUA, bono) => {
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

    const datosFiltradosBase = useMemo(() => {
        let filtrados = datosCompletos;

        if (Object.values(filtros).some(v => v)) {
            filtrados = datosCompletos.filter(bono => {
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

                            // 1. Rango numérico (Ej: 10-20)
                            if (filterValue.includes('-')) {
                                const [min, max] = filterValue.split('-').map(s => parseFloat(s.trim()));
                                return numericValue >= (min || -Infinity) && numericValue <= (max || Infinity);
                            }

                            // 2. Operadores (Ej: >10, <=50)
                            const matchNum = filterValue.match(/^(>=|<=|>|<)?\s*(-?\d+\.?\d*)$/);
                            if (matchNum) {
                                const [, operator, numStr] = matchNum;
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
                            if (!cellValue) return false;
                            const cellDateObj = new Date(cellValue as string);
                            // Comparar solo fecha (medianoche)
                            const cellTime = new Date(cellDateObj.getFullYear(), cellDateObj.getMonth(), cellDateObj.getDate()).getTime();

                            const parseUserDate = (str: string) => {
                                const parts = str.trim().split('/');
                                if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
                                return null;
                            };

                            // Rango Fecha (01/01/2025-01/02/2025)
                            if (filterValue.includes('-')) {
                                const [startStr, endStr] = filterValue.split('-').map(s => s.trim());
                                const startT = parseUserDate(startStr);
                                const endT = parseUserDate(endStr);
                                if (!startT || !endT || isNaN(startT) || isNaN(endT)) return false;
                                return cellTime >= startT && cellTime <= endT;
                            }

                            // Operadores Fecha (> 01/01/2025)
                            const matchDate = filterValue.match(/^(>=|<=|>|<)?\s*(\d{1,2}\/\d{1,2}\/\d{4})$/);
                            if (matchDate) {
                                const [, operator, dateStr] = matchDate;
                                const targetTime = parseUserDate(dateStr);
                                if (!targetTime || isNaN(targetTime)) return false;
                                switch (operator) {
                                    case '>': return cellTime > targetTime;
                                    case '<': return cellTime < targetTime;
                                    case '>=': return cellTime >= targetTime;
                                    case '<=': return cellTime <= targetTime;
                                    default: return cellTime === targetTime;
                                }
                            }

                            // Búsqueda exacta simplificada
                            if (filterValue.includes('/')) {
                                const parts = filterValue.split('/');
                                if (parts.length === 3) {
                                    const filterTime = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
                                    return cellTime === filterTime;
                                }
                            }
                            // Fallback texto
                            return String(cellValue).includes(filterValue);

                        case 'text':
                        default:
                            return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
                    }
                });
            });
        }
        return filtrados;
    }, [datosCompletos, filtros]);

    const maxDiasDelSegmento = useMemo(() => {
        if (datosCompletos.length === 0) return 1000;
        const maxDias = Math.max(...datosCompletos.map(b => b.dv));
        return isFinite(maxDias) ? maxDias : 1000;
    }, [datosCompletos]);

    useEffect(() => {
        if (maxDiasDelSegmento > 0) setRangoDias([0, maxDiasDelSegmento]);
    }, [maxDiasDelSegmento]);

    // 1. Filtrado de Slider (Común)
    const datosFiltradosPorDias = useMemo(() => {
        return datosFiltradosBase.filter(b => b.dv >= rangoDias[0] && b.dv <= rangoDias[1]);
    }, [datosFiltradosBase, rangoDias]);

    // 2. Datos Tabla (Ordenados por Config)
    const datosParaTabla = useMemo(() => {
        const sorted = [...datosFiltradosPorDias];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sorted;
    }, [datosFiltradosPorDias, sortConfig]);

    // 3. Datos Gráfico (Ordenados por Ticker)
    const datosParaGrafico = useMemo(() => {
        const sorted = [...datosFiltradosPorDias].sort((a, b) => a.t.localeCompare(b.t));
        return sorted.map(b => {
            const tirFormatted = typeof b.tir === 'number' && isFinite(b.tir) ? `${(b.tir * 100).toFixed(1)}%` : '';
            return {
                ...b,
                formattedLabel: `${b.t}|${tirFormatted}`
            };
        });
    }, [datosFiltradosPorDias]);


    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '1rem' }}>Curva de Rendimiento: Obligaciones Negociables</h1>
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
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '1.5rem', position: 'relative' }}>
                    <div style={{ marginBottom: '20px', padding: '0 20px' }}>
                        <p style={{ marginBottom: '5px', fontWeight: 500 }}>Filtrar por Días al Vencimiento:</p>
                        <Slider
                            range
                            min={0}
                            max={maxDiasDelSegmento}
                            value={rangoDias}
                            onChange={(val) => setRangoDias(val as [number, number])}
                            trackStyle={[{ backgroundColor: '#1036E2' }]}
                            handleStyle={[{ borderColor: '#1036E2' }, { borderColor: '#1036E2' }]}
                            railStyle={{ backgroundColor: '#e5e7eb' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.9rem', color: '#555' }}>
                            <span>{rangoDias[0]} días</span>
                            <span>{rangoDias[1]} días</span>
                        </div>
                    </div>

                    <CurvaRendimientoChart
                        data={datosParaGrafico}
                        segmentoActivo={segmentoActivo}
                        xAxisKey="dv"
                        labelKey="formattedLabel"
                    />
                    <img
                        src="/vetacap_logo.svg"
                        alt="Veta Capital"
                        style={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '20px',
                            height: '40px',
                            opacity: 0.8,
                            pointerEvents: 'none'
                        }}
                    />
                </div>

                <div style={{ margin: '1rem 0', padding: '0.75rem 1rem', background: '#e0f7fa', borderLeft: '5px solid #00bcd4', borderRadius: '4px', color: '#006064', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span style={{ marginRight: '8px' }}>ⓘ</span>
                    El fondo <strong>celeste</strong> en el precio indica que se utilizó el <strong>Cierre Anterior</strong> en lugar del Último Precio.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                    <TablaGeneral
                        titulo="Obligaciones Negociables"
                        datos={datosParaTabla}
                        filtros={filtros}
                        onFiltroChange={handleFiltroChange}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                </div>
            </div>
        </Layout>
    );
}
