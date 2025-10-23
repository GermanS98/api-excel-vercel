'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
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
  ua: string | null; // Nuevo campo
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
const formatDateTime = (dateString: string | null) => {
  if (!dateString) return '-';
  try {
    // parseISO convierte el string ISO (que viene de la base de datos) a un objeto Date
    const date = parseISO(dateString); 
    // format() lo mostrará en la zona horaria local del usuario
    return format(date, 'dd/MM/yy HH:mm:ss'); 
  } catch (e) {
    return 'Fecha inv.'; // En caso de que la fecha sea inválida
  }
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
            <tr style={{ background: '#021751', color: 'white' }}>
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
              <tr><td colSpan={9} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
);

// --- COMPONENTE PRINCIPAL DE LA PÁGINA DE CER ---
export default function LecapsPage() {
     const [bonosCER, setBonosCER] = useState<Bono[]>([])
    const [estado, setEstado] = useState('Cargando...');
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
    const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);

    const segmentosDeEstaPagina = ['CER'];
    
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
useEffect(() => {
    // 1. La función de carga inicial no cambia
    const fetchInitialData = async () => {
        setEstado('Actualizando datos...');
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const columnasNecesarias = 't, vto, p, tir, tna, tem, v, s, dv, md, ua, RD';

        const { data: bonosData, error: bonosError } = await supabase.from('latest_bonds').select(columnasNecesarias).gte('vto', manana.toISOString());
        if (bonosError) {
            setEstado(`Error al cargar bonos: ${bonosError.message}`);
            
        } else if (bonosData) {
            setBonosCER(bonosData as Bono[]);
            setUltimaActualizacion(bonosData[0]?.ua || null);
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
                setBonosCER(bonosActuales => {
                    const existe = bonosActuales.some(b => b.t === bonoActualizado.t);
                    if (existe) {
                        return bonosActuales.map(b => b.t === bonoActualizado.t ? bonoActualizado : b);
                    }
                    return [...bonosActuales, bonoActualizado];
                });
                setUltimaActualizacion(bonoActualizado.ua || null);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Canal de bonos suscrito.');
                }
            });
        console.log("Suscripciones configuradas.");
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
}, []);
    
    
    
    const maxDiasDelSegmento = (() => {
      if (bonosCER.length === 0) return 1000;
      const maxDias = Math.max(...bonosCER.map(b => b.dv));
      return isFinite(maxDias) ? maxDias : 1000;
    })();

  useEffect(() => {
      setRangoDias([0, maxDiasDelSegmento]);
    }, [maxDiasDelSegmento]);

    const datosParaGrafico = bonosCER.filter(b => b.dv >= rangoDias[0] && b.dv <= rangoDias[1]);
    const datosParaTabla = [...bonosCER].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());

    return (
        <Layout>        
                <div style={{ maxWidth: '1400px', margin: 'auto' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Curva de Rendimiento: Instrumentos CER </h1>
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
                          xAxisKey="dv" // <-- Añadir esta línea
                        />                        
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                        <TablaGeneral titulo="Instrumentos CER" datos={datosParaTabla} />
                    </div>
                </div>
        </Layout>
    );
}