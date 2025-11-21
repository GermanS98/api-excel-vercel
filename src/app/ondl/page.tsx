'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { format, parseISO, parse, differenceInDays, endOfMonth, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale'; 

// ==================================================================
// DEFINICIÓN DE TIPOS
// ==================================================================
type Bono = {
  t: string;     // ticker
  vto: string;
  p: number | null; // precio
  tir: number;
  tna: number | null;
  tem: number | null;
  v: number;       // var
  s: string;       // segmento
  dv: number;     // dias_vto
  RD: number | null;
  ua: string | null; // ultimo_anuncio
  pc: boolean | null;
};

type DlrfxData = {
  t: string;
  l: number | null;  // last price
  ld: number | null; // last date
  ts: number | null; // timestamp
};

type TipoDeCambio = {
  valor_ccl: number;
  valor_mep: number;
  h: string; 
};

// ==================================================================
// CONFIGURACIÓN DE SUPABASE
// ==================================================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// ==================================================================
// FUNCIONES AUXILIARES DE FORMATO
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
    const date = parseISO(dateString); 
    return format(date, 'dd/MM/yy HH:mm:ss'); 
  } catch (e) {
    return 'Fecha inv.';
  }
};

const formatTimestamp = (ts: number | null) => {
  if (!ts) return '-';
  try {
    return format(new Date(ts), 'HH:mm:ss');
  } catch (e) {
    return '-';
  }
};

const getVtoInfo = (ticker: string,
  vencimientos: Map<string, string>
): { diasVto: number, vtoString: string } => {
  const hoy = startOfDay(new Date());
  const partes = ticker.split('/');
  if (partes.length < 2 || partes[1] === 'SPOT') {
    return { diasVto: 0, vtoString: 'SPOT' };
  }
  if (partes[1] === '24hs') {
    return { diasVto: 1, vtoString: '24hs' };
  }

  try {
    const tickerMes = partes[1].toUpperCase(); // ej. "DIC25"
    let fechaVto: Date;
    const fechaExactaStr = vencimientos.get(tickerMes); 

    if (fechaExactaStr) {
      fechaVto = parseISO(fechaExactaStr);
    } else {
      console.warn(`Vencimiento exacto para ${tickerMes} no encontrado. Usando fin de mes.`);
      const fechaParseada = parse(tickerMes, 'MMMyy', new Date(), { locale: es });
      fechaVto = endOfMonth(fechaParseada);
    }
   
    const dias = differenceInDays(fechaVto, hoy);
    return { diasVto: dias > 0 ? dias : 0, vtoString: format(fechaVto, 'dd/MM/yy') };

  } catch (e) {
      console.error(`Error parseando ticker: ${ticker}`, e);
      return { diasVto: -1, vtoString: 'Error' }; 
  }
};


// ==================================================================
// COMPONENTE InfoCard (Sin cambios)
// ==================================================================
const InfoCard = ({ title, value }: { title: string, value: number | null | undefined }) => {
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
        flex: 1, 
        minWidth: '200px'
      }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 }}>{title}</h3>
        <p style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
          {formattedValue}
        </p>
    </div>
  );
};

