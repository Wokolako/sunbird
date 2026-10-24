import Link from "next/link";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Building,
  ArrowRight,
  Waves,
  Trees,
  Star,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MarketplaceHomePage() {
  return (
    <div className="flex flex-col">
      {/* Luxury Hero Banner with Generated High-Res Resort Image */}
      <section className="relative min-h-[580px] overflow-hidden sm:min-h-[660px] flex items-center justify-center">
        {/* Background Luxury Resort Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/vabbot-resort-hero.jpg"
          alt="Vabbot Resorts Luxury Lakeside Lodge"
          className="absolute inset-0 h-full w-full object-cover object-center transform scale-105 transition-transform duration-1000"
        />
        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/30 backdrop-blur-[0.5px]" />

        <div className="container relative z-10 mx-auto px-4 py-20 text-center sm:px-8">
          <div className="mx-auto max-w-3xl">
            <Badge
              variant="outline"
              className="mb-4 border-amber-400/60 bg-black/40 text-amber-300 backdrop-blur-md px-3.5 py-1 text-xs uppercase tracking-[0.25em] font-medium"
            >
              Curated British Sanctuaries • United Kingdom
            </Badge>
            <h1 className="font-serif text-4xl font-normal tracking-tight sm:text-6xl text-white drop-shadow-md">
              Unrivalled lakeside lodges &amp; private safari retreats.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto font-light">
              Crafted for discerning travelers. Every stay verified for pristine exclusivity,
              intuitive hospitality, and direct booking protection.
            </p>
          </div>

          {/* Luxury Search Bar */}
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl bg-white/95 backdrop-blur-md p-3 sm:p-4 shadow-2xl border border-amber-200/50 text-foreground">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-center">
              <div className="flex items-center space-x-3 px-3 py-2 border-b sm:border-b-0 sm:border-r border-border">
                <MapPin className="h-5 w-5 text-accent shrink-0" />
                <div className="text-left w-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Destination
                  </label>
                  <input
                    type="text"
                    defaultValue="Lake District, Windermere"
                    placeholder="Where are you traveling?"
                    className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 px-3 py-2 border-b sm:border-b-0 sm:border-r border-border">
                <Calendar className="h-5 w-5 text-accent shrink-0" />
                <div className="text-left w-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Dates
                  </label>
                  <span className="text-sm font-semibold text-foreground">3 Nights (Select)</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 px-3 py-2 border-b sm:border-b-0 sm:border-r border-border">
                <Users className="h-5 w-5 text-accent shrink-0" />
                <div className="text-left w-full">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Guests
                  </label>
                  <span className="text-sm font-semibold text-foreground">2 Adults</span>
                </div>
              </div>

              <div className="px-1">
                <Button className="w-full h-12 gap-2 shadow-lg bg-primary hover:bg-black text-amber-300 font-semibold border border-amber-500/30">
                  <Search className="h-4 w-4" />
                  Explore Stays
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Testing Interactive Banner */}
      <section className="bg-secondary/60 border-y border-border py-6">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                Vabbot Resorts Multi-Role Architecture
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Seamless role separation between guests, property operators, and platform superintendents:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/auth/register">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                  Guest Registration
                </Button>
              </Link>
              <Link href="/auth/register/owner">
                <Button variant="default" size="sm" className="gap-1.5 text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90">
                  Owner Onboarding
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  PMS Dashboard
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
                  Super Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Handpicked Collections
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-foreground mt-1">
                Featured Lodges &amp; Boutique Stays
              </h2>
            </div>
            <Link
              href="/search"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              View all retreats <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Property 1 */}
            <Card className="overflow-hidden border border-border shadow-md hover:shadow-xl transition-all duration-300">
              <div className="relative h-60 w-full bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
                  alt="Lake Haven Luxury Resort"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="default" className="bg-primary/95 text-amber-300 border border-amber-400/40 gap-1 text-xs">
                    <ShieldCheck className="h-3 w-3 text-amber-300" /> Verified Vabbot Sanctuary
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="font-bold text-xs bg-white/90">
                    ★ 4.8
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Lake District, Windermere</span>
                  <Badge variant="outline" className="text-xs">Private Lodge</Badge>
                </div>
                <CardTitle className="font-serif text-xl lg:text-2xl">Windermere Lakeside Retreat &amp; Lodge</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 text-xs text-muted-foreground">
                <p>Private lakeside veranda, sunset boat tours, and fine English countryside dining.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">Private Beach</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">Fine Dining</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">Infinity Pool</span>
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-4 border-t border-border flex items-center justify-between gap-4">
                <div className="whitespace-nowrap font-sans">
                  <span className="text-xs text-muted-foreground lg:text-sm">From </span>
                  <strong className="text-base text-foreground font-sans lg:text-xl">£145</strong>
                  <span className="text-xs text-muted-foreground lg:text-sm"> / night</span>
                </div>
                <Link href="/auth/signin">
                  <Button size="sm" variant="outline" className="text-xs">
                    Reserve
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Property 2 */}
            <Card className="overflow-hidden border border-border shadow-md hover:shadow-xl transition-all duration-300">
              <div className="relative h-60 w-full bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80"
                  alt="Cotswolds Countryside Safari Lodge"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="default" className="bg-primary/95 text-amber-300 border border-amber-400/40 gap-1 text-xs">
                    <ShieldCheck className="h-3 w-3 text-amber-300" /> Verified Vabbot Sanctuary
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="font-bold text-xs bg-white/90">
                    ★ 4.9
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Cotswolds, Gloucestershire</span>
                  <Badge variant="outline" className="text-xs">Safari Camp</Badge>
                </div>
                <CardTitle className="font-serif text-xl lg:text-2xl">Cotswolds Country Estate</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 text-xs text-muted-foreground">
                <p>Exclusive riverfront luxury chalets overlooking elephant crossings and game safaris.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">Game Drives</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">Boat Safari</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">All-Inclusive</span>
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-4 border-t border-border flex items-center justify-between gap-4">
                <div className="whitespace-nowrap font-sans">
                  <span className="text-xs text-muted-foreground lg:text-sm">From </span>
                  <strong className="text-base text-foreground font-sans lg:text-xl">£188</strong>
                  <span className="text-xs text-muted-foreground lg:text-sm"> / night</span>
                </div>
                <Link href="/auth/signin">
                  <Button size="sm" variant="outline" className="text-xs">
                    Reserve
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Property 3 */}
            <Card className="overflow-hidden border border-border shadow-md hover:shadow-xl transition-all duration-300">
              <div className="relative h-60 w-full bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
                  alt="Capital Heights Boutique Hotel"
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="default" className="bg-primary/95 text-amber-300 border border-amber-400/40 gap-1 text-xs">
                    <ShieldCheck className="h-3 w-3 text-amber-300" /> Verified Vabbot Sanctuary
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="font-bold text-xs bg-white/90">
                    ★ 4.7
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Mayfair, London</span>
                  <Badge variant="outline" className="text-xs">Boutique Hotel</Badge>
                </div>
                <CardTitle className="font-serif text-xl lg:text-2xl">Mayfair Boutique Hotel</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 text-xs text-muted-foreground">
                <p>Diplomatic quarter luxury with boardroom facilities, cocktail lounge, and airport chauffeur.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">Executive Boardroom</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">Lounge</span>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">Fast Wi-Fi</span>
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-4 border-t border-border flex items-center justify-between gap-4">
                <div className="whitespace-nowrap font-sans">
                  <span className="text-xs text-muted-foreground lg:text-sm">From </span>
                  <strong className="text-base text-foreground font-sans lg:text-xl">£118</strong>
                  <span className="text-xs text-muted-foreground lg:text-sm"> / night</span>
                </div>
                <Link href="/auth/signin">
                  <Button size="sm" variant="outline" className="text-xs">
                    Reserve
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Property Owner / PMS Onboarding Banner */}
      <section className="border-t border-border bg-card py-16">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-primary via-neutral-900 to-black text-white p-8 sm:p-14 shadow-2xl border border-amber-500/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <Badge variant="outline" className="border-amber-400 text-amber-300 mb-3 uppercase tracking-widest text-xs">
                  Vabbot Resorts PMS Integration
                </Badge>
                <h3 className="font-serif text-3xl sm:text-5xl font-normal leading-tight text-white">
                  Effortless lodge operations &amp; global UK-standard direct bookings.
                </h3>
                <p className="mt-4 text-sm text-neutral-300 leading-relaxed font-light">
                  Real-time housekeeping boards, zero double-booking database exclusion locks,
                  instant guest folios, and seamless commission payouts direct to your bank.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/auth/register/owner">
                    <Button variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold px-6">
                      List Your Property with Vabbot
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                      Open PMS Dashboard
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
                  <Waves className="h-6 w-6 text-amber-300 mb-2" />
                  <h4 className="font-serif font-semibold text-sm text-white">Direct Bookings</h4>
                  <p className="text-xs text-neutral-400 mt-1">Accept UK &amp; international cards with low platform commission.</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
                  <Building className="h-6 w-6 text-amber-300 mb-2" />
                  <h4 className="font-serif font-semibold text-sm text-white">Front Desk PMS</h4>
                  <p className="text-xs text-neutral-400 mt-1">Check-in, room assignments, and folio billing in one tap.</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
                  <Trees className="h-6 w-6 text-amber-300 mb-2" />
                  <h4 className="font-serif font-semibold text-sm text-white">Housekeeping Board</h4>
                  <p className="text-xs text-neutral-400 mt-1">Live room cleaning, inspection, and maintenance tracking.</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm">
                  <Star className="h-6 w-6 text-amber-300 mb-2" />
                  <h4 className="font-serif font-semibold text-sm text-white">No Double-Booking</h4>
                  <p className="text-xs text-neutral-400 mt-1">Database-level PostgreSQL exclusion guarantees peace of mind.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
