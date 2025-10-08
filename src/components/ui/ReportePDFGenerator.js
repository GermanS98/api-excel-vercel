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
    
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        background: 'rgba(255, 255, 255, 0.9)', zIndex: 9998, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        overflow: 'auto'
    };
    
    // Ajustamos el ancho para que coincida mejor con el formato 'legal'
    const reportContainerStyle = {
        width: '1200px', 
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
                {Object.keys(gruposDeSegmentos).map((titulo, index) => {
                    const segmentos = gruposDeSegmentos[titulo];
                    const datosDelGrupo = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => segmentos.includes(b.segmento)));
                    const isBonares = titulo === 'Bonares y Globales';
                    const isSoberanos = titulo === 'Bonares y Globales' || titulo === 'Obligaciones Negociables';

                    if (datosDelGrupo.length === 0) {
                        return null;
                    }

                    return (
                        // El contenedor de sección ya no necesita controlar el salto
                        <div key={titulo} style={{ padding: '20px' }}>
                            <h1 style={{ textAlign: 'center', fontSize: '1.5rem', color: '#021751', pageBreakBefore: index > 0 ? 'always' : 'auto' }}>
                                {titulo}
                            </h1>
                            
                            {/* La tabla se renderiza normalmente */}
                            <div style={{ width: '100%', marginTop: '1rem' }}>
                                {isSoberanos ? (
                                    <TablaSoberanosYONs titulo={""} datos={datosDelGrupo} />
                                ) : (
                                    <TablaGeneral titulo={""} datos={datosDelGrupo} />
                                )}
                            </div>
                            
                            {/* --- CAMBIO CLAVE AQUÍ --- */}
                            {/* Forzamos un salto de página ANTES del gráfico */}
                            <div style={{ 
                                width: '80%', 
                                margin: '20px auto 0 auto', 
                                height: '400px',
                                pageBreakBefore: 'always' // Inicia una nueva página para el gráfico
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