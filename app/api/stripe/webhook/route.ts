import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripeConfiguration, verifyStripeEvent } from "@/lib/payments/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if ((process.env.APP_PORTAL || "guest") !== "guest") return NextResponse.json({ error: "Not available in this portal." }, { status: 404 });
  try { if (!stripeConfiguration()) return NextResponse.json({ error: "Payments are disabled." }, { status: 503 }); }
  catch { return NextResponse.json({ error: "Payment configuration is incomplete." }, { status: 503 }); }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Stripe signature required." }, { status: 400 });
  const payload = await request.text();
  let event: Stripe.Event;
  try { event = verifyStripeEvent(payload, signature); }
  catch { return NextResponse.json({ error: "Invalid Stripe event signature or mode." }, { status: 400 }); }
  try {
    const result = await prisma.$transaction(async (tx) => {
      if (await tx.providerEvent.findUnique({ where: { id: event.id } })) return { outcome: "duplicate" };
      let outcome = "ignored";
      if (["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"].includes(event.type)) {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentId = session.metadata?.paymentId;
        if (paymentId) {
          const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { reservation: true } });
          if (!payment || payment.checkoutSessionId !== session.id || session.currency?.toUpperCase() !== payment.currency || session.amount_total !== Math.round(Number(payment.amount) * 100)) throw new Error("Stripe session does not match the stored payment.");
          if (session.payment_status === "paid" && ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
            const providerPaymentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
            await tx.payment.update({ where: { id: payment.id }, data: { status: "COMPLETED", providerPaymentId, transactionReference: providerPaymentId, paidAt: new Date() } });
            if (["REQUESTED", "PAYMENT_PENDING", "HELD"].includes(payment.reservation.status)) await tx.reservation.update({ where: { id: payment.reservationId }, data: { status: "CONFIRMED" } });
            outcome = "processed";
          } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
            await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failedAt: new Date() } }); outcome = "processed";
          }
        }
      }
      if (event.type === "refund.updated" || event.type === "refund.created") {
        const stripeRefund = event.data.object as Stripe.Refund;
        const refundId = stripeRefund.metadata?.refundId;
        const refund = refundId ? await tx.refund.findUnique({ where: { id: refundId }, include: { payment: { include: { refunds: true } } } }) : await tx.refund.findFirst({ where: { providerRefundId: stripeRefund.id }, include: { payment: { include: { refunds: true } } } });
        if (refund) {
          const status = stripeRefund.status === "succeeded" ? "SUCCEEDED" : stripeRefund.status === "failed" || stripeRefund.status === "canceled" ? "FAILED" : "PENDING";
          await tx.refund.update({ where: { id: refund.id }, data: { providerRefundId: stripeRefund.id, status, failureReason: stripeRefund.failure_reason || null } });
          if (status === "SUCCEEDED") {
            const refundedMinor = refund.payment.refunds.filter((item) => item.id !== refund.id && item.status === "SUCCEEDED").reduce((sum, item) => sum + Math.round(Number(item.amount) * 100), Math.round(Number(refund.amount) * 100));
            await tx.payment.update({ where: { id: refund.paymentId }, data: { status: refundedMinor >= Math.round(Number(refund.payment.amount) * 100) ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
          }
          outcome = "processed";
        }
      }
      if (event.type.startsWith("charge.dispute.")) {
        const dispute = event.data.object as Stripe.Dispute & { payment_intent?: string | Stripe.PaymentIntent | null };
        const paymentIntentId = typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
        const payment = paymentIntentId ? await tx.payment.findUnique({ where: { providerPaymentId: paymentIntentId } }) : null;
        if (payment) {
          const statusMap = { warning_needs_response: "WARNING_NEEDS_RESPONSE", needs_response: "NEEDS_RESPONSE", warning_under_review: "UNDER_REVIEW", under_review: "UNDER_REVIEW", won: "WON", lost: "LOST" } as const;
          const status = statusMap[dispute.status as keyof typeof statusMap] || "UNDER_REVIEW";
          await tx.dispute.upsert({ where: { providerDisputeId: dispute.id }, update: { status, reason: dispute.reason, responseDueAt: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null }, create: { paymentId: payment.id, providerDisputeId: dispute.id, amount: dispute.amount / 100, currency: dispute.currency.toUpperCase(), reason: dispute.reason, status, responseDueAt: dispute.evidence_details?.due_by ? new Date(dispute.evidence_details.due_by * 1000) : null } });
          outcome = "processed";
        }
      }
      if (event.type === "account.updated") {
        const account = event.data.object as Stripe.Account;
        const organisation = await tx.organisation.findUnique({ where: { stripeAccountId: account.id } });
        if (organisation) { await tx.organisation.update({ where: { id: organisation.id }, data: { stripeChargesReady: Boolean(account.charges_enabled), stripePayoutsReady: Boolean(account.payouts_enabled) } }); outcome = "processed"; }
      }
      await tx.providerEvent.create({ data: { id: event.id, provider: "stripe", type: event.type, payloadHash: createHash("sha256").update(payload).digest("hex"), processedAt: new Date() } });
      return { outcome };
    });
    return NextResponse.json({ received: true, ...result });
  } catch { return NextResponse.json({ error: "Payment event could not be reconciled." }, { status: 500 }); }
}
