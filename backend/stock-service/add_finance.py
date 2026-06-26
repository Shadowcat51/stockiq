import sys

file_path = "d:/Projek/stockiq/backend/stock-service/main.py"
with open(file_path, "r") as f:
    lines = f.readlines()

insert_idx = -1
for i, line in enumerate(lines):
    if line.strip().startswith('if __name__ == "__main__":'):
        insert_idx = i
        break

if insert_idx == -1:
    print("Could not find __name__ == '__main__'")
    sys.exit(1)

code_to_insert = """
@app.get("/api/stocks/{symbol}/finance")
async def get_stock_finance(symbol: str):
    try:
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
            
            return {
                "yearly_income_stmt": format_df(inc),
                "quarterly_income_stmt": format_df(q_inc),
                "yearly_balance_sheet": format_df(bal),
                "quarterly_balance_sheet": format_df(q_bal)
            }
            
        data = await asyncio.to_thread(fetch_finance)
        return data
    except Exception as e:
        return {"error": str(e)}

"""

lines.insert(insert_idx, code_to_insert)

with open(file_path, "w") as f:
    f.writelines(lines)

print("Successfully added endpoint.")
