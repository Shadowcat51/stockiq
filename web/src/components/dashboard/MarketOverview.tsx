'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { useRouter } from 'next/navigation';
import { useSimulationStore } from '@/store/simulationStore';

interface IndexData {
  name: string;
  symbol: string;
  value: string;
  change: string;
  isUp: boolean;
  data: { value: number }[];
}

const DEFAULT_INDICES = [
  { name: 'S&P 500', symbol: '^GSPC', format: 'en-US', currency: 'USD' },
  { name: 'NASDAQ', symbol: '^IXIC', format: 'en-US', currency: 'USD' },
  { name: 'IHSG', symbol: '^JKSE', format: 'id-ID', currency: 'IDR' },
];

export function MarketOverview() {
  const router = useRouter();
  const { portfolios, selectedCurrency, isInitialized, fetchPortfolio } = useSimulationStore();
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure portfolio is loaded
  useEffect(() => {
    if (!isInitialized) fetchPortfolio(true);
  }, [isInitialized, fetchPortfolio]);

  const activePortfolio = portfolios.find(p => p.currency === selectedCurrency);
  const holdings = activePortfolio?.holdings || [];

  useEffect(() => {
    let isMounted = true;

    const fetchIndices = async () => {
      try {
        let symbolsToFetch: string[] = [];
        let itemsMap: any[] = [];

        if (holdings.length > 0) {
          symbolsToFetch = holdings.map(h => h.symbol);
          itemsMap = holdings.map(h => ({
            name: h.symbol,
            symbol: h.symbol,
            format: selectedCurrency === 'USD' ? 'en-US' : 'id-ID',
            currency: selectedCurrency
          }));
        } else {
          symbolsToFetch = DEFAULT_INDICES.map(i => i.symbol);
          itemsMap = DEFAULT_INDICES;
        }

        const symbols = symbolsToFetch.join(',');
        if (!symbols) return; // safety check
        
        const res = await fetch(`/api/market/batch?symbols=${encodeURIComponent(symbols)}`);
        const data = await res.json();
        
        if (isMounted) {
          const formattedIndices = itemsMap.map(idx => {
            const stockData = data[idx.symbol];
            if (!stockData) return null;

            const price = stockData.price;
            const changePercent = stockData.changePercent;
            const isUp = changePercent >= 0;
            const sparklineData = stockData.sparkline ? stockData.sparkline.map((p: number) => ({ value: p })) : [];

            const formattedPrice = new Intl.NumberFormat(idx.format, { 
              style: 'currency', 
              currency: idx.currency,
              maximumFractionDigits: 2
            }).format(price).replace('US$', '$');

            return {
              name: idx.name,
              symbol: idx.symbol,
              value: formattedPrice,
              change: `${isUp ? '+' : ''}${changePercent.toFixed(2)}%`,
              isUp,
              data: sparklineData
            };
          }).filter(Boolean) as IndexData[];
          
          setIndices(formattedIndices);
        }
      } catch (error) {
        console.error("Failed to fetch market overview:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 60000); // refresh every minute

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [holdings.length, selectedCurrency]); // Re-run if holdings count or currency changes

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        <span className="ml-2 text-gray-400 text-sm">Loading market data...</span>
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar">
      {indices.map((idx) => (
        <div 
          key={idx.symbol} 
          onClick={() => router.push(`/dashboard/market/${encodeURIComponent(idx.symbol)}`)}
          className="min-w-[280px] md:min-w-[320px] flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium">{idx.name}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{idx.value}</h3>
            </div>
            <div className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
              idx.isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {idx.isUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {idx.change}
            </div>
          </div>
          
          <div className="h-[60px] w-full">
            {idx.data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={idx.data}>
                  <defs>
                    <linearGradient id={`color-${idx.symbol}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={idx.isUp ? '#34d399' : '#f87171'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={idx.isUp ? '#34d399' : '#f87171'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={idx.isUp ? '#34d399' : '#f87171'} 
                    fillOpacity={1} 
                    fill={`url(#color-${idx.symbol})`} 
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">No Chart Data</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
