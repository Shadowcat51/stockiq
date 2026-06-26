'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet } from 'lucide-react';
import { useSimulationStore } from '@/store/simulationStore';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

export function PortfolioSnapshot() {
  const { portfolios, selectedCurrency, setSelectedCurrency, isInitialized } = useSimulationStore();
  const activePortfolio = portfolios.find(p => p.currency === selectedCurrency);

  const pieData = useMemo(() => {
    if (!activePortfolio || !activePortfolio.holdings || activePortfolio.holdings.length === 0) {
      return [{ name: 'No Assets', value: 1, color: '#334155' }];
    }
    
    return activePortfolio.holdings
      .sort((a, b) => b.marketValue - a.marketValue)
      .map((h, index) => ({
        name: h.symbol,
        value: h.marketValue,
        color: COLORS[index % COLORS.length]
      }));
  }, [activePortfolio]);

  if (!isInitialized || !activePortfolio) {
    return (
      <div className="bg-gradient-to-b from-slate-800/40 to-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-[300px] flex items-center justify-center">
        <span className="text-gray-400">Loading portfolio...</span>
      </div>
    );
  }

  const isProfit = activePortfolio.totalUnrealizedPnl >= 0;
  const totalMarketValue = activePortfolio.totalMarketValue;
  const totalPnl = activePortfolio.totalUnrealizedPnl;
  const totalPnlPct = activePortfolio.totalInvested > 0 
    ? (totalPnl / activePortfolio.totalInvested) * 100 
    : 0;

  const formatCurrency = (val: number) => {
    const locale = selectedCurrency === 'USD' ? 'en-US' : 'id-ID';
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: selectedCurrency,
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="bg-gradient-to-b from-slate-800/40 to-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* NavTab for Currency Toggle */}
      <div className="flex justify-end mb-2 relative z-10">
        <div className="bg-black/30 p-1 rounded-lg flex border border-white/5">
          <button 
            onClick={() => setSelectedCurrency('USD')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              selectedCurrency === 'USD' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            USD
          </button>
          <button 
            onClick={() => setSelectedCurrency('IDR')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              selectedCurrency === 'IDR' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            IDR
          </button>
        </div>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-medium text-gray-400 flex items-center mb-1">
            <Wallet className="w-4 h-4 mr-2" />
            Total Asset Value
          </h2>
          <div className="text-3xl font-extrabold text-white">
            {formatCurrency(totalMarketValue)}
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className={`font-medium px-2 py-0.5 rounded mr-2 ${
              isProfit ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
            }`}>
              {isProfit ? '+' : ''}{totalPnlPct.toFixed(2)}%
            </span>
            <span className="text-gray-400">
              {isProfit ? '+' : ''}{formatCurrency(totalPnl)} Total Return
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-between">
        <div className="w-1/2 h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-1/2 pl-4 space-y-2 overflow-y-auto max-h-[140px] pr-2 hide-scrollbar">
          {pieData.slice(0, 5).map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-300 truncate max-w-[80px]">{item.name}</span>
              </div>
              {item.name !== 'No Assets' && (
                <span className="text-white font-medium text-xs ml-2">
                  {totalMarketValue > 0 ? Math.round((item.value / totalMarketValue) * 100) : 0}%
                </span>
              )}
            </div>
          ))}
          {pieData.length > 5 && (
            <div className="text-xs text-gray-500 italic mt-1">
              +{pieData.length - 5} lainnya
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
