import { create } from 'zustand';

interface MarketState {
  isConnected: boolean;
  activeSymbol: string;
  latestData: any | null;
  connectWebSocket: (symbol: string) => void;
  disconnectWebSocket: () => void;
  setActiveSymbol: (symbol: string) => void;
}

let ws: WebSocket | null = null;

export const useMarketStore = create<MarketState>((set, get) => ({
  isConnected: false,
  activeSymbol: 'NASDAQ:AAPL',
  latestData: null,
  setActiveSymbol: (symbol: string) => set({ activeSymbol: symbol }),
  connectWebSocket: (symbol: string) => {
    // Prevent multiple connections
    if (ws) {
      ws.close();
    }

    set({ isConnected: false });
    
    // Use exact hostname or fallback to 127.0.0.1 (not localhost, to avoid IPv6 issues)
    let defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
    if (defaultHost === 'localhost') defaultHost = '127.0.0.1';
    // Use Port 8001 (Node.js Proxy) which is permitted by Windows Firewall, proxying to 8000
    const wsUrl = process.env.NEXT_PUBLIC_STOCK_SERVICE_WS_URL || `ws://${defaultHost}:8001/ws/market`;
    
    try {
      const fullUrl = `${wsUrl}/${symbol}`;
      console.log(`[MarketStore] Attempting to connect WebSocket to: ${fullUrl}`);
      ws = new WebSocket(fullUrl);
      
      ws.onopen = () => {
        set({ isConnected: true });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only update if it's the symbol we're currently looking at
          if (data.symbol === get().activeSymbol.replace('NASDAQ:', '').replace('NYSE:', '').replace('IDX:', '').replace('.JK', '')) {
            set({ latestData: data });
          }
        } catch (error) {
          console.error("Error parsing websocket message", error);
        }
      };

      ws.onclose = () => {
        set({ isConnected: false });
        ws = null;
        // Optionally implement reconnect logic here
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        set({ isConnected: false });
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket", error);
    }
  },
  disconnectWebSocket: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    set({ isConnected: false });
  }
}));
