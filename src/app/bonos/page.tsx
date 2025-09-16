'use client'

import React, { useState, useEffect, useRef } from 'react'
import styles from './page.module.css'

// --- INTERFACES PARA TIPADO (DE TU CÓDIGO ORIGINAL) ---
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
}
interface DualResult {
  tipo_dual: true;
  resultado_tamar: SimpleResult;
  resultado_fija: SimpleResult;
}
type ResultData = SimpleResult | DualResult | null;


// --- SUB-COMPONENTES DE UI (CON TU LÓGICA Y NUEVOS ESTILOS) ---

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
              <td>{new Date(flujo.fecha).toLocaleDateString()}</td>
              <td className={styles.textRight}>{flujo.vno_ajustado?.toFixed(4)}</td>
              <td className={styles.textRight}>{flujo.pago_interes?.toFixed(4)}</td>
              <td className={styles.textRight}>{flujo.pago_amortizacion?.toFixed(4)}</td>
              <td className={`${styles.textRight} ${flujo.flujo_total < 0 ? styles.pagoInicialMonto : ''}`}>{flujo.flujo_total?.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ResultSummary = ({ result }: { result: SimpleResult }) => {
    const summaryData = [
        { label: 'TIR %', value: (result.tir * 100).toFixed(2) },
        { label: 'Paridad %', value: result.paridad ? (result.paridad * 100).toFixed(2) : undefined },
        { label: 'Valor Técnico', value: result.valor_tecnico?.toFixed(4) },
        { label: 'Exit Yield (RD) %', value: result.RD ? (result.RD * 100).toFixed(2) : undefined },
        { label: 'Modified Duration', value: result.modify_duration?.toFixed(2) },
        { label: 'Macaulay Duration', value: result.duracion_macaulay?.toFixed(2) },
        { label: 'TNA %', value: result.tna ? (result.tna * 100).toFixed(2) : undefined },
        { label: 'TEM %', value: result.tem ? (result.tem * 100).toFixed(2) : undefined },
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

const ResultDisplay = ({ title, result, titleColorClass = '' }: { title: string, result: SimpleResult, titleColorClass?: string }) => (
  <div className={styles.card}>
    <h3 className={`${styles.resultTitle} ${styles.fontAlbert} ${titleColorClass}`}>{title}</h3>
    <ResultSummary result={result} />
    <FlujosTable flujos={result.flujos_detallados} />
  </div>
);


// --- COMPONENTE PRINCIPAL ---
export default function BonosPage() {
    const [ticker, setTicker] = useState('TX25');
    const [precio, setPrecio] = useState(1270);
    const [nominales, setNominales] = useState(100);
    const [fecha, setFecha] = useState('');
    const [resultados, setResultados] = useState<ResultData>(null);
    const [tickers, setTickers] = useState<TickerItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filtroTicker, setFiltroTicker] = useState('');
    const [mostrarLista, setMostrarLista] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

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
                // Selecciona el primer ticker por defecto
                setTicker(data[0].ticker);
                // Inicializa el campo de búsqueda con el primer ticker
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
    
    // Hook para cerrar la lista de tickers si se hace clic afuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setMostrarLista(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchContainerRef]);

    // --- LÓGICA DE CÁLCULO ORIGINAL (COMPLETA Y RESTAURADA) ---
    const calcular = async () => {
        console.log('🔍 Ejecutando cálculo...');
        setIsLoading(true);
        setResultados(null);
        try {
          console.log('📥 Pidiendo características...');
          const caracRes = await fetch(`/api/caracteristicas?ticker=${ticker}`);
          const caracteristicas = await caracRes.json();
          console.log('✅ Características:', caracteristicas);
    
          if (!caracteristicas || !caracteristicas.basemes || !caracteristicas.base) {
            console.error('❌ Error: Falta información de base de cálculo.');
            alert('Error: No se pudo obtener la información de base de cálculo del bono.');
            setIsLoading(false);
            return;
          }
    
          const tipo_bono = caracteristicas?.desctasa?.trim().toUpperCase();
          let flujos = [];
    
          if (tipo_bono === 'DUAL TAMAR') {
            console.log('📥 Pidiendo flujos para DUAL TAMAR (Fija y Variable)...');
            const tickerTamar = `${ticker} TAMAR`;
            const [flujosFijaRes, flujosTamarRes] = await Promise.all([
              fetch(`/api/flujos?ticker=${ticker}`),
              fetch(`/api/flujos?ticker=${tickerTamar}`)
            ]);
    
            const flujosFija = await flujosFijaRes.json();
            const flujosTamar = await flujosTamarRes.json();
            
            flujos = [...flujosFija, ...flujosTamar];
            console.log('✅ Flujos combinados para DUAL:', flujos);
    
          } else {
            console.log('📥 Pidiendo flujos para bono simple...');
            const flujosRes = await fetch(`/api/flujos?ticker=${ticker}`);
            flujos = await flujosRes.json();
            console.log('✅ Flujos:', flujos);
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
    
          console.log('📤 Enviando datos al backend para calcular...');
          const res = await fetch('https://tir-backend-iop7.onrender.com/tir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caracteristicas,
              flujos,
              cer,
              tamar,
              dolar,
              precio: parseFloat(precio.toString()),
              fecha_valor: fecha,
              feriados,
              basemes: caracteristicas?.basemes,
              baseanual: caracteristicas?.base,
              tipotasa: caracteristicas?.tipotasa,
              diasarestar: caracteristicas?.diasarestar, // Mantenemos la lógica original, asumiendo que el backend ya fue corregido para manejar nulos
              nominales: parseInt(nominales.toString())
            })
          });
    
          const data = await res.json();
    
          if (!res.ok) {
            console.error('❌ Error en cálculo:', data);
            alert(`Error: ${data?.error || 'Cálculo fallido'}`);
            setIsLoading(false);
            return;
          }
    
          console.log('✅ Resultado:', data);
          setResultados(data);
        } catch (err) {
          console.error('❌ Error general:', err);
          alert('Error al intentar calcular la TIR');
        } finally {
            setIsLoading(false);
        }
    }

    // --- LÓGICA DE RENDERIZADO ORIGINAL ---
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

    // --- LÓGICA PARA MANEJAR EL FILTRO DEL BUSCADOR ---
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
                            <input id="precio-input" type="number" value={precio} onChange={e => setPrecio(parseFloat(e.target.value))} className={styles.formInput} disabled={isLoading} />
                        </div>
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
                    <div style={{marginTop: '2rem'}}>
                        {renderResults(resultados)}
                    </div>
                )}
            </div>
        </div>
    );
}
