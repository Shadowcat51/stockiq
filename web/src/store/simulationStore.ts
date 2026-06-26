import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';

// Use the trade API base URL
const TRADE_API_URL = process.env.NEXT_PUBLIC_TRADE_API_URL || 'http://localhost:4002/api';

// Types
export interface Portfolio {
  id: string;
  currency: 'USD' | 'IDR';
  cashBalance: number;
  totalInvested: number;
  totalMarketValue: number;
  totalValue: number;
  totalReturn: number;
  totalReturnPct: number;
  totalUnrealizedPnl: number;
  holdingsCount: number;
  holdings: Holding[];
  isBankrupt: boolean;
  bankruptcyTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  id: string;
  portfolio_id: string;
  symbol: string;
  exchange: string;
  quantity: number;
  average_cost: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  borrowed_amount?: string;
  accumulated_leverage_fee?: string;
}

export interface Order {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  exchange: string;
  order_type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number | null;
  stop_price: number | null;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
  filled_price: number | null;
  filled_at: string | null;
  fee: number;
  slippage: number;
  reject_reason: string | null;
  created_at: string;
  expires_at: string | null;
  currency: string;
}

export interface OrderInput {
  symbol: string;
  exchange: 'NYSE' | 'NASDAQ' | 'IDX';
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
}

interface SimulationState {
  portfolios: Portfolio[];
  orders: Order[];
  ordersTotal: number;
  isLoading: boolean;
  isOrderLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  selectedCurrency: 'USD' | 'IDR';

  // Actions
  setSelectedCurrency: (currency: 'USD' | 'IDR') => void;
  initPortfolio: () => Promise<void>;
  fetchPortfolio: (silent?: boolean) => Promise<void>;
  placeOrder: (input: OrderInput) => Promise<{ success: boolean; data?: any; error?: string }>;
  cancelOrder: (orderId: string) => Promise<void>;
  fetchOrders: (params?: Record<string, string>) => Promise<void>;
  resetBankruptcy: (currency: 'USD' | 'IDR') => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

// Create a trade-specific axios instance
import axios from 'axios';
import { useAuthStore } from './authStore';

const tradeApi = axios.create({
  baseURL: TRADE_API_URL,
  withCredentials: true,
});

// Add auth interceptor
tradeApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Add refresh interceptor
tradeApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const AUTH_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api';
        const res = await axios.post(`${AUTH_API}/auth/refresh-token`, {}, { withCredentials: true });
        const { accessToken, user } = res.data;
        useAuthStore.getState().setAuth(user, accessToken);
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return tradeApi(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const useSimulationStore = create<SimulationState>((set, get) => ({
  portfolios: [],
  orders: [],
  ordersTotal: 0,
  isLoading: false,
  isOrderLoading: false,
  isInitialized: false,
  error: null,
  selectedCurrency: 'USD',

  setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

  initPortfolio: async () => {
    set({ isLoading: true, error: null });
    try {
      await tradeApi.post('/simulation/portfolio/init');
      // After init, fetch the full portfolio data
      await get().fetchPortfolio();
      set({ isInitialized: true });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to initialize portfolio' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPortfolio: async (silent = false) => {
    if (!silent) set({ isLoading: true, error: null });
    try {
      const res = await tradeApi.get('/simulation/portfolio');
      set({ portfolios: res.data.portfolios, isInitialized: true });
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Portfolio not initialized yet
        set({ isInitialized: false });
      } else {
        if (!silent) set({ error: error.response?.data?.message || 'Failed to fetch portfolio' });
      }
    } finally {
      if (!silent) set({ isLoading: false });
    }
  },

  placeOrder: async (input) => {
    set({ isOrderLoading: true, error: null });
    try {
      const res = await tradeApi.post('/simulation/orders', input);
      // Refresh portfolio and orders after placing
      await get().fetchPortfolio();
      await get().fetchOrders();
      set({ isOrderLoading: false });
      return { success: true, data: res.data };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.rejectReason || 'Failed to place order';
      set({ isOrderLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },

  cancelOrder: async (orderId) => {
    try {
      await tradeApi.delete(`/simulation/orders/${orderId}`);
      await get().fetchOrders();
      await get().fetchPortfolio();
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to cancel order' });
    }
  },

  fetchOrders: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/simulation/orders?${queryString}` : '/simulation/orders';
      const res = await tradeApi.get(url);
      set({ orders: res.data.orders, ordersTotal: res.data.total });
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
    }
  },

  resetBankruptcy: async (currency) => {
    set({ isLoading: true, error: null });
    try {
      await tradeApi.post('/simulation/portfolio/reset', { currency });
      await get().fetchPortfolio();
      await get().fetchOrders();
      set({ isLoading: false });
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to reset bankruptcy';
      set({ error: errorMsg, isLoading: false });
      return { success: false, error: errorMsg };
    }
  },

  clearError: () => set({ error: null }),
}));
