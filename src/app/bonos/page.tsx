'use client'

import { useState, useEffect } from 'react'

export default function BonosPage() {
  const [ticker, setTicker] = useState('TX25')
  const [precio, setPrecio] = useState(1270)
  const [fecha, setFecha] = useState('2025-07-28')
  const [resultados, setResultados] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tickers, setTickers] = useState([])
  const [tickersLoading, setTickersLoading] = useState(true)

  // useEffect para cargar la lista de tickers al montar el componente
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const res = await fetch('/api/tickers');
        const data = await res.json();
        // Si la lista no está vacía, selecciona el primer ticker por defecto
        if (data.length > 0) {
          setTickers(data);
          setTicker(data[0].ticker);
        }
      } catch (error) {
        console.error('Error al obtener la lista de tickers:', error);
      } finally {
        setTickersLoading(false);
      }
    };

    fetchTickers();
  }, []);

  const calcular = async () => {
    setLoading(true)
    setResultados(null)
    console.log('🔍 Ejecutando cálculo...')
    try {
      // Pide las características y los flujos al mismo tiempo
      console.log('📥 Pidiendo características y flujos...')
      const [caracRes, flujosRes] = await Promise.all([
        fetch(`/api/caracteristicas?ticker=${ticker}`),
        fetch(`/api/flujos?ticker=${ticker}`)
      ])

      const caracteristicas = await caracRes.json()
      const flujos = await flujosRes.json()
      console.log('✅ Características:', caracteristicas)
      console.log('✅ Flujos:', flujos)

      const tipoBono = caracteristicas?.desctasa?.trim().toUpperCase()

      // Define las variables para los datos adicionales
      let cer = []
      let tamar = []
      let dolar = []

      // Lógica para pedir datos adicionales según el tipo de bono
      if (tipoBono === 'CER') {
        console.log('📥 Pidiendo CER...')
        const cerRes = await fetch(`/api/cer`)
        cer = await cerRes.json()
        console.log('✅ CER:', cer)
      } else if (tipoBono === 'TAMAR' || tipoBono === 'DUAL TAMAR') {
        console.log('📥 Pidiendo TAMAR...')
        const tamarRes = await fetch(`/api/tamar`)
        tamar = await tamarRes.json()
        console.log('✅ TAMAR:', tamar)
      } else if (tipoBono === 'DOLAR LINKED' || tipoBono === 'USD LINKED') {
        console.log('📥 Pidiendo Dólar...')
        const dolarRes = await fetch(`/api/dolar`)
        dolar = await dolarRes.json()
        console.log('✅ Dólar:', dolar)
      }

      console.log('📥 Pidiendo feriados...')
      const feriadosRes = await fetch(`/api/feriados`)
      const feriados = await feriadosRes.json()
      console.log('✅ Feriados:', feriados)

      // Extrae las bases de cálculo de las características del bono por separado
      const baseMes = caracteristicas?.basemes || '30';
      const baseAnual = caracteristicas?.baseanual || '360';
      console.log('✅ Base de cálculo (mes):', baseMes);
      console.log('✅ Base de cálculo (anual):', baseAnual);

      console.log('📤 Enviando datos al backend para calcular...')
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
          basemes: baseMes,
          baseanual: baseAnual,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('❌ Error en cálculo:', data)
        alert(`Error: ${data?.error || 'Cálculo fallido'}`)
        return
      }

      console.log('✅ Resultado:', data)
      setResultados(data)
    } catch (err) {
      console.error('❌ Error general:', err)
      alert('Error al intentar calcular la TIR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-4 font-sans">
      <h1 className="text-3xl font-bold text-gray-800">Calculadora de TIR</h1>
      <p className="text-gray-600">
        Selecciona un bono y sus parámetros para calcular su TIR y otras medidas.
      </p>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-1">Ticker</label>
          <select
            id="ticker"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
          >
            {tickersLoading ? (
              <option>Cargando tickers...</option>
            ) : (
              tickers.map(t => (
                <option key={t.ticker} value={t.ticker}>
                  {t.ticker} ({t.desctasa})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
          <input
            id="precio"
            type="number"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
            placeholder="Precio del bono"
          />
        </div>

        <div className="flex-1">
          <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">Fecha Valor</label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150 ease-in-out"
          />
        </div>
      </div>

      <button
        onClick={calcular}
        disabled={loading || tickersLoading}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:bg-blue-400"
      >
        {loading ? 'Calculando...' : 'Calcular TIR'}
      </button>

      {resultados && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Resultados</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto text-gray-700">
            {JSON.stringify(resultados, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
