'use client';

import React, { useEffect, useRef } from 'react';

const ReportePDFGenerator = ({
    gruposDeSegmentos,
    ultimoLoteDeDatos,
    CurvaRendimientoChart,
    TablaGeneral,
    TablaSoberanosYONs,
    onRendered
}) => {
    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current) {
            // --- CAMBIO 1: Aumentamos el tiempo de espera a 1 segundo ---
            // Esto le da a los 6 gráficos tiempo de sobra para renderizarse.
            const timer = setTimeout(() => {
                onRendered(contentRef.current);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [onRendered]);

    const ordenarPorVencimiento = (datos) => {
        if (!datos) return [];
        return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    };
    
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        background: 'rgba(255, 255, 255, 0.9)', zIndex: 9998, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', overflow: 'auto'
    };
    
    // --- CAMBIO 2: Reducimos el ancho total del contenedor ---
    // 1024px es un ancho más seguro que cabe en la mayoría de los formatos.
    const reportContainerStyle = {
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
                    const segmentos = gruposDeSegmentos[titulo];
                    const datosDelGrupo = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => segmentos.includes(b.segmento)));
                    const isBonares = titulo === 'Bonares y Globales';
                    const isSoberanos = titulo === 'Bonares y Globales' || titulo === 'Obligaciones Negociables';

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
                            
                            <div style={{ 
                                width: '80%', margin: '20px auto 0 auto', height: '400px',
                                pageBreakBefore: 'always'
                            }}>
                                <CurvaRendimientoChart
                                    data={datosDelGrupo}
                                    segmentoActivo={titulo}
                                    xAxisKey={isBonares ? 'modify_duration' : 'dias_vto'}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReportePDFGenerator;