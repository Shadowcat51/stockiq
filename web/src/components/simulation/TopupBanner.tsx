'use client';

import { useEffect } from 'react';
import { Gift, Clock, CheckCircle } from 'lucide-react';
import { useSimulationStore } from '@/store/simulationStore';

export function TopupBanner() {
  const { topupStatus, checkTopup } = useSimulationStore();

  useEffect(() => {
    checkTopup();
  }, [checkTopup]);

  if (!topupStatus) return null;

  // Just claimed
  if (topupStatus.claimed) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-emerald-300 font-semibold text-sm">Monthly Top-up Claimed! 🎉</p>
            <p className="text-emerald-400/70 text-xs mt-0.5">
              +${topupStatus.usdAmount?.toLocaleString()} USD & +Rp {topupStatus.idrAmount?.toLocaleString()} IDR added to your portfolio
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Eligible for topup
  if (topupStatus.eligible) {
    return (
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl animate-pulse-slow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-300 font-semibold text-sm">Monthly Top-up Available!</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Claim $50,000 USD & Rp 50,000,000 IDR for your simulation portfolio
            </p>
          </div>
        </div>
        <button
          onClick={() => checkTopup()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20"
        >
          Claim Now
        </button>
      </div>
    );
  }

  // Not eligible yet — show countdown
  return (
    <div className="bg-gradient-to-r from-slate-800/40 to-gray-800/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-gray-300 font-medium text-sm">Next Monthly Top-up</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {topupStatus.daysRemaining} day{topupStatus.daysRemaining !== 1 ? 's' : ''} remaining • 
            +$50,000 USD & +Rp 50,000,000 IDR
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">Available on</p>
        <p className="text-sm text-gray-300 font-medium">
          {new Date(topupStatus.nextTopupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
