"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Check, Save, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PropertyOption = { id: string; name: string };
type PropertySettings = {
  id: string;
  name: string;
  legalName: string | null;
  description: string;
  address: string;
  city: string;
  stateOrRegion: string;
  country: string;
  postalCode: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  checkInTime: string;
  checkOutTime: string;
  rules: string | null;
  cancellationPolicy: string | null;
  petsAllowed: boolean;
  smokingAllowed: boolean;
};

const fieldClass =
  "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
const textAreaClass =
  "mt-1 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

export default function PropertySettingsPage() {
  const [properties, setProperties] = React.useState<PropertyOption[]>([]);
  const [propertyId, setPropertyId] = React.useState("");
  const [settings, setSettings] = React.useState<PropertySettings | null>(null);
  const [loadingProperties, setLoadingProperties] = React.useState(true);
  const [loadingSettings, setLoadingSettings] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    let active = true;
    async function loadProperties() {
      try {
        const response = await fetch("/api/owner/properties", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load your properties.");
        if (!active) return;
        const options = (data.properties || []).map((property: PropertyOption) => ({
          id: property.id,
          name: property.name,
        }));
        setProperties(options);
        if (options.length) setPropertyId((current) => current || options[0].id);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your properties."
          );
        }
      } finally {
        if (active) setLoadingProperties(false);
      }
    }
    void loadProperties();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!propertyId) {
      setSettings(null);
      return;
    }

    let active = true;
    async function loadSettings() {
      setLoadingSettings(true);
      setError("");
      setMessage("");
      try {
        const response = await fetch(
          `/api/owner/settings?propertyId=${encodeURIComponent(propertyId)}`,
          { cache: "no-store" }
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Could not load property settings.");
        if (active) setSettings(data.property);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load property settings."
          );
        }
      } finally {
        if (active) setLoadingSettings(false);
      }
    }
    void loadSettings();
    return () => {
      active = false;
    };
  }, [propertyId]);

  function updateField<K extends keyof PropertySettings>(
    key: K,
    value: PropertySettings[K]
  ) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/owner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, propertyId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not save property settings.");
      setMessage("Property settings saved.");
      setProperties((current) =>
        current.map((property) =>
          property.id === propertyId
            ? { ...property, name: data.property.name }
            : property
        )
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save property settings."
      );
    } finally {
      setSaving(false);
    }
  }

  const input = (
    key: keyof PropertySettings,
    label: string,
    options?: { type?: string; placeholder?: string; required?: boolean }
  ) => (
    <label className="block text-sm font-medium text-slate-800">
      {label}
      <input
        type={options?.type || "text"}
        value={String(settings?.[key] ?? "")}
        required={options?.required}
        onChange={(event) =>
          updateField(key, event.target.value as PropertySettings[typeof key])
        }
        placeholder={options?.placeholder}
        className={fieldClass}
      />
    </label>
  );

  const selectedProperty = properties.find((property) => property.id === propertyId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>
          <div className="flex items-center gap-2 text-amber-700">
            <Settings2 aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Property management
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Property Settings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Keep your listing information, guest policies, and contact details up to date.
          </p>
        </div>
        <label className="w-full text-xs font-semibold text-slate-700 sm:max-w-xs">
          Property
          <select
            className={fieldClass}
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            disabled={loadingProperties || properties.length === 0}
          >
            {properties.length === 0 ? (
              <option value="">No properties available</option>
            ) : (
              properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {message && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {!loadingProperties && properties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Building2 aria-hidden="true" className="h-9 w-9 text-slate-400" />
            <h2 className="mt-3 text-sm font-semibold text-slate-800">
              No property available
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add a property to your owner account before editing its settings.
            </p>
            <Link href="/dashboard/properties" className="mt-4">
              <Button variant="outline" size="sm">
                View my properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : loadingSettings || !settings ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500" role="status">
            {loadingSettings
              ? "Loading property settings..."
              : "Select a property to continue."}
          </CardContent>
        </Card>
      ) : (
        <form className="space-y-6" onSubmit={saveSettings}>
          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    Listing details
                  </CardTitle>
                  <CardDescription className="mt-1 text-slate-600">
                    Core information for {selectedProperty?.name || "this property"}.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="hidden border-slate-300 sm:inline-flex"
                >
                  Profile
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {input("name", "Property name", { required: true })}
                {input("legalName", "Registered business name")}
              </div>
              <label className="block text-sm font-medium text-slate-800">
                Description
                <textarea
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={4}
                  value={settings.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className={textAreaClass}
                />
              </label>
              <label className="block text-sm font-medium text-slate-800">
                Street address
                <input
                  required
                  value={settings.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  className={fieldClass}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {input("city", "City", { required: true })}
                {input("stateOrRegion", "Region", { required: true })}
                {input("country", "Country", { required: true })}
                {input("postalCode", "Postal code")}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">
                Contact &amp; arrival
              </CardTitle>
              <CardDescription className="text-slate-600">
                Contact details and standard guest arrival/departure times.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {input("contactEmail", "Contact email", { type: "email" })}
                {input("contactPhone", "Contact phone", { type: "tel" })}
                {input("website", "Website", {
                  type: "url",
                  placeholder: "https://example.com",
                })}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {input("checkInTime", "Check-in time", { type: "time" })}
                {input("checkOutTime", "Check-out time", { type: "time" })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Guest policies</CardTitle>
              <CardDescription className="text-slate-600">
                Set expectations and explain the terms that apply to each stay.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block text-sm font-medium text-slate-800">
                House rules
                <textarea
                  rows={3}
                  maxLength={5000}
                  value={settings.rules || ""}
                  onChange={(event) => updateField("rules", event.target.value)}
                  placeholder="Share quiet hours, check-in instructions, or other guest rules."
                  className={textAreaClass}
                />
              </label>
              <label className="block text-sm font-medium text-slate-800">
                Cancellation policy
                <textarea
                  rows={3}
                  maxLength={5000}
                  value={settings.cancellationPolicy || ""}
                  onChange={(event) =>
                    updateField("cancellationPolicy", event.target.value)
                  }
                  placeholder="Explain the cancellation and refund terms for reservations."
                  className={textAreaClass}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <input
                    type="checkbox"
                    checked={settings.petsAllowed}
                    onChange={(event) => updateField("petsAllowed", event.target.checked)}
                    className="h-4 w-4 accent-amber-700"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      Pets allowed
                    </span>
                    <span className="block text-xs text-slate-500">
                      Guests may bring pets to the property.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3">
                  <input
                    type="checkbox"
                    checked={settings.smokingAllowed}
                    onChange={(event) =>
                      updateField("smokingAllowed", event.target.checked)
                    }
                    className="h-4 w-4 accent-amber-700"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">
                      Smoking allowed
                    </span>
                    <span className="block text-xs text-slate-500">
                      Smoking is permitted in designated property areas.
                    </span>
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              Changes are saved to {selectedProperty?.name || "this property"}.
            </p>
            <Button
              type="submit"
              disabled={saving || loadingSettings}
              className="gap-2 bg-amber-700 text-white hover:bg-amber-800"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              {saving ? "Saving settings..." : "Save property settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
