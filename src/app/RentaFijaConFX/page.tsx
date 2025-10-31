'use client';
import Layout from '@/components/layout/Layout';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import CurvaRendimientoChart from '@/components/ui/CurvaRendimientoChart';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { format, parseISO, parse, differenceInDays, endOfMonth } from 'date-fns';
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
  tna: number | null;
  tem: number | null;
  s: string;       // segmento
  dv: number;  // dias_vto
  RD: number | null;
  mb: number | null; // mep_breakeven
  ua: string | null; // ultimo_anuncio
};
// --- NUEVO TIPO para datos de DLRFX ---
type DlrfxData = {
  ticker: string;
  l: number | null;  // last price
  ld: number | null; // last date
  ts: number | null; // timestamp
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
// --- NUEVA FUNCIÓN AUXILIAR para formatear timestamp de Rofex ---
const formatTimestamp = (ts: number | null) => {
  if (!ts) return '-';
  try {
    // El timestamp de Rofex viene en milisegundos
    return format(new Date(ts), 'HH:mm:ss');
  } catch (e) {
    return '-';
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
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TNA</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TEM</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>RD</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>MEP Breakeven</th>
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
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tna)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tem)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.RD)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.mb ? `$${item.mb.toFixed(2)}` : '-'}</td>
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
type SinteticoCalculado = {
  ticker: string;
  precio: number | null;
  diasVto: number;
  tna: number | null;
  actualizado: string | null; // Usando 'ts'
};

