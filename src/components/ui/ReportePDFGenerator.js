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
            const timer = setTimeout(() => {
                onRendered(contentRef.current);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [onRendered]);

    const ordenarPorVencimiento = (datos) => {
        if (!datos) return [];
        return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    };
    
    // Estilos del overlay (sin cambios)
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        background: 'rgba(255, 255, 255, 0.9)', zIndex: 9998, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center'
    };
    
    // Estilos del contenedor del reporte (sin cambios)
    const reportContainerStyle = {
        width: '1100px', background: 'white', padding: '1rem', border: '1px solid #ccc'
    };

    return (
        <div style={overlayStyle}>
            <h2 style={{ color: '#021751', marginBottom: '20px' }}>
                Generando reporte, por favor espere...
            </h2>
            
            <div ref={contentRef} style={reportContainerStyle}>
                {Object.keys(gruposDeSegmentos).map(titulo => {
                    const segmentos = gruposDeSegmentos[titulo];
                    const datosDelGrupo = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => segmentos.includes(b.segmento)));
                    const isBonares = titulo === 'Bonares y Globales';
                    const isSoberanos = titulo === 'Bonares y Globales' || titulo === 'Obligaciones Negociables';

                    if (datosDelGrupo.length === 0) {
                        return null;
                    }

                    return (
                        // --- CAMBIO 1: Evitamos que esta sección se corte entre páginas ---
                        <div key={titulo} style={{ 
                            pageBreakInside: 'avoid', // Le dice al PDF que no corte este div
                            padding: '20px', 
                            borderBottom: '1px solid #eee' 
                        }}>
                            <h1 style={{ textAlign: 'center', fontSize: '1.5rem', color: '#021751' }}>{titulo}</h1>
                            
                            <div style={{ 
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '20px', marginTop: '1rem' 
                            }}>
                                <div style={{ width: '100%' }}>
                                    {isSoberanos ? (
                                        <TablaSoberanosYONs titulo={""} datos={datosDelGrupo} />
                                    ) : (
                                        <TablaGeneral titulo={""} datos={datosDelGrupo} />
                                    )}
                                </div>
                                
                                {/* --- CAMBIO 2: Le damos una altura fija al contenedor del gráfico --- */}
                                <div style={{ width: '80%', marginTop: '20px', height: '400px' }}>
                                    <CurvaRendimientoChart
                                        data={datosDelGrupo}
                                        segmentoActivo={titulo}
                                        xAxisKey={isBonares ? 'modify_duration' : 'dias_vto'}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReportePDFGenerator;