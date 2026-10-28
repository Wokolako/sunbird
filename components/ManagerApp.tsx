"use client";

import { useCallback, useEffect, useState } from "react";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import {
  BedDouble,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  MessageSquare,
  Plus,
  RefreshCw,
  Sliders,
  Wrench,
  Tags,
  UserCog,
  BarChart3,
  WalletCards,
  Users,
  X,
  MapPin,
} from "lucide-react";
import { ManagerPmsPanels } from "./ManagerPmsPanels";

const money = (minor = 0) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(minor / 100);

type RecordObject = Record<string, any>;
type ManagerState = {
  user: RecordObject;
  organisation: RecordObject;
  properties: RecordObject[];
  rooms: RecordObject[];
  documents: RecordObject[];
  enquiries: RecordObject[];
  bookings: RecordObject[];
  finance: RecordObject;
};
type ManagerTab = "overview" | "properties" | "calendar" | "inbox" | "guests" | "operations" | "rates" | "team" | "reports" | "finance";

const managerTabs: Array<{
  id: ManagerTab;
  label: string;
  icon: typeof Building2;
}> = [
  { id: "overview", label: "Today", icon: ClipboardCheck },
  { id: "calendar", label: "Availability", icon: CalendarDays },
  { id: "guests", label: "Reservations", icon: Users },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "inbox", label: "Inbox", icon: MessageSquare },
  { id: "operations", label: "Operations", icon: Wrench },
  { id: "rates", label: "Rates", icon: Tags },
  { id: "team", label: "Team", icon: UserCog },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "finance", label: "Finance", icon: WalletCards },
];

