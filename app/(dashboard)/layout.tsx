"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Building2,
  CalendarDays,
  BedDouble,
  Users2,
  LogOut,
  ExternalLink,
  PlusCircle,
  Bell,
  Sparkles,
  ClipboardList,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

const PMS_NAV_SECTIONS = [
  {
    name: "Operations",
    items: [
      { name: "Front Desk Overview", href: "/dashboard", icon: Building2 },
      {
        name: "Reservations & Folios",
        href: "/dashboard/reservations",
        icon: ClipboardList,
      },
      { name: "Availability Calendar", href: "/dashboard/calendar", icon: CalendarDays },
    ],
  },
  {
    name: "Property Management",
    items: [
      { name: "Rooms & Housekeeping", href: "/dashboard/rooms", icon: BedDouble },
      { name: "Staff & Team", href: "/dashboard/staff", icon: Users2 },
    ],
  },
  {
    name: "Settings",
    items: [
      { name: "Property Settings", href: "/dashboard/settings", icon: SlidersHorizontal },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="bg-muted/30 flex min-h-screen">
      {/* PMS Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
        {/* Active Property Switcher */}
        <div className="border-b border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-[10px] font-extrabold tracking-wide text-white shadow-sm">
              PMS
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground">Vabbot Resorts</p>
              <p className="text-[10px] text-muted-foreground">Property Operations</p>
            </div>
            <Badge
              variant="outline"
              className="ml-auto border-emerald-300 bg-emerald-50 text-xs text-emerald-800"
            >
              Live
            </Badge>
          </div>
          <p className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Active property
          </p>
          <button className="hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border border-border p-2.5 text-left transition">
            <div className="min-w-0 pr-2">
              <strong className="block truncate text-xs font-bold text-foreground">
                Windermere Lakeside Retreat &amp; Lodge
              </strong>
              <span className="block truncate text-xs text-muted-foreground">
                Lake District · Lakefront
              </span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </div>

        {/* PMS Navigation Links */}
        <nav
          aria-label="Property operations"
          className="flex-1 space-y-5 overflow-y-auto p-3"
        >
          {PMS_NAV_SECTIONS.map((section) => (
            <div key={section.name}>
              <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {section.name}
              </p>
              <div className="space-y-1">
                {section.name === "Property Management" && user?.role === "OWNER" && (
                  <Link
                    href="/dashboard/properties"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      pathname.startsWith("/dashboard/properties")
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>My properties</span>
                  </Link>
                )}
                {section.items.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);

                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-emerald-800 text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card & Portal Actions */}
        <div className="bg-muted/20 border-t border-border p-4">
          <div className="mb-3 flex items-center space-x-3">
            <Avatar fallback={user?.name || "OP"} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-foreground">
                {user?.name || "Property Manager"}
              </p>
              <div className="mt-0.5 flex items-center gap-1">
                <Badge variant="secondary" className="px-1 py-0 font-mono text-[9px]">
                  {user?.role || "MANAGER"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-center gap-1 rounded-md border border-border py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Marketplace <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="border-destructive/20 hover:bg-destructive/10 flex items-center justify-center gap-1 rounded-md border py-1.5 text-xs font-medium text-destructive"
            >
              Sign Out <LogOut className="h-3 w-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main PMS Content Zone */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* PMS Top Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Front Desk Operations
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs font-medium text-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {user?.role === "OWNER" && (
              <Link
                href="/dashboard/properties"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-muted sm:px-3"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>My properties</span>
              </Link>
            )}
            {["OWNER", "MANAGER", "FRONT_DESK"].includes(user?.role || "") && (
              <Link
                href="/dashboard/reservations/new"
                className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <PlusCircle className="h-4 w-4 text-accent" />
                <span>New Reservation</span>
              </Link>
            )}
            <Button variant="outline" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
            </Button>
          </div>
        </header>

        {/* Dashboard Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
