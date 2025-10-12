'use client'

import React, { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'
import { createClient } from '@supabase/supabase-js'

// --- FUNCIÓN DE UTILIDAD PARA FORMATEAR NÚMEROS ---
const formatNumberAR = (value: number | undefined | null, decimales: number = 2): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

// --- TIPO PARA TIPO DE CAMBIO ---
type TipoDeCambio = {
  valor_ccl: number;
  valor_mep: number;
};

// --- INTERFACES PARA TIPADO ---
interface FlujoDetallado {
  fecha: string;
  vno_ajustado: number;
  pago_interes: number;
  pago_amortizacion: number;
  flujo_total: number;
}
interface TickerItem {
  ticker: string;
  desctasa: string;
}
interface SensibilidadItem {
  precio: number;
  tir: number;
}
interface SimpleResult {
  tir: number;
  valor_tecnico: number;
  paridad?: number;
  flujos_detallados: FlujoDetallado[];
  RD?: number;
  tna?: number;
  tem?: number;
  dias_vto?: number;
  modify_duration?: number;
  duracion_macaulay?: number;
  base_calculo?: string;
  sensibilidad_tir?: SensibilidadItem[];
}
interface DualResult {
  tipo_dual: true;
  resultado_tamar: SimpleResult;
  resultado_fija: SimpleResult;
}
type ResultData = SimpleResult | DualResult | null;

// --- SUPABASE CLIENT ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

// --- SUB-COMPONENTES DE UI ---
const FlujosTable = ({ flujos }: { flujos: FlujoDetallado[] }) => {
  if (!flujos || flujos.length === 0) {
    return <p className={styles.subtitle}>No hay flujos detallados para mostrar.</p>;
  }
  return (
    <div className={styles.flujosTableContainer}>
      <table className={styles.flujosTable}>
        <thead>
          <tr>
            <th className={styles.fontAlbert}>Fecha de pago</th>
            <th className={`${styles.fontAlbert} ${styles.textRight}`}>VNO Ajustado</th>
            <th className={`${styles.fontAlbert} ${styles.textRight}`}>Intereses</th>
            <th className={`${styles.fontAlbert} ${styles.textRight}`}>Amortización</th>
            <th className={`${styles.fontAlbert} ${styles.textRight}`}>Flujo Total</th>
          </tr>
        </thead>
        <tbody>
          {flujos.map((flujo, index) => (
            <tr key={index}>
              <td>{new Date(flujo.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</td>
              <td className={styles.textRight}>{formatNumberAR(flujo.vno_ajustado, 4)}</td>
              <td className={styles.textRight}>{formatNumberAR(flujo.pago_interes, 4)}</td>
              <td className={styles.textRight}>{formatNumberAR(flujo.pago_amortizacion, 4)}</td>
              <td className={`${styles.textRight} ${flujo.flujo_total < 0 ? styles.pagoInicialMonto : ''}`}>{formatNumberAR(flujo.flujo_total, 4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ResultSummary = ({ result }: { result: SimpleResult }) => {
const summaryData = [
  { label: 'TIR %', value: formatNumberAR(result.tir * 100, 2) },
  { label: 'Paridad %', value: result.paridad ? formatNumberAR(result.paridad * 100, 2) : undefined },
  { label: 'Valor Técnico', value: formatNumberAR(result.valor_tecnico, 4) },
  { label: 'Exit Yield (RD) %', value: result.RD ? formatNumberAR(result.RD * 100, 2) : undefined },
  { label: 'Modified Duration', value: formatNumberAR(result.modify_duration, 2) },
  { label: 'Macaulay Duration', value: result.duracion_macaulay !== undefined ? formatNumberAR(result.duracion_macaulay, 2) : undefined },
  { label: 'TNA %', value: result.tna ? formatNumberAR(result.tna * 100, 2) : undefined },
  { label: 'TEM %', value: result.tem ? formatNumberAR(result.tem * 100, 2) : undefined },
  { label: 'Días al Vto.', value: result.dias_vto },
  ].filter(item => item.value !== undefined && item.value !== null);

  return (
    <div className={styles.summaryGrid}>
      {summaryData.map(item => (
        <div key={item.label}>
          <span className={styles.summaryItemLabel}>{item.label}:</span>
          <strong className={`${styles.summaryItemValue} ${item.label === 'TIR %' ? styles.tirValue : ''}`}>
            {item.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

const SensibilidadTirTable = ({ datos }: { datos?: SensibilidadItem[] }) => {
  if (!datos || datos.length === 0) {
    return null;
  }
  return (
    <div className={styles.flujosTableContainer} style={{ marginTop: '1.5rem' }}>
      <h4 className={`${styles.resultTitle} ${styles.fontAlbert}`}>Análisis de Sensibilidad (Precio vs. TIR)</h4>
      <table className={styles.flujosTable}>
        <thead>
          <tr>
            <th className={styles.fontAlbert}>Precio</th>
            <th className={`${styles.fontAlbert} ${styles.textRight}`}>TIR (%)</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((item, index) => (
            <tr key={index}>
              <td>{formatNumberAR(item.precio, 4)}</td>
              <td className={styles.textRight}>{formatNumberAR(item.tir * 100, 2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ResultDisplay = ({ title, result, titleColorClass = '' }: { title: string, result: SimpleResult, titleColorClass?: string }) => (
  <div className={styles.card}>
    <h3 className={`${styles.resultTitle} ${styles.fontAlbert} ${titleColorClass}`}>{title}</h3>
    <ResultSummary result={result} />
    <FlujosTable flujos={result.flujos_detallados} />
    <SensibilidadTirTable datos={result.sensibilidad_tir} />
  </div>
);

// --- COMPONENTE PRINCIPAL ---
export default function BonosPage() {
  const [ticker, setTicker] = useState('');
  const [precio, setPrecio] = useState('');
  const [nominales, setNominales] = useState(100);
  const [fecha, setFecha] = useState('');
  const [resultados, setResultados] = useState<ResultData>(null);
  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroTicker, setFiltroTicker] = useState('');
  const [mostrarLista, setMostrarLista] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // --- NUEVO: Estados para moneda y tipo de cambio ---
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('USD'); // Por defecto USD
  const [tipoDeCambio, setTipoDeCambio] = useState<TipoDeCambio | null>(null);
  const [mostrarTipoCambio, setMostrarTipoCambio] = useState(false);
  const [tipoCambioInput, setTipoCambioInput] = useState<string>(''); // string para permitir vacío
  const [monedaBono, setMonedaBono] = useState<'ARS' | 'USD'>('ARS');

  useEffect(() => {
    const getCurrentDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    setFecha(getCurrentDate());

    const fetchTickers = async () => {
      try {
        const res = await fetch('/api/tickers');
        const data = await res.json();
        if (res.ok) {
          setTickers(data);
          if (data.length > 0) {
            setTicker(data[0].ticker);
            setFiltroTicker(data[0].ticker);
          }
        } else {
          console.error('Error fetching tickers:', data);
        }
      } catch (err) {
        console.error('Failed to fetch tickers:', err);
      }
    };
    fetchTickers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setMostrarLista(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);

  // --- NUEVO: Traer moneda del bono al seleccionar ticker ---
  useEffect(() => {
    if (!ticker) return;
    const fetchMonedaBono = async () => {
      try {
        const res = await fetch(`/api/caracteristicas?ticker=${ticker}`);
        const caracteristicas = await res.json();
        if (caracteristicas && caracteristicas.moneda) {
          setMonedaBono(caracteristicas.moneda === 'USD' ? 'USD' : 'ARS');
        }
      } catch (err) {
        setMonedaBono('ARS');
      }
    };
    fetchMonedaBono();
  }, [ticker]);

  // --- Mostrar input de tipo de cambio si corresponde y traer valor MEP ---
  useEffect(() => {
    const necesitaTC = (moneda === 'ARS' && monedaBono === 'USD') || (moneda === 'USD' && monedaBono === 'ARS');
    setMostrarTipoCambio(necesitaTC);

    if (necesitaTC) {
      // Traer el tipo de cambio solo cuando se necesita
      const fetchTipoDeCambio = async () => {
        const { data, error } = await supabase
          .from('tipodecambio')
          .select('datos')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data && data.datos && typeof data.datos.valor_mep !== 'undefined') {
          setTipoDeCambio(data.datos);
          setTipoCambioInput(String(data.datos.valor_mep));
        } else {
          setTipoDeCambio(null);
          setTipoCambioInput('');
        }
      };
      fetchTipoDeCambio();
    } else {
      setTipoCambioInput('');
    }
  }, [moneda, monedaBono]);

  const calcular = async () => {
    setIsLoading(true);
    setResultados(null);
    try {
      const caracRes = await fetch(`/api/caracteristicas?ticker=${ticker}`);
      const caracteristicas = await res.json();

      if (!caracteristicas || !caracteristicas.basemes || !caracteristicas.base) {
        alert('Error: No se pudo obtener la información de base de cálculo del bono.');
        setIsLoading(false);
        return;
      }

      const tipo_bono = caracteristicas?.desctasa?.trim().toUpperCase();
      let flujos = [];

      if (tipo_bono === 'DUAL TAMAR') {
        const tickerTamar = `${ticker} TAMAR`;
        const [flujosFijaRes, flujosTamarRes] = await Promise.all([
          fetch(`/api/flujos?ticker=${ticker}`),
          fetch(`/api/flujos?ticker=${tickerTamar}`)
        ]);
        const flujosFija = await flujosFijaRes.json();
        const flujosTamar = await flujosTamarRes.json();
        flujos = [...flujosFija, ...flujosTamar];
      } else {
        const flujosRes = await fetch(`/api/flujos?ticker=${ticker}`);
        flujos = await flujosRes.json();
      }

      let cer = [], tamar = [], dolar = [];
      if (tipo_bono === 'CER') {
        const cerRes = await fetch(`/api/cer`);
        cer = await cerRes.json();
      } else if (tipo_bono === 'TAMAR' || tipo_bono === 'DUAL TAMAR') {
        const tamarRes = await fetch(`/api/tamar`);
        tamar = await tamarRes.json();
      } else if (tipo_bono === 'DOLAR LINKED' || tipo_bono === "DL") {
        const dolarRes = await fetch(`/api/dolar`);
        dolar = await dolarRes.json();
      }

      const feriadosRes = await fetch(`/api/feriados`);
      const feriados = await feriadosRes.json();

      // --- Ajuste de precio según moneda seleccionada y moneda del bono ---
      let precioFinal = parseFloat(precio.replace(/\./g, '').replace(',', '.'));
      const tc = Number(tipoCambioInput) || (tipoDeCambio?.valor_mep ?? 1);

      if (mostrarTipoCambio && tc) {
        if (moneda === 'ARS' && monedaBono === 'USD') {
          precioFinal = precioFinal / tc;
        } else if (moneda === 'USD' && monedaBono === 'ARS') {
          precioFinal = precioFinal * tc;
        }
      }

      const res = await fetch('https://tir-backend-iop7.onrender.com/tir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caracteristicas,
          flujos,
          cer,
          tamar,
          dolar,
          precio: precioFinal,
          fecha_valor: fecha,
          feriados,
          basemes: caracteristicas?.basemes,
          baseanual: caracteristicas?.base,
          tipotasa: caracteristicas?.tipotasa,
          diasarestar: caracteristicas?.diasarestar,
          nominales: parseInt(nominales.toString())
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`Error: ${data?.error || 'Cálculo fallido'}`);
        setIsLoading(false);
        return;
      }

      setResultados(data);
    } catch (err) {
      alert('Error al intentar calcular la TIR');
    } finally {
      setIsLoading(false);
    }
  }

  const renderResults = (data: ResultData) => {
    if (!data) return null;
    if ('tipo_dual' in data) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ResultDisplay title="Resultado Pata TAMAR" result={data.resultado_tamar} titleColorClass={styles.titleBlue} />
          <ResultDisplay title="Resultado Pata Fija" result={data.resultado_fija} titleColorClass={styles.titleGreen} />
        </div>
      );
    }
    return <ResultDisplay title="Resultados del Bono" result={data} />;
  };

  const tickersFiltrados = tickers.filter(t =>
    t.ticker.toLowerCase().includes(filtroTicker.toLowerCase()) ||
    t.desctasa.toLowerCase().includes(filtroTicker.toLowerCase())
  );

  const handleSeleccionarTicker = (tickerSeleccionado: TickerItem) => {
    setTicker(tickerSeleccionado.ticker);
    setFiltroTicker(tickerSeleccionado.ticker);
    setMostrarLista(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.maxWidthWrapper}>
        <img src="/logo-vetacap.png" alt="Logo" style={{ height: '36px', marginBottom: '1rem' }} />

        <div className={styles.card}>
          <h1 className={`${styles.title} ${styles.fontAlbert}`}>Calculadora de TIR de Bonos</h1>
          <p className={styles.subtitle}>Selecciona un bono y sus parámetros para calcular la Tasa Interna de Retorno.</p>

          <div className={styles.formGrid}>
            <div className={`${styles.gridColSpan2} ${styles.tickerContainer}`} ref={searchContainerRef}>
              <label htmlFor="ticker-input" className={styles.formLabel}>Buscar Ticker</label>
              <input
                id="ticker-input"
                type="text"
                value={filtroTicker}
                onChange={e => {
                  setFiltroTicker(e.target.value);
                  setMostrarLista(true);
                }}
                onFocus={() => setMostrarLista(true)}
                className={styles.formInput}
                disabled={isLoading || tickers.length === 0}
                placeholder="Escribe un ticker o tipo..."
                autoComplete="off"
              />
              {mostrarLista && tickersFiltrados.length > 0 && (
                <ul className={styles.listaTickers}>
                  {tickersFiltrados.map(t => (
                    <li key={t.ticker} onClick={() => handleSeleccionarTicker(t)}>
                      {t.ticker} <span>({t.desctasa})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label htmlFor="precio-input" className={styles.formLabel}>Precio</label>
              <input
                id="precio-input"
                type="text"
                value={precio}
                onChange={e => {
                  // Permite solo números, comas y puntos
                  let valor = e.target.value.replace(/[^0-9.,]/g, '');
                  setPrecio(valor);
                }}
                onKeyDown={e => {
                  if (e.key === '.') {
                    e.preventDefault();
                    const target = e.target as HTMLInputElement;
                    const start = target.selectionStart ?? 0;
                    const end = target.selectionEnd ?? 0;
                    const newValue = precio.slice(0, start) + ',' + precio.slice(end);
                    setPrecio(newValue);
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = start + 1;
                    }, 0);
                  }
                }}
                className={styles.formInput}
                disabled={isLoading}
              />
            </div>

            {/* NUEVO: Selector de moneda */}
            <div>
              <label htmlFor="moneda-input" className={styles.formLabel}>Moneda</label>
              <select
                id="moneda-input"
                value={moneda}
                onChange={e => setMoneda(e.target.value as 'ARS' | 'USD')}
                className={styles.formInput}
                disabled={isLoading}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>

            {/* NUEVO: Input de tipo de cambio si corresponde */}
            {mostrarTipoCambio && (
              <div>
                <label htmlFor="tipo-cambio-input" className={styles.formLabel}>Tipo de cambio (MEP)</label>
                <input
                  id="tipo-cambio-input"
                  type="number"
                  value={tipoCambioInput}
                  onChange={e => {
                    // Permite borrar el campo completamente
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                      setTipoCambioInput(val);
                    }
                  }}
                  className={styles.formInput}
                  disabled={isLoading}
                  placeholder="Tipo de cambio MEP"
                  inputMode="decimal"
                />
              </div>
            )}

            <div>
              <label htmlFor="nominales-input" className={styles.formLabel}>Nominales</label>
              <input id="nominales-input" type="number" value={nominales} onChange={e => setNominales(Number(e.target.value))} className={styles.formInput} disabled={isLoading} />
            </div>
            <div className={styles.gridColSpan4}>
              <label htmlFor="fecha-input" className={styles.formLabel}>Fecha Valor</label>
              <input id="fecha-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={styles.formInput} disabled={isLoading} />
            </div>
            <div className={styles.gridColSpan4}>
              <button onClick={calcular} className={`${styles.submitButton} ${styles.fontAlbert}`} disabled={isLoading}>
                {isLoading ? 'Calculando...' : 'CALCULAR TIR'}
              </button>
            </div>
          </div>
        </div>

        {resultados && (
          <div style={{ marginTop: '2rem' }}>
            {renderResults(resultados)}
          </div>
        )}
      </div>
    </div>
  );
}