import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
    const { data, error } = await supabase
    .from('tamar')
    .select('*')
    .order('fecha', { ascending: true })

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  return new Response(JSON.stringify(data), { status: 200 })
}
