'use client';

import { useEffect } from 'react';
import { useSimulationStore } from '@/store/simulationStore';
import { BankruptcyBanner } from '@/components/simulation/BankruptcyBanner';
import { PortfolioOverview } from '@/components/simulation/PortfolioOverview';
import { PortfolioCharts } from '@/components/simulation/PortfolioCharts';
import { HoldingsTable } from '@/components/simulation/HoldingsTable';
import { OrderHistory } from '@/components/simulation/OrderHistory';
import { Loader2, Rocket } from 'lucide-react';

export default function PortfolioPage() {
  const { isLoading, isInitialized, initPortfolio, fetchPortfolio, error, portfolios, selectedCurrency } = useSimulationStore();

  useEffect(() => {
    // Initial fetch
    fetchPortfolio();

    // Set up polling interval (every 10 seconds)
    const intervalId = setInterval(() => {
      fetchPortfolio(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchPortfolio]);

  const activePortfolio = portfolios.find(p => p.currency === selectedCurrency);

  // Loading state
  if (isLoading && !isInitialized) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Not initialized — show welcome screen
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Mulai Simulasi Trading</h2>
          <p className="text-gray-400 text-sm mb-2">
            Buat portofolio virtual Anda dan latihan trading tanpa risiko nyata.
          </p>
          <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
               <span className="text-gray-400">🇺🇸 Saldo Awal USD</span>
              <span className="text-white font-semibold">$100,000.00</span>
            </div>
            <div className="flex justify-between text-sm">
               <span className="text-gray-400">🇮🇩 Saldo Awal IDR</span>
              <span className="text-white font-semibold">Rp 1,000,000,000</span>
            </div>
            <div className="border-t border-white/5 pt-2 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Reset Kebangkrutan</span>
                <span className="text-gray-400 text-right max-w-[150px]">Klaim dana baru 3 hari setelah kebangkrutan</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">Biaya per Transaksi</span>
                <span className="text-gray-400">0.1%</span>
              </div>
            </div>
          </div>
          <button
            onClick={initPortfolio}
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center space-x-2 mx-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span>Mulai Portofolio</span>
              </>
            )}
          </button>

          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Main portfolio view
  return (
    <div className="space-y-6">
      {/* Bankruptcy Banner */}
      {activePortfolio && <BankruptcyBanner portfolio={activePortfolio} />}

      {/* Portfolio Overview */}
      <PortfolioOverview />

      {/* Charts Section */}
      {activePortfolio && <PortfolioCharts portfolio={activePortfolio} />}

      {/* Main Content */}
      <div className="w-full">
        {/* Holdings Table */}
        <HoldingsTable />
      </div>

      {/* Order History */}
      <OrderHistory />
    </div>
  );
}
