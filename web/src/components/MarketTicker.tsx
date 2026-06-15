export default function MarketTicker() {
  const items = [
    { symbol: 'S&P 500', price: '5,234.18', change: '+1.2%', up: true },
    { symbol: 'NASDAQ', price: '16,401.84', change: '+1.5%', up: true },
    { symbol: 'IHSG', price: '7,328.45', change: '-0.3%', up: false },
    { symbol: 'AAPL', price: '173.50', change: '+2.1%', up: true },
    { symbol: 'BBCA.JK', price: '9,850', change: '+0.5%', up: true },
    { symbol: 'NVDA', price: '894.00', change: '+4.2%', up: true },
    { symbol: 'TLKM.JK', price: '3,100', change: '-1.2%', up: false },
    { symbol: 'TSLA', price: '171.32', change: '-2.5%', up: false },
    { symbol: 'BMRI.JK', price: '7,200', change: '+1.1%', up: true },
  ];

  return (
    <div className="w-full bg-surface border-y border-surface-border py-3 overflow-hidden flex">
      <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 px-8 border-r border-white/5 last:border-0">
            <span className="font-semibold text-gray-200">{item.symbol}</span>
            <span className="text-gray-400">{item.price}</span>
            <span className={`text-sm font-medium ${item.up ? 'text-success' : 'text-danger'}`}>
              {item.change}
            </span>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}
