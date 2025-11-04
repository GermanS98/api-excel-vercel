'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect, useMemo } from 'react'; // <--- IMPORTADO useMemo
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
// import Sidebar from '@/components/ui/Sidebar'; // <-- No se usa
// import Link from 'next/link'; // <-- No se usa
import { format, parseISO, parse, differenceInDays, endOfMonth, startOfDay } from 'date-fns'; // <--- IMPORTS AÑADIDOS
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale'; // <--- IMPORT AÑADIDO

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
};

// --- 💎 TIPO AÑADIDO ---
type DlrfxData = {
  t: string;
  l: number | null;  // last price
  ld: number | null; // last date
  ts: number | null; // timestamp
};

// --- 💎 TIPO AÑADIDO ---
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

// --- 💎 FUNCIÓN AÑADIDA ---
const formatTimestamp = (ts: number | null) => {
  if (!ts) return '-';
  try {
    return format(new Date(ts), 'HH:mm:ss');
  } catch (e) {
    return '-';
  }
};

// --- 💎 FUNCIÓN AÑADIDA ---
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
// 💎 COMPONENTE AÑADIDO 💎
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
// COMPONENTE DE TABLA (Respetando tu estilo original)
// ==================================================================
const TablaGeneral = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
          {titulo}
        </h2>
      {/* NOTA: He quitado el 'maxHeight: 400px' para que la tabla se expanda 
        si así lo prefieres, como en el ejemplo anterior. 
        Si quieres limitarla, vuelve a añadir: maxHeight: '400px' 
      */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>VTO</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600}}>Precio</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Var</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TIR</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TNA</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TEM</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>RD</th>
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
                        color: item.v >= 0 ? '#22c55e' : '#ef4444',
                        fontWeight: 500
                        }}>
                    {formatValue(item.v)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tir)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tna)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tem)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.RD)}</td>
                </tr>
              ))
            ) : (
              // --- COLSPAN CORREGIDO A 8 ---
              <tr><td colSpan={8} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No se encontraron datos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
);

// ==================================================================
// 💎 COMPONENTE AÑADIDO (Futuros vs Spot) 💎
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
        Rendimiento Sintéticos (Dólar Futuro)
      </h2>
      <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
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
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#111827', textAlign: 'center'}}>{spot.t} (Spot)</td>
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
// 💎 💎 NUEVO COMPONENTE CON TU FÓRMULA 💎 💎
// ==================================================================
type SinteticoDL = {
  tickerLecap: string;
  tickerFuturo: string;
  dias: number;
  precioLetra: number | null;
  precioFuturo: number | null;
  tnaCalculada: number | null;
};

const TablaSinteticosDL = ({ bonos, futuros, vencimientos }: { 
  bonos: Bono[], 
  futuros: Map<string, DlrfxData>,
  vencimientos: Map<string, string>
}) => {
  
  // 1. Calcular rendimientos
  const calculados: SinteticoDL[] = [];
 
  bonos.forEach((bono) => {
    // Filtro 1: Datos básicos del bono (Precio, días, vto)
    if (bono.p === null || bono.p <= 0 || !bono.dv || bono.dv <= 0 || !bono.vto) {
        return;
    }

    // Filtro 2: Encontrar el futuro correspondiente
    let tickerFuturo = '';
    let mesTicker = '';
    try {
      const vtoDate = parseISO(bono.vto);
      mesTicker = format(vtoDate, 'MMMyy', { locale: es }).toUpperCase(); // ej: "ENE26"
      tickerFuturo = `DLR/${mesTicker}`; // ej: "DLR/ENE26"
    } catch(e) {
      return; // Fecha de bono inválida
    }

    // Filtro 3: ¿Existe el futuro y tiene precio?
    const futuro = futuros.get(tickerFuturo);
    const precioFuturo = futuro?.l;
    if (!futuro || !precioFuturo || precioFuturo <= 0) {
      return;
    }

    // Filtro 4: ¿Coinciden las fechas de vencimiento exactas?
    const vtoFuturoExacta = vencimientos.get(mesTicker); 
    if (!vtoFuturoExacta || bono.vto !== vtoFuturoExacta) {
        // La fecha de vto del bono (ej. 16/01) NO es igual a la vto del futuro (ej. 30/01)
        return;
    }

    // --- 💎 CÁLCULO DE LA NUEVA FÓRMULA 💎 ---
    let tnaCalc: number | null = null;
    const precio_letra_base_100 = bono.p / 100;
    
    tnaCalc = ((precioFuturo / precio_letra_base_100) - 1) * (365 / bono.dv);
    // --- Fin del Cálculo ---
  
    calculados.push({
      tickerLecap: bono.t,
      tickerFuturo: tickerFuturo,
      dias: bono.dv,
      precioLetra: bono.p,
      precioFuturo: precioFuturo,
      tnaCalculada: tnaCalc,
    });
  });

  // 3. Ordenar por días al vencimiento
  calculados.sort((a, b) => a.dias - b.dias);

  // 4. Renderizar la tabla
  return (
  <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 , textAlign: 'center'}}>
    TNA Sintética (DL + Venta Futuro)
    </h2>
    <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead style={{ position: 'sticky', top: 0 }}>
      <tr style={{ background: '#021751', color: 'white' }}>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Letra (DL)</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Días</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Precio Letra</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Futuro (Hedge)</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Precio Futuro</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TNA (Sintética)</th>
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
        </tr>
        ))
      ) : (
        <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No hay bonos DL con vencimiento coincidente al de un futuro.</td></tr>
      )}
      </tbody>
    </table>
    </div>
  </div>
  );
};


