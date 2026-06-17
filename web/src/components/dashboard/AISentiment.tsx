'use client';

import { motion } from 'framer-motion';
import { BrainCircuit, Info } from 'lucide-react';

export function AISentiment() {
  const score = 78; // Bullish

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h2 className="text-lg font-bold text-white flex items-center">
          <BrainCircuit className="w-5 h-5 mr-2 text-indigo-400" />
          AI Market Sentiment
        </h2>
        <Info className="w-4 h-4 text-gray-400" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="relative w-48 h-24 overflow-hidden flex items-end justify-center">
          {/* Gauge Background */}
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-white/5 border-b-transparent border-r-transparent rotate-45"></div>
          
          {/* Gauge Color Gradient */}
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-[12px] border-transparent border-l-emerald-500 border-t-yellow-500 rotate-45 opacity-60"></div>
          
          {/* Gauge Needle */}
          <motion.div 
            initial={{ rotate: -90 }}
            animate={{ rotate: (score / 100) * 180 - 90 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute bottom-0 left-1/2 w-1 h-20 bg-white origin-bottom rounded-t-full z-20"
            style={{ x: '-50%' }}
          />
          
          {/* Center Dot */}
          <div className="absolute bottom-[-6px] left-1/2 w-4 h-4 bg-indigo-500 rounded-full z-30 transform -translate-x-1/2 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
        </div>

        <div className="text-center mt-4">
          <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
            Strong Bullish
          </h3>
          <p className="text-gray-400 mt-1">Score: {score}/100</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-300 relative z-10">
        <p>AI models detect high buying pressure in tech sector with favorable macro-economic conditions.</p>
      </div>
    </div>
  );
}
