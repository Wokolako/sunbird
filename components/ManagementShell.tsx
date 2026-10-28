"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { Brand } from "./SiteShell";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function ManagementHeader({ admin = false }: { admin?: boolean }) {
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const r = await fetch("/api/backend/api/platform?view=notifications");
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d.notifications)) setNotifications(d.notifications);
        }
      } catch {
        // Silently skip if unauthenticated
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

  return (
    <header className="topbar">
      <div className="shell topbar-inner management-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="management-brand" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Brand />
          <span className="badge">{admin ? "Super admin" : "Hotel manager"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <nav
            className="management-nav"
            aria-label={admin ? "Super admin navigation" : "Hotel manager navigation"}
          >
            <Link href="/">
              {admin ? "Platform control centre" : "My property workspace"}
            </Link>
          </nav>

          {/* Manager Notification Bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setBellOpen(!bellOpen)}
              style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: "-4px", right: "-4px", display: "flex", height: "16px", width: "16px", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#dc2626", color: "#fff", fontSize: "10px", fontWeight: "bold" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div
                style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: "320px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#0f172a", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", zIndex: 100, overflow: "hidden", fontSize: "13px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", padding: "10px 14px", background: "#f8fafc" }}>
                  <span style={{ fontWeight: "600", fontSize: "12px", color: "#64748b", textTransform: "uppercase" }}>System Alerts</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{ border: "none", background: "none", color: "#0f172a", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Check size={12} /> Mark read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                      No alerts yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", background: !n.readAt ? "#f0fdf4" : "#ffffff" }}
                      >
                        <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "13px" }}>{n.title}</div>
                        <div style={{ color: "#475569", marginTop: "2px", fontSize: "12px" }}>{n.body}</div>
                        <div style={{ color: "#94a3b8", marginTop: "4px", fontSize: "10px" }}>{new Date(n.createdAt).toLocaleDateString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function ManagementFooter({ admin = false }: { admin?: boolean }) {
  return (
    <footer className="foot">
      <div className="shell management-foot">
        <span>
          Vabbot Resorts | {admin ? "Platform administration" : "Hotel management"}
        </span>
      </div>
    </footer>
  );
}
