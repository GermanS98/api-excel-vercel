'use client';

import React, { useEffect, useRef } from 'react';

// Definimos los tipos para las props
type ReportePDFGeneratorProps = {
    gruposDeSegmentos: { [key: string]: string[] };
    ultimoLoteDeDatos: any[]; // Podríamos importar el tipo Bono si estuviéramos en el mismo archivo, pero 'any' basta por ahora
    CurvaRendimientoChart: React.ComponentType<any>;
    TablaGeneral: React.ComponentType<any>;
    TablaSoberanosYONs: React.ComponentType<any>;
    onRendered: (element: HTMLElement) => void;
};

const ReportePDFGenerator = ({
    gruposDeSegmentos,
    ultimoLoteDeDatos,
    CurvaRendimientoChart,
    TablaGeneral,
    TablaSoberanosYONs,
    onRendered
}: ReportePDFGeneratorProps) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log('ReportePDFGenerator: Component mounted.');

        if (contentRef.current) {
            console.log('ReportePDFGenerator: contentRef is valid. Starting 1s timer...');
            // --- CAMBIO 1: Aumentamos el tiempo de espera a 1 segundo ---
            // Esto le da a los 6 gráficos tiempo de sobra para renderizarse.
            const timer = setTimeout(() => {
                console.log('ReportePDFGenerator: Timer finished. Calling onRendered...');
                try {
                    onRendered(contentRef.current!);
                } catch (error) {
                    console.error('ReportePDFGenerator: Error calling onRendered:', error);
                }
            }, 1000);

            return () => {
                console.log('ReportePDFGenerator: Component unmounting or cleanup, clearing timer.');
                clearTimeout(timer);
            };
        } else {
            console.error('ReportePDFGenerator: contentRef is null on mount!');
        }
    }, [onRendered]);

    const ordenarPorVencimiento = (datos: any[]) => {
        if (!datos) return [];
        return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    };

    // Tipamos el style correctamente para React
    const overlayStyle: React.CSSProperties = {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'auto'
    };

    // --- CAMBIO 2: Reducimos el ancho total del contenedor ---
    // 1024px es un ancho más seguro que cabe en la mayoría de los formatos.
    const reportContainerStyle: React.CSSProperties = {
        width: '1024px',
        background: 'white',
        padding: '1rem',
        border: '1px solid #ccc'
    };

    return (
        <div style={overlayStyle}>
            <h2 style={{ color: '#021751', marginBottom: '20px' }}>
                Generando reporte, por favor espere...
            </h2>

            <div ref={contentRef} style={reportContainerStyle}>
                {/* --- CAMBIO 3: Inyectamos CSS para achicar las tablas --- */}
                <style>
                    {`
                        .pdf-table th, .pdf-table td {
                            font-size: 10px !important; /* Letra más pequeña */
                            padding: 4px 6px !important;   /* Menos espaciado interno */
                        }
                    `}
                </style>

                {Object.keys(gruposDeSegmentos).map((titulo, index) => {
                    // 1. Filtrar las secciones que no queremos
                    if (titulo === 'ONs Dollar Linked' || titulo === 'Subsoberanos') return null;

                    const segmentos = gruposDeSegmentos[titulo];
                    const datosDelGrupo = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => segmentos.includes(b.s)));

                    const isBonares = titulo === 'Bonares y Globales';
                    const isSoberanos = titulo === 'Bonares y Globales' || titulo === 'Obligaciones Negociables';
                    // 2. Condición para mostrar gráfico
                    const showChart = titulo !== 'Obligaciones Negociables';

                    if (datosDelGrupo.length === 0) return null;

                    return (
                        <div key={titulo} style={{ padding: '20px' }}>
                            <h1 style={{ textAlign: 'center', fontSize: '1.5rem', color: '#021751', pageBreakBefore: index > 0 ? 'always' : 'auto' }}>
                                {titulo}
                            </h1>

                            {/* Envolvemos las tablas en un div con la nueva clase */}
                            <div className="pdf-table" style={{ width: '100%', marginTop: '1rem' }}>
                                {isSoberanos ? (
                                    <TablaSoberanosYONs titulo={""} datos={datosDelGrupo} />
                                ) : (
                                    <TablaGeneral titulo={""} datos={datosDelGrupo} />
                                )}
                            </div>

                            {showChart && (
                                <div style={{
                                    width: '80%', margin: '20px auto 0 auto',
                                    pageBreakBefore: 'auto', // No forzamos salto antes del gráfico
                                    pageBreakInside: 'avoid', // EVITA que el gráfico se corte a la mitad
                                    breakInside: 'avoid' // Compatibilidad extra
                                }}>
                                    {/* 3. Título del gráfico estilo tabla */}
                                    <h2 style={{ fontSize: '1.1rem', padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', margin: 0, textAlign: 'left' }}>
                                        Curva de Rendimiento
                                    </h2>
                                    <div style={{ height: '400px', border: '1px solid #e5e7eb', borderTop: 'none', padding: '10px' }}>
                                        <CurvaRendimientoChart
                                            data={datosDelGrupo}
                                            segmentoActivo={titulo}
                                            xAxisKey={isBonares ? 'md' : 'dv'}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReportePDFGenerator;
