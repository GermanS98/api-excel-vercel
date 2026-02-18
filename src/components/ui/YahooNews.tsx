'use client';

import React, { useEffect, useState } from 'react';

type NewsItem = {
    title: string;
    link: string;
    pubDate: string;
};

export default function YahooNews() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/yahoo_news');
                if (res.ok) {
                    const json = await res.json();
                    setNews(json.data || []);
                }
            } catch (error) {
                console.error("Error fetching Yahoo News:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();

        // Auto-refresh every 60 seconds
        const intervalId = setInterval(fetchNews, 60000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            height: '600px', // Match widgets height
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
                    <p className="text-center text-gray-500">Cargando noticias...</p>
                ) : news.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {news.map((item, index) => (
                            <li key={index} style={{ marginBottom: '1rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '1rem' }}>
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontWeight: 500, color: '#2563eb', textDecoration: 'none', display: 'block', marginBottom: '0.25rem' }}
                                >
                                    {item.title}
                                </a>
                                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                    {new Date(item.pubDate).toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500">No hay noticias disponibles.</p>
                )}
            </div>
        </div>
    );
}
