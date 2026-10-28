"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Compass, Menu, X, User, Bell, Check } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function MarketplaceHeader() {
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const r = await fetch("/api/backend/api/platform?view=notifications");
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d.notifications)) setNotifications(d.notifications);
        }
      } catch {
        // Silently skip if user unauthenticated
      }
    }
    void fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function markAllRead() {
    try {
      await fetch("/api/backend/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-notifications-read" }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch {
      // Ignore error
    }
  }

  const links = [
    { href: "/search", label: "Find a stay" },
    { href: "/hotels", label: "Hotels & lodges" },
    { href: "/saved", label: "Saved" },
    { href: "/bookings", label: "My stays" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="container relative flex h-20 items-center justify-between gap-3 px-4 sm:px-8">
        <Link href="/" aria-label="Vabbot Resorts home" className="flex shrink-0 items-center gap-2 text-primary">
          <Compass className="h-7 w-7" />
          <span className="font-serif text-xl">Vabbot Resorts</span>
        </Link>
        <nav
          aria-label="Guest navigation"
          className={`${
            open ? "flex" : "hidden"
          } absolute left-4 right-4 top-full flex-col gap-2 rounded-md border border-border bg-card p-4 md:static md:flex md:flex-row md:gap-5 md:border-0 md:p-0`}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className="py-1 text-sm hover:text-primary"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 relative">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setBellOpen(!bellOpen)}
              className="p-2 rounded-md border border-border hover:bg-muted relative flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden text-sm"
                style={{ background: "#ffffff", color: "#0f172a" }}
              >
                <div className="flex items-center justify-between border-b border-border p-3 bg-muted/40">
                  <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Check size={12} /> Mark read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs ${!n.readAt ? "bg-primary/5 font-medium" : "text-muted-foreground"}`}
                      >
                        <div className="font-semibold text-foreground text-[13px]">{n.title}</div>
                        <div className="mt-1 line-clamp-2">{n.body}</div>
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link href="/account" className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <User size={16} />
            <span className="hidden sm:inline">My account</span>
          </Link>
          <button
            className="p-2 md:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
