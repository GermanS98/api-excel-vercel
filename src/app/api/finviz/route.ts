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
        // Helper to parse CSV line respecting quotes
        const parseCSVLine = (line: string) => {
            const values = [];
            let currentValue = '';
            let insideQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (insideQuotes && line[i + 1] === '"') {
                        // Handle escaped quote ""
                        currentValue += '"';
                        i++; // Skip next quote
                    } else {
                        insideQuotes = !insideQuotes;
                    }
                } else if (char === ',' && !insideQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());
            return values;
        };

        const headers = parseCSVLine(rows[0]);

        const data = rows.slice(1).map(row => {
            const values = parseCSVLine(row);
            const obj: Record<string, string> = {};
            headers.forEach((header, index) => {
                // If header or value is missing, handle gracefully
                if (header) {
                    obj[header] = values[index] ?? '';
                }
            });
            return obj;
        });

        return NextResponse.json({ data });

    } catch (error) {
        console.error('Error fetching Finviz data:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
