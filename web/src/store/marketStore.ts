import { create } from 'zustand';

interface MarketState {
  isConnected: boolean;
  activeSymbol: string;
  latestData: any | null;
  stockStats: any | null;
  stockTechnical: any | null;
  stockFundamental: any | null;
  stockFinance: any | null;
  stockActions: any[] | null;
  stockProfile: any | null;
  stockNews: any[] | null;
  isFetchingData: boolean;
  connectWebSocket: (symbol: string) => void;
  disconnectWebSocket: () => void;
  setActiveSymbol: (symbol: string) => void;
  fetchStockData: (symbol: string) => Promise<void>;
  fetchStockTechnical: (symbol: string, interval: string) => Promise<void>;
  fetchStockFundamental: (symbol: string) => Promise<void>;
  fetchStockFinance: (symbol: string) => Promise<void>;
  fetchStockActions: (symbol: string) => Promise<void>;
  fetchStockProfile: (symbol: string) => Promise<void>;
  fetchStockNews: (symbol: string) => Promise<void>;
}

let ws: WebSocket | null = null;

export const useMarketStore = create<MarketState>((set, get) => ({
  isConnected: false,
  activeSymbol: 'NASDAQ:AAPL',
  latestData: null,
  stockStats: null,
  stockTechnical: null,
  stockFundamental: null,
  stockFinance: null,
  stockActions: null,
  stockProfile: null,
  stockNews: null,
  isFetchingData: false,
  setActiveSymbol: (symbol: string) => {
    set({ activeSymbol: symbol });
    get().fetchStockData(symbol);
    get().fetchStockFinance(symbol);
    get().fetchStockActions(symbol);
    get().fetchStockProfile(symbol);
    get().fetchStockNews(symbol);
  },
  fetchStockData: async (symbol: string) => {
    set({ isFetchingData: true });
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4001';
      // The Next.js proxy at 3000 proxies /api/stocks to stock-service (port 8000)
      // Wait, is there a proxy for /api/stocks? Let's assume it directly hits stock-service or via proxy.
      // Usually stock-service is on port 8000. Let's use NEXT_PUBLIC_STOCK_SERVICE_URL or localhost:8000
      let defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      if (defaultHost === 'localhost') defaultHost = '127.0.0.1';
      const stockApiUrl = process.env.NEXT_PUBLIC_STOCK_SERVICE_URL || `http://${defaultHost}:8000`;
      
      const [statsRes, techRes] = await Promise.all([
        fetch(`${stockApiUrl}/api/stocks/${encodeURIComponent(symbol)}/stats`),
        fetch(`${stockApiUrl}/api/stocks/${encodeURIComponent(symbol)}/technical`)
      ]);
      
      const stats = await statsRes.json();
      const tech = await techRes.json();
      
      set({ stockStats: stats, stockTechnical: tech, isFetchingData: false });
    } catch (error) {
      console.error("Failed to fetch stock data", error);
      set({ stockStats: null, stockTechnical: null, isFetchingData: false });
    }
  },
  fetchStockTechnical: async (symbol: string, interval: string) => {
    set({ isFetchingData: true });
    try {
      let defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      if (defaultHost === 'localhost') defaultHost = '127.0.0.1';
      const stockApiUrl = process.env.NEXT_PUBLIC_STOCK_SERVICE_URL || `http://${defaultHost}:8000`;
      
      const techRes = await fetch(`${stockApiUrl}/api/stocks/${encodeURIComponent(symbol)}/technical?interval=${interval}`);
      const tech = await techRes.json();
      
      set({ stockTechnical: tech, isFetchingData: false });
    } catch (error) {
      console.error("Failed to fetch stock technical data", error);
      set({ isFetchingData: false });
    }
  },
  fetchStockFundamental: async (symbol: string) => {
    set({ isFetchingData: true });
    try {
      let defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      if (defaultHost === 'localhost') defaultHost = '127.0.0.1';
      const stockApiUrl = process.env.NEXT_PUBLIC_STOCK_SERVICE_URL || `http://${defaultHost}:8000`;
      
      const funRes = await fetch(`${stockApiUrl}/api/stocks/${encodeURIComponent(symbol)}/fundamental`);
      const fundamental = await funRes.json();
      
      set({ stockFundamental: fundamental, isFetchingData: false });
    } catch (error) {
      console.error("Failed to fetch stock fundamental data", error);
      set({ isFetchingData: false });
    }
  },
  fetchStockFinance: async (symbol: string) => {
    set({ isFetchingData: true });
    try {
      let defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      if (defaultHost === 'localhost') defaultHost = '127.0.0.1';
      const stockApiUrl = process.env.NEXT_PUBLIC_STOCK_SERVICE_URL || `http://${defaultHost}:8000`;
      
      const finRes = await fetch(`${stockApiUrl}/api/stocks/${encodeURIComponent(symbol)}/finance`);
      const finance = await finRes.json();
      
      set({ stockFinance: finance, isFetchingData: false });
    } catch (error) {
      console.error("Failed to fetch stock finance data", error);
      set({ isFetchingData: false });
    }
  },
  fetchStockActions: async (symbol: string) => {
    try {
      let defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      if (defaultHost === 'localhost') defaultHost = '127.0.0.1';
      const stockApiUrl = process.env.NEXT_PUBLIC_STOCK_SERVICE_URL || `http://${defaultHost}:8000`;
      
      const res = await fetch(`${stockApiUrl}/api/stocks/${encodeURIComponent(symbol)}/actions`);
      const actions = await res.json();
      
      set({ stockActions: actions });
    } catch (error) {
      console.error("Failed to fetch stock actions", error);
    }
  },
  fetchStockProfile: async (symbol: string) => {
    try {
      let defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      if (defaultHost === 'localhost') defaultHost = '127.0.0.1';
      const stockApiUrl = process.env.NEXT_PUBLIC_STOCK_SERVICE_URL || `http://${defaultHost}:8000`;
      
      const res = await fetch(`${stockApiUrl}/api/stocks/${encodeURIComponent(symbol)}/profile`);
      const profile = await res.json();
      
      set({ stockProfile: profile });
    } catch (error) {
      console.error("Failed to fetch stock profile", error);
    }
  },
  fetchStockNews: async (symbol: string) => {
    try {
      let defaultHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
      if (defaultHost === 'localhost') defaultHost = '127.0.0.1';
      const stockApiUrl = process.env.NEXT_PUBLIC_STOCK_SERVICE_URL || `http://${defaultHost}:8000`;
      
      const res = await fetch(`${stockApiUrl}/api/stocks/${encodeURIComponent(symbol)}/news`);
      const news = await res.json();
      
      set({ stockNews: news });
    } catch (error) {
      console.error("Failed to fetch stock news", error);
    }
  },
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
          const expectedSymbol = get().activeSymbol.replace('NASDAQ:', '').replace('NYSE:', '').replace('IDX:', '');
          if (data.symbol === expectedSymbol || data.symbol === expectedSymbol.replace('.JK', '')) {
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
