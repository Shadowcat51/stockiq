import yfinance as yf
import asyncio
import json
from datetime import datetime

class MarketDataProvider:
    def __init__(self):
        self.active_symbols = set()
        self.callbacks = []

    def register_callback(self, callback):
        self.callbacks.append(callback)

    def add_symbol(self, symbol: str):
        # Format for yfinance (e.g. AAPL, MSFT, BBCA.JK for IDX)
        yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        if "IDX:" in yf_symbol:
            yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
        elif "BINANCE:" in yf_symbol:
            yf_symbol = yf_symbol.replace("BINANCE:", "") + "-USD"

        self.active_symbols.add(yf_symbol)

    def remove_symbol(self, symbol: str):
        yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        if "IDX:" in yf_symbol:
            yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
        elif "BINANCE:" in yf_symbol:
            yf_symbol = yf_symbol.replace("BINANCE:", "") + "-USD"

        if yf_symbol in self.active_symbols:
            self.active_symbols.remove(yf_symbol)

    async def fetch_data(self):
        if not self.active_symbols:
            return

        # Fetch latest data for active symbols
        tickers = " ".join(self.active_symbols)
        try:
            # Use threads for yfinance to avoid blocking asyncio loop
            data = await asyncio.to_thread(yf.download, tickers, period="1d", interval="1m", progress=False)
            
            updates = []
            if len(self.active_symbols) == 1:
                # single ticker returns flat dataframe
                ticker = list(self.active_symbols)[0]
                if not data.empty:
                    latest = data.iloc[-1]
                    updates.append({
                        "symbol": ticker,
                        "price": float(latest['Close']),
                        "high": float(latest['High']),
                        "low": float(latest['Low']),
                        "volume": int(latest['Volume']),
                        "timestamp": datetime.now().isoformat()
                    })
            else:
                for ticker in self.active_symbols:
                    if ticker in data['Close'] and not data['Close'][ticker].empty:
                        latest_close = data['Close'][ticker].iloc[-1]
                        updates.append({
                            "symbol": ticker,
                            "price": float(latest_close),
                            "timestamp": datetime.now().isoformat()
                        })
            
            # Notify callbacks
            for update in updates:
                for cb in self.callbacks:
                    await cb(update)
                    
        except Exception as e:
            print(f"Error fetching yfinance data: {e}")

    async def start_polling(self, interval_seconds=10):
        while True:
            await self.fetch_data()
            await asyncio.sleep(interval_seconds)

provider = MarketDataProvider()
