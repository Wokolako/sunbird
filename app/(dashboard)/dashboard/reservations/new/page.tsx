"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CategoryOption = {
  id: string;
  name: string;
  basePrice: string;
  maxAdults: number;
  maxChildren: number;
};
type PropertyOption = { id: string; name: string; roomCategories: CategoryOption[] };
type Availability = {
  property: { id: string; name: string; currency: string };
  category: {
    id: string;
    name: string;
    nightlyRate: string;
    baseRoomTotal: string;
    nights: number;
    maxAdults: number;
    maxChildren: number;
  };
  availableUnits: Array<{ id: string; name: string }>;
};
type CreatedReservation = {
  referenceCode: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  currency: string;
  roomUnit: { name: string } | null;
  roomCategory: { name: string };
  guest: { name: string | null };
};

const fieldClass =
  "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
const areaClass =
  "mt-1 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function tomorrowValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return localDateValue(tomorrow);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export default function NewReservationPage() {
  const router = useRouter();
  const [properties, setProperties] = React.useState<PropertyOption[]>([]);
  const [propertyId, setPropertyId] = React.useState("");
  const [roomCategoryId, setRoomCategoryId] = React.useState("");
  const [checkIn, setCheckIn] = React.useState(localDateValue(new Date()));
  const [checkOut, setCheckOut] = React.useState(tomorrowValue());
  const [adults, setAdults] = React.useState(1);
  const [children, setChildren] = React.useState(0);
  const [source, setSource] = React.useState<"WALK_IN" | "PHONE">("WALK_IN");
  const [guestName, setGuestName] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [specialRequests, setSpecialRequests] = React.useState("");
  const [availability, setAvailability] = React.useState<Availability | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [checkingAvailability, setCheckingAvailability] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState<CreatedReservation | null>(null);

  React.useEffect(() => {
    let active = true;
    async function loadProperties() {
      try {
        const response = await fetch("/api/dashboard/reservations", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load your properties.");
        if (!active) return;
        setProperties(data.properties || []);
        const firstProperty = data.properties?.[0];
        if (firstProperty) {
          setPropertyId(firstProperty.id);
          setRoomCategoryId(firstProperty.roomCategories?.[0]?.id || "");
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your properties."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProperties();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    setAvailability(null);
    setError("");
    if (!propertyId || !roomCategoryId || !checkIn || !checkOut || checkOut <= checkIn) {
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCheckingAvailability(true);
      try {
        const params = new URLSearchParams({
          propertyId,
          roomCategoryId,
          checkIn,
          checkOut,
        });
        const response = await fetch(`/api/dashboard/reservations?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not check availability.");
        if (active) setAvailability(data);
      } catch (availabilityError) {
        if (active && !controller.signal.aborted) {
          setError(
            availabilityError instanceof Error
              ? availabilityError.message
              : "Could not check availability."
          );
        }
      } finally {
        if (active) setCheckingAvailability(false);
      }
    }, 250);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [propertyId, roomCategoryId, checkIn, checkOut]);

  const selectedProperty = properties.find((property) => property.id === propertyId);
  const selectedCategory = selectedProperty?.roomCategories.find(
    (category) => category.id === roomCategoryId
  );
  const hasAvailability = Boolean(availability?.availableUnits.length);
  const capacityValid =
    !selectedCategory ||
    (adults <= selectedCategory.maxAdults && children <= selectedCategory.maxChildren);

  function selectProperty(value: string) {
    setPropertyId(value);
    setRoomCategoryId(
      properties.find((property) => property.id === value)?.roomCategories[0]?.id || ""
    );
    setAvailability(null);
  }

  async function createReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          roomCategoryId,
          checkIn,
          checkOut,
          guestName,
          guestEmail,
          guestPhone,
          adults,
          children,
          source,
          specialRequests,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not create the reservation.");
      setSuccess(data.reservation);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create the reservation."
      );
      if (createError instanceof Error && createError.message.includes("just booked")) {
        setAvailability(null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-emerald-200 bg-white text-slate-900 shadow-sm">
          <CardContent className="px-6 py-10 text-center sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
            </div>
            <Badge className="mt-4 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
              Reservation created
            </Badge>
            <h1 className="mt-3 font-serif text-2xl font-bold text-slate-900">
              Booking confirmed
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {success.guest.name || guestName} is booked at{" "}
              {availability?.property.name || selectedProperty?.name}.
            </p>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500">Booking reference</dt>
                  <dd className="mt-0.5 font-mono font-bold text-slate-900">
                    {success.referenceCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Room</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {success.roomUnit?.name || success.roomCategory.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Stay</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">
                    {formatDate(success.checkInDate.slice(0, 10))} –{" "}
                    {formatDate(success.checkOutDate.slice(0, 10))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Base room total</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: success.currency,
                    }).format(Number(success.totalAmount))}
                  </dd>
                </div>
              </dl>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              This is the base room rate only. No payment has been recorded; taxes,
              additional fees, and payment collection are not configured in this flow.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/reservations")}
              >
                View reservations
              </Button>
              <Button
                className="bg-amber-700 text-white hover:bg-amber-800"
                onClick={() => router.push("/dashboard/reservations/new")}
              >
                Create another reservation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/dashboard/reservations"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back to reservations
        </Link>
        <div className="flex items-center gap-2 text-amber-700">
          <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Front desk
          </span>
        </div>
        <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          New Reservation
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter guest and stay details, then confirm an available room.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {!loading && properties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CalendarDays aria-hidden="true" className="h-9 w-9 text-slate-400" />
            <h2 className="mt-3 text-sm font-semibold text-slate-800">
              No approved property available
            </h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Your account must be assigned to an approved property with room categories
              before reservations can be created.
            </p>
            <Link href="/dashboard/properties" className="mt-4">
              <Button variant="outline" size="sm">
                Manage my properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <form
          onSubmit={createReservation}
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div className="space-y-6">
            <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <CalendarDays aria-hidden="true" className="h-4 w-4 text-amber-700" />
                  Stay details
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Select a property and dates to check room availability.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="block text-sm font-medium text-slate-800">
                  Property
                  <select
                    required
                    value={propertyId}
                    onChange={(event) => selectProperty(event.target.value)}
                    className={fieldClass}
                    disabled={loading || properties.length === 0}
                  >
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-800">
                    Check-in
                    <input
                      required
                      type="date"
                      min={localDateValue(new Date())}
                      value={checkIn}
                      onChange={(event) => setCheckIn(event.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Check-out
                    <input
                      required
                      type="date"
                      min={checkIn || localDateValue(new Date())}
                      value={checkOut}
                      onChange={(event) => setCheckOut(event.target.value)}
                      className={fieldClass}
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-slate-800">
                  Room category
                  <select
                    required
                    value={roomCategoryId}
                    onChange={(event) => {
                      setRoomCategoryId(event.target.value);
                      setAvailability(null);
                    }}
                    className={fieldClass}
                    disabled={!selectedProperty?.roomCategories.length}
                  >
                    {(selectedProperty?.roomCategories || []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} ·{" "}
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: "GBP",
                        }).format(Number(category.basePrice))}{" "}
                        / night
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-800">
                    Adults
                    <input
                      required
                      type="number"
                      min={1}
                      max={20}
                      value={adults}
                      onChange={(event) => setAdults(Number(event.target.value))}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Children
                    <input
                      required
                      type="number"
                      min={0}
                      max={20}
                      value={children}
                      onChange={(event) => setChildren(Number(event.target.value))}
                      className={fieldClass}
                    />
                  </label>
                </div>
                {selectedCategory && !capacityValid && (
                  <p role="alert" className="text-xs text-red-700">
                    Guest count exceeds this room category&apos;s maximum capacity.
                  </p>
                )}
                <label className="block text-sm font-medium text-slate-800">
                  Booking source
                  <select
                    value={source}
                    onChange={(event) =>
                      setSource(event.target.value as "WALK_IN" | "PHONE")
                    }
                    className={fieldClass}
                  >
                    <option value="WALK_IN">Walk-in</option>
                    <option value="PHONE">Phone</option>
                  </select>
                </label>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                  <UserRound aria-hidden="true" className="h-4 w-4 text-amber-700" />
                  Guest details
                </CardTitle>
                <CardDescription className="text-slate-600">
                  An existing guest account is matched by email; otherwise a guest profile
                  is created.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="block text-sm font-medium text-slate-800">
                  Guest full name
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    autoComplete="name"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    className={fieldClass}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-800">
                    Email
                    <input
                      required
                      type="email"
                      maxLength={254}
                      autoComplete="email"
                      value={guestEmail}
                      onChange={(event) => setGuestEmail(event.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-800">
                    Phone number
                    <input
                      type="tel"
                      maxLength={40}
                      autoComplete="tel"
                      value={guestPhone}
                      onChange={(event) => setGuestPhone(event.target.value)}
                      className={fieldClass}
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-slate-800">
                  Special requests{" "}
                  <span className="font-normal text-slate-500">(optional)</span>
                  <textarea
                    maxLength={2000}
                    rows={3}
                    value={specialRequests}
                    onChange={(event) => setSpecialRequests(event.target.value)}
                    placeholder="Accessibility needs, arrival notes, or other requests."
                    className={areaClass}
                  />
                </label>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="h-fit border-slate-200 bg-white text-slate-900 shadow-sm lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle className="text-base text-slate-900">
                  Availability &amp; total
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Rooms are assigned from live inventory for the selected dates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {checkingAvailability ? (
                  <p role="status" className="text-sm text-slate-500">
                    Checking available rooms...
                  </p>
                ) : availability ? (
                  <>
                    <div
                      className={`rounded-lg border px-3 py-2.5 text-sm ${
                        hasAvailability
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-amber-200 bg-amber-50 text-amber-900"
                      }`}
                    >
                      {hasAvailability
                        ? `${availability.availableUnits.length} room${availability.availableUnits.length === 1 ? "" : "s"} available`
                        : "No rooms available for these dates"}
                    </div>
                    {hasAvailability && (
                      <>
                        <div className="space-y-2 border-b border-slate-200 pb-4 text-sm">
                          <div className="flex justify-between gap-3 text-slate-600">
                            <span>
                              {availability.category.nights} night
                              {availability.category.nights === 1 ? "" : "s"} ×{" "}
                              {new Intl.NumberFormat(undefined, {
                                style: "currency",
                                currency: availability.property.currency,
                              }).format(Number(availability.category.nightlyRate))}
                            </span>
                            <span className="font-medium text-slate-900">
                              {new Intl.NumberFormat(undefined, {
                                style: "currency",
                                currency: availability.property.currency,
                              }).format(Number(availability.category.baseRoomTotal))}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between gap-3 text-sm font-bold text-slate-900">
                          <span>Base room total</span>
                          <span>
                            {new Intl.NumberFormat(undefined, {
                              style: "currency",
                              currency: availability.property.currency,
                            }).format(Number(availability.category.baseRoomTotal))}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-500">
                          Taxes, additional fees, and add-ons are not included. Payment is
                          not collected by this form.
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    Choose a valid date range and room category to check availability.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    loading ||
                    checkingAvailability ||
                    !availability ||
                    !hasAvailability ||
                    !capacityValid
                  }
                  className="w-full gap-2 bg-amber-700 text-white hover:bg-amber-800"
                >
                  <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
                  {submitting ? "Creating reservation..." : "Confirm reservation"}
                </Button>
                <p className="text-center text-[11px] leading-relaxed text-slate-500">
                  Confirming assigns one room and creates an upcoming reservation. A
                  conflict check is repeated when you submit.
                </p>
              </CardContent>
            </Card>
          </aside>
        </form>
      )}
    </div>
  );
}
