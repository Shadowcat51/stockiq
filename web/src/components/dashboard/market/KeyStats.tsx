import React from 'react';
import { useMarketStore } from '@/store/marketStore';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function KeyStats() {
  const stockStats = useMarketStore(state => state.stockStats);
  const isFetchingData = useMarketStore(state => state.isFetchingData);
  const latestData = useMarketStore(state => state.latestData);
  const activeSymbol = useMarketStore(state => state.activeSymbol);

  const isId = activeSymbol?.includes('IDX:') || activeSymbol?.endsWith('.JK');

  const formatNumber = (num: number, isCurrency = false) => {
    if (!num) return '-';
    const prefix = isCurrency ? (isId ? 'Rp ' : '$') : '';
    if (num >= 1e12) return prefix + (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return prefix + (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return prefix + (num / 1e6).toFixed(2) + 'M';
    
    if (isCurrency) {
      return isId 
        ? `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        : '$' + num.toLocaleString();
    }
    return num.toLocaleString();
  };

  const formatPrice = (price: number) => {
    if (!price) return '-';
    return isId 
      ? `Rp ${price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '$' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (isFetchingData && !stockStats) {
    return <div className="animate-pulse bg-gray-900/50 h-64 rounded-2xl mb-6"></div>;
  }

  const stats = stockStats || {};
  const currentPrice = latestData?.price || stats.currentPrice || 0;
  
  // 52W range calculation for the visual bar
  const low52 = stats.fiftyTwoWeekLow || 0;
  const high52 = stats.fiftyTwoWeekHigh || 0;
  let rangePercent = 0;
  if (high52 > low52 && currentPrice > 0) {
    rangePercent = ((currentPrice - low52) / (high52 - low52)) * 100;
    // Clamp between 0 and 100
    rangePercent = Math.max(0, Math.min(100, rangePercent));
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Key Stats</h3>
        <button className="text-gray-400 hover:text-white transition-colors">
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm">Market Cap</span>
          <span className="text-white font-medium">{formatNumber(stats.marketCap, true)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm">Volume</span>
          <span className="text-white font-medium">{formatNumber(stats.volume)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm">Sector</span>
          <span className="text-white font-medium">{stats.sector || '-'}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm">52W High</span>
          <span className="text-white font-medium">{formatPrice(stats.fiftyTwoWeekHigh)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm">52W Low</span>
          <span className="text-white font-medium">{formatPrice(stats.fiftyTwoWeekLow)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm">Typical Hold Time</span>
          <span className="text-white font-medium">-</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm">Enterprise Value</span>
          <span className="text-white font-medium">{formatNumber(stats.enterpriseValue, true)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <span className="text-gray-400 text-sm">Dividend Yield</span>
          <span className="text-emerald-400 font-medium">
            {stats.dividendYield ? (stats.dividendYield * 100).toFixed(2) + '%' : '-'}
          </span>
        </div>
        <div className="flex justify-between items-center pb-2">
          <span className="text-gray-400 text-sm">Trailing P/E</span>
          <span className="text-white font-medium">{stats.trailingPE ? stats.trailingPE.toFixed(2) : '-'}</span>
        </div>
      </div>

      {/* 52 Week Range Bar */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="relative h-2 bg-gray-700 rounded-full mb-2">
          {currentPrice > 0 && high52 > low52 && (
            <>
              {/* Tooltip for current price */}
              <div 
                className="absolute top-[-30px] -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded shadow-lg"
                style={{ left: `${rangePercent}%` }}
              >
                {formatPrice(currentPrice)}
                {/* Arrow down */}
                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white"></div>
              </div>
              {/* Dot indicator */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] border-2 border-gray-900"
                style={{ left: `${rangePercent}%` }}
              ></div>
            </>
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <div>
            <span className="text-gray-400">52W Low:</span> {formatPrice(low52)}
          </div>
          <div>
            <span className="text-gray-400">52W High:</span> {formatPrice(high52)}
          </div>
        </div>
      </div>
    </div>
  );
}
