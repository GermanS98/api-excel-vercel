'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function Page() {
  const [tickers, setTickers] = useState<string[]>([])
  const [ticker, setTicker] = useState('')
  const [precio, setPrecio] = useState('')
  const [fecha, setFecha] = useState('')
  const [resultados, setResultados] = useState<any | null>(null)

  useEffect(() => {
    fetch('/api/tickers')
      .then(res => res.json())
      .then(data => setTickers(data))
  }, [])

  const calcular = async () => {
    const res = await fetch('https://tir-backend.onrender.com/calcular_tir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, precio: parseFloat(precio), fecha_compra: fecha })
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
          <option key={t} value={t}>{t}</option>
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

      <Button onClick={calcular}>Calcular</Button>

      {resultados && (
        <div className="mt-6 space-y-2">
          <h2 className="text-xl font-semibold">Indicadores</h2>
          <pre className="bg-gray-100 p-3 rounded text-sm">
            {JSON.stringify(resultados.indicadores, null, 2)}
          </pre>

          <h2 className="text-xl font-semibold">Cashflow</h2>
          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="border p-1">Fecha</th>
                <th className="border p-1">Flujo</th>
                <th className="border p-1">Valor residual</th>
              </tr>
            </thead>
            <tbody>
              {resultados.cashflow.map((f: any, i: number) => (
                <tr key={i}>
                  <td className="border p-1">{f.fecha}</td>
                  <td className="border p-1">{f.flujo}</td>
                  <td className="border p-1">{f.valor_residual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
