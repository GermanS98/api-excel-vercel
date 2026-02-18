'use client';

import React, { useEffect, useRef, memo } from 'react';

function TradingViewNews() {
    const container = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!container.current) return;

        container.current.innerHTML = '';

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
        script.type = "text/javascript";
        script.async = true;
        script.innerHTML = `
      {
        "displayMode": "regular",
        "feedMode": "all_symbols",
        "colorTheme": "light",
        "isTransparent": false,
        "locale": "en",
        "width": "100%",
        "height": "600"
      }`;

        const widgetContainer = document.createElement("div");
        widgetContainer.className = "tradingview-widget-container__widget";
        container.current.appendChild(widgetContainer);

        const copyright = document.createElement("div");
        copyright.className = "tradingview-widget-copyright";
        copyright.innerHTML = `<a href="https://www.tradingview.com/news/top-providers/tradingview/" rel="noopener nofollow" target="_blank"><span class="blue-text">Top stories</span></a><span class="trademark"> by TradingView</span>`;
        container.current.appendChild(copyright);

        container.current.appendChild(script);
    }, []);

    return (
        <div className="tradingview-widget-container" ref={container} style={{ height: '600px', width: '100%' }}>
            {/* El contenido se inyecta vía script */}
        </div>
    );
}

export default memo(TradingViewNews);
