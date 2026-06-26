import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MarketTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function MarketTabs({ tabs, activeTab, onChange }: MarketTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Optional: Center active tab on click if needed
  useEffect(() => {
    // This could be enhanced to scroll the active tab into view
  }, [activeTab]);

  return (
    <div className="relative border-b border-white/10 mt-4 mb-6">
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto no-scrollbar gap-6 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={cn(
              "whitespace-nowrap py-3 text-sm font-medium transition-all relative",
              activeTab === tab 
                ? "text-white" 
                : "text-gray-400 hover:text-gray-200"
            )}
          >
            {tab}
            {/* Active Indicator */}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t-full shadow-[0_-2px_10px_rgba(16,185,129,0.5)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
