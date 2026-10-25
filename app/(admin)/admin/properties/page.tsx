"use client";

import * as React from "react";
import { Building2, Check, Clock3, MapPin, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Property = {
  id: string;
  name: string;
  city: string;
  stateOrRegion: string;
  type: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  registrationNumber: string | null;
  createdAt: string;
  staff: Array<{ user: { id: string; name: string | null; email: string } }>;
  _count: { roomCategories: number; staff: number };
};

type AuditEvent = {
  id: string;
  action: string;
  entity: string;
  details: string | null;
  userEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
};

type PropertyAudit = {
  property: Pick<
    Property,
    "id" | "name" | "city" | "stateOrRegion" | "status" | "createdAt"
  > & { updatedAt: string };
  events: AuditEvent[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusStyle(status: string) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "SUSPENDED":
      return "border-red-200 bg-red-50 text-red-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedProperty, setSelectedProperty] = React.useState<Property | null>(null);
  const [audit, setAudit] = React.useState<PropertyAudit | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [auditLoading, setAuditLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [declineTarget, setDeclineTarget] = React.useState<Property | null>(null);
  const [declineReason, setDeclineReason] = React.useState("");
  const [reviewingId, setReviewingId] = React.useState("");
  const [reviewError, setReviewError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    async function loadProperties() {
      try {
        const response = await fetch("/api/admin/properties", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Could not load platform properties.");
        }
        if (active) setProperties(data.properties);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load platform properties."
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

  const filteredProperties = properties.filter((property) =>
    [
      property.name,
      property.city,
      property.stateOrRegion,
      property.type,
      property.status,
      property.registrationNumber,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function openAudit(property: Property) {
    setSelectedProperty(property);
    setAudit(null);
    setError("");
    setAuditLoading(true);

    try {
      const response = await fetch(
        `/api/admin/properties/${encodeURIComponent(property.id)}/audit`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not load the audit trail.");
      }
      setAudit(data);
    } catch (auditError) {
      setError(
        auditError instanceof Error
          ? auditError.message
          : "Could not load the audit trail."
      );
    } finally {
      setAuditLoading(false);
    }
  }

  function closeAudit(open: boolean) {
    if (!open && !auditLoading) {
      setSelectedProperty(null);
      setAudit(null);
      setError("");
    }
  }

  async function submitDecision(
    property: Property,
    decision: "approve" | "decline",
    reason = ""
  ) {
    setReviewingId(property.id);
    setReviewError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/properties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property.id, decision, reason }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not save the review decision.");
      }
      setProperties((current) =>
        current.map((item) =>
          item.id === data.property.id ? { ...item, status: data.property.status } : item
        )
      );
      setNotice(
        `${property.name} was ${decision === "approve" ? "approved" : "declined"}.`
      );
      setDeclineTarget(null);
      setDeclineReason("");
    } catch (decisionError) {
      setReviewError(
        decisionError instanceof Error
          ? decisionError.message
          : "Could not save the review decision."
      );
    } finally {
      setReviewingId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-amber-700">
            <Building2 aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Property oversight
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Properties &amp; verification
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review new property submissions, record a decision, and inspect audit history.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-slate-300 bg-white text-slate-600"
        >
          {properties.length} {properties.length === 1 ? "property" : "properties"}
        </Badge>
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {reviewError && !declineTarget && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {reviewError}
        </p>
      )}

      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
        <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base text-slate-900">Property directory</CardTitle>
            <CardDescription className="mt-1 text-slate-600">
              Select Audit to review the recorded events for a property.
            </CardDescription>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <Input
              aria-label="Search properties"
              placeholder="Search property or location..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 border-slate-300 bg-white pl-9 text-slate-900 placeholder:text-slate-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p role="status" className="py-8 text-center text-sm text-slate-500">
              Loading platform properties...
            </p>
          ) : error && !selectedProperty ? (
            <p role="alert" className="py-8 text-center text-sm text-red-700">
              {error}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-600">Property</TableHead>
                    <TableHead className="text-slate-600">Submitted by</TableHead>
                    <TableHead className="text-slate-600">Type</TableHead>
                    <TableHead className="text-slate-600">Rooms</TableHead>
                    <TableHead className="text-slate-600">Verification</TableHead>
                    <TableHead className="text-right text-slate-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow
                      key={property.id}
                      className="border-slate-200 hover:bg-slate-50"
                    >
                      <TableCell className="font-semibold text-slate-800">
                        {property.name}
                        <span className="mt-1 flex items-center gap-1 text-xs font-normal text-slate-500">
                          <MapPin aria-hidden="true" className="h-3 w-3" />
                          {[property.city, property.stateOrRegion]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {property.staff[0]?.user.name ||
                          property.staff[0]?.user.email ||
                          "—"}
                        {property.staff[0]?.user.name && (
                          <span className="block text-xs text-slate-500">
                            {property.staff[0].user.email}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-slate-300 text-slate-700"
                        >
                          {property.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {property._count.roomCategories}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusStyle(property.status)}>
                          {property.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {property.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                disabled={reviewingId === property.id}
                                onClick={() => void submitDecision(property, "approve")}
                                className="h-8 bg-emerald-700 text-xs text-white hover:bg-emerald-800"
                              >
                                <Check aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={reviewingId === property.id}
                                onClick={() => {
                                  setReviewError("");
                                  setDeclineReason("");
                                  setDeclineTarget(property);
                                }}
                                className="h-8 border-red-200 text-xs text-red-700 hover:bg-red-50"
                              >
                                <X aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
                                Decline
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void openAudit(property)}
                            className="h-8 border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            <Clock3 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                            Audit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredProperties.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                        {search
                          ? "No properties match your search."
                          : "No properties found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(declineTarget)}
        onOpenChange={(open) => {
          if (!open && !reviewingId) {
            setDeclineTarget(null);
            setReviewError("");
          }
        }}
      >
        {declineTarget && (
          <div className="space-y-5 text-slate-900">
            <DialogHeader className="pr-6">
              <DialogTitle className="text-slate-900">
                Decline property application
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                The owner will see that the application was declined. Add a reason so they
                know what needs attention.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{declineTarget.name}</p>
              <p className="mt-1 text-xs text-slate-600">
                {declineTarget.staff[0]?.user.name ||
                  declineTarget.staff[0]?.user.email ||
                  "Property owner"}
              </p>
            </div>
            <label
              htmlFor="property-decline-reason"
              className="block text-sm font-medium text-slate-800"
            >
              Reason for declining
              <textarea
                id="property-decline-reason"
                value={declineReason}
                onChange={(event) => setDeclineReason(event.target.value)}
                maxLength={1000}
                rows={4}
                required
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              />
            </label>
            {reviewError && (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {reviewError}
              </p>
            )}
            <DialogFooter className="gap-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(reviewingId)}
                onClick={() => setDeclineTarget(null)}
                className="border-slate-300 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!declineReason.trim() || Boolean(reviewingId)}
                onClick={() =>
                  void submitDecision(declineTarget, "decline", declineReason.trim())
                }
                className="bg-red-700 text-white hover:bg-red-800"
              >
                {reviewingId ? "Saving..." : "Confirm decline"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <Dialog open={Boolean(selectedProperty)} onOpenChange={closeAudit}>
        {selectedProperty && (
          <div className="space-y-5 text-slate-900">
            <DialogHeader className="pr-6">
              <DialogTitle className="text-slate-900">Property audit trail</DialogTitle>
              <DialogDescription className="text-slate-600">
                Recorded activity associated with this property.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {audit?.property.name || selectedProperty.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {[selectedProperty.city, selectedProperty.stateOrRegion]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={statusStyle(
                    audit?.property.status || selectedProperty.status
                  )}
                >
                  {audit?.property.status || selectedProperty.status}
                </Badge>
              </div>
            </div>

            {auditLoading ? (
              <p role="status" className="py-6 text-center text-sm text-slate-500">
                Loading audit events...
              </p>
            ) : error ? (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            ) : (
              <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-1">
                {audit?.events.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {event.action.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.userEmail || "System"} · {event.entity}
                        </p>
                      </div>
                      <time dateTime={event.createdAt} className="text-xs text-slate-500">
                        {formatDate(event.createdAt)}
                      </time>
                    </div>
                    {event.details && (
                      <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">
                        {event.details}
                      </p>
                    )}
                    {event.ipAddress && (
                      <p className="mt-2 font-mono text-[11px] text-slate-500">
                        IP: {event.ipAddress}
                      </p>
                    )}
                  </article>
                ))}
                {audit && !audit.events.length && (
                  <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    No audit events have been recorded for this property yet.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
