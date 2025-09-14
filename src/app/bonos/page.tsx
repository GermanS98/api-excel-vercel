'use client'

import { useState, useEffect } from 'react'

// --- INTERFACES PARA TIPADO ---

// Define la estructura de un flujo individual en la tabla
interface FlujoDetallado {
  fecha: string;
  vno_ajustado: number;
  pago_interes: number;
  pago_amortizacion: number;
  flujo_total: number;
}

// Define la estructura de los tickers en el selector
interface TickerItem {
  ticker: string;
  desctasa: string;
}

// Define la estructura para un resultado de bono simple, ahora con todos los campos
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

// Define la estructura para un resultado de bono DUAL
interface DualResult {
  tipo_dual: true; // Propiedad clave para identificar este tipo de resultado
  resultado_tamar: SimpleResult;
  resultado_fija: SimpleResult;
}

// Crea un tipo que puede ser un resultado simple, dual, o nulo (antes de calcular)
type ResultData = SimpleResult | DualResult | null;


// --- SUB-COMPONENTES DE UI ---

// Componente para mostrar la tabla de flujos detallados
const FlujosTable = ({ flujos }: { flujos: FlujoDetallado[] }) => {
  if (!flujos || flujos.length === 0) {
    return <p className="text-sm text-gray-500 mt-2">No hay flujos detallados para mostrar.</p>;
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 text-left text-sm rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-2 px-4 border-b border-gray-200 font-semibold text-gray-600">Fecha de pago</th>
            <th className="py-2 px-4 border-b border-gray-200 font-semibold text-gray-600">VNO Ajustado</th>
            <th className="py-2 px-4 border-b border-gray-200 font-semibold text-gray-600">Intereses</th>
            <th className="py-2 px-4 border-b border-gray-200 font-semibold text-gray-600">Amortización</th>
            <th className="py-2 px-4 border-b border-gray-200 font-semibold text-gray-600">Flujo Total</th>
          </tr>
        </thead>
        <tbody>
          {flujos.map((flujo, index) => (
            <tr key={index} className="hover:bg-gray-50/50">
              <td className="py-2 px-4 border-b border-gray-200">{new Date(flujo.fecha).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b border-gray-200">{flujo.vno_ajustado?.toFixed(4)}</td>
              <td className="py-2 px-4 border-b border-gray-200">{flujo.pago_interes?.toFixed(4)}</td>
              <td className="py-2 px-4 border-b border-gray-200">{flujo.pago_amortizacion?.toFixed(4)}</td>
              <td className="py-2 px-4 border-b border-gray-200 font-bold text-gray-800">{flujo.flujo_total?.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- COMPONENTE DE RESUMEN MEJORADO ---
// Muestra los datos clave en una tabla de 4 columnas con más espaciado
const ResultSummary = ({ result }: { result: SimpleResult }) => {
    // Lista de todos los posibles datos a mostrar
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
    ].filter(item => item.value !== undefined && item.value !== null); // Filtra los datos que no existen

    // Agrupa los datos en pares para crear las filas de la tabla
    const rows = [];
    for (let i = 0; i < summaryData.length; i += 2) {
        rows.push(summaryData.slice(i, i + 2));
    }

    return (
        <div className="border-t border-b border-gray-200 py-4">
            <table className="w-full text-sm">
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            <td className="py-1 px-4 text-gray-500 w-1/4">{row[0].label}:</td>
                            <td className="py-1 px-4 font-semibold text-gray-800 w-1/4">{row[0].value}</td>
                            {row[1] ? (
                                <>
                                    <td className="py-1 px-4 text-gray-500 w-1/4">{row[1].label}:</td>
                                    <td className="py-1 px-4 font-semibold text-gray-800 w-1/4">{row[1].value}</td>
                                </>
                            ) : (
                                <>
                                    <td className="w-1/4"></td>
                                    <td className="w-1/4"></td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// Componente principal para mostrar un bloque de resultados (simple o una pata de un dual)
const ResultDisplay = ({ title, result, titleColor = 'text-gray-800' }: { title: string, result: SimpleResult, titleColor?: string }) => (
    <div>
        <h3 className={`text-xl font-bold ${titleColor} mb-3`}>{title}</h3>
        <ResultSummary result={result} />
        <FlujosTable flujos={result.flujos_detallados} />
    </div>
);


export default function BonosPage() {
  const [ticker, setTicker] = useState('TX25')
  const [precio, setPrecio] = useState(1270)
  const [nominales, setNominales] = useState(100) // <-- NUEVO ESTADO PARA NOMINALES
  const [fecha, setFecha] = useState('')
  const [resultados, setResultados] = useState<ResultData>(null)
  const [tickers, setTickers] = useState<TickerItem[]>([])
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Función para obtener la fecha actual en formato YYYY-MM-DD
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
        const res = await fetch('/api/tickers')
        const data = await res.json()
        if (res.ok) {
          setTickers(data)
          if (data.length > 0) {
            setTicker(data[0].ticker)
          }
        } else {
          console.error('Error fetching tickers:', data)
        }
      } catch (err) {
        console.error('Failed to fetch tickers:', err)
      }
    }
    fetchTickers()
  }, [])

  const calcular = async () => {
    console.log('🔍 Ejecutando cálculo...')
    setIsLoading(true);
    setResultados(null);
    try {
      console.log('📥 Pidiendo características...')
      const caracRes = await fetch(`/api/caracteristicas?ticker=${ticker}`);
      const caracteristicas = await caracRes.json();
      console.log('✅ Características:', caracteristicas);

      if (!caracteristicas || !caracteristicas.basemes || !caracteristicas.base) {
        console.error('❌ Error: Falta información de base de cálculo.')
        alert('Error: No se pudo obtener la información de base de cálculo del bono.')
        setIsLoading(false);
        return
      }

      const tipo_bono = caracteristicas?.desctasa?.trim().toUpperCase();
      let flujos = [];

      if (tipo_bono === 'DUAL TAMAR') {
        console.log('📥 Pidiendo flujos para DUAL TAMAR (Fija y Variable)...')
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
        console.log('📥 Pidiendo flujos para bono simple...')
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

      console.log('📤 Enviando datos al backend para calcular...')
      const res = await fetch('https://tir-backend-iop7.onrender.com/tir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caracteristicas, flujos, cer, tamar, dolar,
          precio: parseFloat(precio.toString()),
          fecha_valor: fecha,
          feriados,
          basemes: caracteristicas?.basemes,
          baseanual: caracteristicas?.base,
          tipotasa: caracteristicas?.tipotasa,
          diasarestar: caracteristicas?.diasarestar,
          nominales: nominales
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('❌ Error en cálculo:', data)
        alert(`Error: ${data?.error || 'Cálculo fallido'}`)
        setIsLoading(false);
        return
      }

      console.log('✅ Resultado:', data)
      setResultados(data)
    } catch (err) {
      console.error('❌ Error general:', err)
      alert('Error al intentar calcular la TIR')
    } finally {
        setIsLoading(false);
    }
  }

  const renderResults = (data: ResultData) => {
    if (!data) return null;

    if ('tipo_dual' in data) {
      return (
        <div className="space-y-8">
            <ResultDisplay title="Resultado Pata TAMAR" result={data.resultado_tamar} titleColor="text-blue-700" />
            <ResultDisplay title="Resultado Pata Fija" result={data.resultado_fija} titleColor="text-green-700" />
        </div>
      );
    } 
    
    return <ResultDisplay title="Resultados del Bono" result={data} />;
  };


  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 space-y-6 rounded-xl shadow-lg bg-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Calculadora de TIR de Bonos</h1>
        <p className="text-gray-600 mt-2">Selecciona un bono y sus parámetros para calcular la Tasa Interna de Retorno.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end p-4 border border-gray-200 rounded-lg">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Selecciona Ticker</label>
          <select
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            className="w-full mt-1 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
          >
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Precio de Venta</label>
          <input
            type="number"
            value={precio}
            onChange={e => setPrecio(parseFloat(e.target.value))}
            className="w-full mt-1 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Precio"
            disabled={isLoading}
          />
        </div>
        <div>
           {/* <!-- NUEVO INPUT PARA NOMINALES --> */}
          <label className="block text-sm font-medium text-gray-700">Cantidad Nominales</label>
          <input
            type="number"
            value={nominales}
            onChange={e => setNominales(Number(e.target.value))}
            className="w-full mt-1 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="100"
            disabled={isLoading}
          />
        </div>
         <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Fecha de Valor</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full mt-1 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
          />
        </div>
        <button
          onClick={calcular}
          className={`w-full md:col-span-2 px-6 py-2.5 text-white font-semibold rounded-md shadow-md transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Calculando...' : 'Calcular TIR'}
        </button>
      </div>

      {resultados && (
        <div className="mt-6 p-4 bg-gray-50/70 rounded-lg shadow-inner">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b">Resultados</h2>
          {renderResults(resultados)}
        </div>
      )}
    </div>
  )
}
