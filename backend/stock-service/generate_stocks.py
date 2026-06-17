import pandas as pd
import requests
import json
import os

print("Fetching US stocks (S&P 500)...")
us_stocks = []
try:
    headers = {'User-Agent': 'Mozilla/5.0'}
    r = requests.get('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies', headers=headers)
    tables = pd.read_html(r.text)
    df_us = tables[0]
    for _, row in df_us.iterrows():
        us_stocks.append({
            "symbol": str(row["Symbol"]).replace('.', '-'),
            "name": str(row["Security"]),
            "type": "EQUITY",
            "region": "US"
        })
except Exception as e:
    print("Error fetching US stocks:", e)

print("Fetching ID stocks...")
id_stocks = []

try:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
    }
    # Fetch from idx.co.id or any open JSON. Let's try GoTo / public API
    r = requests.get('https://raw.githubusercontent.com/Fahli/idx-stocks/master/stocks.json', headers=headers)
    if r.status_code == 200:
        data = r.json()
        for item in data:
            id_stocks.append({
                "symbol": item["ticker"] + ".JK",
                "name": item["name"],
                "type": "EQUITY",
                "region": "ID"
            })
    else:
        # Fallback to another known open source list
        r = requests.get('https://raw.githubusercontent.com/yusufryanda/indonesia-stock-exchange/master/data/stock_list.json', headers=headers)
        if r.status_code == 200:
            data = r.json()
            for item in data:
                id_stocks.append({
                    "symbol": item["symbol"] + ".JK",
                    "name": item.get("name", item["symbol"]),
                    "type": "EQUITY",
                    "region": "ID"
                })
except Exception as e:
    pass

# Generate hardcoded 500 ID stocks if needed
if len(id_stocks) < 500:
    import string
    import random
    # Let's generate dummy ID stocks if we can't find real ones, but start with 50 real ones
    real_ids = [
        ("BBCA", "Bank Central Asia"), ("BBRI", "Bank Rakyat Indonesia"), ("BMRI", "Bank Mandiri"),
        ("TLKM", "Telkom Indonesia"), ("ASII", "Astra International"), ("GOTO", "GoTo Gojek Tokopedia"),
        ("BBNI", "Bank Negara Indonesia"), ("UNVR", "Unilever Indonesia"), ("ICBP", "Indofood CBP"),
        ("AMMN", "Amman Mineral Internasional"), ("BYAN", "Bayan Resources"), ("BREN", "Barito Renewables"),
        ("TPIA", "Chandra Asri Pacific"), ("KLBF", "Kalbe Farma"), ("ADRO", "Adaro Energy"),
        ("UNTR", "United Tractors"), ("CPIN", "Charoen Pokphand Indonesia"), ("AMRT", "Sumber Alfaria Trijaya"),
        ("INKP", "Indah Kiat Pulp & Paper"), ("INDF", "Indofood Sukses Makmur"), ("PGAS", "Perusahaan Gas Negara"),
        ("PTBA", "Bukit Asam"), ("BRPT", "Barito Pacific"), ("MDKA", "Merdeka Copper Gold"),
        ("ANTM", "Aneka Tambang"), ("ITMG", "Indo Tambangraya Megah"), ("SMGR", "Semen Indonesia"),
        ("INCO", "Vale Indonesia"), ("AKRA", "AKR Corporindo"), ("MEDC", "Medco Energi"),
        ("EXCL", "XL Axiata"), ("ISAT", "Indosat Ooredoo Hutchison"), ("MYOR", "Mayora Indah"),
        ("MIKA", "Mitra Keluarga Karyasehat"), ("HEAL", "Medikaloka Hermina"), ("SIDO", "Sido Muncul"),
        ("TOWR", "Sarana Menara Nusantara"), ("TBIG", "Tower Bersama Infrastructure"), ("CTRA", "Ciputra Development"),
        ("BSDE", "Bumi Serpong Damai"), ("SMRA", "Summarecon Agung"), ("PWON", "Pakuwon Jati"),
        ("MNCN", "Media Nusantara Citra"), ("SCMA", "Surya Citra Media"), ("ARTO", "Bank Jago"),
        ("BRIS", "Bank Syariah Indonesia"), ("BMAS", "Bank Maspion"), ("BTPS", "BTPN Syariah"),
        ("JSMR", "Jasa Marga"), ("WIKA", "Wijaya Karya")
    ]
    for sym, name in real_ids:
        id_stocks.append({
            "symbol": sym + ".JK",
            "name": name,
            "type": "EQUITY",
            "region": "ID"
        })
    
    # We will just pad the rest using random known prefixes to reach 500, but they won't return data from Yahoo
    # It's better to just give the 50 real ones than 450 fake ones that will fail API calls.
    # Wait, the user wants 500. Let's fetch from Wikipedia pages again!
    try:
        r = requests.get('https://en.wikipedia.org/wiki/List_of_companies_listed_on_the_Indonesia_Stock_Exchange', headers=headers)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(r.text, 'html.parser')
        existing = {s['symbol'] for s in id_stocks}
        for li in soup.find_all('li'):
            text = li.text
            if '(' in text and ')' in text:
                parts = text.split('(')
                if len(parts) > 1:
                    code_part = parts[-1].split(')')[0].strip()
                    if len(code_part) == 4 and code_part.isalpha():
                        name_part = parts[0].strip()
                        if code_part + ".JK" not in existing:
                            id_stocks.append({
                                "symbol": code_part + ".JK",
                                "name": name_part,
                                "type": "EQUITY",
                                "region": "ID"
                            })
                            existing.add(code_part + ".JK")
                            if len(id_stocks) >= 500:
                                break
    except Exception as e:
        print("Scraping li elements failed:", e)

# Deduplicate
id_dict = {s['symbol']: s for s in id_stocks}
id_stocks = list(id_dict.values())

print(f"Found {len(us_stocks)} US stocks and {len(id_stocks)} ID stocks.")

# Fallback if both failed
if not us_stocks:
    us_stocks = [{"symbol": "AAPL", "name": "Apple Inc.", "type": "EQUITY", "region": "US"}]
if not id_stocks:
    id_stocks = [{"symbol": "BBCA.JK", "name": "Bank Central Asia Tbk", "type": "EQUITY", "region": "ID"}]

# Generate TS file
output_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../web/src/lib/popular-stocks.ts'))
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w', encoding='utf-8') as f:
    f.write("// This file is auto-generated\n")
    f.write("export interface StockInfo {\n")
    f.write("  symbol: string;\n")
    f.write("  name: string;\n")
    f.write("  type: string;\n")
    f.write("  region: string;\n")
    f.write("}\n\n")
    
    f.write(f"export const US_STOCKS: StockInfo[] = {json.dumps(us_stocks[:500], indent=2)};\n\n")
    f.write(f"export const ID_STOCKS: StockInfo[] = {json.dumps(id_stocks[:500], indent=2)};\n")

print(f"Generated {output_path} with {min(500, len(us_stocks))} US stocks and {min(500, len(id_stocks))} ID stocks.")
