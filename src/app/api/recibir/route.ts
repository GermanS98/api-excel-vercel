import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 Recibido:", body);
    return NextResponse.json({ status: 'ok', recibido: body });
  } catch (error) {
    console.error("❌ Error al parsear JSON:", error);
    return NextResponse.json({ status: 'error', message: 'Cuerpo inválido' }, { status: 400 });
  }
}
