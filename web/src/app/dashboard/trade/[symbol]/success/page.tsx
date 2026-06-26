'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Home, ReceiptText } from 'lucide-react';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function TradeSuccessPage({ params }: { params: Promise<{ symbol: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = React.use(params);
  const rawSymbol = decodeURIComponent(resolvedParams.symbol);
  
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  const isIndo = rawSymbol.startsWith('IDX:') || rawSymbol.endsWith('.JK');
  const currencySymbol = isIndo ? 'Rp' : '$';

  const orderId = searchParams.get('orderId') || 'Unknown';
  const type = searchParams.get('type') || 'MARKET';
  const side = searchParams.get('side') || 'BUY';
  const status = searchParams.get('status') || 'FILLED';
  const qty = parseFloat(searchParams.get('qty') || '0');
  const price = parseFloat(searchParams.get('price') || '0');
  const cost = parseFloat(searchParams.get('cost') || '0');
  const fee = parseFloat(searchParams.get('fee') || '0');

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (val: number) => {
    if (isIndo) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const isPending = status === 'PENDING';

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#0a0e17] text-white p-6 relative overflow-hidden">
      {showConfetti && !isPending && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} gravity={0.2} />}

      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Animated Background Gradient */}
        <div className={cn(
          "absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none animate-pulse",
          isPending ? "bg-amber-500" : side === 'BUY' ? "bg-emerald-500" : "bg-blue-500"
        )}></div>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center animate-in slide-in-from-bottom-4 duration-500 delay-150",
            isPending ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500"
          )}>
            {isPending ? (
              <ReceiptText className="w-10 h-10 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-10 h-10" />
            )}
          </div>
          
          <div className="animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <h1 className="text-2xl font-bold">
              {isPending ? 'Order Pending' : 'Transaksi Berhasil!'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isPending 
                ? 'Order Anda telah masuk ke dalam antrean' 
                : `${side === 'BUY' ? 'Pembelian' : 'Penjualan'} saham Anda telah tereksekusi`}
            </p>
          </div>
        </div>

        {/* Receipt Details */}
        <div className="mt-10 bg-black/40 rounded-2xl p-5 space-y-4 border border-gray-800/50 relative z-10 animate-in slide-in-from-bottom-4 duration-500 delay-300">
          
          <div className="flex justify-between items-center pb-4 border-b border-gray-800/50">
            <span className="text-gray-400 text-sm">Saham</span>
            <span className="font-bold text-lg">{rawSymbol.replace('IDX:', '').replace('NASDAQ:', '').replace('NYSE:', '')}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Tipe Order</span>
            <span className="font-medium bg-gray-800 px-2 py-0.5 rounded text-xs">{type} {side}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Jumlah</span>
            <span className="font-medium">{qty.toFixed(4)} Lembar</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">{isPending ? 'Harga Limit/Stop' : 'Harga Eksekusi'}</span>
            <span className="font-medium">{formatCurrency(price)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Biaya Transaksi (0.15%)</span>
            <span className="font-medium text-gray-300">{formatCurrency(fee)}</span>
          </div>

          <div className="pt-4 border-t border-gray-800/50 flex justify-between items-center">
            <span className="text-gray-300 font-medium">Total Estimasi</span>
            <span className={cn("font-bold text-lg", side === 'BUY' ? 'text-red-400' : 'text-emerald-400')}>
              {side === 'BUY' ? '-' : '+'}{formatCurrency(cost)}
            </span>
          </div>
        </div>

        {/* Order ID */}
        <div className="mt-4 text-center animate-in slide-in-from-bottom-4 duration-500 delay-500">
          <p className="text-[10px] text-gray-600 font-mono tracking-wider">ORDER ID: {orderId}</p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3 relative z-10 animate-in slide-in-from-bottom-4 duration-500 delay-700">
          <button 
            onClick={() => router.push('/dashboard/portfolio')}
            className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" /> Portofolio
          </button>
          <button 
            onClick={() => router.push(`/dashboard/market/${encodeURIComponent(rawSymbol)}?tab=Order`)}
            className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Detail <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
