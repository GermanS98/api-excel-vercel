"use client";
import { useState } from "react";
import TablaResultados from "./TablaResultados"; // ajustá la ruta si está en otra carpeta

export default function Page() {
  const [precio, setPrecio] = useState("");
  const [cer, setCer] = useState("");
  const [tamar, setTamar] = useState("");
  const [usd, setUsd] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);

  const calcularTIR = async () => {
    setLoading(true);
    setResultado("");

    const payload = {
      ticker: "AL30",
      precio: parseFloat(precio),
      cer: cer ? parseFloat(cer) : null,
      tamar: tamar ? parseFloat(tamar) : null,
      usd: usd ? parseFloat(usd) : null,
    };

    try {
      const res = await fetch("https://tir-backend-iop7.onrender.com/calcular-tir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.tir !== undefined) {
        setResultado(`TIR: ${data.tir}% (ajuste: ${data.ajuste})`);
      } else {
        setResultado("❌ Error en el cálculo: " + JSON.stringify(data));
      }
    } catch (error) {
      setResultado("❌ Error de red o del servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Calcular TIR del bono AL30</h1>

      <label className="block mb-2">Precio actual:</label>
      <input
        type="number"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <label className="block mb-2">Proyección CER (opcional):</label>
      <input
        type="number"
        value={cer}
        onChange={(e) => setCer(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <label className="block mb-2">Proyección TAMAR (opcional):</label>
      <input
        type="number"
        value={tamar}
        onChange={(e) => setTamar(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <label className="block mb-2">Proyección USD (opcional):</label>
      <input
        type="number"
        value={usd}
        onChange={(e) => setUsd(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      <button
        onClick={calcularTIR}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Calculando..." : "Calcular TIR"}
      </button>

      {resultado && (
        <div className="mt-4 p-4 bg-gray-100 rounded shadow">{resultado}</div>
      )}

      <TablaResultados />
    </div>
  );
}
