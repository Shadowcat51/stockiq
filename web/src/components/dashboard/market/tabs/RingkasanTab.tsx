import React from 'react';
import TradingViewChart from '@/components/dashboard/market/TradingViewChart';
import { PosisiKamu } from '../PosisiKamu';
import { KeyStats } from '../KeyStats';
import { TechnicalSummary } from '../TechnicalSummary';

interface RingkasanTabProps {
  activeSymbol: string;
}

export function RingkasanTab({ activeSymbol }: RingkasanTabProps) {
  return (
    <div className="flex flex-col space-y-6">
      {/* Main Chart Area */}
      <div className="w-full h-[500px] bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
        <div className="flex-1 w-full h-full p-1 relative z-10">
          <TradingViewChart symbol={activeSymbol} theme="dark" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <PosisiKamu />
          <TechnicalSummary />
        </div>
        <div>
          <KeyStats />
        </div>
      </div>
    </div>
  );
}
