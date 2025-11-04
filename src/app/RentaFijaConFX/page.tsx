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
// DEFINICIÓN DE TIPOS (ACTUALIZADA)
// ==================================================================
type Bono = {
  t: string;     // ticker
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
  t: string;
  l: number | null;  // last price
  ld: number | null; // last date
  ts: number | null; // timestamp
};
// --- NUEVO: TIPO PARA LOS DATOS DE TIPO DE CAMBIO ---
type TipoDeCambio = {
  valor_ccl: number;
  valor_mep: number;
  h: string; 
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

// --- 💎 AÑADIR ESTE COMPONENTE 💎 ---
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
// COMPONENTE TablaGeneral (Actualizado para nombres cortos)
// ==================================================================
const TablaGeneral = ({ titulo, datos }: { titulo: string, datos: Bono[] }) => (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0, textAlign: 'center'}}>
          {titulo}
        </h2>
      {/* 💎 CAMBIO ANTERIOR: Se eliminó 'maxHeight' de este div 💎 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#021751', color: 'white' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Ticker</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>VTO</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600}}>Precio</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Var</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TIR</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TNA</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TEM</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>RD</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>MEP Breakeven</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((item: Bono) => (
                <tr key={item.t} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563', textAlign: 'center' }}>{item.t}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatDate(item.vto)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.p,'',2)}</td> 
                  <td style={{ 
                      padding: '0.75rem 1rem', 
                      color: item.v >= 0 ? '#22c55e' : '#ef4444',
                      fontWeight: 500,
                      textAlign: 'center'
                      }}>
                    {formatValue(item.v)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.tir)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.tna)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.tem)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.RD)}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{item.mb ? `$${item.mb.toFixed(2)}` : '-'}</td>
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
// "DLR/SPOT" -> 0 días
const getVtoInfo = (ticker: string,
  vencimientos: Map<string, string>
): { diasVto: number, vtoString: string } => {
  const hoy = startOfDay(new Date());
  const partes = ticker.split('/');
  if (partes.length < 2 || partes[1] === 'SPOT') { // <--- CORREGIDO
    return { diasVto: 0, vtoString: 'SPOT' };
  }
  if (partes[1] === '24hs') {
    return { diasVto: 1, vtoString: '24hs' };
  }


try {
    const tickerMes = partes[1].toUpperCase(); // ej. "DIC25"
   
    let fechaVto: Date;
    // 1. Buscamos el ticker en el mapa que vino de Supabase
    const fechaExactaStr = vencimientos.get(tickerMes); 

    if (fechaExactaStr) {
      // 2. SI LO ENCONTRAMOS: Usamos la fecha exacta de la DB
      // parseISO se usa para "YYYY-MM-DD"
      fechaVto = parseISO(fechaExactaStr);
    } else {
      console.log("Busco:", tickerMes, "→ clave exacta existe?", vencimientos.has(tickerMes));
      // 3. SI NO LO ENCONTRAMOS: Usamos la lógica vieja (fin de mes) como fallback
      console.warn(`Vencimiento exacto para ${tickerMes} no encontrado en DB. Usando fin de mes.`);
      const fechaParseada = parse(tickerMes, 'MMMyy', new Date(), { locale: es });
      fechaVto = endOfMonth(fechaParseada);
    }
   
    // 4. El resto del cálculo es idéntico
    const dias = differenceInDays(fechaVto, hoy);
    return { diasVto: dias > 0 ? dias : 0, vtoString: format(fechaVto, 'dd/MM/yy') };

  } catch (e) {
      console.error(`Error parseando ticker: ${ticker}`, e);
      return { diasVto: -1, vtoString: 'Error' }; 
  }
};

// ==================================================================
// --- 💎 COMPONENTE TablaSinteticos (Sin cambios) 💎 ---
// ==================================================================
const TablaSinteticos = ({ datos, vencimientos }: { datos: Map<string, DlrfxData>, vencimientos: Map<string, string> }) => {
 
  // --- PASO 5: CÁLCULOS MOVIDOS A useMemo ---
  const { spot, calculados } = useMemo(() => {
    // 1. Encontrar el precio SPOT (Contado Inmediato)
    const spot = datos.get('DLR/SPOT');
    const precioSpot = spot?.l;

    // 2. Calcular rendimientos
    const lista: SinteticoCalculado[] = [];
   
    // Si vencimientos aún no cargó (null) o está vacío (size 0), no calculamos
    // Nota: El chequeo de 'null' se hace en el render de LecapsPage (Paso 4)
    // pero dejamos este por robustez.
    if (!vencimientos || vencimientos.size === 0) {
      return { spot, calculados: lista };
    }

    datos.forEach((valor, ticker) => {
      // Filtramos:
      // 1. El propio SPOT
      // 2. Tickers sin precio (NULL)
      // 3. Tickers que no son 'DLR/' (ej. ORO/NOV25)
      // 4. Tickers que contienen espacios (ej. DLR/DIC25 A)
      if (ticker === 'DLR/SPOT' || 
          !valor.l || 
          !ticker.startsWith('DLR/') ||
          ticker.includes(' ')
         ) {
          return; 
        }

      const { diasVto } = getVtoInfo(ticker, vencimientos);
      // Omitir CI, 24hs, o errores de parseo
      if (diasVto <= 1) return; 

      let tna: number | null = null;
      if (precioSpot && valor.l && diasVto > 0) {
        // TNA = ((Precio_Futuro / Precio_Spot) - 1) * (365 / Dias_Vto)
        tna = ((valor.l / precioSpot) - 1) * (365 / diasVto);
      }

      lista.push({
        ticker: ticker,
        precio: valor.l,
        diasVto: diasVto,
        tna: tna,
        actualizado: formatTimestamp(valor.ts), // Formatear el timestamp
      });
    });

    // 3. Ordenar por días al vencimiento
    lista.sort((a, b) => a.diasVto - b.diasVto);

    return { spot, calculados: lista };

  }, [datos, vencimientos]); // Dependencias del useMemo
  // --- FIN PASO 5 ---

  // 4. Renderizar la tabla (usando 'spot' y 'calculados' del useMemo)
  return (
    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden'}}>
      <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 , textAlign: 'center'}}>
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
            {/* Fila especial para el SPOT */}
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
           
            {/* Filas para los futuros calculados */}
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
// --- 💎 NUEVO COMPONENTE: TablaSinteticosUSD (Tasa en Dólares) 💎 ---
// ==================================================================
type SinteticoUSD = {
  tickerLecap: string;
  tickerFuturo: string;
  dias: number;
  rdArs: number;
  tnaUsd: number | null; // Reutilizaremos este campo para pasar el RD
  rdUsd: number | null;
  tci: number | null;
};

