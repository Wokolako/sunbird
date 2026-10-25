"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  AlertCircle,
  ArrowRight,
  Phone,
  Mail,
  ShieldCheck,
  Building,
  UserCheck,
  CheckCircle2,
  Sparkles,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEMO_ACCOUNTS = [
  {
    roleName: "Super Admin",
    email: "admin@sunbird.com",
    pass: "Admin123456!",
    target: "/admin",
    badgeVariant: "destructive" as const,
  },
  {
    roleName: "Property Owner",
    email: "owner@lakehaven.com",
    pass: "Owner123456!",
    target: "/dashboard",
    badgeVariant: "default" as const,
  },
  {
    roleName: "Property Manager",
    email: "manager@lakehaven.com",
    pass: "Manager123456!",
    target: "/dashboard",
    badgeVariant: "secondary" as const,
  },
  {
    roleName: "Front Desk Staff",
    email: "reception@lakehaven.com",
    pass: "Staff123456!",
    target: "/dashboard",
    badgeVariant: "info" as const,
  },
  {
    roleName: "Housekeeper",
    email: "cleaner@lakehaven.com",
    pass: "Staff123456!",
    target: "/dashboard",
    badgeVariant: "warning" as const,
  },
  {
    roleName: "Guest User",
    email: "guest@example.com",
    pass: "Guest123456!",
    target: "/account",
    badgeVariant: "outline" as const,
  },
];

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Email state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Phone OTP state
  const [phone, setPhone] = React.useState("+44 7700 900077");
  const [otpCode, setOtpCode] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpSending, setOtpSending] = React.useState(false);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = React.useState(0);

  // Common UI state
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [socialNotice, setSocialNotice] = React.useState<string | null>(null);

  // Countdown timer for OTP resend
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Handle Email + Password Sign In
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password. You can also use one of the 1-click sandbox accounts below.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  // Dispatch OTP via Pluggable SMS Provider
  const handleSendOtp = async () => {
    if (!phone || phone.length < 7) {
      setError("Please provide a valid phone number (e.g., +44 7700 900077 or +265 999 123 456).");
      return;
    }

    setOtpSending(true);
    setError(null);
    setDevCode(null);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch verification SMS");
      }

      setOtpSent(true);
      setResendCountdown(60);
      if (data.devCode) {
        setDevCode(data.devCode);
        setOtpCode(data.devCode); // Auto-fill for developer convenience
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification SMS");
    } finally {
      setOtpSending(false);
    }
  };

  // Handle Phone OTP Sign In
  const handlePhoneOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("phone-otp", {
        phone,
        code: otpCode,
        redirect: false,
      });

      setLoading(false);

      if (res?.error) {
        setError(res.error || "Invalid or expired OTP code.");
      } else {
        router.push(callbackUrl !== "/" ? callbackUrl : "/account");
        router.refresh();
      }
    } catch (err) {
      setLoading(false);
      setError("An unexpected error occurred during OTP verification.");
    }
  };

  // Handle Social Login (Google / Facebook)
  const handleSocialSignIn = async (provider: "google" | "facebook") => {
    try {
      setSocialNotice(null);
      const res = await signIn(provider, { callbackUrl });
      if (res?.error) {
        setSocialNotice(`${provider.toUpperCase()} authentication requires OAuth credentials in .env. You can use Email, Phone OTP, or 1-Click Guest test login below.`);
      }
    } catch (err) {
      setSocialNotice(`Google and Facebook OAuth will activate once your app credentials are added in .env. Use 1-Click login below for instant access.`);
    }
  };

  // Instant 1-Click Demo Login
  const fillAndLogin = async (
    accEmail: string,
    accPass: string,
    defaultTarget: string
  ) => {
    setEmail(accEmail);
    setPassword(accPass);
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email: accEmail,
      password: accPass,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Login failed with demo credentials.");
    } else {
      const destination = callbackUrl !== "/" ? callbackUrl : defaultTarget;
      router.push(destination);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Sign In to Vabbot Resorts
          </CardTitle>
          <CardDescription className="text-xs">
            Access the luxury marketplace, guest account, or property PMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 flex items-center gap-2 rounded-lg p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {socialNotice && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center gap-2 rounded-lg p-3 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{socialNotice}</span>
            </div>
          )}

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="email" className="text-xs flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email &amp; Password
              </TabsTrigger>
              <TabsTrigger value="phone" className="text-xs flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number (OTP)
              </TabsTrigger>
            </TabsList>

            {/* Email + Password Form */}
            <TabsContent value="email">
              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-800 text-primary-foreground font-semibold"
                >
                  {loading ? "Authenticating..." : "Sign In with Email"}
                </Button>
              </form>
            </TabsContent>

            {/* Phone OTP Form */}
            <TabsContent value="phone">
              <form onSubmit={handlePhoneOtpSubmit} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                    Mobile Phone Number
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="+44 7700 900077 or +265 999 123 456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={otpSending}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOtp}
                      disabled={otpSending || resendCountdown > 0}
                      className="shrink-0 text-xs"
                    >
                      {otpSending
                        ? "Sending..."
                        : resendCountdown > 0
                        ? `Resend in ${resendCountdown}s`
                        : otpSent
                        ? "Resend Code"
                        : "Send Code"}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pluggable SMS interface with mock provider for local development.
                  </p>
                </div>

                {/* Dev Mock Code Banner */}
                {devCode && (
                  <div className="rounded-lg border border-accent/30 bg-accent/10 p-2.5 text-xs text-foreground">
                    <div className="flex items-center gap-1.5 font-bold text-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Mock SMS Provider (Dev Mode)</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Verification code dispatched: <strong className="font-mono text-sm tracking-widest text-foreground">{devCode}</strong>
                    </p>
                  </div>
                )}

                {otpSent && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                      6-Digit Verification Code
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="font-mono text-center tracking-widest text-base"
                      required
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !otpSent || otpCode.length < 6}
                  className="w-full bg-primary hover:bg-primary-800 text-primary-foreground font-semibold"
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Social Authentication */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium text-xs">
                Or continue with social
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignIn("google")}
              className="text-xs font-medium hover:border-primary/50 flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignIn("facebook")}
              className="text-xs font-medium hover:border-primary/50 flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </div>

          {/* Registration Navigation Flow Links */}
          <div className="pt-2 border-t border-border space-y-2 text-center text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60">
              <div className="text-left">
                <span className="font-semibold block text-foreground">New to Vabbot Resorts?</span>
                <span className="text-xs text-muted-foreground">Book boutique lodges &amp; safaris</span>
              </div>
              <Link href="/auth/register">
                <Button size="sm" variant="default" className="text-xs bg-primary">
                  Guest Sign Up →
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg border border-accent/30 bg-accent/5">
              <div className="text-left">
                <span className="font-semibold block text-foreground">Hotel or Lodge Owner?</span>
                <span className="text-xs text-muted-foreground">List property &amp; activate PMS</span>
              </div>
              <Link href="/auth/register/owner">
                <Button size="sm" variant="outline" className="text-xs border-accent text-accent hover:bg-accent/10">
                  Owner Onboarding →
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Test Demo Accounts */}
      <Card className="border-accent/40 bg-accent/5">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
              Instant Sandbox Role Testing (1-Click)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Click any seeded role below to automatically authenticate and navigate to its dedicated portal:
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 pt-0">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => fillAndLogin(acc.email, acc.pass, acc.target)}
              className="hover:bg-primary/5 flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-left transition hover:border-primary active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {acc.roleName}
                  </span>
                  <Badge
                    variant={acc.badgeVariant}
                    className="px-1 py-0 font-mono text-[9px]"
                  >
                    {acc.target}
                  </Badge>
                </div>
                <span className="block font-mono text-xs text-muted-foreground">
                  {acc.email}
                </span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading sign-in portal...
        </div>
      }
    >
      <SignInForm />
    </React.Suspense>
  );
}
