'use client';

import { useState } from 'react';
import { AlertOctagon, RotateCcw, Clock, ShieldAlert } from 'lucide-react';
import { useSimulationStore, Portfolio } from '@/store/simulationStore';

export function BankruptcyBanner({ portfolio }: { portfolio: Portfolio }) {
  const { resetBankruptcy, isLoading } = useSimulationStore();
  const [errorMsg, setErrorMsg] = useState('');
  
  if (!portfolio.isBankrupt) return null;

  const bankruptcyDate = portfolio.bankruptcyTime ? new Date(portfolio.bankruptcyTime) : new Date();
  const now = new Date();
  const diffTime = now.getTime() - bankruptcyDate.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);
  const remainingDays = Math.max(0, 3 - diffDays);
  
  const canReset = remainingDays <= 0;

  const handleReset = async () => {
    setErrorMsg('');
    const res = await resetBankruptcy(portfolio.currency);
    if (!res.success && res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between backdrop-blur-xl mb-6">
      <div className="flex items-center space-x-3 mb-4 sm:mb-0">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="text-red-300 font-semibold text-sm">Portofolio {portfolio.currency} Bangkrut</p>
          <p className="text-red-400/70 text-xs mt-0.5">
            Ekuitas Anda telah habis atau di bawah batas minimum.
          </p>
          {errorMsg && <p className="text-red-500 text-xs mt-1 font-medium">{errorMsg}</p>}
        </div>
      </div>
      
      {canReset ? (
        <button
          onClick={handleReset}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl text-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RotateCcw className="w-4 h-4" /> Reset Dana Awal
            </>
          )}
        </button>
      ) : (
        <div className="text-right flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-400" />
          <div>
            <p className="text-xs text-orange-300">Tersedia dalam</p>
            <p className="text-sm text-orange-400 font-medium">
              {Math.ceil(remainingDays)} Hari
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
