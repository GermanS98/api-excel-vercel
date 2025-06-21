"use client";

import { useState, useEffect } from "react";

// --- Componente para la tabla de resultados ---
// Se obtiene y muestra los últimos cálculos realizados
function TablaResultados() {
  // Estado para guardar los datos, el estado de carga y posibles errores
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect se ejecuta una vez cuando el componente se monta
  useEffect(() => {
    fetch("https://tir-backend-iop7.onrender.com/ultimos-resultados")
      .then((res) => {
        if (!res.ok) {
          throw new Error("La respuesta del servidor no fue exitosa");
        }
        return res.json();
      })
      .then((fetchedData) => {
        setData(fetchedData);
      })
      .catch((err) => {
        console.error("Error al cargar los últimos resultados:", err);
        setError("No se pudieron cargar los últimos resultados.");
      })
      .finally(() => {
        setLoading(false); // La carga termina, ya sea con éxito o con error
      });
  }, []); // El array vacío [] asegura que el efecto se ejecute solo una vez

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4">📊 Últimos resultados calculados</h2>

      {loading && <p>Cargando tabla...</p>}
      {error && <p className="text-red-600 bg-red-100 p-3 rounded">{error}</p>}

      {!loading && !error && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">
                  Ticker
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">
                  Precio
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">
                  TIR (%)
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">
                  Ajuste
                </th>
                <th className="whitespace-nowrap px-4 py-2 text-left font-medium text-gray-900">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                    {r.ticker}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                    {r.precio}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                    {r.tir}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                    {r.ajuste}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                    {new Date(r.fecha).toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --- Componente principal de la página ---
// Contiene el formulario y ahora también la tabla de resultados.
export default function Page() {
  const [ticker, setTicker] = useState("");
  const [precio, setPrecio] = useState("");
  const [cer, setCer] = useState("");
  const [tamar, setTamar] = useState("");
  const [usd, setUsd] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);

  const calcularTIR = async () => {
    setLoading(true);
    setResultado(""); // Limpiar resultado previo al intentar un nuevo cálculo

    // Validación básica para ticker y precio
    if (!ticker) {
      setResultado("❌ Por favor, ingresa un Ticker.");
      setLoading(false);
      return;
    }
    if (!precio || isNaN(parseFloat(precio))) {
      setResultado("❌ Por favor, ingresa un Precio válido.");
      setLoading(false);
      return;
    }

    const payload = {
      ticker: ticker.toUpperCase(), // Convertir ticker a mayúsculas para consistencia
      precio: parseFloat(precio),
      cer: cer ? parseFloat(cer) : null,
      tamar: tamar ? parseFloat(tamar) : null,
      usd: usd ? parseFloat(usd) : null,
    };

    try {
      const res = await fetch(
        "https://tir-backend-iop7.onrender.com/calcular-tir",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok && data.tir !== undefined) {
        setResultado(`✅ TIR: ${data.tir}% (ajuste: ${data.ajuste})`);
      } else {
        const errorMsg = data.error || JSON.stringify(data);
        setResultado(`❌ Error en el cálculo: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error al enviar solicitud:", error); // Registrar el error real en consola
      setResultado("❌ Error de red o del servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Calculadora de TIR de Bonos</h1>
      {/* Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
        <div>
          <label htmlFor="tickerInput" className="block mb-2 font-medium text-gray-700">
            Ticker: <span className="text-red-500">*</span>
          </label>
          <input
            id="tickerInput"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)} {/* ¡CORREGIDO AQUÍ! */}
            className="border p-2 rounded w-full border-gray-300 shadow-sm"
            placeholder="Ej: AL30, GD30, T2X4"
            required
          />
        </div>
        <div>
          <label htmlFor="precioInput" className="block mb-2 font-medium text-gray-700">
            Precio actual: <span className="text-red-500">*</span>
          </label>
          <input
            id="precioInput"
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="border p-2 rounded w-full border-gray-300 shadow-sm"
            placeholder="Ej: 50000"
            required
          />
        </div>
        <div>
          <label htmlFor="cerInput" className="block mb-2 font-medium text-gray-700">
            Proyección CER (opcional):
          </label>
          <input
            id="cerInput"
            type="number"
            value={cer}
            onChange={(e) => setCer(e.target.value)}
            className="border p-2 rounded w-full border-gray-300 shadow-sm"
            placeholder="Tasa mensual. Ej: 4.2"
          />
        </div>
        <div>
          <label htmlFor="tamarInput" className="block mb-2 font-medium text-gray-700">
            Proyección TAMAR (opcional):
          </label>
          <input
            id="tamarInput"
            type="number"
            value={tamar}
            onChange={(e) => setTamar(e.target.value)}
            className="border p-2 rounded w-full border-gray-300 shadow-sm"
            placeholder="Tasa mensual. Ej: 3.5"
          />
        </div>
        <div>
          <label htmlFor="usdInput" className="block mb-2 font-medium text-gray-700">
            Proyección USD (opcional):
          </label>
          <input
            id="usdInput"
            type="number"
            value={usd}
            onChange={(e) => setUsd(e.target.value)}
            className="border p-2 rounded w-full border-gray-300 shadow-sm"
            placeholder="Tasa mensual. Ej: 2.0"
          />
        </div>
      </div>

      <button
        onClick={calcularTIR}
        disabled={loading || !ticker || !precio} // Deshabilitar si ticker o precio están vacíos
        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Calculando..." : "Calcular TIR"}
      </button>

      {resultado && (
        <div
          className={`mt-4 p-4 rounded-lg shadow ${
            resultado.startsWith("✅")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {resultado}
        </div>
      )}

      {/* Aquí se renderiza el componente de la tabla */}
      <TablaResultados />
    </div>
  );
}
