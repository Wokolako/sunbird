import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FeaturedHotels } from '@/components/FeaturedHotels';

export default function ResortsPage() {
  return (
    <main className="relative">
      <Navbar />
      <div className="pt-32">
        <FeaturedHotels />
      </div>
      <Footer />
    </main>
  );
}
