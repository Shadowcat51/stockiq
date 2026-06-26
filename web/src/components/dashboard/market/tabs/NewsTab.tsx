import React from 'react';
import { useMarketStore } from '@/store/marketStore';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsTabProps {
  activeSymbol: string;
}

export function NewsTab({ activeSymbol }: NewsTabProps) {
  const stockNews = useMarketStore(state => state.stockNews);

  if (!stockNews || !Array.isArray(stockNews)) {
    return (
      <div className="flex justify-center items-center py-20 flex-col gap-4">
        {stockNews && !Array.isArray(stockNews) ? (
          <div className="text-red-400 text-sm">Failed to load news: {String((stockNews as any).error || 'Unknown error')}</div>
        ) : (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        )}
      </div>
    );
  }

  if (stockNews.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No recent news available for {activeSymbol}.
      </div>
    );
  }

  const formatTime = (unixTime: number) => {
    if (!unixTime) return '';
    const date = new Date(unixTime * 1000);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      if (diffHours === 0) return 'Just now';
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col space-y-6 w-full pb-20">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Newspaper className="w-6 h-6 text-emerald-400" /> Latest News
        </h2>
        <p className="text-gray-400 text-sm">Real-time financial news and updates related to {activeSymbol}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stockNews.map((news, idx) => (
          <a 
            key={idx}
            href={news.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:bg-gray-800/50 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          >
            {/* Thumbnail */}
            <div className="w-full h-48 bg-gray-800 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={news.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(news.publisher || 'News')}&background=020617&color=10b981&size=600&font-size=0.15&bold=true&length=3`} 
                alt={news.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            
            {/* Content */}
            <div className="p-5 flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-3 text-xs text-gray-400">
                <span className="font-medium text-emerald-400/90">{news.publisher}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(news.providerPublishTime)}
                </span>
              </div>
              
              <h3 className="text-white font-semibold text-base leading-snug group-hover:text-emerald-400 transition-colors mb-4 line-clamp-3">
                {news.title}
              </h3>
              
              <div className="mt-auto flex items-center text-xs text-gray-500 group-hover:text-gray-300 transition-colors">
                <span>Read article</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
