import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// Configuración de queries: endpoint del BCRA → tabla + columna
const QUERIES = [
  {
    url: "https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/44", // TAMAR
    table: "tamar",
    column: "tamar",
  },
  {
    url: "https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/5", // A3500
    table: "a3500",
    column: "a3500",
  },
  {
    url: "https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/30", // CER
    table: "cer",
    column: "cer",
  },
];

// Cliente de Supabase con variables de entorno
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function actualizar() {
  let resultados = [];
  for (const q of QUERIES) {
    console.log(`🔎 Consultando API: ${q.url}`);

    const response = await fetch(q.url, { agent: new (await import("https")).Agent({ rejectUnauthorized: false }) });
    if (!response.ok) throw new Error(`Error API ${q.url}: ${response.statusText}`);

    const data = await response.json();
    const ultimoDato = data.results?.[0]?.detalle?.[0];
    if (!ultimoDato) throw new Error(`No se encontraron datos en ${q.url}`);

    const fecha = ultimoDato.fecha;
    const valor = ultimoDato.valor;
    console.log(`✅ ${q.table}: ${fecha} → ${valor}`);

    const { error } = await supabase.from(q.table).upsert({
      fecha: fecha,
      [q.column]: valor,
    });

    if (error) throw new Error(`Error insertando en ${q.table}: ${error.message}`);
    resultados.push({ tabla: q.table, fecha, valor });
  }

  console.log("🎉 Actualización completada:", resultados);
}

actualizar().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

