import React, { useEffect, useMemo } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FundamentalTab({ activeSymbol, onNavigateToFinance }: { activeSymbol: string, onNavigateToFinance?: () => void }) {
  const fetchStockFundamental = useMarketStore(state => state.fetchStockFundamental);
  const fundamental = useMarketStore(state => state.stockFundamental);
  const isFetchingData = useMarketStore(state => state.isFetchingData);

  useEffect(() => {
    if (activeSymbol) {
      fetchStockFundamental(activeSymbol);
    }
  }, [activeSymbol, fetchStockFundamental]);

  const { analystRating, priceTarget, earnings, companySummary, keyRatios } = fundamental || {};

  // Earnings Min/Max for chart
  const minEps = useMemo(() => {
    if (!earnings || earnings.length === 0) return 0;
    let min = Infinity;
    earnings.forEach((e: any) => {
      if (e.actual !== null && e.actual < min) min = e.actual;
      if (e.estimate !== null && e.estimate < min) min = e.estimate;
    });
    return min === Infinity ? 0 : Math.floor(min * 10) / 10;
  }, [earnings]);

  const maxEps = useMemo(() => {
    if (!earnings || earnings.length === 0) return 0;
    let max = -Infinity;
    earnings.forEach((e: any) => {
      if (e.actual !== null && e.actual > max) max = e.actual;
      if (e.estimate !== null && e.estimate > max) max = e.estimate;
    });
    return max === -Infinity ? 0 : Math.ceil(max * 10) / 10;
  }, [earnings]);

  const epsRange = maxEps - minEps || 1;

  if (isFetchingData && !fundamental) {
    return (
      <div className="flex flex-col space-y-6 w-full text-white pb-20 animate-pulse">
        <div className="h-64 bg-gray-900/50 rounded-2xl w-full"></div>
        <div className="h-64 bg-gray-900/50 rounded-2xl w-full"></div>
        <div className="h-64 bg-gray-900/50 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!fundamental || fundamental.error) {
    return <div className="text-center py-10 text-gray-400">Gagal memuat data fundamental.</div>;
  }

  // --- Format Helpers ---
  const isId = activeSymbol?.includes('IDX:') || activeSymbol?.endsWith('.JK');
  const formatCurrency = (val: number, decimals: number = 2) => {
    if (val === 0 || !val) return '-';
    const prefix = isId ? 'Rp ' : '$';
    if (val >= 1e12) return `${prefix}${(val / 1e12).toFixed(decimals)}T`;
    if (val >= 1e9) return `${prefix}${(val / 1e9).toFixed(decimals)}B`;
    if (val >= 1e6) return `${prefix}${(val / 1e6).toFixed(decimals)}M`;
    return isId 
      ? `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(val);
  };

  const formatRatio = (val: number) => {
    if (val === 0 || !val) return '-';
    return val.toFixed(2);
  };

  const formatPercent = (val: number) => {
    if (val === 0 || !val) return '-';
    return `${val.toFixed(2)}%`;
  };

  // --- Calculations ---
  // Analyst Ratings
  const totalAnalysts = analystRating?.total || 1;
  const buyPct = (analystRating?.buy + analystRating?.strongBuy) / totalAnalysts * 100 || 0;
  const holdPct = analystRating?.hold / totalAnalysts * 100 || 0;
  const sellPct = (analystRating?.sell + analystRating?.strongSell) / totalAnalysts * 100 || 0;
  
  const circleCircumference = 2 * Math.PI * 36; // radius 36
  const buyStroke = (buyPct / 100) * circleCircumference;

  // Price Target
  const ptCurrent = priceTarget?.current || 0;
  const ptLow = priceTarget?.low || 0;
  const ptMean = priceTarget?.mean || 0;
  const ptHigh = priceTarget?.high || 0;
  
  let currentPct = 0;
  let meanPct = 0;
  if (ptHigh > ptLow) {
    currentPct = Math.max(0, Math.min(100, ((ptCurrent - ptLow) / (ptHigh - ptLow)) * 100));
    meanPct = Math.max(0, Math.min(100, ((ptMean - ptLow) / (ptHigh - ptLow)) * 100));
  }


  return (
    <div className="flex flex-col space-y-8 w-full text-white pb-20 relative">
      {/* 1. Penilaian Analis & Target Harga */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6 flex justify-between items-center">
          Analyst Rating
        </h2>
        
        <div className="text-sm text-gray-400 flex items-center gap-1 mb-6">
          Rating from {analystRating?.total} Analysts <Info className="w-4 h-4"/>
        </div>

        <div className="flex items-center gap-8 mb-10">
          {/* Circular Chart */}
          <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="transparent" stroke="#1f2937" strokeWidth="8" />
              <motion.circle 
                cx="40" cy="40" r="36" 
                fill="transparent" 
                stroke="#10b981" 
                strokeWidth="8" 
                strokeDasharray={`${buyStroke} ${circleCircumference}`}
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circleCircumference}` }}
                animate={{ strokeDasharray: `${buyStroke} ${circleCircumference}` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-emerald-400">{Math.round(buyPct)}%</span>
              <span className="text-xs text-gray-300 font-medium">Buy</span>
            </div>
          </div>

          {/* Bars */}
          <div className="flex-1 space-y-4 text-sm font-medium">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${buyPct}%` }} 
                  transition={{ duration: 1 }}
                  className="h-full bg-emerald-400 rounded-full"
                />
              </div>
              <div className="w-16 text-right text-gray-300">{analystRating?.buy + analystRating?.strongBuy} Buy</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${holdPct}%` }} 
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-gray-500 rounded-full"
                />
              </div>
              <div className="w-16 text-right text-gray-300">{analystRating?.hold} Hold</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${sellPct}%` }} 
                  transition={{ duration: 1, delay: 0.4 }}
                  className="h-full bg-red-400/50 rounded-full"
                />
              </div>
              <div className="w-16 text-right text-gray-300">{analystRating?.sell + analystRating?.strongSell} Sell</div>
            </div>
          </div>
        </div>

        {/* Target Harga Slider */}
        <div className="mt-8">
          <div className="text-lg font-bold mb-8 flex items-center gap-2">Price Target <Info className="w-4 h-4 text-gray-500"/></div>
          
          <div className="relative pt-10 pb-6 px-4">
            {/* Track */}
            <div className="h-3 w-full bg-gray-800 rounded-full relative">
              
              {/* Current Bubble & Dot */}
              <motion.div 
                initial={{ left: '0%', opacity: 0 }}
                animate={{ left: `${currentPct}%`, opacity: 1 }}
                transition={{ duration: 1.2, type: 'spring' }}
                className="absolute top-0 flex flex-col items-center -ml-4"
                style={{ zIndex: 10 }}
              >
                <div className="absolute -top-10 px-3 py-1 bg-[#4f46e5] text-white text-xs rounded-full whitespace-nowrap shadow-lg">
                  Current: {formatCurrency(ptCurrent)}
                </div>
                <div className="w-3 h-3 bg-[#4f46e5] rounded-full mt-[3px]"></div>
              </motion.div>

              {/* Target Bubble & Dot */}
              <motion.div 
                initial={{ left: '0%', opacity: 0 }}
                animate={{ left: `${meanPct}%`, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.3, type: 'spring' }}
                className="absolute top-0 flex flex-col items-center -ml-4"
              >
                <div className="absolute top-4 px-3 py-1 bg-[#ccff00] text-black text-xs font-bold rounded-full whitespace-nowrap shadow-lg">
                  Target: {formatCurrency(ptMean)}
                </div>
                <div className="w-3 h-3 bg-[#ccff00] rounded-full mt-[3px]"></div>
              </motion.div>

            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-10">
              <span>Low: {formatCurrency(ptLow)}</span>
              <span>High: {formatCurrency(ptHigh)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Earnings */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Earnings</h2>
        
        <div className="flex justify-between items-center text-sm font-medium text-gray-300 mb-8 px-4">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> Actual EPS</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-600"></div> Expected EPS</div>
        </div>

        {/* Animated Dot Plot */}
        <div className="relative h-56 w-full pl-12 pr-4 mt-8">
          {/* Grid lines & Y Axis */}
          <div className="absolute inset-y-0 left-12 right-4 flex flex-col justify-between pb-10">
            <div className="w-full border-t border-gray-800/80 relative">
              <span className="absolute -top-2.5 -left-12 text-xs text-gray-500 w-10 text-right">{maxEps.toFixed(2)}</span>
            </div>
            <div className="w-full border-t border-gray-800/80 relative">
              <span className="absolute -top-2.5 -left-12 text-xs text-gray-500 w-10 text-right">{((maxEps + minEps)/2).toFixed(2)}</span>
            </div>
            <div className="w-full border-t border-gray-800/80 relative">
              <span className="absolute -top-2.5 -left-12 text-xs text-gray-500 w-10 text-right">{minEps.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Dots & X-Axis */}
          <div className="absolute inset-y-0 left-12 right-4 flex justify-around items-end pb-10">
            {earnings?.map((e: any, idx: number) => {
              const actualPct = e.actual !== null ? ((e.actual - minEps) / epsRange) * 100 : null;
              const estPct = e.estimate !== null ? ((e.estimate - minEps) / epsRange) * 100 : null;

              return (
                <div key={idx} className="relative h-full flex flex-col justify-end items-center group w-12">
                  {/* Expected Dot */}
                  {estPct !== null && (
                    <motion.div 
                      initial={{ bottom: '0%', opacity: 0, scale: 0 }}
                      animate={{ bottom: `${estPct}%`, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5, delay: idx * 0.1 }}
                      className="absolute w-5 h-5 bg-gray-600 rounded-full z-10 hover:ring-4 ring-white/20 transition-all -mb-2.5"
                      title={`Expected: ${e.estimate}`}
                    />
                  )}

                  {/* Actual Dot */}
                  {actualPct !== null && (
                    <motion.div 
                      initial={{ bottom: '0%', opacity: 0, scale: 0 }}
                      animate={{ bottom: `${actualPct}%`, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5, delay: 0.2 + (idx * 0.1) }}
                      className="absolute w-6 h-6 bg-emerald-400 rounded-full z-20 shadow-[0_0_15px_rgba(52,211,153,0.5)] hover:ring-4 ring-emerald-400/30 transition-all -mb-3"
                      title={`Actual: ${e.actual}`}
                    />
                  )}

                  {/* Label X-Axis */}
                  <div className="absolute -bottom-8 text-xs text-gray-500 whitespace-nowrap text-center">
                    {e.period}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div 
          className="mt-12 text-center text-[#ccff00] text-sm hover:underline cursor-pointer"
          onClick={onNavigateToFinance}
        >
          View previous reports
        </div>
      </div>

      {/* 3. Ringkasan Perusahaan */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Company Summary</h2>
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400 border-b border-dashed border-gray-600">Revenue</span>
            <span className="font-medium text-white">{formatCurrency(companySummary?.revenue)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400 border-b border-dashed border-gray-600">Gross Profit</span>
            <span className="font-medium text-white">{formatCurrency(companySummary?.grossProfit)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400 border-b border-dashed border-gray-600">Net Income</span>
            <span className="font-medium text-white">{formatCurrency(companySummary?.netIncome)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400 border-b border-dashed border-gray-600">EPS</span>
            <span className="font-medium text-white">{formatRatio(companySummary?.eps)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400 border-b border-dashed border-gray-600">EBITDA</span>
            <span className="font-medium text-white">{formatCurrency(companySummary?.ebitda)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-800 pb-2">
            <span className="text-gray-400 border-b border-dashed border-gray-600">Adjusted EPS</span>
            <span className="font-medium text-white">{formatRatio(companySummary?.adjustedEps)}</span>
          </div>
        </div>
      </div>

      {/* 4. Key Ratios */}
      <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 space-y-8">
        <h2 className="text-xl font-bold">Key Ratios</h2>
        
        {/* Valuation */}
        <div>
          <h3 className="text-md font-bold text-gray-300 mb-4">Valuation</h3>
          <div className="grid grid-cols-1 gap-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Price-to-Earnings (P/E)</span>
              <span className="font-medium text-white">{formatRatio(keyRatios?.valuation?.pe)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Price-to-Sales (P/S)</span>
              <span className="font-medium text-white">{formatRatio(keyRatios?.valuation?.ps)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Price-to-Book (P/B)</span>
              <span className="font-medium text-white">{formatRatio(keyRatios?.valuation?.pb)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Enterprise Value-to-EBITDA (EV/EBITDA)</span>
              <span className="font-medium text-white">{formatRatio(keyRatios?.valuation?.evEbitda)}</span>
            </div>
          </div>
        </div>

        {/* Profitability */}
        <div>
          <h3 className="text-md font-bold text-gray-300 mb-4">Profitability</h3>
          <div className="grid grid-cols-1 gap-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Gross Profit Margin</span>
              <span className="font-medium text-white">{formatPercent(keyRatios?.profitability?.grossMargin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Net Profit Margin</span>
              <span className="font-medium text-white">{formatPercent(keyRatios?.profitability?.netMargin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Return on Equity (ROE)</span>
              <span className="font-medium text-white">{formatPercent(keyRatios?.profitability?.roe)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Return on Assets (ROA)</span>
              <span className="font-medium text-white">{formatPercent(keyRatios?.profitability?.roa)}</span>
            </div>
          </div>
        </div>

        {/* Dividend */}
        <div>
          <h3 className="text-md font-bold text-gray-300 mb-4">Dividend</h3>
          <div className="grid grid-cols-1 gap-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Dividend Yield (TTM)</span>
              <span className="font-medium text-white">{formatPercent(keyRatios?.dividend?.yield)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Payout Ratio</span>
              <span className="font-medium text-white">{formatRatio(keyRatios?.dividend?.payoutRatio)}</span>
            </div>
          </div>
        </div>

        {/* Liquidity Ratios */}
        <div>
          <h3 className="text-md font-bold text-gray-300 mb-4">Liquidity Ratios</h3>
          <div className="grid grid-cols-1 gap-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Current Ratio</span>
              <span className="font-medium text-white">{formatRatio(keyRatios?.liquidity?.currentRatio)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Quick Ratio</span>
              <span className="font-medium text-white">{formatRatio(keyRatios?.liquidity?.quickRatio)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Inventory Turnover (IT)</span>
              <span className="font-medium text-white">{formatPercent(keyRatios?.liquidity?.investorTurnover)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Receivables Turnover (RT)</span>
              <span className="font-medium text-white">{formatPercent(keyRatios?.liquidity?.receivablesTurnover)}</span>
            </div>
          </div>
        </div>

        {/* Solvency Ratios */}
        <div>
          <h3 className="text-md font-bold text-gray-300 mb-4">Solvency Ratios</h3>
          <div className="grid grid-cols-1 gap-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Interest Coverage Ratio (ICR)</span>
              <span className="font-medium text-white">{formatPercent(keyRatios?.solvency?.interestCoverage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Debt-to-Assets (D/A)</span>
              <span className="font-medium text-white">{formatRatio(keyRatios?.solvency?.debtToAssets)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 border-b border-dashed border-gray-600">Debt-to-Equity (D/E)</span>
              <span className="font-medium text-white">{formatRatio(keyRatios?.solvency?.debtToEquity)}</span>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
