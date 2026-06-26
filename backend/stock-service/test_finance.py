import yfinance as yf
import json
import numpy as np
import pandas as pd

def safe_float(v):
    if pd.isna(v) or np.isinf(v):
        return None
    return float(v)

ticker = yf.Ticker('AAPL')
inc = ticker.quarterly_income_stmt
bal = ticker.quarterly_balance_sheet

def format_df(df):
    if df is None or df.empty:
        return []
    
    result = []
    # Columns are dates
    for date_col in df.columns:
        period = date_col.strftime('%b %Y')
        data = {
            "period": period,
            "date": date_col.isoformat()
        }
        for row in df.index:
            data[row] = safe_float(df.loc[row, date_col])
        result.append(data)
    
    # Sort by date ascending
    result.sort(key=lambda x: x["date"])
    return result

data = {
    "quarterly_income_stmt": format_df(inc),
    "quarterly_balance_sheet": format_df(bal)
}

print(json.dumps(data, indent=2))
