'use client';

import { Bell, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

const alerts = [
  { id: 1, type: 'price', title: 'AAPL Price Target Reached', message: 'AAPL crossed above $175.00', time: '10m ago', isPositive: true },
  { id: 2, type: 'volume', title: 'BBCA Volume Spike', message: 'Trading volume 250% above average', time: '45m ago', isPositive: true },
  { id: 3, type: 'ai', title: 'TSLA AI Trend Reversal', message: 'Bearish divergence detected by AI model', time: '2h ago', isPositive: false },
  { id: 4, type: 'technical', title: 'GOTO Support Broken', message: 'Price broke below support level Rp 68', time: '3h ago', isPositive: false },
  { id: 5, type: 'news', title: 'NVDA Positive Sentiment', message: 'Strong positive news sentiment spike detected', time: '5h ago', isPositive: true },
];

export function RecentAlerts() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Bell className="w-5 h-5 mr-2 text-blue-400" />
          Recent Alerts
        </h2>
        <button className="text-sm text-blue-400 hover:text-blue-300">Settings</button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-start p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              alert.type === 'ai' ? 'bg-purple-500/20 text-purple-400' :
              alert.isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {alert.type === 'ai' ? <AlertTriangle className="w-4 h-4" /> : 
               alert.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">{alert.title}</h4>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{alert.message}</p>
            </div>
            <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
              {alert.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
