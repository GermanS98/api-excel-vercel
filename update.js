import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function actualizar() {
  for (const q of QUERIES) {
    console.log(`🔎 Consultando API: ${q.url}`);

    const response = await fetch(q.url, {
      agent: new (await import("https")).Agent({ rejectUnauthorized: false }),
    });
    if (!response.ok) throw new Error(`Error API ${q.url}: ${response.statusText}`);

    const data = await response.json();
    const detalles = data.results?.[0]?.detalle ?? [];

    if (detalles.length === 0) {
      console.log(`⚠️ Sin datos para ${q.table}`);
      continue;
    }

    // Mapear todos los registros
    const rows = detalles.map((d) => ({
      fecha: d.fecha,
      [q.column]: d.valor,
    }));

    console.log(`📥 ${rows.length} registros para ${q.table}`);

    const { error } = await supabase.from(q.table).upsert(rows, {
      onConflict: "fecha", // 🔑 importante: tu tabla debe tener UNIQUE(fecha)
    });

    if (error) throw new Error(`Error insertando en ${q.table}: ${error.message}`);
    console.log(`✅ Insertados/actualizados ${rows.length} registros en ${q.table}`);
  }

  console.log("🎉 Actualización completada.");
}

actualizar().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
