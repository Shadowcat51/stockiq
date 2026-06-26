import dotenv from 'dotenv';

dotenv.config();

const STOCK_SERVICE_URL = process.env.STOCK_SERVICE_URL || 'http://localhost:8000';

interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  timestamp: string;
}

// In-memory cache for prices (TTL: 5 seconds for simulation realism)
const priceCache: Map<string, { data: StockPrice; expiresAt: number }> = new Map();
const CACHE_TTL_MS = 5000;

/**
 * Fetch current stock price from stock-service or fallback to mock data.
 * For simulation purposes, we use real market data when available,
 * and generate realistic mock prices as fallback.
 */
export async function getCurrentPrice(symbol: string, exchange: string): Promise<StockPrice> {
  const cacheKey = `${symbol}:${exchange}`;
  const cached = priceCache.get(cacheKey);
  
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    // Try to fetch from stock-service
    const response = await fetch(`${STOCK_SERVICE_URL}/api/stocks/${symbol}?exchange=${exchange}`);
    
    if (response.ok) {
      const data = await response.json() as any;
      const stockPrice: StockPrice = {
        symbol: data.symbol || symbol,
        price: data.current_price || data.price || data.close,
        change: data.change || 0,
        changePct: data.change_pct || 0,
        volume: data.volume || 0,
        timestamp: new Date().toISOString(),
      };

      priceCache.set(cacheKey, { data: stockPrice, expiresAt: Date.now() + CACHE_TTL_MS });
      return stockPrice;
    }
  } catch (error) {
    console.warn(`[PriceService] Failed to fetch from stock-service for ${symbol}:`, (error as Error).message);
  }

  // Fallback: generate realistic simulation price based on symbol
  const fallbackPrice = generateFallbackPrice(symbol, exchange);
  priceCache.set(cacheKey, { data: fallbackPrice, expiresAt: Date.now() + CACHE_TTL_MS });
  return fallbackPrice;
}

/**
 * Generate a realistic fallback price for simulation purposes.
 * Uses deterministic base prices for well-known stocks + small random fluctuation.
 */
function generateFallbackPrice(symbol: string, exchange: string): StockPrice {
  const basePrices: Record<string, number> = {
    // US Stocks
    'AAPL': 195.50, 'MSFT': 420.00, 'GOOGL': 175.00, 'AMZN': 185.00,
    'NVDA': 130.00, 'META': 500.00, 'TSLA': 250.00, 'JPM': 195.00,
    'V': 280.00, 'JNJ': 155.00, 'WMT': 165.00, 'PG': 165.00,
    'MA': 460.00, 'UNH': 520.00, 'HD': 345.00, 'DIS': 110.00,
    'NFLX': 630.00, 'PYPL': 65.00, 'INTC': 30.00, 'AMD': 160.00,
    'CRM': 260.00, 'ORCL': 125.00, 'ADBE': 550.00, 'CSCO': 48.00,
    // IDX Stocks (in IDR)
    'BBCA': 9800, 'BBRI': 5200, 'BMRI': 6400, 'TLKM': 3800,
    'ASII': 5100, 'UNVR': 4200, 'HMSP': 1050, 'GGRM': 24000,
    'BBNI': 5000, 'ICBP': 10500, 'INDF': 6800, 'KLBF': 1600,
    'PGAS': 1500, 'SMGR': 5500, 'ANTM': 1400, 'PTBA': 2700,
    'MDKA': 2300, 'EXCL': 2200, 'ISAT': 9400, 'TOWR': 1000,
  };

  const basePrice = basePrices[symbol] || (exchange === 'IDX' ? 5000 : 100);
  
  // Add small random fluctuation (±1.5%)
  const fluctuation = (Math.random() - 0.5) * 0.03;
  const price = Math.round((basePrice * (1 + fluctuation)) * 100) / 100;
  const change = Math.round((price - basePrice) * 100) / 100;
  const changePct = Math.round((change / basePrice) * 10000) / 100;

  return {
    symbol,
    price,
    change,
    changePct,
    volume: Math.floor(Math.random() * 10000000) + 100000,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get prices for multiple symbols at once.
 */
export async function getMultiplePrices(symbols: { symbol: string; exchange: string }[]): Promise<Map<string, StockPrice>> {
  const results = new Map<string, StockPrice>();
  
  await Promise.all(
    symbols.map(async ({ symbol, exchange }) => {
      const price = await getCurrentPrice(symbol, exchange);
      results.set(symbol, price);
    })
  );

  return results;
}
