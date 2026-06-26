'use client';

import { useEffect, useState } from 'react';
import { useSimulationStore, Order } from '@/store/simulationStore';
import { Clock, XCircle, CheckCircle, AlertTriangle, Ban, Filter, X } from 'lucide-react';

function formatCurrency(value: number, currency: string): string {
  if (currency === 'IDR') {
    return `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  FILLED: {
    icon: <CheckCircle className="w-3.5 h-3.5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  PENDING: {
    icon: <Clock className="w-3.5 h-3.5" />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  CANCELLED: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
  },
  REJECTED: {
    icon: <Ban className="w-3.5 h-3.5" />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
  EXPIRED: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
  },
};

interface OrderHistoryProps {
  symbolFilter?: string;
}

export function OrderHistory({ symbolFilter }: OrderHistoryProps = {}) {
  const { orders, ordersTotal, fetchOrders, cancelOrder } = useSimulationStore();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (symbolFilter) {
      let rawSymbol = symbolFilter;
      if (rawSymbol.includes(':')) {
        rawSymbol = rawSymbol.split(':')[1];
      }
      if (rawSymbol.endsWith('.JK')) {
        rawSymbol = rawSymbol.replace('.JK', '');
      }
      params.symbol = rawSymbol;
    }
    fetchOrders(params).finally(() => setIsLoading(false));
  }, [fetchOrders, statusFilter, symbolFilter]);

  const handleCancel = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      await cancelOrder(orderId);
    }
  };

  const filters = ['', 'FILLED', 'PENDING', 'CANCELLED', 'REJECTED', 'EXPIRED'];

  return (
    <div className="bg-gradient-to-b from-slate-800/40 to-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
          <span>Order History</span>
          <span className="text-xs text-gray-500 font-normal">({ordersTotal})</span>
        </h3>

        {/* Status Filter */}
        <div className="flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-gray-500 mr-1" />
          {filters.map(f => (
            <button
              key={f || 'all'}
              onClick={() => setStatusFilter(f)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${statusFilter === f
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
            >
              {f || 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500 text-sm">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center">
          <Clock className="w-10 h-10 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No orders found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((order) => {
                const config = statusConfig[order.status] || statusConfig.PENDING;
                const currency = order.currency || 'USD';
                const displayPrice = order.filled_price || order.price || order.stop_price;

                return (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-white">{order.symbol}</span>
                      <span className="text-xs text-gray-600 ml-1">{order.exchange}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {order.order_type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${order.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                        {order.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {parseFloat(order.quantity as any).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {displayPrice ? formatCurrency(displayPrice, currency) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {order.fee > 0 ? formatCurrency(order.fee, currency) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-medium ${config.color} ${config.bg}`}>
                        {config.icon}
                        <span>{order.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      )}
                      {order.reject_reason && (
                        <span className="text-xs text-red-400/60" title={order.reject_reason}>
                          ⚠️
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
