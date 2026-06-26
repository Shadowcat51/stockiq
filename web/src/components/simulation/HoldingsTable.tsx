'use client';

import { useState } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { useSimulationStore, Holding } from '@/store/simulationStore';

function formatCurrency(value: number, currency: string): string {
  if (currency === 'IDR') {
    return `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type SortKey = 'symbol' | 'quantity' | 'average_cost' | 'currentPrice' | 'marketValue' | 'unrealizedPnl' | 'unrealizedPnlPct';

export function HoldingsTable() {
  const { portfolios, selectedCurrency } = useSimulationStore();
  const [sortKey, setSortKey] = useState<SortKey>('marketValue');
  const [sortAsc, setSortAsc] = useState(false);

  const portfolio = portfolios.find(p => p.currency === selectedCurrency);
  const holdings = portfolio?.holdings || [];

  const sortedHoldings = [...holdings].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <ArrowUpDown className={`w-3 h-3 ${sortKey === sortKeyName ? 'text-blue-400' : 'text-gray-600'}`} />
      </div>
    </th>
  );

  if (holdings.length === 0) {
    return (
      <div className="bg-gradient-to-b from-slate-800/40 to-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <div className="text-center">
          <ArrowRightLeft className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-gray-400 font-medium mb-1">No Holdings Yet</h3>
          <p className="text-gray-600 text-sm">
            Place your first {selectedCurrency === 'USD' ? 'US market' : 'IDX market'} order to start building your portfolio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-800/40 to-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
          <span>📊</span>
          <span>{selectedCurrency} Holdings</span>
          <span className="text-xs text-gray-500 font-normal ml-2">({holdings.length} stock{holdings.length !== 1 ? 's' : ''})</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/[0.02]">
            <tr>
              <SortHeader label="Symbol" sortKeyName="symbol" />
              <SortHeader label="Qty" sortKeyName="quantity" />
              <SortHeader label="Avg Cost" sortKeyName="average_cost" />
              <SortHeader label="Current" sortKeyName="currentPrice" />
              <SortHeader label="Market Value" sortKeyName="marketValue" />
              <SortHeader label="P&L" sortKeyName="unrealizedPnl" />
              <SortHeader label="P&L %" sortKeyName="unrealizedPnlPct" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedHoldings.map((holding) => {
              const isProfit = holding.unrealizedPnl >= 0;
              return (
                <tr key={holding.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                        {holding.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{holding.symbol}</p>
                        <p className="text-xs text-gray-500">{holding.exchange}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300 font-medium">
                    {holding.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatCurrency(holding.average_cost, selectedCurrency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {formatCurrency(holding.currentPrice, selectedCurrency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {formatCurrency(holding.marketValue, selectedCurrency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center space-x-1 text-sm font-medium ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isProfit ? '+' : ''}{formatCurrency(holding.unrealizedPnl, selectedCurrency)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${
                      isProfit
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {isProfit ? '+' : ''}{holding.unrealizedPnlPct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
