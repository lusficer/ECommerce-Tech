import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import Categories from "@/components/home/Categories";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FlashSale from "@/components/home/FlashSale";
import NewsletterStrip from "@/components/home/NewsletterStrip";
import PersonalizedRecommendations from "@/components/home/PersonalizedRecommendations";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans selection:bg-orange-500/30">
      <Header />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 mb-20 space-y-12">
        <HeroSection />
        <Categories />
        <FeaturedProducts />
        <FlashSale />
        <NewsletterStrip />
        
        {/* Component Gợi ý được thêm vào cuối */}
        <PersonalizedRecommendations />
      </main>
      <Footer/>

    </div>
  );
}