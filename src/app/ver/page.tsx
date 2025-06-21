'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [precio, setPrecio] = useState('')
  const [datos, setDatos] = useState<any[][]>([])
  const [filtro, setFiltro] = useState<string>('')

  // Cargar datos desde la API
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
  const datosFiltrados = filtro ? datos.filter(fila => fila[0] === filtro) : datos

  // Enviar datos si querés agregar funcionalidad POST
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ejemplo de envío POST si lo necesitás
    
    await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify({ ticker, precio }),
      headers: { 'Content-Type': 'application/json' }
    })
    
    console.log('Ticker:', ticker, 'Precio:', precio)
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '1rem' }}>Ingresar Ticker y Precio</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input
          type="text"
          value={ticker}
          onChange={e => setTicker(e.target.value)}
          placeholder="Ticker"
          style={{ padding: '0.5rem', fontSize: '16px' }}
        />
        <input
          type="text"
          value={precio}
          onChange={e => setPrecio(e.target.value)}
          placeholder="Precio"
          style={{ padding: '0.5rem', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', fontSize: '16px' }}>
          Enviar
        </button>
      </form>

      <h2 style={{ fontSize: '20px', marginBottom: '1rem' }}>Datos recibidos desde Excel</h2>

      <label style={{ display: 'block', marginBottom: '1rem' }}>
        Filtrar por etiqueta:{' '}
        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={{ padding: '0.5rem' }}
        >
          <option value=''>-- Mostrar todos --</option>
          {etiquetas.map((etiqueta, i) => (
            <option key={i} value={etiqueta}>
              {etiqueta}
            </option>
          ))}
        </select>
      </label>

      <table border={1} cellPadding={8} style={{ marginTop: '1rem', borderCollapse: 'collapse' }}>
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
