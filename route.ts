import { NextRequest, NextResponse } from 'next/server'

let ultimoPost: any[][] = []

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (Array.isArray(body)) {
      ultimoPost = body
      console.log("📥 Recibido:", body)
      return NextResponse.json({ status: 'ok' })
    } else {
      return NextResponse.json({ status: 'error', message: 'Se esperaba un array' }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ status: 'error', message: 'JSON inválido' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ datos: ultimoPost })
}

