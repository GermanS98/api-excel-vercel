'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

type NewsItem = {
    title: string;
    url: string;
    published_at: string;
    relevance_score: number;
};

export default function YahooNews() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const { data, error } = await supabase
                    .from('noticias')
                    .select('title, url, published_at, relevance_score')
                    .eq('source', 'Yahoo')
                    .order('published_at', { ascending: false })
                    .limit(15);

                if (error) console.error('Error fetching Yahoo news:', error);
                else setNews(data || []);
            } catch (err) {
                console.error('Unexpected error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
        const intervalId = setInterval(fetchNews, 60000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            height: '600px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb',
                margin: 0
            }}>
                Yahoo Finance News
            </h2>
            <div style={{ overflowY: 'auto', flex: 1, padding: '1rem' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando noticias...</p>
                ) : news.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {news.map((item, index) => (
                            <li key={index} style={{
                                marginBottom: '1rem',
                                borderBottom: '1px solid #f3f4f6',
                                paddingBottom: '1rem',
                                padding: '0.75rem',
                                borderRadius: '6px',
                                background: item.relevance_score >= 9 ? '#fef9c3' : 'transparent',
                                borderLeft: item.relevance_score >= 9 ? '3px solid #eab308' : 'none'
                            }}>
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontWeight: 500, color: '#2563eb', textDecoration: 'none', display: 'block', marginBottom: '0.25rem' }}
                                >
                                    {item.title}
                                </a>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                    {new Date(item.published_at).toLocaleString('es-AR', {
                                        day: '2-digit', month: '2-digit',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ textAlign: 'center', color: '#6b7280' }}>No hay noticias disponibles.</p>
                )}
            </div>
        </div>
    );
}
