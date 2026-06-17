'use client';

import { Megaphone } from 'lucide-react';

const headlines = [
  "Federal Reserve signals potential rate cut in Q3 2026",
  "NVIDIA announces new AI superchip, stock hits all-time high",
  "Bank Indonesia maintains BI Rate at 6.00% to support Rupiah",
  "Apple unveils new AR/VR ecosystem features at WWDC",
  "Oil prices surge amid rising geopolitical tensions in Middle East",
];

export function NewsTicker() {
  return (
    <div className="w-full bg-blue-950/30 border border-blue-500/20 rounded-xl overflow-hidden flex items-center h-12 relative">
      <div className="bg-blue-600 px-4 h-full flex items-center z-10 font-bold text-white shadow-[2px_0_10px_rgba(37,99,235,0.5)]">
        <Megaphone className="w-4 h-4 mr-2" />
        LIVE NEWS
      </div>
      
      <div className="flex-1 overflow-hidden relative h-full flex items-center group">
        <div className="absolute whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] flex items-center">
          {headlines.map((headline, idx) => (
            <span key={idx} className="mx-8 text-gray-300 flex items-center text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-3 inline-block"></span>
              {headline}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {headlines.map((headline, idx) => (
            <span key={`dup-${idx}`} className="mx-8 text-gray-300 flex items-center text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-3 inline-block"></span>
              {headline}
            </span>
          ))}
        </div>
      </div>
      
      {/* Fade edges */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0f172a] to-transparent z-10 pointer-events-none"></div>
    </div>
  );
}
