"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Building2,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MarketplaceHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = session?.user;
  const isStaffOrAdmin =
    user?.role &&
    ["ADMIN", "OWNER", "MANAGER", "FRONT_DESK", "HOUSEKEEPER"].includes(user.role);
  const isAdmin = user?.role === "ADMIN";
  const category = searchParams.get("type");

  const marketplaceActive = pathname === "/";
  const lodgesActive =
    pathname === "/hotels" ||
    (pathname === "/search" && ["Hotel", "Lodge", "Lakeside"].includes(category ?? ""));
  const safariActive =
    pathname === "/resorts" || (pathname === "/search" && category === "Resort");
  const destinationsActive = pathname === "/search" && !lodgesActive && !safariActive;
  const navLinks = [
    { href: "/", label: "Marketplace", active: marketplaceActive },
    { href: "/hotels", label: "Lakeside Lodges", active: lodgesActive },
    { href: "/resorts", label: "Safari Camps", active: safariActive },
    { href: "/search", label: "All Destinations", active: destinationsActive },
  ];

  return (
    <header className="bg-card/95 supports-[backdrop-filter]:bg-card/75 sticky top-0 z-40 w-full border-b border-border backdrop-blur">
      <div className="container relative flex h-20 items-center justify-between px-4 sm:px-8">
        <Link
          href="/"
          aria-label="Vabbot Resorts home"
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="ring-primary/10 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 transition-transform group-hover:scale-[1.03]">
            <Compass className="h-5 w-5 text-accent" strokeWidth={1.8} />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-semibold leading-tight tracking-tight text-primary">
              Vabbot <span className="font-normal">Resorts</span>
            </span>
            <span className="mt-1 text-[9px] font-semibold uppercase leading-none tracking-[0.18em] text-muted-foreground">
              Luxury Hospitality &amp; PMS
            </span>
          </div>
        </Link>

        <nav
          aria-label="Main navigation"
          className={`${
            menuOpen ? "flex" : "hidden"
          } absolute left-4 right-4 top-full z-50 flex-col gap-1 rounded-lg border border-border bg-card p-2 text-sm font-medium text-muted-foreground shadow-lg md:static md:flex md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          {navLinks.map(({ href, label, active }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              className={`rounded-md px-3 py-2 transition-colors hover:text-primary md:px-0 md:py-0 ${
                active ? "font-semibold text-foreground" : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
          {isStaffOrAdmin && (
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 hover:bg-primary/5 hidden gap-1.5 text-primary sm:inline-flex"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                PMS Dashboard
              </Button>
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin">
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-1.5 border-amber-600/30 text-amber-700 hover:bg-amber-50 sm:inline-flex"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Admin
              </Button>
            </Link>
          )}

          {session ? (
            <div className="flex items-center space-x-2">
              <Link href="/account">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="hidden text-xs font-semibold sm:inline">
                    {user?.name || user?.email}
                  </span>
                  {user?.role && user.role !== "GUEST" && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                      {user.role}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Sign out"
              >
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="default"
                  size="sm"
                  className="hidden gap-1.5 sm:inline-flex"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  Property Portal
                </Button>
              </Link>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
