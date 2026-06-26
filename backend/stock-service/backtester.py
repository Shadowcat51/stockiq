import yfinance as yf
import pandas as pd
import pandas_ta as ta
import numpy as np
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Rule(BaseModel):
    type: str # 'CROSS_ABOVE', 'CROSS_BELOW', 'GREATER_THAN', 'LESS_THAN'
    ind1: str # 'SMA', 'EMA', 'RSI', 'MACD', 'PRICE'
    param1: Optional[int] = None
    ind2: Optional[str] = None # 'SMA', 'EMA', 'RSI', 'MACD', 'PRICE', 'VALUE'
    param2: Optional[int] = None
    val: Optional[float] = None

class BacktestRequest(BaseModel):
    symbol: str
    startDate: str
    endDate: str
    initialCapital: float
    buyRules: List[Rule]
    sellRules: List[Rule]
    stopLossPct: Optional[float] = 0
    takeProfitPct: Optional[float] = 0

def calculate_indicator(df: pd.DataFrame, ind: str, param: int = None) -> pd.Series:
    if ind == 'PRICE':
        return df['Close']
    elif ind == 'SMA':
        return ta.sma(df['Close'], length=param or 14)
    elif ind == 'EMA':
        return ta.ema(df['Close'], length=param or 14)
    elif ind == 'RSI':
        return ta.rsi(df['Close'], length=param or 14)
    elif ind == 'MACD':
        # Returns MACD_12_26_9. We return the MACD line.
        macd = ta.macd(df['Close'])
        if macd is not None and not macd.empty:
            return macd.iloc[:, 0]
        return pd.Series(index=df.index)
    elif ind == 'MACD_SIGNAL':
        macd = ta.macd(df['Close'])
        if macd is not None and not macd.empty:
            return macd.iloc[:, 2] # The signal line
        return pd.Series(index=df.index)
    return pd.Series(index=df.index, data=0)

def evaluate_rule(rule: Rule, df: pd.DataFrame, i: int) -> bool:
    try:
        # Get values for current and previous bar
        col1 = f"{rule.ind1}_{rule.param1}" if rule.param1 else rule.ind1
        val1_curr = df[col1].iloc[i]
        val1_prev = df[col1].iloc[i-1] if i > 0 else val1_curr
        
        val2_curr = rule.val
        val2_prev = rule.val
        
        if rule.ind2 and rule.ind2 != 'VALUE':
            col2 = f"{rule.ind2}_{rule.param2}" if rule.param2 else rule.ind2
            val2_curr = df[col2].iloc[i]
            val2_prev = df[col2].iloc[i-1] if i > 0 else val2_curr
            
        if pd.isna(val1_curr) or pd.isna(val2_curr):
            return False
            
        if rule.type == 'GREATER_THAN':
            return val1_curr > val2_curr
        elif rule.type == 'LESS_THAN':
            return val1_curr < val2_curr
        elif rule.type == 'CROSS_ABOVE':
            return val1_prev <= val2_prev and val1_curr > val2_curr
        elif rule.type == 'CROSS_BELOW':
            return val1_prev >= val2_prev and val1_curr < val2_curr
            
    except Exception as e:
        return False
    return False

