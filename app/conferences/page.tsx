import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CorporateSection } from '@/components/CorporateSection';

export default function ConferencesPage() {
  return (
    <main className="relative">
      <Navbar />
      <div className="pt-32">
        <CorporateSection />
      </div>
      <Footer />
    </main>
  );
}
