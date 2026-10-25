"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  MapPin,
  FileText,
  User,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OwnerRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = React.useState({
    // Owner Personal Contact
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Property Information
    propertyName: "",
    propertyType: "LODGE",
    description: "",
    address: "",
    city: "",
    country: "United Kingdom",
    taxId: "",
    registrationNumber: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.description.length < 10) {
      setError("Please provide a property description of at least 10 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          propertyName: formData.propertyName,
          propertyType: formData.propertyType,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          taxId: formData.taxId || undefined,
          registrationNumber: formData.registrationNumber || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit property application.");
      }

      setSuccess(true);

      // Auto sign-in with owner credentials
      const signInRes = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInRes?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/auth/signin?registered=owner");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/80 bg-white/95 shadow-[0_24px_70px_-35px_rgba(15,35,27,0.65)] backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Property Owner Onboarding
            </CardTitle>
            <Badge variant="outline" className="text-xs border-accent/40 text-accent">
              PMS Access
            </Badge>
          </div>
          <CardDescription className="text-xs">
            List your luxury resort, safari camp, or boutique hotel on Vabbot Resorts and unlock the integrated PMS.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 flex items-center gap-2 rounded-lg p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2 rounded-lg p-3 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Application approved! Entering your PMS dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Owner Details */}
            <div className="space-y-3 rounded-lg border border-border p-3.5 bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <User className="h-4 w-4 text-accent" />
                <span>1. Owner Account Details</span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Owner / Principal Full Name
                </label>
                <Input
                  name="name"
                  placeholder="e.g. Alistair Sterling"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Business Email Address
                  </label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="owner@resort.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Direct Contact Phone
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="+44 20 7946 0123"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Property Information */}
            <div className="space-y-3 rounded-lg border border-border p-3.5 bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Building2 className="h-4 w-4 text-accent" />
                <span>2. Property &amp; Hospitality Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Property / Lodge Name
                  </label>
                  <Input
                    name="propertyName"
                    placeholder="e.g. Highland Mist Safari Sanctuary"
                    value={formData.propertyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Property Type
                  </label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="LODGE">Lodge / Camp</option>
                    <option value="HOTEL">Boutique Hotel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Description / Guest Experience
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Describe your lodge, room amenities, and hospitality atmosphere..."
                  value={formData.description}
                  onChange={handleChange}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Physical Address
                  </label>
                  <Input
                    name="address"
                    placeholder="Lake Road, Windermere"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    City / Region
                  </label>
                  <Input
                    name="city"
                    placeholder="Windermere"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Country
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Scotland">Scotland</option>
                    <option value="Wales">Wales</option>
                    <option value="Northern Ireland">Northern Ireland</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Tax ID (Optional)
                  </label>
                  <Input
                    name="taxId"
                    placeholder="e.g. GB-UTR-998234"
                    value={formData.taxId}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Reg Number (Optional)
                  </label>
                  <Input
                    name="registrationNumber"
                    placeholder="e.g. REG-2026-HOTEL"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full bg-accent hover:bg-accent-600 text-obsidian font-bold py-2.5 shadow-md"
            >
              {loading ? "Submitting Application..." : "Submit Property & Launch PMS →"}
            </Button>
          </form>

          {/* Switch to Guest Registration */}
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
              <div className="text-left">
                <span className="font-semibold block text-xs text-foreground">
                  Are you a traveler or guest?
                </span>
                <span className="text-xs text-muted-foreground">
                  Create a guest profile to explore and book luxury resorts
                </span>
              </div>
              <Link href="/auth/register">
                <Button size="sm" variant="outline" className="text-xs">
                  Guest Sign Up →
                </Button>
              </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Already registered as property staff or manager?{" "}
              <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
                Sign in to your PMS
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
