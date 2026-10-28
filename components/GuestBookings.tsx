"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { CreditCard, Download, MessageSquare, Printer, X, Send } from "lucide-react";
import { SiteHeader, SiteFooter } from "./SiteShell";
import { money } from "@/lib/stays";

type Booking = {
  id: string;
  property_id: string;
  property_name: string;
  room_name: string;
  check_in: string;
  check_out: string;
  status: string;
  guests: number;
  rooms: number;
  total_minor: number;
};

type InvoiceData = {
  invoiceNumber: string;
  referenceCode: string;
  issueDate: string;
  paidDate: string | null;
  status: string;
  propertyName: string;
  propertyAddress: string;
  propertyPhone: string;
  propertyEmail: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  roomName: string;
  unitsCount: number;
  adultsCount: number;
  currency: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  paymentMethod: string;
};

type ChatMessage = {
  id: string;
  sender_name: string;
  is_me: boolean;
  content: string;
  created_at: string;
};

export function GuestBookings() {
  const { isLoaded, isSignedIn } = useAuth();
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  // Invoice Modal State
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Chat Modal State
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/backend/api/platform?view=bookings", {
        cache: "no-store",
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setRows(d.bookings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your stays.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    void load();
  }, [isLoaded, isSignedIn]);

  async function cancel(id: string) {
    setBusy(id);
    setError("");
    try {
      const r = await fetch("/api/backend/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "booking-status", id, status: "cancelled" }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel.");
    } finally {
      setBusy("");
    }
  }

  // 1. Pay Now Button Handler (Places 15-min room hold & starts checkout)
  async function pay(id: string) {
    setBusy(id);
    setError("");
    try {
      const r = await fetch("/api/backend/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-checkout-session",
          bookingId: id,
          origin: window.location.origin,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Payment checkout failed.");
      if (d.checkoutUrl) {
        window.location.href = d.checkoutUrl;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment checkout.");
    } finally {
      setBusy("");
    }
  }

  // 2. Load Invoice Handler
  async function viewInvoice(bookingId: string) {
    setLoadingInvoice(true);
    try {
      const r = await fetch(`/api/backend/api/platform?view=invoice&bookingId=${bookingId}`);
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Could not retrieve invoice.");
      setActiveInvoice(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoice.");
    } finally {
      setLoadingInvoice(false);
    }
  }

  // 3. Chat / Messaging Handlers
  async function openChat(b: Booking) {
    setActiveChatBooking(b);
    try {
      const r = await fetch(`/api/backend/api/platform?view=messages&reservationId=${b.id}`);
      const d = await r.json();
      if (r.ok && d.messages) setMessages(d.messages);
    } catch {
      setMessages([]);
    }
  }

  async function sendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatBooking) return;
    setSendingMsg(true);
    try {
      const r = await fetch("/api/backend/api/platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-message",
          propertyId: activeChatBooking.property_id,
          reservationId: activeChatBooking.id,
          content: chatInput.trim(),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Message could not be sent.");
      setChatInput("");
      // Refresh messages
      const mr = await fetch(`/api/backend/api/platform?view=messages&reservationId=${activeChatBooking.id}`);
      const md = await mr.json();
      if (mr.ok && md.messages) setMessages(md.messages);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSendingMsg(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="shell account-page">
        <div className="section-title">
          <div>
            <h1>Your stays. Your stories.</h1>
            <p>Your own requests and confirmed stays, all in one place.</p>
          </div>
          <Link href="/search" className="button">
            Find another stay
          </Link>
        </div>
        {!isLoaded || loading ? (
          <p role="status">Loading your stays...</p>
        ) : !isSignedIn ? (
          <div className="empty-state">
            <h2>Sign in to see your stays.</h2>
            <p>Your booking requests are protected by your Vabbot account.</p>
            <div className="form-actions">
              <SignInButton mode="modal">
                <button className="button">Sign in</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="button secondary">Create account</button>
              </SignUpButton>
            </div>
          </div>
        ) : error ? (
          <p className="status error" role="alert">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <h2>Your next story is waiting.</h2>
            <p>Find a hotel or house and send your first stay request.</p>
            <Link href="/search" className="button">
              Find a stay
            </Link>
          </div>
        ) : (
          <div className="stack">
            {rows.map((b) => (
              <article className="card" key={b.id} style={{ position: "relative" }}>
                <div className="toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{b.property_name}</h2>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
                      {b.room_name} | {b.check_in} to {b.check_out}
                    </p>
                  </div>
                  <span className={`badge ${b.status === "confirmed" ? "badge-success" : ""}`} style={{ textTransform: "capitalize" }}>
                    {b.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div style={{ marginTop: "12px", fontSize: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <strong>{money(b.total_minor / 100)}</strong> ({b.guests} guests, {b.rooms} room{b.rooms > 1 ? "s" : ""})
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>Ref: {b.id}</div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {/* PAY NOW BUTTON */}
                    {["pending", "requested"].includes(b.status.toLowerCase()) && (
                      <button
                        className="button"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#0f172a", color: "#fff", padding: "8px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", border: "none", cursor: "pointer" }}
                        disabled={busy === b.id}
                        onClick={() => void pay(b.id)}
                      >
                        <CreditCard size={16} />
                        {busy === b.id ? "Securing hold..." : "Pay Now"}
                      </button>
                    )}

                    {/* DOWNLOAD INVOICE BUTTON */}
                    {["confirmed", "completed"].includes(b.status.toLowerCase()) && (
                      <button
                        className="button secondary"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                        disabled={loadingInvoice}
                        onClick={() => void viewInvoice(b.id)}
                      >
                        <Download size={15} />
                        Invoice / Receipt
                      </button>
                    )}

                    {/* MESSAGE PROPERTY BUTTON */}
                    <button
                      className="button secondary"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                      onClick={() => void openChat(b)}
                    >
                      <MessageSquare size={15} />
                      Message Hotel
                    </button>
                  </div>
                </div>

                {/* CANCELLATION ACCORDION */}
                {["pending", "confirmed"].includes(b.status) && (
                  <details className="cancel-request" style={{ marginTop: "16px", fontSize: "13px", color: "#64748b" }}>
                    <summary style={{ cursor: "pointer" }}>Cancel this stay</summary>
                    <p style={{ margin: "8px 0" }}>
                      Check the property&apos;s cancellation policy. If eligible, your refund will be automatically calculated according to the reserve terms.
                    </p>
                    <button
                      className="button secondary"
                      style={{ fontSize: "12px", padding: "6px 12px" }}
                      disabled={busy === b.id}
                      onClick={() => void cancel(b.id)}
                    >
                      Confirm cancellation
                    </button>
                  </details>
                )}
              </article>
            ))}
          </div>
        )}

        {/* INVOICE MODAL */}
        {activeInvoice && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#fff", width: "100%", maxWidth: "600px", borderRadius: "8px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Receipt &amp; Invoice</h3>
                <button onClick={() => setActiveInvoice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={20} /></button>
              </div>

              <div id="printable-invoice" style={{ padding: "24px", overflowY: "auto", flex: 1, fontSize: "14px", color: "#334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px" }}>{activeInvoice.propertyName}</h2>
                    <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>{activeInvoice.propertyAddress}</p>
                    <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "13px" }}>{activeInvoice.propertyEmail}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "inline-block", background: activeInvoice.status === "PAID" ? "#dcfce7" : "#fef3c7", color: activeInvoice.status === "PAID" ? "#166534" : "#92400e", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "12px" }}>
                      {activeInvoice.status}
                    </span>
                    <p style={{ margin: "6px 0 0 0", fontWeight: "600" }}>{activeInvoice.invoiceNumber}</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Date: {activeInvoice.issueDate}</p>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "16px 0", margin: "16px 0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <strong style={{ color: "#0f172a", fontSize: "13px" }}>Billed To:</strong>
                      <p style={{ margin: "4px 0 0 0" }}>{activeInvoice.guestName}</p>
                      <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "13px" }}>{activeInvoice.guestEmail}</p>
                    </div>
                    <div>
                      <strong style={{ color: "#0f172a", fontSize: "13px" }}>Reservation Details:</strong>
                      <p style={{ margin: "4px 0 0 0" }}>{activeInvoice.roomName}</p>
                      <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "13px" }}>{activeInvoice.checkIn} to {activeInvoice.checkOut}</p>
                      <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "12px" }}>Ref: {activeInvoice.referenceCode}</p>
                    </div>
                  </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", margin: "16px 0" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #cbd5e1", textAlign: "left", color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 0" }}>Description</th>
                      <th style={{ padding: "8px 0", textAlign: "center" }}>Qty</th>
                      <th style={{ padding: "8px 0", textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 0" }}>{activeInvoice.roomName} Accommodation</td>
                      <td style={{ padding: "12px 0", textAlign: "center" }}>{activeInvoice.unitsCount} room</td>
                      <td style={{ padding: "12px 0", textAlign: "right" }}>{money(Number(activeInvoice.subtotal))}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 0" }}>Taxes &amp; Service Fees (10%)</td>
                      <td style={{ padding: "12px 0", textAlign: "center" }}>-</td>
                      <td style={{ padding: "12px 0", textAlign: "right" }}>{money(Number(activeInvoice.taxAmount))}</td>
                    </tr>
                    <tr style={{ fontWeight: "bold", fontSize: "16px", color: "#0f172a" }}>
                      <td style={{ padding: "16px 0 4px 0" }}>Total Amount</td>
                      <td style={{ padding: "16px 0 4px 0", textAlign: "center" }}></td>
                      <td style={{ padding: "16px 0 4px 0", textAlign: "right" }}>{money(Number(activeInvoice.totalAmount))}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "#64748b" }}>
                  <strong>Payment Method:</strong> {activeInvoice.paymentMethod} {activeInvoice.paidDate ? `(Paid on ${activeInvoice.paidDate})` : ""}
                </div>
              </div>

              <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  className="button"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#0f172a", color: "#fff", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px" }}
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  Print / Save PDF
                </button>
                <button
                  className="button secondary"
                  style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}
                  onClick={() => setActiveInvoice(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GUEST-TO-HOTEL CHAT MODAL */}
        {activeChatBooking && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#fff", width: "100%", maxWidth: "520px", height: "550px", borderRadius: "8px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f172a", color: "#fff" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#fff" }}>{activeChatBooking.property_name}</h3>
                  <small style={{ color: "#94a3b8" }}>Ref: {activeChatBooking.id}</small>
                </div>
                <button onClick={() => setActiveChatBooking(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}><X size={18} /></button>
              </div>

              <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", background: "#f8fafc" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#94a3b8", margin: "auto", fontSize: "14px" }}>
                    No messages yet.<br />Ask about early check-in, dietary needs, or property amenities.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.is_me ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        backgroundColor: m.is_me ? "#0f172a" : "#ffffff",
                        color: m.is_me ? "#ffffff" : "#0f172a",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: m.is_me ? "none" : "1px solid #e2e8f0",
                        fontSize: "14px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: m.is_me ? "#94a3b8" : "#64748b", marginBottom: "3px" }}>
                        {m.is_me ? "You" : m.sender_name}
                      </div>
                      <div>{m.content}</div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendChatMessage} style={{ padding: "12px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "8px", background: "#fff" }}>
                <input
                  type="text"
                  placeholder="Type a message to the hotel..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{ flex: 1, padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", outline: "none" }}
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !chatInput.trim()}
                  style={{ backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: "6px", padding: "0 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