def run_backtest(req: BacktestRequest) -> Dict[str, Any]:
    # 1. Fetch Data
    ticker = yf.Ticker(req.symbol)
    df = ticker.history(start=req.startDate, end=req.endDate)
    if df.empty:
        raise ValueError(f"No data found for {req.symbol} between {req.startDate} and {req.endDate}")
        
    # 2. Compute Indicators
    for rule in req.buyRules + req.sellRules:
        col = f"{rule.ind1}_{rule.param1}" if rule.param1 else rule.ind1
        if col not in df.columns:
            df[col] = calculate_indicator(df, rule.ind1, rule.param1)
            
        if rule.ind2 and rule.ind2 != 'VALUE':
            col2 = f"{rule.ind2}_{rule.param2}" if rule.param2 else rule.ind2
            if col2 not in df.columns:
                df[col2] = calculate_indicator(df, rule.ind2, rule.param2)
                
    # 3. Simulation Loop
    capital = req.initialCapital
    position = 0 # Number of shares
    entry_price = 0
    trades = []
    equity_curve = []
    
    for i in range(len(df)):
        current_price = df['Close'].iloc[i]
        date_str = df.index[i].strftime('%Y-%m-%d')
        
        # Check Stop Loss / Take Profit first if holding position
        if position > 0:
            pnl_pct = ((current_price - entry_price) / entry_price) * 100
            
            sell_triggered = False
            sell_reason = ""
            
            if req.stopLossPct and req.stopLossPct > 0 and pnl_pct <= -req.stopLossPct:
                sell_triggered = True
                sell_reason = "STOP_LOSS"
            elif req.takeProfitPct and req.takeProfitPct > 0 and pnl_pct >= req.takeProfitPct:
                sell_triggered = True
                sell_reason = "TAKE_PROFIT"
            else:
                # Check custom sell rules
                if len(req.sellRules) > 0:
                    sell_triggered = all(evaluate_rule(r, df, i) for r in req.sellRules)
                    if sell_triggered:
                        sell_reason = "STRATEGY"
                        
            if sell_triggered:
                # Execute Sell
                pnl = (current_price - entry_price) * position
                capital += position * current_price
                trades.append({
                    "type": "SELL",
                    "date": date_str,
                    "price": round(current_price, 2),
                    "pnl": round(pnl, 2),
                    "pnlPct": round(pnl_pct, 2),
                    "reason": sell_reason
                })
                position = 0
                entry_price = 0
        else:
            # Check custom buy rules
            if len(req.buyRules) > 0:
                buy_triggered = all(evaluate_rule(r, df, i) for r in req.buyRules)
                if buy_triggered and capital > current_price:
                    # Execute Buy (Buy as much as possible)
                    position = capital // current_price
                    if position > 0:
                        entry_price = current_price
                        capital -= position * entry_price
                        trades.append({
                            "type": "BUY",
                            "date": date_str,
                            "price": round(current_price, 2),
                            "pnl": 0,
                            "pnlPct": 0,
                            "reason": "STRATEGY"
                        })
                        
        # Record Equity
        current_equity = capital + (position * current_price)
        equity_curve.append({
            "date": date_str,
            "equity": round(current_equity, 2)
        })
        
    # Force close position at the end
    if position > 0:
        current_price = df['Close'].iloc[-1]
        pnl = (current_price - entry_price) * position
        pnl_pct = ((current_price - entry_price) / entry_price) * 100
        capital += position * current_price
        trades.append({
            "type": "SELL",
            "date": df.index[-1].strftime('%Y-%m-%d'),
            "price": round(current_price, 2),
            "pnl": round(pnl, 2),
            "pnlPct": round(pnl_pct, 2),
            "reason": "END_OF_BACKTEST"
        })
        current_equity = capital
        equity_curve[-1]["equity"] = round(current_equity, 2)
        
    # Calculate Metrics
    total_return_pct = ((capital - req.initialCapital) / req.initialCapital) * 100
    
    # Win Rate
    winning_trades = len([t for t in trades if t['type'] == 'SELL' and t['pnl'] > 0])
    total_closed_trades = len([t for t in trades if t['type'] == 'SELL'])
    win_rate = (winning_trades / total_closed_trades * 100) if total_closed_trades > 0 else 0
    
    # Max Drawdown
    equity_series = pd.Series([e['equity'] for e in equity_curve])
    running_max = equity_series.cummax()
    drawdown = (equity_series - running_max) / running_max
    max_drawdown = drawdown.min() * 100 if not drawdown.empty else 0
    
    return {
        "metrics": {
            "totalReturnPct": round(total_return_pct, 2),
            "winRate": round(win_rate, 2),
            "maxDrawdown": round(max_drawdown, 2),
            "totalTrades": total_closed_trades,
            "finalCapital": round(capital, 2)
        },
        "equityCurve": equity_curve,
        "trades": trades
    }
