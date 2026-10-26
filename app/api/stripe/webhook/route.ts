import { NextRequest, NextResponse } from "next/server";
import { database, portalRole } from "@/lib/platform";
import { stripeConfiguration, verifyStripeEvent } from "@/lib/payments/stripe";
import { applyStripeEvent } from "@/lib/payments/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (portalRole() !== "guest") return NextResponse.json({ error: "Not available in this portal." }, { status: 404 });
  try {
    if (!stripeConfiguration()) return NextResponse.json({ error: "Payments are disabled." }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "Payment configuration is incomplete." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Stripe signature required." }, { status: 400 });
  let event;
  try { event = verifyStripeEvent(await request.text(), signature); }
  catch { return NextResponse.json({ error: "Invalid Stripe event signature or mode." }, { status: 400 }); }
  try {
    const result = applyStripeEvent(database(), event);
    return NextResponse.json({ received: true, ...result });
  } catch {
    // Keep the event unprocessed so Stripe can retry; never log raw event payloads or secrets.
    return NextResponse.json({ error: "Payment event could not be reconciled." }, { status: 500 });
  }
}
