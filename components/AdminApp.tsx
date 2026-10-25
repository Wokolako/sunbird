"use client";
import { useEffect, useState } from "react";
type Row = Record<string, any>;
type Data = {
  users: Row[];
  organisations: Row[];
  documents: Row[];
  properties: Row[];
  bookings: Row[];
  logs: Row[];
  settings: Row[];
};
export function AdminApp() {
  const [session, setSession] = useState<Row | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    try {
      const r = await fetch("/api/platform?view=session", { cache: "no-store" });
      const d = await r.json();
      setSession(d.user);
      if (d.user) {
        const response = await fetch("/api/platform?view=admin", { cache: "no-store" });
        const all = await response.json();
        if (!response.ok) throw Error(all.error);
        setData(all);
      } else setData(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load platform data.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function act(payload: Row) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setMessage("Changes saved.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <p role="status">Loading platform control centre...</p>;
  if (!session)
    return (
      <div className="card" style={{ maxWidth: 520, marginBottom: 70 }}>
        <h2>Super admin sign in</h2>
        <p>Sign in with your platform administrator account.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act({
              action: "login",
              ...Object.fromEntries(new FormData(e.currentTarget)),
            });
          }}
        >
          <div className="stack">
            <label className="field">
              Email
              <input name="email" type="email" autoComplete="username" required />
            </label>
            <label className="field">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="button" disabled={busy}>
              Sign in
            </button>
          </div>
        </form>
        {error && (
          <p className="status error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  const managers = data?.users.filter((u) => u.role === "owner") || [];
  const guests = data?.users.filter((u) => u.role === "guest") || [];
  return (
    <div style={{ paddingBottom: 70 }}>
      <div className="toolbar">
        <strong>{session.name} | Super administrator</strong>
        <button
          className="button secondary small"
          disabled={busy}
          onClick={() => void act({ action: "logout" })}
        >
          Sign out
        </button>
      </div>
      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="status" role="status">
          {message}
        </p>
      )}
      <div className="metric-grid">
        {[
          { label: "Managers", value: managers.length },
          { label: "Guest accounts", value: guests.length },
          { label: "Total listings", value: data?.properties.length || 0 },
          { label: "Stay requests", value: data?.bookings.length || 0 },
        ].map((m) => (
          <div className="metric" key={m.label}>
            <span>{m.label}</span>
            <strong>{m.value}</strong>
          </div>
        ))}
      </div>
      <div className="tabs" aria-label="Super admin sections">
        {[
          "Overview",
          "Managers",
          "Guests",
          "Verification",
          "Listings",
          "Stay requests",
          "Audit log",
          "Settings",
        ].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" && (
        <div className="grid-2">
          <div className="card">
            <h2>Organisation applications</h2>
            <p>
              {data?.organisations.filter(
                (o) => o.status === "pending" || o.status === "more_documents"
              ).length || 0}{" "}
              applications need review.
            </p>
            <button className="button" onClick={() => setTab("Verification")}>
              Review applications
            </button>
          </div>
          <div className="card">
            <h2>Platform activity</h2>
            <p>
              {data?.properties.filter((p) => p.status === "published").length || 0}{" "}
              published listings.{" "}
              {data?.bookings.filter((b) => b.status === "pending").length || 0} stay
              requests are awaiting a manager response.
            </p>
            <button className="button secondary" onClick={() => setTab("Listings")}>
              Manage listings
            </button>
          </div>
        </div>
      )}
      {(tab === "Managers" || tab === "Guests") && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Control</th>
              </tr>
            </thead>
            <tbody>
              {(tab === "Managers" ? managers : guests).map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className={u.status === "active" ? "badge" : "badge warn"}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="button secondary small"
                      disabled={busy}
                      onClick={() =>
                        void act({
                          action: "user-status",
                          id: u.id,
                          status: u.status === "active" ? "suspended" : "active",
                        })
                      }
                    >
                      {u.status === "active" ? "Suspend access" : "Restore access"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(tab === "Managers" ? managers : guests).length && (
            <p className="empty-state">No accounts in this group yet.</p>
          )}
        </div>
      )}
      {tab === "Verification" && (
        <div className="stack">
          {data?.organisations.map((o) => (
            <article className="card" key={o.id}>
              <div className="toolbar">
                <h2>{o.name}</h2>
                <span className="badge">{o.status.replaceAll("_", " ")}</span>
              </div>
              <p>
                {o.owner_name} | {o.email} | {o.registration_number}
                <br />
                {o.address}
              </p>
              <h3>Submitted documents</h3>
              <ul>
                {data.documents
                  .filter((d) => d.organisation_id === o.id)
                  .map((d) => (
                    <li key={d.id}>
                      <a
                        className="text-link"
                        href={`/api/platform?view=document&id=${d.id}`}
                      >
                        {d.kind.replaceAll("_", " ")}: {d.filename}
                      </a>
                    </li>
                  ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act({
                    action: "verify-organisation",
                    id: o.id,
                    ...Object.fromEntries(new FormData(e.currentTarget)),
                  });
                }}
              >
                <div className="form-grid">
                  <label className="field">
                    Decision
                    <select name="status">
                      <option value="approved">Approve</option>
                      <option value="more_documents">Request documents</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </label>
                  <label className="field">
                    Reason / note
                    <input name="reason" />
                  </label>
                </div>
                <div className="form-actions">
                  <button className="button" disabled={busy}>
                    Save decision
                  </button>
                </div>
              </form>
            </article>
          ))}
          {!data?.organisations.length && (
            <p className="empty-state">No organisation applications yet.</p>
          )}
        </div>
      )}
      {tab === "Listings" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Listing</th>
                <th>Manager organisation</th>
                <th>Type</th>
                <th>Status</th>
                <th>Control</th>
              </tr>
            </thead>
            <tbody>
              {data?.properties.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.organisation_name}</td>
                  <td>{p.type}</td>
                  <td>{p.status}</td>
                  <td>
                    <button
                      className="button small secondary"
                      disabled={busy || p.status === "paused"}
                      onClick={() =>
                        void act({
                          action: "property-status",
                          id: p.id,
                          status: "paused",
                        })
                      }
                    >
                      Pause listing
                    </button>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        void act({ action: "property-status", id: p.id, status: "draft" })
                      }
                    >
                      Return to draft
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.properties.length && <p className="empty-state">No listings yet.</p>}
        </div>
      )}
      {tab === "Stay requests" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Property</th>
                <th>Dates</th>
                <th>Party</th>
                <th>Status</th>
                <th>Control</th>
              </tr>
            </thead>
            <tbody>
              {data?.bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.guest_name}</td>
                  <td>{b.property_name}</td>
                  <td>
                    {b.check_in} to {b.check_out}
                  </td>
                  <td>{b.guests} guests</td>
                  <td>{b.status}</td>
                  <td>
                    {["pending", "confirmed"].includes(b.status) && (
                      <button
                        className="button secondary small"
                        disabled={busy}
                        onClick={() =>
                          void act({
                            action: "booking-status",
                            id: b.id,
                            status: "cancelled",
                          })
                        }
                      >
                        Cancel request
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.bookings.length && <p className="empty-state">No stay requests yet.</p>}
        </div>
      )}
      {tab === "Audit log" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Entity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.logs.map((l) => (
                <tr key={l.id}>
                  <td>{l.created_at}</td>
                  <td>{l.actor_name || l.actor_id}</td>
                  <td>{l.entity_type}</td>
                  <td>{l.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "Settings" && (
        <div className="card">
          <h2>Guest stay requests</h2>
          <p>
            Pause new requests across the whole guest website. Existing requests remain
            available for managers to handle.
          </p>
          <p>
            Currently:{" "}
            <strong>
              {data?.settings.find((s) => s.key === "accepting_requests")?.value ===
              "false"
                ? "Paused"
                : "Open"}
            </strong>
          </p>
          <div className="form-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() =>
                void act({ action: "platform-settings", acceptingRequests: true })
              }
            >
              Open new requests
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                void act({ action: "platform-settings", acceptingRequests: false })
              }
            >
              Pause new requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
