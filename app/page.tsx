import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { FeaturedHotels } from '@/components/FeaturedHotels';
import { CorporateSection } from '@/components/CorporateSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <FeaturedHotels />
      <CorporateSection />
      
      {/* Dining & Experience Section */}
      <section id="dining" className="py-24 px-6 bg-white dark:bg-[#0a0a0a] overflow-hidden">
        <div className="max-w-screen-2xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-video lg:aspect-square">
              <Image 
                src="https://picsum.photos/seed/dining/1200/1200" 
                alt="Dining Experience" 
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-8 -right-8 bg-sunbird-light dark:bg-[#1a1a1a] p-12 shadow-xl hidden md:block z-10">
                <h3 className="text-3xl font-sans font-black mb-4 text-sunbird-green dark:text-white">Exquisite Dining</h3>
                <p className="text-[#6b6b6b] dark:text-white/60 text-sm font-light leading-relaxed max-w-xs">
                  Savor the finest local and international cuisines prepared by our world-class chefs.
                </p>
              </div>
            </div>
            <div className="lg:pl-12">
              <span className="text-sunbird-accent uppercase tracking-[0.3em] text-xs font-bold mb-6 block">
                Culinary Excellence
              </span>
              <h2 className="text-4xl md:text-5xl font-sans font-black text-sunbird-green dark:text-white mb-8 leading-tight tracking-tight">
                A Taste of <br />
                <span className="italic">Malawian</span> Flavors
              </h2>
              <p className="text-[#6b6b6b] dark:text-white/70 text-lg font-light leading-relaxed mb-10">
                From casual beachside dining to elegant formal restaurants, Sunbird offers a diverse range of culinary experiences that celebrate both local ingredients and global techniques.
              </p>
              <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                  <h4 className="text-xl font-sans font-bold mb-2 text-sunbird-green dark:text-white">9 Restaurants</h4>
                  <p className="text-xs text-sunbird-accent uppercase tracking-widest font-medium">Unique Dining Venues</p>
                </div>
                <div>
                  <h4 className="text-xl font-sans font-bold mb-2 text-sunbird-green dark:text-white">Local Sourcing</h4>
                  <p className="text-xs text-sunbird-accent uppercase tracking-widest font-medium">Fresh Ingredients</p>
                </div>
              </div>
              <button className="text-sunbird-green dark:text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2 group">
                Explore Dining Options
                <div className="w-8 h-[1px] bg-sunbird-green dark:bg-white transition-all group-hover:w-12" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
