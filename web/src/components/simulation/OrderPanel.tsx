'use client';

import { useState } from 'react';
import { useSimulationStore, OrderInput } from '@/store/simulationStore';
import { ArrowDownCircle, ArrowUpCircle, AlertCircle, Loader2, Info } from 'lucide-react';

const POPULAR_US_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'NFLX'];
const POPULAR_IDX_STOCKS = ['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'UNVR', 'HMSP', 'GGRM', 'BBNI', 'ICBP'];

type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
type Side = 'BUY' | 'SELL';

interface OrderPanelProps {
  initialSymbol?: string;
}

export function OrderPanel({ initialSymbol = '' }: OrderPanelProps) {
  const { placeOrder, isOrderLoading, portfolios, selectedCurrency, error, clearError } = useSimulationStore();

  const [side, setSide] = useState<Side>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  // Strip exchange prefix if present (e.g. NASDAQ:AAPL -> AAPL)
  const normalizedInitialSymbol = initialSymbol.split(':').pop() || initialSymbol;
  const [symbol, setSymbol] = useState(normalizedInitialSymbol);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');

  const portfolio = portfolios.find(p => p.currency === selectedCurrency);
  const exchange = selectedCurrency === 'USD' ? 'NASDAQ' : 'IDX';
  const suggestions = selectedCurrency === 'USD' ? POPULAR_US_STOCKS : POPULAR_IDX_STOCKS;

  const filteredSuggestions = symbol
    ? suggestions.filter(s => s.startsWith(symbol.toUpperCase()))
    : suggestions;

  const estimatedCost = (() => {
    const qty = parseInt(quantity, 10) || 0;
    const p = orderType === 'LIMIT' ? parseFloat(price) || 0 : 0;
    if (qty <= 0) return 0;
    // For market orders, we don't know the exact price yet
    if (orderType === 'MARKET') return 0;
    const total = p * qty;
    const fee = total * 0.001;
    return total + fee;
  })();

  const formatBalance = (val: number) => {
    if (selectedCurrency === 'IDR') return `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setLocalSuccess('');
    clearError();

    if (!symbol.trim()) {
      setLocalError('Symbol is required');
      return;
    }
    if (!quantity || parseInt(quantity, 10) <= 0) {
      setLocalError('Quantity must be greater than 0');
      return;
    }
    if (orderType === 'LIMIT' && (!price || parseFloat(price) <= 0)) {
      setLocalError('Price is required for Limit orders');
      return;
    }
    if ((orderType === 'STOP_LOSS' || orderType === 'TAKE_PROFIT') && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      setLocalError('Stop price is required');
      return;
    }

    const input: OrderInput = {
      symbol: symbol.toUpperCase().trim(),
      exchange: exchange as 'NYSE' | 'NASDAQ' | 'IDX',
      side,
      orderType,
      quantity: parseInt(quantity, 10),
      ...(orderType === 'LIMIT' && price ? { price: parseFloat(price) } : {}),
      ...((orderType === 'STOP_LOSS' || orderType === 'TAKE_PROFIT') && stopPrice ? { stopPrice: parseFloat(stopPrice) } : {}),
    };

    const result = await placeOrder(input);

    if (result.success) {
      const statusMsg = result.data?.status === 'FILLED'
        ? `Order FILLED at ${formatBalance(result.data.filledPrice)} (Fee: ${formatBalance(result.data.fee)})`
        : `Order placed as ${result.data?.status}`;
      setLocalSuccess(statusMsg);
      // Reset form
      setSymbol('');
      setQuantity('');
      setPrice('');
      setStopPrice('');
    } else {
      setLocalError(result.error || 'Order failed');
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white">Place Order</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* BUY / SELL Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setSide('BUY'); setOrderType('MARKET'); }}
            className={`flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
              side === 'BUY'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>BUY</span>
          </button>
          <button
            type="button"
            onClick={() => { setSide('SELL'); setOrderType('MARKET'); }}
            className={`flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
              side === 'SELL'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>SELL</span>
          </button>
        </div>

        {/* Order Type */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Order Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['MARKET', 'LIMIT', ...(side === 'SELL' ? ['STOP_LOSS', 'TAKE_PROFIT'] as const : [])] as OrderType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  orderType === type
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol Input */}
        <div className="relative">
          <label className="text-xs text-gray-500 mb-1.5 block">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => { setSymbol(e.target.value.toUpperCase()); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={selectedCurrency === 'USD' ? 'e.g. AAPL, MSFT' : 'e.g. BBCA, BBRI'}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/10 rounded-xl shadow-xl max-h-40 overflow-y-auto">
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => { setSymbol(s); setShowSuggestions(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Quantity (shares)</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            min="1"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Conditional Price Fields */}
        {orderType === 'LIMIT' && (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              Limit Price ({selectedCurrency})
            </label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
        )}

        {(orderType === 'STOP_LOSS' || orderType === 'TAKE_PROFIT') && (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              {orderType === 'STOP_LOSS' ? 'Stop Price' : 'Take Profit Price'} ({selectedCurrency})
            </label>
            <input
              type="number"
              step="0.01"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white/[0.03] rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Available Balance</span>
            <span className="text-white font-medium">
              {portfolio ? formatBalance(portfolio.cashBalance) : '—'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Fee Rate</span>
            <span className="text-gray-400">0.1%</span>
          </div>
          {orderType === 'MARKET' && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Slippage</span>
              <span className="text-gray-400">~0.05%</span>
            </div>
          )}
          {estimatedCost > 0 && (
            <div className="flex justify-between text-xs pt-1.5 border-t border-white/5">
              <span className="text-gray-400">Est. Total</span>
              <span className="text-white font-medium">{formatBalance(estimatedCost)}</span>
            </div>
          )}
        </div>

        {/* Info for STOP_LOSS / TAKE_PROFIT */}
        {(orderType === 'STOP_LOSS' || orderType === 'TAKE_PROFIT') && (
          <div className="flex items-start space-x-2 text-xs text-blue-400/70 bg-blue-500/5 rounded-lg p-2.5">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              {orderType === 'STOP_LOSS'
                ? 'Triggers a SELL when price drops to or below your stop price.'
                : 'Triggers a SELL when price rises to or above your target price.'}
              {' '}Order expires in 30 days.
            </span>
          </div>
        )}

        {/* Error / Success Messages */}
        {(localError || error) && (
          <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 rounded-xl p-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{localError || error}</span>
          </div>
        )}
        {localSuccess && (
          <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 rounded-xl p-3 text-xs">
            <ArrowDownCircle className="w-4 h-4 shrink-0" />
            <span>{localSuccess}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isOrderLoading}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
            side === 'BUY'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 disabled:bg-emerald-500/50'
              : 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 disabled:bg-red-500/50'
          } disabled:cursor-not-allowed`}
        >
          {isOrderLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>{side} {symbol || 'Stock'}</span>
          )}
        </button>
      </form>
    </div>
  );
}