async function send(payload: RecordObject | FormData) {
  let requestBody: RecordObject = payload as RecordObject;
  if (payload instanceof FormData) {
    const file = payload.get("file");
    if (!(file instanceof File)) throw new Error("Choose a document to upload.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    requestBody = {
      action: "upload-document",
      kind: payload.get("kind"),
      filename: file.name,
      mime: file.type,
      base64: btoa(binary),
    };
  }
  const response = await fetch("/api/backend/api/platform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "The request could not be completed.");
  return result;
}

function PropertyLocationPicker({
  initialAddress = "",
  initialLat = 54.3807,
  initialLng = -2.9056,
}: {
  initialAddress?: string;
  initialLat?: number | null;
  initialLng?: number | null;
}) {
  const [address, setAddress] = useState(initialAddress || "");
  const [lat, setLat] = useState<string>(String(initialLat ?? 54.3807));
  const [lng, setLng] = useState<string>(String(initialLng ?? -2.9056));
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; name: string; address: string; latitude: number; longitude: number }>
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/backend/api/platform?view=geocode&q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setShowDropdown(true);
        }
      } catch {
        // Fallback or offline
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const selectPlace = (item: { address: string; latitude: number; longitude: number }) => {
    setAddress(item.address);
    setLat(item.latitude.toFixed(6));
    setLng(item.longitude.toFixed(6));
    setShowDropdown(false);
    setQuery("");
  };

  const nudge = (dLat: number, dLng: number) => {
    const curLat = Number(lat) || 0;
    const curLng = Number(lng) || 0;
    setLat((curLat + dLat).toFixed(6));
    setLng((curLng + dLng).toFixed(6));
  };

  const numLat = Number(lat) || 54.3807;
  const numLng = Number(lng) || -2.9056;

  return (
    <div className="field full" style={{ display: "grid", gap: 14 }}>
      <div style={{ position: "relative" }}>
        <label className="field">
          Address & Autocomplete Search
          <div style={{ display: "flex", gap: 8 }}>
            <input
              name="address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setQuery(e.target.value);
              }}
              placeholder="Search destination, town, or address (e.g. Bowness-on-Windermere, Lilongwe)..."
              required
            />
            {query && (
              <button
                type="button"
                className="button secondary small"
                onClick={() => {
                  setQuery("");
                  setShowDropdown(false);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </label>
        {showDropdown && (
          <ul
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 40,
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              listStyle: "none",
              margin: "4px 0 0",
              padding: "6px 0",
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {loading && <li style={{ padding: "10px 14px", color: "#64748b", fontSize: 13 }}>Searching places...</li>}
            {!loading && suggestions.length === 0 && (
              <li style={{ padding: "10px 14px", color: "#64748b", fontSize: 13 }}>No matching places found.</li>
            )}
            {suggestions.map((item) => (
              <li
                key={item.id}
                onClick={() => selectPlace(item)}
                style={{
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: 13,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              >
                <div style={{ fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
                  <MapPin size={14} color="#0f766e" /> {item.name}
                </div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{item.address}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label className="field">
          Latitude
          <input
            name="latitude"
            type="number"
            step="any"
            min="-90"
            max="90"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Longitude
          <input
            name="longitude"
            type="number"
            step="any"
            min="-180"
            max="180"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
          />
        </label>
      </div>

      {/* Interactive Map Picker Frame */}
      <div
        style={{
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          overflow: "hidden",
          background: "#f8fafc",
        }}
      >
        <div
          style={{
            padding: "8px 14px",
            background: "#f1f5f9",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={15} color="#0f766e" />
            <strong>Interactive Map Position:</strong> {Number(numLat).toFixed(4)}, {Number(numLng).toFixed(4)}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "#64748b" }}>Fine-tune:</span>
            <button type="button" className="button secondary small" style={{ padding: "2px 8px" }} onClick={() => nudge(0.002, 0)} title="Nudge North">↑ North</button>
            <button type="button" className="button secondary small" style={{ padding: "2px 8px" }} onClick={() => nudge(-0.002, 0)} title="Nudge South">↓ South</button>
            <button type="button" className="button secondary small" style={{ padding: "2px 8px" }} onClick={() => nudge(0, -0.002)} title="Nudge West">← West</button>
            <button type="button" className="button secondary small" style={{ padding: "2px 8px" }} onClick={() => nudge(0, 0.002)} title="Nudge East">→ East</button>
          </div>
        </div>
        <div style={{ height: 260, position: "relative" }}>
          <iframe
            title="Interactive Property Map"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${numLng - 0.012}%2C${numLat - 0.008}%2C${numLng + 0.012}%2C${numLat + 0.008}&layer=mapnik&marker=${numLat}%2C${numLng}`}
            style={{ width: "100%", height: "100%", border: "none" }}
            loading="lazy"
          />
        </div>
        <div
          style={{
            padding: "6px 14px",
            fontSize: 11,
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            background: "#ffffff",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <span>Use autocomplete search above or directional buttons to accurately place the property pin.</span>
          <a
            href={`https://www.openstreetmap.org/?mlat=${numLat}&mlon=${numLng}#map=16/${numLat}/${numLng}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0f766e", textDecoration: "underline" }}
          >
            Open in OpenStreetMap ↗
          </a>
        </div>
      </div>
    </div>
  );
}

export function ManagerApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const [state, setState] = useState<ManagerState | null>(null);
  const [session, setSession] = useState<RecordObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ManagerTab>("overview");
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeEnquiry, setActiveEnquiry] = useState<RecordObject | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  // Interactive Multi-Room Calendar State
  const [calendarStartDate, setCalendarStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [calendarData, setCalendarData] = useState<RecordObject | null>(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [quickEditCell, setQuickEditCell] = useState<{
    roomId: string;
    roomName: string;
    date: string;
    unitsOpen: number;
    maxUnits: number;
    closed: boolean;
    nightlyRate: string;
  } | null>(null);
  const [savingCell, setSavingCell] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  const loadCalendar = useCallback(async () => {
    if (!selected || tab !== "calendar") return;
    setLoadingCalendar(true);
    try {
      const start = calendarStartDate;
      const d = new Date(start);
      d.setDate(d.getDate() + 13);
      const end = d.toISOString().slice(0, 10);
      const res = await fetch(
        `/api/backend/api/pms/properties/${selected}/calendar?roomId=all&start=${start}&end=${end}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (res.ok) setCalendarData(json);
    } catch {
      // fallback
    } finally {
      setLoadingCalendar(false);
    }
  }, [selected, tab, calendarStartDate]);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  async function handleSaveQuickEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickEditCell || !selected) return;
    setSavingCell(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/backend/api/pms/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quick-update-day",
          propertyId: selected,
          roomId: quickEditCell.roomId,
          date: quickEditCell.date,
          unitsOpen: quickEditCell.unitsOpen,
          closed: quickEditCell.closed,
          nightlyRate: quickEditCell.nightlyRate ? Number(quickEditCell.nightlyRate) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update date.");
      setMessage(`Updated ${quickEditCell.roomName} on ${quickEditCell.date}.`);
      setQuickEditCell(null);
      await loadCalendar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update date.");
    } finally {
      setSavingCell(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !activeEnquiry) return;
    setReplying(true);
    try {
      await send({
        action: "send-message",
        propertyId: activeEnquiry.property_id || selected,
        recipientId: activeEnquiry.sender_id || activeEnquiry.guest_id,
        content: replyText.trim(),
      });
      setReplyText("");
      setMessage("Reply dispatched successfully to guest.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setReplying(false);
    }
  }

  const load = useCallback(async () => {
    try {
      setError("");
      const sessionResponse = await fetch("/api/backend/api/platform?view=session", {
        cache: "no-store",
      });
      if (!sessionResponse.ok) throw new Error("Could not load your session.");
      const sessionData = await sessionResponse.json();
      setSession(sessionData.user);
      if (sessionData.user?.role === "owner") {
        const response = await fetch("/api/backend/api/platform?view=mine", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Could not load your hotel workspace.");
        const data = await response.json();
        setState(data);
        setSelected((current) => current || data.properties[0]?.id || "");
      } else setState(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setSession(null);
      setState(null);
      setLoading(false);
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load]);

  async function act(payload: RecordObject | FormData, success: string) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await send(payload);
      setMessage(success);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function formValues(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    return Object.fromEntries(form.entries());
  }
  const property = state?.properties.find((item) => item.id === selected);
  const propertyRooms =
    state?.rooms.filter((room) => room.property_id === selected) || [];
  const today = new Date().toISOString().slice(0, 10);
  const arrivals =
    state?.bookings?.filter(
      (booking) => booking.check_in === today && booking.status === "confirmed"
    ) || [];
  const departures =
    state?.bookings?.filter(
      (booking) => booking.check_out === today && booking.status === "checked_in"
    ) || [];
  const inHouse =
    state?.bookings?.filter((booking) => booking.status === "checked_in") || [];
  const pending =
    state?.bookings?.filter((booking) => booking.status === "pending") || [];

  if (!isLoaded || loading)
    return (
      <div className="card" role="status">
        Loading your workspace…
      </div>
    );
  if (!isSignedIn)
    return (
      <div className="grid-2" style={{ paddingBottom: 90, alignItems: "start" }}>
        <div className="card">
          <h2>Open your property workspace</h2>
          <p>
            Sign in securely with Clerk, or create an account before registering your
            hotel organisation.
          </p>
          <div className="form-actions">
            <SignInButton mode="modal">
              <button className="button">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="button secondary">Create account</button>
            </SignUpButton>
          </div>
        </div>
        <aside className="stack">
          <div className="card">
            <div className="card-icon">
              <Building2 size={24} />
            </div>
            <h3>One account, multiple properties</h3>
            <p>
              Enter organisation details once, then prepare each hotel, lodge, guesthouse
              or short-term let separately.
            </p>
          </div>
          <div className="card">
            <div className="card-icon">
              <FileCheck2 size={24} />
            </div>
            <h3>Verification before publication</h3>
            <p>
              Business registration, proof of address and owner ID are reviewed by an
              administrator. Guest listings stay hidden until all publication checks pass.
            </p>
          </div>
        </aside>
      </div>
    );
  if (!session)
    return (
      <div className="card" style={{ marginBottom: 80 }}>
        <p className="status error" role="alert">
          {error || "Your Clerk account could not be connected to the Vabbot backend."}
        </p>
        <button className="button secondary" onClick={() => void load()}>
          Try again
        </button>
      </div>
    );
  if (session.role !== "owner")
    return (
      <div className="grid-2" style={{ paddingBottom: 90, alignItems: "start" }}>
        <div className="card">
          <h2>Register your hotel organisation</h2>
          <p>
            Your Clerk account is ready. Add the business details used for verification.
          </p>
          <form
            onSubmit={(event) => {
              const values = formValues(event);
              void act(
                { action: "onboard-owner", ...values },
                "Organisation created. Upload documents to start verification."
              );
            }}
          >
            <div className="form-grid">
              <label className="field">
                Organisation name
                <input name="organisationName" required />
              </label>
              <label className="field">
                Organisation type
                <select name="organisationType">
                  <option value="hotel">Hotel</option>
                  <option value="lodge">Lodge</option>
                  <option value="guesthouse">Guesthouse</option>
                  <option value="short_term_let">Short-term let</option>
                </select>
              </label>
              <label className="field">
                Business registration number
                <input name="registrationNumber" required />
              </label>
              <label className="field">
                Accommodation licence (if applicable)
                <input name="licenceNumber" />
              </label>
              <label className="field">
                Business phone
                <input name="phone" type="tel" required />
              </label>
              <label className="field full">
                Business address
                <input name="address" required />
              </label>
            </div>
            <div className="form-actions">
              <button className="button" disabled={busy}>
                Create organisation
              </button>
              <UserButton />
            </div>
          </form>
          {error && (
            <p className="status error" role="alert">
              {error}
            </p>
          )}
        </div>
        <aside className="card">
          <FileCheck2 size={24} />
          <h3>Verification comes next</h3>
          <p>
            After registration, upload business registration, proof of address, and owner
            identification. Properties stay private until approval.
          </p>
        </aside>
      </div>
    );

  return (
    <div className="manager-workspace">
      <div className="toolbar manager-accountbar">
        <div>
          <span className="manager-account-label">Property workspace</span>
          <strong>{state?.organisation?.name}</strong>
          <span
            style={{ marginLeft: 10 }}
            className={
              state?.organisation?.status === "approved" ? "badge" : "badge warn"
            }
          >
            {state?.organisation?.status?.replace("_", " ")}
          </span>
        </div>
        <UserButton />
      </div>
      {state?.organisation?.status !== "approved" ? (
        <div className="notice manager-notice">
          <FileCheck2 size={20} />
          <div>
            <strong>Complete verification to publish properties.</strong>
            <span>
              Upload the required organisation documents. An administrator will review
              them before your listings become visible to guests.
            </span>
          </div>
        </div>
      ) : (
        <div className="status manager-notice">
          <FileCheck2 size={20} />
          <div>
            <strong>Your organisation is approved.</strong>
            <span>
              Published properties can appear in guest search when rooms are available.
            </span>
          </div>
        </div>
      )}
      <div className="metric-grid">
        <div className="metric">
          <span>
            <Building2 size={16} /> Properties
          </span>
          <strong>{state?.properties.length || 0}</strong>
          <small>
            {state?.properties.filter((p) => p.status === "published").length || 0}{" "}
            published
          </small>
        </div>
        <div className="metric">
          <span>
            <CalendarDays size={16} /> Arrivals today
          </span>
          <strong>{arrivals.length}</strong>
          <small>{arrivals.length ? "Guests expected" : "No arrivals scheduled"}</small>
        </div>
        <div className="metric">
          <span>
            <BedDouble size={16} /> In house
          </span>
          <strong>{inHouse.reduce((total, booking) => total + booking.guests, 0)}</strong>
          <small>
            {inHouse.length} active stay{inHouse.length === 1 ? "" : "s"}
          </small>
        </div>
        <div className="metric">
          <span>
            <MessageSquare size={16} /> Needs attention
          </span>
          <strong>{pending.length}</strong>
          <small>Pending stay request{pending.length === 1 ? "" : "s"}</small>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Property manager sections">
        {managerTabs.map(({ id, label, icon: Icon }, index) => (
          <button
            key={id}
            id={`manager-tab-${id}`}
            role="tab"
            aria-selected={tab === id}
            aria-controls={`manager-panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const direction = event.key === "ArrowRight" ? 1 : -1;
              const next = (index + direction + managerTabs.length) % managerTabs.length;
              setTab(managerTabs[next].id);
              const buttons =
                event.currentTarget.parentElement?.querySelectorAll("button");
              buttons?.[next]?.focus();
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="status error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="status">
          {message}
        </p>
      )}

      {tab === "overview" && (
        <section
          className="manager-panel"
          id="manager-panel-overview"
          role="tabpanel"
          aria-labelledby="manager-tab-overview"
        >
          <div className="manager-today">
            <div className="manager-section-head">
              <div>
                <h2>Today at your properties</h2>
                <p>
                  {new Intl.DateTimeFormat("en-GB", { dateStyle: "full" }).format(
                    new Date()
                  )}
                </p>
              </div>
              <button className="button secondary" onClick={() => setTab("guests")}>
                Open reservations <ChevronRight size={17} />
              </button>
            </div>
            <div className="manager-task-grid">
              <button onClick={() => setTab("guests")}>
                <CalendarDays size={20} />
                <span>
                  <strong>{arrivals.length}</strong> arrivals
                </span>
                <small>
                  {arrivals.length
                    ? "Prepare rooms and welcome guests"
                    : "No arrivals scheduled"}
                </small>
              </button>
              <button onClick={() => setTab("guests")}>
                <BedDouble size={20} />
                <span>
                  <strong>{departures.length}</strong> departures
                </span>
                <small>
                  {departures.length
                    ? "Check out and release rooms"
                    : "No departures scheduled"}
                </small>
              </button>
              <button onClick={() => setTab("inbox")}>
                <MessageSquare size={20} />
                <span>
                  <strong>{pending.length}</strong> requests
                </span>
                <small>
                  {pending.length
                    ? "Guests are waiting for a response"
                    : "Inbox is clear"}
                </small>
              </button>
            </div>
          </div>
          <div className="manager-overview-grid">
            <div className="card manager-documents">
              <h2>Verification documents</h2>
              <p>
                Upload PDF, JPEG or PNG files up to 5 MB. They are available to platform
                administrators only.
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void act(data, "Document uploaded.");
                  event.currentTarget.reset();
                }}
              >
                <div className="form-grid">
                  <label className="field">
                    Document type
                    <select name="kind">
                      <option value="business_registration">Business registration</option>
                      <option value="proof_of_address">Proof of address</option>
                      <option value="owner_id">Owner ID</option>
                      <option value="accommodation_licence">Accommodation licence</option>
                    </select>
                  </label>
                  <label className="field">
                    Choose file
                    <input
                      name="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button className="button" disabled={busy}>
                    Upload document
                  </button>
                </div>
              </form>
              <ul>
                {state?.documents.map((document) => (
                  <li key={document.id}>
                    {document.kind.replaceAll("_", " ")} · {document.filename}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card manager-status-card">
              <h2>Organisation status</h2>
              <p>
                Current decision:{" "}
                <strong>{state?.organisation?.status?.replaceAll("_", " ")}</strong>
              </p>
              {state?.organisation?.verification_reason && (
                <p>Admin note: {state.organisation.verification_reason}</p>
              )}
              <p>
                Payout onboarding:{" "}
                <strong>
                  {state?.organisation?.payout_status?.replaceAll("_", " ")}
                </strong>
              </p>
              <p>
                Provider onboarding will be connected after the licensed payment partner
                is selected.
              </p>
            </div>
          </div>
        </section>
      )}

      {tab === "guests" && (
        <section
          className="table-wrap manager-panel"
          id="manager-panel-guests"
          role="tabpanel"
          aria-labelledby="manager-tab-guests"
        >
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Property</th>
                <th>Dates</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state?.bookings?.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.guest_name}
                    <small className="muted block">
                      {b.guest_email || "Contact hidden until confirmation"}
                    </small>
                  </td>
                  <td>
                    {b.property_name}
                    <small className="muted block">{b.room_name}</small>
                  </td>
                  <td>
                    {b.check_in} to {b.check_out}
                  </td>
                  <td>{b.guests}</td>
                  <td>{b.status.replaceAll("_", " ")}</td>
                  <td>
                    {(b.status === "pending"
                      ? ["confirmed", "declined"]
                      : b.status === "confirmed"
                        ? ["checked_in", "cancelled"]
                        : b.status === "checked_in"
                          ? ["completed"]
                          : []
                    ).map((status) => (
                      <button
                        key={status}
                        className="button small secondary"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            { action: "booking-status", id: b.id, status },
                            "Stay request updated."
                          )
                        }
                      >
                        {status === "confirmed"
                          ? "Accept"
                          : status === "declined"
                            ? "Decline"
                            : status === "checked_in"
                              ? "Check in"
                              : status === "completed"
                                ? "Check out"
                                : "Cancel"}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!state?.bookings?.length && (
            <p className="empty-state">No guest requests for your properties yet.</p>
          )}
        </section>
      )}
      {tab === "properties" && (
        <section
          className="stack manager-panel"
          id="manager-panel-properties"
          role="tabpanel"
          aria-labelledby="manager-tab-properties"
        >
          <div className="card">
            <h2>Add a property draft</h2>
            <form
              onSubmit={(event) => {
                const values = formValues(event);
                void act(
                  { action: "create-property", ...values },
                  "Property draft created."
                );
                event.currentTarget.reset();
              }}
            >
              <div className="form-grid">
                <label className="field">
                  Property name
                  <input name="name" required />
                </label>
                <label className="field">
                  Type
                  <select name="type">
                    <option value="hotel">Hotel</option>
                    <option value="lodge">Lodge</option>
                    <option value="guesthouse">Guesthouse</option>
                    <option value="short_term_let">Short-term let</option>
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button className="button" disabled={busy}>
                  <Plus size={16} /> Add property
                </button>
              </div>
            </form>
          </div>
          {state?.properties.length ? (
            <div className="card">
              <div className="toolbar">
                <h2 style={{ margin: 0 }}>Property details</h2>
                <select
                  aria-label="Select property"
                  value={selected}
                  onChange={(event) => setSelected(event.target.value)}
                >
                  {state.properties.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              {property && (
                <>
                  <p>
                    <span className="badge warn">{property.status}</span> · A pin, five
                    photos, rules, policy and a room are required before publication.
                  </p>
                  <form
                    key={property.id}
                    onSubmit={(event) => {
                      const values = formValues(event);
                      void act(
                        {
                          action: "update-property",
                          id: property.id,
                          ...values,
                          photos: String(values.photos)
                            .split("\n")
                            .map((value) => value.trim())
                            .filter(Boolean),
                          amenities: String(values.amenities)
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        },
                        "Property details saved."
                      );
                    }}
                  >
                    <div className="form-grid">
                      <label className="field full">
                        Description
                        <textarea
                          name="description"
                          defaultValue={property.description}
                          required
                        />
                      </label>
                      <PropertyLocationPicker
                        key={property.id}
                        initialAddress={property.address}
                        initialLat={property.latitude}
                        initialLng={property.longitude}
                      />
                      <label className="field full">
                        Photo URLs (one HTTPS URL per line, minimum five to publish)
                        <textarea
                          name="photos"
                          defaultValue={JSON.parse(property.photos).join("\n")}
                        />
                      </label>
                      <label className="field full">
                        Amenities (comma separated)
                        <input
                          name="amenities"
                          defaultValue={JSON.parse(property.amenities).join(", ")}
                        />
                      </label>
                      <label className="field">
                        Accessibility features
                        <input
                          name="accessibility"
                          defaultValue={property.accessibility}
                        />
                      </label>
                      <label className="field">
                        Languages spoken
                        <input name="languages" defaultValue={property.languages} />
                      </label>
                      <label className="field">
                        Check-in time
                        <input
                          name="checkIn"
                          type="time"
                          defaultValue={property.check_in}
                        />
                      </label>
                      <label className="field">
                        Check-out time
                        <input
                          name="checkOut"
                          type="time"
                          defaultValue={property.check_out}
                        />
                      </label>
                      <label className="field">
                        Booking mode
                        <select name="bookingMode" defaultValue={property.booking_mode}>
                          <option value="request">Request to book</option>
                          <option value="instant">Instant booking</option>
                        </select>
                      </label>
                      <label className="field full">
                        House rules
                        <textarea
                          name="houseRules"
                          defaultValue={property.house_rules}
                          required
                        />
                      </label>
                      <label className="field full">
                        Cancellation policy
                        <textarea
                          name="cancellationPolicy"
                          defaultValue={property.cancellation_policy}
                          required
                        />
                      </label>
                    </div>
                    <div className="form-actions">
                      <button className="button" disabled={busy}>
                        Save property
                      </button>
                      <button
                        type="button"
                        className="button secondary"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            { action: "publish-property", id: property.id },
                            "Property published."
                          )
                        }
                      >
                        Publish when ready
                      </button>
                      <button
                        type="button"
                        className="button secondary"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            {
                              action: "property-status",
                              id: property.id,
                              status: "paused",
                            },
                            "Listing paused."
                          )
                        }
                      >
                        Pause listing
                      </button>
                      <button
                        type="button"
                        className="button ghost"
                        disabled={busy}
                        onClick={() =>
                          void act(
                            {
                              action: "property-status",
                              id: property.id,
                              status: "draft",
                            },
                            "Listing returned to draft."
                          )
                        }
                      >
                        Return to draft
                      </button>
                    </div>
                  </form>
                  <hr
                    style={{
                      border: 0,
                      borderTop: "1px solid var(--line)",
                      margin: "32px 0",
                    }}
                  />
                  <h3>Room types</h3>
                  {propertyRooms.length > 0 && (
                    <div className="table-wrap" style={{ marginBottom: 25 }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Room</th>
                            <th>Capacity</th>
                            <th>Units</th>
                            <th>Base rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {propertyRooms.map((room) => (
                            <tr key={room.id}>
                              <td>{room.name}</td>
                              <td>
                                {room.adult_capacity} adults, {room.child_capacity}{" "}
                                children
                              </td>
                              <td>{room.units}</td>
                              <td>
                                <form
                                  onSubmit={(event) => {
                                    const values = formValues(event);
                                    void act(
                                      {
                                        action: "update-rate",
                                        roomId: room.id,
                                        ...values,
                                      },
                                      "Room price updated."
                                    );
                                  }}
                                >
                                  <label className="field">
                                    Nightly rate (GBP)
                                    <input
                                      aria-label={"Price for " + room.name}
                                      name="nightlyRate"
                                      type="number"
                                      min="1"
                                      step="0.01"
                                      defaultValue={room.nightly_rate_minor / 100}
                                      required
                                    />
                                  </label>
                                  <button className="button small" disabled={busy}>
                                    Save price
                                  </button>
                                </form>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <form
                    onSubmit={(event) => {
                      const values = formValues(event);
                      void act(
                        { action: "create-room", propertyId: property.id, ...values },
                        "Room type added."
                      );
                      event.currentTarget.reset();
                    }}
                  >
                    <div className="form-grid">
                      <label className="field">
                        Room name
                        <input name="name" required />
                      </label>
                      <label className="field">
                        Beds
                        <input name="beds" placeholder="1 queen + 2 single" required />
                      </label>
                      <label className="field">
                        Adults
                        <input
                          name="adults"
                          type="number"
                          min="1"
                          defaultValue="2"
                          required
                        />
                      </label>
                      <label className="field">
                        Children
                        <input name="children" type="number" min="0" defaultValue="0" />
                      </label>
                      <label className="field">
                        Number of identical units
                        <input
                          name="units"
                          type="number"
                          min="1"
                          defaultValue="1"
                          required
                        />
                      </label>
                      <label className="field">
                        Base nightly rate (GBP)
                        <input
                          name="nightlyRate"
                          type="number"
                          min="1"
                          step="0.01"
                          required
                        />
                      </label>
                      <label className="field">
                        Size (m²)
                        <input name="sizeSqm" type="number" min="0" step="0.1" />
                      </label>
                    </div>
                    <div className="form-actions">
                      <button className="button" disabled={busy}>
                        Add room type
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          ) : (
            <div className="card">
              <p>No properties yet. Add your first draft above.</p>
            </div>
          )}
        </section>
      )}

      {tab === "calendar" && (
        <section
          className="card manager-panel"
          id="manager-panel-calendar"
          role="tabpanel"
          aria-labelledby="manager-tab-calendar"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <CalendarDays size={22} />
                Multi-Room Booking Calendar
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--color-muted, #64748b)" }}>
                Live 14-day PMS availability matrix. Click any day to adjust units, toggle closures, or set custom nightly rates.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                className="button secondary small"
                onClick={() => {
                  const d = new Date(calendarStartDate);
                  d.setDate(d.getDate() - 7);
                  setCalendarStartDate(d.toISOString().slice(0, 10));
                }}
              >
                <ChevronLeft size={14} style={{ display: "inline", verticalAlign: "middle" }} />
                Prev 7d
              </button>
              <button
                type="button"
                className="button secondary small"
                onClick={() => setCalendarStartDate(new Date().toISOString().slice(0, 10))}
              >
                Today
              </button>
              <button
                type="button"
                className="button secondary small"
                onClick={() => {
                  const d = new Date(calendarStartDate);
                  d.setDate(d.getDate() + 7);
                  setCalendarStartDate(d.toISOString().slice(0, 10));
                }}
              >
                Next 7d
                <ChevronRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
              </button>
              <button
                type="button"
                className={`button small ${showBulkUpdate ? "" : "secondary"}`}
                onClick={() => setShowBulkUpdate(!showBulkUpdate)}
              >
                <Sliders size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                Bulk Range
              </button>
              <button
                type="button"
                className="button secondary small"
                disabled={loadingCalendar}
                onClick={() => void loadCalendar()}
              >
                <RefreshCw size={13} className={loadingCalendar ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Quick Edit Modal */}
          {quickEditCell && (
            <div
              style={{
                background: "#f8fafc",
                border: "2px solid #3b82f6",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "1.25rem",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "15px" }}>
                  Quick Edit: <strong>{quickEditCell.roomName}</strong> &bull; {quickEditCell.date}
                </h3>
                <button
                  type="button"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                  onClick={() => setQuickEditCell(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveQuickEdit}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", alignItems: "flex-end" }}>
                  <label className="field" style={{ margin: 0 }}>
                    Units Available (0 - {quickEditCell.maxUnits})
                    <input
                      type="number"
                      min="0"
                      max={quickEditCell.maxUnits}
                      value={quickEditCell.unitsOpen}
                      onChange={(e) => setQuickEditCell({ ...quickEditCell, unitsOpen: Number(e.target.value) })}
                      required
                    />
                  </label>
                  <label className="field" style={{ margin: 0 }}>
                    Closed for Bookings
                    <select
                      value={quickEditCell.closed ? "true" : "false"}
                      onChange={(e) => setQuickEditCell({ ...quickEditCell, closed: e.target.value === "true" })}
                    >
                      <option value="false">No (Open)</option>
                      <option value="true">Yes (Closed)</option>
                    </select>
                  </label>
                  <label className="field" style={{ margin: 0 }}>
                    Nightly Price (£)
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={quickEditCell.nightlyRate}
                      onChange={(e) => setQuickEditCell({ ...quickEditCell, nightlyRate: e.target.value })}
                      placeholder="e.g. 150.00"
                    />
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="submit" className="button" disabled={savingCell}>
                      {savingCell ? "Saving..." : "Save Day"}
                    </button>
                    <button type="button" className="button secondary" onClick={() => setQuickEditCell(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* 14-Day Multi-Room Calendar Grid */}
          <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#ffffff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", width: "180px", position: "sticky", left: 0, background: "#f8fafc", zIndex: 2 }}>
                    Room Category
                  </th>
                  {Array.from({ length: 14 }, (_, i) => {
                    const d = new Date(calendarStartDate);
                    d.setDate(d.getDate() + i);
                    const dateStr = d.toISOString().slice(0, 10);
                    const isToday = dateStr === new Date().toISOString().slice(0, 10);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th
                        key={dateStr}
                        style={{
                          padding: "8px 4px",
                          textAlign: "center",
                          minWidth: "52px",
                          background: isToday ? "#eff6ff" : isWeekend ? "#f1f5f9" : "#f8fafc",
                          borderLeft: "1px solid #e2e8f0",
                          borderBottom: isToday ? "2px solid #3b82f6" : undefined,
                        }}
                      >
                        <div style={{ fontSize: "10px", color: isToday ? "#1d4ed8" : "#64748b", fontWeight: 500, textTransform: "uppercase" }}>
                          {d.toLocaleDateString("en-GB", { weekday: "narrow" })}
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: isToday ? 700 : 600, color: isToday ? "#1d4ed8" : "#0f172a" }}>
                          {d.getDate()}
                        </div>
                        <div style={{ fontSize: "9px", color: "#94a3b8" }}>
                          {d.toLocaleDateString("en-GB", { month: "short" })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {(calendarData?.rooms || []).length > 0 ? (
                  (calendarData?.rooms || []).map((room: RecordObject) => (
                    <tr key={room.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td
                        style={{
                          padding: "10px 12px",
                          position: "sticky",
                          left: 0,
                          background: "#ffffff",
                          zIndex: 2,
                          borderRight: "1px solid #e2e8f0",
                        }}
                      >
                        <strong style={{ display: "block", fontSize: "13px", color: "#0f172a" }}>{room.name}</strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {room.unitsCount} units &bull; {money(room.basePriceMinor)}
                        </span>
                      </td>
                      {Array.from({ length: 14 }, (_, i) => {
                        const d = new Date(calendarStartDate);
                        d.setDate(d.getDate() + i);
                        const dateStr = d.toISOString().slice(0, 10);
                        const inv = (room.inventory || []).find((item: RecordObject) => item.night === dateStr);
                        const rule = (room.rateRules || []).find(
                          (r: RecordObject) => r.startDate <= dateStr && r.endDate >= dateStr
                        );
                        const reservations = (room.reservations || []).filter(
                          (b: RecordObject) => b.checkIn <= dateStr && b.checkOut > dateStr
                        );

                        const isClosed = inv?.closed ?? false;
                        const unitsOpen = inv?.unitsOpen !== undefined ? inv.unitsOpen : room.unitsCount;
                        const effectivePrice = rule?.priceMinor ? money(rule.priceMinor) : money(room.basePriceMinor);

                        // Pill color styles
                        let pillBg = "#dcfce7";
                        let pillColor = "#166534";
                        let pillText = `${unitsOpen} open`;
                        if (isClosed) {
                          pillBg = "#f1f5f9";
                          pillColor = "#64748b";
                          pillText = "Closed";
                        } else if (unitsOpen === 0) {
                          pillBg = "#ffe4e6";
                          pillColor = "#9f1239";
                          pillText = "Sold out";
                        } else if (unitsOpen === 1) {
                          pillBg = "#fef3c7";
                          pillColor = "#92400e";
                          pillText = "1 left";
                        }

                        return (
                          <td
                            key={dateStr}
                            onClick={() =>
                              setQuickEditCell({
                                roomId: room.id,
                                roomName: room.name,
                                date: dateStr,
                                unitsOpen,
                                maxUnits: room.unitsCount,
                                closed: isClosed,
                                nightlyRate: rule?.priceMinor
                                  ? (rule.priceMinor / 100).toFixed(2)
                                  : (room.basePriceMinor / 100).toFixed(2),
                              })
                            }
                            style={{
                              padding: "6px 2px",
                              textAlign: "center",
                              borderLeft: "1px solid #f1f5f9",
                              cursor: "pointer",
                              verticalAlign: "top",
                              transition: "background 0.15s ease",
                            }}
                            title={`Click to edit ${room.name} on ${dateStr}${reservations.length ? ` (${reservations.length} reservation(s))` : ""}`}
                          >
                            <div
                              style={{
                                display: "inline-block",
                                padding: "3px 5px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: 700,
                                background: pillBg,
                                color: pillColor,
                                width: "90%",
                                marginBottom: "2px",
                              }}
                            >
                              {pillText}
                            </div>
                            <div style={{ fontSize: "10px", color: "#475569", fontWeight: 500 }}>
                              {effectivePrice}
                            </div>
                            {reservations.length > 0 && (
                              <div
                                style={{
                                  fontSize: "9px",
                                  marginTop: "2px",
                                  background: "#e0e7ff",
                                  color: "#3730a3",
                                  borderRadius: "3px",
                                  padding: "1px 2px",
                                }}
                              >
                                {reservations.length} bk
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={15} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                      {loadingCalendar ? "Loading multi-room matrix..." : "No rooms found for this property. Add a room category in the Overview tab first."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Collapsible Bulk Update Form */}
          {showBulkUpdate && (
            <div style={{ marginTop: "1.5rem", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "15px" }}>Bulk Range Update</h3>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b" }}>
                Choose a room, dates, and open units to update an entire date window in a single batch.
              </p>
              {state?.rooms.length ? (
                <form
                  onSubmit={(event) => {
                    const values = formValues(event);
                    void act(
                      { action: "set-availability", ...values },
                      "Availability updated for the selected nights."
                    );
                  }}
                >
                  <div className="form-grid">
                    <label className="field full">
                      Room type
                      <select name="roomId">
                        {state.rooms.map((room) => (
                          <option value={room.id} key={room.id}>
                            {state.properties.find((item) => item.id === room.property_id)?.name} · {room.name} (max {room.units})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">From<input name="start" type="date" required /></label>
                    <label className="field">Through<input name="end" type="date" required /></label>
                    <label className="field">Units open<input name="unitsOpen" type="number" min="0" defaultValue="0" required /></label>
                    <label className="field">Close dates
                      <select name="closed">
                        <option value="">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-actions" style={{ marginTop: "12px" }}>
                    <button className="button" disabled={busy}>
                      <RefreshCw size={15} /> Apply Range Availability
                    </button>
                  </div>
                </form>
              ) : (
                <p>Add a room type first.</p>
              )}
            </div>
          )}
        </section>
      )}

      {tab === "inbox" && (
        <section
          className="card manager-panel"
          id="manager-panel-inbox"
          role="tabpanel"
          aria-labelledby="manager-tab-inbox"
        >
          <h2>Enquiries and bookings</h2>
          <p>
            Click a message to open the conversation and reply to the guest.
          </p>
          {state?.enquiries.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Property</th>
                      <th>Guest</th>
                      <th>Message</th>
                      <th>Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.enquiries.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setActiveEnquiry(activeEnquiry?.id === item.id ? null : item)}
                        style={{
                          cursor: "pointer",
                          background: activeEnquiry?.id === item.id ? "var(--color-primary-light, #e8f0fe)" : undefined,
                        }}
                      >
                        <td>{item.property_name}</td>
                        <td>{item.guest_name}</td>
                        <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.message}
                        </td>
                        <td>{item.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {activeEnquiry && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    border: "1px solid var(--color-border, #dadce0)",
                    borderRadius: 8,
                    background: "var(--color-surface, #fff)",
                  }}
                >
                  <h3 style={{ margin: "0 0 0.5rem" }}>
                    Conversation with {activeEnquiry.guest_name || "Guest"}
                  </h3>
                  <div
                    style={{
                      padding: "0.75rem",
                      background: "var(--color-bg, #f8f9fa)",
                      borderRadius: 6,
                      marginBottom: "0.75rem",
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 13, color: "#5f6368" }}>
                      <strong>{activeEnquiry.guest_name}</strong>{" "}
                      <span style={{ fontSize: 11 }}>({activeEnquiry.created_at})</span>
                    </p>
                    <p style={{ margin: "0.25rem 0 0" }}>{activeEnquiry.message}</p>
                  </div>
                  <form onSubmit={handleSendReply} style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Type your reply…"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={replying}
                      style={{
                        flex: 1,
                        padding: "0.5rem 0.75rem",
                        border: "1px solid var(--color-border, #dadce0)",
                        borderRadius: 6,
                        fontSize: 14,
                      }}
                    />
                    <button
                      type="submit"
                      disabled={replying || !replyText.trim()}
                      className="btn btn-primary"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {replying ? "Sending…" : "Send Reply"}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="notice">No enquiries yet.</div>
          )}
        </section>
      )}
      {(["operations", "rates", "team", "reports", "finance"] as ManagerTab[]).includes(tab) && (
        <ManagerPmsPanels
          section={tab as "operations" | "rates" | "team" | "reports" | "finance"}
          propertyId={selected}
          rooms={propertyRooms}
          finance={state?.finance || {}}
          refreshWorkspace={load}
        />
      )}
    </div>
  );
}
