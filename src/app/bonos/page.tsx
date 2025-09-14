'use client'

import { useState, useEffect } from 'react'
// Importa el archivo CSS que acabamos de crear
import styles from './page.module.css'

// --- INTERFACES (Sin cambios) ---
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

// --- SUB-COMPONENTES DE UI (MODIFICADOS CON CSS MODULES) ---

const FlujosTable = ({ flujos }: { flujos: FlujoDetallado[] }) => {
  if (!flujos || flujos.length === 0) {
    return <p className={styles.subtitle}>No hay flujos detallados para mostrar.</p>;
  }
  const primerFlujo = flujos[0];
  const flujosSiguientes = flujos.slice(1);

  return (
    <div className={styles.flujosTableContainer}>
      <table className={styles.flujosTable}>
        <thead>
          <tr>
            <th className={styles.fontAlbert}>Fecha de pago</th>
            <th className={`${styles.fontAlbert} ${styles.textRight}`}>Intereses</th>
            <th className={`${styles.fontAlbert} ${styles.textRight}`}>Amortización</th>
            <th className={`${styles.fontAlbert} ${styles.textRight}`}>Flujo Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className={styles.pagoInicialRow}>
            <td>{new Date(primerFlujo.fecha).toLocaleDateString()}</td>
            <td className={styles.textRight}></td>
            <td className={styles.textRight}></td>
            <td className={`${styles.pagoInicialMonto} ${styles.textRight}`}>{primerFlujo.flujo_total?.toFixed(4)}</td>
          </tr>
          {flujosSiguientes.map((flujo, index) => (
            <tr key={index}>
              <td>{new Date(flujo.fecha).toLocaleDateString()}</td>
              <td className={styles.textRight}>{flujo.pago_interes?.toFixed(4)}</td>
              <td className={styles.textRight}>{flujo.pago_amortizacion?.toFixed(4)}</td>
              <td className={styles.textRight}>{flujo.flujo_total?.toFixed(4)}</td>
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
    { label: 'Exit Yield (RD) %', value: result.RD ? (result.RD * 100).toFixed(2) : '0.00' },
    { label: 'Modified Duration', value: result.modify_duration?.toFixed(2) },
    { label: 'Macaulay Duration', value: result.duracion_macaulay?.toFixed(2) },
    { label: 'TNA %', value: result.tna ? (result.tna * 100).toFixed(2) : '0.00' },
    { label: 'TEM %', value: result.tem ? (result.tem * 100).toFixed(2) : '0.00' },
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
  </div>
);


export default function BonosPage() {
    const [ticker, setTicker] = useState('YFCJD');
    const [precio, setPrecio] = useState(101.85);
    const [nominales, setNominales] = useState(100);
    const [fecha, setFecha] = useState('');
    const [resultados, setResultados] = useState<ResultData>(null);
    const [tickers, setTickers] = useState<TickerItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Lógica de useEffect y calcular (sin cambios)
    useEffect(() => {
        const getCurrentDate = () => {
          const today = new Date();
          const offset = today.getTimezoneOffset() * 60000;
          const localDate = new Date(today.getTime() - offset);
          return localDate.toISOString().split('T')[0];
        };
        setFecha(getCurrentDate());
        // fetchTickers...
    }, []);

    const calcular = async () => { /* ... tu lógica de cálculo ... */ };

  const renderResults = (data: ResultData) => {
    if (!data) return null;

    if ('tipo_dual' in data) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ResultDisplay title="Resultado Pata TAMAR" result={data.resultado_tamar} />
          <ResultDisplay title="Resultado Pata Fija" result={data.resultado_fija} />
        </div>
      );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <ResultDisplay title="Resultados del Bono" result={data} />
            <div className={styles.card}>
                <h3 className={`${styles.resultTitle} ${styles.fontAlbert}`}>Flujo de Fondos</h3>
                <FlujosTable flujos={data.flujos_detallados} />
            </div>
        </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.maxWidthWrapper}>
        <img src="https://i.imgur.com/wVj223H.png" alt="Logo VETACAP" style={{ height: '36px', marginBottom: '1rem' }} />

        <div className={styles.card}>
          <h1 className={`${styles.title} ${styles.fontAlbert}`}>Calculadora de TIR de Bonos</h1>
          <p className={styles.subtitle}>Selecciona un bono y sus parámetros para calcular la Tasa Interna de Retorno.</p>
        
          <div className={styles.formGrid}>
            <div className={styles.gridColSpan2}>
              <label className={styles.formLabel}>Selecciona Ticker</label>
              <select value={ticker} onChange={e => setTicker(e.target.value)} className={styles.formSelect} disabled={isLoading}>
                {/* Opciones del select */}
              </select>
            </div>
            <div>
              <label className={styles.formLabel}>Precio</label>
              <input type="number" value={precio} onChange={e => setPrecio(parseFloat(e.target.value))} className={styles.formInput} disabled={isLoading} />
            </div>
            <div>
              <label className={styles.formLabel}>Nominales</label>
              <input type="number" value={nominales} onChange={e => setNominales(Number(e.target.value))} className={styles.formInput} disabled={isLoading} />
            </div>
            <div className={styles.gridColSpan4}>
              <label className={styles.formLabel}>Fecha Valor</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={styles.formInput} disabled={isLoading} />
            </div>
            <div className={styles.gridColSpan4}>
                <button onClick={calcular} className={`${styles.submitButton} ${styles.fontAlbert}`} disabled={isLoading}>
                    {isLoading ? 'Calculando...' : 'CALCULAR TIR'}
                </button>
            </div>
          </div>
        </div>
        
        {resultados && (
          <div>
            {renderResults(resultados)}
          </div>
        )}
      </div>
    </div>
  )
}
