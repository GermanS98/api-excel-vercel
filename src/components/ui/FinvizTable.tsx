'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

type FinvizItem = {
    title: string;
    url: string;
    published_at: string;
    relevance_score: number;
    relevance_reason: string;
};

export default function FinvizTable() {
    const [data, setData] = useState<FinvizItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinviz = async () => {
            try {
                const { data: rows, error } = await supabase
                    .from('noticias')
                    .select('title, url, published_at, relevance_score, relevance_reason')
                    .eq('source', 'Finviz')
                    .order('published_at', { ascending: false })
                    .limit(20);

                if (error) console.error('Error fetching Finviz news:', error);
                else setData(rows || []);
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchFinviz();
    }, []);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('es-AR', {
                day: '2-digit', month: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
                fontSize: '1.25rem', fontWeight: 600, color: '#111827',
                marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <span>Finviz News</span>
                <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 400 }}>Últimas 20</span>
            </h2>
            <div style={{
                background: '#fff', borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ background: '#021751', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Fecha</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Título</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Score</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Razón</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                        Cargando noticias de Finviz...
                                    </td>
                                </tr>
                            ) : data.length > 0 ? (
                                data.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem 1rem', color: '#6b7280', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                            {formatDate(item.published_at)}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                                                style={{ fontWeight: 500, color: '#2563eb', textDecoration: 'none' }}>
                                                {item.title}
                                            </a>
                                        </td>
                                        <td style={{
                                            padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600,
                                            color: item.relevance_score >= 7 ? '#059669' : item.relevance_score >= 4 ? '#d97706' : '#6b7280'
                                        }}>
                                            {item.relevance_score > 0 ? `${item.relevance_score}/10` : '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                                            {item.relevance_reason || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                        No hay noticias de Finviz disponibles.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
