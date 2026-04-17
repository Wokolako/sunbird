import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';

export default function OffersPage() {
  return (
    <main className="relative">
      <Navbar />
      <section className="pt-32 pb-24 px-6 bg-sunbird-light dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-sans font-black text-sunbird-green dark:text-white mb-12 tracking-tight">Special Offers</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1a1a1a] p-8 border border-sunbird-green/10">
                <h3 className="text-2xl font-sans font-bold text-sunbird-green dark:text-white mb-4">Weekend Getaway</h3>
                <p className="text-[#6b6b6b] dark:text-white/70 text-sm font-light mb-6">
                  Enjoy a 20% discount on all weekend bookings at our lakeside resorts.
                </p>
                <Button className="bg-sunbird-green text-white hover:bg-sunbird-accent uppercase tracking-widest text-xs font-bold px-8">
                  Book Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
