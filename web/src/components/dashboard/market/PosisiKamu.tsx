import React, { useMemo } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { useMarketStore } from '@/store/marketStore';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PosisiKamu() {
  const activeSymbol = useMarketStore(state => state.activeSymbol);
  const latestData = useMarketStore(state => state.latestData);
  
  const portfolios = useSimulationStore(state => state.portfolios);
  const selectedCurrency = useSimulationStore(state => state.selectedCurrency);

  const holding = useMemo(() => {
    const targetCurrency = activeSymbol?.includes('IDX:') || activeSymbol?.endsWith('.JK') ? 'IDR' : 'USD';
    const portfolio = portfolios.find(p => p.currency === targetCurrency);
    if (!portfolio || !portfolio.holdings) return null;
    
    // Normalize activeSymbol to match holding symbol
    // e.g. NASDAQ:AAPL -> AAPL
    let searchSymbol = activeSymbol.split(':')[1] || activeSymbol;
    if (searchSymbol.endsWith('.JK')) {
      searchSymbol = searchSymbol.replace('.JK', '');
    }

    return portfolio.holdings.find(h => h.symbol === searchSymbol);
  }, [portfolios, activeSymbol]);

  // Use real-time price if available, fallback to holding's currentPrice
  const currentPrice = latestData?.price || holding?.currentPrice || 0;
  
  const quantity = holding?.quantity || 0;
  const avgCost = holding?.average_cost || 0;
  const marketValue = quantity * currentPrice;
  const costBasis = quantity * avgCost;
  const unrealizedPnl = marketValue - costBasis;
  const unrealizedPnlPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
  
  // Daily P&L is tricky without previous close. For now we use latestData.price - latestData.open or similar.
  // If not available, we just mock it or leave it as 0.
  const dailyPnl = 0; 
  const dailyPnlPct = 0;

  const isProfit = unrealizedPnl >= 0;
  const isDailyProfit = dailyPnl >= 0;

  const targetCurrency = activeSymbol?.includes('IDX:') || activeSymbol?.endsWith('.JK') ? 'IDR' : 'USD';

  const formatCurrency = (val: number) => {
    if (targetCurrency === 'IDR') {
      return `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Your Position</h3>
        <button className="text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex space-x-2 mb-6">
        <button className="px-4 py-1.5 bg-gray-800 text-white rounded-lg text-sm border border-gray-700">No Leverage</button>
        <button className="px-4 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg text-sm">Leverage</button>
        <button className="px-4 py-1.5 text-gray-400 hover:text-gray-200 rounded-lg text-sm">Options</button>
      </div>

      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">Total</p>
          <div className="flex items-center space-x-1 text-emerald-400 font-semibold cursor-pointer group">
            <span>{quantity} {activeSymbol.split(':')[1] || activeSymbol}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm mb-1">Available Quantity</p>
          <p className="text-white font-semibold">{quantity}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-1">Market Value</p>
          <p className="text-white font-semibold">{formatCurrency(marketValue)}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-1">Average Cost</p>
          <p className="text-white font-semibold">{formatCurrency(avgCost)}</p>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-1">Today's P&L</p>
          <p className={cn("font-semibold", isDailyProfit ? "text-emerald-400" : "text-red-400")}>
            {formatCurrency(dailyPnl)} ({dailyPnlPct.toFixed(2)}%)
          </p>
        </div>

        <div>
          <p className="text-gray-400 text-sm mb-1">Unrealized P&L</p>
          <p className={cn("font-semibold", isProfit ? "text-emerald-400" : "text-red-400")}>
            {formatCurrency(unrealizedPnl)} ({unrealizedPnlPct.toFixed(2)}%)
          </p>
        </div>
      </div>
    </div>
  );
}
