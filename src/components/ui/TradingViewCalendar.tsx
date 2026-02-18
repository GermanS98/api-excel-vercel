'use client';

import React, { useEffect, useRef, memo } from 'react';

function TradingViewCalendar() {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!container.current) return;

        // Limpiar contenido previo por si acaso (aunque el array de dependencias [] debería evitarlo)
        container.current.innerHTML = '';

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = `
      {
        "colorTheme": "light",
        "isTransparent": false,
        "locale": "en",
        "countryFilter": "us,br,ar,eu,jp",
        "importanceFilter": "-1,0,1",
        "width": "100%",
        "height": "600"
      }`;

        // Crear contenedor para el widget y el copyright como en el ejemplo
        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container__widget";
        container.current.appendChild(widgetContainer);

        const copyright = document.createElement("div");
        copyright.className = "tradingview-widget-copyright";
        copyright.innerHTML = `<a href="https://www.tradingview.com/economic-calendar/" rel="noopener nofollow" target="_blank"><span class="blue-text">Economic Calendar</span></a><span class="trademark"> by TradingView</span>`;
        container.current.appendChild(copyright);

        container.current.appendChild(script);
    }, []);

    return (
        <div className="tradingview-widget-container" ref={container} style={{ height: '600px', width: '100%' }}>
            {/* El contenido se inyecta vía script */}
        </div>
    );
}

export default memo(TradingViewCalendar);
