'use client'

import { useEffect, useState } from 'react'

export default function Ver() {
  const [datos, setDatos] = useState<any[][]>([])

  useEffect(() => {
    fetch('/api/recibir')
      .then(res => res.json())
      .then(data => {
        setDatos(data.ultimoPost || [])
      })
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Últimos datos recibidos</h1>
      <table className="table-auto border border-collapse">
        <tbody>
          {datos.map((fila, i) => (
            <tr key={i}>
              {fila.map((celda, j) => (
                <td key={j} className="border px-2 py-1">{celda}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
