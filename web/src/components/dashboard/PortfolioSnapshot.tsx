'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet } from 'lucide-react';

const data = [
  { name: 'Technology', value: 45000, color: '#6366f1' }, // Indigo
  { name: 'Financials', value: 25000, color: '#3b82f6' }, // Blue
  { name: 'Energy', value: 15000, color: '#10b981' }, // Emerald
  { name: 'Consumer', value: 10000, color: '#f59e0b' }, // Amber
  { name: 'Cash', value: 5000, color: '#64748b' }, // Slate
];

export function PortfolioSnapshot() {
  return (
    <div className="bg-gradient-to-b from-slate-800/40 to-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-medium text-gray-400 flex items-center mb-1">
            <Wallet className="w-4 h-4 mr-2" />
            Total Balance (Simulated)
          </h2>
          <div className="text-3xl font-extrabold text-white">
            $100,000.00
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded mr-2">+2.4%</span>
            <span className="text-gray-400">+$2,400.00 Today</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-between">
        <div className="w-1/2 h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-1/2 pl-4 space-y-2">
          {data.slice(0, 4).map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-300 truncate max-w-[80px]">{item.name}</span>
              </div>
              <span className="text-white font-medium">{Math.round((item.value / 100000) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
