import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WatchlistStock {
  symbol: string;
  name: string;
  isId: boolean;
}

interface WatchlistState {
  watchlist: WatchlistStock[];
  toggleWatchlist: (stock: WatchlistStock) => void;
  isInWatchlist: (symbol: string) => boolean;
}

const DEFAULT_WATCHLIST: WatchlistStock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', isId: false },
  { symbol: 'NVDA', name: 'NVIDIA Corp', isId: false },
  { symbol: 'BBCA.JK', name: 'Bank Central Asia', isId: true },
  { symbol: 'TSLA', name: 'Tesla Inc.', isId: false },
  { symbol: 'GOTO.JK', name: 'GoTo Gojek Tokopedia', isId: true },
];

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlist: DEFAULT_WATCHLIST,
      toggleWatchlist: (stock) => {
        const current = get().watchlist;
        const exists = current.find(s => s.symbol === stock.symbol);
        if (exists) {
          set({ watchlist: current.filter(s => s.symbol !== stock.symbol) });
        } else {
          set({ watchlist: [...current, stock] });
        }
      },
      isInWatchlist: (symbol) => {
        return get().watchlist.some(s => s.symbol === symbol);
      }
    }),
    {
      name: 'stockiq-watchlist-storage', // name of the item in the storage (must be unique)
    }
  )
);
