'use client'

import { useEffect, useState } from 'react'

export default function Graficos() {
  const baseUrl =
    'https://app.powerbi.com/reportEmbed?reportId=73116638-db46-4792-bf8d-c634972698b6&autoAuth=true&ctid=e631c664-107d-4e97-b93d-1965130d1449'

  const [url, setUrl] = useState(baseUrl)

  useEffect(() => {
    const interval = setInterval(() => {
      // Forzamos un "reload" cambiando un parámetro dummy
      setUrl(`${baseUrl}&t=${Date.now()}`)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '1rem' }}>Gráfico Power BI (auto-refresh)</h1>

      <iframe
        title="Reporte Power BI"
        width="100%"
        height="600"
        src={url}
        frameBorder="0"
        allowFullScreen={true}
        style={{ borderRadius: '8px' }}
      ></iframe>
    </div>
  )
}

