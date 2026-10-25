"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check, Mail, Plus, Shield, Trash2, Users2 } from "lucide-react";
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
type StaffRole = "OWNER" | "MANAGER" | "FRONT_DESK" | "HOUSEKEEPER";
type StaffMember = {
  id: string;
  userId: string;
  role: StaffRole;
  assignedAt: string;
  user: { name: string | null; email: string; image: string | null };
};

const roles: Array<{ value: Exclude<StaffRole, "OWNER">; label: string }> = [
  { value: "MANAGER", label: "Manager" },
  { value: "FRONT_DESK", label: "Front desk" },
  { value: "HOUSEKEEPER", label: "Housekeeper" },
];

const fieldClass =
  "mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

function roleLabel(role: StaffRole) {
  return role === "FRONT_DESK"
    ? "Front desk"
    : role === "HOUSEKEEPER"
      ? "Housekeeper"
      : role === "OWNER"
        ? "Owner"
        : "Manager";
}

export default function StaffTeamPage() {
  const [properties, setProperties] = React.useState<PropertyOption[]>([]);
  const [propertyId, setPropertyId] = React.useState("");
  const [staff, setStaff] = React.useState<StaffMember[]>([]);
  const [roleEdits, setRoleEdits] = React.useState<Record<string, string>>({});
  const [email, setEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState<Exclude<StaffRole, "OWNER">>("FRONT_DESK");
  const [loadingProperties, setLoadingProperties] = React.useState(true);
  const [loadingStaff, setLoadingStaff] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [busyMember, setBusyMember] = React.useState("");
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

  const loadTeam = React.useCallback(async () => {
    if (!propertyId) {
      setStaff([]);
      return;
    }
    setLoadingStaff(true);
    setError("");
    try {
      const response = await fetch(
        `/api/owner/team?propertyId=${encodeURIComponent(propertyId)}`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the team.");
      setStaff(data.staff);
      setRoleEdits(
        Object.fromEntries(
          (data.staff as StaffMember[]).map((member) => [member.id, member.role])
        )
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load the team."
      );
    } finally {
      setLoadingStaff(false);
    }
  }, [propertyId]);

  React.useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/owner/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, email, role: newRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add the team member.");
      setEmail("");
      setMessage(`${data.membership.user.name || data.membership.user.email} was added.`);
      await loadTeam();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not add the team member."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateRole(member: StaffMember) {
    const role = roleEdits[member.id] as Exclude<StaffRole, "OWNER">;
    if (role === member.role) return;
    setBusyMember(member.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/owner/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: member.id, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update the role.");
      setMessage(`Role updated for ${member.user.name || member.user.email}.`);
      await loadTeam();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not update the role."
      );
    } finally {
      setBusyMember("");
    }
  }

  async function removeMember(member: StaffMember) {
    const label = member.user.name || member.user.email;
    if (!window.confirm(`Remove ${label} from this property's team?`)) return;
    setBusyMember(member.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/owner/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: member.id }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not remove the team member.");
      setMessage(`${label} was removed from this property.`);
      await loadTeam();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Could not remove the team member."
      );
    } finally {
      setBusyMember("");
    }
  }

  const selectedProperty = properties.find((property) => property.id === propertyId);
  const activeStaff = staff.filter((member) => member.role !== "OWNER");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
            <Users2 aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Property management
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Staff &amp; Team
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage who can help run your property and what they can do.
          </p>
        </div>
        <label className="w-full text-xs font-semibold text-slate-700 sm:max-w-xs">
          Property
          <select
            className={fieldClass}
            value={propertyId}
            onChange={(event) => {
              setPropertyId(event.target.value);
              setMessage("");
            }}
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
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
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
            <Users2 aria-hidden="true" className="h-9 w-9 text-slate-400" />
            <h2 className="mt-3 text-sm font-semibold text-slate-800">
              No property available
            </h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add a property to your owner account before setting up its team.
            </p>
            <Link href="/dashboard/properties" className="mt-4">
              <Button variant="outline" size="sm">
                View my properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.8fr)]">
          <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-slate-900">Team members</CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                  {selectedProperty?.name || "Selected property"} · {staff.length}{" "}
                  {staff.length === 1 ? "member" : "members"} including the owner
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-slate-300 bg-white text-slate-700"
              >
                {activeStaff.length} staff
              </Badge>
            </CardHeader>
            <CardContent>
              {loadingStaff ? (
                <p role="status" className="py-8 text-center text-sm text-slate-500">
                  Loading team...
                </p>
              ) : staff.length ? (
                <ul className="divide-y divide-slate-200">
                  {staff.map((member) => {
                    const isOwner = member.role === "OWNER";
                    const label = member.user.name || member.user.email;
                    return (
                      <li
                        key={member.id}
                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-sm font-bold text-amber-800">
                            {label.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {label}
                            </p>
                            <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                              <Mail aria-hidden="true" className="h-3 w-3 shrink-0" />
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          {isOwner ? (
                            <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                              <Shield aria-hidden="true" className="mr-1 h-3 w-3" />
                              Owner
                            </Badge>
                          ) : (
                            <>
                              <select
                                aria-label={`Role for ${label}`}
                                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                value={roleEdits[member.id] || member.role}
                                onChange={(event) =>
                                  setRoleEdits((current) => ({
                                    ...current,
                                    [member.id]: event.target.value,
                                  }))
                                }
                              >
                                {roles.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                              {roleEdits[member.id] !== member.role && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-9 gap-1"
                                  disabled={busyMember === member.id}
                                  onClick={() => void updateRole(member)}
                                >
                                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                                  Save
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label={`Remove ${label}`}
                                className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={busyMember === member.id}
                                onClick={() => void removeMember(member)}
                              >
                                <Trash2 aria-hidden="true" className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {!isOwner && (
                            <span className="sr-only">{roleLabel(member.role)}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
                  <Users2 aria-hidden="true" className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    No team members yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add a staff account to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-fit border-slate-200 bg-white text-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Add a team member</CardTitle>
              <CardDescription className="text-slate-600">
                Add an existing Vabbot account to this property.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={addMember}>
                <label className="block text-sm font-medium text-slate-800">
                  Account email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="staff@example.com"
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-800">
                  Team role
                  <select
                    value={newRole}
                    onChange={(event) =>
                      setNewRole(event.target.value as Exclude<StaffRole, "OWNER">)
                    }
                    className={fieldClass}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-md bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
                  Team members need an account first. Adding an account grants access to
                  the PMS using the selected role.
                </div>
                <Button
                  type="submit"
                  disabled={saving || !propertyId}
                  className="w-full gap-2 bg-amber-700 text-white hover:bg-amber-800"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  {saving ? "Adding member..." : "Add to team"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
