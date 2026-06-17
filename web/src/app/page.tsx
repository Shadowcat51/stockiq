import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import MarketTicker from "@/components/MarketTicker";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import Background3D from "@/components/Background3D";

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Background3D />
      <MarketTicker />
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <Footer />
    </main>
  );
}
