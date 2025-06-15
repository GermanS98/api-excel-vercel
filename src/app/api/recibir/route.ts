// src/app/api/recibir/route.ts

import { NextRequest, NextResponse } from 'next/server'

let ultimoPost: any = null // Esto se resetea con cada despliegue

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ status: 'error', message: 'Se esperaba un array' }, { status: 400 })
    }
    ultimoPost = body
    console.log("📥 Recibido:", body)
    return NextResponse.json({ status: 'ok', recibido: body })
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Error al procesar el JSON' }, { status: 400 })
  }
}

export function GET() {
  return NextResponse.json({ ultimoPost })
}
