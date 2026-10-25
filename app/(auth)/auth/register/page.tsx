"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  AlertCircle,
  CheckCircle2,
  Building,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Globe,
  Coins,
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

export default function GuestRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    nationality: "British",
    preferredCurrency: "GBP",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          nationality: formData.nationality,
          preferredCurrency: formData.preferredCurrency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create guest account.");
      }

      setSuccess(true);

      // Auto sign-in
      const signInRes = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInRes?.ok) {
        router.push("/account");
        router.refresh();
      } else {
        router.push("/auth/signin?registered=true");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Join Vabbot Resorts
          </CardTitle>
          <CardDescription className="text-xs">
            Create your guest account to reserve luxury stays, track bookings, and save bespoke lodges.
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
              <span>Account created successfully! Logging you in...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                Full Name
              </label>
              <Input
                name="name"
                placeholder="e.g. Eleanor Vance"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="eleanor@example.co.uk"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Mobile Phone
                </label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder="+44 7700 900123"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Nationality
                </label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="British">British (UK)</option>
                  <option value="British">British</option>
                  <option value="American">American (US)</option>
                  <option value="South African">South African</option>
                  <option value="German">German</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                  Preferred Currency
                </label>
                <select
                  name="preferredCurrency"
                  value={formData.preferredCurrency}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-semibold"
                >
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="GBP">GBP (British Pound)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                </select>
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
                  placeholder="At least 8 chars"
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

            <Button
              type="submit"
              disabled={loading || success}
              className="w-full bg-primary hover:bg-primary-800 text-primary-foreground font-semibold mt-2"
            >
              {loading ? "Creating Account..." : "Create Guest Account"}
            </Button>
          </form>

          {/* Switch to Property Owner Registration */}
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border border-accent/30 bg-accent/5">
              <div className="text-left">
                <span className="font-semibold block text-xs text-foreground">
                  Own a hotel, safari camp, or lodge?
                </span>
                <span className="text-xs text-muted-foreground">
                  Register your property with Vabbot Resorts PMS
                </span>
              </div>
              <Link href="/auth/register/owner">
                <Button size="sm" variant="outline" className="text-xs border-accent text-accent hover:bg-accent/10">
                  Owner Portal →
                </Button>
              </Link>
            </div>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Already have an account?{" "}
              <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
