'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Search, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { US_STOCKS, ID_STOCKS, StockInfo } from '@/lib/popular-stocks';
import { useWatchlistStore } from '@/store/watchlistStore';

const ITEMS_PER_PAGE = 20;

export default function MarketTablePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'US' | 'ID'>('US');
  const [currentPage, setCurrentPage] = useState(0);
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  const { isInWatchlist, toggleWatchlist } = useWatchlistStore();

  const stocks = activeTab === 'US' ? US_STOCKS : ID_STOCKS;
  
  // Sort stocks so watchlisted symbols are at the top
  const sortedStocks = [...stocks].sort((a, b) => {
    const aWatch = isInWatchlist(a.symbol);
    const bWatch = isInWatchlist(b.symbol);
    if (aWatch && !bWatch) return -1;
    if (!aWatch && bWatch) return 1;
    return 0;
  });

  const totalPages = Math.ceil(sortedStocks.length / ITEMS_PER_PAGE);
  const currentStocks = sortedStocks.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
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
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchBatchData = async () => {
      if (currentStocks.length === 0) return;
      
      setIsLoading(true);
      try {
        const symbols = currentStocks.map(s => s.symbol).join(',');
        const res = await fetch(`/api/market/batch?symbols=${encodeURIComponent(symbols)}`);
        const data = await res.json();
        if (isMounted) {
          setMarketData(data);
        }
      } catch (error) {
        console.error("Failed to fetch batch data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBatchData();
    
    // Poll every 30 seconds for the table
    const interval = setInterval(fetchBatchData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentPage, activeTab]);

  const handleRowClick = (symbol: string) => {
    router.push(`/dashboard/market/${encodeURIComponent(symbol)}`);
  };

  const handleStarClick = (e: React.MouseEvent, stock: StockInfo) => {
    e.stopPropagation();
    toggleWatchlist({
      symbol: stock.symbol,
      name: stock.name,
      isId: activeTab === 'ID'
    });
  };

  const formatPrice = (val: number, isId: boolean) => {
    if (!val) return '-';
    if (isId) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            Market Overview
          </h1>
          <p className="text-gray-400 text-sm mt-1">Pantau pergerakan saham secara real-time untuk pasar Amerika dan Indonesia.</p>
        </div>

        {/* Global Search Bar */}
        <div className="relative z-20 w-full lg:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari simbol saham global (e.g. AAPL, IDX:GOTO)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-500"
            />
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchQuery.trim() !== '' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                {isLoadingSearch ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Mencari data saham seluruh dunia...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((stock, i) => (
                    <button
                      key={`${stock.symbol}-${i}`}
                      onClick={() => handleRowClick(stock.symbol)}
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
                    Tidak ditemukan saham dengan kata kunci tersebut.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-900/50 p-1 rounded-xl w-fit border border-gray-800">
        <button
          onClick={() => setActiveTab('US')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'US' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          🇺🇸 Pasar Amerika
        </button>
        <button
          onClick={() => setActiveTab('ID')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'ID' 
              ? 'bg-emerald-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          🇮🇩 Pasar Indonesia
        </button>
      </div>

      {/* Table Section */}
      <div className="flex-1 bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80 text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium pl-6 w-10"></th>
                <th className="p-4 font-medium">Saham</th>
                <th className="p-4 font-medium hidden md:table-cell">Mini Grafik (1D)</th>
                <th className="p-4 font-medium text-right">Harga</th>
                <th className="p-4 font-medium text-right pr-6">Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {currentStocks.map((stock) => {
                const data = marketData[stock.symbol];
                const price = data?.price || 0;
                const change = data?.change || 0;
                const changePercent = data?.changePercent || 0;
                const isPositive = change >= 0;
                const sparklineData = data?.sparkline?.map((p: number) => ({ value: p })) || [];
                const isStarred = isInWatchlist(stock.symbol);

                return (
                  <tr 
                    key={stock.symbol}
                    onClick={() => handleRowClick(stock.symbol)}
                    className="hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-6 w-10">
                      <button 
                        onClick={(e) => handleStarClick(e, stock)}
                        className={`p-1.5 rounded-lg hover:bg-gray-700 transition-colors ${isStarred ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                      >
                        <Star className={`w-5 h-5 ${isStarred ? 'fill-yellow-400' : ''}`} />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-sm text-gray-300">
                          {stock.symbol.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                            {stock.symbol.replace('.JK', '')}
                          </div>
                          <div className="text-xs text-gray-500 max-w-[150px] truncate" title={stock.name}>
                            {stock.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4 hidden md:table-cell w-32 lg:w-48">
                      {sparklineData.length > 0 ? (
                        <div className="h-10 w-full opacity-70 group-hover:opacity-100 transition-opacity">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparklineData}>
                              <YAxis domain={['dataMin', 'dataMax']} hide />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke={isPositive ? '#10B981' : '#EF4444'} 
                                strokeWidth={2} 
                                dot={false} 
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-10 w-full flex items-center justify-center text-xs text-gray-600">
                          {isLoading ? 'Memuat...' : 'No Data'}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="text-white font-medium">
                        {isLoading && !price ? '...' : formatPrice(price, activeTab === 'ID')}
                      </div>
                    </td>

                    <td className="p-4 text-right pr-6">
                      <div className={`inline-flex items-center gap-1 font-medium px-2 py-1 rounded-lg text-sm ${
                        isPositive 
                          ? 'text-emerald-400 bg-emerald-400/10' 
                          : 'text-red-400 bg-red-400/10'
                      }`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-auto p-4 border-t border-gray-800 bg-gray-900/30 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Menampilkan <span className="text-white font-medium">{currentPage * ITEMS_PER_PAGE + 1}</span> - <span className="text-white font-medium">{Math.min((currentPage + 1) * ITEMS_PER_PAGE, stocks.length)}</span> dari <span className="text-white font-medium">{stocks.length}</span> saham
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 py-2 bg-gray-800 rounded-lg text-sm font-medium text-white">
              {currentPage + 1} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
