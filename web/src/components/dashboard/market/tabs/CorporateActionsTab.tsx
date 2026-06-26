import React from 'react';
import { useMarketStore } from '@/store/marketStore';
import { Info, Percent, SplitSquareHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CorporateActionsTabProps {
  activeSymbol: string;
}

export function CorporateActionsTab({ activeSymbol }: CorporateActionsTabProps) {
  const stockActions = useMarketStore(state => state.stockActions);
  
  if (!stockActions) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (stockActions.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No corporate actions history available for {activeSymbol}.
      </div>
    );
  }

  const isId = activeSymbol.includes('IDX:') || activeSymbol.endsWith('.JK');

  const formatCurrency = (val: number) => {
    if (isId) {
      return `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, " '");
  };

  return (
    <div className="flex flex-col space-y-6 w-full pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">History</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stockActions.map((action, idx) => {
          const isDividend = action.dividends > 0;
          const isSplit = action.splits > 0;
          
          return (
            <div key={`${action.date}-${idx}`} className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">
                      {isDividend ? 'Cash Dividend' : 'Stock Split'}
                    </h3>
                    <Info className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="text-white text-base">
                    {isDividend 
                      ? `${formatCurrency(action.dividends)} per share`
                      : `1 → ${action.splits}`}
                  </div>
                </div>
                <div className="text-gray-400">
                  {isDividend ? (
                    <Percent className="w-6 h-6" />
                  ) : (
                    <SplitSquareHorizontal className="w-6 h-6" />
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[15px]">
                  <span className="text-gray-400">Ex Date</span>
                  <span className="text-gray-200 font-medium">{formatDate(action.date)}</span>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
}
