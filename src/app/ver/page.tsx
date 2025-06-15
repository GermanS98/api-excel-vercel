import { useEffect, useState } from "react";

interface Dato {
  etiqueta: string;
  [clave: string]: string | number;
}

export default function Page() {
  const [datos, setDatos] = useState<Dato[]>([]);
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState<string>("");

  // Obtener los datos desde la API
  useEffect(() => {
    async function fetchDatos() {
      try {
        const res = await fetch("/api/recibir", { cache: "no-store" });
        const json = await res.json();
        setDatos(json.datos || []);
      } catch (err) {
        console.error("Error al obtener datos:", err);
      }
    }

    fetchDatos();
  }, []);

  // Obtener etiquetas únicas de la columna 1
  const etiquetas = Array.from(new Set(datos.map((d) => d.etiqueta)));

  // Filtrar los datos por la etiqueta seleccionada
  const datosFiltrados = etiquetaSeleccionada
    ? datos.filter((d) => d.etiqueta === etiquetaSeleccionada)
    : datos;

  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 Indicadores financieros desde Excel</h1>

      {/* Filtro de etiqueta */}
      <label>
        Filtrar por etiqueta:
        <select
          onChange={(e) => setEtiquetaSeleccionada(e.target.value)}
          value={etiquetaSeleccionada}
          style={{ marginLeft: "10px" }}
        >
          <option value="">Todas</option>
          {etiquetas.map((et) => (
            <option key={et} value={et}>
              {et}
            </option>
          ))}
        </select>
      </label>

      {/* Tabla de datos */}
      <table style={{ marginTop: "20px", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {datosFiltrados[0] &&
              Object.keys(datosFiltrados[0]).map((key) => (
                <th
                  key={key}
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    background: "#f5f5f5",
                  }}
                >
                  {key}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {datosFiltrados.map((fila, i) => (
            <tr key={i}>
              {Object.values(fila).map((valor, j) => (
                <td
                  key={j}
                  style={{
                    border: "1px solid #ccc",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  {valor}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
