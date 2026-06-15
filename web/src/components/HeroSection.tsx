import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-primary-900)_0%,_transparent_50%)] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--color-accent)_0%,_transparent_40%)] opacity-10 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 animate-float">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-sm font-medium text-primary-50">StockVision AI is Now Live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Institutional Intelligence for <br className="hidden md:block" />
            <span className="text-gradient-primary">Every Investor</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Real-time stock analysis, AI-driven insights, and risk-free simulation for US and Indonesian markets. Master the market before risking real capital.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]">
              Start Virtual Trading
            </button>
            <button className="px-8 py-4 glass-panel glass-panel-hover text-white rounded-xl font-semibold transition-all">
              Explore AI Insights
            </button>
          </div>
        </div>

        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent rounded-2xl blur opacity-20 animate-pulse-slow"></div>
          <div className="relative rounded-2xl glass-panel p-2">
            <div className="rounded-xl overflow-hidden bg-background aspect-video relative flex items-center justify-center border border-white/5 shadow-2xl">
              <Image 
                src="/chart-mockup.png" 
                alt="StockVision AI Real-Time Chart Mockup" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
