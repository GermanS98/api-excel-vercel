'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
// ==================================================================
// DEFINICIÓN DE TIPOS (ACTUALIZADA)
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
  spread?: number | null; // Campo opcional para el spread
  ua: string | null; // ultimo_anuncio
  cje: number | null;
  pc: boolean; // indica si el precio es Cierre Anterior
};

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
const formatValue = (value: number | null | undefined, unit: string = '%', decimals: number = 2) => {
    if (value === null || typeof value === 'undefined' || !isFinite(value)) return '-';
    const numeroAFormatear = value * (unit === '%' ? 100 : 1);
    const numeroFormateado = numeroAFormatear.toLocaleString('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
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
// ==================================================================
// COMPONENTE TablaGeneral (Actualizado para nombres cortos)
// ==================================================================
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
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Paridad</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>MD</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Spread l. tasa</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>canje</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((item: Bono) => (
                <tr key={item.t} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563' }}>{item.t}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatDate(item.vto)}</td>
                  <td 
                    style={{ 
                        padding: '0.75rem 1rem', 
                        color: '#4b5563', 
                        textAlign: 'center',
                        // Si item.pc es TRUE (usó cierre ant.), pinta de celeste claro (#e0f7fa)
                        backgroundColor: item.pc ? '#e0f7fa' : 'transparent', 
                    }}
                  >
                    {formatValue(item.p,'',2)}
                  </td>
                  <td style={{ 
                      padding: '0.75rem 1rem', 
                      color: item.v >= 0 ? '#22c55e' : '#ef4444',
                      fontWeight: 500,
                      textAlign: 'left'
                      }}>
                    {formatValue(item.v)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tir)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.pd, '', 2)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.md, '', 2)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.spread)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.cje,'%',2)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={9} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
);

// ==================================================================
// COMPONENTE PRINCIPAL DE LA PÁGINA
// ==================================================================
export default function SoberanosPage() {
    const [bonosSoberanos, setBonosSoberanos] = useState<Bono[]>([]);
    const [estado, setEstado] = useState('Cargando...');
    const [rangoDuration, setRangoDuration] = useState<[number, number]>([0, 0]);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);    
    const segmentosDeEstaPagina = ['BONAR', 'GLOBAL', 'BOPREAL'];
    const manana = new Date();
    manana.setDate(manana.getDate() + 1)
   useEffect(() => {
        const segmentosRequeridos = segmentosDeEstaPagina;
        const fetchInitialData = async () => {
            const manana = new Date();
            manana.setDate(manana.getDate() + 1);
            const columnasNecesarias = 't,vto,p,tir,v,s,pd,RD,dv,ua,cje,md,pc';
            
            const { data: bonosData, error: bonosError } = await supabase.from('latest_bonds').select(columnasNecesarias).gte('vto', manana.toISOString()).in('s', segmentosRequeridos);
            if (bonosError) console.error("Error fetching bonds:", bonosError);
            else if (bonosData) {
                setBonosSoberanos(bonosData as Bono[]);
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
        let bondChannel: any = null; // 
        const setupSuscripciones = () => {
             const realtimeFilter = `s=in.(${segmentosRequeridos.map(s => `"${s}"`).join(',')})`;
             const bondChannel = supabase.channel('realtime-datosbonos').on('postgres_changes', { event: '*', schema: 'public', table: 'datosbonos', filter: realtimeFilter }, payload => {
                   const bonoActualizado = payload.new as Bono;
                   setBonosSoberanos(bonosActuales => {
                       const existe = bonosActuales.some(b => b.t === bonoActualizado.t);
                       return existe ? bonosActuales.map(b => b.t === bonoActualizado.t ? bonoActualizado : b) : [...bonosActuales, bonoActualizado];
                   });
                   setUltimaActualizacion(bonoActualizado.ua || null);
               }).subscribe();
             
            return { bondChannel };
        };

        fetchInitialData();
        setupSuscripciones();

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
            } else {
                fetchInitialData();
                if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
                setupSuscripciones();
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
    
// ... (inicio del componente SoberanosPage)

    const datosConSpread = useMemo(() => {
         const globalesPorVto = new Map<string, Bono>();
         bonosSoberanos.forEach(bono => {
      if (bono.s === 'GLOBAL') {
        globalesPorVto.set(bono.vto, bono);
       }
       });

      return bonosSoberanos.map(bono => {
          if (bono.s === 'BONAR') {
               const globalEquivalente = globalesPorVto.get(bono.vto);
                if (globalEquivalente) {
                 return {
                   ...bono,
                 spread: bono.tir - globalEquivalente.tir
              };
             }
           }
         return bono;
        });
    }, [bonosSoberanos]); // <-- Fin de datosConSpread



    
    const datosParaTabla = useMemo(() => {
      return [...datosConSpread].sort((a, b) => {
        const comparacionSegmento = a.s.localeCompare(b.s);
        if (comparacionSegmento !== 0) {
            return comparacionSegmento;
        }
        return new Date(a.vto).getTime() - new Date(b.vto).getTime();
      });
    }, [datosConSpread]);

    const maxDurationDelSegmento = useMemo(() => {
        if (bonosSoberanos.length === 0) return 10;
        const maxDuration = Math.max(...bonosSoberanos.map(b => b.md ?? 0));
        return isFinite(maxDuration) ? Math.ceil(maxDuration) : 10;
    }, [bonosSoberanos]);

    useEffect(() => {
        setRangoDuration([0, maxDurationDelSegmento]);
    }, [maxDurationDelSegmento]);

    const datosParaGrafico = useMemo(() => {
      return datosConSpread.filter(b => 
        b.md !== null &&
        b.md >= rangoDuration[0] && 
        b.md <= rangoDuration[1]
      );
    }, [datosConSpread, rangoDuration]);
    
    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Curva de Rendimiento: Soberanos</h1>
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem'}}>
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
                      <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Filtrar por Modified Duration (años):</label>
                      <Slider
                          range min={0} max={maxDurationDelSegmento > 0 ? maxDurationDelSegmento : 1}
                          value={rangoDuration}
                          onChange={(value) => setRangoDuration(value as [number, number])}
                          step={0.1}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                          <span style={{ fontSize: '12px' }}>{rangoDuration[0].toFixed(1)} años</span>
                          <span style={{ fontSize: '12px' }}>{maxDurationDelSegmento} años</span>
                      </div>
                    </div>
                    
                    <CurvaRendimientoChart 
                        data={datosParaGrafico} 
                        segmentoActivo="Bonares y Globales" 
                        xAxisKey="md"
                    />
                </div>
                <div style={{ margin: '1rem 0', padding: '0.75rem 1rem', background: '#e0f7fa', borderLeft: '5px solid #00bcd4', borderRadius: '4px', color: '#006064', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span style={{ marginRight: '8px' }}>ⓘ</span>
                    El fondo <strong>celeste</strong> en el precio indica que se utilizó el <strong>Cierre Anterior</strong> en lugar del Último Precio.
                </div>                

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                    <TablaGeneral titulo="Soberanos" datos={datosParaTabla} />
                </div>
            </div>
        </Layout>
    );
}
