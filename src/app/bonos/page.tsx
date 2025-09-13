'use client'

import { useState, useEffect } from 'react'

interface TickerItem {
  ticker: string;
  desctasa: string;
}

export default function BonosPage() {
  const [ticker, setTicker] = useState('TX25')
  const [precio, setPrecio] = useState(1270)
  const [fecha, setFecha] = useState('2025-07-28')
  const [resultados, setResultados] = useState<any>(null)
  const [tickers, setTickers] = useState<TickerItem[]>([])
  const [isLoading, setIsLoading] = useState(false); // Estado para la carga

  useEffect(() => {
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
    setIsLoading(true); // Iniciar carga
    setResultados(null); // Limpiar resultados previos
    try {
      console.log('📥 Pidiendo características...')
      const caracRes = await fetch(`/api/caracteristicas?ticker=${ticker}`);
      const caracteristicas = await caracRes.json();
      console.log('✅ Características:', caracteristicas);

      if (!caracteristicas || !caracteristicas.basemes || !caracteristicas.base) {
        console.error('❌ Error: Falta información de base de cálculo en las características del bono. Los campos basemes o base no están presentes.')
        alert('Error: No se pudo obtener la información de base de cálculo del bono. Inténtalo de nuevo.')
        setIsLoading(false);
        return
      }

      const tipo_bono = caracteristicas?.desctasa?.trim().toUpperCase();
      let flujos = [];

      // --- CAMBIO PRINCIPAL: Lógica para obtener flujos ---
      if (tipo_bono === 'DUAL TAMAR') {
        console.log('📥 Pidiendo flujos para DUAL TAMAR (Fija y Variable)...')
        const tickerTamar = `${ticker} TAMAR`;
        const [flujosFijaRes, flujosTamarRes] = await Promise.all([
          fetch(`/api/flujos?ticker=${ticker}`),
          fetch(`/api/flujos?ticker=${tickerTamar}`)
        ]);

        const flujosFija = await flujosFijaRes.json();
        const flujosTamar = await flujosTamarRes.json();
        
        // Combinamos los flujos de ambos tickers en un solo array
        flujos = [...flujosFija, ...flujosTamar];
        console.log('✅ Flujos combinados para DUAL:', flujos);

      } else {
        console.log('📥 Pidiendo flujos para bono simple...')
        const flujosRes = await fetch(`/api/flujos?ticker=${ticker}`);
        flujos = await flujosRes.json();
        console.log('✅ Flujos:', flujos);
      }
      
      let cer = []
      let tamar = []
      let dolar = []

      if (tipo_bono === 'CER') {
        console.log('📥 Pidiendo CER...')
        const cerRes = await fetch(`/api/cer`)
        cer = await cerRes.json()
        console.log('✅ CER:', cer)
      } else if (tipo_bono === 'TAMAR' || tipo_bono === 'DUAL TAMAR') {
        console.log('📥 Pidiendo TAMAR...')
        const tamarRes = await fetch(`/api/tamar`)
        tamar = await tamarRes.json()
        console.log('✅ TAMAR:', tamar)
      } else if (tipo_bono === 'DOLAR LINKED' || tipo_bono === "DL") {
        console.log('📥 Pidiendo Dólar...')
        const dolarRes = await fetch(`/api/dolar`)
        dolar = await dolarRes.json()
        console.log('✅ Dólar:', dolar)
      }

      console.log('📥 Pidiendo feriados...')
      const feriadosRes = await fetch(`/api/feriados`)
      const feriados = await feriadosRes.json()
      console.log('✅ Feriados:', feriados)

      console.log('📤 Enviando datos al backend para calcular...')
      const res = await fetch('https://tir-backend-iop7.onrender.com/tir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caracteristicas,
          flujos, // Se envía el array de flujos (combinado si es DUAL)
          cer,
          tamar,
          dolar,
          precio: parseFloat(precio.toString()),
          fecha_valor: fecha,
          feriados,
          basemes: caracteristicas?.basemes,
          baseanual: caracteristicas?.base,
          tipotasa: caracteristicas?.tipotasa
        })
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
        setIsLoading(false); // Finalizar carga
    }
  }

  // Función para renderizar los resultados de forma legible
  const renderResults = (data) => {
    if (!data) return null;

    if (data.tipo_dual) {
      return (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-blue-700">Resultado Pata TAMAR</h3>
            <p><strong>TIR:</strong> {(data.resultado_tamar.tir * 100).toFixed(2)}%</p>
            <p><strong>Valor Técnico:</strong> {data.resultado_tamar.valor_tecnico.toFixed(4)}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-700">Resultado Pata Fija</h3>
            <p><strong>TIR:</strong> {(data.resultado_fija.tir * 100).toFixed(2)}%</p>
            <p><strong>Valor Técnico:</strong> {data.resultado_fija.valor_tecnico.toFixed(4)}</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Resultado Simple</h3>
        <p><strong>TIR:</strong> {(data.tir * 100).toFixed(2)}%</p>
        <p><strong>Valor Técnico:</strong> {data.valor_tecnico.toFixed(4)}</p>
      </div>
    );
  };


  return (
    <div className="max-w-xl mx-auto mt-10 p-4 space-y-4 rounded-xl shadow-lg bg-white">
      <h1 className="text-3xl font-bold text-center text-gray-800">Calculadora de TIR</h1>
      <p className="text-center text-gray-600">Selecciona un bono y sus parámetros para calcular la Tasa Interna de Retorno.</p>

      <div className="flex flex-col space-y-4">
        <label className="block text-sm font-medium text-gray-700">Selecciona Ticker</label>
        <select
          value={ticker}
          onChange={e => setTicker(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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

        <label className="block text-sm font-medium text-gray-700">Precio de Venta</label>
        <input
          type="number"
          value={precio}
          onChange={e => setPrecio(parseFloat(e.target.value))}
          className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Precio"
          disabled={isLoading}
        />

        <label className="block text-sm font-medium text-gray-700">Fecha de Valor</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          disabled={isLoading}
        />

        <button
          onClick={calcular}
          className={`px-6 py-3 text-white font-semibold rounded-md shadow-md transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
          disabled={isLoading}
        >
          {isLoading ? 'Calculando...' : 'Calcular TIR'}
        </button>
      </div>

      {resultados && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Resultados:</h2>
          {/* Usamos la nueva función para mostrar los resultados */}
          <div className="p-3 rounded text-sm text-gray-800">
            {renderResults(resultados)}
          </div>
        </div>
      )}
    </div>
  )
}
