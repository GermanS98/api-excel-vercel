'use client';

import React, { useEffect, useRef } from 'react';

// Este componente ahora se mostrará temporalmente para forzar el renderizado.
const ReportePDFGenerator = ({
    gruposDeSegmentos,
    ultimoLoteDeDatos,
    CurvaRendimientoChart,
    TablaGeneral,
    TablaSoberanosYONs,
    onRendered
}) => {
    const contentRef = useRef(null);

    // El useEffect con el temporizador sigue siendo crucial.
    useEffect(() => {
        if (contentRef.current) {
            // Damos una pausa para asegurar que TODO esté dibujado.
            const timer = setTimeout(() => {
                // Le pasamos solo el contenedor del contenido, no la pantalla de carga.
                onRendered(contentRef.current);
            }, 500); // Aumentamos un poco el tiempo a 0.5s para estar seguros.

            return () => clearTimeout(timer);
        }
    }, [onRendered]);

    const ordenarPorVencimiento = (datos) => {
        return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    };
    
    // --- ESTILOS PARA LA PANTALLA DE CARGA VISIBLE ---
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.9)', // Fondo blanco semitransparente
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
    };
    
    const reportContainerStyle = {
        width: '1100px', // Ancho fijo para el contenido del PDF
        background: 'white', // Fondo blanco sólido para el contenido
        padding: '1rem',
        border: '1px solid #ccc' // Un borde para verlo mientras se genera
    };

    return (
        // Contenedor principal que cubre toda la pantalla.
        <div style={overlayStyle}>
            <h2 style={{ color: '#021751', marginBottom: '20px' }}>
                Generando reporte, por favor espere...
            </h2>
            
            {/* Este es el contenedor que realmente se convertirá en PDF.
              Lo metemos dentro del overlay para que el navegador lo renderice.
            */}
            <div ref={contentRef} style={reportContainerStyle}>
                {Object.keys(gruposDeSegmentos).map(titulo => {
                    const segmentos = gruposDeSegmentos[titulo];
                    const datosDelGrupo = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => segmentos.includes(b.segmento)));
                    const isBonares = titulo === 'Bonares y Globales';
                    const isSoberanos = titulo === 'Bonares y Globales' || titulo === 'Obligaciones Negociables';

                    if (datosDelGrupo.length === 0) return null;

                    return (
                        <div key={titulo} style={{ pageBreakAfter: 'always', padding: '20px', borderBottom: '1px solid #eee' }}>
                            <h1 style={{ textAlign: 'center', fontSize: '1.5rem', color: '#021751' }}>{titulo}</h1>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginTop: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <CurvaRendimientoChart
                                        data={datosDelGrupo}
                                        segmentoActivo={titulo}
                                        xAxisKey={isBonares ? 'modify_duration' : 'dias_vto'}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    {isSoberanos ? (
                                        <TablaSoberanosYONs titulo={""} datos={datosDelGrupo} />
                                    ) : (
                                        <TablaGeneral titulo={""} datos={datosDelGrupo} />
                                    )}
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