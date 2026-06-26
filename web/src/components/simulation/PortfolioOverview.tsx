'use client';

import { Wallet, TrendingUp, TrendingDown, DollarSign, Banknote } from 'lucide-react';
import { useSimulationStore, Portfolio } from '@/store/simulationStore';

function formatCurrency(value: number, currency: string): string {
  if (currency === 'IDR') {
    return `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  const isProfit = portfolio.totalReturn >= 0;
  const currencyIcon = portfolio.currency === 'USD'
    ? <DollarSign className="w-5 h-5" />
    : <Banknote className="w-5 h-5" />;

  return (
    <div className="bg-gradient-to-b from-slate-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300">
      {/* Decorative glow */}
      <div className={`absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-opacity duration-300 group-hover:opacity-80 ${
        isProfit ? 'bg-emerald-500/10' : 'bg-red-500/10'
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            portfolio.currency === 'USD'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-indigo-500/20 text-indigo-400'
          }`}>
            {currencyIcon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{portfolio.currency} Portfolio</h3>
            <p className="text-xs text-gray-500">
              {portfolio.currency === 'USD' ? 'US Market (NYSE/NASDAQ)' : 'Indonesia Market (IDX)'}
            </p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
          isProfit
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-red-500/10 text-red-400'
        }`}>
          {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isProfit ? '+' : ''}{portfolio.totalReturnPct.toFixed(2)}%</span>
        </div>
      </div>

      {/* Total Value */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-1">Total Value</p>
        <p className="text-2xl font-bold text-white">
          {formatCurrency(portfolio.totalValue, portfolio.currency)}
        </p>
        <p className={`text-sm mt-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}{formatCurrency(portfolio.totalReturn, portfolio.currency)} return
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Cash Balance</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(portfolio.cashBalance, portfolio.currency)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Invested</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(portfolio.totalInvested, portfolio.currency)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Market Value</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(portfolio.totalMarketValue, portfolio.currency)}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Unrealized P&L</p>
          <p className={`text-sm font-semibold ${portfolio.totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {portfolio.totalUnrealizedPnl >= 0 ? '+' : ''}{formatCurrency(portfolio.totalUnrealizedPnl, portfolio.currency)}
          </p>
        </div>
      </div>

      {/* Holdings count */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-gray-500">{portfolio.holdingsCount} stock{portfolio.holdingsCount !== 1 ? 's' : ''} held</span>
        <Wallet className="w-3.5 h-3.5 text-gray-600" />
      </div>
    </div>
  );
}

export function PortfolioOverview() {
  const { portfolios, selectedCurrency, setSelectedCurrency } = useSimulationStore();

  // Calculate combined totals
  const usdPortfolio = portfolios.find(p => p.currency === 'USD');
  const idrPortfolio = portfolios.find(p => p.currency === 'IDR');

  return (
    <div>
      {/* Currency Toggle */}
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={() => setSelectedCurrency('USD')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            selectedCurrency === 'USD'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
          }`}
        >
          🇺🇸 USD
        </button>
        <button
          onClick={() => setSelectedCurrency('IDR')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            selectedCurrency === 'IDR'
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
          }`}
        >
          🇮🇩 IDR
        </button>
      </div>

      {/* Portfolio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {usdPortfolio && <PortfolioCard portfolio={usdPortfolio} />}
        {idrPortfolio && <PortfolioCard portfolio={idrPortfolio} />}
      </div>
    </div>
  );
}
