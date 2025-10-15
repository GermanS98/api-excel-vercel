'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// --- DEFINICIÓN DEL TIPO PARA TYPESCRIPT ---
// Define la estructura de datos para cada bono.
type Bono = {
    t: string;       // Ticker
    vto: string;     // Vencimiento
    p: number | null;// Precio
    tir: number;     // Tasa Interna de Retorno
    tna: number | null;// Tasa Nominal Anual
    tem: number | null;// Tasa Efectiva Mensual
    v: number;       // Variación diaria
    s: string;       // Segmento (ej. 'LECAP', 'BONAR')
    pd: number | null;// Paridad
};

// --- TIPO PARA LOS DATOS DE TIPO DE CAMBIO ---
// Define la estructura para los datos del dólar.
type TipoDeCambio = {
    valor_ccl: number;
    valor_mep: number;
    h: string; // Hora de la actualización
};

// --- CONFIGURACIÓN DEL CLIENTE DE SUPABASE ---
// Se conecta a la base de datos de Supabase usando las credenciales del entorno.
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// --- FUNCIONES AUXILIARES DE FORMATO ---

/**
 * Formatea un número como un valor monetario o porcentual.
 * @param {number | null | undefined} value - El número a formatear.
 * @param {string} unit - La unidad a añadir (ej. '%').
 * @param {number} decimals - El número de decimales a mostrar.
 * @returns {string} - El valor formateado o un guion si es inválido.
 */
const formatValue = (value: number | null | undefined, unit: string = '%', decimals: number = 2): string => {
    if (value === null || typeof value === 'undefined' || !isFinite(value)) return '-';
    const numeroAFormatear = value * (unit === '%' ? 100 : 1);
    const numeroFormateado = numeroAFormatear.toLocaleString('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
    return `${numeroFormateado}${unit}`;
};

/**
 * Formatea una cadena de fecha a 'dd/MM/yy'.
 * @param {string} dateString - La fecha en formato ISO.
 * @returns {string} - La fecha formateada o un guion.
 */
const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    // Asegura que la fecha se trate como UTC antes de convertirla a la zona horaria de Argentina.
    const date = toZonedTime(dateString, 'UTC');
    return format(date, 'dd/MM/yy');
};

/**
 * Formatea una marca de tiempo ISO a una cadena legible para Argentina.
 * @param {string | null} isoString - La marca de tiempo en formato ISO.
 * @returns {string} - La fecha y hora formateadas.
 */
const formatTimestamp = (isoString: string | null): string => {
    if (!isoString) return '...';
    const timeZone = 'America/Argentina/Buenos_Aires';
    const utcDate = new Date(isoString);
    const zonedDate = toZonedTime(utcDate, timeZone);
    return format(zonedDate, 'dd/MM/yyyy HH:mm:ss');
};

/**
 * Convierte un texto a un formato 'slug' (URL amigable).
 * @param {string} text - El texto a convertir.
 * @returns {string} - El texto en formato slug.
 */
const slugify = (text: string): string => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};


