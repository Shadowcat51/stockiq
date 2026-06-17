export default function TestimonialsSection() {
  const testimonials = [
    {
      name: "Budi Santoso",
      role: "Aspiring Investor",
      content: "StockIQ AI gave me the confidence to trade Indonesian stocks. The virtual simulation feels exactly like the real market, and I didn't have to risk my own money while learning.",
      avatar: "B"
    },
    {
      name: "Sarah Chen",
      role: "Active US Trader",
      content: "The AI alerts have completely changed my morning routine. I get notified of technical breakouts before they happen, and the dual-market support is seamless.",
      avatar: "S"
    },
    {
      name: "David Lee",
      role: "Portfolio Manager",
      content: "Institutional-grade analysis finally available for retail. The predictive modeling and risk assessment tools are comparable to what we use on the trading floor.",
      avatar: "D"
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--color-primary-900)_0%,_transparent_50%)] opacity-20 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Built for <span className="text-gradient">Every Type of Trader</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From beginners testing the waters to veterans executing complex strategies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-2xl relative">
              <svg className="absolute top-6 right-6 w-8 h-8 text-white/5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-gray-300 italic mb-8 relative z-10">
                "{t.content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center text-white font-bold text-lg">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-white">{t.name}</div>
                  <div className="text-sm text-primary-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
