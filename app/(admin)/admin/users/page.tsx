"use client";

import * as React from "react";
import { UserRole } from "@prisma/client";
import { Shield, Users } from "lucide-react";
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

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
};

const ROLE_STYLES: Record<UserRole, string> = {
  ADMIN: "border-red-200 bg-red-50 text-red-700",
  OWNER: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MANAGER: "border-sky-200 bg-sky-50 text-sky-700",
  FRONT_DESK: "border-slate-200 bg-slate-50 text-slate-700",
  HOUSEKEEPER: "border-amber-200 bg-amber-50 text-amber-800",
  GUEST: "border-slate-200 bg-white text-slate-600",
};

function formatRole(role: UserRole) {
  return role.replaceAll("_", " ");
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [search, setSearch] = React.useState("");
  const [editingUser, setEditingUser] = React.useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("GUEST");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  React.useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load users.");
        if (active) setUsers(data.users);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Could not load users."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadUsers();
    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = users.filter((user) =>
    [user.name, user.email, user.phone, user.role]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function openRoleEditor(user: AdminUser) {
    setError("");
    setNotice("");
    setSelectedRole(user.role);
    setEditingUser(user);
  }

  async function saveRole() {
    if (!editingUser) return;
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser.id, role: selectedRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update role.");

      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === data.user.id ? data.user : user))
      );
      setEditingUser(null);
      setNotice(`Role updated for ${data.user.name || data.user.email}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update role.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-amber-700">
            <Users aria-hidden="true" className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Access management
            </span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Platform users &amp; roles
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review platform accounts and update role assignments.
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-slate-300 bg-white text-slate-600"
        >
          {users.length} {users.length === 1 ? "account" : "accounts"}
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
      {error && !editingUser && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
        <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base text-slate-900">User directory</CardTitle>
            <CardDescription className="mt-1 text-slate-600">
              Role changes are recorded in the platform audit trail.
            </CardDescription>
          </div>
          <Input
            aria-label="Search users"
            placeholder="Search name, email, phone, or role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <p role="status" className="py-8 text-center text-sm text-slate-500">
              Loading platform users...
            </p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-600">Full name</TableHead>
                    <TableHead className="text-slate-600">Email address</TableHead>
                    <TableHead className="text-slate-600">Role</TableHead>
                    <TableHead className="text-slate-600">Phone</TableHead>
                    <TableHead className="text-right text-slate-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-slate-200 hover:bg-slate-50"
                    >
                      <TableCell className="font-medium text-slate-800">
                        {user.name || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ROLE_STYLES[user.role]}>
                          {formatRole(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {user.phone || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRoleEditor(user)}
                          className="h-8 border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          <Shield aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                          Manage role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredUsers.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                        {search ? "No users match your search." : "No users found."}
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
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open && !saving) setEditingUser(null);
        }}
      >
        {editingUser && (
          <div className="space-y-5 text-slate-900">
            <DialogHeader className="pr-6">
              <DialogTitle className="text-slate-900">Manage user role</DialogTitle>
              <DialogDescription className="text-slate-600">
                Change the platform permissions assigned to this account.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                {editingUser.name || "Unnamed user"}
              </p>
              <p className="mt-1 break-all text-xs text-slate-600">{editingUser.email}</p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="admin-user-role"
                className="text-sm font-medium text-slate-800"
              >
                Platform role
              </label>
              <select
                id="admin-user-role"
                value={selectedRole}
                onChange={(event) => {
                  const nextRole = Object.values(UserRole).find(
                    (role) => role === event.target.value
                  );
                  if (nextRole) setSelectedRole(nextRole);
                }}
                disabled={saving}
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {formatRole(role)}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-relaxed text-slate-500">
                Administrator access grants broad platform control. Role changes are
                recorded in the audit trail.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <DialogFooter className="gap-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => setEditingUser(null)}
                className="border-slate-300 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saving || selectedRole === editingUser.role}
                onClick={() => void saveRole()}
                className="bg-amber-700 text-white hover:bg-amber-800"
              >
                {saving ? "Saving..." : "Save role"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
