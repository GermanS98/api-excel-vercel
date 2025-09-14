'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

// --- INTERFACES ---
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

// --- SUB-COMPONENTES DE UI ---
const FlujosTable = ({ flujos }: { flujos: FlujoDetallado[] }) => { /* ... (Componente sin cambios) ... */ };
const ResultSummary = ({ result }: { result: SimpleResult }) => { /* ... (Componente sin cambios) ... */ };
const ResultDisplay = ({ title, result }: { title: string, result: SimpleResult }) => { /* ... (Componente sin cambios) ... */ };


// --- COMPONENTE PRINCIPAL ---
export default function BonosPage() {
    const [ticker, setTicker] = useState(''); // Iniciar vacío
    const [precio, setPrecio] = useState(101.85);
    const [nominales, setNominales] = useState(100);
    const [fecha, setFecha] = useState('');
    const [resultados, setResultados] = useState<ResultData>(null);
    const [tickers, setTickers] = useState<TickerItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const getCurrentDate = () => {
          const today = new Date();
          const offset = today.getTimezoneOffset() * 60000;
          const localDate = new Date(today.getTime() - offset);
          return localDate.toISOString().split('T')[0];
        };
        setFecha(getCurrentDate());

        // --- LÓGICA PARA CARGAR TICKERS (RESTAURADA) ---
        const fetchTickers = async () => {
          try {
            const res = await fetch('/api/tickers');
            const data = await res.json();
            if (res.ok) {
              setTickers(data);
              if (data.length > 0) {
                setTicker(data[0].ticker); // Selecciona el primer ticker por defecto
              }
            } else {
              console.error('Error fetching tickers:', data);
            }
          } catch (err) {
            console.error('Failed to fetch tickers:', err);
          }
        };
        fetchTickers();
        // --------------------------------------------------

    }, []);

    const calcular = async () => { 
        // Aquí va tu lógica de cálculo completa...
    };

    const renderResults = (data: ResultData) => { /* ... (Función sin cambios) ... */ };

    return (
        <div className={styles.container}>
            <div className={styles.maxWidthWrapper}>
                <img src="/logo-vetacap.png" alt="Logo VETACAP" style={{ height: '36px', marginBottom: '1rem' }} />

                <div className={styles.card}>
                    <h1 className={`${styles.title} ${styles.fontAlbert}`}>Calculadora de TIR de Bonos</h1>
                    <p className={styles.subtitle}>Selecciona un bono y sus parámetros para calcular la Tasa Interna de Retorno.</p>
                
                    <div className={styles.formGrid}>
                        <div className={styles.gridColSpan2}>
                            <label htmlFor="ticker-select" className={styles.formLabel}>Selecciona Ticker</label>
                            <select id="ticker-select" value={ticker} onChange={e => setTicker(e.target.value)} className={styles.formSelect} disabled={isLoading || tickers.length === 0}>
                                {tickers.length > 0 ? (
                                    tickers.map(t => (
                                        <option key={t.ticker} value={t.ticker}>
                                            {t.ticker} ({t.desctasa})
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>Cargando tickers...</option>
                                )}
                            </select>
                        </div>
                        {/* ... resto de los inputs ... */}
                    </div>
                </div>
                
                {resultados && (
                    <div>
                        {renderResults(resultados)}
                    </div>
                )}
            </div>
        </div>
    );
}
