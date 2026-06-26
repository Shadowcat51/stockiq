import urllib.request
import re

url = 'http://www.bing.com/news/apiclick.aspx?ref=FexRss&aid=&tid=6a38d0ccd6b74d03ac59c21991bbd9d0&url=https%3a%2f%2finvestor.id%2fmarket%2f443568%2fsaham-bbca-tetiba-anjlok-ini-garagaranya&c=2755162678399759677&mkt=en-id'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req, timeout=5).read().decode('utf-8', errors='ignore')
    m = re.search(r'<meta.*?property=[\'"]og:image[\'"].*?content=[\'"]([^\'"]+)[\'"]', html, re.I | re.DOTALL)
    if not m:
        m = re.search(r'<meta.*?content=[\'"]([^\'"]+)[\'"].*?property=[\'"]og:image[\'"]', html, re.I | re.DOTALL)
    print(m.group(1) if m else 'No Image')
except Exception as e:
    print(e)
