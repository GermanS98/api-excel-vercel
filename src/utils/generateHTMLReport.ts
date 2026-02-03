export const generateHTMLReport = (
    gruposDeSegmentos: { [key: string]: string[] },
    ultimoLoteDeDatos: any[]
): string => {

    const currentDate = new Date().toLocaleDateString('es-AR');

    // Función auxiliar para formatear números
    const formatValue = (value: number | null | undefined, unit: string = '%', decimals: number = 2) => {
        if (value === null || typeof value === 'undefined' || !isFinite(value)) return '-';
        const numeroAFormatear = value * (unit === '%' ? 100 : 1);
        return `${numeroAFormatear.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${unit}`;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };

    let scriptContent = `
        const datos = ${JSON.stringify(ultimoLoteDeDatos)};
        const gruposDeSegmentos = ${JSON.stringify(gruposDeSegmentos)};

        // Paleta de colores consistente con la app
        const PALETA_SEGMENTOS = {
          'LECAP': '#1036E2', 'BONCAP': '#1036E2', 'BONTE': '#1036E2', 'DUAL TAMAR': '#1036E2',
          'CER': '#1036E2', 'ON CER': '#1036E2',
          'DL': '#1036E2', 'ON DL': '#1036E2', 'ON HD': '#1036E2',
          'TAMAR': '#1036E2', 'ON TAMAR': '#1036E2',
          'BONAR': '#1036E2',      
          'GLOBAL': '#00C600',    
          'BOPREAL': '#021751',   
          'ON': '#1036E2',
          'default': '#1036E2'
        };

        // Función de regresión lineal simple (traducción de simple-statistics)
        function linearRegression(data) {
            const n = data.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            for (let i = 0; i < n; i++) {
                sumX += data[i][0];
                sumY += data[i][1];
                sumXY += data[i][0] * data[i][1];
                sumXX += data[i][0] * data[i][0];
            }
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            return { m: slope, b: intercept };
        }

        function calculateTrend(data, xAxisKey, segmento) {
             const dataForRegression = segmento ? data.filter(p => p.s === segmento) : data;
             // Filtramos puntos validos: x > 0 y tir valida
             const points = dataForRegression
                .filter(p => p[xAxisKey] > 0 && typeof p.tir === 'number' && isFinite(p.tir))
                .map(p => [Math.log(p[xAxisKey]), p.tir]);
            
            if (points.length < 2) return null;

            const { m, b } = linearRegression(points);
            
            // Generamos puntos para la linea de tendencia
            const xValues = dataForRegression.map(p => p[xAxisKey]).filter(x => x > 0).sort((a,b) => a-b);
            const uniqueX = [...new Set(xValues)];
            
            return {
                x: uniqueX,
                y: uniqueX.map(x => m * Math.log(x) + b)
            };
        }

        function renderChart(divId, data, title, xAxisKey, isSoberanos) {
            const traces = [];
            
            if (isSoberanos) {
                const subSegmentos = ['BONAR', 'GLOBAL', 'BOPREAL'];
                subSegmentos.forEach(seg => {
                    const segData = data.filter(d => d.s === seg);
                    if(segData.length === 0) return;
                    
                    traces.push({
                        x: segData.map(d => d[xAxisKey]),
                        y: segData.map(d => d.tir), // Sin multiplicar, Plotly formatea
                        text: segData.map(d => d.t),
                        mode: 'markers+text',
                        type: 'scatter',
                        name: seg,
                        textposition: 'top center',
                        marker: { color: PALETA_SEGMENTOS[seg], size: 8 }
                    });

                    const trend = calculateTrend(data, xAxisKey, seg);
                    if (trend) {
                        traces.push({
                            x: trend.x,
                            y: trend.y,
                            mode: 'lines',
                            type: 'scatter',
                            name: 'Tendencia ' + seg,
                            line: { dash: 'dashdot', width: 1, color: PALETA_SEGMENTOS[seg]},
                            showlegend: false
                        });
                    }
                });
            } else {
                 traces.push({
                    x: data.map(d => d[xAxisKey]),
                    y: data.map(d => d.tir),
                    text: data.map(d => d.t),
                    mode: 'markers+text',
                    type: 'scatter',
                    name: 'Bonos',
                    textposition: 'top center',
                    marker: { color: PALETA_SEGMENTOS['default'], size: 8 }
                });
                
                const trend = calculateTrend(data, xAxisKey);
                if (trend) {
                    traces.push({
                        x: trend.x,
                        y: trend.y,
                        mode: 'lines',
                        type: 'scatter',
                        name: 'Tendencia',
                        line: { dash: 'dashdot', width: 1, color: PALETA_SEGMENTOS['default']},
                        showlegend: false
                    });
                }
            }

            const layout = {
                title: { text: title, font: { size: 16 } },
                xaxis: { title: xAxisKey === 'md' ? 'Modified Duration' : 'Días al Vencimiento' },
                yaxis: { title: 'TIR', tickformat: '.0%' },
                hovermode: 'closest',
                height: 500
            };

            Plotly.newPlot(divId, traces, layout);
        }

        // Renderizado inicial
        Object.keys(gruposDeSegmentos).forEach(titulo => {
             // 1. Filtros globales
             if (titulo === 'ONs Dollar Linked' || titulo === 'Subsoberanos') return;

             const segmentos = gruposDeSegmentos[titulo];
             // Filtramos y ordenamos por vto
             const datosGrupo = datos
                .filter(b => segmentos.includes(b.s))
                .sort((a,b) => new Date(a.vto) - new Date(b.vto));

             if (datosGrupo.length === 0) return;

             const isBonares = titulo === 'Bonares y Globales';
             const isSoberanos = titulo === 'Bonares y Globales' || titulo === 'Obligaciones Negociables';
             const showChart = titulo !== 'Obligaciones Negociables'; // No chart for ONs

             // Render Chart si corresponde
             if (showChart) {
                const divId = 'chart-' + titulo.replace(/[^a-zA-Z0-9]/g, '');
                renderChart(divId, datosGrupo, 'Curva de Rendimiento - ' + titulo, isBonares ? 'md' : 'dv', isSoberanos);
             }
        });
    `;

    let bodyContent = `
        <div class="container">
            <h1 class="main-title">Reporte de Bonos Argentinos - ${currentDate}</h1>
    `;

    Object.keys(gruposDeSegmentos).forEach(titulo => {
        // 1. Filtrar secciones
        if (titulo === 'ONs Dollar Linked' || titulo === 'Subsoberanos') return;

        const segmentos = gruposDeSegmentos[titulo];
        const datosGrupo = ultimoLoteDeDatos
            .filter(b => segmentos.includes(b.s))
            .sort((a, b) => new Date(a.vto).getTime() - new Date(b.vto).getTime());

        if (datosGrupo.length === 0) return;

        const isBonares = titulo === 'Bonares y Globales';
        const isSoberanos = titulo === 'Bonares y Globales' || titulo === 'Obligaciones Negociables';
        const showChart = titulo !== 'Obligaciones Negociables';

        bodyContent += `
            <div class="section">
                <h2 class="section-title">${titulo}</h2>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Vto</th>
                                <th>Precio</th>
                                <th>Var</th>
                                <th>TIR</th>
                                ${isSoberanos ? '<th>MD</th><th>Paridad</th>' : '<th>TNA</th><th>TEM</th>'}
                            </tr>
                        </thead>
                        <tbody>
                            ${datosGrupo.map(item => `
                                <tr>
                                    <td>${item.t}</td>
                                    <td>${formatDate(item.vto)}</td>
                                    <td style="background-color: ${item.pc ? '#e0f7fa' : 'transparent'}">${formatValue(item.p, '', 2)}</td>
                                    <td style="color: ${item.v >= 0 ? '#22c55e' : '#ef4444'}">${formatValue(item.v)}</td>
                                    <td>${formatValue(item.tir)}</td>
                                    ${isSoberanos
                ? `<td>${formatValue(item.md, '', 2)}</td><td>${formatValue(item.pd, '', 2)}</td>`
                : `<td>${formatValue(item.tna)}</td><td>${formatValue(item.tem)}</td>`
            }
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${showChart ? `<div id="chart-${titulo.replace(/[^a-zA-Z0-9]/g, '')}" class="chart-container"></div>` : ''}
            </div>
        `;
    });

    bodyContent += `</div>`; // Close container

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Bonos - ${currentDate}</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; color: #1f2937; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .main-title { color: #021751; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 50px; page-break-inside: avoid; }
        .section-title { color: #021751; background: #f9fafb; padding: 10px 15px; border-radius: 6px; border-left: 5px solid #021751; }
        
        .table-container { overflow-x: auto; margin-bottom: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
        table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        th { background: #021751; color: white; padding: 10px; text-align: left; }
        td { padding: 8px 10px; border-top: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        
        .chart-container { width: 100%; height: 500px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background: white; }
    </style>
</head>
<body>
    ${bodyContent}
    <script>
        ${scriptContent}
    </script>
</body>
</html>
    `;
};
