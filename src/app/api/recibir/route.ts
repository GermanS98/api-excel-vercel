// src/app/api/recibir/route.ts

import { NextRequest, NextResponse } from 'next/server'

let ultimoPost: any[][] = []

export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log("📥 Recibido:", body)

  if (Array.isArray(body)) {
    ultimoPost = body
  }

  return NextResponse.json({ status: 'ok', recibido: body })
}

export async function GET() {
  return NextResponse.json({ ultimoPost })
}
