'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Trash2, TrendingUp, TrendingDown, Percent, Settings2, BarChart2, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import axios from 'axios';

type RuleType = 'CROSS_ABOVE' | 'CROSS_BELOW' | 'GREATER_THAN' | 'LESS_THAN';
type Indicator = 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'PRICE' | 'VALUE';

interface Rule {
  id: string;
  type: RuleType;
  ind1: Indicator;
  param1: number;
  ind2: Indicator;
  param2: number;
  val: number;
}

const STOCK_API_URL = process.env.NEXT_PUBLIC_STOCK_API_URL || 'http://localhost:8000/api';

export default function BacktestPage() {
  const [symbol, setSymbol] = useState('AAPL');
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [initialCapital, setInitialCapital] = useState('10000');
  
  const [buyRules, setBuyRules] = useState<Rule[]>([
    { id: '1', type: 'CROSS_ABOVE', ind1: 'SMA', param1: 50, ind2: 'SMA', param2: 200, val: 0 }
  ]);
  const [sellRules, setSellRules] = useState<Rule[]>([
    { id: '2', type: 'GREATER_THAN', ind1: 'RSI', param1: 14, ind2: 'VALUE', param2: 0, val: 70 }
  ]);
  
  const [stopLoss, setStopLoss] = useState('5');
  const [takeProfit, setTakeProfit] = useState('15');
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const addRule = (isBuy: boolean) => {
    const newRule: Rule = { id: Date.now().toString(), type: 'GREATER_THAN', ind1: 'SMA', param1: 14, ind2: 'VALUE', param2: 0, val: 0 };
    if (isBuy) setBuyRules([...buyRules, newRule]);
    else setSellRules([...sellRules, newRule]);
  };

  const removeRule = (id: string, isBuy: boolean) => {
    if (isBuy) setBuyRules(buyRules.filter(r => r.id !== id));
    else setSellRules(sellRules.filter(r => r.id !== id));
  };

  const updateRule = (id: string, isBuy: boolean, field: keyof Rule, value: any) => {
    const updateFn = (rules: Rule[]) => rules.map(r => r.id === id ? { ...r, [field]: value } : r);
    if (isBuy) setBuyRules(updateFn(buyRules));
    else setSellRules(updateFn(sellRules));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!symbol.trim() || !isSearchOpen) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSearch(true);
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(symbol)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (error) {
        console.error("Failed to fetch search results", error);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [symbol, isSearchOpen]);

  const handleSelectSymbol = (tvSymbol: string) => {
    let yfSymbol = tvSymbol;
    if (tvSymbol.startsWith('IDX:')) yfSymbol = tvSymbol.replace('IDX:', '') + '.JK';
    else if (tvSymbol.startsWith('NASDAQ:')) yfSymbol = tvSymbol.replace('NASDAQ:', '');
    else if (tvSymbol.startsWith('NYSE:')) yfSymbol = tvSymbol.replace('NYSE:', '');
    else if (tvSymbol.startsWith('BINANCE:')) yfSymbol = tvSymbol.replace('BINANCE:', '') + '-USD';
    else if (tvSymbol.includes(':')) yfSymbol = tvSymbol.split(':')[1];
    
    setSymbol(yfSymbol);
    setIsSearchOpen(false);
  };

  const runBacktest = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const payload = {
        symbol,
        startDate,
        endDate,
        initialCapital: parseFloat(initialCapital),
        buyRules,
        sellRules,
        stopLossPct: parseFloat(stopLoss) || 0,
        takeProfitPct: parseFloat(takeProfit) || 0
      };
      
      const res = await axios.post(`${STOCK_API_URL}/market/backtest`, payload);
      if (res.data.error) {
        setError(res.data.error);
      } else {
        setResults(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to run backtest');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRuleBuilder = (rules: Rule[], isBuy: boolean) => (
    <div className="space-y-3">
      {rules.map((rule, idx) => (
        <div key={rule.id} className="flex flex-col gap-3 bg-gray-900/40 p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-md tracking-wider">RULE {idx + 1}</span>
            <button onClick={() => removeRule(rule.id, isBuy)} className="text-gray-500 hover:text-red-400 transition-colors p-1" title="Remove rule">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {/* Condition 1 */}
            <div className="flex items-center gap-2">
              <select value={rule.ind1} onChange={e => updateRule(rule.id, isBuy, 'ind1', e.target.value)} className="bg-gray-800 text-sm rounded-lg px-3 py-1.5 outline-none text-white border border-gray-700 focus:border-blue-500 transition-colors flex-1 cursor-pointer">
                <option value="SMA">SMA</option>
                <option value="EMA">EMA</option>
                <option value="RSI">RSI</option>
                <option value="PRICE">PRICE</option>
              </select>
              
              {rule.ind1 !== 'PRICE' && (
                <input type="number" value={rule.param1} onChange={e => updateRule(rule.id, isBuy, 'param1', parseInt(e.target.value))} className="bg-gray-800 w-20 text-center text-sm rounded-lg px-2 py-1.5 outline-none text-white border border-gray-700 focus:border-blue-500 transition-colors" placeholder="Len" />
              )}
            </div>
            
            {/* Operator */}
            <div className="flex items-center gap-2 pl-2">
              <div className="w-px h-6 bg-gray-700"></div>
              <select value={rule.type} onChange={e => updateRule(rule.id, isBuy, 'type', e.target.value)} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-blue-500/20 transition-colors">
                <option value="CROSS_ABOVE">Crosses Above ↗</option>
                <option value="CROSS_BELOW">Crosses Below ↘</option>
                <option value="GREATER_THAN">Is Greater Than &gt;</option>
                <option value="LESS_THAN">Is Less Than &lt;</option>
              </select>
            </div>
            
            {/* Condition 2 */}
            <div className="flex items-center gap-2">
              <select value={rule.ind2} onChange={e => updateRule(rule.id, isBuy, 'ind2', e.target.value)} className="bg-gray-800 text-sm rounded-lg px-3 py-1.5 outline-none text-white border border-gray-700 focus:border-blue-500 transition-colors flex-1 cursor-pointer">
                <option value="SMA">SMA</option>
                <option value="EMA">EMA</option>
                <option value="RSI">RSI</option>
                <option value="PRICE">PRICE</option>
                <option value="VALUE">Fixed Value</option>
              </select>
              
              {rule.ind2 !== 'PRICE' && rule.ind2 !== 'VALUE' && (
                <input type="number" value={rule.param2} onChange={e => updateRule(rule.id, isBuy, 'param2', parseInt(e.target.value))} className="bg-gray-800 w-20 text-center text-sm rounded-lg px-2 py-1.5 outline-none text-white border border-gray-700 focus:border-blue-500 transition-colors" placeholder="Len" />
              )}
              
              {rule.ind2 === 'VALUE' && (
                <input type="number" value={rule.val} onChange={e => updateRule(rule.id, isBuy, 'val', parseFloat(e.target.value))} className="bg-gray-800 w-24 text-center text-sm rounded-lg px-2 py-1.5 outline-none text-white border border-gray-700 focus:border-blue-500 transition-colors" placeholder="Value" />
              )}
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => addRule(isBuy)} className="w-full py-2 border border-dashed border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
        <Plus className="w-4 h-4" /> Add Rule
      </button>
    </div>
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-[#0a0e17] text-white overflow-hidden">
      
      {/* LEFT PANEL - STRATEGY BUILDER */}
      <div className="w-full md:w-[450px] shrink-0 border-r border-gray-800 flex flex-col h-full bg-[#0d131f] overflow-y-auto hide-scrollbar">
        <div className="p-6 border-b border-gray-800 sticky top-0 bg-[#0d131f]/90 backdrop-blur z-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-400" />
            Strategy Builder
          </h1>
          <p className="text-xs text-gray-400 mt-1">Design, test, and optimize algorithmic rules</p>
        </div>
        
        <div className="p-6 space-y-8">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 relative" ref={searchRef}>
                <label className="text-xs text-gray-400 font-medium flex items-center justify-between">
                  Symbol
                  <span className="text-[10px] text-gray-500 font-normal">Contoh: AAPL, BBCA.JK</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={symbol} 
                    onChange={e => {
                      setSymbol(e.target.value.toUpperCase());
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="AAPL" 
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors uppercase" 
                  />
                </div>
                
                {/* Search Dropdown */}
                {isSearchOpen && symbol.trim() !== '' && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="max-h-48 overflow-y-auto p-1 space-y-1">
                      {isLoadingSearch ? (
                        <div className="p-3 text-center text-gray-500 text-xs">Searching...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((stock, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectSymbol(stock.symbol)}
                            className="w-full flex flex-col p-2 rounded-lg hover:bg-gray-800 transition-colors text-left"
                          >
                            <div className="text-white font-bold text-sm">{stock.symbol.split(':')[1] || stock.symbol}</div>
                            <div className="text-[10px] text-gray-400 truncate w-full">{stock.name}</div>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500 text-xs">
                          No stocks found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium flex items-center justify-between" title="Uang virtual yang disediakan untuk dibelanjakan bot.">
                  Initial Capital ($)
                  <span className="text-[10px] text-gray-500 font-normal">Modal Awal Simulasi</span>
                </label>
                <input type="number" value={initialCapital} onChange={e => setInitialCapital(e.target.value)} placeholder="10000" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Buy Rules */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Entry Rules (BUY)
            </h3>
            {renderRuleBuilder(buyRules, true)}
          </div>

          {/* Sell Rules */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Exit Rules (SELL)
            </h3>
            {renderRuleBuilder(sellRules, false)}
          </div>

          {/* Risk Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <Percent className="w-4 h-4" /> Risk Management
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Take Profit (%)</label>
                <input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Stop Loss (%)</label>
                <input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 mt-auto border-t border-gray-800 sticky bottom-0 bg-[#0d131f]/90 backdrop-blur z-10">
          <button 
            onClick={runBacktest}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <><Play className="w-5 h-5 fill-current" /> Run Backtest</>
            )}
          </button>
          {error && <p className="text-red-400 text-xs text-center mt-3">{error}</p>}
        </div>
      </div>

      {/* RIGHT PANEL - RESULTS */}
      <div className="flex-1 overflow-y-auto bg-[#0a0e17] p-6 lg:p-10 space-y-8">
        
        {!results && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <BarChart2 className="w-24 h-24 text-gray-700" />
            <div>
              <h2 className="text-2xl font-bold text-gray-500">No Simulation Data</h2>
              <p className="text-gray-600">Configure your strategy on the left and run the backtest.</p>
            </div>
          </div>
        )}

        {isLoading && (
           <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
             <p className="text-blue-400 animate-pulse font-medium">Crunching historical data...</p>
           </div>
        )}

        {results && !isLoading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  {symbol[0]}
                </span>
                Backtest Results: {symbol}
              </h2>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Total Return</p>
                <h3 className={cn("text-2xl font-bold", results.metrics.totalReturnPct >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {results.metrics.totalReturnPct >= 0 ? '+' : ''}{results.metrics.totalReturnPct}%
                </h3>
                <p className="text-xs text-gray-500 mt-1">Final: {formatCurrency(results.metrics.finalCapital)}</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Win Rate</p>
                <h3 className="text-2xl font-bold text-white">{results.metrics.winRate}%</h3>
                <p className="text-xs text-gray-500 mt-1">Total Trades: {results.metrics.totalTrades}</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Max Drawdown</p>
                <h3 className="text-2xl font-bold text-red-400">{results.metrics.maxDrawdown}%</h3>
                <p className="text-xs text-gray-500 mt-1">Worst historical drop</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
                <p className="text-gray-400 text-sm mb-1">Total Trades</p>
                <h3 className="text-2xl font-bold text-white">{results.metrics.totalTrades}</h3>
                <p className="text-xs text-gray-500 mt-1">Completed Buy/Sell cycles</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 h-[400px]">
              <h3 className="text-sm font-semibold text-white mb-6">Equity Curve</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.equityCurve}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={12} tickMargin={10} minTickGap={30} />
                  <YAxis domain={['auto', 'auto']} stroke="#4b5563" fontSize={12} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                    itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                    labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                    formatter={(val: number) => [formatCurrency(val), 'Equity']}
                  />
                  <Line type="monotone" dataKey="equity" stroke="#3b82f6" strokeWidth={2} dot={false} fill="url(#colorEquity)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Trades Table */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-white">Trade History Log</h3>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto hide-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 bg-gray-800/50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Action</th>
                      <th className="px-6 py-3 font-medium">Price</th>
                      <th className="px-6 py-3 font-medium">PnL ($)</th>
                      <th className="px-6 py-3 font-medium">PnL (%)</th>
                      <th className="px-6 py-3 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {results.trades.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No trades executed with this strategy.</td>
                      </tr>
                    ) : (
                      results.trades.map((t: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-800/20 transition-colors">
                          <td className="px-6 py-3 text-gray-300">{t.date}</td>
                          <td className="px-6 py-3">
                            <span className={cn("px-2 py-1 rounded text-xs font-bold", t.type === 'BUY' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                              {t.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 tabular-nums">{formatCurrency(t.price)}</td>
                          <td className={cn("px-6 py-3 tabular-nums font-medium", t.pnl > 0 ? "text-emerald-400" : t.pnl < 0 ? "text-red-400" : "text-gray-500")}>
                            {t.pnl !== 0 ? (t.pnl > 0 ? '+' : '') + formatCurrency(t.pnl).replace('$-', '-$') : '-'}
                          </td>
                          <td className={cn("px-6 py-3 tabular-nums font-medium", t.pnlPct > 0 ? "text-emerald-400" : t.pnlPct < 0 ? "text-red-400" : "text-gray-500")}>
                            {t.pnlPct !== 0 ? (t.pnlPct > 0 ? '+' : '') + t.pnlPct + '%' : '-'}
                          </td>
                          <td className="px-6 py-3 text-gray-400 text-xs">
                            {t.reason === 'STRATEGY' ? 'Signal' : t.reason === 'TAKE_PROFIT' ? 'Take Profit' : t.reason === 'STOP_LOSS' ? 'Stop Loss' : t.reason}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
