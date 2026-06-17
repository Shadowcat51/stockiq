'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import TradingViewChart from '@/components/dashboard/market/TradingViewChart';
import { useMarketStore } from '@/store/marketStore';

// Contoh data saham untuk pencarian default
const POPULAR_STOCKS = [
  { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', type: 'EQUITY' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corp.', type: 'EQUITY' },
  { symbol: 'IDX:BBCA', name: 'Bank Central Asia Tbk.', type: 'EQUITY' },
  { symbol: 'IDX:GOTO', name: 'GoTo Gojek Tokopedia Tbk.', type: 'EQUITY' },
  { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', type: 'CRYPTOCURRENCY' },
];

import { use } from 'react';

export default function MarketDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  const { activeSymbol, setActiveSymbol, connectWebSocket, disconnectWebSocket } = useMarketStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>(POPULAR_STOCKS);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Decode the URL param symbol (e.g. NASDAQ%3AAAPL -> NASDAQ:AAPL)
  const paramSymbol = decodeURIComponent(resolvedParams.symbol);

  useEffect(() => {
    setActiveSymbol(paramSymbol);
  }, [paramSymbol, setActiveSymbol]);

  useEffect(() => {
    connectWebSocket(activeSymbol);
    return () => disconnectWebSocket();
  }, [activeSymbol, connectWebSocket, disconnectWebSocket]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(POPULAR_STOCKS);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSearch(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (error) {
        console.error("Failed to fetch search results", error);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const router = useRouter();

  const handleSelectStock = (symbol: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    router.push(`/dashboard/market/${encodeURIComponent(symbol)}`);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Market Analysis
          </h1>
          <p className="text-gray-400 text-sm mt-1">Real-time charts, advanced indicators, and drawing tools.</p>
        </div>

        {/* Search Bar */}
        <div className="relative z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search symbol (e.g. AAPL, IDX:BBCA)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full lg:w-80 bg-gray-800/50 border border-gray-700 text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-500"
            />
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {isLoadingSearch ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Mencari data saham seluruh dunia...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((stock, i) => (
                    <button
                      key={`${stock.symbol}-${i}`}
                      onClick={() => handleSelectStock(stock.symbol)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
                    >
                      <div>
                        <div className="text-white font-semibold">{stock.symbol.split(':')[1] || stock.symbol}</div>
                        <div className="text-xs text-gray-400">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 border border-gray-700">
                          {stock.symbol.split(':')[0] || stock.type}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No symbols found. You can still search directly via TradingView widget.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex-1 min-h-[600px] bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden flex flex-col relative shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        {/* TradingView Widget Container */}
        <div className="flex-1 w-full h-full p-1 relative z-10">
          <TradingViewChart symbol={activeSymbol} theme="dark" />
        </div>
      </div>
    </div>
  );
}
