import React, { useState } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { Info, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TeknikalTab() {
  const stockTechnical = useMarketStore(state => state.stockTechnical);
  const isFetchingData = useMarketStore(state => state.isFetchingData);
  const activeSymbol = useMarketStore(state => state.activeSymbol);
  const fetchStockTechnical = useMarketStore(state => state.fetchStockTechnical);
  
  const [timeframe, setTimeframe] = useState('1 D');
  const [activeMaTab, setActiveMaTab] = useState<'SMA' | 'EMA'>('SMA');
  const [openSections, setOpenSections] = useState({
    support: true,
    trend: true,
    oscillators: true
  });

  const handleTimeframeChange = (tf: string) => {
    setTimeframe(tf);
    let interval = '1d';
    if (tf === '5 Min') interval = '5m';
    else if (tf === '15 Min') interval = '15m';
    else if (tf === '1 H') interval = '1h';
    
    fetchStockTechnical(activeSymbol, interval);
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({...prev, [section]: !prev[section]}));
  };

  // Helpers
  const isId = activeSymbol?.includes('IDX:') || activeSymbol?.endsWith('.JK');
  const formatPrice = (val: number) => {
    if (val === undefined || val === null) return '-';
    return isId 
      ? `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (!stockTechnical || stockTechnical.error) {
    return (
      <div className="text-center py-10 text-gray-400">
        Waiting for technical data...
      </div>
    );
  }

  const { summary, pivotPoints, trendFollowing, oscillators } = stockTechnical;

  const renderSignalBadge = (signal: string) => {
    if (signal === 'Buy' || signal.includes('Bullish')) {
      return <span className="bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-bold w-16 text-center inline-block">{signal}</span>;
    }
    if (signal === 'Sell' || signal.includes('Bearish')) {
      return <span className="bg-red-400 text-black px-3 py-1 rounded-full text-xs font-bold w-16 text-center inline-block">{signal}</span>;
    }
    return <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-medium w-16 text-center inline-block">Neutral</span>;
  };

  return (
    <div className="flex flex-col space-y-6 w-full text-white pb-20 relative">
      {isFetchingData && (
        <div className="absolute inset-0 z-50 bg-gray-950/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      )}
      
      <h2 className="text-2xl font-bold">Technical Indicators</h2>

      {/* Timeframes */}
      <div className="flex space-x-4 border-b border-gray-800 pb-2">
        {['5 Min', '15 Min', '1 H', '1 D'].map((tf) => (
          <button 
            key={tf}
            onClick={() => handleTimeframeChange(tf)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              timeframe === tf ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Ringkasan Keseluruhan */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-lg">Overall Summary</h3>
          <Info className="w-4 h-4 text-gray-500" />
        </div>
        
        <div className="h-4 w-full rounded-full flex overflow-hidden">
          {summary.bearish > 0 && <div className="bg-red-400 h-full" style={{ width: `${(summary.bearish / (summary.bullish + summary.bearish + summary.neutral)) * 100}%` }} />}
          {summary.neutral > 0 && <div className="bg-gray-600 h-full" style={{ width: `${(summary.neutral / (summary.bullish + summary.bearish + summary.neutral)) * 100}%` }} />}
          {summary.bullish > 0 && <div className="bg-emerald-400 h-full" style={{ width: `${(summary.bullish / (summary.bullish + summary.bearish + summary.neutral)) * 100}%` }} />}
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-red-400 font-medium">Bearish ({summary.bearish})</span>
          <span className="text-gray-500">Neutral ({summary.neutral})</span>
          <span className="text-emerald-400 font-medium">Bullish ({summary.bullish})</span>
        </div>
      </div>

      <hr className="border-gray-800" />

      {/* Support and Resistance */}
      <div className="space-y-4">
        <button className="flex w-full justify-between items-center" onClick={() => toggleSection('support')}>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">Support and Resistance</h3>
            <Info className="w-4 h-4 text-gray-500" />
          </div>
          {openSections.support ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {openSections.support && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-300 w-12">R3</span><span className="text-emerald-400 font-mono">{formatPrice(pivotPoints.r3)}</span><div className="w-16"></div></div>
            <div className="flex justify-between"><span className="text-gray-300 w-12">R2</span><span className="text-emerald-400 font-mono">{formatPrice(pivotPoints.r2)}</span><div className="w-16"></div></div>
            <div className="flex justify-between"><span className="text-gray-300 w-12">R1</span><span className="text-emerald-400 font-mono">{formatPrice(pivotPoints.r1)}</span><div className="w-16"></div></div>
            <div className="flex justify-between"><span className="text-gray-300 w-12">P</span><span className="text-white font-mono">{formatPrice(pivotPoints.p)}</span><div className="w-16"></div></div>
            <div className="flex justify-between"><span className="text-gray-300 w-12">S1</span><span className="text-red-400 font-mono">{formatPrice(pivotPoints.s1)}</span><div className="w-16"></div></div>
            <div className="flex justify-between"><span className="text-gray-300 w-12">S2</span><span className="text-red-400 font-mono">{formatPrice(pivotPoints.s2)}</span><div className="w-16"></div></div>
            <div className="flex justify-between"><span className="text-gray-300 w-12">S3</span><span className="text-red-400 font-mono">{formatPrice(pivotPoints.s3)}</span><div className="w-16"></div></div>
          </div>
        )}
      </div>

      <hr className="border-gray-800" />

      {/* Trend Following */}
      <div className="space-y-4">
        <button className="flex w-full justify-between items-center" onClick={() => toggleSection('trend')}>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">Trend Following</h3>
            <Info className="w-4 h-4 text-gray-500" />
          </div>
          {openSections.trend ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {openSections.trend && (
          <>
            <div className="h-2 w-full rounded-full flex overflow-hidden">
              {trendFollowing.bearish > 0 && <div className="bg-red-400 h-full" style={{ width: `${(trendFollowing.bearish / (trendFollowing.bullish + trendFollowing.bearish)) * 100}%` }} />}
              {trendFollowing.bullish > 0 && <div className="bg-emerald-400 h-full" style={{ width: `${(trendFollowing.bullish / (trendFollowing.bullish + trendFollowing.bearish)) * 100}%` }} />}
            </div>
            
            <div className="flex justify-between text-xs mb-4">
              <span className="text-red-400 font-medium">Bearish ({trendFollowing.bearish})</span>
              <span className="text-gray-500">Neutral (0)</span>
              <span className="text-emerald-400 font-medium">Bullish ({trendFollowing.bullish})</span>
            </div>

            <div className="flex space-x-2 mb-4">
              <button 
                onClick={() => setActiveMaTab('SMA')}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium", activeMaTab === 'SMA' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
              >
                Simple MA
              </button>
              <button 
                onClick={() => setActiveMaTab('EMA')}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium", activeMaTab === 'EMA' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
              >
                Exponential MA
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {trendFollowing[activeMaTab.toLowerCase() as 'sma'|'ema'].map((ma: any) => (
                <div key={ma.period} className="flex justify-between items-center">
                  <span className="text-gray-300 w-24">{activeMaTab} ({ma.period})</span>
                  <span className="text-white font-mono">{formatPrice(ma.value)}</span>
                  {renderSignalBadge(ma.signal)}
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-300 w-32">Super Trend 10_3</span>
                <span className="text-white font-mono">{formatPrice(trendFollowing.superTrend.value)}</span>
                {renderSignalBadge(trendFollowing.superTrend.signal)}
              </div>
            </div>
          </>
        )}
      </div>

      <hr className="border-gray-800" />

      {/* Oscillators */}
      <div className="space-y-4">
        <button className="flex w-full justify-between items-center" onClick={() => toggleSection('oscillators')}>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">Oscillators</h3>
            <Info className="w-4 h-4 text-gray-500" />
          </div>
          {openSections.oscillators ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {openSections.oscillators && (
          <>
            <div className="h-2 w-full rounded-full flex overflow-hidden">
              {oscillators.bearish > 0 && <div className="bg-red-400 h-full" style={{ width: `${(oscillators.bearish / (oscillators.bullish + oscillators.bearish + oscillators.neutral)) * 100}%` }} />}
              {oscillators.neutral > 0 && <div className="bg-gray-600 h-full" style={{ width: `${(oscillators.neutral / (oscillators.bullish + oscillators.bearish + oscillators.neutral)) * 100}%` }} />}
              {oscillators.bullish > 0 && <div className="bg-emerald-400 h-full" style={{ width: `${(oscillators.bullish / (oscillators.bullish + oscillators.bearish + oscillators.neutral)) * 100}%` }} />}
            </div>
            
            <div className="flex justify-between text-xs mb-4">
              <span className="text-red-400 font-medium">Bearish ({oscillators.bearish})</span>
              <span className="text-gray-500">Neutral ({oscillators.neutral})</span>
              <span className="text-emerald-400 font-medium">Bullish ({oscillators.bullish})</span>
            </div>

            <div className="space-y-4 text-sm">
              {oscillators.items.map((osc: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-300 w-36">{osc.name}</span>
                  <span className="text-white font-mono">{formatPrice(osc.value)}</span>
                  {renderSignalBadge(osc.signal)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
