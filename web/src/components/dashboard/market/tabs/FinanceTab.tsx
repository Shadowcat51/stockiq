import React, { useState, useMemo, useEffect } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FinanceTab({ activeSymbol }: { activeSymbol: string }) {
  const stockFinance = useMarketStore(state => state.stockFinance);
  const isFetchingData = useMarketStore(state => state.isFetchingData);
  const fetchStockFinance = useMarketStore(state => state.fetchStockFinance);
  const isId = activeSymbol?.includes('IDX:') || activeSymbol?.endsWith('.JK');

  useEffect(() => {
    if (activeSymbol && !stockFinance) {
      fetchStockFinance(activeSymbol);
    }
  }, [activeSymbol, fetchStockFinance, stockFinance]);

  const [periodicity, setPeriodicity] = useState<'Quarterly' | 'Yearly'>('Quarterly');
  const [incPeriodIdx, setIncPeriodIdx] = useState<number>(-1);
  const [balPeriodIdx, setBalPeriodIdx] = useState<number>(-1);
  
  const [isIncOpen, setIsIncOpen] = useState(true);
  const [isBalOpen, setIsBalOpen] = useState(true);
  const [isCfOpen, setIsCfOpen] = useState(true);
  const [cfPeriodIdx, setCfPeriodIdx] = useState<number>(-1);

  // Parse Data
  const incData = useMemo(() => {
    if (!stockFinance) return [];
    const raw = periodicity === 'Yearly' ? stockFinance.yearly_income_stmt : stockFinance.quarterly_income_stmt;
    if (!raw) return [];
    
    return raw.map((d: any) => {
      const revenue = d['Total Revenue'] || d['Operating Revenue'] || 0;
      const netIncome = d['Net Income'] || d['Net Income Continuous Operations'] || 0;
      const profitMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
      
      return {
        ...d,
        displayPeriod: d.period, // e.g. "Mar 2026"
        shortPeriod: periodicity === 'Quarterly' ? `Q${Math.ceil(new Date(d.date).getMonth() / 3)} '${new Date(d.date).getFullYear().toString().slice(-2)}` : new Date(d.date).getFullYear().toString(),
        revenue,
        netIncome,
        profitMargin
      };
    }).slice(-5);
  }, [stockFinance, periodicity]);

  const balData = useMemo(() => {
    if (!stockFinance) return [];
    const raw = periodicity === 'Yearly' ? stockFinance.yearly_balance_sheet : stockFinance.quarterly_balance_sheet;
    if (!raw) return [];
    
    return raw.map((d: any) => {
      const assets = d['Total Assets'] || 0;
      const liabilities = d['Total Liabilities Net Minority Interest'] || d['Total Liabilities'] || 0;
      const debt = d['Total Debt'] || 0;
      const debtToAsset = assets > 0 ? (debt / assets) * 100 : 0;
      
      return {
        ...d,
        displayPeriod: d.period,
        shortPeriod: periodicity === 'Quarterly' ? `Q${Math.ceil(new Date(d.date).getMonth() / 3)} '${new Date(d.date).getFullYear().toString().slice(-2)}` : new Date(d.date).getFullYear().toString(),
        assets,
        liabilities,
        debtToAsset
      };
    }).slice(-5);
  }, [stockFinance, periodicity]);

  const cfData = useMemo(() => {
    if (!stockFinance) return [];
    const raw = periodicity === 'Yearly' ? stockFinance.yearly_cash_flow : stockFinance.quarterly_cash_flow;
    if (!raw) return [];
    
    return raw.map((d: any) => {
      const operating = d['Operating Cash Flow'] || d['Cash Flow From Continuing Operating Activities'] || 0;
      const investing = d['Investing Cash Flow'] || d['Cash Flow From Continuing Investing Activities'] || 0;
      const financing = d['Financing Cash Flow'] || d['Cash Flow From Continuing Financing Activities'] || 0;
      const exRate = d['Effect Of Exchange Rate Changes'] || 0;
      const netCF = d['Free Cash Flow'] || (operating + investing + financing + exRate) || 0;
      
      return {
        ...d,
        displayPeriod: d.period,
        shortPeriod: periodicity === 'Quarterly' ? `Q${Math.ceil(new Date(d.date).getMonth() / 3)} '${new Date(d.date).getFullYear().toString().slice(-2)}` : new Date(d.date).getFullYear().toString(),
        operating,
        investing,
        financing,
        exRate,
        netCF
      };
    }).slice(-5);
  }, [stockFinance, periodicity]);

  // Set default selected period to the latest (last element)
  useEffect(() => {
    if (incData.length > 0) setIncPeriodIdx(incData.length - 1);
  }, [incData]);

  useEffect(() => {
    if (balData.length > 0) setBalPeriodIdx(balData.length - 1);
  }, [balData]);

  useEffect(() => {
    if (cfData.length > 0) setCfPeriodIdx(cfData.length - 1);
  }, [cfData]);

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    
    const abs = Math.abs(val);
    let formatted = '';
    let suffix = '';
    
    if (abs >= 1e9) {
      formatted = (val / 1e9).toFixed(2);
      suffix = 'B';
    } else if (abs >= 1e6) {
      formatted = (val / 1e6).toFixed(2);
      suffix = 'M';
    } else if (abs >= 1e3) {
      formatted = (val / 1e3).toFixed(2);
      suffix = 'K';
    } else {
      formatted = val.toFixed(2);
    }
    
    // Replace . with , for Indonesian style or keep . for US
    const symbol = isId ? 'Rp' : '$';
    return `${symbol}${formatted}${suffix}`;
  };

  const formatPercent = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
  };

  const getChange = (data: any[], currentIdx: number, fieldName: string) => {
    const current = data[currentIdx]?.[fieldName];
    // Compare with the previous period (1 quarter ago or 1 year ago)
    const prevIdx = currentIdx - 1;
    const prev = data[prevIdx]?.[fieldName];
    
    if (current === undefined || current === null || prev === undefined || prev === null || prev === 0) return null;
    return ((current - prev) / Math.abs(prev)) * 100;
  };

  if (isFetchingData && (!stockFinance || Object.keys(stockFinance).length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
        <p>Loading financial data...</p>
      </div>
    );
  }

  if (!stockFinance || incData.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No financial data available for {activeSymbol}.
      </div>
    );
  }

  const renderChangeCell = (val: number | null) => {
    if (val === null) return <span className="text-gray-500">-</span>;
    return (
      <span className={cn(val >= 0 ? "text-emerald-400" : "text-red-400")}>
        {formatPercent(val)}
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-300">{entry.name}:</span>
              <span className="text-white font-medium">
                {entry.name.includes('%') ? `${entry.value.toFixed(2)}%` : formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col space-y-6 w-full text-white pb-20">
      {/* Periodicity Toggle */}
      <div className="flex bg-gray-900/50 p-1 rounded-xl w-fit border border-white/5">
        <button
          onClick={() => setPeriodicity('Quarterly')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-semibold transition-all",
            periodicity === 'Quarterly' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          )}
        >
          Quarterly
        </button>
        <button
          onClick={() => setPeriodicity('Yearly')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-semibold transition-all",
            periodicity === 'Yearly' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          )}
        >
          Yearly
        </button>
      </div>

      {/* Income Statement Section */}
      <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <button 
          className="flex w-full justify-between items-center mb-6"
          onClick={() => setIsIncOpen(!isIncOpen)}
        >
          <h2 className="text-2xl font-bold">Income Statement</h2>
          {isIncOpen ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
        </button>

        {isIncOpen && (
          <>
            {/* Chart Legend */}
            <div className="flex justify-center gap-6 mb-8 text-sm font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400" /> Net P&L</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white" /> Revenue</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Profit margin %</div>
            </div>

            {/* Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={incData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="shortPeriod" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(1)}%`} axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#fff" radius={[2, 2, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="netIncome" name="Net P&L" fill="#34d399" radius={[2, 2, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="profitMargin" name="Profit margin %" stroke="#eab308" strokeWidth={2} dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center gap-2 mt-8 overflow-x-auto pb-4 no-scrollbar">
              {incData.map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => setIncPeriodIdx(idx)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    incPeriodIdx === idx ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  {d.shortPeriod}
                </button>
              ))}
            </div>

            {/* Table */}
            {incPeriodIdx >= 0 && incData[incPeriodIdx] && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 mb-4 px-2">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-3 text-right">{incData[incPeriodIdx].displayPeriod}</div>
                  <div className="col-span-3 text-right">{periodicity === 'Quarterly' ? 'Q/Q Change' : 'Y/Y Change'}</div>
                </div>
                
                <div className="space-y-4 px-2 text-sm">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">Revenue</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(incData[incPeriodIdx].revenue)}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(incData, incPeriodIdx, 'Total Revenue') || getChange(incData, incPeriodIdx, 'Operating Revenue'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">COGS</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(incData[incPeriodIdx]['Cost Of Revenue'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(incData, incPeriodIdx, 'Cost Of Revenue'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-dashed border-gray-800">
                    <div className="col-span-6 font-bold text-white">Gross Profit</div>
                    <div className="col-span-3 text-right font-bold text-white">{formatCurrency(incData[incPeriodIdx]['Gross Profit'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(incData, incPeriodIdx, 'Gross Profit'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">SG&A</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(incData[incPeriodIdx]['Selling General And Administration'] || incData[incPeriodIdx]['General And Administrative Expense'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(incData, incPeriodIdx, 'Selling General And Administration') || getChange(incData, incPeriodIdx, 'General And Administrative Expense'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-dashed border-gray-800">
                    <div className="col-span-6 font-bold text-white">EBITDA</div>
                    <div className="col-span-3 text-right font-bold text-white">{formatCurrency(incData[incPeriodIdx]['Normalized EBITDA'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(incData, incPeriodIdx, 'Normalized EBITDA'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">D&A</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(incData[incPeriodIdx]['Reconciled Depreciation'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(incData, incPeriodIdx, 'Reconciled Depreciation'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">Interest</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(Math.abs(incData[incPeriodIdx]['Interest Expense Non Operating'] || 0))}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(incData, incPeriodIdx, 'Interest Expense Non Operating'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-dashed border-gray-800">
                    <div className="col-span-6 font-bold text-white">EBT</div>
                    <div className="col-span-3 text-right font-bold text-white">{formatCurrency(incData[incPeriodIdx]['Pretax Income'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(incData, incPeriodIdx, 'Pretax Income'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">Taxes</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(incData[incPeriodIdx]['Tax Provision'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(incData, incPeriodIdx, 'Tax Provision'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-gray-800">
                    <div className="col-span-6 font-bold text-white text-base">Net Income</div>
                    <div className="col-span-3 text-right font-bold text-white text-base">{formatCurrency(incData[incPeriodIdx].netIncome)}</div>
                    <div className="col-span-3 text-right font-bold">{renderChangeCell(getChange(incData, incPeriodIdx, 'Net Income') || getChange(incData, incPeriodIdx, 'Net Income Continuous Operations'))}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Balance Sheet Section */}
      <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <button 
          className="flex w-full justify-between items-center mb-6"
          onClick={() => setIsBalOpen(!isBalOpen)}
        >
          <h2 className="text-2xl font-bold">Balance Sheet</h2>
          {isBalOpen ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
        </button>

        {isBalOpen && (
          <>
            {/* Chart Legend */}
            <div className="flex justify-center gap-6 mb-8 text-sm font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400" /> Liabilities</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400" /> Assets</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Debt to asset %</div>
            </div>

            {/* Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={balData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="shortPeriod" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(1)}%`} axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="liabilities" name="Liabilities" fill="#f87171" radius={[2, 2, 0, 0]} barSize={20} />
                  <Bar yAxisId="left" dataKey="assets" name="Assets" fill="#34d399" radius={[2, 2, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="debtToAsset" name="Debt to asset %" stroke="#eab308" strokeWidth={2} dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center gap-2 mt-8 overflow-x-auto pb-4 no-scrollbar">
              {balData.map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => setBalPeriodIdx(idx)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    balPeriodIdx === idx ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  {d.shortPeriod}
                </button>
              ))}
            </div>

            {/* Table */}
            {balPeriodIdx >= 0 && balData[balPeriodIdx] && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 mb-4 px-2">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-3 text-right">{balData[balPeriodIdx].displayPeriod}</div>
                  <div className="col-span-3 text-right">{periodicity === 'Quarterly' ? 'Q/Q Change' : 'Y/Y Change'}</div>
                </div>
                
                <div className="space-y-4 px-2 text-sm">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">Cash</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(balData[balPeriodIdx]['Cash Cash Equivalents And Short Term Investments'] || balData[balPeriodIdx]['Cash And Cash Equivalents'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(balData, balPeriodIdx, 'Cash Cash Equivalents And Short Term Investments') || getChange(balData, balPeriodIdx, 'Cash And Cash Equivalents'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">Current Assets</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(balData[balPeriodIdx]['Current Assets'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(balData, balPeriodIdx, 'Current Assets'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">Non-current Assets</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(balData[balPeriodIdx]['Total Non Current Assets'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(balData, balPeriodIdx, 'Total Non Current Assets'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-dashed border-gray-800">
                    <div className="col-span-6 font-bold text-white text-base">Total Assets</div>
                    <div className="col-span-3 text-right font-bold text-white text-base">{formatCurrency(balData[balPeriodIdx].assets)}</div>
                    <div className="col-span-3 text-right font-bold">{renderChangeCell(getChange(balData, balPeriodIdx, 'Total Assets'))}</div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center mt-6">
                    <div className="col-span-6 text-gray-300">Current Liabilities</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(balData[balPeriodIdx]['Current Liabilities'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(balData, balPeriodIdx, 'Current Liabilities'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">Non-current Liabilities</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(balData[balPeriodIdx]['Total Non Current Liabilities Net Minority Interest'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(balData, balPeriodIdx, 'Total Non Current Liabilities Net Minority Interest'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-dashed border-gray-800">
                    <div className="col-span-6 font-bold text-white text-base">Total Liabilities</div>
                    <div className="col-span-3 text-right font-bold text-white text-base">{formatCurrency(balData[balPeriodIdx].liabilities)}</div>
                    <div className="col-span-3 text-right font-bold">{renderChangeCell(getChange(balData, balPeriodIdx, 'Total Liabilities Net Minority Interest') || getChange(balData, balPeriodIdx, 'Total Liabilities'))}</div>
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-center mt-6">
                    <div className="col-span-6 text-gray-300">Equity Capital</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(balData[balPeriodIdx]['Capital Stock'] || balData[balPeriodIdx]['Common Stock Equity'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(balData, balPeriodIdx, 'Capital Stock') || getChange(balData, balPeriodIdx, 'Common Stock Equity'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">Retained Earnings</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(balData[balPeriodIdx]['Retained Earnings'])}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(balData, balPeriodIdx, 'Retained Earnings'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-gray-800">
                    <div className="col-span-6 font-bold text-white text-base">Total Shareholder's Equity</div>
                    <div className="col-span-3 text-right font-bold text-white text-base">{formatCurrency(balData[balPeriodIdx]['Stockholders Equity'])}</div>
                    <div className="col-span-3 text-right font-bold">{renderChangeCell(getChange(balData, balPeriodIdx, 'Stockholders Equity'))}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cash Flow Section */}
      <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <button 
          className="flex w-full justify-between items-center mb-6"
          onClick={() => setIsCfOpen(!isCfOpen)}
        >
          <h2 className="text-2xl font-bold">Cash Flow</h2>
          {isCfOpen ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
        </button>

        {isCfOpen && (
          <>
            {/* Chart Legend */}
            <div className="flex justify-center gap-6 mb-8 text-sm font-medium flex-wrap">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white" /> Finance</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#38bdf8]" /> Investing</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1e3a8a]" /> Operating</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f59e0b]" /> Net CF</div>
            </div>

            {/* Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cfData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="shortPeriod" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="operating" stackId="a" name="Operating" fill="#1e3a8a" />
                  <Bar yAxisId="left" dataKey="investing" stackId="a" name="Investing" fill="#38bdf8" />
                  <Bar yAxisId="left" dataKey="financing" stackId="a" name="Finance" fill="#ffffff" />
                  <Line yAxisId="left" type="monotone" dataKey="netCF" name="Net CF" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center gap-2 mt-8 overflow-x-auto pb-4 no-scrollbar">
              {cfData.map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => setCfPeriodIdx(idx)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    cfPeriodIdx === idx ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  {d.shortPeriod}
                </button>
              ))}
            </div>

            {/* Table */}
            {cfPeriodIdx >= 0 && cfData[cfPeriodIdx] && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 mb-4 px-2">
                  <div className="col-span-6">Item</div>
                  <div className="col-span-3 text-right">{cfData[cfPeriodIdx].displayPeriod}</div>
                  <div className="col-span-3 text-right">{periodicity === 'Quarterly' ? 'Q/Q Change' : 'Y/Y Change'}</div>
                </div>
                
                <div className="space-y-4 px-2 text-sm">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">CF from Operations</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(cfData[cfPeriodIdx].operating)}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(cfData, cfPeriodIdx, 'Operating Cash Flow') || getChange(cfData, cfPeriodIdx, 'Cash Flow From Continuing Operating Activities'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">CF from Investing</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(cfData[cfPeriodIdx].investing)}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(cfData, cfPeriodIdx, 'Investing Cash Flow') || getChange(cfData, cfPeriodIdx, 'Cash Flow From Continuing Investing Activities'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">CF from Financing</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(cfData[cfPeriodIdx].financing)}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(cfData, cfPeriodIdx, 'Financing Cash Flow') || getChange(cfData, cfPeriodIdx, 'Cash Flow From Continuing Financing Activities'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6 text-gray-300">Effect of Exchange Rate</div>
                    <div className="col-span-3 text-right font-medium">{formatCurrency(cfData[cfPeriodIdx].exRate)}</div>
                    <div className="col-span-3 text-right">{renderChangeCell(getChange(cfData, cfPeriodIdx, 'Effect Of Exchange Rate Changes'))}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-gray-800">
                    <div className="col-span-6 font-bold text-white text-base">Net Cash Flow</div>
                    <div className="col-span-3 text-right font-bold text-white text-base">{formatCurrency(cfData[cfPeriodIdx].netCF)}</div>
                    <div className="col-span-3 text-right font-bold">{renderChangeCell(getChange(cfData, cfPeriodIdx, 'Free Cash Flow') || getChange(cfData, cfPeriodIdx, 'NetCF'))}</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
