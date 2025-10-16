'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
// MODIFICADO: Se importa el Layout principal, que ahora se encargará del Sidebar y Header.
import Layout from '@/components/layout/Layout';

// --- DEFINICIÓN DEL TIPO PARA TYPESCRIPT ---
type Bono = {
    t: string;
    vto: string;
    p: number | null;
    tir: number;
    tna: number | null;
    tem: number | null;
    v: number;
    s: string;
    pd: number | null;
    RD: number | null;
    ua: string | null;
};

// --- TIPO PARA LOS DATOS DE TIPO DE CAMBIO ---
type TipoDeCambio = {
    valor_ccl: number;
    valor_mep: number;
    h: string;
};

// --- CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// --- FUNCIONES AUXILIARES DE FORMATO ---
const formatValue = (value: number | null | undefined, unit: string = '%', decimals: number = 2): string => {
    if (value === null || typeof value === 'undefined' || !isFinite(value)) return '-';
    const numeroAFormatear = value * (unit === '%' ? 100 : 1);
    const numeroFormateado = numeroAFormatear.toLocaleString('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return `${numeroFormateado}${unit}`;
};

const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = toZonedTime(dateString, 'UTC');
    return format(date, 'dd/MM/yy');
};

const formatTimestamp = (isoString: string | null): string => {
    if (!isoString) return '...';
    const timeZone = 'America/Argentina/Buenos_Aires';
    const utcDate = new Date(isoString);
    const zonedDate = toZonedTime(utcDate, timeZone);
    return format(zonedDate, 'dd/MM/yyyy HH:mm:ss');
};

const slugify = (text: string): string => {
    return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};


// --- COMPONENTES DE LA INTERFAZ DE USUARIO (UI) ---

