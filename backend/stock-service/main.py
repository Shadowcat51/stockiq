import os
import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from provider import provider
import psycopg2
import redis
from datetime import datetime

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start polling yfinance data
    task = asyncio.create_task(provider.start_polling(interval_seconds=10))
    yield
    task.cancel()

app = FastAPI(title="StockIQ Stock Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Register callback to provider
async def handle_market_update(data):
    await manager.broadcast(data)

provider.register_callback(handle_market_update)

# Configuration from environment variables
PG_USER = os.getenv("POSTGRES_USER", "stockiq_user")
PG_PASSWORD = os.getenv("POSTGRES_PASSWORD", "stockiq_password")
PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")
PG_DB = os.getenv("POSTGRES_DB", "stockiq_db")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")

@app.get("/health")
def health_check():
    status = {
        "status": "OK",
        "service": "Stock Service",
        "timestamp": datetime.now().isoformat(),
        "database": "Disconnected",
        "redis": "Disconnected"
    }

    # Check Database Connection
    try:
        conn = psycopg2.connect(
            dbname=PG_DB,
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port=PG_PORT
        )
        conn.close()
        status["database"] = "Connected"
    except Exception as e:
        status["database"] = f"Error: {str(e)}"

    # Check Redis Connection
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        r.ping()
        status["redis"] = "Connected"
    except Exception as e:
        status["redis"] = f"Error: {str(e)}"

    return status

@app.websocket("/ws/market/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    await manager.connect(websocket)
    provider.add_symbol(symbol)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        provider.remove_symbol(symbol)

import yfinance as yf
import requests
import requests
import requests

@app.get("/api/stocks/{symbol}")
async def get_stock_price(symbol: str, exchange: str = None):
    try:
        if symbol.startswith("BINANCE:") or (exchange and exchange.upper() == "BINANCE"):
            binance_symbol = symbol.replace("BINANCE:", "")
            res = await asyncio.to_thread(requests.get, f"https://api.binance.com/api/v3/ticker/24hr?symbol={binance_symbol}", timeout=5)
            if res.status_code == 200:
                data = res.json()
                return {
                    "symbol": symbol,
                    "current_price": float(data.get("lastPrice", 0)),
                    "change": float(data.get("priceChange", 0)),
                    "change_pct": float(data.get("priceChangePercent", 0)),
                    "volume": float(data.get("volume", 0))
                }
            return {"error": "Failed to fetch crypto price"}

        yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        is_idx = ("IDX:" in symbol) or (exchange and exchange.upper() == "IDX")
        if is_idx:
            yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
            
        ticker = yf.Ticker(yf_symbol)
        
        def fetch_fast_info():
            info = ticker.fast_info
            try:
                last_price = info.last_price
                last_volume = info.last_volume
                prev_close = info.previous_close
            except:
                # fallback if fast_info missing
                hist = ticker.history(period="2d")
                if len(hist) > 0:
                    last_price = float(hist["Close"].iloc[-1])
                    last_volume = float(hist["Volume"].iloc[-1])
                    prev_close = float(hist["Close"].iloc[0]) if len(hist) > 1 else last_price
                else:
                    return None

            return {
                "symbol": symbol,
                "current_price": last_price,
                "volume": last_volume,
                "previous_close": prev_close
            }
            
        data = await asyncio.to_thread(fetch_fast_info)
        if not data:
             return {"error": "No price data found"}
             
        change = data["current_price"] - data["previous_close"] if data["previous_close"] else 0
        change_pct = (change / data["previous_close"] * 100) if data["previous_close"] else 0
        
        return {
            "symbol": symbol,
            "current_price": data["current_price"],
            "change": change,
            "change_pct": change_pct,
            "volume": data["volume"]
        }
    except Exception as e:
        return {"error": str(e)}

from backtester import run_backtest, BacktestRequest

@app.post("/api/market/backtest")
async def process_backtest(req: BacktestRequest):
    try:
        def do_backtest():
            return run_backtest(req)
        
        result = await asyncio.to_thread(do_backtest)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.get("/api/stocks/{symbol}/stats")
async def get_stock_stats(symbol: str):
    try:
        if symbol.startswith("BINANCE:"):
            binance_symbol = symbol.replace("BINANCE:", "")
            def fetch_binance_stats():
                res = requests.get(f"https://api.binance.com/api/v3/ticker/24hr?symbol={binance_symbol}", timeout=10)
                res.raise_for_status()
                return res.json()
            
            data = await asyncio.to_thread(fetch_binance_stats)
            return {
                "marketCap": 0,
                "volume": float(data.get("quoteVolume", 0)),
                "sector": "Cryptocurrency",
                "fiftyTwoWeekHigh": float(data.get("highPrice", 0)),
                "fiftyTwoWeekLow": float(data.get("lowPrice", 0)),
                "enterpriseValue": 0,
                "dividendYield": 0,
                "industry": "Blockchain",
                "trailingPE": 0
            }

        yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        if "IDX:" in yf_symbol:
            yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
            
        # Use asyncio.to_thread to prevent blocking the event loop
        ticker = yf.Ticker(yf_symbol)
        info = await asyncio.to_thread(lambda: ticker.info)
        
        return {
            "marketCap": info.get("marketCap", 0),
            "volume": info.get("volume", 0),
            "sector": info.get("sector", "N/A"),
            "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh", 0),
            "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow", 0),
            "enterpriseValue": info.get("enterpriseValue", 0),
            "dividendYield": info.get("dividendYield", 0),
            "industry": info.get("industry", "N/A"),
            "trailingPE": info.get("trailingPE", 0)
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/stocks/{symbol}/fundamental")
async def get_stock_fundamental(symbol: str):
    try:
        if symbol.startswith("BINANCE:"):
            return {
                "analystRating": {"strongBuy": 0, "buy": 0, "hold": 0, "sell": 0, "strongSell": 0, "total": 0},
                "priceTarget": {"current": 0, "low": 0, "mean": 0, "high": 0},
                "earnings": [],
                "companySummary": {
                    "revenue": 0, "grossProfit": 0, "netIncome": 0,
                    "eps": 0, "ebitda": 0, "adjustedEps": 0
                },
                "keyRatios": {
                    "valuation": {"pe": 0, "ps": 0, "pb": 0, "evEbitda": 0},
                    "profitability": {"grossMargin": 0, "netMargin": 0, "roe": 0, "roa": 0},
                    "dividend": {"yield": 0, "payoutRatio": 0},
                    "liquidity": {"currentRatio": 0, "quickRatio": 0, "investorTurnover": 0, "receivablesTurnover": 0},
                    "solvency": {"interestCoverage": 0, "debtToAssets": 0, "debtToEquity": 0}
                }
            }

        yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        if "IDX:" in yf_symbol:
            yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
            
        ticker = yf.Ticker(yf_symbol)
        
        def fetch_fundamental():
            import pandas as pd
            info = ticker.info
            
            recs = None
            try:
                recs = ticker.recommendations
            except Exception as e:
                print(f"Error fetching recommendations: {e}")
                
            earnings = None
            try:
                earnings = ticker.earnings_dates
            except Exception as e:
                print(f"Error fetching earnings dates: {e}")
            
            # 1. Analyst Ratings
            analyst_rating = {"strongBuy": 0, "buy": 0, "hold": 0, "sell": 0, "strongSell": 0, "total": 0}
            if recs is not None and not recs.empty:
                latest_rec = recs.iloc[0] # The first row is typically the most recent period (e.g., 0m)
                try:
                    analyst_rating["strongBuy"] = int(latest_rec.get("strongBuy", 0))
                    analyst_rating["buy"] = int(latest_rec.get("buy", 0))
                    analyst_rating["hold"] = int(latest_rec.get("hold", 0))
                    analyst_rating["sell"] = int(latest_rec.get("sell", 0))
                    analyst_rating["strongSell"] = int(latest_rec.get("strongSell", 0))
                    analyst_rating["total"] = sum([
                        analyst_rating["strongBuy"], analyst_rating["buy"], analyst_rating["hold"], 
                        analyst_rating["sell"], analyst_rating["strongSell"]
                    ])
                except Exception:
                    pass
            
            if analyst_rating["total"] == 0:
                analyst_rating["total"] = info.get("numberOfAnalystOpinions", 0)
                if analyst_rating["total"] > 0:
                    analyst_rating["buy"] = int(analyst_rating["total"] * 0.5)
                    analyst_rating["hold"] = int(analyst_rating["total"] * 0.4)
                    analyst_rating["sell"] = int(analyst_rating["total"] * 0.1)

            # 2. Price Target
            price_target = {
                "current": info.get("currentPrice", 0),
                "low": info.get("targetLowPrice", 0),
                "mean": info.get("targetMeanPrice", 0),
                "high": info.get("targetHighPrice", 0)
            }

            # 3. Earnings
            earnings_list = []
            if earnings is not None and not earnings.empty:
                # Take the last 4 reported and 1 future estimate
                # Earnings dates are usually sorted newest first
                recent_earnings = earnings.head(8)
                for index, row in recent_earnings.iterrows():
                    period_str = index.strftime("%b %y") if pd.notna(index) else "Unknown"
                    actual = row.get("Reported EPS", None)
                    estimate = row.get("EPS Estimate", None)
                    
                    if pd.isna(actual) and pd.isna(estimate):
                        continue
                        
                    earnings_list.append({
                        "period": period_str,
                        "actual": float(actual) if pd.notna(actual) else None,
                        "estimate": float(estimate) if pd.notna(estimate) else None
                    })
                # Reverse to chronological order
                earnings_list.reverse()
            
            # 4. Company Summary
            company_summary = {
                "revenue": info.get("totalRevenue", 0),
                "grossProfit": info.get("grossProfits", 0),
                "netIncome": info.get("netIncomeToCommon", 0),
                "eps": info.get("trailingEps", 0),
                "ebitda": info.get("ebitda", 0),
                "adjustedEps": info.get("forwardEps", 0)
            }
            
            # Calculate additional ratios
            inc = ticker.income_stmt
            bal = ticker.balance_sheet
            
            investor_turnover = 0
            receivables_turnover = 0
            interest_coverage = 0
            debt_to_assets = 0
            
            def safe_div(a, b):
                if a is None or b is None or pd.isna(a) or pd.isna(b) or b == 0:
                    return 0
                return float(a / b)
                
            try:
                if not inc.empty and not bal.empty:
                    cost_of_rev = inc.loc['Cost Of Revenue'].iloc[0] if 'Cost Of Revenue' in inc.index else None
                    inventory = bal.loc['Inventory'].iloc[0] if 'Inventory' in bal.index else None
                    investor_turnover = safe_div(cost_of_rev, inventory)
                    
                    total_rev = inc.loc['Total Revenue'].iloc[0] if 'Total Revenue' in inc.index else None
                    accounts_rec = bal.loc['Accounts Receivable'].iloc[0] if 'Accounts Receivable' in bal.index else None
                    receivables_turnover = safe_div(total_rev, accounts_rec)
                    
                    ebit = inc.loc['EBIT'].iloc[0] if 'EBIT' in inc.index else None
                    interest_exp = inc.loc['Interest Expense'].iloc[0] if 'Interest Expense' in inc.index else None
                    interest_coverage = safe_div(ebit, abs(interest_exp) if interest_exp else None)
                    
                    total_debt = bal.loc['Total Debt'].iloc[0] if 'Total Debt' in bal.index else info.get('totalDebt')
                    total_assets = bal.loc['Total Assets'].iloc[0] if 'Total Assets' in bal.index else None
                    debt_to_assets = safe_div(total_debt, total_assets)
            except Exception as e:
                print(f"Error calculating ratios: {e}")
            
            # 5. Key Ratios
            key_ratios = {
                "valuation": {
                    "pe": info.get("trailingPE", 0),
                    "ps": info.get("priceToSalesTrailing12Months", 0),
                    "pb": info.get("priceToBook", 0),
                    "evEbitda": info.get("enterpriseToEbitda", 0)
                },
                "profitability": {
                    "grossMargin": (info.get("grossMargins", 0) or 0) * 100,
                    "netMargin": (info.get("profitMargins", 0) or 0) * 100,
                    "roe": (info.get("returnOnEquity", 0) or 0) * 100,
                    "roa": (info.get("returnOnAssets", 0) or 0) * 100
                },
                "dividend": {
                    "yield": (info.get("dividendYield", 0) or 0) * 100,
                    "payoutRatio": info.get("payoutRatio", 0)
                },
                "liquidity": {
                    "currentRatio": info.get("currentRatio", 0),
                    "quickRatio": info.get("quickRatio", 0),
                    "investorTurnover": investor_turnover,
                    "receivablesTurnover": receivables_turnover
                },
                "solvency": {
                    "interestCoverage": interest_coverage,
                    "debtToAssets": debt_to_assets,
                    "debtToEquity": (info.get("debtToEquity", 0) or 0) / 100 # yfinance returns percentage
                }
            }
            
            return {
                "analystRating": analyst_rating,
                "priceTarget": price_target,
                "earnings": earnings_list,
                "companySummary": company_summary,
                "keyRatios": key_ratios
            }

        data = await asyncio.to_thread(fetch_fundamental)
        return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/stocks/{symbol}/technical")
async def get_stock_technical(symbol: str, interval: str = "1d"):
    try:
        if symbol.startswith("BINANCE:"):
            binance_symbol = symbol.replace("BINANCE:", "")
            
            binance_interval = interval
            if interval == "1mo":
                binance_interval = "1M"
            elif interval == "1wk":
                binance_interval = "1w"
                
            def fetch_binance_technical():
                import pandas as pd
                import pandas_ta as ta
                res = requests.get(f"https://api.binance.com/api/v3/klines?symbol={binance_symbol}&interval={binance_interval}&limit=500", timeout=10)
                res.raise_for_status()
                data = res.json()
                
                df = pd.DataFrame(data, columns=['timestamp', 'Open', 'High', 'Low', 'Close', 'Volume', 'close_time', 'quote_av', 'trades', 'tb_base_av', 'tb_quote_av', 'ignore'])
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                df.set_index('timestamp', inplace=True)
                for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
                    df[col] = df[col].astype(float)
                
                if df.empty:
                    return {"candles": [], "indicators": {"sma20": [], "sma50": [], "rsi": [], "macd": []}}
                
                df['SMA_20'] = ta.sma(df['Close'], length=20)
                df['SMA_50'] = ta.sma(df['Close'], length=50)
                df['RSI_14'] = ta.rsi(df['Close'], length=14)
                
                macd = ta.macd(df['Close'])
                if macd is not None and not macd.empty:
                    df = df.join(macd)
                
                candles = []
                for idx, row in df.iterrows():
                    candles.append({
                        "time": int(idx.timestamp()),
                        "open": float(row['Open']),
                        "high": float(row['High']),
                        "low": float(row['Low']),
                        "close": float(row['Close']),
                        "volume": float(row['Volume'])
                    })
                    
                indicators = {
                    "sma20": [{"time": int(idx.timestamp()), "value": float(row['SMA_20']) if pd.notna(row.get('SMA_20')) else None} for idx, row in df.iterrows()],
                    "sma50": [{"time": int(idx.timestamp()), "value": float(row['SMA_50']) if pd.notna(row.get('SMA_50')) else None} for idx, row in df.iterrows()],
                    "rsi": [{"time": int(idx.timestamp()), "value": float(row['RSI_14']) if pd.notna(row.get('RSI_14')) else None} for idx, row in df.iterrows()]
                }
                
                macd_col = [c for c in df.columns if c.startswith('MACD_') and len(c.split('_')) == 4]
                macdh_col = [c for c in df.columns if c.startswith('MACDh_')]
                macds_col = [c for c in df.columns if c.startswith('MACDs_')]
                
                macd_data = []
                if macd_col and macdh_col and macds_col:
                    macd_name = macd_col[0]
                    macds_name = macds_col[0]
                    macdh_name = macdh_col[0]
                    
                    for idx, row in df.iterrows():
                        macd_data.append({
                            "time": int(idx.timestamp()),
                            "macd": float(row[macd_name]) if pd.notna(row.get(macd_name)) else None,
                            "signal": float(row[macds_name]) if pd.notna(row.get(macds_name)) else None,
                            "histogram": float(row[macdh_name]) if pd.notna(row.get(macdh_name)) else None
                        })
                indicators["macd"] = macd_data
                
                last_row = df.iloc[-1]
                rsi_val = float(last_row['RSI_14']) if pd.notna(last_row.get('RSI_14')) else 50
                macd_val = float(last_row.get(macd_col[0], 0)) if macd_col and pd.notna(last_row.get(macd_col[0])) else 0
                signal_val = float(last_row.get(macds_col[0], 0)) if macds_col and pd.notna(last_row.get(macds_col[0])) else 0
                
                osc_buy = 0
                osc_sell = 0
                osc_neutral = 0
                oscillators = []
                
                if rsi_val < 30:
                    osc_buy += 1
                    oscillators.append({"name": "Relative Strength Index (14)", "value": rsi_val, "action": "Buy"})
                elif rsi_val > 70:
                    osc_sell += 1
                    oscillators.append({"name": "Relative Strength Index (14)", "value": rsi_val, "action": "Sell"})
                else:
                    osc_neutral += 1
                    oscillators.append({"name": "Relative Strength Index (14)", "value": rsi_val, "action": "Neutral"})
                    
                if macd_val > signal_val:
                    osc_buy += 1
                    oscillators.append({"name": "MACD Level (12, 26)", "value": macd_val, "action": "Buy"})
                elif macd_val < signal_val:
                    osc_sell += 1
                    oscillators.append({"name": "MACD Level (12, 26)", "value": macd_val, "action": "Sell"})
                else:
                    osc_neutral += 1
                    oscillators.append({"name": "MACD Level (12, 26)", "value": macd_val, "action": "Neutral"})
                
                current_price = float(last_row['Close'])
                
                return {
                    "candles": candles,
                    "indicators": indicators,
                    "oscillators": {
                        "buy": osc_buy,
                        "sell": osc_sell,
                        "neutral": osc_neutral,
                        "items": oscillators
                    },
                    "currentPrice": current_price
                }
            
            data = await asyncio.to_thread(fetch_binance_technical)
            return data

        yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        if "IDX:" in yf_symbol:
            yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
            
        ticker = yf.Ticker(yf_symbol)
        
        # Run synchronous yfinance calls in a thread
        def fetch_data():
            info = ticker.info
            # Determine appropriate period based on interval
            # We need at least 200 bars for the MA 200
            if interval == "1d": period = "1y"
            elif interval == "1h": period = "60d" # Max for 1h is 730d, 60d is ~420 bars
            elif interval == "15m": period = "15d" # Max for 15m is 60d, 15d is ~390 bars
            elif interval == "5m": period = "5d" # Max for 5m is 60d, 5d is ~390 bars
            else: period = "1y"
            
            hist = ticker.history(period=period, interval=interval)
            return info, hist
            
        info, hist = await asyncio.to_thread(fetch_data)
        import pandas as pd
        import pandas_ta as ta
        import math
        
        current_price = info.get("currentPrice", 0)
        
        if current_price == 0 and len(hist) > 0:
            current_price = float(hist['Close'].iloc[-1])
            
        # 1. Pivot Points Calculation (Classic)
        # Using previous day data (or latest available)
        pivot = r1 = r2 = r3 = s1 = s2 = s3 = 0
        if len(hist) > 1:
            prev_day = hist.iloc[-2] # yesterday
            high = float(prev_day['High'])
            low = float(prev_day['Low'])
            close = float(prev_day['Close'])
            
            pivot = (high + low + close) / 3
            r1 = (2 * pivot) - low
            s1 = (2 * pivot) - high
            r2 = pivot + (high - low)
            s2 = pivot - (high - low)
            r3 = high + 2 * (pivot - low)
            s3 = low - 2 * (high - pivot)

        # Ensure we have enough data to calculate TA
        if len(hist) > 200:
            # 2. Trend Following (MAs)
            hist.ta.sma(length=5, append=True)
            hist.ta.sma(length=10, append=True)
            hist.ta.sma(length=20, append=True)
            hist.ta.sma(length=50, append=True)
            hist.ta.sma(length=100, append=True)
            hist.ta.sma(length=200, append=True)
            
            hist.ta.ema(length=5, append=True)
            hist.ta.ema(length=10, append=True)
            hist.ta.ema(length=20, append=True)
            hist.ta.ema(length=50, append=True)
            hist.ta.ema(length=100, append=True)
            hist.ta.ema(length=200, append=True)

            # SuperTrend (ATR period 10, multiplier 3)
            hist.ta.supertrend(length=10, multiplier=3, append=True)
            
            # Oscillators
            hist.ta.rsi(length=14, append=True)
            hist.ta.stoch(append=True) 
            hist.ta.macd(append=True)  
            hist.ta.adx(length=14, append=True) 
            hist.ta.cci(length=14, append=True)
            hist.ta.ao(append=True)
            hist.ta.mom(length=10, append=True)
            hist.ta.willr(length=14, append=True)
            hist.ta.uo(append=True)

            latest = hist.iloc[-1]

            def get_ma_signal(val, price):
                if pd.isna(val): return "Neutral"
                return "Buy" if price > val else "Sell"

            trend_following = {
                "sma": [
                    {"period": 5, "value": latest.get('SMA_5', 0), "signal": get_ma_signal(latest.get('SMA_5'), current_price)},
                    {"period": 10, "value": latest.get('SMA_10', 0), "signal": get_ma_signal(latest.get('SMA_10'), current_price)},
                    {"period": 20, "value": latest.get('SMA_20', 0), "signal": get_ma_signal(latest.get('SMA_20'), current_price)},
                    {"period": 50, "value": latest.get('SMA_50', 0), "signal": get_ma_signal(latest.get('SMA_50'), current_price)},
                    {"period": 100, "value": latest.get('SMA_100', 0), "signal": get_ma_signal(latest.get('SMA_100'), current_price)},
                    {"period": 200, "value": latest.get('SMA_200', 0), "signal": get_ma_signal(latest.get('SMA_200'), current_price)},
                ],
                "ema": [
                    {"period": 5, "value": latest.get('EMA_5', 0), "signal": get_ma_signal(latest.get('EMA_5'), current_price)},
                    {"period": 10, "value": latest.get('EMA_10', 0), "signal": get_ma_signal(latest.get('EMA_10'), current_price)},
                    {"period": 20, "value": latest.get('EMA_20', 0), "signal": get_ma_signal(latest.get('EMA_20'), current_price)},
                    {"period": 50, "value": latest.get('EMA_50', 0), "signal": get_ma_signal(latest.get('EMA_50'), current_price)},
                    {"period": 100, "value": latest.get('EMA_100', 0), "signal": get_ma_signal(latest.get('EMA_100'), current_price)},
                    {"period": 200, "value": latest.get('EMA_200', 0), "signal": get_ma_signal(latest.get('EMA_200'), current_price)},
                ],
                "superTrend": {
                    "value": latest.get('SUPERT_10_3.0', 0), 
                    "signal": "Buy" if latest.get('SUPERTd_10_3.0', 1) == 1 else "Sell"
                }
            }

            def rsi_signal(val):
                if pd.isna(val): return "Neutral"
                return "Buy" if val < 30 else ("Sell" if val > 70 else "Neutral")
            
            def stoch_signal(k, d):
                if pd.isna(k) or pd.isna(d): return "Neutral"
                return "Buy" if k < 20 and d < 20 else ("Sell" if k > 80 and d > 80 else "Neutral")

            def macd_signal(macd, signal):
                if pd.isna(macd) or pd.isna(signal): return "Neutral"
                return "Buy" if macd > signal else "Sell"

            def adx_signal(adx, dmp, dmn):
                if pd.isna(adx): return "Neutral"
                if adx > 25:
                    return "Buy" if dmp > dmn else "Sell"
                return "Neutral"

            def cci_signal(val):
                if pd.isna(val): return "Neutral"
                return "Buy" if val < -100 else ("Sell" if val > 100 else "Neutral")
                
            def willr_signal(val):
                if pd.isna(val): return "Neutral"
                return "Buy" if val < -80 else ("Sell" if val > -20 else "Neutral")

            def ao_signal(val):
                if pd.isna(val): return "Neutral"
                return "Buy" if val > 0 else "Sell"
                
            def mom_signal(val):
                if pd.isna(val): return "Neutral"
                return "Buy" if val > 0 else "Sell"

            oscillators = [
                {"name": "RSI (14)", "value": latest.get('RSI_14', 0), "signal": rsi_signal(latest.get('RSI_14'))},
                {"name": "Stochastic (14, 3, 3)", "value": latest.get('STOCHk_14_3_3', 0), "signal": stoch_signal(latest.get('STOCHk_14_3_3'), latest.get('STOCHd_14_3_3'))},
                {"name": "MACD (12, 26)", "value": latest.get('MACD_12_26_9', 0), "signal": macd_signal(latest.get('MACD_12_26_9'), latest.get('MACDs_12_26_9'))},
                {"name": "ADX (14)", "value": latest.get('ADX_14', 0), "signal": adx_signal(latest.get('ADX_14'), latest.get('DMP_14'), latest.get('DMN_14'))},
                {"name": "CCI (14)", "value": latest.get('CCI_14_0.015', 0), "signal": cci_signal(latest.get('CCI_14_0.015'))},
                {"name": "Awesome Oscillator", "value": latest.get('AO_5_34', 0), "signal": ao_signal(latest.get('AO_5_34'))},
                {"name": "Momentum (10)", "value": latest.get('MOM_10', 0), "signal": mom_signal(latest.get('MOM_10'))},
                {"name": "Williams Percent Range (14)", "value": latest.get('WILLR_14', 0), "signal": willr_signal(latest.get('WILLR_14'))},
                {"name": "Ultimate Oscillator (7, 14, 28)", "value": latest.get('UO_7_14_28', 0), "signal": "Neutral"}
            ]

        else:
            # Fallback if not enough data
            trend_following = {"sma": [], "ema": [], "superTrend": {"value": 0, "signal": "Neutral"}}
            oscillators = []

        def clean_val(v):
            if isinstance(v, float) and math.isnan(v): return 0
            return v
            
        for group in [trend_following.get("sma", []), trend_following.get("ema", []), oscillators]:
            for item in group:
                item["value"] = clean_val(item["value"])
        trend_following["superTrend"]["value"] = clean_val(trend_following.get("superTrend", {}).get("value", 0))

        # Count signals for Trend Following
        trend_bullish = sum(1 for ma in trend_following.get("sma", []) if ma.get("signal") == "Buy") + sum(1 for ma in trend_following.get("ema", []) if ma.get("signal") == "Buy")
        trend_bearish = sum(1 for ma in trend_following.get("sma", []) if ma.get("signal") == "Sell") + sum(1 for ma in trend_following.get("ema", []) if ma.get("signal") == "Sell")
        if trend_following.get("superTrend", {}).get("signal") == "Buy": trend_bullish += 1 
        elif trend_following.get("superTrend", {}).get("signal") == "Sell": trend_bearish += 1

        osc_bullish = sum(1 for o in oscillators if o.get("signal") == "Buy")
        osc_bearish = sum(1 for o in oscillators if o.get("signal") == "Sell")
        osc_neutral = sum(1 for o in oscillators if o.get("signal") == "Neutral")

        # Overall summary
        total_bullish = trend_bullish + osc_bullish
        total_bearish = trend_bearish + osc_bearish
        total_neutral = osc_neutral
        
        overall_signal = "Neutral"
        if total_bullish > total_bearish * 1.5:
            overall_signal = "Strong Bullish"
        elif total_bullish > total_bearish:
            overall_signal = "Bullish"
        elif total_bearish > total_bullish * 1.5:
            overall_signal = "Strong Bearish"
        elif total_bearish > total_bullish:
            overall_signal = "Bearish"

        candles = []
        for idx, row in hist.iterrows():
            candles.append({
                "time": int(idx.timestamp()),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": float(row['Volume'])
            })

        return {
            "candles": candles,
            "summary": {
                "signal": overall_signal,
                "bullish": total_bullish,
                "bearish": total_bearish,
                "neutral": total_neutral
            },
            "pivotPoints": {
                "r3": r3, "r2": r2, "r1": r1, "p": pivot, "s1": s1, "s2": s2, "s3": s3
            },
            "trendFollowing": {
                "bullish": trend_bullish,
                "bearish": trend_bearish,
                "neutral": 0,
                "sma": trend_following["sma"],
                "ema": trend_following["ema"],
                "superTrend": trend_following["superTrend"]
            },
            "oscillators": {
                "bullish": osc_bullish,
                "bearish": osc_bearish,
                "neutral": osc_neutral,
                "items": oscillators
            },
            "currentPrice": current_price
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/stocks/{symbol}/finance")
async def get_stock_finance(symbol: str):
    try:
        if symbol.startswith("BINANCE:"):
            return {
                "yearly_income_stmt": [],
                "quarterly_income_stmt": [],
                "yearly_balance_sheet": [],
                "quarterly_balance_sheet": [],
                "yearly_cash_flow": [],
                "quarterly_cash_flow": []
            }

        yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        if "IDX:" in yf_symbol:
            yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
            
        ticker = yf.Ticker(yf_symbol)
        
        def fetch_finance():
            import pandas as pd
            import numpy as np

            def safe_float(v):
                if pd.isna(v) or np.isinf(v):
                    return None
                return float(v)

            def format_df(df):
                if df is None or df.empty:
                    return []
                result = []
                for date_col in df.columns:
                    period = date_col.strftime('%b %Y')
                    data = {
                        "period": period,
                        "date": date_col.isoformat()
                    }
                    for row in df.index:
                        data[row] = safe_float(df.loc[row, date_col])
                    result.append(data)
                result.sort(key=lambda x: x["date"])
                return result

            inc = ticker.income_stmt
            q_inc = ticker.quarterly_income_stmt
            bal = ticker.balance_sheet
            q_bal = ticker.quarterly_balance_sheet
            cf = ticker.cash_flow
            q_cf = ticker.quarterly_cash_flow
            
            return {
                "yearly_income_stmt": format_df(inc),
                "quarterly_income_stmt": format_df(q_inc),
                "yearly_balance_sheet": format_df(bal),
                "quarterly_balance_sheet": format_df(q_bal),
                "yearly_cash_flow": format_df(cf),
                "quarterly_cash_flow": format_df(q_cf)
            }
            
        data = await asyncio.to_thread(fetch_finance)
        return data
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/stocks/{symbol}/actions")
async def get_stock_actions(symbol: str):
    try:
        if symbol.startswith("BINANCE:"):
            return []

        yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        if "IDX:" in yf_symbol:
            yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
            
        ticker = yf.Ticker(yf_symbol)
        
        def fetch_actions():
            import pandas as pd
            actions_df = ticker.actions
            if actions_df is None or actions_df.empty:
                return []
                
            results = []
            for date_col in actions_df.index:
                row = actions_df.loc[date_col]
                # Sometimes a date can have multiple actions or it's a single series
                if isinstance(row, pd.Series):
                    div = float(row.get('Dividends', 0))
                    split = float(row.get('Stock Splits', 0))
                else:
                    div = float(row.iloc[0].get('Dividends', 0))
                    split = float(row.iloc[0].get('Stock Splits', 0))
                    
                if div > 0 or split > 0:
                    results.append({
                        "date": date_col.isoformat(),
                        "dividends": div,
                        "splits": split
                    })
                    
            results.sort(key=lambda x: x["date"], reverse=True)
            return results
            
        data = await asyncio.to_thread(fetch_actions)
        return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/stocks/{symbol}/profile")
async def get_stock_profile(symbol: str):
    try:
        if symbol.startswith("BINANCE:"):
            # Crypto fallback profile
            return {
                "longBusinessSummary": "A cryptocurrency asset. Details might be limited as it is decentralized.",
                "industry": "Blockchain",
                "sector": "Cryptocurrency",
                "website": "https://coinmarketcap.com/",
                "country": "Global",
                "city": "Decentralized",
                "fullTimeEmployees": "N/A"
            }

        yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
        if "IDX:" in yf_symbol:
            yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
            
        ticker = yf.Ticker(yf_symbol)
        
        def fetch_profile():
            info = ticker.info
            return {
                "longBusinessSummary": info.get("longBusinessSummary", "No description available for this symbol."),
                "industry": info.get("industry", "N/A"),
                "sector": info.get("sector", "N/A"),
                "website": info.get("website", ""),
                "country": info.get("country", "N/A"),
                "city": info.get("city", "N/A"),
                "fullTimeEmployees": info.get("fullTimeEmployees", "N/A")
            }
            
        data = await asyncio.to_thread(fetch_profile)
        return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/stocks/{symbol}/news")
async def get_stock_news(symbol: str):
    try:
        if symbol.startswith("BINANCE:"):
            # Mock or fetch crypto news if possible. We will just use Yahoo with crypto ticker.
            yf_symbol = symbol.replace("BINANCE:", "") + "-USD"
        else:
            yf_symbol = symbol.replace("NASDAQ:", "").replace("NYSE:", "")
            if "IDX:" in yf_symbol:
                yf_symbol = yf_symbol.replace("IDX:", "") + ".JK"
            
        ticker = yf.Ticker(yf_symbol)
        
        def fetch_news():
            import dateutil.parser
            import urllib.request
            import urllib.parse
            import xml.etree.ElementTree as ET
            
            results = []
            is_indo = ".JK" in yf_symbol
            base_symbol = yf_symbol.replace(".JK", "")
            
            # 1. Fetch from yfinance
            news_items = ticker.news
            if news_items:
                for item in news_items:
                    if not isinstance(item, dict):
                        continue
                        
                    content = item.get("content") or item
                    if not isinstance(content, dict):
                        continue
                    
                    title = content.get("title", "")
                    provider = content.get("provider", {}).get("displayName", "") if isinstance(content.get("provider"), dict) else ""
                    link = content.get("clickThroughUrl", {}).get("url", "") if isinstance(content.get("clickThroughUrl"), dict) else ""
                    
                    pub_date_str = content.get("pubDate", "")
                    unix_time = 0
                    if pub_date_str:
                        try:
                            unix_time = int(dateutil.parser.parse(pub_date_str).timestamp())
                        except:
                            pass
                    else:
                        unix_time = content.get("providerPublishTime", 0)
                    
                    thumbnail = ""
                    thumb_obj = content.get("thumbnail")
                    if isinstance(thumb_obj, dict) and thumb_obj.get("resolutions") and isinstance(thumb_obj["resolutions"], list):
                        thumbnail = thumb_obj["resolutions"][0].get("url", "") if isinstance(thumb_obj["resolutions"][0], dict) else ""
                    
                    results.append({
                        "title": title,
                        "publisher": provider,
                        "link": link,
                        "providerPublishTime": unix_time,
                        "thumbnail": thumbnail
                    })
            
            # 2. Supplement with Bing News RSS using pagination until we have 20 items
            bing_page = 0
            while len(results) < 20 and bing_page < 3:
                try:
                    first_param = "" if bing_page == 0 else f"&first={bing_page * 10 + 1}"
                    if is_indo:
                        search_query = urllib.parse.quote_plus(f"saham {base_symbol}")
                        url = f"https://www.bing.com/news/search?q={search_query}&format=rss&mkt=id-ID&cc=ID{first_param}"
                    else:
                        search_query = urllib.parse.quote_plus(f"{base_symbol} stock")
                        url = f"https://www.bing.com/news/search?q={search_query}&format=rss{first_param}"
                        
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
                    resp = urllib.request.urlopen(req, timeout=5)
                    root = ET.fromstring(resp.read())
                    
                    existing_titles = {r["title"].lower() for r in results}
                    
                    items_found = False
                    for item in root.findall('.//item'):
                        if len(results) >= 20:
                            break
                        items_found = True
                        title = item.findtext('title') or ""
                        
                        publisher = "News"
                        thumbnail = ""
                        for child in item:
                            if child.tag.endswith('Source'):
                                publisher = child.text or "News"
                            elif child.tag.endswith('Image'):
                                thumbnail = child.text or ""
                                
                        if title.lower() in existing_titles:
                            continue
                            
                        link = item.findtext('link') or ""
                        pub_date_str = item.findtext('pubDate') or ""
                        unix_time = 0
                        if pub_date_str:
                            try:
                                unix_time = int(dateutil.parser.parse(pub_date_str).timestamp())
                            except:
                                pass
                                
                        results.append({
                            "title": title,
                            "publisher": publisher,
                            "link": link,
                            "providerPublishTime": unix_time,
                            "thumbnail": thumbnail
                        })
                        
                    if not items_found:
                        break # no more items from Bing
                except Exception as e:
                    print(f"Error fetching Bing News: {e}")
                    break
                
                bing_page += 1
            
            # 4. Fallback: fetch og:image for any missing thumbnails
            import concurrent.futures
            import re
            
            def get_og_image(item_index):
                link = results[item_index]["link"]
                try:
                    req = urllib.request.Request(link, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
                    html = urllib.request.urlopen(req, timeout=4).read().decode('utf-8', errors='ignore')
                    m = re.search(r'<meta.*?property=[\'"]og:image[\'"].*?content=[\'"]([^\'"]+)[\'"]', html, re.I | re.DOTALL)
                    if not m:
                        m = re.search(r'<meta.*?content=[\'"]([^\'"]+)[\'"].*?property=[\'"]og:image[\'"]', html, re.I | re.DOTALL)
                    if m:
                        img = m.group(1)
                        if "googleusercontent.com" not in img:
                            return (item_index, img)
                except Exception:
                    pass
                return (item_index, "")
            
            missing_indices = []
            for i, r in enumerate(results):
                if not r.get("thumbnail") or "googleusercontent.com" in r["thumbnail"]:
                    missing_indices.append(i)
                    
            if missing_indices:
                with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
                    for idx, img in executor.map(get_og_image, missing_indices):
                        if img:
                            results[idx]["thumbnail"] = img
                            
            return results
            
        data = await asyncio.to_thread(fetch_news)
        return data
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