// ==================================================================
// 💎 CAMBIO 1: Añadir 'vencimientos' a las props
// ==================================================================
const TablaSinteticosUSD = ({ bonos, futuros, vencimientos }: { 
  bonos: Bono[], 
  futuros: Map<string, DlrfxData>,
  vencimientos: Map<string, string> // <-- AÑADIDO
}) => {
 
  // 1. Encontrar el precio SPOT (Contado Inmediato)
  const spot = futuros.get('DLR/SPOT');
  const precioSpot = spot?.l;

  // 2. Calcular rendimientos
  const calculados: SinteticoUSD[] = [];
 
  bonos.forEach((bono) => {
    // Filtro 1: Datos básicos del bono (RD, días, vto)
    if (bono.RD === null || bono.RD === undefined || !bono.dv || bono.dv <= 0 || !bono.vto) {
        return;
    }

    // Buscar el futuro correspondiente
    let tickerFuturo = '';
    let mesTicker = ''; // <-- Necesito esta variable
    try {
      const vtoDate = parseISO(bono.vto);
      mesTicker = format(vtoDate, 'MMMyy', { locale: es }).toUpperCase(); // ej: "ENE26"
      tickerFuturo = `DLR/${mesTicker}`; // ej: "DLR/ENE26"
    } catch(e) {
      return; // Fecha de bono inválida
    }

    // Filtro 2: ¿Existe el futuro y tiene precio?
    const futuro = futuros.get(tickerFuturo);
    const precioFuturo = futuro?.l;
    if (!futuro || !precioFuturo || precioFuturo <= 0) {
      // No hay futuro con ese nombre o no tiene precio
      return;
    }

    // ==================================================================
    // 💎 CAMBIO 2: Filtro de coincidencia de fecha EXACTA
    // ==================================================================
    // bono.vto (de la DB de bonos) ej: "2026-01-16"
    // vencimientos.get(mesTicker) (de la DB de rofex) ej: "2026-01-30"
    
    const vtoFuturoExacta = vencimientos.get(mesTicker); 
    
    if (!vtoFuturoExacta || bono.vto !== vtoFuturoExacta) {
        // Si no encontramos la fecha de vto del futuro en el mapa, o
        // si la fecha de vto del bono (S16E6) NO es igual a la vto del futuro (DLR/ENE26)
        // entonces, no incluir esta fila.
        return;
    }
    // --- 💎 FIN CAMBIO 2 💎 ---


    // Si pasa todos los filtros, calcular...
    let tnaUsd: number | null = null;
    let rdUsd: number | null = null;
    let tci: number | null = null;
    
    // Ya chequeamos precioFuturo, así que solo falta precioSpot
    if (precioSpot && bono.dv > 0) {
      const rd_lecap = bono.RD; 
      const dias_lecap = bono.dv;
      const te_lecap_factor = (1 + rd_lecap);
      const te_deval_factor = (precioFuturo / precioSpot);
      const te_usd = (te_lecap_factor / te_deval_factor) - 1;
      rdUsd = te_usd;
      tnaUsd = te_usd * (365 / dias_lecap);
      tci = precioFuturo / te_lecap_factor;
    }
  
    calculados.push({
      tickerLecap: bono.t,
      tickerFuturo: tickerFuturo,
      dias: bono.dv,
      rdArs: bono.RD,    // <-- Pasamos el RD
      rdUsd: rdUsd,
      tnaUsd: tnaUsd,
      tci: tci,
    });
  });

  // 3. Ordenar por días al vencimiento
  calculados.sort((a, b) => a.dias - b.dias);

  // 4. Renderizar la tabla
  return (
  <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0 , textAlign: 'center'}}>
    Sintético Tasa en Dólares (Lecap + Venta Futuro)
    </h2>
    <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead style={{ position: 'sticky', top: 0 }}>
      <tr style={{ background: '#021751', color: 'white' }}>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Letra (Tasa)</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Días</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Futuro (Hedge)</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>RD (USD)</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TNA (USD)</th>
        <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>TCI</th>
      </tr>
      </thead>
      <tbody>
      {!precioSpot && (
        <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>Cargando precio Spot (DLR/SPOT) para calcular...</td></tr>
      )}
      {calculados.length > 0 ? (
        calculados.map((item) => (
        <tr key={item.tickerLecap} style={{ borderTop: '1px solid #e5e7eb' }}>
          <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#4b5563', textAlign: 'center' }}>{item.tickerLecap}</td>
          <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{item.dias}</td>
          <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{item.tickerFuturo}</td>
          <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.rdUsd)}</td>
          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, background: item.tnaUsd && item.tnaUsd > 0 ? '#f0fdf4' : '#fef2f2', color: item.tnaUsd && item.tnaUsd > 0 ? '#059669' : '#ef4444', textAlign: 'center' }}>
          {formatValue(item.tnaUsd)}
          </td>
          <td style={{ padding: '0.75rem 1rem', color: '#4b5563', textAlign: 'center' }}>{formatValue(item.tci, '', 2)}</td>
        </tr>
        ))
      ) : (
        <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No hay letras con vencimiento coincidente al de un futuro.</td></tr>
      )}
      </tbody>
    </table>
    </div>
  </div>
  );
};