const InfoCard = ({ title, value }: { title: string, value: number | null | undefined }) => {
    const formattedValue = value ? `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Cargando...';
    return (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 6px 10px rgba(0,0,0,0.05)', textAlign: 'center', flex: 1, minWidth: '300px' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#6b7280', fontWeight: 500 }}>{title}</h3>
            <p style={{ margin: '1rem 0 0', fontSize: '2.5rem', fontWeight: 700, color: '#111827' }}>{formattedValue}</p>
        </div>
    );
};

const TablaGeneral = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => {
    return (
        <div id={slugify(titulo)} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 6px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <h2 style={{ fontSize: '1.75rem', padding: '1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>{titulo}</h2>
            <div style={{ overflowX: 'auto', maxHeight: 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#021751', color: 'white' }}>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Ticker</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Vto</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Precio</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Var</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>TIR</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>TNA</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>TEM</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>RD</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length > 0 ? (
                            datos.map((item, index) => (
                                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', fontWeight: 500, color: '#4b5563' }}>{item.t}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatDate(item.vto)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.p, '', 2)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: item.v >= 0 ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{formatValue(item.v)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.tir)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.tna)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.tem)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.RD)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={8} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '1.1rem' }}>Cargando datos...</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TablaSoberanosYONs = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => {
    return (
        <div id={slugify(titulo)} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 6px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <h2 style={{ fontSize: '1.75rem', padding: '1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>{titulo}</h2>
            <div style={{ overflowX: 'auto', maxHeight: 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#021751', color: 'white' }}>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Ticker</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Vto</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Precio</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Var</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>TIR</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '1.1rem' }}>Paridad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length > 0 ? (
                            datos.map((item, index) => (
                                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', fontWeight: 500, color: '#4b5563' }}>{item.t}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatDate(item.vto)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.p, '', 2)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: item.v >= 0 ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{formatValue(item.v)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.tir)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.pd, '', 2)}</td>
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '1.1rem' }}>Cargando datos...</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- ELIMINADO: Los componentes Sidebar, Header y Layout ahora se importan ---

// --- COMPONENTE DE CONTENIDO DE LA PÁGINA ---
const FinancialDashboard = () => {
    const [bonos, setBonos] = useState<Bono[]>([]);
    const [estado, setEstado] = useState('Cargando...');
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
    const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio | null>(null);

    const gruposDeSegmentos = {
        'LECAPs y Similares': ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'],
        'Bonares y Globales': ['BONAR', 'GLOBAL', 'BOPREAL'],
    };

    useEffect(() => {
        const segmentosRequeridos = Object.values(gruposDeSegmentos).flat();
        const fetchInitialData = async () => {
            setEstado('Actualizando datos...');
            const manana = new Date();
            manana.setDate(manana.getDate() + 1);
            const columnasNecesarias = 't, vto, p, tir, tna, tem, v, s, pd, RD';
            const { data: bonosData, error: bonosError } = await supabase.from('latest_bonds').select(columnasNecesarias).gte('vto', manana.toISOString()).in('s', segmentosRequeridos);
            if (bonosError) {
                setEstado(`Error al cargar bonos: ${bonosError.message}`);
                console.error("Error fetching bonds:", bonosError);
            } else if (bonosData) {
                setBonos(bonosData as Bono[]);
            }
            const { data: tipoDeCambioData, error: tipoDeCambioError } = await supabase.from('tipodecambio').select('datos').order('created_at', { ascending: false }).limit(1).single();
            if (tipoDeCambioError) {
                console.error('Error al obtener tipo de cambio:', tipoDeCambioError);
            } else if (tipoDeCambioData) {
                setTipoDeCambio(tipoDeCambioData.datos);
                setUltimaActualizacion(tipoDeCambioData.datos.h);
            }
            setEstado('Datos cargados. Escuchando actualizaciones...');
        };
        const setupSuscripciones = () => {
             const realtimeFilter = `s=in.(${segmentosRequeridos.map(s => `"${s}"`).join(',')})`;
             supabase.channel('realtime-datosbonos').on('postgres_changes', { event: '*', schema: 'public', table: 'datosbonos', filter: realtimeFilter }, (payload) => {
                   const bonoActualizado = payload.new as Bono;
                   setBonos(bonosActuales => {
                       const existe = bonosActuales.some(b => b.t === bonoActualizado.t);
                       if (existe) {
                           return bonosActuales.map(b => b.t === bonoActualizado.t ? bonoActualizado : b);
                       }
                       return [...bonosActuales, bonoActualizado]; 
                   });
               }).subscribe();
             supabase.channel('tipodecambio-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tipodecambio' }, (payload) => {
                   if (payload.new && payload.new.datos) {
                       setTipoDeCambio(payload.new.datos);
                       setUltimaActualizacion(payload.new.datos.h);
                   }
               }).subscribe();
        };
        fetchInitialData();
        setupSuscripciones();
        const handleVisibilityChange = () => {
            if (document.hidden) {
                supabase.removeAllChannels();
            } else {
                fetchInitialData();
                setupSuscripciones();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            supabase.removeAllChannels();
        };
    }, []);

    const ordenarPorVencimiento = (datos: Bono[]) => {
        return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    };

    const tablaLecaps = ordenarPorVencimiento(bonos.filter(b => gruposDeSegmentos['LECAPs y Similares'].includes(b.s)));
    const tablaBonares = ordenarPorVencimiento(bonos.filter(b => gruposDeSegmentos['Bonares y Globales'].includes(b.s)));

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '1.25rem', marginBottom: '2rem' }}>
                <span>Estado: <strong>{`Actualizado el ${formatTimestamp(ultimaActualizacion)}`}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: '0 0 350px' }}>
                    <InfoCard title="Dólar MEP" value={tipoDeCambio?.valor_mep} />
                    <InfoCard title="Dólar CCL" value={tipoDeCambio?.valor_ccl} />
                </div>
                <div style={{ flex: 1 }}>
                    <TablaGeneral titulo="LECAPs y Similares" datos={tablaLecaps} />
                </div>
                <div style={{ flex: 1 }}>
                    <TablaSoberanosYONs titulo="Bonares y Globales" datos={tablaBonares} />
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL QUE ENSAMBLA LA PÁGINA ---
export default function HomePage() {
    return (
        <Layout>
            <FinancialDashboard />
        </Layout>
    );
}
