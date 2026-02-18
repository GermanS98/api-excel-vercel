'use client';

import React, { useEffect, useState } from 'react';

type FinvizRow = Record<string, string>;

export default function FinvizTable() {
    const [data, setData] = useState<FinvizRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFinviz = async () => {
            try {
                const res = await fetch('/api/finviz');
                if (!res.ok) throw new Error('Error fetching Finviz data');
                const json = await res.json();
                if (json.error) throw new Error(json.error);

                // El API devuelve { data: [...] }
                setData(json.data || []);
            } catch (err) {
                console.error(err);
                setError('No se pudieron cargar los datos de Finviz.');
            } finally {
                setLoading(false);
            }
        };

        fetchFinviz();
    }, []);

    if (loading) return <div className="p-4 text-center">Cargando datos de Finviz...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
    if (!data.length) return <div className="p-4 text-center">No hay datos disponibles.</div>;

    // Obtenemos headers dinámicamente del primer objeto
    const headers = Object.keys(data[0]);

    return (
        <div style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            marginBottom: '2rem'
        }}>
            <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb'
            }}>
                Finviz Data
            </h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ background: '#021751', color: 'white' }}>
                        <tr>
                            {headers.map((h) => (
                                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #e5e7eb' }}>
                                {headers.map((h) => (
                                    <td key={`${i}-${h}`} style={{ padding: '0.75rem 1rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
                                        {row[h]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
