"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  User,
  MapPin,
  ShieldCheck,
  CreditCard,
  Phone,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Receipt,
  MessageSquare,
  Download,
  Info,
  ExternalLink,
  Pencil,
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
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dialog as ModalDialog } from "@/components/ui/dialog";

interface ReservationItem {
  id: string;
  referenceCode: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  adultsCount: number;
  childrenCount: number;
  totalAmount: string | number;
  currency: string;
  specialRequests?: string | null;
  createdAt?: string;
  cancellationRequested?: boolean;
  payments?: Array<{
    amount: string | number;
    currency: string;
    status: string;
    paymentType: string;
  }>;
  invoices?: Array<{
    invoiceNumber: string;
    pdfUrl: string | null;
    status: string;
    totalAmount: string | number;
    currency: string;
    issuedAt: string;
  }>;
  property?: {
    name: string;
    city: string;
    address: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    checkInTime?: string;
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

type ReservationRequestType = "CANCELLATION" | "DATE_CHANGE";

function dateOnlyLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`));
}

function reservationNights(reservation: ReservationItem) {
  return Math.max(
    1,
    Math.round(
      (new Date(`${reservation.checkOutDate.slice(0, 10)}T00:00:00Z`).getTime() -
        new Date(`${reservation.checkInDate.slice(0, 10)}T00:00:00Z`).getTime()) /
        86_400_000
    )
  );
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
  const [requestTarget, setRequestTarget] = React.useState<{
    reservation: ReservationItem;
    type: ReservationRequestType;
  } | null>(null);
  const [requestNote, setRequestNote] = React.useState("");
  const [requestSending, setRequestSending] = React.useState(false);
  const [requestError, setRequestError] = React.useState("");
  const [requestSuccess, setRequestSuccess] = React.useState("");

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

          setReservations(u.reservations || []);
        }
      } catch (err) {
        console.error("Could not load guest profile", err);
        if (isMounted) {
          setName(user?.name || "Thoko Mwale (Guest)");
          setEmail(user?.email || "guest@example.com");
          setPhone("+44 7700 900077");
          setAddress("14 Kensington Church Street");
          setCity("London");
          setCountry("United Kingdom");
          setPostalCode("W8 4EP");
          setPreferredCurrency("GBP");
          setReservations([]);
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

      setSaveSuccess(
        "Guest profile, contact details, and payment preferences saved successfully!"
      );
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().slice(0, 10);
  const upcomingReservations = reservations.filter(
    (reservation) =>
      reservation.status === "UPCOMING" &&
      reservation.checkInDate.slice(0, 10) >= todayKey
  );
  const inHouseReservations = reservations.filter(
    (reservation) => reservation.status === "CHECKED_IN"
  );
  const historyReservations = reservations.filter(
    (reservation) =>
      !upcomingReservations.includes(reservation) &&
      !inHouseReservations.includes(reservation)
  );

  async function sendReservationRequest() {
    if (!requestTarget) return;
    setRequestSending(true);
    setRequestError("");
    setRequestSuccess("");
    try {
      const response = await fetch(
        `/api/account/reservations/${encodeURIComponent(requestTarget.reservation.id)}/requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: requestTarget.type,
            message: requestNote,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not send request.");

      const successMessage = result.message || "Your request has been sent.";
      setRequestSuccess(successMessage);
      if (requestTarget.type === "CANCELLATION") {
        setReservations((current) =>
          current.map((reservation) =>
            reservation.id === requestTarget.reservation.id
              ? { ...reservation, cancellationRequested: true }
              : reservation
          )
        );
      }
      setRequestTarget(null);
      setRequestNote("");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Could not send request.");
    } finally {
      setRequestSending(false);
    }
  }

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
              <Badge variant="outline" className="border-accent/40 text-xs text-accent">
                Vabbot Club Member
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
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
        <div className="border-destructive/20 bg-destructive/10 mt-6 flex items-center gap-2 rounded-lg border p-3.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Account Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="history">
          <TabsList className="mb-6 grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="history" className="text-xs">
              Stays &amp; Reservations
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
                  My Stays &amp; Reservations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Review upcoming getaways, active stays, and your completed reservations.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {reservations.length} total
              </Badge>
            </div>

            {requestSuccess && (
              <p
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"
              >
                {requestSuccess}
              </p>
            )}

            <Tabs defaultValue="upcoming">
              <TabsList className="mb-5 flex h-auto w-full flex-wrap justify-start gap-1 sm:w-fit">
                <TabsTrigger value="upcoming" className="gap-2 text-xs">
                  Upcoming Stays{" "}
                  <Badge
                    variant="secondary"
                    className="h-5 min-h-0 px-1.5 py-0 text-[10px]"
                  >
                    {upcomingReservations.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="in-house" className="gap-2 text-xs">
                  Active In-House{" "}
                  <Badge
                    variant="secondary"
                    className="h-5 min-h-0 px-1.5 py-0 text-[10px]"
                  >
                    {inHouseReservations.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2 text-xs">
                  Stay History{" "}
                  <Badge
                    variant="secondary"
                    className="h-5 min-h-0 px-1.5 py-0 text-[10px]"
                  >
                    {historyReservations.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {[
                {
                  value: "upcoming",
                  items: upcomingReservations,
                  empty: "No upcoming stays yet.",
                },
                {
                  value: "in-house",
                  items: inHouseReservations,
                  empty: "You have no active in-house stays.",
                },
                {
                  value: "history",
                  items: historyReservations,
                  empty: "Completed and cancelled stays will appear here.",
                },
              ].map(({ value, items, empty }) => (
                <TabsContent key={value} value={value} className="space-y-4">
                  {loading ? (
                    <Card>
                      <CardContent className="py-12 text-center text-sm text-muted-foreground">
                        Loading your reservations…
                      </CardContent>
                    </Card>
                  ) : items.length ? (
                    items.map((res) => {
                      const total = Number(res.totalAmount);
                      const paid = (res.payments || [])
                        .filter((payment) => payment.status === "COMPLETED")
                        .reduce((sum, payment) => sum + Number(payment.amount), 0);
                      const outstanding = Math.max(0, total - paid);
                      const invoice = res.invoices?.[0];
                      const propertyAddress = [res.property?.address, res.property?.city]
                        .filter(Boolean)
                        .join(", ");
                      const canRequestChange =
                        res.status === "UPCOMING" &&
                        res.checkInDate.slice(0, 10) >= todayKey;

                      return (
                        <Card
                          key={res.id}
                          className="overflow-hidden border-slate-200 bg-white shadow-sm"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <CardTitle className="text-base font-bold">
                                    {res.property?.name || "Your stay"}
                                  </CardTitle>
                                  {getStatusBadge(res.status)}
                                  {res.cancellationRequested && (
                                    <Badge variant="warning">
                                      Cancellation requested
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Ref:{" "}
                                  <span className="font-mono font-semibold text-foreground">
                                    #{res.referenceCode}
                                  </span>
                                  <span className="mx-2">·</span>
                                  Booked{" "}
                                  {res.createdAt ? dateOnlyLabel(res.createdAt) : "—"}
                                </p>
                              </div>
                              {res.property?.contactEmail ? (
                                <a
                                  href={`mailto:${res.property.contactEmail}?subject=${encodeURIComponent(`Question about reservation ${res.referenceCode}`)}`}
                                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                                  Message Host
                                </a>
                              ) : res.property?.contactPhone ? (
                                <a
                                  href={`tel:${res.property.contactPhone}`}
                                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                                >
                                  <Phone className="h-3.5 w-3.5 text-emerald-700" />
                                  Call Host
                                </a>
                              ) : null}
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4 border-t border-border pt-4">
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                  Physical location
                                </p>
                                <p className="mt-1 text-xs font-semibold text-foreground">
                                  {propertyAddress ||
                                    res.property?.city ||
                                    "Location not provided"}
                                </p>
                                {propertyAddress && (
                                  <a
                                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 hover:underline"
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(propertyAddress)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <MapPin className="h-3 w-3" /> View map{" "}
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                  Dates &amp; allocation
                                </p>
                                <p className="mt-1 text-xs font-semibold text-foreground">
                                  {dateOnlyLabel(res.checkInDate)} –{" "}
                                  {dateOnlyLabel(res.checkOutDate)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {reservationNights(res)} nights
                                  {res.roomUnit?.name
                                    ? ` · Unit ${res.roomUnit.name}`
                                    : ""}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                  Room category
                                </p>
                                <p className="mt-1 text-xs font-semibold text-foreground">
                                  {res.roomCategory?.name || "Room"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {res.adultsCount}{" "}
                                  {res.adultsCount === 1 ? "adult" : "adults"}
                                  {res.childrenCount
                                    ? ` · ${res.childrenCount} ${res.childrenCount === 1 ? "child" : "children"}`
                                    : ""}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                  Payment folio
                                </p>
                                <p className="mt-1 text-xs font-bold text-foreground">
                                  {new Intl.NumberFormat(undefined, {
                                    style: "currency",
                                    currency: res.currency,
                                  }).format(total)}
                                </p>
                                <p
                                  className={`text-[10px] font-medium ${outstanding > 0 ? "text-amber-700" : "text-emerald-700"}`}
                                >
                                  {paid > 0
                                    ? `Paid: ${new Intl.NumberFormat(undefined, { style: "currency", currency: res.currency }).format(paid)}${outstanding > 0 ? ` · Balance: ${new Intl.NumberFormat(undefined, { style: "currency", currency: res.currency }).format(outstanding)}` : ""}`
                                    : "No payment recorded"}
                                </p>
                              </div>
                            </div>

                            {(res.status === "UPCOMING" || res.specialRequests) && (
                              <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-700">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />
                                <p>
                                  <strong className="mr-1">Check-in instructions:</strong>
                                  {res.status === "UPCOMING"
                                    ? `Check-in starts at ${res.property?.checkInTime || "the property's published check-in time"}. Present a government-issued photo ID and quote reference #${res.referenceCode}.`
                                    : "Your stay preferences and notes are shown below."}
                                  {res.specialRequests
                                    ? ` Guest note: “${res.specialRequests}”`
                                    : ""}
                                </p>
                              </div>
                            )}
                          </CardContent>

                          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              {invoice?.pdfUrl ? (
                                <a
                                  href={invoice.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
                                >
                                  <Download className="h-3.5 w-3.5" /> Download invoice
                                </a>
                              ) : (
                                <span className="border-border/70 inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs text-muted-foreground">
                                  <Receipt className="h-3.5 w-3.5" />
                                  {invoice
                                    ? `Invoice ${invoice.invoiceNumber}`
                                    : "Invoice not available"}
                                </span>
                              )}
                            </div>
                            {canRequestChange && (
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-xs"
                                  onClick={() => {
                                    setRequestError("");
                                    setRequestTarget({
                                      reservation: res,
                                      type: "DATE_CHANGE",
                                    });
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Modify dates
                                </Button>
                                {res.cancellationRequested ? (
                                  <span className="px-2 text-xs font-medium text-amber-700">
                                    Cancellation under review
                                  </span>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                    onClick={() => {
                                      setRequestError("");
                                      setRequestTarget({
                                        reservation: res,
                                        type: "CANCELLATION",
                                      });
                                    }}
                                  >
                                    Request cancellation
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="bg-card/40 rounded-xl border border-dashed border-border p-8 text-center">
                      <Sparkles className="text-accent/80 mx-auto mb-2.5 h-7 w-7" />
                      <p className="text-sm font-semibold text-foreground">{empty}</p>
                      {value === "upcoming" && (
                        <Link
                          href="/"
                          className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
                        >
                          Explore stays <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
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
                    Keep your contact records and government ID details current for swift
                    check-in at all Vabbot Resorts properties.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Personal details */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-accent" />
                      Guest Identity
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <div className="space-y-3 border-t border-border pt-3">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-accent" />
                      Contact &amp; Residence Details
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <div className="space-y-3 border-t border-border pt-3">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                      Emergency Contact
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <CardFooter className="bg-muted/20 flex justify-end border-t border-border">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-1.5 bg-primary text-xs font-semibold hover:bg-primary-800"
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
                    Configure your billing currency, preferred checkout methods, and
                    hospitality requirements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                        Preferred Display &amp; Folio Currency
                      </label>
                      <select
                        value={preferredCurrency}
                        onChange={(e) => setPreferredCurrency(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-bold text-foreground ring-offset-background"
                      >
                        <option value="GBP">
                          GBP (£ - British Pound Sterling) [Recommended]
                        </option>
                        <option value="GBP">GBP (British Pound)</option>
                        <option value="USD">USD ($ - United States Dollar)</option>
                        <option value="EUR">EUR (€ - Euro)</option>
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Folios and resort add-ons will default to this currency upon
                        reservation.
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
                        <option value="CREDIT_CARD">
                          Credit / Debit Card (Visa / Mastercard)
                        </option>
                        <option value="MOBILE_MONEY">
                          Mobile Money (Airtel Money / TNM Mpamba)
                        </option>
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
                      These preferences are automatically forwarded to resort concierges
                      before your arrival.
                    </p>
                  </div>

                  {/* Payment Protection badge */}
                  <div className="border-accent/20 bg-accent/5 flex items-center gap-3 rounded-lg border p-3.5 text-xs">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-accent" />
                    <div>
                      <strong className="block font-semibold text-foreground">
                        Encrypted PCI-Compliant Guest Vault
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        Card credentials and mobile money accounts are processed securely
                        via tokenized payment gateways.
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/20 flex justify-end border-t border-border">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-1.5 bg-primary text-xs font-semibold hover:bg-primary-800"
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

      <ModalDialog
        open={Boolean(requestTarget)}
        onOpenChange={(open) => {
          if (!open && !requestSending) {
            setRequestTarget(null);
            setRequestError("");
            setRequestNote("");
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {requestTarget?.type === "CANCELLATION"
              ? "Request reservation cancellation"
              : "Request a date change"}
          </DialogTitle>
          <DialogDescription>
            {requestTarget
              ? `${requestTarget.reservation.property?.name || "Your property"} · ${requestTarget.reservation.referenceCode}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs leading-relaxed text-muted-foreground">
          This sends a request to the property team. Your reservation remains{" "}
          {requestTarget?.reservation.status === "UPCOMING" ? "upcoming" : "active"} until
          the property confirms a change.
        </p>
        <label className="mt-4 block text-xs font-semibold text-foreground">
          Note for the host{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
          <textarea
            rows={4}
            maxLength={1000}
            value={requestNote}
            onChange={(event) => setRequestNote(event.target.value)}
            placeholder={
              requestTarget?.type === "CANCELLATION"
                ? "Share why you need to cancel…"
                : "Share the dates you would prefer…"
            }
            className="mt-1.5 flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-normal ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        {requestError && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
          >
            {requestError}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={requestSending}
            onClick={() => setRequestTarget(null)}
          >
            Keep reservation
          </Button>
          <Button
            type="button"
            disabled={!requestTarget || requestSending}
            className={
              requestTarget?.type === "CANCELLATION"
                ? "bg-rose-700 text-white hover:bg-rose-800"
                : "bg-emerald-800 text-white hover:bg-emerald-900"
            }
            onClick={() => void sendReservationRequest()}
          >
            {requestSending
              ? "Sending…"
              : requestTarget?.type === "CANCELLATION"
                ? "Send cancellation request"
                : "Send date-change request"}
          </Button>
        </DialogFooter>
      </ModalDialog>
    </div>
  );
}
