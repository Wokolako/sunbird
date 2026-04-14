import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Image from 'next/image';

export default function DiningPage() {
  return (
    <main className="relative">
      <Navbar />
      <section className="pt-32 pb-24 px-6 bg-sunbird-light dark:bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-serif text-sunbird-green dark:text-white mb-12">Exquisite Dining</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="relative aspect-video">
              <Image 
                src="https://picsum.photos/seed/dining-1/1200/800" 
                alt="Dining" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-serif text-sunbird-green dark:text-white mb-6">A Culinary Journey</h2>
              <p className="text-[#6b6b6b] dark:text-white/70 text-lg font-light leading-relaxed mb-8">
                Experience the finest Malawian and international cuisine at our award-winning restaurants.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
