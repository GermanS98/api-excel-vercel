import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

export async function GET() {
  const { data, error } = await supabase.from('caracteristicas').select('ticker')
  if (error) return NextResponse.json([], { status: 500 })
  const tickers = data.map(d => d.ticker)
  return NextResponse.json(tickers)
}
