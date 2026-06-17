'use client';

import { useState, useEffect } from 'react';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { Star, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWatchlistStore } from '@/store/watchlistStore';

interface WatchlistStockData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isUp: boolean;
  data: { value: number }[];
}

export function WatchlistSummary() {
  const router = useRouter();
  const { watchlist } = useWatchlistStore();
  const [watchlistData, setWatchlistData] = useState<WatchlistStockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchWatchlist = async () => {
      if (watchlist.length === 0) {
        setWatchlistData([]);
        setIsLoading(false);
        return;
      }

      try {
        const symbols = watchlist.map(s => s.symbol).join(',');
        const res = await fetch(`/api/market/batch?symbols=${encodeURIComponent(symbols)}`);
        const data = await res.json();

        if (isMounted) {
          const newWatchlist = watchlist.map(stock => {
            const stockData = data[stock.symbol];
            if (!stockData) return null;

            const isUp = stockData.changePercent >= 0;
            const price = new Intl.NumberFormat(stock.isId ? 'id-ID' : 'en-US', {
              style: 'currency',
              currency: stock.isId ? 'IDR' : 'USD',
              maximumFractionDigits: stock.isId ? 0 : 2
            }).format(stockData.price);

            return {
              symbol: stock.symbol,
              name: stock.name,
              price: price,
              change: `${isUp ? '+' : ''}${stockData.changePercent.toFixed(2)}%`,
              isUp: isUp,
              data: stockData.sparkline ? stockData.sparkline.map((p: number) => ({ value: p })) : []
            };
          }).filter(Boolean) as WatchlistStockData[];

          if (newWatchlist.length > 0 || watchlist.length > 0) {
            setWatchlistData(newWatchlist);
          }
        }
      } catch (error) {
        console.error("Failed to fetch watchlist:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 30000); // 30s refresh

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [watchlist]);

  const handleStockClick = (symbol: string) => {
    // For Yahoo symbol format handling in TradingView
    let formatted = symbol;
    if (formatted.endsWith('.JK')) {
      formatted = `IDX:${formatted.replace('.JK', '')}`;
    }
    router.push(`/dashboard/market/${encodeURIComponent(formatted)}`);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-400 fill-yellow-400" />
          Watchlist
        </h2>
        <button onClick={() => router.push('/dashboard/market')} className="text-sm text-blue-400 hover:text-blue-300">Manage</button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3 text-center px-4">
            <Star className="w-10 h-10 text-gray-600" />
            <p className="text-sm text-gray-400">Watchlist kosong.</p>
            <p className="text-xs text-gray-500">Tandai bintang pada tabel Market Overview untuk menambahkan saham ke Watchlist Anda.</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-sm text-gray-500">Memuat Watchlist...</p>
          </div>
        ) : (
          watchlistData.map((stock) => (
            <div 
              key={stock.symbol} 
              onClick={() => handleStockClick(stock.symbol)}
              className="flex items-center justify-between group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-[30%]">
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                  {stock.symbol.replace('.JK', '')}
                </h4>
                <p className="text-xs text-gray-400 truncate">{stock.name}</p>
              </div>
              
              <div className="w-[30%] h-[30px]">
                {stock.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stock.data}>
                      <YAxis domain={['dataMin', 'dataMax']} hide />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={stock.isUp ? '#34d399' : '#f87171'} 
                        strokeWidth={2} 
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-gray-500 flex items-center justify-center h-full">No Data</div>
                )}
              </div>

              <div className="w-[30%] text-right">
                <p className="font-medium text-white">{stock.price}</p>
                <p className={`text-xs font-medium ${stock.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stock.change}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
