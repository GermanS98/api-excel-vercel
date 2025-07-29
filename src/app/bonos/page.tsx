'use client'

import { useState } from 'react'

export default function BonosPage() {
  const [ticker, setTicker] = useState('TX25')
  const [precio, setPrecio] = useState(120)
  const [fecha, setFecha] = useState('2025-07-28')
  const [resultados, setResultados] = useState<any>(null)

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

      let cer = []
      if (caracteristicas?.tipo === 'CER') {
        console.log('📥 Pidiendo CER...')
        const cerRes = await fetch(`/api/cer`)
        cer = await cerRes.json()
        console.log('✅ CER:', cer)
      }

      console.log('📤 Enviando datos al backend para calcular...')
      const res = await fetch('https://tir-backend-iop7.onrender.com/tir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caracteristicas,
          flujos,
          cer,
          precio: parseFloat(precio.toString()),
          fecha_valor: fecha,
          feriados: [],
          base_calculo: '30/360'
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
    <div className="max-w-xl mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-bold">Calculadora de TIR</h1>

      <div className="flex space-x-2">
        <select value={ticker} onChange={e => setTicker(e.target.value)}>
          <option value="TX25">TX25</option>
          <option value="T2X6">T2X6</option>
          {/* Agregá más opciones si querés */}
        </select>

        <input
          type="number"
          value={precio}
          onChange={e => setPrecio(parseFloat(e.target.value))}
          className="border px-2"
          placeholder="Precio"
        />

        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border px-2"
        />

        <button onClick={calcular} className="px-4 py-1 border rounded">
          Calcular TIR
        </button>
      </div>

      {resultados && (
        <div className="mt-4">
          <h2 className="font-semibold">Resultados:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(resultados, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
