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

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
          maxWidth: '600px',
        }}
      >
        <input
          type="text"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          placeholder="Ticker"
          style={{ padding: '0.5rem', fontSize: '16px', flex: '1 1 120px', minWidth: '100px' }}
        />
        <input
          type="text"
          value={precio}
          onChange={e => setPrecio(e.target.value)}
          placeholder="Precio"
          style={{ padding: '0.5rem', fontSize: '16px', flex: '1 1 120px', minWidth: '100px' }}
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
            flex: '1 1 120px',
            minWidth: '100px',
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

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '600px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            {datos[0]?.map((col, j) => {
              if (j === 4) return null // Ocultar columna 5
              return (
                <th
                  key={j}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {col}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
            {datosFiltrados.slice(1).map((fila, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                {fila.map((celda, j) => {
                  if (j === 4) return null // Ocultar columna 5
          
                  let contenido = celda
          
                  if (j === 3) {
                    const num = parseFloat(celda.toString().replace(',', '.'))
                    if (!isNaN(num)) contenido = num.toFixed(2)
                  }
          
                  if (j === 5 || (j >= 6 && j <= 10)) {
                    const num = parseFloat(celda.toString().replace(',', '.'))
                    if (!isNaN(num)) contenido = `${(num * 100).toFixed(2)}%`
                  }
          
                  return (
                    <td
                      key={j}
                      title={contenido}
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        maxWidth: '150px',
                        minWidth: '60px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {contenido}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