// ==================================================================
// COMPONENTE PRINCIPAL DE LA PÁGINA (ACTUALIZADO)
// ==================================================================
export default function LecapsPage() {
  const [bonosLecaps, setBonosLecaps] = useState<Bono[]>([]);
  const [estado, setEstado] = useState('Cargando...');
  const [rangoDias, setRangoDias] = useState<[number, number]>([0, 0]);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null);
  const [datosSinteticos, setDatosSinteticos] = useState<Map<string, DlrfxData>>(new Map());
  const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio | null>(null);
  // --- PASO 1 ---
  const [vencimientosMap, setVencimientosMap] = useState<Map<string, string> | null>(null);
  const segmentosDeEstaPagina = ['LECAP', 'BONCAP', 'BONTE', 'DUAL TAMAR'];
  const manana = new Date();
  manana.setDate(manana.getDate() + 1)

  // --- PASO 2: Nueva función fetchVencimientos (movida fuera de useEffect) ---
  const fetchVencimientos = async (): Promise<Map<string, string> | null> => {
    const { data, error } = await supabase
      .from('vencimientos_rofex')
      .select('ticker, fecha_vto');
 
    if (error) {
      console.error("Error fetching vencimientos rofex:", error);
      return null;
    }
 
    if (!data) return null;
 
    const newMap = new Map<string, string>();
    (data as { ticker?: string, fecha_vto?: string }[]).forEach(v => {
      if (v.ticker && v.fecha_vto) {
        newMap.set(String(v.ticker).toUpperCase(), v.fecha_vto);
      }
    });
    console.log("Mapa de Vencimientos Creado:", newMap);
    setVencimientosMap(newMap);
    return newMap;
  };

  // --- PASO 3: Funciones movidas fuera de useEffect para que el IIFE pueda llamarlas ---
  const fetchInitialData = async () => {
    // ... (código de fetch bonos sin cambios) ...
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const columnasNecesarias = 't,vto,p,tir,tna,tem,v,s,pd,RD,dv,ua, mb';
   
    const { data: bonosData, error: bonosError } = await supabase.from('latest_bonds').select(columnasNecesarias).gte('vto', manana.toISOString()).in('s', segmentosDeEstaPagina);
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
  }
  };

  const fetchInitialDlrfx = async () => {
    // ... (código de fetch dlrfx sin cambios) ...
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

  // --- PASO 3: Lógica de useEffect Reordenada ---
  useEffect(() => {
    let bondChannel: any = null;
    let dlrfxChannel: any = null;
    let tipoDeCambioChannel: any = null;
 
    const setupSuscripciones = (segmentosRequeridos: string[]) => {
      const realtimeFilter = `s=in.(${segmentosRequeridos.map(s => `"${s}"`).join(',')})`;
      bondChannel = supabase.channel('realtime-datosbonos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datosbonos', filter: realtimeFilter }, payload => {
          const bonoActualizado = payload.new as Bono;
          setBonosLecaps(prev => {
            const existe = prev.some(b => b.t === bonoActualizado.t);
            return existe ? prev.map(b => b.t === bonoActualizado.t ? bonoActualizado : b) : [...prev, bonoActualizado];
          });
          setUltimaActualizacion(bonoActualizado.ua || null);
        })
        .subscribe();
 
      dlrfxChannel = supabase.channel('realtime-dlrfx')
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
 
      tipoDeCambioChannel = supabase.channel('tipodecambio-changes')
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
 
      // 1) Cargar vencimientos y esperar que termine
      const map = await fetchVencimientos();
 
      // Si falló la carga de vencimientos, opcional: seguir o abortar.
      if (!map) {
        console.warn("No se pudieron cargar vencimientos; la UI seguirá intentando.");
        // Podés elegir return aquí si preferís no continuar sin vencimientos.
      }
 
      // 2) Una vez que tenemos vencimientos, cargar los demás recursos (bonos, dlrfx, tipo de cambio)
      await fetchInitialData();    // tu función existente que hace setBonosLecaps()
      await fetchInitialDlrfx();   // setDatosSinteticos(...)
 
      // 3) Luego setear suscripciones (ahora que vencimientos están disponibles)
      const channels = setupSuscripciones(segmentosRequeridos);
      bondChannel = channels.bondChannel;
      dlrfxChannel = channels.dlrfxChannel;
      tipoDeCambioChannel = channels.tipoDeCambioChannel;
 
      // 4) Listener visibilidad (igual que antes)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
          if (dlrfxChannel?.unsubscribe) dlrfxChannel.unsubscribe();
          if (tipoDeCambioChannel?.unsubscribe) tipoDeCambioChannel.unsubscribe();
        } else {
          // recargar datos y re-suscribir
          fetchInitialData();
          fetchInitialDlrfx();
          if (bondChannel?.unsubscribe) bondChannel.unsubscribe();
          if (tipoDeCambioChannel?.unsubscribe) tipoDeCambioChannel.unsubscribe();
          const ch = setupSuscripciones(segmentosRequeridos);
          bondChannel = ch.bondChannel;
          dlrfxChannel = ch.dlrfxChannel;
          tipoDeCambioChannel = ch.tipoDeCambioChannel;
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
 
      // cleanup
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (bondChannel) supabase.removeChannel(bondChannel);
        if (dlrfxChannel) supabase.removeChannel(dlrfxChannel);
        if (tipoDeCambioChannel) supabase.removeChannel(tipoDeCambioChannel);
      };
    })();
 
    // nota: el cleanup interior se maneja arriba en el return del IIFE
  }, []);
    // --- FIN PASO 3 ---
 
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '2rem' }}>
                    <TablaGeneral titulo="Renta fija" datos={datosParaTabla} />

                    {/* ==================================================================
                      💎 CAMBIO 3: Mover las dos tablas que dependen de 
                         vencimientosMap dentro del renderizado condicional 
                    ==================================================================
                    */}
                    {vencimientosMap === null ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>Cargando vencimientos...</div>
                    ) : (
                      <>
                        <TablaSinteticosUSD 
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