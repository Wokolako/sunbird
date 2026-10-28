"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Download, Home } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteShell";

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");
  const sessionId = searchParams.get("session_id");
  const [confirming, setConfirming] = useState(true);
  const [confirmedData, setConfirmedData] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) {
      setConfirming(false);
      return;
    }

    async function confirm() {
      try {
        const r = await fetch("/api/backend/api/platform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "confirm-payment",
            bookingId,
            sessionId: sessionId || "card_checkout",
          }),
        });
        const d = await r.json();
        if (r.ok) {
          setConfirmedData(d);
        }
      } catch (err) {
        console.error("Payment confirmation sync error:", err);
      } finally {
        setConfirming(false);
      }
    }

    void confirm();
  }, [bookingId, sessionId]);

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "32px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "#dcfce7", color: "#166534", marginBottom: "20px" }}>
        <CheckCircle2 size={48} strokeWidth={2} />
      </div>

      <h1 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "8px" }}>Payment Successful!</h1>
      <p style={{ color: "#64748b", fontSize: "16px", margin: "0 0 24px 0" }}>
        Your reservation has been confirmed and locked. A confirmation email and receipt have been dispatched.
      </p>

      {bookingId && (
        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "6px", marginBottom: "28px", border: "1px solid #e2e8f0", textAlign: "left", fontSize: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "#64748b" }}>Reservation ID:</span>
            <span style={{ fontWeight: "600", fontFamily: "monospace" }}>{bookingId}</span>
          </div>
          {confirmedData?.invoiceNumber && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "#64748b" }}>Invoice Number:</span>
              <span style={{ fontWeight: "600" }}>{confirmedData.invoiceNumber}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Status:</span>
            <span style={{ color: "#166534", fontWeight: "bold" }}>CONFIRMED &amp; PAID</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/bookings"
          className="button"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#0f172a", color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none", fontWeight: "500" }}
        >
          View My Stays
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/"
          className="button secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "6px", textDecoration: "none" }}
        >
          <Home size={16} />
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <Suspense fallback={<p style={{ textAlign: "center", padding: "40px" }}>Confirming your payment...</p>}>
          <SuccessContent />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

