'use client';

import React, { useEffect, useRef } from 'react';

// Este componente renderizará todo el contenido del reporte de forma oculta.
// Recibe todos los datos y componentes necesarios como props.
const ReportePDFGenerator = ({
    gruposDeSegmentos,
    ultimoLoteDeDatos,
    CurvaRendimientoChart,
    TablaGeneral,
    TablaSoberanosYONs,
    onRendered // Función a llamar cuando el componente esté listo
}) => {
    const contentRef = useRef(null);

    // useEffect se ejecuta cuando el componente se monta en el DOM.
    // En ese momento, todo el contenido ya está renderizado y listo para ser capturado.
    useEffect(() => {
        if (contentRef.current) {
            onRendered(contentRef.current); // Llama a la función de la página principal
        }
    }, [onRendered]);

    const ordenarPorVencimiento = (datos) => {
        return [...datos].sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());
    };
    
    return (
        // Este div está posicionado fuera de la pantalla para que el usuario no lo vea.
        <div ref={contentRef} style={{ position: 'absolute', left: '-9999px', width: '1100px' }}>
            {Object.keys(gruposDeSegmentos).map(titulo => {
                const segmentos = gruposDeSegmentos[titulo];
                const datosDelGrupo = ordenarPorVencimiento(ultimoLoteDeDatos.filter(b => segmentos.includes(b.segmento)));
                const isBonares = titulo === 'Bonares y Globales';
                const isSoberanos = titulo === 'Bonares y Globales' || titulo === 'Obligaciones Negociables';

                // Si no hay datos para un grupo, no lo incluimos en el PDF.
                if (datosDelGrupo.length === 0) return null;

                return (
                    // Cada sección tendrá su propio contenedor con un salto de página después.
                    <div key={titulo} style={{ pageBreakAfter: 'always', padding: '20px' }}>
                        <h1 style={{ textAlign: 'center' }}>{titulo}</h1>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                            {/* Columna del Gráfico */}
                            <div style={{ flex: 1 }}>
                                <CurvaRendimientoChart
                                    data={datosDelGrupo}
                                    segmentoActivo={titulo}
                                    xAxisKey={isBonares ? 'modify_duration' : 'dias_vto'}
                                />
                            </div>
                            {/* Columna de la Tabla */}
                            <div style={{ flex: 1 }}>
                                {isSoberanos ? (
                                    <TablaSoberanosYONs titulo={titulo} datos={datosDelGrupo} />
                                ) : (
                                    <TablaGeneral titulo={titulo} datos={datosDelGrupo} />
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ReportePDFGenerator;