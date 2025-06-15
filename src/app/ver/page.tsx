'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [datos, setDatos] = useState<any[][]>([])
  const [filtro, setFiltro] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/recibir', { cache: 'no-store' })
        const json = await res.json()
        if (json.datos && Array.isArray(json.datos)) {
          setDatos(json.datos)
        }
      } catch (e) {
        console.error('Error al obtener datos:', e)
      }
    }

    fetchData()
  }, [])

  const etiquetas = Array.from(new Set(datos.map(fila => fila[0])))

  const datosFiltrados = filtro
    ? datos.filter(fila => fila[0] === filtro)
    : datos

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '1rem' }}>
        Datos recibidos desde Excel
      </h1>

      <label>
        Filtrar por etiqueta:{' '}
        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={{ padding: '0.5rem', marginBottom: '1rem' }}
        >
          <option value=''>-- Mostrar todos --</option>
          {etiquetas.map((etiqueta, i) => (
            <option key={i} value={etiqueta}>
              {etiqueta}
            </option>
          ))}
        </select>
      </label>

      <table border={1} cellPadding={8} style={{ marginTop: '1rem' }}>
        <tbody>
          {datosFiltrados.map((fila, i) => (
            <tr key={i}>
              {fila.map((celda, j) => (
                <td key={j}>{celda}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
