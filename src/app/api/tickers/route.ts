import { createClient } from '@supabase/supabase-js'

// Crea el cliente de Supabase usando las variables de entorno
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

// Define la función GET para manejar la solicitud de API
export async function GET(req: Request) {
  try {
    // Consulta la tabla 'caracteristicas' para obtener solo el campo 'ticker' de todos los registros
    const { data, error } = await supabase
      .from('caracteristicas')
      .select('ticker');

    // Maneja los errores de la consulta
    if (error) {
      console.error('Error fetching tickers:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    // Devuelve los datos como una respuesta JSON
    return new Response(JSON.stringify(data), { status: 200 });
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
