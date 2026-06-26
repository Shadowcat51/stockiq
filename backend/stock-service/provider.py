import yfinance as yf
import asyncio
import json
import requests
from datetime import datetime

class MarketDataProvider:
    def __init__(self):
        self.stock_symbols = {}
        self.crypto_symbols = {}
        self.callbacks = []

    def register_callback(self, callback):
        self.callbacks.append(callback)

    def add_symbol(self, symbol: str):
        frontend_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "").replace("IDX:", "")
        
        clean_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        if "IDX:" in clean_symbol:
            yf_symbol = clean_symbol.replace("IDX:", "") + ".JK"
            self.stock_symbols[frontend_symbol] = yf_symbol
        elif "BINANCE:" in clean_symbol:
            crypto_symbol = clean_symbol.replace("BINANCE:", "")
            self.crypto_symbols[frontend_symbol] = crypto_symbol
        else:
            self.stock_symbols[frontend_symbol] = clean_symbol

    def remove_symbol(self, symbol: str):
        frontend_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "").replace("IDX:", "")
        if frontend_symbol in self.stock_symbols:
            del self.stock_symbols[frontend_symbol]
        if frontend_symbol in self.crypto_symbols:
            del self.crypto_symbols[frontend_symbol]

    async def fetch_data(self):
        updates = []
        
        # 1. Fetch Stock Data (Yahoo Finance)
        if self.stock_symbols:
            tickers = " ".join(self.stock_symbols.values())
            try:
                data = await asyncio.to_thread(yf.download, tickers, period="1d", interval="1m", progress=False)
                if len(self.stock_symbols) == 1:
                    front_ticker = list(self.stock_symbols.keys())[0]
                    yf_ticker = list(self.stock_symbols.values())[0]
                    if not data.empty:
                        import pandas as pd
                        latest = data.iloc[-1]
                        
                        if isinstance(latest['Close'], pd.Series):
                            close_val = float(latest['Close'].iloc[0])
                            high_val = float(latest['High'].iloc[0])
                            low_val = float(latest['Low'].iloc[0])
                            vol_val = int(latest['Volume'].iloc[0])
                        else:
                            close_val = float(latest['Close'])
                            high_val = float(latest['High'])
                            low_val = float(latest['Low'])
                            vol_val = int(latest['Volume'])

                        updates.append({
                            "symbol": front_ticker,
                            "price": close_val,
                            "high": high_val,
                            "low": low_val,
                            "volume": vol_val,
                            "timestamp": datetime.now().isoformat()
                        })
                else:
                    for front_ticker, yf_ticker in self.stock_symbols.items():
                        if yf_ticker in data['Close'] and not data['Close'][yf_ticker].empty:
                            latest_close = data['Close'][yf_ticker].iloc[-1]
                            updates.append({
                                "symbol": front_ticker,
                                "price": float(latest_close),
                                "timestamp": datetime.now().isoformat()
                            })
            except Exception as e:
                print(f"Error fetching yfinance data: {e}")

        # 2. Fetch Crypto Data (Binance)
        if self.crypto_symbols:
            try:
                def fetch_binance():
                    # Jika menggunakan multiple symbols, jika ada 1 symbol salah (misal BTCUSD), Binance akan throw error 400 untuk SEMUANYA.
                    # Jadi kita tangkap errornya, atau fallback fetch satu per satu jika batch gagal.
                    if len(self.crypto_symbols) == 1:
                        sym = list(self.crypto_symbols.values())[0]
                        url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={sym}"
                        res = requests.get(url, timeout=10)
                        if res.status_code == 200:
                            return [res.json()]
                        return []
                    else:
                        syms_json = json.dumps(list(self.crypto_symbols.values())).replace(' ', '')
                        url = f"https://api.binance.com/api/v3/ticker/24hr?symbols={syms_json}"
                        res = requests.get(url, timeout=10)
                        
                        if res.status_code == 200:
                            return res.json()
                        elif res.status_code == 400:
                            # Ada symbol yang invalid, fetch satu-satu sebagai fallback
                            valid_data = []
                            for sym in self.crypto_symbols.values():
                                try:
                                    s_url = f"https://api.binance.com/api/v3/ticker/24hr?symbol={sym}"
                                    s_res = requests.get(s_url, timeout=5)
                                    if s_res.status_code == 200:
                                        valid_data.append(s_res.json())
                                except Exception:
                                    pass
                            return valid_data
                        
                        res.raise_for_status()
                        return []

                binance_data = await asyncio.to_thread(fetch_binance)
                if isinstance(binance_data, dict):
                    binance_data = [binance_data]
                    
                binance_to_frontend = {v: k for k, v in self.crypto_symbols.items()}
                
                for item in binance_data:
                    if 'symbol' not in item: continue
                    front_ticker = binance_to_frontend.get(item['symbol'])
                    if front_ticker:
                        updates.append({
                            "symbol": front_ticker,
                            "price": float(item.get('lastPrice', 0)),
                            "high": float(item.get('highPrice', 0)),
                            "low": float(item.get('lowPrice', 0)),
                            "volume": float(item.get('volume', 0)),
                            "timestamp": datetime.now().isoformat()
                        })
            except Exception as e:
                print(f"Error fetching Binance data: {e}")

        # Notify callbacks
        for update in updates:
            for cb in self.callbacks:
                await cb(update)

    async def start_polling(self, interval_seconds=10):
        while True:
            await self.fetch_data()
            await asyncio.sleep(interval_seconds)

provider = MarketDataProvider()
