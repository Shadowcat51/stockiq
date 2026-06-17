import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const response = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const quotes = data.quotes || [];
    
    // Map Yahoo symbols to TradingView symbols
    const results = quotes
      .filter((q: any) => ['EQUITY', 'CRYPTOCURRENCY', 'ETF'].includes(q.quoteType))
      .map((q: any) => {
        let tvSymbol = q.symbol;
        let isUp = true; 
        let change = '';
        let price = '';

        // Map common exchanges to TradingView format
        if (q.symbol.endsWith('.JK')) {
          tvSymbol = `IDX:${q.symbol.replace('.JK', '')}`;
        } else if (['NMS', 'NCM', 'NGM', 'NAS'].includes(q.exchange)) {
          tvSymbol = `NASDAQ:${q.symbol}`;
        } else if (q.exchange === 'NYQ') {
          tvSymbol = `NYSE:${q.symbol}`;
        } else if (q.quoteType === 'CRYPTOCURRENCY') {
          tvSymbol = `BINANCE:${q.symbol.replace('-', '')}`;
        }

        return {
          symbol: tvSymbol,
          name: q.shortname || q.longname || q.symbol,
          price: price, // API Search doesn't return real-time price
          change: change,
          isUp: isUp,
          type: q.quoteType,
          exchange: q.exchange
        };
      });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
