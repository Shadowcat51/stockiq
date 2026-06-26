'use client';

import { MarketOverview } from '@/components/dashboard/MarketOverview';
import { WatchlistSummary } from '@/components/dashboard/WatchlistSummary';
import { AISentiment } from '@/components/dashboard/AISentiment';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';
import { TopMovers } from '@/components/dashboard/TopMovers';
import { PortfolioSnapshot } from '@/components/dashboard/PortfolioSnapshot';
import { NewsTicker } from '@/components/dashboard/NewsTicker';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* News Ticker */}
      <NewsTicker />

      {/* Market Overview */}
      <MarketOverview />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Wider on large screens if we adjust col-span, but here we do equal or 2/1 split) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio & AI Sentiment row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PortfolioSnapshot />
            <AISentiment />
          </div>
          
          {/* Watchlist Summary */}
          <div className="h-[400px]">
            <WatchlistSummary />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 flex flex-col h-full">
          <div className="h-[350px]">
            <RecentAlerts />
          </div>
          <div className="h-[400px]">
            <TopMovers />
          </div>
        </div>

      </div>
    </div>
  );
}
