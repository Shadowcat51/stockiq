import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols');

  if (!symbols) {
    return NextResponse.json({ error: 'Symbols parameter is required' }, { status: 400 });
  }

  try {
    // We use the spark API to get current price and a mini chart (1d, 5m interval)
    // The response is very fast and contains the previous close to calculate change
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1d&interval=15m`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      next: { revalidate: 10 } // Cache for 10 seconds to avoid rate limits on rapid pagination
    });

    if (!response.ok) {
      throw new Error(`Yahoo API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const result: any = {};

    if (data.spark && data.spark.result) {
      for (const item of data.spark.result) {
        const symbol = item.symbol;
        const resp = item.response[0];
        
        if (resp && resp.meta) {
          const meta = resp.meta;
          const currentPrice = meta.regularMarketPrice;
          const previousClose = meta.chartPreviousClose;
          
          let change = 0;
          let changePercent = 0;
          
          if (currentPrice && previousClose) {
            change = currentPrice - previousClose;
            changePercent = (change / previousClose) * 100;
          }

          // Extract sparkline points (remove nulls)
          let sparkline = [];
          if (resp.indicators && resp.indicators.quote && resp.indicators.quote[0]) {
            const closePrices = resp.indicators.quote[0].close;
            if (closePrices) {
              sparkline = closePrices.filter((p: number | null) => p !== null);
            }
          }

          result[symbol] = {
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            sparkline: sparkline
          };
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Batch fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch batch data' }, { status: 500 });
  }
}
