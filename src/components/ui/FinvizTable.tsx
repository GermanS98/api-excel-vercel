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
            marginBottom: '2rem',
            border: '1px solid #e5e7eb'
        }}>
            <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>Finviz News</span>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 400 }}>Últimas 20</span>
            </h2>
            <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ background: '#f3f4f6', color: '#374151', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                            {headers.map((h) => (
                                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '2px solid #e5e7eb' }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, 20).map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                {headers.map((h) => (
                                    <td key={`${i}-${h}`} style={{ padding: '0.75rem 1rem', color: '#4b5563', verticalAlign: 'top' }}>
                                        {h === 'Title' || h === 'title' ? (
                                            <span style={{ fontWeight: 500, color: '#111827' }}>{row[h]}</span>
                                        ) : (
                                            row[h]
                                        )}
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
