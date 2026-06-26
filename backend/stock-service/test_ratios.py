import yfinance as yf
import pandas as pd
import json

def get_realtime_ratios(ticker_symbol):
    t = yf.Ticker(ticker_symbol)
    inc = t.income_stmt
    bal = t.balance_sheet
    info = t.info

    res = {}
    
    try:
        cost_of_revenue = inc.loc['Cost Of Revenue'].iloc[0] if 'Cost Of Revenue' in inc.index else None
        inventory = bal.loc['Inventory'].iloc[0] if 'Inventory' in bal.index else None
        if cost_of_revenue and inventory:
            res['investorTurnover'] = cost_of_revenue / inventory
    except Exception as e:
        res['investorTurnover_err'] = str(e)
        
    try:
        total_revenue = inc.loc['Total Revenue'].iloc[0] if 'Total Revenue' in inc.index else None
        accounts_receivable = bal.loc['Accounts Receivable'].iloc[0] if 'Accounts Receivable' in bal.index else None
        if total_revenue and accounts_receivable:
            res['receivablesTurnover'] = total_revenue / accounts_receivable
    except Exception as e:
        res['receivablesTurnover_err'] = str(e)

    try:
        ebit = inc.loc['EBIT'].iloc[0] if 'EBIT' in inc.index else None
        interest_expense = inc.loc['Interest Expense'].iloc[0] if 'Interest Expense' in inc.index else None
        if ebit and interest_expense and interest_expense != 0:
            res['interestCoverage'] = ebit / abs(interest_expense)
    except Exception as e:
        res['interestCoverage_err'] = str(e)

    try:
        total_debt = bal.loc['Total Debt'].iloc[0] if 'Total Debt' in bal.index else info.get('totalDebt')
        total_assets = bal.loc['Total Assets'].iloc[0] if 'Total Assets' in bal.index else None
        if total_debt and total_assets and total_assets != 0:
            res['debtToAssets'] = total_debt / total_assets
    except Exception as e:
        res['debtToAssets_err'] = str(e)

    return res

print(json.dumps(get_realtime_ratios('AAPL'), indent=2))
print(json.dumps(get_realtime_ratios('MSFT'), indent=2))
