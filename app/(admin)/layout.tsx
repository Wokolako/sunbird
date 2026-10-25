"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ShieldAlert,
  Building,
  Users,
  FileText,
  Sliders,
  ExternalLink,
  LogOut,
  Activity,
  CheckCircle2,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const ADMIN_NAV_ITEMS = [
  {
    name: "Platform Analytics",
    href: "/admin",
    icon: Activity,
  },
  {
    name: "Property Verifications",
    href: "/admin/properties",
    icon: Building,
  },
  {
    name: "User Roles & Accounts",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Audit Trail & Security",
    href: "/admin/audit",
    icon: FileText,
  },
  {
    name: "Platform Settings",
    href: "/admin/settings",
    icon: Sliders,
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] text-slate-900">
      {/* Super Admin Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        {/* Brand */}
        <div className="flex items-center space-x-3 border-b border-slate-200 p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold text-slate-900">Vabbot Resorts</span>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Super Admin
              </span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "border border-amber-200 bg-amber-50 text-amber-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-amber-700" : ""}`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Footer Controls */}
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center space-x-3">
            <Avatar
              fallback="SA"
              className="border-amber-200 bg-amber-100 text-amber-800"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">
                {user?.name || "Super Admin"}
              </p>
              <span               className="block truncate text-xs text-slate-500">
                {user?.email || "admin@sunbird.com"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/"
              className="flex items-center justify-center gap-1 rounded-md border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Marketplace <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center justify-center gap-1 rounded-md border border-red-200 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Sign Out <LogOut className="h-3 w-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Wrapper */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center space-x-4 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">Platform Command Console</span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Database className="h-3.5 w-3.5" /> PostgreSQL Connected
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-amber-800"
            >
              SUPER_ADMIN ROLE ENFORCED
            </Badge>
          </div>
        </header>

        {/* Admin Children View */}
        <main className="admin-content flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
