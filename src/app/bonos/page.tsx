'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    const res = await fetch('https://tir-backend.onrender.com/calcular_tir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker,
        precio: parseFloat(precio),
        fecha_compra: fecha
      })
    })
    const data = await res.json()
    setResultados(data)
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
        placeholder="Fecha de compra (YYYY-MM-DD)"
        type="date"
        value={fecha}
        onChange={e => setFecha(e.target.value)}
      />

      <Button onClick={calcular}>Calcular TIR</Button>

      {resultados && (
        <div className="mt-4 bg-gray-100 p-4 rounded">
          <pre>{JSON.stringify(resultados, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
