"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type RoomUnit = {
  id: string;
  name: string;
  status: "VACANT_CLEAN" | "VACANT_DIRTY" | "OCCUPIED" | "MAINTENANCE";
  roomCategory: { id: string; name: string };
};

type PropertyOption = {
  id: string;
  name: string;
};

type Property = PropertyOption & {
  roomUnits: RoomUnit[];
};

type Reservation = {
  id: string;
  roomUnitId: string | null;
  referenceCode: string;
  checkInDate: string;
  checkOutDate: string;
  status: "UPCOMING" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  guest: { name: string | null };
};

type CalendarData = {
  properties: PropertyOption[];
  property: Property;
  reservations: Reservation[];
};

type ViewSize = 3 | 7 | 14;

const viewOptions: Array<{ label: string; days: ViewSize }> = [
  { label: "3 Days", days: 3 },
  { label: "1 Week", days: 7 },
  { label: "2 Weeks", days: 14 },
];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function formatRange(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function statusDot(status: RoomUnit["status"]) {
  switch (status) {
    case "VACANT_CLEAN":
      return "bg-emerald-500";
    case "VACANT_DIRTY":
      return "bg-amber-500";
    case "OCCUPIED":
      return "bg-rose-500";
    case "MAINTENANCE":
      return "bg-slate-400";
  }
}

function reservationPosition(reservation: Reservation, days: Date[]) {
  const firstDay = dateKey(days[0]);
  const lastDay = dateKey(addDays(days[days.length - 1], 1));
  const checkIn = reservation.checkInDate.slice(0, 10);
  const checkOut = reservation.checkOutDate.slice(0, 10);

  if (checkOut <= firstDay || checkIn >= lastDay) return null;

  const start = Math.max(
    0,
    Math.round((parseDate(checkIn).getTime() - days[0].getTime()) / 86_400_000)
  );
  const end = Math.min(
    days.length,
    Math.round((parseDate(checkOut).getTime() - days[0].getTime()) / 86_400_000)
  );

  return { start, span: Math.max(1, end - start) };
}

export default function AvailabilityTapeChart() {
  const [data, setData] = React.useState<CalendarData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [propertyId, setPropertyId] = React.useState("");
  const [viewSize, setViewSize] = React.useState<ViewSize>(7);
  const [rangeStart, setRangeStart] = React.useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function loadCalendar() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          start: dateKey(rangeStart),
          end: dateKey(addDays(rangeStart, viewSize)),
        });
        if (propertyId) params.set("propertyId", propertyId);
        const response = await fetch(`/api/dashboard/calendar?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Could not load calendar data.");
        }
        if (!active) return;
        const calendarData = result as CalendarData;
        setData(calendarData);
      } catch (loadError) {
        if (active && !controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load calendar data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadCalendar();
    return () => {
      active = false;
      controller.abort();
    };
  }, [propertyId, rangeStart, viewSize]);

  const days = React.useMemo(
    () => Array.from({ length: viewSize }, (_, index) => addDays(rangeStart, index)),
    [rangeStart, viewSize]
  );
  const selectedProperty = data?.property;
  const activePropertyId = propertyId || selectedProperty?.id || "";
  const today = dateKey(new Date());
  const visibleReservations = data?.reservations || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">
            Property operations · Interactive grid
          </p>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Availability Tape Chart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review room assignments and start a booking from any open date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-muted/70 flex rounded-lg p-1" aria-label="Calendar range">
            {viewOptions.map((option) => (
              <button
                key={option.days}
                type="button"
                aria-pressed={viewSize === option.days}
                onClick={() => setViewSize(option.days)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  viewSize === option.days
                    ? "bg-white text-emerald-900 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button
              aria-label="Previous date range"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setRangeStart((date) => addDays(date, -viewSize))}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                const date = new Date();
                date.setHours(0, 0, 0, 0);
                setRangeStart(date);
              }}
            >
              Today
            </Button>
            <Button
              aria-label="Next date range"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setRangeStart((date) => addDays(date, viewSize))}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Link
            href="/dashboard/reservations/new"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-emerald-800 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-900"
          >
            <Plus className="h-3.5 w-3.5" />
            New Booking
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p className="flex items-center gap-2 text-emerald-950">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
          <span>
            <strong>Booking guard enabled:</strong> availability is checked before a
            reservation is saved.
          </span>
        </p>
        <span className="text-muted-foreground">
          {formatRange(days[0], days[days.length - 1])} · Select an open date to start a
          booking
        </span>
      </div>

      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : loading ? (
        <div
          role="status"
          className="rounded-xl border bg-white py-16 text-center text-sm text-muted-foreground"
        >
          Loading room availability…
        </div>
      ) : !selectedProperty || selectedProperty.roomUnits.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-4 py-14 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 text-sm font-semibold text-foreground">
            No physical rooms to display
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Add room units to an approved property to see the availability chart.
          </p>
        </div>
      ) : (
        <section
          aria-label="Room availability calendar"
          className="overflow-hidden rounded-xl border bg-white shadow-sm"
        >
          <div className="flex flex-col gap-2 border-b bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <label
                htmlFor="calendar-property"
                className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
              >
                Active property
              </label>
              <select
                id="calendar-property"
                value={activePropertyId}
                onChange={(event) => setPropertyId(event.target.value)}
                className="max-w-[min(70vw,24rem)] truncate rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                {data?.properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-emerald-500" /> Clean
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-amber-500" /> Turnover
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-rose-500" /> Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-slate-400" /> Maintenance
              </span>
            </div>
          </div>
          <div
            className="overflow-x-auto"
            role="region"
            aria-label="Availability chart; scroll horizontally to see all dates"
            tabIndex={0}
          >
            <div
              className="grid min-w-[820px]"
              style={{
                gridTemplateColumns: `190px repeat(${days.length}, minmax(90px, 1fr))`,
              }}
            >
              <div className="sticky left-0 z-30 flex h-11 items-center border-b border-r bg-slate-100 px-4 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                Physical unit
              </div>
              {days.map((day) => {
                const key = dateKey(day);
                const isToday = key === today;
                return (
                  <div
                    key={key}
                    aria-label={day.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                    className={`flex h-11 flex-col items-center justify-center border-b border-r text-[9px] uppercase leading-tight ${
                      isToday
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span className="font-semibold">
                      {day.toLocaleDateString(undefined, { weekday: "short" })}
                    </span>
                    <span className="mt-0.5 font-bold text-foreground">
                      {day.toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
            {selectedProperty.roomUnits.map((room) => {
              const bookings = visibleReservations
                .filter((reservation) => reservation.roomUnitId === room.id)
                .map((reservation) => ({
                  reservation,
                  position: reservationPosition(reservation, days),
                }))
                .filter(
                  (
                    entry
                  ): entry is {
                    reservation: Reservation;
                    position: { start: number; span: number };
                  } => entry.position !== null
                );

              return (
                <div
                  key={room.id}
                  className="grid min-w-[820px]"
                  style={{
                    gridTemplateColumns: `190px repeat(${days.length}, minmax(90px, 1fr))`,
                  }}
                >
                  <div className="sticky left-0 z-20 flex h-12 min-w-0 flex-col justify-center border-b border-r bg-white px-3">
                    <span className="flex items-center gap-2 truncate text-[11px] font-bold text-slate-900">
                      <i
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot(room.status)}`}
                      />
                      {room.name}
                    </span>
                    <span className="truncate pl-3.5 text-[9px] text-slate-500">
                      {room.roomCategory.name}
                    </span>
                  </div>
                  {days.map((day, index) => {
                    const key = dateKey(day);
                    const dateIsPast = key < today;
                    const nextDay = dateKey(addDays(day, 1));
                    const bookingHref = `/dashboard/reservations/new?propertyId=${encodeURIComponent(
                      activePropertyId
                    )}&roomCategoryId=${encodeURIComponent(
                      room.roomCategory.id
                    )}&checkIn=${key}&checkOut=${nextDay}`;
                    return (
                      <Link
                        key={`${room.id}-${key}`}
                        href={bookingHref}
                        aria-label={
                          dateIsPast
                            ? `${room.name}, ${key}: past date`
                            : `Create booking for ${room.name} on ${key}`
                        }
                        aria-disabled={dateIsPast}
                        tabIndex={dateIsPast ? -1 : 0}
                        onClick={(event) => {
                          if (dateIsPast) event.preventDefault();
                        }}
                        style={{ gridColumn: index + 2, gridRow: 1 }}
                        className={`z-0 flex h-12 items-center justify-center border-b border-r transition-colors ${
                          dateIsPast
                            ? "cursor-not-allowed bg-slate-50/70"
                            : "bg-white hover:bg-emerald-50/80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
                        }`}
                        title={dateIsPast ? "Past date" : `Create booking for ${key}`}
                      >
                        <span className="sr-only">Open date</span>
                      </Link>
                    );
                  })}
                  {bookings.map(({ reservation, position }) => (
                    <div
                      key={reservation.id}
                      role="img"
                      aria-label={`${reservation.guest.name || "Guest"} · ${reservation.referenceCode} · ${reservation.checkInDate.slice(0, 10)} to ${reservation.checkOutDate.slice(0, 10)}`}
                      title={`${reservation.guest.name || "Guest"} (${reservation.checkInDate.slice(0, 10)} to ${reservation.checkOutDate.slice(0, 10)}) · ${reservation.referenceCode}`}
                      style={{
                        gridColumn: `${position.start + 2} / span ${position.span}`,
                        gridRow: 1,
                      }}
                      className="z-10 m-1 flex h-10 min-w-0 cursor-default flex-col justify-center overflow-hidden rounded-md border border-emerald-800 bg-emerald-800 px-2 text-white shadow-sm"
                    >
                      <span className="truncate text-[10px] font-bold leading-tight">
                        {reservation.guest.name || "Guest"}
                      </span>
                      <span className="truncate font-mono text-[8px] leading-tight text-emerald-100">
                        {reservation.referenceCode}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-1 border-t bg-slate-50/70 px-4 py-2 text-[10px] text-muted-foreground sm:flex-row sm:justify-between">
            <span>{selectedProperty.roomUnits.length} physical units</span>
            <span>
              {visibleReservations.length} reservations loaded · dates in the past are
              read-only
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
