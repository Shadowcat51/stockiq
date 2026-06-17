'use client';

import { ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MoverStock {
  symbol: string;
  name: string;
  price: string;
  changeValue: number;
  change: string;
}

// Pool of popular and high-volatility stocks to simulate Top Movers
const MOVER_POOL = [
  { symbol: 'SMCI', name: 'Super Micro Computer', isId: false },
  { symbol: 'MSTR', name: 'MicroStrategy Inc.', isId: false },
  { symbol: 'NVDA', name: 'NVIDIA Corp', isId: false },
  { symbol: 'TSLA', name: 'Tesla Inc.', isId: false },
  { symbol: 'COIN', name: 'Coinbase Global', isId: false },
  { symbol: 'AMMN.JK', name: 'Amman Mineral', isId: true },
  { symbol: 'BREN.JK', name: 'Barito Renewables', isId: true },
  { symbol: 'TLKM.JK', name: 'Telkom Indonesia', isId: true },
  { symbol: 'GOTO.JK', name: 'GoTo Gojek Tokopedia', isId: true },
  { symbol: 'PANI.JK', name: 'Pantai Indah Kapuk', isId: true },
];

export function TopMovers() {
  const router = useRouter();
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');
  const [gainers, setGainers] = useState<MoverStock[]>([]);
  const [losers, setLosers] = useState<MoverStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchMovers = async () => {
      try {
        const symbols = MOVER_POOL.map(s => s.symbol).join(',');
        const res = await fetch(`/api/market/batch?symbols=${encodeURIComponent(symbols)}`);
        const data = await res.json();

        if (isMounted) {
          const processed = MOVER_POOL.map(stock => {
            const stockData = data[stock.symbol];
            if (!stockData) return null;

            const price = new Intl.NumberFormat(stock.isId ? 'id-ID' : 'en-US', {
              style: 'currency',
              currency: stock.isId ? 'IDR' : 'USD',
              maximumFractionDigits: stock.isId ? 0 : 2
            }).format(stockData.price);

            return {
              symbol: stock.symbol,
              name: stock.name,
              price: price,
              changeValue: stockData.changePercent,
              change: `${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}%`
            };
          }).filter(Boolean) as MoverStock[];

          // Sort by percentage change
          const sortedByGain = [...processed].sort((a, b) => b.changeValue - a.changeValue);
          
          // Gainers: top positive changes
          setGainers(sortedByGain.filter(s => s.changeValue >= 0).slice(0, 4));
          
          // Losers: top negative changes (reverse sorted)
          setLosers([...processed].sort((a, b) => a.changeValue - b.changeValue).filter(s => s.changeValue < 0).slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch top movers:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMovers();
    const interval = setInterval(fetchMovers, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStockClick = (symbol: string) => {
    let formatted = symbol;
    if (formatted.endsWith('.JK')) {
      formatted = `IDX:${formatted.replace('.JK', '')}`;
    }
    router.push(`/dashboard/market/${encodeURIComponent(formatted)}`);
  };

  const displayData = tab === 'gainers' ? gainers : losers;

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Top Movers</h2>
        <div className="flex bg-black/20 rounded-lg p-1">
          <button 
            onClick={() => setTab('gainers')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${tab === 'gainers' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'}`}
          >
            Gainers
          </button>
          <button 
            onClick={() => setTab('losers')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${tab === 'losers' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}
          >
            Losers
          </button>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <p className="text-sm text-gray-500">Memuat data movers...</p>
          </div>
        ) : displayData.length > 0 ? (
          displayData.map((stock) => (
            <div 
              key={stock.symbol} 
              onClick={() => handleStockClick(stock.symbol)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div>
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                  {stock.symbol.replace('.JK', '')}
                </h4>
                <p className="text-xs text-gray-400 truncate w-32 md:w-48">{stock.name}</p>
              </div>
              <div className="text-right flex items-center">
                <div className="mr-3">
                  <p className="font-medium text-white">{stock.price}</p>
                </div>
                <div className={`flex items-center justify-center px-2 py-1 rounded text-xs font-bold w-20 ${
                  tab === 'gainers' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {tab === 'gainers' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stock.change}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-gray-500 mt-4">
            Tidak ada saham {tab === 'gainers' ? 'hijau' : 'merah'} di pool saat ini.
          </div>
        )}
      </div>
    </div>
  );
}