// ==================================================================
// COMPONENTE PRINCIPAL (LÓGICA DE 'useEffect' ACTUALIZADA)
// ==================================================================
export default function DollarLinkedPage() {
    const [bonosDL, setBonosDL] = useState<Bono[]>([]);
    const [estado, setEstado] = useState('Cargando...');
    // const [menuAbierto, setMenuAbierto] = useState(false); // No se usa
    const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
    const segmentosDeEstaPagina = ['DL', 'ON DL'];

    // --- 💎 ESTADOS AÑADIDOS ---
    const [datosSinteticos, setDatosSinteticos] = useState<Map<string, DlrfxData>>(new Map());
    const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio | null>(null);
    const [vencimientosMap, setVencimientosMap] = useState<Map<string, string> | null>(null);
    
    // --- 💎 FUNCIONES DE FETCH AÑADIDAS (fuera de useEffect) ---
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
        const columnasNecesarias = 't,vto,p,tir,tna,tem,v,s,pd,RD,dv,ua';
        
        // 1. Fetch Bonos (DL)
        const { data: bonosData, error: bonosError } = await supabase.from('latest_bonds').select(columnasNecesarias).gte('vto', manana.toISOString()).in('s', segmentosDeEstaPagina);
        if (bonosError) console.error("Error fetching bonds:", bonosError);
        else if (bonosData) {
            setBonosDL(bonosData as Bono[]); // <-- USA setBonosDL
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

        // 2. 💎 Fetch Tipo de Cambio (AÑADIDO)
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


    // --- 💎 LÓGICA DE useEffect REEMPLAZADA POR LA VERSIÓN COMPLEJA ---
    useEffect(() => {
      let bondChannel: any = null;
      let dlrfxChannel: any = null;
      let tipoDeCambioChannel: any = null;
  
      const setupSuscripciones = (segmentosRequeridos: string[]) => {
        // Suscripción 1: Bonos (DL)
        const realtimeFilter = `s=in.(${segmentosRequeridos.map(s => `"${s}"`).join(',')})`;
        bondChannel = supabase.channel('realtime-datosbonos-dl') // Canal renombrado para evitar conflictos
          .on('postgres_changes', { event: '*', schema: 'public', table: 'datosbonos', filter: realtimeFilter }, payload => {
            const bonoActualizado = payload.new as Bono;
            setBonosDL(prev => { // <-- USA setBonosDL
              const existe = prev.some(b => b.t === bonoActualizado.t);
              return existe ? prev.map(b => b.t === bonoActualizado.t ? bonoActualizado : b) : [...prev, bonoActualizado];
            });
            setUltimaActualizacion(bonoActualizado.ua || null);
          })
          .subscribe();
  
        // Suscripción 2: DLRFX (AÑADIDO)
        dlrfxChannel = supabase.channel('realtime-dlrfx-dl') // Canal renombrado
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
  
        // Suscripción 3: Tipo de Cambio (AÑADIDO)
        tipoDeCambioChannel = supabase.channel('tipodecambio-changes-dl') // Canal renombrado
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
  
        // 1) Cargar vencimientos primero
        await fetchVencimientos();
  
        // 2) Cargar los demás recursos
        await fetchInitialData();    // Carga Bonos (DL) y Tipo de Cambio
        await fetchInitialDlrfx();   // Carga Futuros
  
        // 3) Setear suscripciones
        const channels = setupSuscripciones(segmentosRequeridos);
        bondChannel = channels.bondChannel;
        dlrfxChannel = channels.dlrfxChannel;
        tipoDeCambioChannel = channels.tipoDeCambioChannel;
  
        // 4) Listener visibilidad
        const handleVisibilityChange = () => {
          if (document.hidden) {
            if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
            if (dlrfxChannel?.unsubscribe) dlrfxChannel.unsubscribe();
            if (tipoDeCambioChannel?.unsubscribe) tipoDeCambioChannel.unsubscribe();
          } else {
            // Recargar datos y re-suscribir
            fetchVencimientos(); // Re-fetch vencimientos por si acaso
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
  
        // Cleanup
        return () => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          if (bondChannel) supabase.removeChannel(bondChannel);
          if (dlrfxChannel) supabase.removeChannel(dlrfxChannel);
          if (tipoDeCambioChannel) supabase.removeChannel(tipoDeCambioChannel);
        };
      })();
  
    }, []); // Dependencia vacía para que corra 1 vez
      
    // --- Lógica de filtrado (sin cambios, usa bonosDL) ---
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Curva de Rendimiento: Dollar Linked</h1>
                <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
                  {ultimaActualizacion && estado !== 'Cargando instrumentos...' ? (
                      <span style={{ color: '#374151', fontWeight: 500 }}>
                          Estado: <strong>Actualizado el {formatDateTime(ultimaActualizacion)}</strong>
                      </span>
                  ) : (
                      <span>Estado: <strong>{estado}</strong></span>
                  )}
                </div>

                {/* --- 💎 SECCIÓN DE InfoCards AÑADIDA 💎 --- */}
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
                
                {/* --- Gráfico y Slider (sin cambios) --- */}
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

                {/* --- 💎 LAYOUT DE TABLAS ACTUALIZADO 💎 --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '2rem' }}>
                    
                    <TablaGeneral titulo="Dollar Linked" datos={datosParaTabla} />

                    {/* Renderizado condicional de las nuevas tablas */}
                    {vencimientosMap === null ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Cargando vencimientos...</div>
                    ) : (
                      <>
                        {/* 💎 TU NUEVA TABLA CON FÓRMULA 💎 */}
                        <TablaSinteticosDL 
                          bonos={datosParaTabla} 
                          futuros={datosSinteticos} 
                          vencimientos={vencimientosMap} 
                        />

                        {/* 💎 TABLA DE FUTUROS VS SPOT 💎 */}
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