'use client';

import { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Tooltip as BarTooltip
} from 'recharts';
import { useSimulationStore, Portfolio, Holding } from '@/store/simulationStore';
function formatCurrency(value: number, currency: string): string {
  if (currency === 'IDR') {
    return `Rp ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

export function PortfolioCharts({ portfolio }: { portfolio: Portfolio }) {
  const { selectedCurrency } = useSimulationStore();

  const allocationData = useMemo(() => {
    if (!portfolio) return [];
    
    const data = [];
    // Add Cash
    if (portfolio.cashBalance > 0) {
      data.push({
        name: 'Cash',
        value: portfolio.cashBalance,
      });
    }

    // Add Holdings
    portfolio.holdings?.forEach((holding: Holding) => {
      if (holding.marketValue > 0) {
        data.push({
          name: holding.symbol,
          value: holding.marketValue,
        });
      }
    });

    return data.sort((a, b) => b.value - a.value);
  }, [portfolio]);

  const pnlData = useMemo(() => {
    if (!portfolio?.holdings) return [];
    return portfolio.holdings.map((h: Holding) => ({
      name: h.symbol,
      pnl: h.unrealizedPnl,
      pnlPct: h.unrealizedPnlPct
    })).sort((a, b) => b.pnl - a.pnl);
  }, [portfolio]);

  if (!portfolio || (!portfolio.holdings?.length && portfolio.cashBalance <= 0)) {
    return null;
  }

  // Custom Tooltips
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111827] border border-gray-800 p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{payload[0].name}</p>
          <p className="text-blue-400 font-semibold">
            {formatCurrency(payload[0].value, selectedCurrency)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isProfit = data.pnl >= 0;
      return (
        <div className="bg-[#111827] border border-gray-800 p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{data.name}</p>
          <p className={`font-semibold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{formatCurrency(data.pnl, selectedCurrency)} ({data.pnlPct.toFixed(2)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-2">
      {/* Allocation Chart */}
      <div className="bg-[#0B1120]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6">Alokasi Aset</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth={2}
                animationDuration={1500}
                animationBegin={200}
              >
                {allocationData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === 'Cash' ? '#64748b' : COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomPieTooltip />} cursor={{fill: 'transparent'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Custom Legend */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          {allocationData.map((entry, index) => (
            <div key={entry.name} className="flex items-center text-xs text-gray-400">
              <span 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: entry.name === 'Cash' ? '#64748b' : COLORS[index % COLORS.length] }}
              />
              {entry.name}
            </div>
          ))}
        </div>
      </div>

      {/* PnL Chart */}
      {pnlData.length > 0 ? (
        <div className="bg-[#0B1120]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Analisis P&L per Saham</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pnlData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (Math.abs(val) >= 1000000) return `${(val/1000000).toFixed(1)}M`;
                    if (Math.abs(val) >= 1000) return `${(val/1000).toFixed(1)}K`;
                    return val.toString();
                  }}
                />
                <BarTooltip content={<CustomBarTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                <Bar 
                  dataKey="pnl" 
                  radius={[4, 4, 4, 4]} 
                  animationDuration={1500}
                  animationBegin={400}
                >
                  {pnlData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} 
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-[#0B1120]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl flex items-center justify-center">
           <p className="text-gray-500 text-sm">Beli saham pertama Anda untuk melihat Analisis P&L.</p>
        </div>
      )}
    </div>
  );
}
