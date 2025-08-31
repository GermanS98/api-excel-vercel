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
    try {
      console.log('📥 Pidiendo características y flujos...')
      const [caracRes, flujosRes] = await Promise.all([
        fetch(`/api/caracteristicas?ticker=${ticker}`),
        fetch(`/api/flujos?ticker=${ticker}`)
      ])

      const caracteristicas = await caracRes.json()
      const flujos = await flujosRes.json()
      console.log('✅ Características:', caracteristicas)
      console.log('✅ Flujos:', flujos)

      if (!caracteristicas || !caracteristicas.basemes || !caracteristicas.base) {
        console.error('❌ Error: Falta información de base de cálculo en las características del bono. Los campos basemes o base no están presentes.')
        alert('Error: No se pudo obtener la información de base de cálculo del bono. Inténtalo de nuevo.')
        return
      }

      let cer = []
      let tamar = []
      let dolar = []

      const tipo_bono = caracteristicas?.desctasa?.trim().toUpperCase();

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
      } else if (tipo_bono === 'DOLAR LINKED') {
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
          flujos,
          cer,
          tamar,
          dolar,
          precio: parseFloat(precio.toString()),
          fecha_valor: fecha,
          feriados,
          basemes: caracteristicas?.basemes,
          baseanual: caracteristicas?.base
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
    }
  }

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
        />

        <label className="block text-sm font-medium text-gray-700">Fecha de Valor</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        <button
          onClick={calcular}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        >
          Calcular TIR
        </button>
      </div>

      {resultados && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Resultados:</h2>
          <pre className="bg-gray-200 p-3 rounded text-sm overflow-x-auto text-gray-800">
            {JSON.stringify(resultados, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
