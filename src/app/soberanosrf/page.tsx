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
  dm: number | null; // duracion_macaulay
  spread?: number | null; // Campo opcional para el spread
  ua: string | null; // ultimo_anuncio
  cje: number | null;
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
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.p,'',2)}</td>
                  <td style={{ 
                      padding: '0.75rem 1rem', 
                      color: item.v >= 0 ? '#22c55e' : '#ef4444',
                      fontWeight: 500
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

    const segmentosDeEstaPagina = ['BONAR', 'GLOBAL', 'BOPREAL'];
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setEstado('Cargando instrumentos...');
            const manana = new Date();
            manana.setDate(manana.getDate() + 1);

            const { data, error } = await supabase
                .from('latest_bonds')
                .select('*')
                .in('s', segmentosDeEstaPagina)
                .gte('vto', manana.toISOString());

            if (error) {
                setEstado(`Error al cargar datos: ${error.message}`);
            } else if (data) {
                setBonosSoberanos(data as Bono[]);
                setEstado('Datos cargados. Escuchando actualizaciones...');
            }
        };

        fetchInitialData();

        const channel = supabase
            .channel('realtime-soberanos-page')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'datosbonos', filter: `s=in.(${segmentosDeEstaPagina.map(s => `'${s}'`).join(',')})` },
                (payload) => {
                    const bonoActualizado = payload.new as Bono;
                    
                    setBonosSoberanos(bonosActuales => {
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


    // --- INICIO DEL BLOQUE (UBICACIÓN CORRECTA) ---
    // (Pegado aquí, afuera del anterior)
    const ultimaActualizacion = useMemo(() => {
       // 1. Obtener todos los valores 'ua' válidos
         const todasLasFechas = bonosSoberanos
         .map(b => b.ua)
         .filter((ua): ua is string => !!ua); // Filtra los null

       // 2. Si no hay fechas, devolver null
         if (todasLasFechas.length === 0) return null;

       // 3. Ordenar las fechas para encontrar la más reciente
         // Convertimos a objeto Date para una comparación numérica segura
         todasLasFechas.sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
   
        // 4. Devolver la más reciente (la primera del array ordenado)
        return todasLasFechas[0];
    }, [bonosSoberanos]);
    // --- FIN DEL BLOQUE (UBICACIÓN CORRECTA) ---



    
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
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem', display: 'flex',justifyContent: 'center',gap: '24px'}}>
                  <span>Estado: <strong>{estado}</strong></span>

                    {/* --- LÍNEAS AÑADIDAS --- */}
                    {/* Solo mostrar si hay una fecha y no estamos en la carga inicial */}
                    {ultimaActualizacion && estado !== 'Cargando instrumentos...' && (
                        <span style={{ color: '#374151' }}> {/* Un color de texto más fuerte */}
                            Última act: <strong>{formatDateTime(ultimaActualizacion)}</strong>
                        </span>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                    <TablaGeneral titulo="Soberanos" datos={datosParaTabla} />
                </div>
            </div>
        </Layout>
    );
}
