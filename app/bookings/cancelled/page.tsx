"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteShell";

function CancelledContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "32px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "#fee2e2", color: "#991b1b", marginBottom: "20px" }}>
        <XCircle size={48} strokeWidth={2} />
      </div>

      <h1 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "8px" }}>Payment Cancelled</h1>
      <p style={{ color: "#64748b", fontSize: "16px", margin: "0 0 24px 0" }}>
        Your payment session was cancelled. No charges were made to your account.
      </p>

      {bookingId && (
        <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "6px", marginBottom: "28px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#64748b" }}>
          Reference: <span style={{ fontWeight: "600", fontFamily: "monospace", color: "#0f172a" }}>{bookingId}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/bookings"
          className="button"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#0f172a", color: "#fff", padding: "10px 20px", borderRadius: "6px", textDecoration: "none", fontWeight: "500" }}
        >
          <RefreshCw size={16} />
          Return to My Stays to Retry
        </Link>
        <Link
          href="/search"
          className="button secondary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "6px", textDecoration: "none" }}
        >
          <ArrowLeft size={16} />
          Search Other Stays
        </Link>
      </div>
    </div>
  );
}

export default function BookingCancelledPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <Suspense fallback={<p style={{ textAlign: "center", padding: "40px" }}>Loading...</p>}>
          <CancelledContent />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

