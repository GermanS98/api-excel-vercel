'use client';
import Layout from '@/components/layout/Layout'; // Importa el Layout
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Sidebar from '@/components/ui/Sidebar';
import Link from 'next/link';
import ReportePDFGenerator from '@/components/ui/ReportePDFGenerator'; 
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
// --- DEFINICIÓN DEL TIPO PARA TYPESCRIPT ---
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
   // Nuevo campo RD: number | null;
   // Nuevo campo mb: number | null;
  pd: number | null; // Nuevo campo para Paridad
};
// --- NUEVO: TIPO PARA LOS DATOS DE TIPO DE CAMBIO ---
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
  const date = toZonedTime(dateString, 'UTC');
  return format(date, 'dd/MM/yy');
};

const slugify = (text: string) => {
  return text.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

// --- NUEVO: COMPONENTE PARA LAS TARJETAS DE INFORMACIÓN ---
const InfoCard = ({ title, value }: { title: string, value: number | null | undefined }) => {
    // Formatea el valor como moneda, mostrando 'Cargando...' si aún no hay datos.
    const formattedValue = value 
      ? `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
      : 'Cargando...';
  
    return (
      <div style={{
        background: '#fff',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        textAlign: 'center',
        flex: 1, // Para que ocupe el espacio disponible
        minWidth: '200px'
      }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 }}>{title}</h3>
        <p style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          {formattedValue}
        </p>
      </div>
    );
};

// --- COMPONENTES DE TABLA CON TÍTULOS CLICKEABLES Y CUERPO COMPLETO ---
const TablaGeneral = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => {
    const enlacesExternos: { [key: string]: string } = {
        'LECAPs y Similares': 'https://researchcap.vercel.app/RentaFijaArs',
        'Ajustados por CER': 'https://researchcap.vercel.app/cer',
        'Dollar Linked': 'https://researchcap.vercel.app/dl',
        'TAMAR': 'https://researchcap.vercel.app/tamar',
        
    };
    const urlExterna = enlacesExternos[titulo];

    return (
        <div id={slugify(titulo)} style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {urlExterna ? (
                <a href={urlExterna} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0, cursor: 'pointer' }}>{titulo}</h2>
                </a>
            ) : (
                <Link href={`/${slugify(titulo)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0, cursor: 'pointer' }}>{titulo}</h2>
                </Link>
            )}
            <div style={{ overflowX: 'auto', maxHeight: 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                        <tr style={{ background: '#1036E2', color: 'white' }}>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Ticker</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Vto</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Precio</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Var</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TIR</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TNA</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TEM</th>
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
                                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tem)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
  
const TablaSoberanosYONs = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => {
    // 1. Añadimos el diccionario de enlaces externos.
    const enlacesExternos: { [key: string]: string } = {
        'Obligaciones Negociables': 'https://researchcap.vercel.app/ons',
        'Bonares y Globales': 'https://researchcap.vercel.app/soberanosrf'
    };
    const urlExterna = enlacesExternos[titulo];

    return (
        <div id={slugify(titulo)} style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {/* 2. Agregamos lógica condicional */}
            {urlExterna ? (
                <a href={urlExterna} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0, cursor: 'pointer' }}>
                        {titulo}
                    </h2>
                </a>
            ) : (
                <Link href={`/${slugify(titulo)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0, cursor: 'pointer' }}>
                        {titulo}
                    </h2>
                </Link>
            )}
            <div style={{ overflowX: 'auto', maxHeight: 'none' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0 }}>
                        <tr style={{ background: '#1036E2', color: 'white' }}>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600}}>Ticker</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Vto</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Precio</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600}}>Var</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600}}>TIR</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Paridad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length > 0 ? (
                            datos.map((item: Bono, index: number) => (
                                <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563' }}>{item.t}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatDate(item.vto)}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.p,'',2)}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: item.v >= 0 ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                                        {formatValue(item.v)}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tir)}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.pd, '', 2)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function HomePage() {
    const [bonos, setBonos] = useState<Bono[]>([]);
    const [estado, setEstado] = useState('Cargando...');
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null); //
    const [menuAbierto, setMenuAbierto] = useState(false);
    // --- NUEVO: ESTADO PARA LOS DATOS DEL TIPO DE CAMBIO ---
    const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const gruposDeSegmentos: { [key: string]: string[] } = {
      'LECAPs y Similares': ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'],
      'Ajustados por CER': ['CER', 'ON CER'],
      'Dollar Linked': ['ON DL', 'DL', 'ON HD'],
      'TAMAR': ['TAMAR', 'ON TAMAR'],
      'Bonares y Globales': ['BONAR', 'GLOBAL', 'BOPREAL'],
      'Obligaciones Negociables': ['ON']
    };
    
    const [segmentoSeleccionado, setSegmentoSeleccionado] = useState<string>(Object.keys(gruposDeSegmentos)[0]);
    const columnasNecesarias = 't, vto, p, tir, tna, tem, v, s, dv, md, pd';
    
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
useEffect(() => {
    // 1. La función de carga inicial no cambia
    const fetchInitialData = async () => {
        setEstado('Actualizando datos...');
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const columnasNecesarias = 't, vto, p, tir, tna, tem, v, s, dv, md, pd';

        const { data: bonosData, error: bonosError } = await supabase.from('datosbonos').select(columnasNecesarias).gte('vto', manana.toISOString());
        if (bonosError) {
            setEstado(`Error al cargar bonos: ${bonosError.message}`);
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

    // 2. Nueva función para configurar y activar las suscripciones
    const setupSuscripciones = () => {
        console.log("Configurando suscripciones de Supabase...");
        
        // Canal de Bonos
        supabase.channel('realtime-datosbonos')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'datosbonos' }, (payload) => {
                console.log('Cambio recibido en bonos:', payload.new);
                const bonoActualizado = payload.new as Bono;
                setBonos(bonosActuales => {
                    const existe = bonosActuales.some(b => b.t === bonoActualizado.t);
                    if (existe) {
                        return bonosActuales.map(b => b.t === bonoActualizado.t ? bonoActualizado : b);
                    }
                    return [...bonosActuales, bonoActualizado];
                });
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Canal de bonos suscrito.');
                }
            });

        // Canal de Tipo de Cambio
        supabase.channel('tipodecambio-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tipodecambio' }, (payload) => {
                console.log('Cambio recibido en tipo de cambio:', payload.new);
                if (payload.new && payload.new.datos) {
                    setTipoDeCambio(payload.new.datos);
                    setUltimaActualizacion(payload.new.datos.h); 
                }
                
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Canal de tipo de cambio suscrito.');
                }
            });
    };

    // 3. Lógica inicial y de visibilidad simplificada
    fetchInitialData();
    setupSuscripciones();

    const handleVisibilityChange = () => {
        if (document.hidden) {
            console.log("Pestaña oculta. Eliminando todos los canales.");
            supabase.removeAllChannels();
        } else {
            console.log("Pestaña visible. Recargando datos y creando suscripciones.");
            fetchInitialData();
            setupSuscripciones(); // Se vuelven a crear desde cero
        }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 4. Limpieza final
    return () => {
        console.log("Desmontando componente. Limpiando todo.");
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        supabase.removeAllChannels();
    };
}, []);  // El array vacío asegura que este efecto se ejecute solo una vez al montar el componente
    const ultimoLoteDeDatos: Bono[] = bonos;
    const handleDownloadFullReport = () => {
        setEstado('Generando reporte completo...');
        setIsGeneratingPDF(true); // Esto hará que ReportePDFGenerator se renderice
    };
    const generatePDFFromElement = async (element: HTMLElement) => { // 1. Haz la función async
        
        // 2. Importa la librería dinámicamente DENTRO de la función
        const html2pdf = (await import('html2pdf.js')).default;

        const options = {
            margin:       0.5,
            filename:     'reporte_completo_bonos.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
        } as const;

        // El resto de la función no cambia
        html2pdf().from(element).set(options).save().then(() => {
            setEstado('Datos actualizados');
            setIsGeneratingPDF(false);
        });
    };

    const datosDelSegmentoSeleccionado = (() => {
        const segmentosActivos = gruposDeSegmentos[segmentoSeleccionado] || [];
        return ultimoLoteDeDatos.filter(b => segmentosActivos.includes(b.s));
    })();
    const isBonaresSegment = segmentoSeleccionado === 'Bonares y Globales';
    const [rangoX, setRangoX] = useState<[number, number]>([0, 0]);
    const maxXValue = (() => {
        if (datosDelSegmentoSeleccionado.length === 0) return isBonaresSegment ? 10 : 1000;
        
        // Si es Bonares, calculamos el máximo de la duration
        if (isBonaresSegment) {
            const maxDuration = Math.max(...datosDelSegmentoSeleccionado.map(b => b.md ?? 0));
            return isFinite(maxDuration) ? Math.ceil(maxDuration) : 10;
        } 
        // Para el resto, usamos los días al vencimiento
        else {
            const maxDias = Math.max(...datosDelSegmentoSeleccionado.map(b => b.dv));
            return isFinite(maxDias) ? maxDias : 1000;
        }
    })();

    useEffect(() => {
        setRangoX([0, maxXValue]);
    }, [maxXValue]);

    const datosParaGrafico = datosDelSegmentoSeleccionado.filter(b => {
        const value = isBonaresSegment ? b.md : b.dv;
        if (value === null || typeof value === 'undefined') return false;
        return value >= rangoX[0] && value <= rangoX[1];
    });

    const ordenarPorVencimiento = (datos: Bono[]) => {
        return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    };

    const tabla1 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['LECAPs y Similares'].includes(b.s)));
    const tabla2 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Ajustados por CER'].includes(b.s)));
    const tabla3 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Dollar Linked'].includes(b.s)));
    const tabla4 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['TAMAR'].includes(b.s)));
    const tabla5 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Bonares y Globales'].includes(b.s)));
    const tabla6 = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => gruposDeSegmentos['Obligaciones Negociables'].includes(b.s)));



    return (
        <Layout onDownloadPDF={handleDownloadFullReport}>
            <div style={{ maxWidth: '1400px', margin: 'auto' }}>

                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                    <span>
                        Estado: <strong>{ultimaActualizacion ? `Actualizado el ${ultimaActualizacion}` : 'Cargando...'}</strong>
                    </span>
                </div>

                {/* --- CONTENEDOR PARA LAS TARJETAS DE TIPO DE CAMBIO --- */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '20px',
                        margin: '1.5rem 0',
                        flexWrap: 'wrap'
                    }}
                >
                    <InfoCard title="Dólar MEP" value={tipoDeCambio?.valor_mep} />
                    <InfoCard title="Dólar CCL" value={tipoDeCambio?.valor_ccl} />
                </div>

                {/* --- CONTENEDOR DEL GRÁFICO --- */}
                <div
                    style={{
                        background: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                        marginTop: '1.5rem'
                    }}
                >

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px',
                            alignItems: 'center',
                            marginBottom: '10px',
                            paddingBottom: '20px',
                            borderBottom: '1px solid #eee'
                        }}
                    >
                        {Object.keys(gruposDeSegmentos).map(grupo => (
                            <button
                                key={grupo}
                                onClick={() => setSegmentoSeleccionado(grupo)}
                                style={{
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    borderColor: segmentoSeleccionado === grupo ? 'white' : '#021751',
                                    backgroundColor: segmentoSeleccionado === grupo ? '#00C600' : '#021751',
                                    color: segmentoSeleccionado === grupo ? '#021751' : 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {grupo}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: '0 10px', marginBottom: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                            {isBonaresSegment ? 'Filtrar por modified duration (años):' : 'Filtrar por los días al vencimiento:'}
                        </label>
                        <Slider
                            range
                            min={0}
                            max={maxXValue > 0 ? maxXValue : 1}
                            value={rangoX}
                            onChange={(value) => setRangoX(value as [number, number])}
                            step={isBonaresSegment ? 0.1 : 1}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                            <span style={{ fontSize: '12px' }}>
                                {rangoX[0]} {isBonaresSegment ? 'años' : 'días'}
                            </span>
                            <span style={{ fontSize: '12px' }}>
                                {maxXValue} {isBonaresSegment ? 'años' : 'días'}
                            </span>
                        </div>
                    </div>

                    <CurvaRendimientoChart
                        data={datosParaGrafico}
                        segmentoActivo={segmentoSeleccionado}
                        xAxisKey={isBonaresSegment ? 'md' : 'dv'}
                    />
                </div>

                {/* --- CONTENEDOR DE LAS TABLAS --- */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                        gap: '20px',
                        marginTop: '2rem'
                    }}
                >
                    <TablaGeneral titulo="LECAPs y Similares" datos={tabla1} />
                    <TablaGeneral titulo="Ajustados por CER" datos={tabla2} />
                    <TablaGeneral titulo="Dollar Linked" datos={tabla3} />
                    <TablaGeneral titulo="TAMAR" datos={tabla4} />
                    <TablaSoberanosYONs titulo="Bonares y Globales" datos={tabla5} />
                    <TablaSoberanosYONs titulo="Obligaciones Negociables" datos={tabla6} />
                </div>
                {isGeneratingPDF && (
                    <ReportePDFGenerator
                        gruposDeSegmentos={gruposDeSegmentos}
                        ultimoLoteDeDatos={ultimoLoteDeDatos}
                        CurvaRendimientoChart={CurvaRendimientoChart}
                        TablaGeneral={TablaGeneral}
                        TablaSoberanosYONs={TablaSoberanosYONs}
                        onRendered={generatePDFFromElement}
                    />
                )}
            </div>
        </Layout>
    );
}