// ==================================================================
// COMPONENTE TablaGeneral (ACTUALIZADO: Color PC + Días calculados)
// ==================================================================
const TablaGeneral = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => {
  const hoy = startOfDay(new Date());

  return (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
        {titulo}
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Días vto</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>VTO</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Precio</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Var</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TIR</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TNA</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TEM</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>RD</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((item: Bono, index: number) => {
                // Cálculo de días
                let diasCalculados = 0;
                try {
                  const fechaVto = parseISO(item.vto);
                  diasCalculados = differenceInDays(fechaVto, hoy);
                } catch (e) {
                  diasCalculados = item.dv;
                }

                return (
                  <tr key={index} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563' }}>{item.t}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{diasCalculados}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatDate(item.vto)}</td>
                    
                    {/* 🆕 Lógica de color de fondo si es Precio Cierre (pc) */}
                    <td style={{ 
                        padding: '0.75rem 1rem', 
                        color: '#4b5563', 
                        textAlign: 'center',
                        backgroundColor: item.pc ? '#e0f7fa' : 'transparent' 
                    }}>
                        {formatValue(item.p, '', 2)}
                    </td>

                    <td style={{
                      padding: '0.75rem 1rem',
                      color: item.v >= 0 ? '#22c55e' : '#ef4444',
                      fontWeight: 500, textAlign: 'center'
                    }}>
                      {formatValue(item.v)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.tir)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.tna)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.tem)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.RD)}</td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={9} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==================================================================
// COMPONENTE TablaSinteticos (Futuros vs Spot) (Sin cambios)
// ==================================================================
const TablaSinteticos = ({ datos, vencimientos }: { datos: Map<string, DlrfxData>, vencimientos: Map<string, string> }) => {
  const { spot, calculados } = useMemo(() => {
    const spot = datos.get('DLR/SPOT');
    const precioSpot = spot?.l;
    const lista: { ticker: string, precio: number | null, diasVto: number, tna: number | null, actualizado: string | null }[] = [];
    
    if (!vencimientos || vencimientos.size === 0) {
      return { spot, calculados: lista };
    }

    datos.forEach((valor, ticker) => {
      if (ticker === 'DLR/SPOT' || !valor.l || !ticker.startsWith('DLR/') || ticker.includes(' ')) {
          return; 
        }
      if (ticker.split('/').length > 2) {
          return;
      }
      const { diasVto } = getVtoInfo(ticker, vencimientos);
      if (diasVto <= 1) return; 

      let tna: number | null = null;
      if (precioSpot && valor.l && diasVto > 0) {
        tna = ((valor.l / precioSpot) - 1) * (365 / diasVto);
      }
      lista.push({ ticker, precio: valor.l, diasVto, tna, actualizado: formatTimestamp(valor.ts) });
    });
    lista.sort((a, b) => a.diasVto - b.diasVto);
    return { spot, calculados: lista };
  }, [datos, vencimientos]);

  return (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
      <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0, textAlign: 'center' }}>
        Futuros de dólar
        </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Precio Futuro</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Días Vto.</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TNA</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Últ. Act.</th>
            </tr>
          </thead>
          <tbody>
            {spot ? (
              <tr style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#111827', textAlign: 'center'}}>{spot.t}</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#111827' , textAlign: 'center'}}>{formatValue(spot.l, '', 2)}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>-</td>
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>-</td>
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatTimestamp(spot.ts)}</td>
              </tr>
            ) : (
              <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>Cargando precio Spot (DLR/SPOT)...</td></tr>
            )}
            {calculados.length > 0 ? (
              calculados.map((item) => (
                <tr key={item.ticker} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563', textAlign: 'center' }}>{item.ticker}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' , textAlign: 'center'}}>{formatValue(item.precio, '', 2)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' , textAlign: 'center'}}>{item.diasVto}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: item.tna && item.tna < 0 ? '#ef4444' : '#059669', textAlign: 'center' }}>
                    {formatValue(item.tna)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#4b5563' }}>{item.actualizado}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Cargando datos de futuros...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// ==================================================================
// 💎 💎 COMPONENTE TablaSinteticosDL (ACTUALIZADO CON TEM) 💎 💎
// ==================================================================
type SinteticoDL = {
  tickerLecap: string;
  tickerFuturo: string;
  dias: number;
  precioLetra: number | null;
  precioFuturo: number | null;
  tnaCalculada: number | null;
  temSintetica: number | null; // <-- 💎 CAMBIO 1: Añadido el tipo
};

const TablaSinteticosDL = ({ bonos, futuros, vencimientos }: { 
  bonos: Bono[], 
  futuros: Map<string, DlrfxData>,
  vencimientos: Map<string, string>
}) => {
  
  const calculados: SinteticoDL[] = [];
 
  bonos.forEach((bono) => {
    // Filtros 1, 2, 3, 4 (sin cambios)
    if (bono.p === null || bono.p <= 0 || !bono.dv || bono.dv <= 0 || !bono.vto) {
        return;
    }
    let tickerFuturo = '';
    let mesTicker = '';
    try {
      const vtoDate = parseISO(bono.vto);
      mesTicker = format(vtoDate, 'MMMyy', { locale: es }).toUpperCase();
      tickerFuturo = `DLR/${mesTicker}`;
    } catch(e) {
      return;
    }
    const futuro = futuros.get(tickerFuturo);
    const precioFuturo = futuro?.l;
    if (!futuro || !precioFuturo || precioFuturo <= 0) {
      return;
    }
    const vtoFuturoExacta = vencimientos.get(mesTicker); 
    if (!vtoFuturoExacta || bono.vto !== vtoFuturoExacta) {
        return;
    }

    // --- Cálculo TNA (sin cambios) ---
    let tnaCalc: number | null = null;
    let temCalc: number | null = null; // <-- 💎 CAMBIO 2: Inicializar TEM
    const precio_letra_base_100 = bono.p / 100;
    
    tnaCalc = ((precioFuturo / precio_letra_base_100) - 1) * (365 / bono.dv);
    
    // --- 💎 CAMBIO 3: CÁLCULO DE LA NUEVA FÓRMULA TEM 💎 ---
    if (tnaCalc !== null && bono.dv > 0) {
        // Formula: ((tna * dias / 365) + 1)^(30 / dias) - 1
        const factorTasa = (tnaCalc * bono.dv / 365) + 1;
        const exponente = 30 / bono.dv;
        temCalc = Math.pow(factorTasa, exponente) - 1;
    }
    // --- Fin del Cálculo TEM ---
  
    calculados.push({
      tickerLecap: bono.t,
      tickerFuturo: tickerFuturo,
      dias: bono.dv,
      precioLetra: bono.p,
      precioFuturo: precioFuturo,
      tnaCalculada: tnaCalc,
      temSintetica: temCalc, // <-- 💎 CAMBIO 4: Añadir al objeto
    });
  });

  calculados.sort((a, b) => a.dias - b.dias);

  return (
  <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 , textAlign: 'center'}}>
    Sintético de tasa (DL + Venta Futuro)
    </h2>
    <div style={{ overflowX: 'auto'}}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead style={{ position: 'sticky', top: 0 }}>
      <tr style={{ background: '#021751', color: 'white' }}>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Letra</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Días T+1</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Precio Letra</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Futuro (Hedge)</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Precio Futuro</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TNA (Sintética)</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TEM (Sintética)</th> {/* <-- 💎 CAMBIO 5: Header añadido */}
      </tr>
      </thead>
      <tbody>
      {calculados.length > 0 ? (
        calculados.map((item) => (
        <tr key={item.tickerLecap} style={{ borderTop: '1px solid #e5e7eb' }}>
          <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563', textAlign: 'center' }}>{item.tickerLecap}</td>
          <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{item.dias}</td>
          <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.precioLetra, '', 2)}</td>
          <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{item.tickerFuturo}</td>
          <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.precioFuturo, '', 2)}</td>
          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, background: item.tnaCalculada && item.tnaCalculada > 0 ? '#f0fdf4' : '#fef2f2', color: item.tnaCalculada && item.tnaCalculada > 0 ? '#059669' : '#ef4444', textAlign: 'center' }}>
            {formatValue(item.tnaCalculada)}
          </td>
          {/* --- 💎 CAMBIO 6: Celda añadida --- */}
          <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563', textAlign: 'center' }}>
            {formatValue(item.temSintetica)}
          </td>
        </tr>
        ))
      ) : (
        <tr><td colSpan={7} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No hay bonos DL con vencimiento coincidente al de un futuro.</td></tr> /* <-- 💎 CAMBIO 7: colSpan a 7 */
      )}
      </tbody>
    </table>
    </div>
  </div>
  );
};


