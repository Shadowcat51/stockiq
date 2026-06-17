'use client';

import React, { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
}

function TradingViewWidget({ symbol = "NASDAQ:AAPL", theme = "dark" }: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up previous script if symbol changes or unmounts
    if (container.current) {
      container.current.innerHTML = '';
    }

    // Convert Yahoo Finance format to TradingView format
    let tvSymbol = symbol;
    if (tvSymbol.endsWith(".JK")) {
      tvSymbol = `IDX:${tvSymbol.replace(".JK", "")}`;
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "${tvSymbol}",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "${theme}",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "rgba(15, 23, 42, 1)",
        "gridColor": "rgba(255, 255, 255, 0.06)",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "container_id": "tradingview_advanced_chart",
        "support_host": "https://www.tradingview.com"
      }`;
    
    if (container.current) {
      container.current.appendChild(script);
    }
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container h-full w-full relative" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}

export default memo(TradingViewWidget);
