'use client'

import { useState, useEffect } from 'react'

export default function Page() {
  const [ticker, setTicker] = useState('')
  const [precio, setPrecio] = useState('')
  const [resultado, setResultado] = useState('')
  const [loading, setLoading] = useState(false)

  const [datos, setDatos] = useState<any[][]>([])
  const [filtro, setFiltro] = useState<string>('')

  const calcularTIR = async () => {
    setLoading(true)
    setResultado('')

    const payload = {
      ticker,
      precio: parseFloat(precio.replace(',', '.')),
    }

    try {
      const res = await fetch('https://tir-backend-iop7.onrender.com/calcular-tir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok && data.tir !== undefined) {
        setResultado(`✅ TIR: ${data.tir}% (ajuste: ${data.ajuste})`)
      } else {
        const errorMsg = data.error || JSON.stringify(data)
        setResultado(`❌ Error en el cálculo: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Error al conectarse con el backend:', error)
      setResultado('❌ Error de red o del servidor. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Carga los datos que llegan desde Excel
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const res = await fetch('/api/recibir', { cache: 'no-store' })
        const json = await res.json()
        if (json.datos && Array.isArray(json.datos)) {
          setDatos(json.datos)
        }
      } catch (e) {
        console.error('Error al obtener datos desde Excel:', e)
      }
    }

    fetchDatos()
  }, [])

  const etiquetas = Array.from(new Set(datos.map(fila => fila[0])))
  const datosFiltrados = filtro ? datos.filter(fila => fila[0] === filtro) : datos

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '1rem' }}>Ingresar Ticker y Precio</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <input
          type="text"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
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
        <button
          onClick={calcularTIR}
          disabled={loading || !ticker || !precio}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      {resultado && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: resultado.startsWith('✅') ? '#e6ffed' : '#ffe6e6',
            color: resultado.startsWith('✅') ? '#03543f' : '#9b1c1c',
          }}
        >
          {resultado}
        </div>
      )}

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