// Función para parsear el ticker y obtener la fecha de vto
// "DLR/OCT24" -> 31 de Octubre 2024
// "DLR/CI" -> 0 días
const getVtoInfo = (ticker: string): { diasVto: number, vtoString: string } => {
  const hoy = new Date();
  const partes = ticker.split('/');
  if (partes.length < 2 || partes[1] === 'CI') {
    return { diasVto: 0, vtoString: 'CI' };
  }
  if (partes[1] === '24hs') {
    return { diasVto: 1, vtoString: '24hs' };
  }

  try {
    // Parsea "OCT24" a una fecha (ej. 1 Oct 2024)
    const fechaVto = parse(partes[1], 'MMMyy', new Date());
    // Los futuros Rofex vencen el último día hábil del mes.
    // Usamos endOfMonth como una aproximación simple.
    const finDeMes = endOfMonth(fechaVto);
    const dias = differenceInDays(finDeMes, hoy);
    return { diasVto: dias > 0 ? dias : 0, vtoString: format(finDeMes, 'dd/MM/yy') };
  } catch (e) {
    return { diasVto: -1, vtoString: 'Error' }; // Ticker no parseable
  }
};
const TablaSinteticos = ({ datos }: { datos: Map<string, DlrfxData> }) => {
  
  // 1. Encontrar el precio SPOT (Contado Inmediato)
  // 🚨 ASUNCIÓN: Tu ticker de spot se llama 'DLR/CI'
  const spot = datos.get('DLR/CI');
  const precioSpot = spot?.l;

  // 2. Calcular rendimientos
  const calculados: SinteticoCalculado[] = [];
  
  datos.forEach((valor, ticker) => {
    // Omitir el spot mismo o tickers sin precio
    if (ticker === 'DLR/CI' || !valor.l) return; 

    const { diasVto } = getVtoInfo(ticker);
    // Omitir CI, 24hs, o errores de parseo
    if (diasVto <= 1) return; 

    let tna: number | null = null;
    if (precioSpot && valor.l && diasVto > 0) {
      // TNA = ((Precio_Futuro / Precio_Spot) - 1) * (365 / Dias_Vto)
      tna = ((valor.l / precioSpot) - 1) * (365 / diasVto);
    }

    calculados.push({
      ticker: ticker,
      precio: valor.l,
      diasVto: diasVto,
      tna: tna,
      actualizado: formatTimestamp(valor.ts), // Formatear el timestamp
    });
  });

  // 3. Ordenar por días al vencimiento
  calculados.sort((a, b) => a.diasVto - b.diasVto);

  // 4. Renderizar la tabla
  return (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
        Rendimiento Sintéticos (Dólar Futuro)
      </h2>
      <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Precio Futuro</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Días Vto.</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TNA</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Últ. Act.</th>
            </tr>
          </thead>
          <tbody>
            {/* Fila especial para el SPOT */}
            {spot ? (
              <tr style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#111827' }}>{spot.ticker} (Spot)</td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#111827' }}>{formatValue(spot.l, '', 2)}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>-</td>
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>-</td>
                <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatTimestamp(spot.ts)}</td>
              </tr>
            ) : (
              <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>Cargando precio Spot (DLR/CI)...</td></tr>
            )}
            
            {/* Filas para los futuros calculados */}
            {calculados.length > 0 ? (
              calculados.map((item) => (
                <tr key={item.ticker} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563' }}>{item.ticker}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.precio, '', 2)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.diasVto}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: item.tna && item.tna < 0 ? '#ef4444' : '#059669' }}>
                    {formatValue(item.tna)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.actualizado}</td>
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
// --- 💎 NUEVO COMPONENTE: TablaSinteticosUSD (Tasa en Dólares) 💎 ---
// ==================================================================
type SinteticoUSD = {
  tickerLecap: string;
  tickerFuturo: string;
  dias: number;
  tnaLecap: number;
  tnaUsd: number | null;
};

const TablaSinteticosUSD = ({ bonos, futuros }: { bonos: Bono[], futuros: Map<string, DlrfxData> }) => {
  
  // 1. Encontrar el precio SPOT (Contado Inmediato)
  const spot = futuros.get('DLR/CI');
  const precioSpot = spot?.l;

  // 2. Calcular rendimientos
  const calculados: SinteticoUSD[] = [];
  
  bonos.forEach((bono) => {
    // Necesitamos la TNA y los días de la letra
    if (!bono.tna || !bono.dv || bono.dv <= 0) return;

    // Buscar el futuro correspondiente
    // ej. VTO '2024-10-31T00:00:00' -> 'OCT24'
    let tickerFuturo = '';
    try {
        const vtoDate = parseISO(bono.vto);
        // Formatear a 'MMMyy' (ej. OCT24)
        const mesFuturo = format(vtoDate, 'MMMyy').toUpperCase(); 
        tickerFuturo = `DLR/${mesFuturo}`;
    } catch(e) {
        return; // Fecha de bono inválida
    }

    const futuro = futuros.get(tickerFuturo);
    const precioFuturo = futuro?.l;

    let tnaUsd: number | null = null;

    // Si tenemos todos los datos, calculamos
    if (precioSpot && precioFuturo && precioFuturo > 0 && bono.tna && bono.dv > 0) {
        const tna_lecap = bono.tna;
        const dias_lecap = bono.dv;

        // Tasa Efectiva en ARS (cuántos pesos tengo al final)
        const te_lecap_factor = (1 + (tna_lecap * dias_lecap / 365));
        
        // Tasa Efectiva de Devaluación (cuánto $/USD pagué vs. cuánto $/USD recibiré)
        const te_deval_factor = (precioFuturo / precioSpot);

        // Tasa Efectiva en USD = (Factor de ganancia en ARS / Factor de "pérdida" por devaluación) - 1
        const te_usd = (te_lecap_factor / te_deval_factor) - 1;

        // Convertir Tasa Efectiva en USD a TNA en USD
        tnaUsd = te_usd * (365 / dias_lecap);
    }
    
    calculados.push({
      tickerLecap: bono.t,
      tickerFuturo: tickerFuturo,
      dias: bono.dv,
      tnaLecap: bono.tna,
      tnaUsd: tnaUsd,
    });
  });

  // 3. Ordenar por días al vencimiento
  calculados.sort((a, b) => a.dias - b.dias);

  // 4. Renderizar la tabla
  return (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 }}>
        Sintético Tasa en Dólares (Lecap + Venta Futuro)
      </h2>
      <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Letra (Tasa)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Días</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TNA (ARS)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Futuro (Hedge)</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>TNA (USD)</th>
            </tr>
          </thead>
          <tbody>
            {!precioSpot && (
                 <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>Cargando precio Spot (DLR/CI) para calcular...</td></tr>
            )}
            {calculados.length > 0 ? (
              calculados.map((item) => (
                <tr key={item.tickerLecap} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563' }}>{item.tickerLecap}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.dias}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{formatValue(item.tnaLecap)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563' }}>{item.tickerFuturo}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, background: item.tnaUsd && item.tnaUsd > 0 ? '#f0fdf4' : '#fef2f2', color: item.tnaUsd && item.tnaUsd > 0 ? '#059669' : '#ef4444' }}>
                    {formatValue(item.tnaUsd)}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No hay letras (Lecaps) con TNA para calcular.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// --- FIN NUEVO COMPONENTE ---


// ==================================================================
// COMPONENTE PRINCIPAL DE LA PÁGINA (ACTUALIZADO)
// ==================================================================
export default function LecapsPage() {
    const [bonosLecaps, setBonosLecaps] = useState<Bono[]>([]);
    const [estado, setEstado] = useState('Cargando...');
    const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
    const [datosSinteticos, setDatosSinteticos] = useState<Map<string, DlrfxData>>(new Map());
    const segmentosDeEstaPagina = ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'];
    const manana = new Date();
    manana.setDate(manana.getDate() + 1)

   useEffect(() => {
        const segmentosRequeridos = segmentosDeEstaPagina;
        
        const fetchInitialData = async () => {
            // ... (código de fetch bonos sin cambios) ...
            const manana = new Date();
            manana.setDate(manana.getDate() + 1);
            const columnasNecesarias = 't,vto,p,tir,tna,tem,v,s,pd,RD,dv,ua, mb';
            
            const { data: bonosData, error: bonosError } = await supabase.from('latest_bonds').select(columnasNecesarias).gte('vto', manana.toISOString()).in('s', segmentosRequeridos);
            if (bonosError) console.error("Error fetching bonds:", bonosError);
            else if (bonosData) {
                setBonosLecaps(bonosData as Bono[]);
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

        const fetchInitialDlrfx = async () => {
          // ... (código de fetch dlrfx sin cambios) ...
          const { data, error } = await supabase.from('dlrfx').select('ticker, l, ld, ts');
          if (error) {
            console.error("Error fetching dlrfx:", error);
          } else if (data) {
            const initialMap = new Map<string, DlrfxData>();
            (data as DlrfxData[]).forEach(item => {
              initialMap.set(item.ticker, item);
            });
            setDatosSinteticos(initialMap);
          }
        };

        let bondChannel: any = null;
        let dlrfxChannel: any = null; 

        const setupSuscripciones = () => {
            // ... (código de suscripción a bonos sin cambios) ...
             const realtimeFilter = `s=in.(${segmentosRequeridos.map(s => `"${s}"`).join(',')})`;
             bondChannel = supabase.channel('realtime-datosbonos').on('postgres_changes', { event: '*', schema: 'public', table: 'datosbonos', filter: realtimeFilter }, payload => {
        	const bonoActualizado = payload.new as Bono;
      	setBonosLecaps(bonosActuales => {
        	const existe = bonosActuales.some(b => b.t === bonoActualizado.t);
      	return existe ? bonosActuales.map(b => b.t === bonoActualizado.t ? bonoActualizado : b) : [...bonosActuales, bonoActualizado];
      	});
    	setUltimaActualizacion(bonoActualizado.ua || null);
    }).subscribe();
             
            // ... (código de suscripción a dlrfx sin cambios) ...
            dlrfxChannel = supabase.channel('realtime-dlrfx')
              .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'dlrfx' }, 
                (payload) => {
                  const nuevoDato = payload.new as DlrfxData;
                  if (nuevoDato && nuevoDato.ticker) {
                    setDatosSinteticos(mapaActual => {
                      const nuevoMapa = new Map(mapaActual);
                      nuevoMapa.set(nuevoDato.ticker, nuevoDato);
                      return nuevoMapa;
                    });
                  }
                }
              ).subscribe();

            return { bondChannel, dlrfxChannel }; 
        };

        // ... (código de fetch/suscripción inicial sin cambios) ...
        fetchInitialData();
        fetchInitialDlrfx(); 
        ({ bondChannel, dlrfxChannel } = setupSuscripciones()); 

        // ... (código de 'handleVisibilityChange' sin cambios) ...
      	const handleVisibilityChange = () => {
        	if (document.hidden) {
        	  	 if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
                if (dlrfxChannel?.unsubscribe) dlrfxChannel.unsubscribe(); 
        	} else {
        	  	 fetchInitialData();
                fetchInitialDlrfx(); 
      	  	 if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
                if (dlrfxChannel?.unsubscribe) dlrfxChannel.unsubscribe(); 
        	  	 ({ bondChannel, dlrfxChannel } = setupSuscripciones()); 
        	}
      	};
      	document.addEventListener("visibilitychange", handleVisibilityChange);

        // ... (código de 'cleanup' sin cambios) ...
    	return () => {
    	document.removeEventListener("visibilitychange", handleVisibilityChange);
  	if (bondChannel) {
    	  	 supabase.removeChannel(bondChannel); 
    	}
        if (dlrfxChannel) {
    	  	 supabase.removeChannel(dlrfxChannel); 
    	}
  	};
  	}, []);
    
    // ... (código de 'maxDiasDelSegmento' y 'useEffect' para el slider sin cambios) ...
    const maxDiasDelSegmento = (() => {
        if (bonosLecaps.length === 0) return 1000;
        const maxDias = Math.max(...bonosLecaps.map(b => b.dv));
        return isFinite(maxDias) ? maxDias : 1000;
    })();

    useEffect(() => {
        setRangoDias([0, maxDiasDelSegmento]);
    }, [maxDiasDelSegmento]);

    const datosParaGrafico = bonosLecaps.filter(b => b.dv >= rangoDias[0] && b.dv <= rangoDias[1]);
    const datosParaTabla = [...bonosLecaps].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());

    return (
        <Layout>
            <div style={{ maxWidth: '1400px', margin: 'auto' }}>
            	{/* ... (código del título y estado sin cambios) ... */}
            	<h1 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' }}>Curva de Rendimiento: Renta fija Ars</h1>
            	<div style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9rem' }}>
            	  	 {ultimaActualizacion && estado !== 'Cargando instrumentos...' ? (
            	  	   <span style={{ color: '#374151', fontWeight: 500 }}>
            	  	   	 Estado: <strong>Actualizado el {formatDateTime(ultimaActualizacion)}</strong>
            	  	   </span>
      	) : (
      	  	   <span>Estado: <strong>{estado}</strong></span>
      	)}
    	</div>
            	
            	{/* ... (código del slider y gráfico sin cambios) ... */}
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
      	  	 segmentoActivo="LECAPs y Similares" 
    	    	 xAxisKey="dv"
      	  />
    	</div>
                
                {/* --- LAYOUT ACTUALIZADO --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginTop: '2rem' }}>
                    <TablaGeneral titulo="Renta fija" datos={datosParaTabla} />
                    
                    <TablaSinteticos datos={datosSinteticos} />

                    {/* --- 💎 NUEVA TABLA AÑADIDA AQUÍ 💎 --- */}
                    <TablaSinteticosUSD bonos={datosParaTabla} futuros={datosSinteticos} />
                </div>
            </div>
        </Layout>
    );
}