// --- COMPONENTE PARA LAS TARJETAS DE INFORMACIÓN (MODIFICADO PARA TV) ---
const InfoCard = ({ title, value }: { title: string, value: number | null | undefined }) => {
    const formattedValue = value
        ? `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'Cargando...';

    return (
        <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 6px 10px rgba(0,0,0,0.05)',
            textAlign: 'center',
            flex: 1,
            minWidth: '300px'
        }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#6b7280', fontWeight: 500 }}>{title}</h3>
            <p style={{ margin: '1rem 0 0', fontSize: '2.5rem', fontWeight: 700, color: '#111827' }}>
                {formattedValue}
            </p>
        </div>
    );
};

// --- COMPONENTE PARA LA TABLA DE LECAPS (AJUSTADA PARA TV) ---
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
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length > 0 ? (
                            datos.map((item: Bono, index: number) => (
                                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', fontWeight: 500, color: '#4b5563' }}>{item.t}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatDate(item.vto)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.p, '', 2)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: item.v >= 0 ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                                        {formatValue(item.v)}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.tir)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.tna)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.tem)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '1.1rem' }}>No se encontraron datos.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- COMPONENTE PARA LA TABLA DE BONARES Y GLOBALES (AJUSTADA PARA TV) ---
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
                            datos.map((item: Bono, index: number) => (
                                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', fontWeight: 500, color: '#4b5563' }}>{item.t}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatDate(item.vto)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.p, '', 2)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: item.v >= 0 ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                                        {formatValue(item.v)}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.tir)}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontSize: '1.1rem', color: '#4b5563' }}>{formatValue(item.pd, '', 2)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280', fontSize: '1.1rem' }}>No se encontraron datos.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function HomePage() {
    // Estados para almacenar los datos
    const [bonos, setBonos] = useState<Bono[]>([]);
    const [estado, setEstado] = useState('Cargando...');
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
    const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio | null>(null);

    // Define los segmentos de bonos que se van a mostrar en las tablas
    const gruposDeSegmentos = {
        'LECAPs y Similares': ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'],
        'Bonares y Globales': ['BONAR', 'GLOBAL', 'BOPREAL'],
    };

    // Hook de efecto para cargar datos y suscribirse a cambios en tiempo real
    useEffect(() => {
        // NUEVO: Se crea una lista única con todos los segmentos requeridos.
        // El método .flat() aplana el array de arrays en un único array.
        const segmentosRequeridos = Object.values(gruposDeSegmentos).flat();

        const fetchInitialData = async () => {
            setEstado('Actualizando datos...');
            const manana = new Date();
            manana.setDate(manana.getDate() + 1);
            const columnasNecesarias = 't, vto, p, tir, tna, tem, v, s, pd';

            // MODIFICADO: La consulta ahora incluye el filtro .in()
            // para traer solo los bonos de los segmentos que necesitamos.
            const { data: bonosData, error: bonosError } = await supabase
                .from('datosbonos')
                .select(columnasNecesarias)
                .gte('vto', manana.toISOString())
                .in('s', segmentosRequeridos); // <-- ¡AQUÍ ESTÁ LA OPTIMIZACIÓN!

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
             // MODIFICADO: El filtro también se aplica a la suscripción en tiempo real.
             // Así, el cliente solo recibirá notificaciones de los bonos que le interesan.
             const realtimeFilter = `s=in.(${segmentosRequeridos.map(s => `"${s}"`).join(',')})`;
             
             supabase.channel('realtime-datosbonos')
               .on('postgres_changes', { 
                   event: '*', 
                   schema: 'public', 
                   table: 'datosbonos',
                   filter: realtimeFilter // <-- OPTIMIZACIÓN DE REALTIME
                }, (payload) => {
                   const bonoActualizado = payload.new as Bono;
                   setBonos(bonosActuales => {
                       const existe = bonosActuales.some(b => b.t === bonoActualizado.t);
                       if (existe) {
                           return bonosActuales.map(b => b.t === bonoActualizado.t ? bonoActualizado : b);
                       }
                       // Solo se añade si no existe, aunque con el filtro de carga inicial es menos probable.
                       return [...bonosActuales, bonoActualizado]; 
                   });
               })
               .subscribe();
 
             supabase.channel('tipodecambio-changes')
               .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tipodecambio' }, (payload) => {
                   if (payload.new && payload.new.datos) {
                       setTipoDeCambio(payload.new.datos);
                       setUltimaActualizacion(payload.new.datos.h);
                   }
               })
               .subscribe();
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

    // Función para ordenar los bonos por fecha de vencimiento
    const ordenarPorVencimiento = (datos: Bono[]) => {
        return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    };

    // Filtra y ordena los datos para cada tabla
    const tablaLecaps = ordenarPorVencimiento(bonos.filter(b => gruposDeSegmentos['LECAPs y Similares'].includes(b.s)));
    const tablaBonares = ordenarPorVencimiento(bonos.filter(b => gruposDeSegmentos['Bonares y Globales'].includes(b.s)));

    // Renderizado del componente
    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
            <div style={{ padding: '2rem' }}>
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '1.25rem', marginBottom: '2rem' }}>
                    <span>
                        Estado: <strong>{`Actualizado el ${formatTimestamp(ultimaActualizacion)}`}</strong>
                    </span>
                </div>

                {/* Contenedor principal con Flexbox para el diseño de 3 columnas */}
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                    
                    {/* --- COLUMNA 1: Tarjetas de Dólar --- */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2rem',
                        flex: '0 0 350px' // Ancho fijo para esta columna
                    }}>
                        <InfoCard title="Dólar MEP" value={tipoDeCambio?.valor_mep} />
                        <InfoCard title="Dólar CCL" value={tipoDeCambio?.valor_ccl} />
                    </div>

                    {/* --- COLUMNA 2: Tabla LECAPs --- */}
                    <div style={{ flex: 1 }}> {/* Ocupa el espacio restante */}
                        <TablaGeneral titulo="Tasa fija" datos={tablaLecaps} />
                    </div>

                    {/* --- COLUMNA 3: Tabla Bonares --- */}
                    <div style={{ flex: 1 }}> {/* Ocupa el espacio restante */}
                        <TablaSoberanosYONs titulo="Bonares y Globales" datos={tablaBonares} />
                    </div>
                </div>
            </div>
        </div>
    );
}
