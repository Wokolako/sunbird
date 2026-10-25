"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "./SiteShell";
type User = { id: string; name: string; email: string };
export function GuestAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/platform?view=session")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setError("Could not load your account. Please reload."))
      .finally(() => setLoading(false));
  }, []);
  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw Error(d.error);
      if (payload.action === "logout") {
        setUser(null);
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && /^\/(?!\/)/.test(next) ? next : "/account";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SiteHeader />
      <main className="shell account-page">
        <div className="page-head">
          <h1>{user ? `Welcome, ${user.name}.` : "Your next stay starts here."}</h1>
          <p className="lead">
            Create your guest account to save places, request a stay and manage your
            bookings.
          </p>
        </div>
        {loading ? (
          <p role="status">Loading your account...</p>
        ) : user ? (
          <div className="card" style={{ maxWidth: 650 }}>
            <h2>Your guest account</h2>
            <p>{user.email}</p>
            <div className="form-actions">
              <Link className="button" href="/search">
                Find a hotel or house
              </Link>
              <Link className="button secondary" href="/bookings">
                My stay requests
              </Link>
              <button
                className="text-link"
                disabled={busy}
                onClick={() => void act({ action: "logout" })}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: 600, marginBottom: 40 }}>
            <div className="tabs">
              <button
                className={!register ? "active" : ""}
                onClick={() => setRegister(false)}
              >
                Sign in
              </button>
              <button
                className={register ? "active" : ""}
                onClick={() => setRegister(true)}
              >
                Create account
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act({
                  action: register ? "register-guest" : "login",
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                });
              }}
            >
              <div className="stack">
                {register && (
                  <label className="field">
                    Your name
                    <input name="name" autoComplete="name" required />
                  </label>
                )}
                <label className="field">
                  Email
                  <input name="email" type="email" autoComplete="email" required />
                </label>
                {register && (
                  <label className="field">
                    Phone
                    <input name="phone" type="tel" autoComplete="tel" required />
                  </label>
                )}
                <label className="field">
                  Password{register ? " (at least 12 characters)" : ""}
                  <input
                    name="password"
                    type="password"
                    autoComplete={register ? "new-password" : "current-password"}
                    minLength={register ? 12 : undefined}
                    required
                  />
                </label>
              </div>
              <div className="form-actions">
                <button className="button" disabled={busy}>
                  {busy
                    ? "Please wait..."
                    : register
                      ? "Create guest account"
                      : "Sign in"}
                </button>
              </div>
            </form>
          </div>
        )}
        {error && (
          <p className="status error" role="alert">
            {error}
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
