"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, Clock3, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type OwnerProperty = {
  id: string;
  name: string;
  type: "HOTEL" | "LODGE";
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  city: string;
  stateOrRegion: string;
  country: string;
  createdAt: string;
  reviewReason: string | null;
};

const statusStyles: Record<OwnerProperty["status"], string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  SUSPENDED: "border-slate-200 bg-slate-100 text-slate-700",
};

const fieldClass =
  "mt-1 flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = React.useState<OwnerProperty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const loadProperties = React.useCallback(async () => {
    const response = await fetch("/api/owner/properties", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Could not load your properties.");
    }
    setProperties(data.properties);
  }, []);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        await loadProperties();
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

    void load();
    return () => {
      active = false;
    };
  }, [loadProperties]);

  async function submitProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/owner/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not submit the property.");
      }
      setMessage(
        `${data.property.name} has been submitted. An administrator must review it before it can be published.`
      );
      form.reset();
      await loadProperties();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the property."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>
          <div className="flex items-center gap-2 text-amber-700">
            <Building2 aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Owner portal
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            My properties
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Submit another lodge or hotel owned by your account for administrator review.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-slate-300 bg-white text-slate-600"
        >
          {properties.length} {properties.length === 1 ? "property" : "properties"}
        </Badge>
      </div>

      {message && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Card className="h-fit border-slate-200 bg-white text-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Add another property</CardTitle>
            <CardDescription className="text-slate-600">
              New submissions are saved as pending and reviewed by the Vabbot admin team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitProperty}>
              <label className="block text-sm font-medium text-slate-800">
                Property name
                <input
                  name="name"
                  required
                  minLength={3}
                  maxLength={120}
                  placeholder="e.g. Lakeview Safari Lodge"
                  className={fieldClass}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-800">
                  Property type
                  <select
                    name="type"
                    required
                    className={fieldClass}
                    defaultValue="LODGE"
                  >
                    <option value="LODGE">Lodge</option>
                    <option value="HOTEL">Hotel</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-800">
                  Country
                  <input
                    name="country"
                    required
                    minLength={2}
                    defaultValue="United Kingdom"
                    className={fieldClass}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-800">
                  City
                  <input name="city" required minLength={2} className={fieldClass} />
                </label>
                <label className="block text-sm font-medium text-slate-800">
                  Region
                  <input
                    name="stateOrRegion"
                    required
                    minLength={2}
                    placeholder="County, province, or region"
                    className={fieldClass}
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-800">
                Street address
                <input
                  name="address"
                  required
                  minLength={5}
                  maxLength={300}
                  className={fieldClass}
                />
              </label>

              <label className="block text-sm font-medium text-slate-800">
                Property description
                <textarea
                  name="description"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={4}
                  placeholder="Describe the property and the experience guests can expect."
                  className={`${fieldClass} h-auto min-h-24 resize-y`}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block min-w-0 whitespace-nowrap text-xs font-medium text-slate-800">
                  Business reg. no.
                  <input
                    name="registrationNumber"
                    maxLength={100}
                    className={fieldClass}
                  />
                </label>
                <label className="block min-w-0 whitespace-nowrap text-xs font-medium text-slate-800">
                  Tax ID
                  <input name="taxId" maxLength={100} className={fieldClass} />
                </label>
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                After submission, an administrator must approve the property before it can
                be prepared for publication.
              </p>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full gap-2 bg-amber-700 text-white hover:bg-amber-800"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit for review"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Your submissions</CardTitle>
            <CardDescription className="text-slate-600">
              Track the review status of each property connected to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p role="status" className="py-6 text-sm text-slate-500">
                Loading your properties...
              </p>
            ) : error && !properties.length ? (
              <p role="alert" className="py-6 text-sm text-red-700">
                {error}
              </p>
            ) : properties.length ? (
              <ul className="space-y-3">
                {properties.map((property) => (
                  <li
                    key={property.id}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          {property.name}
                        </h2>
                        <p className="mt-1 text-xs text-slate-600">
                          {[property.city, property.stateOrRegion, property.country]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {property.type === "LODGE" ? "Lodge" : "Hotel"} · Submitted{" "}
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                          }).format(new Date(property.createdAt))}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusStyles[property.status]}>
                        {property.status === "REJECTED" ? "DECLINED" : property.status}
                      </Badge>
                    </div>
                    {property.status === "PENDING" && (
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-800">
                        <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                        Awaiting administrator review
                      </p>
                    )}
                    {property.status === "REJECTED" && property.reviewReason && (
                      <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-800">
                        <span className="font-semibold">Admin note: </span>
                        {property.reviewReason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
                <Building2
                  aria-hidden="true"
                  className="mx-auto h-8 w-8 text-slate-400"
                />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No properties submitted yet
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Use the form to submit your first property.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