// ==================================================================
// COMPONENTE PRINCIPAL (Sin cambios)
// ==================================================================
export default function DollarLinkedPage() {
    const [bonosDL, setBonosDL] = useState<Bono[]>([]);
    const [estado, setEstado] = useState('Cargando...');
    const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
    const segmentosDeEstaPagina = ['ON_DL'];

    const [datosSinteticos, setDatosSinteticos] = useState<Map<string, DlrfxData>>(new Map());
    const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio | null>(null);
    const [vencimientosMap, setVencimientosMap] = useState<Map<string, string> | null>(null);
    
    const fetchVencimientos = async (): Promise<Map<string, string> | null> => {
      const { data, error } = await supabase
        .from('vencimientos_rofex')
        .select('ticker, fecha_vto');
      if (error) { console.error("Error fetching vencimientos rofex:", error); return null; }
      if (!data) return null;
      const newMap = new Map<string, string>();
      (data as { ticker?: string, fecha_vto?: string }[]).forEach(v => {
        if (v.ticker && v.fecha_vto) {
          newMap.set(String(v.ticker).toUpperCase(), v.fecha_vto);
        }
      });
      setVencimientosMap(newMap);
      return newMap;
    };

    const fetchInitialData = async () => {
        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const columnasNecesarias = 't,vto,p,tir,tna,tem,v,s,pd,RD,dv,ua,pc';
        
        const { data: bonosData, error: bonosError } = await supabase.from('latest_bonds').select(columnasNecesarias).gte('vto', manana.toISOString()).in('s', segmentosDeEstaPagina);
        if (bonosError) console.error("Error fetching bonds:", bonosError);
        else if (bonosData) {
            setBonosDL(bonosData as Bono[]);
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

        const { data: tipoDeCambioData, error: tipoDeCambioError } = await supabase
          .from('tipodecambio')
          .select('datos')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (tipoDeCambioError) {
          console.error('Error al obtener tipo de cambio:', tipoDeCambioError);
        } else if (tipoDeCambioData) {
          setTipoDeCambio(tipoDeCambioData.datos);
        }
    };

    const fetchInitialDlrfx = async () => {
      const { data, error } = await supabase.from('dlrfx2').select('t, l, ld, ts');
      if (error) {
        console.error("Error fetching dlrfx:", error);
      } else if (data) {
        const initialMap = new Map<string, DlrfxData>();
        (data as DlrfxData[]).forEach(item => {
          initialMap.set(item.t, item);
        });
        setDatosSinteticos(initialMap);
      }
    };

    useEffect(() => {
      let bondChannel: any = null;
      let dlrfxChannel: any = null;
      let tipoDeCambioChannel: any = null;
  
      const setupSuscripciones = (segmentosRequeridos: string[]) => {
        const realtimeFilter = `s=in.(${segmentosRequeridos.map(s => `"${s}"`).join(',')})`;
        bondChannel = supabase.channel('realtime-datosbonos-dl')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'datosbonos', filter: realtimeFilter }, payload => {
            const bonoActualizado = payload.new as Bono;
            setBonosDL(prev => {
              const existe = prev.some(b => b.t === bonoActualizado.t);
              return existe ? prev.map(b => b.t === bonoActualizado.t ? bonoActualizado : b) : [...prev, bonoActualizado];
            });
            setUltimaActualizacion(bonoActualizado.ua || null);
          })
          .subscribe();
  
        dlrfxChannel = supabase.channel('realtime-dlrfx-dl')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'dlrfx2' }, payload => {
            const nuevoDato = payload.new as DlrfxData;
            if (nuevoDato && nuevoDato.t) {
              setDatosSinteticos(mapaActual => {
                const nuevoMapa = new Map(mapaActual);
                nuevoMapa.set(nuevoDato.t, nuevoDato);
                return nuevoMapa;
              });
            }
          })
          .subscribe();
  
        tipoDeCambioChannel = supabase.channel('tipodecambio-changes-dl')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tipodecambio' }, (payload) => {
            if (payload.new && payload.new.datos) {
              setTipoDeCambio(payload.new.datos);
              setUltimaActualizacion(payload.new.datos.h);
            }
          })
          .subscribe();
  
        return { bondChannel, dlrfxChannel, tipoDeCambioChannel };
      };
  
      (async () => {
        const segmentosRequeridos = segmentosDeEstaPagina;
        await fetchVencimientos();
        await fetchInitialData();
        await fetchInitialDlrfx();
        const channels = setupSuscripciones(segmentosRequeridos);
        bondChannel = channels.bondChannel;
        dlrfxChannel = channels.dlrfxChannel;
        tipoDeCambioChannel = channels.tipoDeCambioChannel;
  
        const handleVisibilityChange = () => {
          if (document.hidden) {
            if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
            if (dlrfxChannel?.unsubscribe) dlrfxChannel.unsubscribe();
            if (tipoDeCambioChannel?.unsubscribe) tipoDeCambioChannel.unsubscribe();
          } else {
            fetchVencimientos();
            fetchInitialData();
            fetchInitialDlrfx();
            if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
            if (dlrfxChannel?.unsubscribe) dlrfxChannel.unsubscribe();
            if (tipoDeCambioChannel?.unsubscribe) tipoDeCambioChannel.unsubscribe();
            
            const ch = setupSuscripciones(segmentosRequeridos);
            bondChannel = ch.bondChannel;
            dlrfxChannel = ch.dlrfxChannel;
            tipoDeCambioChannel = ch.tipoDeCambioChannel;
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
  
        return () => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          if (bondChannel) supabase.removeChannel(bondChannel);
          if (dlrfxChannel) supabase.removeChannel(dlrfxChannel);
          if (tipoDeCambioChannel) supabase.removeChannel(tipoDeCambioChannel);
        };
      })();
  
    }, []);
      
    const maxDiasDelSegmento = (() => {
      if (bonosDL.length === 0) return 1000;
      const maxDias = Math.max(...bonosDL.map(b => b.dv));
      return isFinite(maxDias) ? maxDias : 1000;
    })();

    useEffect(() => {
        setRangoDias([0, maxDiasDelSegmento]);
    }, [maxDiasDelSegmento]);

    const datosParaGrafico = bonosDL.filter(b => b.dv >= rangoDias[0] && b.dv <= rangoDias[1]);
    const datosParaTabla = [...bonosDL].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());

    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Curva de Rendimiento: ONs Dollar Linked</h1>
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                  {ultimaActualizacion && estado !== 'Cargando instrumentos...' ? (
                      <span style={{ color: '#374151', fontWeight: 500 }}>
                          Estado: <strong>Actualizado el {formatDateTime(ultimaActualizacion)}</strong>
                      </span>
                  ) : (
                      <span>Estado: <strong>{estado}</strong></span>
                  )}
                </div>

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
                      segmentoActivo="DL" 
                      xAxisKey="dv"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '2rem' }}>
                 <div style={{ margin: '1rem 0', padding: '0.75rem 1rem', background: '#e0f7fa', borderLeft: '5px solid #00bcd4', borderRadius: '4px', color: '#006064', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span style={{ marginRight: '8px' }}>ⓘ</span>
                    El fondo <strong>celeste</strong> en el precio indica que se utilizó el <strong>Cierre Anterior</strong> en lugar del Último Precio.
                  </div>   
                    <TablaGeneral titulo="Dollar Linked" datos={datosParaTabla} />

                    {vencimientosMap === null ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Cargando vencimientos...</div>
                    ) : (
                      <>
                        <TablaSinteticosDL 
                          bonos={datosParaTabla} 
                          futuros={datosSinteticos} 
                          vencimientos={vencimientosMap} 
                        />
                        <TablaSinteticos 
                          datos={datosSinteticos} 
                          vencimientos={vencimientosMap} 
                        />
                      </>
                    )}
                </div>
            </div>
        </Layout>
    );
}