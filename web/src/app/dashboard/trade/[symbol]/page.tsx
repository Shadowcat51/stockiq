'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketStore } from '@/store/marketStore';
import { useSimulationStore } from '@/store/simulationStore';
import { 
  ArrowLeft, Info, ChevronDown, Plus, Minus, 
  Settings2, CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { tradeAxiosInstance } from '@/lib/axios';

// Helper component for styled number input
const NumberInput = ({ 
  label, 
  value, 
  onChange, 
  step = 1,
  min = 0,
  prefix = ''
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void,
  step?: number,
  min?: number,
  prefix?: string
}) => {
  const handleDec = () => {
    const num = parseFloat(value) || 0;
    if (num - step >= min) onChange((num - step).toFixed(2));
  };
  const handleInc = () => {
    const num = parseFloat(value) || 0;
    onChange((num + step).toFixed(2));
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800">
      <div className="text-gray-400 text-sm font-medium">{label}</div>
      <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-gray-800 w-48 transition-colors focus-within:border-emerald-500/50">
        <button onClick={handleDec} className="p-2 text-gray-400 hover:text-white transition-colors">
          <Minus className="w-4 h-4" />
        </button>
        <div className="flex-grow flex items-center justify-center relative">
          {prefix && <span className="absolute left-2 text-gray-500 text-sm">{prefix}</span>}
          <input 
            type="number" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-white text-center text-sm focus:outline-none font-medium tabular-nums"
          />
        </div>
        <button onClick={handleInc} className="p-2 text-gray-400 hover:text-white transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function TradePage({ params }: { params: Promise<{ symbol: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const rawSymbol = decodeURIComponent(resolvedParams.symbol);
  
  // Is Indonesian stock?
  const isIndo = rawSymbol.startsWith('IDX:') || rawSymbol.endsWith('.JK');
  const currencySymbol = isIndo ? 'Rp' : '$';
  const cleanSymbol = rawSymbol.replace('IDX:', '').replace('NASDAQ:', '').replace('NYSE:', '').replace('.JK', '');
  
  const { 
    activeSymbol, setActiveSymbol, latestData, 
    connectWebSocket, disconnectWebSocket,
    stockProfile
  } = useMarketStore();

  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch balance & holdings
  const { portfolios, fetchPortfolio } = useSimulationStore();
  useEffect(() => {
    fetchPortfolio(true);
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSide = urlParams.get('side');
      if (urlSide && urlSide.toUpperCase() === 'SELL') setSide('SELL');
    }
  }, [fetchPortfolio]);

  const activePortfolio = portfolios.find(p => p.currency === (isIndo ? 'IDR' : 'USD'));
  const availableBalance = activePortfolio?.cashBalance || 0;
  
  // Find holding for this stock
  const holding = activePortfolio?.holdings?.find(h => h.symbol === cleanSymbol);
  const ownedShares = holding ? holding.quantity : 0;
  const borrowedAmount = holding?.borrowed_amount ? parseFloat(holding.borrowed_amount) : 0;
  const accumulatedFee = holding?.accumulated_leverage_fee ? parseFloat(holding.accumulated_leverage_fee) : 0;

  useEffect(() => {
    if (activeSymbol !== rawSymbol) {
      setActiveSymbol(rawSymbol);
    }
  }, [rawSymbol, activeSymbol, setActiveSymbol]);

  useEffect(() => {
    connectWebSocket(rawSymbol);
    return () => disconnectWebSocket();
  }, [rawSymbol, connectWebSocket, disconnectWebSocket]);

  const currentPrice = latestData?.price || stockProfile?.price || 0;

  // Form State
  const [orderType, setOrderType] = useState('Market');
  const [leverage, setLeverage] = useState('None');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUsd, setQuantityUsd] = useState('');
  const [sellSliderValue, setSellSliderValue] = useState(0);
  
  // Advanced settings state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timeInForce, setTimeInForce] = useState('Day');

  // Initialize prices once data loads
  useEffect(() => {
    if (currentPrice > 0 && limitPrice === '') {
      setLimitPrice(currentPrice.toFixed(2));
      setStopPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice, limitPrice]);

  // Handle slider change for SELL
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseInt(e.target.value);
    setSellSliderValue(pct);
    if (ownedShares > 0) {
      const sharesToSell = (ownedShares * pct) / 100;
      setQuantity(sharesToSell > 0 ? sharesToSell.toFixed(4) : '');
    }
  };

  // Sync slider if quantity is typed manually
  useEffect(() => {
    if (side === 'SELL' && ownedShares > 0 && quantity !== '') {
      const q = parseFloat(quantity) || 0;
      const pct = Math.min(100, Math.max(0, Math.round((q / ownedShares) * 100)));
      setSellSliderValue(pct);
    } else if (quantity === '') {
      setSellSliderValue(0);
    }
  }, [quantity, side, ownedShares]);

  // Calculate Estimation
  let estCost = 0;
  let finalQty = parseFloat(quantity) || 0;
  
  if (orderType === 'Market') {
    if (quantityUsd && side === 'BUY') {
      estCost = parseFloat(quantityUsd) || 0;
      finalQty = estCost / currentPrice;
    } else {
      estCost = finalQty * currentPrice;
    }
  } else {
    estCost = finalQty * (parseFloat(limitPrice) || currentPrice);
  }

  // Sell Specific Estimations
  const isSell = side === 'SELL';
  const proportion = ownedShares > 0 ? Math.min(1, finalQty / ownedShares) : 0;
  const marginRepayment = borrowedAmount * proportion;
  const feeRepayment = accumulatedFee * proportion;
  const sellFee = estCost * 0.0015;
  const netProceeds = Math.max(0, estCost - sellFee - marginRepayment - feeRepayment);
  const buyFee = estCost * 0.0015;

  const formatCurrency = (val: number) => {
    if (isIndo) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const isSellDisabled = isSell && ownedShares <= 0;

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!finalQty || finalQty <= 0) {
      setErrorMsg('Masukkan jumlah lembar yang valid');
      return;
    }

    if (isSell && finalQty > ownedShares) {
      setErrorMsg('Jumlah jual melebihi saham yang dimiliki');
      return;
    }

    setIsSubmitting(true);
    try {
      let mappedOrderType = orderType.toUpperCase();
      if (orderType === 'Stop-Limit') mappedOrderType = 'STOP_LIMIT';

      let exchange = 'NYSE';
      if (rawSymbol.startsWith('IDX:') || rawSymbol.endsWith('.JK')) {
        exchange = 'IDX';
      } else if (rawSymbol.startsWith('NASDAQ:')) {
        exchange = 'NASDAQ';
      }

      const payload: any = {
        symbol: cleanSymbol,
        exchange,
        side,
        orderType: mappedOrderType,
        quantity: finalQty,
        ...(mappedOrderType === 'LIMIT' || mappedOrderType === 'STOP_LIMIT' ? { price: parseFloat(limitPrice) } : {}),
        ...(mappedOrderType === 'STOP' || mappedOrderType === 'STOP_LIMIT' ? { stopPrice: parseFloat(stopPrice) } : {}),
      };

      // Map leverage string to number (only for BUY)
      let leverageMultiplier = 1;
      if (!isSell) {
        if (leverage === '2x') leverageMultiplier = 2;
        if (leverage === '4x') leverageMultiplier = 4;
      }
      payload.leverage = leverageMultiplier;

      const res = await tradeAxiosInstance.post('/simulation/orders', payload);
      const data = res.data;

      const feeAmount = data.status === 'FILLED' ? (data.fee || 0) : (isSell ? sellFee : buyFee);
      
      router.push(`/dashboard/trade/${encodeURIComponent(rawSymbol)}/success?orderId=${data.orderId}&type=${mappedOrderType}&side=${side}&qty=${finalQty}&price=${mappedOrderType === 'MARKET' ? data.filledPrice || currentPrice : parseFloat(limitPrice)}&cost=${data.totalCost || estCost}&status=${data.status}&fee=${feeAmount}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal mengirim order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] text-white pb-24 md:pb-6 overflow-y-auto">
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0e17]/90 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-gray-800">
        <button 
          onClick={() => router.push(`/dashboard/market/${encodeURIComponent(rawSymbol)}`)}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-300" />
        </button>
        <h1 className="text-xl font-bold">Trade {cleanSymbol}</h1>
      </div>

      <div className="max-w-2xl mx-auto w-full px-6 py-6 space-y-8">
        
        {/* Toggle Buy/Sell */}
        <div className="flex bg-gray-900 rounded-xl p-1 shadow-inner shadow-black/20">
          <button 
            onClick={() => setSide('BUY')}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300", 
              side === 'BUY' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-gray-400 hover:text-white"
            )}
          >
            BUY
          </button>
          <button 
            onClick={() => setSide('SELL')}
            className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300", 
              side === 'SELL' ? "bg-red-500 text-white shadow-md shadow-red-500/20" : "text-gray-400 hover:text-white"
            )}
          >
            SELL
          </button>
        </div>

        {/* Price Display */}
        <div>
          <div className="text-4xl font-light tabular-nums tracking-tight">
            {formatCurrency(currentPrice)}
          </div>
          {latestData?.change !== undefined && (
            <div className={cn(
              "text-sm font-medium mt-1",
              latestData.change >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {latestData.change >= 0 ? '+' : ''}{latestData.change.toFixed(2)} ({latestData.changePercent.toFixed(2)}%)
            </div>
          )}
        </div>

        {/* Form Container */}
        <div className="space-y-4">
          
          {/* Order Type Tabs */}
          <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2 overflow-x-auto hide-scrollbar">
            {['Market', 'Limit', 'Stop', 'Stop-Limit'].map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  orderType === type 
                    ? "bg-gray-800 text-white border border-gray-700" 
                    : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Tersedia Share */}
          {isSell && (
            <div className="text-sm font-medium text-gray-400">
              Tersedia <span className="text-white font-bold">{ownedShares} Share</span>
            </div>
          )}

          {/* Leverage (Only Buy) */}
          {!isSell && (
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                Leverage <Info className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <button 
                  onClick={() => setLeverage('None')}
                  className={cn("transition-colors font-medium", leverage === 'None' ? 'text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded' : 'text-gray-500 hover:text-gray-300')}
                >None</button>
                <button 
                  onClick={() => setLeverage('2x')}
                  className={cn("transition-colors font-medium", leverage === '2x' ? 'text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded' : 'text-gray-500 hover:text-gray-300')}
                >2x</button>
                <button 
                  onClick={() => setLeverage('4x')}
                  className={cn("transition-colors font-medium", leverage === '4x' ? 'text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded' : 'text-gray-500 hover:text-gray-300')}
                >4x (Day Trade)</button>
              </div>
            </div>
          )}

          {/* Dynamic Price Inputs */}
          {(orderType === 'Stop' || orderType === 'Stop-Limit') && (
            <NumberInput label="Harga Stop" value={stopPrice} onChange={setStopPrice} step={0.5} />
          )}

          {(orderType === 'Limit' || orderType === 'Stop-Limit') && (
            <NumberInput label="Harga Limit" value={limitPrice} onChange={setLimitPrice} step={0.5} />
          )}

          {/* Quantity Input */}
          {orderType === 'Market' && !isSell ? (
            <div className="flex gap-2 mb-2">
               <button onClick={() => { setQuantityUsd(''); setQuantity('1'); }} className={cn("flex-1 py-1 text-xs rounded border transition-colors", quantity ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-gray-700 text-gray-400")}>Lembar</button>
               <button onClick={() => { setQuantity(''); setQuantityUsd('100'); }} className={cn("flex-1 py-1 text-xs rounded border transition-colors", quantityUsd ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-gray-700 text-gray-400")}>Nominal Kas</button>
            </div>
          ) : null}

          {quantityUsd && !isSell ? (
            <NumberInput label={`Jumlah ${isIndo ? 'IDR' : 'USD'}`} value={quantityUsd} onChange={setQuantityUsd} step={10} prefix={currencySymbol} />
          ) : (
            <NumberInput label="Jumlah (Lembar)" value={quantity} onChange={setQuantity} step={1} />
          )}

          {/* Sell Slider */}
          {isSell && ownedShares > 0 && (
            <div className="pt-4 pb-2">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={sellSliderValue} 
                onChange={handleSliderChange}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <span className="text-xs text-gray-500">
              {quantityUsd && !isSell
                ? `≈ ${((parseFloat(quantityUsd) || 0) / currentPrice).toFixed(4)} Shares` 
                : quantity
                ? `≈ ${formatCurrency((parseFloat(quantity) || 0) * currentPrice)}`
                : ''}
            </span>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 mt-6 border-t border-gray-800/50 space-y-4">
          
          {!isSell ? (
            // BUY Estimations
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 flex items-center gap-1.5">Saldo Tersedia</span>
                <span className="font-medium">{formatCurrency(availableBalance)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Biaya Transaksi (0.15%)</span>
                <span className="font-medium">{formatCurrency(buyFee)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold mt-2">
                <span className="text-white">Est. Perlu Dibayarkan</span>
                <span className="text-white">{formatCurrency(estCost + buyFee)}</span>
              </div>
            </>
          ) : (
            // SELL Estimations
            <>
              <div className="flex justify-between items-center text-sm font-bold border-b border-gray-800 pb-2">
                <span className="text-white">Est Total Exposure</span>
                <span className="text-white">{formatCurrency(estCost)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Biaya Transaksi (0.15%)</span>
                <span className="font-medium text-red-400">-{formatCurrency(sellFee)}</span>
              </div>
              {marginRepayment > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Pelunasan Leverage</span>
                  <span className="font-medium text-red-400">-{formatCurrency(marginRepayment)}</span>
                </div>
              )}
              {feeRepayment > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Bunga Margin Harian</span>
                  <span className="font-medium text-red-400">-{formatCurrency(feeRepayment)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-800">
                <span className="text-emerald-400">Est. Akan Diterima</span>
                <span className="text-emerald-400">{formatCurrency(netProceeds)}</span>
              </div>
            </>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm text-center">
              {errorMsg}
            </div>
          )}

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || isSellDisabled}
            className={cn(
              "w-full py-4 text-white font-bold rounded-2xl mt-4 transition-all shadow-lg flex items-center justify-center gap-2",
              isSellDisabled 
                ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                : isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : side === 'BUY' 
                  ? "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20 active:scale-[0.98]" 
                  : "bg-red-500 hover:bg-red-400 shadow-red-500/20 active:scale-[0.98]"
            )}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : isSellDisabled ? (
              `Tidak Memiliki Saham ${cleanSymbol}`
            ) : (
              `${side === 'BUY' ? 'Beli' : 'Jual'} ${cleanSymbol}`
            )}
          </button>
          
          <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1 mt-4">
            <span className="w-3 h-3 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[8px]">?</span>
            Gabung StockIQ+ untuk biaya lebih rendah
          </p>
        </div>

      </div>
    </div>
  );
}
