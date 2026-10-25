"use client";
import Link from "next/link";
import { useState } from "react";
import { MapPin, Users, ArrowLeft, CheckCircle2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "./SiteShell";
import { money, nightsBetween } from "@/lib/stays";
type Room = {
  id: string;
  name: string;
  adult_capacity: number;
  child_capacity: number;
  beds: string;
  units: number;
  nightly_rate_minor: number;
};
type Rental = {
  id: string;
  name: string;
  description: string;
  address: string;
  photos: string[];
  amenities: string[];
  latitude: number;
  longitude: number;
  house_rules: string;
  cancellation_policy: string;
  check_in: string;
  check_out: string;
  rooms: Room[];
};
export function RentalDetail({
  property,
  user,
}: {
  property: Rental;
  user: { id: string; name: string } | null;
}) {
  const [roomId, setRoomId] = useState(property.rooms[0]?.id || "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [guests, setGuests] = useState(2);
  const [units, setUnits] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const room = property.rooms.find((r) => r.id === roomId);
  const total =
    ((room?.nightly_rate_minor || 0) / 100) * nightsBetween(start, end) * units;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      window.location.href =
        "/account?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-stay",
          propertyId: property.id,
          roomId,
          start,
          end,
          guests,
          rooms: units,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setReference(d.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SiteHeader />
      <main className="shell detail-page">
        <Link className="back-link" href="/search">
          <ArrowLeft size={15} />
          Back to stays
        </Link>
        <div className="detail-heading">
          <div>
            <h1>{property.name}</h1>
            <p>
              <MapPin size={16} />
              {property.address}
            </p>
          </div>
          <a
            className="text-link"
            href={`https://www.openstreetmap.org/?mlat=${property.latitude}&mlon=${property.longitude}#map=15/${property.latitude}/${property.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            View map
          </a>
        </div>
        <div className="property-gallery">
          {property.photos.slice(0, 3).map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt={`${property.name} photograph ${i + 1}`}
              loading={i ? "lazy" : "eager"}
            />
          ))}
        </div>
        <div className="detail-layout">
          <div>
            <section className="detail-section">
              <h2>A place for your next stay.</h2>
              <p>{property.description}</p>
              <div className="amenity-list">
                {property.amenities.map((a) => (
                  <span key={a}>{a}</span>
                ))}
              </div>
            </section>
            <section className="detail-section">
              <h2>Available rooms</h2>
              <div className="room-options">
                {property.rooms.map((r) => (
                  <button
                    key={r.id}
                    className={r.id === roomId ? "selected" : ""}
                    onClick={() => setRoomId(r.id)}
                  >
                    <Users size={22} />
                    <div>
                      <strong>{r.name}</strong>
                      <span>
                        {r.beds} | Up to {r.adult_capacity + r.child_capacity} guests |{" "}
                        {money(r.nightly_rate_minor / 100)} per night
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
            <section className="detail-section">
              <h2>Before you arrive</h2>
              <p>
                Check-in: {property.check_in} | Check-out: {property.check_out}
              </p>
              <h3>House rules</h3>
              <p>{property.house_rules}</p>
              <h3>Cancellation policy</h3>
              <p>{property.cancellation_policy}</p>
            </section>
          </div>
          <aside className="booking-panel">
            {reference ? (
              <div className="confirmation">
                <CheckCircle2 size={42} />
                <h2>Request sent.</h2>
                <p>
                  Your host will review your dates. No payment has been taken, and your
                  stay is confirmed only when the host accepts.
                </p>
                <p>Reference: {reference}</p>
                <Link href="/bookings" className="button">
                  View my stay requests
                </Link>
              </div>
            ) : (
              <>
                <h2>Request your stay.</h2>
                {!user && <p>Sign in or create a guest account to send your request.</p>}
                <form onSubmit={submit}>
                  <div className="stack">
                    <label className="field">
                      Room
                      <select
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        required
                      >
                        {property.rooms.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-grid">
                      <label className="field">
                        Check-in
                        <input
                          type="date"
                          min={new Date().toISOString().slice(0, 10)}
                          value={start}
                          onChange={(e) => setStart(e.target.value)}
                          required
                        />
                      </label>
                      <label className="field">
                        Check-out
                        <input
                          type="date"
                          min={start || new Date().toISOString().slice(0, 10)}
                          value={end}
                          onChange={(e) => setEnd(e.target.value)}
                          required
                        />
                      </label>
                      <label className="field">
                        Guests
                        <input
                          type="number"
                          min={1}
                          value={guests}
                          onChange={(e) => setGuests(Number(e.target.value))}
                          required
                        />
                      </label>
                      <label className="field">
                        Rooms
                        <input
                          type="number"
                          min={1}
                          max={room?.units || 1}
                          value={units}
                          onChange={(e) => setUnits(Number(e.target.value))}
                          required
                        />
                      </label>
                    </div>
                    <div className="price-breakdown">
                      <div className="price-total">
                        <span>Room rate total</span>
                        <strong>{money(total)}</strong>
                      </div>
                    </div>
                    <p className="small-copy">
                      Request only. No online payment is collected. Confirm any additional
                      charges directly with the property before accepting.
                    </p>
                    <button className="button full-width" disabled={busy || !room}>
                      {busy
                        ? "Sending..."
                        : user
                          ? "Request this stay"
                          : "Sign in to request a stay"}
                    </button>
                  </div>
                </form>
              </>
            )}
            {error && (
              <p className="status error" role="alert">
                {error}
              </p>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
