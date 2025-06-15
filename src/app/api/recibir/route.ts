import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📥 Recibido:", body);

    // Aseguramos que sea una matriz
    if (!Array.isArray(body)) {
      return NextResponse.json({ status: 'error', message: 'Se esperaba un array' }, { status: 400 });
    }

    return NextResponse.json({ status: 'ok', recibido: body });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Error al procesar el JSON' }, { status: 400 });
  }
}
