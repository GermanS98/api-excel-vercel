import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('cer')
    .select('*')
    // Cambiar a descendente para que el más reciente esté al principio
    .order('fecha', { ascending: false }) 
    .range(0, 50000); // Asegúrate de que este rango cubre todos tus datos

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  return new Response(JSON.stringify(data), { status: 200 })
}
