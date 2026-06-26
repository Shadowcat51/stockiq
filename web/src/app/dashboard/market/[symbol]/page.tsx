'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Activity } from 'lucide-react';
import { useMarketStore } from '@/store/marketStore';
import { MarketTabs } from '@/components/dashboard/market/MarketTabs';
import { RingkasanTab } from '@/components/dashboard/market/tabs/RingkasanTab';
import { OrderTab } from '@/components/dashboard/market/tabs/OrderTab';
import { OptionsTab } from '@/components/dashboard/market/tabs/OptionsTab';
import { TeknikalTab } from '@/components/dashboard/market/tabs/TeknikalTab';
import { FundamentalTab } from '@/components/dashboard/market/tabs/FundamentalTab';
import { FinanceTab } from '@/components/dashboard/market/tabs/FinanceTab';
import { CorporateActionsTab } from '@/components/dashboard/market/tabs/CorporateActionsTab';
import { ProfileTab } from '@/components/dashboard/market/tabs/ProfileTab';
import { NewsTab } from '@/components/dashboard/market/tabs/NewsTab';

// Contoh data saham untuk pencarian default
const POPULAR_STOCKS = [
  { symbol: 'NASDAQ:AAPL', name: 'Apple Inc.', type: 'EQUITY' },
  { symbol: 'NASDAQ:MSFT', name: 'Microsoft Corp.', type: 'EQUITY' },
  { symbol: 'IDX:BBCA', name: 'Bank Central Asia Tbk.', type: 'EQUITY' },
  { symbol: 'IDX:GOTO', name: 'GoTo Gojek Tokopedia Tbk.', type: 'EQUITY' },
  { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', type: 'CRYPTOCURRENCY' },
];

import { use } from 'react';

const TABS = [
  'Overview', 'Order', 'Options', 'News', 'Technical', 
  'Fundamental', 'Finance', 'Corporate Actions', 'Profile'
];

export default function MarketDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params);
  
  const activeSymbol = useMarketStore(state => state.activeSymbol);
  const setActiveSymbol = useMarketStore(state => state.setActiveSymbol);
  const connectWebSocket = useMarketStore(state => state.connectWebSocket);
  const disconnectWebSocket = useMarketStore(state => state.disconnectWebSocket);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>(POPULAR_STOCKS);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  
  const [activeTab, setActiveTab] = useState('Overview');

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

  const handleBuyClick = () => {
    router.push(`/dashboard/trade/${encodeURIComponent(activeSymbol)}?side=buy`);
  };

  const handleSellClick = () => {
    router.push(`/dashboard/trade/${encodeURIComponent(activeSymbol)}?side=sell`);
  };

  return (
    <div className="flex flex-col h-full space-y-2 relative pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            {activeSymbol}
          </h1>
          <p className="text-gray-400 text-sm mt-1">Market Analysis & Trading</p>
        </div>

        {/* Action Buttons (Sticky Top Right) */}
        <div className="flex gap-2">
          <button 
            onClick={handleBuyClick}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Buy
          </button>
          <button 
            onClick={handleSellClick}
            className="px-6 py-2 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-red-500/20"
          >
            Sell
          </button>
        </div>
      </div>

      {/* Search Bar Row */}
      <div className="relative z-20 w-full max-w-md">
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
            className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-gray-500"
          />
        </div>

        {/* Search Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
              {isLoadingSearch ? (
                <div className="p-4 text-center text-gray-500 text-sm">Searching global stock data...</div>
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
                  No symbols found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <MarketTabs 
        tabs={TABS} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'Overview' && <RingkasanTab activeSymbol={activeSymbol} />}
        {activeTab === 'Order' && <OrderTab activeSymbol={activeSymbol} />}
        {activeTab === 'Options' && <OptionsTab activeSymbol={activeSymbol} />}
        {activeTab === 'Technical' && <TeknikalTab activeSymbol={activeSymbol} />}
        {activeTab === 'Fundamental' && <FundamentalTab activeSymbol={activeSymbol} onNavigateToFinance={() => setActiveTab('Finance')} />}
        {activeTab === 'News' && <NewsTab activeSymbol={activeSymbol} />}
        {activeTab === 'Finance' && <FinanceTab activeSymbol={activeSymbol} />}
        {activeTab === 'Corporate Actions' && <CorporateActionsTab activeSymbol={activeSymbol} />}
        {activeTab === 'Profile' && <ProfileTab activeSymbol={activeSymbol} />}
        
        {/* Placeholder for other tabs */}
        {activeTab !== 'Overview' && activeTab !== 'Order' && activeTab !== 'Options' && activeTab !== 'Technical' && activeTab !== 'Fundamental' && activeTab !== 'News' && activeTab !== 'Finance' && activeTab !== 'Corporate Actions' && activeTab !== 'Profile' && (
          <div className="flex items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl">
            <p className="text-gray-500">Content for the {activeTab} tab is coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
