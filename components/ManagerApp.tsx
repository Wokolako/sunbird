"use client";

import { useCallback, useEffect, useState } from "react";
import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import {
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  MessageSquare,
  Plus,
  RefreshCw,
  Wrench,
  Tags,
  UserCog,
  BarChart3,
  WalletCards,
  Users,
} from "lucide-react";
import { ManagerPmsPanels } from "./ManagerPmsPanels";

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
                      <label className="field full">
                        Address
                        <input name="address" defaultValue={property.address} required />
                      </label>
                      <label className="field">
                        Latitude
                        <input
                          name="latitude"
                          type="number"
                          step="any"
                          min="-90"
                          max="90"
                          defaultValue={property.latitude ?? ""}
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
                          defaultValue={property.longitude ?? ""}
                          required
                        />
                      </label>
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
          <div className="card-icon">
            <CalendarDays size={24} />
          </div>
          <h2>Update availability by date range</h2>
          <p>
            Choose a room, dates and open units. This updates the whole range in one
            action and records the change in the audit log.
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
                        {
                          state.properties.find((item) => item.id === room.property_id)
                            ?.name
                        }{" "}
                        · {room.name} (max {room.units})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  From
                  <input name="start" type="date" required />
                </label>
                <label className="field">
                  Through
                  <input name="end" type="date" required />
                </label>
                <label className="field">
                  Units open
                  <input
                    name="unitsOpen"
                    type="number"
                    min="0"
                    defaultValue="0"
                    required
                  />
                </label>
                <label className="field">
                  Close dates
                  <select name="closed">
                    <option value="">No</option>
                    <option value="true">Yes</option>
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button className="button" disabled={busy}>
                  <RefreshCw size={16} /> Apply to range
                </button>
              </div>
            </form>
          ) : (
            <p>Add a property and room type first.</p>
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
            Messages and booking states will appear here. Booking requests are held back
            until transactional inventory locks and payment webhooks are connected.
          </p>
          {state?.enquiries.length ? (
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
                    <tr key={item.id}>
                      <td>{item.property_name}</td>
                      <td>{item.guest_name}</td>
                      <td>{item.message}</td>
                      <td>{item.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
