import { createClient } from '@supabase/supabase/dist/main/lib/SupabaseClient'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

const PAGE_SIZE = 1000; // El límite por defecto de Supabase/PostgREST

export async function GET(request: NextRequest) {
  let allData = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('cer')
      .select('*')
      .order('fecha', { ascending: false }) // Mantener descendente para optimización en Python
      .range(offset, offset + PAGE_SIZE - 1); // Obtener un rango de 1000 filas

    if (error) {
      console.error("Error fetching CER data:", error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (data) {
      allData = allData.concat(data);
      if (data.length < PAGE_SIZE) {
        hasMore = false; // No hay más datos para cargar
      } else {
        offset += PAGE_SIZE; // Mover el offset para la siguiente página
      }
    } else {
      hasMore = false; // No hay datos, salir del bucle
    }
  }

  console.log(`Fetched ${allData.length} CER records.`);
  return new Response(JSON.stringify(allData), { status: 200 });
}
