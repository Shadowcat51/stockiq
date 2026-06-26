import React from 'react';
import { useMarketStore } from '@/store/marketStore';
import { ChevronUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TechnicalSummary() {
  const stockTechnical = useMarketStore(state => state.stockTechnical);
  const isFetchingData = useMarketStore(state => state.isFetchingData);

  if (isFetchingData && (!stockTechnical || stockTechnical.error)) {
    return <div className="animate-pulse bg-gray-900/50 h-40 rounded-2xl mb-6"></div>;
  }

  // Fallback if data is missing or old
  const summary = stockTechnical?.summary || { signal: 'Neutral', bullish: 0, bearish: 0, neutral: 1 };
  
  // Calculate segments for the new 3-color bar
  const total = Math.max(1, summary.bullish + summary.bearish + summary.neutral);
  const bearPct = (summary.bearish / total) * 100;
  const neutPct = (summary.neutral / total) * 100;
  const bullPct = (summary.bullish / total) * 100;

  const getSignalColor = (sig: string) => {
    if (sig.includes('Bullish')) return 'bg-emerald-500 text-black';
    if (sig.includes('Bearish')) return 'bg-red-400 text-black';
    return 'bg-gray-600 text-white';
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Technical Analysis</h3>
      </div>

      <div className="bg-black/40 rounded-xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-300 font-medium">Overall Summary</p>
            <p className="text-gray-500 text-xs mt-1">Daily (1D)</p>
          </div>
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className={cn("px-4 py-1.5 rounded-lg font-semibold text-sm", getSignalColor(summary.signal))}>
              {summary.signal}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          </div>
        </div>

        {/* Visual Indicator Bar */}
        <div className="flex h-3 mt-4 w-full rounded-full overflow-hidden">
          {summary.bearish > 0 && <div className="bg-red-400 h-full transition-all duration-300" style={{ width: `${bearPct}%` }} />}
          {summary.neutral > 0 && <div className="bg-gray-600 h-full transition-all duration-300" style={{ width: `${neutPct}%` }} />}
          {summary.bullish > 0 && <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${bullPct}%` }} />}
        </div>
        
        <div className="flex justify-between text-xs mt-2">
          <span className="text-red-400 font-medium">Bearish ({summary.bearish})</span>
          <span className="text-gray-500">Neutral ({summary.neutral})</span>
          <span className="text-emerald-400 font-medium">Bullish ({summary.bullish})</span>
        </div>
      </div>
    </div>
  );
}
