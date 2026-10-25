"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertCircle, PlusCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReservationStatus = "UPCOMING" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
type ReservationRow = {
  id: string;
  referenceCode: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: string;
  currency: string;
  status: ReservationStatus;
  source: "ONLINE" | "WALK_IN" | "PHONE";
  property: { name: string };
  guest: { name: string | null; email: string; phone: string | null };
  roomCategory: { name: string };
  roomUnit: { name: string } | null;
  payments: Array<{ status: string; paymentType: string }>;
};

const filters: Array<{ label: string; value: ReservationStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Confirmed", value: "UPCOMING" },
  { label: "Checked in", value: "CHECKED_IN" },
  { label: "Departed", value: "CHECKED_OUT" },
];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function statusVariant(status: ReservationStatus) {
  if (status === "UPCOMING") return "info";
  if (status === "CHECKED_IN") return "success";
  if (status === "CHECKED_OUT") return "secondary";
  return "outline";
}

export default function ReservationsPage() {
  const { data: session } = useSession();
  const [reservations, setReservations] = React.useState<ReservationRow[]>([]);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<ReservationStatus | "ALL">("ALL");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    async function loadReservations() {
      try {
        const response = await fetch("/api/dashboard/reservations", {
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Could not load reservations.");
        }
        if (active) setReservations(data.reservations || []);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load reservations."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadReservations();
    return () => {
      active = false;
    };
  }, []);

  const visibleReservations = reservations.filter((reservation) => {
    const matchesStatus = filter === "ALL" || reservation.status === filter;
    const searchValue = [
      reservation.referenceCode,
      reservation.guest.name,
      reservation.guest.email,
      reservation.roomCategory.name,
      reservation.property.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesStatus && searchValue.includes(query.trim().toLowerCase());
  });
  const canCreateReservation = ["OWNER", "MANAGER", "FRONT_DESK"].includes(
    session?.user?.role || ""
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Reservations &amp; Folios
          </h1>
          <p className="text-sm text-muted-foreground">
            Search and review reservations for properties assigned to your account.
          </p>
        </div>
        {canCreateReservation && (
          <Link
            href="/dashboard/reservations/new"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-800"
          >
            <PlusCircle aria-hidden="true" className="h-4 w-4 text-accent" />
            New Reservation
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guest, property, or reference..."
                className="h-9 pl-9"
                aria-label="Search reservations"
              />
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {filters.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant={filter === item.value ? "outline" : "ghost"}
                  size="sm"
                  className="text-xs"
                  aria-pressed={filter === item.value}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <p role="alert" className="flex items-center gap-2 py-8 text-sm text-red-700">
              <AlertCircle aria-hidden="true" className="h-4 w-4" />
              {error}
            </p>
          ) : loading ? (
            <p role="status" className="py-8 text-center text-sm text-muted-foreground">
              Loading reservations...
            </p>
          ) : visibleReservations.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking Ref</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Property / Room</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Room total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleReservations.map((reservation) => {
                    const latestPayment = reservation.payments[0];
                    return (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-mono text-xs font-bold text-primary">
                          {reservation.referenceCode}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {reservation.guest.name || "Guest"}
                          <span className="block text-xs text-muted-foreground">
                            {reservation.guest.phone || reservation.guest.email}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {reservation.property.name}
                          <span className="block text-xs text-muted-foreground">
                            {reservation.roomUnit?.name || reservation.roomCategory.name}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {dateLabel(reservation.checkInDate)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {dateLabel(reservation.checkOutDate)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              latestPayment?.status === "COMPLETED"
                                ? "success"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {latestPayment?.status === "COMPLETED"
                              ? "PAID"
                              : latestPayment?.status || "NOT RECORDED"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusVariant(reservation.status)}
                            className="text-xs"
                          >
                            {reservation.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-mono text-xs">
                          {new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: reservation.currency,
                          }).format(Number(reservation.totalAmount))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                {reservations.length
                  ? "No reservations match your search."
                  : "No reservations yet."}
              </p>
              {!reservations.length && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a reservation to see it listed here.
                </p>
              )}
              {canCreateReservation && (
                <Link
                  href="/dashboard/reservations/new"
                  className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline"
                >
                  Create a reservation
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
