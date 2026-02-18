import { NextResponse } from 'next/server';

export async function GET() {
    // URL provided by the user with auth token (News Export)
    const FINVIZ_URL = "https://elite.finviz.com/news_export.ashx?v=1&auth=2081aeb1-af08-4c05-aac1-e101d2d536f6";

    try {
        const response = await fetch(FINVIZ_URL);

        if (!response.ok) {
            throw new Error(`Finviz API returned ${response.status}: ${response.statusText}`);
        }

        const csvText = await response.text();

        // Devolvemos el CSV text directamente, o podríamos parsearlo a JSON aquí si preferimos.
        // Para simpleza y parseo en cliente, enviamos JSON con el raw text o parseado.
        // Vamos a intentar parsearlo a JSON básico para facilitar consumo.

        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(h => h.replace(/"/g, '').trim());

        const data = rows.slice(1).map(row => {
            // Manejo básico de CSV (no perfecto para commas dentro de quotes, pero funcional para datos simples)
            // Para mayor robustez en producción usar librería 'csv-parse' o similar.
            // Aquí asumimos formato estándar simple por ahora.
            const values = row.split(',').map(v => v.replace(/"/g, '').trim());
            const obj: Record<string, string> = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] ?? '';
            });
            return obj;
        });

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Error fetching Finviz data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
