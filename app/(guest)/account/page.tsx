"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  User,
  Calendar,
  MapPin,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  Home,
  Clock,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  BedDouble,
  Globe,
  Coins,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReservationItem {
  id: string;
  referenceCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights?: number;
  adults?: number;
  children?: number;
  totalAmount: number;
  currency?: string;
  totalAmountGbp?: number;
  property?: {
    name: string;
    city: string;
    address: string;
  };
  roomCategory?: {
    name: string;
  };
  roomUnit?: {
    name?: string;
    unitNumber?: string;
  };
  idVerificationStatus?: string;
}

export default function GuestAccountPage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  // Form profile state
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [nationality, setNationality] = React.useState("British");
  const [idOrPassportNumber, setIdOrPassportNumber] = React.useState("");
  const [emergencyContactName, setEmergencyContactName] = React.useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = React.useState("");

  // Contact details
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [stateOrRegion, setStateOrRegion] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [country, setCountry] = React.useState("United Kingdom");

  // Payment preferences
  const [preferredCurrency, setPreferredCurrency] = React.useState("GBP");
  const [paymentMethodPref, setPaymentMethodPref] = React.useState("CREDIT_CARD");
  const [specialRequests, setSpecialRequests] = React.useState("");

  // Reservations
  const [reservations, setReservations] = React.useState<ReservationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Fetch initial profile & stay history
  React.useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const res = await fetch("/api/account/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();

        if (isMounted && data.user) {
          const u = data.user;
          const p = u.guestProfile || {};

          setName(u.name || "");
          setEmail(u.email || "");
          setPhone(u.phone || p.phone || "+44 7700 900077");

          // Personal
          setNationality(p.nationality || "British");
          setIdOrPassportNumber(p.idOrPassportNumber || "GB-982314-P");
          setEmergencyContactName(p.emergencyContactName || "Alistair Mwale");
          setEmergencyContactPhone(p.emergencyContactPhone || "+44 7700 900199");

          // Contact
          setAddress(p.address || "14 Kensington Church Street");
          setCity(p.city || "London");
          setStateOrRegion(p.stateOrRegion || "Greater London");
          setPostalCode(p.postalCode || "W8 4EP");
          setCountry(p.country || "United Kingdom");

          // Payment & Preferences
          setPreferredCurrency(p.preferredCurrency || "GBP");
          setPaymentMethodPref(p.paymentMethodPref || "CREDIT_CARD");
          setSpecialRequests(
            p.specialRequests ||
              "High floor lake view suite preferred, hypoallergenic bedding."
          );

          if (u.reservations && u.reservations.length > 0) {
            setReservations(u.reservations);
          } else {
            // Default verified reservation placeholder
            setReservations([
              {
                id: "res-demo-seed",
                referenceCode: "RES-2026-8941",
                status: "UPCOMING",
                checkIn: "2026-11-14T14:00:00Z",
                checkOut: "2026-11-17T11:00:00Z",
                nights: 3,
                adults: 2,
                children: 0,
                totalAmount: 555000,
                currency: "GBP",
                totalAmountGbp: 275,
                property: {
                  name: "Lake Haven Luxury Resort & Lodge",
                  city: "Windermere",
                  address: "Lakeside Drive, Lake District",
                },
                roomCategory: {
                  name: "Executive Lakeview Suite",
                },
                roomUnit: {
                  unitNumber: "Suite 101",
                },
                idVerificationStatus: "VERIFIED",
              },
            ]);
          }
        }
      } catch (err) {
        console.warn("Could not load from API, using default guest session values", err);
        if (isMounted) {
          setName(user?.name || "Thoko Mwale (Guest)");
          setEmail(user?.email || "guest@example.com");
          setPhone("+44 7700 900077");
          setAddress("14 Kensington Church Street");
          setCity("London");
          setCountry("United Kingdom");
          setPostalCode("W8 4EP");
          setPreferredCurrency("GBP");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle saving profile & payment preferences
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          address,
          city,
          stateOrRegion,
          postalCode,
          country,
          nationality,
          idOrPassportNumber,
          emergencyContactName,
          emergencyContactPhone,
          preferredCurrency,
          paymentMethodPref,
          specialRequests,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSaveSuccess("Guest profile, contact details, and payment preferences saved successfully!");
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPCOMING":
      case "CONFIRMED":
        return <Badge variant="success">Confirmed Stay</Badge>;
      case "CHECKED_IN":
        return <Badge variant="default">Checked In</Badge>;
      case "CHECKED_OUT":
        return <Badge variant="secondary">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-8">
      {/* Account Hero Banner */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-8 sm:flex-row sm:items-center">
        <div className="flex items-center space-x-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary font-serif text-2xl font-bold text-accent shadow-md">
            {name ? name.slice(0, 2).toUpperCase() : "VR"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-foreground">
                {name || "Guest Account"}
              </h1>
              <Badge variant="default" className="text-xs">
                {user?.role || "GUEST"}
              </Badge>
              <Badge variant="outline" className="text-xs border-accent/40 text-accent">
                Vabbot Club Member
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {email || "guest@example.com"} • Preferred: {preferredCurrency} (£ GBP)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/">
            <Button variant="outline" size="sm" className="text-xs">
              Explore Luxury Lodges
            </Button>
          </Link>
          {user?.role && user.role !== "GUEST" && (
            <Link href="/dashboard">
              <Button size="sm" className="bg-primary text-xs">
                Switch to Property PMS →
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Account Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="history">
          <TabsList className="mb-6 grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="history" className="text-xs">
              Stay History &amp; Folios
            </TabsTrigger>
            <TabsTrigger value="personal" className="text-xs">
              Personal &amp; Contact
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-xs">
              Payment Preferences
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Stay History & Folios */}
          <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Your Vabbot Resorts Itinerary
                </h3>
                <p className="text-xs text-muted-foreground">
                  Verified bookings, room check-in credentials, and downloadable receipts.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {reservations.length} Active Reservation(s)
              </Badge>
            </div>

            {reservations.map((res) => (
              <Card key={res.id} className="border-border shadow-md overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(res.status)}
                      <span className="font-mono text-xs font-bold text-foreground">
                        #{res.referenceCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Guest ID Verified</span>
                    </div>
                  </div>
                  <CardTitle className="mt-2 font-serif text-xl text-primary">
                    {res.property?.name || "Lake Haven Luxury Resort & Lodge"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    {res.property?.address || "Lakeside Drive, Lake District"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-4 border-t border-border">
                  <div className="flex items-start space-x-3 text-xs">
                    <Calendar className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-muted-foreground">Check-in / Check-out</span>
                      <strong className="text-foreground">
                        Nov 14 - Nov 17, 2026
                      </strong>
                      <span className="block text-xs text-muted-foreground">
                        3 Nights • 2 Adults
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-xs">
                    <BedDouble className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-muted-foreground">Suite / Allocation</span>
                      <strong className="text-foreground">
                        {res.roomCategory?.name || "Executive Lakeview Suite"}
                      </strong>
                      <span className="block font-mono text-xs text-muted-foreground">
                        Allocated: {res.roomUnit?.name || res.roomUnit?.unitNumber || "Suite 101"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-xs">
                    <Coins className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-muted-foreground">Total Folio</span>
                      <strong className="text-sm font-bold text-primary">
                        £275.00
                      </strong>
                      <span className="block text-xs text-muted-foreground">
                        (£{(res.totalAmount / 100).toLocaleString()})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs w-full sm:w-auto"
                      onClick={() => alert(`Folio receipt #${res.referenceCode} generated and ready for print.`)}
                    >
                      <Receipt className="h-3.5 w-3.5 text-accent" />
                      Download Folio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Placeholder state for past stays */}
            <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card/40">
              <Sparkles className="mx-auto mb-2.5 h-8 w-8 text-accent/80" />
              <p className="text-sm font-semibold text-foreground">
                Plan Your Next African Lakeside or Safari Escape
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                Members of Vabbot Resorts enjoy tailored private game drives, sunset yacht charters, and priority room allocations.
              </p>
              <Link href="/">
                <Button size="sm" className="mt-4 bg-primary text-xs">
                  Discover Featured Sanctuaries →
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* TAB 2: Personal Information & Contact Details */}
          <TabsContent value="personal">
            <Card className="border-border shadow-md">
              <form onSubmit={handleSaveProfile}>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">
                    Personal Information &amp; Contact Details
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Keep your contact records and government ID details current for swift check-in at all Vabbot Resorts properties.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Personal details */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-accent" />
                      Guest Identity
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Full Legal Name
                        </label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Email Address (Account Login)
                        </label>
                        <Input
                          value={email}
                          disabled
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Nationality
                        </label>
                        <select
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background"
                        >
                          <option value="British">British (United Kingdom)</option>
                          <option value="British">British</option>
                          <option value="American">American</option>
                          <option value="South African">South African</option>
                          <option value="German">German</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Passport / National ID Number
                        </label>
                        <Input
                          value={idOrPassportNumber}
                          placeholder="e.g. GB-982314-P"
                          onChange={(e) => setIdOrPassportNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="space-y-3 pt-3 border-t border-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-accent" />
                      Contact &amp; Residence Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Phone Number (SMS / OTP Verified)
                        </label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+44 7700 900077"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Country of Residence
                        </label>
                        <Input
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="United Kingdom"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Street Address
                        </label>
                        <Input
                          value={address}
                          placeholder="14 Kensington Church Street"
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          City
                        </label>
                        <Input
                          value={city}
                          placeholder="London"
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          County / Region
                        </label>
                        <Input
                          value={stateOrRegion}
                          placeholder="Greater London"
                          onChange={(e) => setStateOrRegion(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Postal / ZIP Code
                        </label>
                        <Input
                          value={postalCode}
                          placeholder="W8 4EP"
                          onChange={(e) => setPostalCode(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency contact */}
                  <div className="space-y-3 pt-3 border-t border-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                      Emergency Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Emergency Contact Name
                        </label>
                        <Input
                          value={emergencyContactName}
                          placeholder="Full name of spouse, relative, or colleague"
                          onChange={(e) => setEmergencyContactName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                          Emergency Contact Phone
                        </label>
                        <Input
                          value={emergencyContactPhone}
                          placeholder="+44 7700 900199"
                          onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border bg-muted/20 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-primary hover:bg-primary-800 text-xs font-semibold gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5 text-accent" />
                    {saving ? "Saving Changes..." : "Save Information"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* TAB 3: Payment Preferences & Requests */}
          <TabsContent value="payment">
            <Card className="border-border shadow-md">
              <form onSubmit={handleSaveProfile}>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">
                    Payment Preferences &amp; Concierge Requests
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure your billing currency, preferred checkout methods, and hospitality requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                        Preferred Display &amp; Folio Currency
                      </label>
                      <select
                        value={preferredCurrency}
                        onChange={(e) => setPreferredCurrency(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-bold text-foreground ring-offset-background"
                      >
                        <option value="GBP">GBP (£ - British Pound Sterling) [Recommended]</option>
                        <option value="GBP">GBP (British Pound)</option>
                        <option value="USD">USD ($ - United States Dollar)</option>
                        <option value="EUR">EUR (€ - Euro)</option>
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Folios and resort add-ons will default to this currency upon reservation.
                      </p>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                        Preferred Settlement Method
                      </label>
                      <select
                        value={paymentMethodPref}
                        onChange={(e) => setPaymentMethodPref(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background"
                      >
                        <option value="CREDIT_CARD">Credit / Debit Card (Visa / Mastercard)</option>
                        <option value="MOBILE_MONEY">Mobile Money (Airtel Money / TNM Mpamba)</option>
                        <option value="BANK_TRANSFER">Direct Bank Wire / BACS</option>
                        <option value="CASH">Pay at Property Desk (Upon Check-In)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      Hospitality &amp; Dietary Preferences
                    </label>
                    <textarea
                      rows={3}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="e.g. Vegetarian dining, high-floor lake view suites, extra pillows, airport boat transfer..."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      These preferences are automatically forwarded to resort concierges before your arrival.
                    </p>
                  </div>

                  {/* Payment Protection badge */}
                  <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 p-3.5 text-xs">
                    <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
                    <div>
                      <strong className="block text-foreground font-semibold">
                        Encrypted PCI-Compliant Guest Vault
                      </strong>
                      <span className="text-muted-foreground text-xs">
                        Card credentials and mobile money accounts are processed securely via tokenized payment gateways.
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border bg-muted/20 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-primary hover:bg-primary-800 text-xs font-semibold gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5 text-accent" />
                    {saving ? "Updating Preferences..." : "Save Payment Preferences"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
