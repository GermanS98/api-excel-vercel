'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
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
    ua: string | null; // Se mantiene en el tipo por si la DB lo envía, pero no se usará
    cje: number;
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
    return format(zonedDate, 'HH:mm:ss');
};

const slugify = (text: string): string => {
    return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};


// --- COMPONENTES DE UI OPTIMIZADOS PARA TV ---

const InfoCard = ({ title, value }: { title: string, value: number | null | undefined }) => {
    const formattedValue = value ? `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '---';
    return (
        <div style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#6b7280', fontWeight: 500 }}>{title}</h3>
            {/* MODIFICADO: Color del texto cambiado a #021751 */}
            <p style={{ margin: '0.5rem 0 0', fontSize: '1.75rem', fontWeight: 700, color: '#021751' }}>{formattedValue}</p>
        </div>
    );
};

const TablaGeneral = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => {
    const headerCellStyle = {
        padding: '0.75rem',
        textAlign: 'center' as const,
        fontWeight: 600,
        fontSize: '1rem',
        whiteSpace: 'nowrap' as const,
    };
    const dataCellStyle = {
        ...headerCellStyle,
        fontWeight: 500,
        color: '#111827',
        fontSize: '1.3rem', 
    };

    return (
        <div id={slugify(titulo)} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 6px 10px rgba(0,0,0,0.05)', overflow: 'hidden', height: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', padding: '0.75rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0, textAlign: 'center' , fontWeight:'bold'}}>{titulo}</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                </colgroup>
                <thead>
                    {/* MODIFICADO: Estilo de la cabecera cambiado a fondo claro y texto negro */}
                    <tr style={{ background: '#021751', color: 'white', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{...headerCellStyle, textAlign: 'left'}}>Ticker</th>
                        <th style={headerCellStyle}>Vto</th>
                        <th style={headerCellStyle}>Precio</th>
                        <th style={headerCellStyle}>Var</th>
                        <th style={headerCellStyle}>TIR</th>
                        <th style={headerCellStyle}>TNA</th>
                        <th style={headerCellStyle}>TEM</th>
                        <th style={headerCellStyle}>RD</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.length > 0 ? (
                        datos.map((item, index) => (
                            <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                <td style={{...dataCellStyle, textAlign: 'left'}}>{item.t}</td>
                                <td style={dataCellStyle}>{formatDate(item.vto)}</td>
                                <td style={dataCellStyle}>{formatValue(item.p, '', 2)}</td>
                                <td style={{ ...dataCellStyle, color: item.v >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold'}}>{formatValue(item.v)}</td>
                                <td style={dataCellStyle}>{formatValue(item.tir)}</td>
                                <td style={dataCellStyle}>{formatValue(item.tna)}</td>
                                <td style={dataCellStyle}>{formatValue(item.tem)}</td>
                                <td style={dataCellStyle}>{formatValue(item.RD)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={8} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '1.1rem' }}>Cargando datos...</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const TablaSoberanosYONs = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => {
     const headerCellStyle = {
        padding: '0.75rem',
        textAlign: 'center' as const,
        fontWeight: 600,
        fontSize: '1rem',
        whiteSpace: 'nowrap' as const,
    };
    const dataCellStyle = {
        ...headerCellStyle,
        fontWeight: 500,
        color: '#111827',
        fontSize: '1.3rem',
    };

    return (
        <div id={slugify(titulo)} style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 6px 10px rgba(0,0,0,0.05)', overflow: 'hidden', height: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', padding: '0.75rem 1.5rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0, textAlign: 'center' , fontWeight: 'bold'}}>{titulo}</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                    {/* MODIFICADO: Estilo de la cabecera cambiado a fondo claro y texto negro */}
                    <tr style={{ background: '#021751', color: 'white', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{...headerCellStyle, textAlign: 'left'}}>Ticker</th>
                        <th style={headerCellStyle}>Vto</th>
                        <th style={headerCellStyle}>Precio</th>
                        <th style={headerCellStyle}>Var</th>
                        <th style={headerCellStyle}>TIR</th>
                        <th style={headerCellStyle}>Paridad</th>
                        <th style={headerCellStyle}>Canje</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.length > 0 ? (
                        datos.map((item, index) => (
                            <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                <td style={{...dataCellStyle, textAlign: 'left'}}>{item.t}</td>
                                <td style={dataCellStyle}>{formatDate(item.vto)}</td>
                                <td style={dataCellStyle}>{formatValue(item.p, '', 2)}</td>
                                <td style={{ ...dataCellStyle, color: item.v >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold'}}>{formatValue(item.v)}</td>
                                <td style={dataCellStyle}>{formatValue(item.tir)}</td>
                                <td style={dataCellStyle}>{formatValue(item.pd, '', 2)}</td>
                                <td style={dataCellStyle}>{formatValue(item.cje, '%', 2)}</td>
                            </tr>
                        ))
                    ) : (
                         <tr><td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '1.1rem' }}>Cargando datos...</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

const FinancialDashboard = () => {
    const [bonos, setBonos] = useState<Bono[]>([]);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
    const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio | null>(null);

    const gruposDeSegmentos = {
        'Renta fija ars': ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'],
        'Bonares y Globales': ['BONAR', 'GLOBAL', 'BOPREAL'],
    };

    useEffect(() => {
        const segmentosRequeridos = Object.values(gruposDeSegmentos).flat();
        const fetchInitialData = async () => {
            const manana = new Date();
            manana.setDate(manana.getDate() + 1);
            const columnasNecesarias = 't,vto,p,tir,tna,tem,v,s,pd,RD';
            
            const { data: bonosData, error: bonosError } = await supabase.from('latest_bonds').select(columnasNecesarias).gte('vto', manana.toISOString()).in('s', segmentosRequeridos);
            if (bonosError) console.error("Error fetching bonds:", bonosError);
            else if (bonosData) {
                setBonos(bonosData as Bono[]);
            }

            const { data: tipoDeCambioData, error: tipoDeCambioError } = await supabase.from('tipodecambio').select('datos').order('created_at', { ascending: false }).limit(1).single();
            if (tipoDeCambioError) console.error('Error al obtener tipo de cambio:', tipoDeCambioError);
            else if (tipoDeCambioData) {
                setTipoDeCambio(tipoDeCambioData.datos);
                setUltimaActualizacion(tipoDeCambioData.datos.h);
            }
        };
        const setupSuscripciones = () => {
             const realtimeFilter = `s=in.(${segmentosRequeridos.map(s => `"${s}"`).join(',')})`;
             const bondChannel = supabase.channel('realtime-datosbonos').on('postgres_changes', { event: '*', schema: 'public', table: 'datosbonos', filter: realtimeFilter }, payload => {
                   const bonoActualizado = payload.new as Bono;
                   setBonos(bonosActuales => {
                       const existe = bonosActuales.some(b => b.t === bonoActualizado.t);
                       return existe ? bonosActuales.map(b => b.t === bonoActualizado.t ? bonoActualizado : b) : [...bonosActuales, bonoActualizado];
                   });
               }).subscribe();
             const exchangeChannel = supabase.channel('tipodecambio-changes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tipodecambio' }, payload => {
                   if (payload.new && payload.new.datos) {
                       setTipoDeCambio(payload.new.datos);
                       setUltimaActualizacion(payload.new.datos.h);
                   }
               }).subscribe();
            return { bondChannel, exchangeChannel };
        };

        fetchInitialData();
        const { bondChannel, exchangeChannel } = setupSuscripciones();

        const handleVisibilityChange = () => {
            if (document.hidden) supabase.removeAllChannels();
            else {
                fetchInitialData();
                setupSuscripciones();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            supabase.removeChannel(bondChannel);
            supabase.removeChannel(exchangeChannel);
        };
    }, []);

    const ordenarPorVencimiento = (datos: Bono[]) => {
        return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    };

    const tablaLecaps = ordenarPorVencimiento(bonos.filter(b => gruposDeSegmentos['Renta fija ars'].includes(b.s)));
    const tablaBonares = ordenarPorVencimiento(bonos.filter(b => gruposDeSegmentos['Bonares y Globales'].includes(b.s)));

   return (
        <div style={{ padding: '1.5rem 2.5rem', display: 'flex', gap: '1.5rem', height: 'calc(100vh - 65px)', boxSizing: 'border-box' }}>
            
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                flexBasis: '280px', // MODIFICADO: Ancho de la columna aumentado
                flexShrink: 0,
                paddingTop: '2.5rem'
            }}>
                <div style={{ paddingLeft: '0.5rem' }}>
                    <span style={{ color: '#111827', fontSize: '1rem' }}>
                        Actualización: <strong>{formatTimestamp(ultimaActualizacion)}</strong>
                    </span>
                </div>
                <InfoCard title="Dólar MEP" value={tipoDeCambio?.valor_mep} />
                <InfoCard title="Dólar CCL" value={tipoDeCambio?.valor_ccl} />
                
                {/* MODIFICADO: Estilo del contenedor del logo para hacerlo más grande */}
                <div style={{
                    marginTop: 'auto',
                    padding: '1rem 0',
                    margin: 'auto -30px 1rem -30px' // Margen negativo para expandir
                }}>
                    <img
                        src="https://raw.githubusercontent.com/GermanS98/api-excel-vercel/refs/heads/main/VetaCap_Brandpack_Reducida_Positivo-RGB.svg"
                        alt="Logo ResearchCAP"
                        style={{ width: '100%', height: 'auto' , transform: 'translateX(-10%)'}}
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x60?text=Logo'; }}
                    />
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex' }}>
                <TablaGeneral titulo="Renta fija ars" datos={tablaLecaps} />
            </div>

            <div style={{ flex: 1, display: 'flex' }}>
                <TablaSoberanosYONs titulo="Bonares y Globales" datos={tablaBonares} />
            </div>
        </div>
    );
};
export default function HomePage() {
    return (
        <Layout>
            <FinancialDashboard />
        </Layout>
    );
}
