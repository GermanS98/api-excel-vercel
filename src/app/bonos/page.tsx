'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'

export default function Page() {
  const [tickers, setTickers] = useState<{ ticker: string }[]>([])
  const [ticker, setTicker] = useState('')
  const [precio, setPrecio] = useState('')
  const [fecha, setFecha] = useState('')
  const [resultados, setResultados] = useState<any | null>(null)

  useEffect(() => {
    fetch('/api/bonos')
      .then(res => res.json())
      .then(data => setTickers(data))
      .catch(err => console.error('Error al cargar tickers:', err))
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

    let cer = []
    if (caracteristicas?.tipo === 'CER') {
      console.log('📥 Pidiendo CER...')
      const cerRes = await fetch(`/api/cer`)
      cer = await cerRes.json()
      console.log('✅ CER:', cer)
    }

    console.log('📤 Enviando datos al backend para calcular...')
    const res = await fetch('https://tir-backend.onrender.com/calcular_tir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caracteristicas,
        flujos,
        cer,
        precio: parseFloat(precio),
        fecha_valor: fecha,
        feriados: []
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

      const res = await fetch('https://tir-backend.onrender.com/calcular_tir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caracteristicas,
          flujos,
          cer,
          precio: parseFloat(precio),
          fecha_valor: fecha,
          feriados: []
        })
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('Error en cálculo:', data)
        alert(`Error: ${data?.error || 'Cálculo fallido'}`)
        return
      }

      setResultados(data)
    } catch (err) {
      console.error('Error general:', err)
      alert('Error al intentar calcular la TIR')
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-4">
      <h1 className="text-2xl font-bold">Calculadora de TIR</h1>

      <select
        className="w-full border p-2 rounded"
        value={ticker}
        onChange={e => setTicker(e.target.value)}
      >
        <option value="">Seleccionar bono</option>
        {tickers.map(t => (
          <option key={t.ticker} value={t.ticker}>{t.ticker}</option>
        ))}
      </select>

      <Input
        placeholder="Precio"
        type="number"
        value={precio}
        onChange={e => setPrecio(e.target.value)}
      />
      <Input
        placeholder="Fecha de compra"
        type="date"
        value={fecha}
        onChange={e => setFecha(e.target.value)}
      />

      <button
        onClick={calcular}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Calcular TIR
      </button>

      {resultados && (
        <div className="mt-4 bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(resultados, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
