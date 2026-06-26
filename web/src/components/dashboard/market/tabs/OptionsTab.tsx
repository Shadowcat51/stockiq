import React, { useState, useMemo } from 'react';
import { useMarketStore } from '@/store/marketStore';
import { ArrowUp, ArrowDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionsTabProps {
  activeSymbol: string;
}

export function OptionsTab({ activeSymbol }: OptionsTabProps) {
  const latestData = useMarketStore(state => state.latestData);
  const stockStats = useMarketStore(state => state.stockStats);
  const stockTechnical = useMarketStore(state => state.stockTechnical);
  const currentPrice = latestData?.price || stockTechnical?.currentPrice || stockStats?.currentPrice || 0;
  const symbolName = activeSymbol.split(':')[1] || activeSymbol;

  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP');
  // strategy defines whether we are buying (LONG) or selling (SHORT) the contract
  const [strategyType, setStrategyType] = useState<'LONG' | 'SHORT'>('LONG');
  const [expirationIdx, setExpirationIdx] = useState(0);

  const expirations = ['<1 Week', '<1 Month', '1-3 Months', '3-6 Months'];

  // Calculate actual contract type based on direction and strategy
  const contractType = direction === 'UP' 
    ? (strategyType === 'LONG' ? 'Call' : 'Put') 
    : (strategyType === 'LONG' ? 'Put' : 'Call');

  // Generate mock option chains based on current price
  const optionChains = useMemo(() => {
    if (!currentPrice) return [];
    
    const chains = [];
    const interval = currentPrice > 1000 ? 50 : currentPrice > 100 ? 5 : currentPrice > 10 ? 1 : 0.5;
    const nearestStrike = Math.round(currentPrice / interval) * interval;

    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue; 
      const strike = nearestStrike + (i * interval);
      if (strike <= 0) continue;

      // Determine intrinsic value based on contract type
      let intrinsicValue = 0;
      if (contractType === 'Call') {
        intrinsicValue = Math.max(0, currentPrice - strike);
      } else { // Put
        intrinsicValue = Math.max(0, strike - currentPrice);
      }
      
      const distance = Math.abs(currentPrice - strike);
      const timeValue = Math.max(0, (currentPrice * 0.05) - (distance * 0.2)) * (expirationIdx + 1);
      const premium = intrinsicValue + timeValue + (Math.random() * (currentPrice * 0.005));

      // Breakeven logic
      // Long Call: Strike + Premium
      // Short Put: Strike - Premium
      // Long Put: Strike - Premium
      // Short Call: Strike + Premium
      let breakeven = 0;
      if (strategyType === 'LONG' && contractType === 'Call') breakeven = strike + premium;
      if (strategyType === 'SHORT' && contractType === 'Put') breakeven = strike - premium;
      if (strategyType === 'LONG' && contractType === 'Put') breakeven = strike - premium;
      if (strategyType === 'SHORT' && contractType === 'Call') breakeven = strike + premium;

      // Win rate mock
      const winRate = Math.max(1, 100 - (distance / currentPrice * 1000) - (intrinsicValue === 0 ? 50 : 0));
      const move1d = (Math.random() * 20 - 10) - (intrinsicValue === 0 ? 10 : 0);

      const isITM = contractType === 'Call' ? strike < currentPrice : strike > currentPrice;

      chains.push({
        strike,
        premium,
        breakeven,
        winRate: Math.max(0.1, Math.min(99.9, winRate)),
        move1d,
        isITM
      });
    }

    // Sort: 
    // Calls: Strikes from Low to High
    // Puts: Strikes from High to Low
    if (contractType === 'Call') {
      chains.sort((a, b) => a.strike - b.strike);
    } else {
      chains.sort((a, b) => b.strike - a.strike);
    }

    return chains;
  }, [currentPrice, direction, strategyType, expirationIdx]);

  const isId = activeSymbol?.includes('IDX:') || activeSymbol?.endsWith('.JK');
  const formatPrice = (val: number) => {
    return isId
      ? `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  if (!currentPrice) {
    return <div className="text-center py-10 text-gray-400 animate-pulse">Waiting for price data...</div>;
  }

  const itmOptions = optionChains.filter(o => o.isITM);
  const otmOptions = optionChains.filter(o => !o.isITM);

  // Helper for UI
  const handleDirectionChange = (newDir: 'UP' | 'DOWN') => {
    setDirection(newDir);
    setStrategyType('LONG'); // Reset to default Long when direction changes
  };

  const getExplanation = () => {
    if (strategyType === 'LONG' && contractType === 'Call') {
      return "Long Call gives you the right to buy the stock at the strike price. Often used if you expect the price to rise, with unlimited upside potential.";
    }
    if (strategyType === 'SHORT' && contractType === 'Put') {
      return "Short Put means you are obligated to buy the stock at the strike price if the buyer exercises it. Often used if you expect the price to rise or stay stable, to earn the premium.";
    }
    if (strategyType === 'LONG' && contractType === 'Put') {
      return "Long Put gives you the right to sell the stock at the strike price. Often used if you expect the price to fall, acting like insurance.";
    }
    if (strategyType === 'SHORT' && contractType === 'Call') {
      return "Short Call means you are obligated to sell the stock at the strike price. Often used if you expect the price to fall or stay stable, but carries unlimited risk.";
    }
    return "";
  };

  return (
    <div className="flex flex-col space-y-6 w-full">
      
      {/* Header Prediction Section */}
      <div className="bg-gray-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg text-center">
        <h2 className="text-lg text-gray-300 font-medium mb-6">
          Find Contracts<br/>
          I think {symbolName} will go <span className={direction === 'UP' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{direction === 'UP' ? 'up/neutral' : 'down/neutral'}</span>
        </h2>

        <div className="flex items-center justify-center gap-6 mb-8">
          <button 
            onClick={() => handleDirectionChange('UP')}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              direction === 'UP' 
                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-110" 
                : "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
            )}
          >
            <ArrowUp className="w-8 h-8" />
          </button>
          
          <button 
            onClick={() => handleDirectionChange('DOWN')}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all",
              direction === 'DOWN' 
                ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110" 
                : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
            )}
          >
            <ArrowDown className="w-8 h-8" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <button 
            onClick={() => setStrategyType('LONG')}
            className={cn(
              "px-4 py-2 rounded-full border text-sm font-medium transition-all",
              strategyType === 'LONG'
                ? "border-white/50 text-white bg-white/10"
                : "border-gray-800 text-gray-500 hover:text-gray-300"
            )}
          >
            Long {direction === 'UP' ? 'Call' : 'Put'}
          </button>
          <button 
            onClick={() => setStrategyType('SHORT')}
            className={cn(
              "px-4 py-2 rounded-full border text-sm font-medium transition-all",
              strategyType === 'SHORT'
                ? "border-white/50 text-white bg-white/10"
                : "border-gray-800 text-gray-500 hover:text-gray-300"
            )}
          >
            Short {direction === 'UP' ? 'Put' : 'Call'}
          </button>
        </div>

        <div className="text-left bg-black/40 p-4 rounded-xl border border-white/5 text-sm text-gray-400">
          <h4 className="text-white font-medium mb-1">
            {strategyType === 'LONG' ? 'Buy' : 'Sell'} {contractType} Contract
          </h4>
          <p>{getExplanation()}</p>
        </div>
      </div>

      {/* Date Expiration Selector */}
      <div className="flex overflow-x-auto gap-2 no-scrollbar px-1 py-2">
        {expirations.map((exp, idx) => (
          <button
            key={idx}
            onClick={() => setExpirationIdx(idx)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              expirationIdx === idx 
                ? "bg-white/10 text-white border-white/20" 
                : "bg-transparent text-gray-500 border-gray-800 hover:border-gray-600"
            )}
          >
            {exp}
          </button>
        ))}
      </div>

      <div className="text-sm text-gray-400 px-2 flex justify-between items-center">
        <span>Contracts with selected expiration dates</span>
        <span className="text-yellow-500 flex items-center gap-1"><Info className="w-4 h-4"/> Simulation Time</span>
      </div>

      {/* Option Chain List */}
      <div className="space-y-2">
        {/* ITM Options */}
        {itmOptions.map((opt, i) => (
          <OptionCard key={`itm-${i}`} option={opt} contractType={contractType} strategyType={strategyType} isId={isId} />
        ))}

        {/* Separator / Current Price */}
        <div className="flex items-center justify-between bg-gray-800/80 rounded-xl px-4 py-3 text-sm font-medium shadow-inner border border-white/5 my-4">
          <div className="text-emerald-400 flex items-center gap-1">
            <ArrowUp className="w-4 h-4" /> ITM
          </div>
          <div className="text-white">
            Stock Market Price: {formatPrice(currentPrice)}
          </div>
          <div className="text-red-400 flex items-center gap-1">
            OTM <ArrowDown className="w-4 h-4" />
          </div>
        </div>

        {/* OTM Options */}
        {otmOptions.map((opt, i) => (
          <OptionCard key={`otm-${i}`} option={opt} contractType={contractType} strategyType={strategyType} isId={isId} />
        ))}
      </div>
    </div>
  );
}

// Sub-component for individual Option Contract Card
function OptionCard({ option, contractType, strategyType, isId }: { option: any, contractType: string, strategyType: string, isId: boolean }) {
  const formatPrice = (val: number) => {
    return isId
      ? `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="bg-gray-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 hover:bg-gray-800/60 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            {formatPrice(option.strike)} {contractType}
          </h3>
          <div className="text-xs text-gray-500">
            Breakeven if<br/>
            <span className="text-gray-300 font-medium">
              {contractType === 'Call' ? '≥' : '≤'} {formatPrice(option.breakeven)}
            </span>
          </div>
        </div>
        
        <button className={cn(
          "font-bold px-4 py-2 rounded-xl transition-all",
          strategyType === 'LONG' 
            ? "bg-[#ccff00] hover:bg-[#b3e600] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)] group-hover:shadow-[0_0_20px_rgba(204,255,0,0.5)]" 
            : "bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        )}>
          {strategyType === 'LONG' ? '-' : '+'}{formatPrice(option.premium)}
        </button>
      </div>

      <div className="flex gap-8 text-xs">
        <div>
          <span className="text-gray-500 block mb-1">Win Rate</span>
          <span className="text-gray-300 font-medium">{option.winRate.toFixed(2)}%</span>
        </div>
        <div>
          <span className="text-gray-500 block mb-1">1D Move</span>
          <span className={cn("font-medium", option.move1d >= 0 ? "text-emerald-400" : "text-red-400")}>
            {option.move1d > 0 ? '+' : ''}{option.move1d.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
