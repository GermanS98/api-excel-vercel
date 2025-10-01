import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const BCRA_API_URL = "https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/44";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
  try {
    const res = await fetch(BCRA_API_URL);
    if (!res.ok) throw new Error("Error al obtener datos del BCRA");
    const data = await res.json();

    const ultimoDato = data.results[0]?.detalle[0];
    if (!ultimoDato) throw new Error("No se encontraron datos válidos en la API");

    const { error } = await supabase.from("tamar").upsert({
      fecha: ultimoDato.fecha,
      tamar: ultimoDato.valor,
    });

    if (error) throw error;

    console.log("✅ Dato actualizado:", ultimoDato.fecha, ultimoDato.valor);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
})();
