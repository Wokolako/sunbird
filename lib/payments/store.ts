import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type Stripe from "stripe";
import { PAYMENT_CURRENCY, STRIPE_INTEGRATION } from "./stripe";

type Payment = {
  id: string; booking_id: string; amount_minor: number; currency: string;
  status: "pending" | "paid" | "failed" | "expired" | "review_required";
  stripe_checkout_session_id: string | null;
};

export function initializePaymentSchema(db: DatabaseSync) {
  db.exec(`CREATE TABLE IF NOT EXISTS payment_attempts (
    id TEXT PRIMARY KEY, booking_id TEXT NOT NULL REFERENCES booking_requests(id),
    amount_minor INTEGER NOT NULL CHECK(amount_minor > 0), currency TEXT NOT NULL CHECK(currency='gbp'),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','expired','review_required')),
    stripe_checkout_session_id TEXT UNIQUE, stripe_payment_intent_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_active_payment_booking ON payment_attempts(booking_id)
    WHERE status IN ('pending','paid','review_required');
  CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id TEXT PRIMARY KEY, event_type TEXT NOT NULL, payment_id TEXT REFERENCES payment_attempts(id),
    outcome TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);
}

/** Called by the future checkout service; amounts always come from the accepted booking. */
export function createPendingPayment(db: DatabaseSync, bookingId: string): Payment {
  db.exec("BEGIN IMMEDIATE");
  try {
    const booking = db.prepare(`SELECT b.status,b.total_minor,p.currency FROM booking_requests b
      JOIN properties p ON p.id=b.property_id WHERE b.id=?`).get(bookingId);
    if (!booking || booking.status !== "confirmed") throw new Error("Only accepted bookings can be paid.");
    if (String(booking.currency).toLowerCase() !== PAYMENT_CURRENCY) throw new Error("This booking is not priced in GBP. Currency conversion is not automatic.");
    if (!Number.isSafeInteger(booking.total_minor) || Number(booking.total_minor) < 1) throw new Error("The booking total is invalid.");
    const existing = db.prepare("SELECT * FROM payment_attempts WHERE booking_id=? AND status IN ('pending','paid','review_required')").get(bookingId) as Payment | undefined;
    if (existing && existing.status !== "pending") throw new Error("This booking already has a payment or requires review.");
    if (existing && existing.amount_minor !== booking.total_minor) throw new Error("The booking amount changed. Review its existing payment first.");
    const id = existing?.id || randomUUID();
    if (!existing) db.prepare("INSERT INTO payment_attempts(id,booking_id,amount_minor,currency) VALUES(?,?,?,?)").run(id, bookingId, Number(booking.total_minor), PAYMENT_CURRENCY);
    const result = db.prepare("SELECT * FROM payment_attempts WHERE id=?").get(id) as Payment;
    db.exec("COMMIT");
    return result;
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

function assertSession(payment: Payment, session: Stripe.Checkout.Session) {
  if (session.livemode || session.mode !== "payment" || session.metadata?.integration !== STRIPE_INTEGRATION
    || session.metadata?.paymentId !== payment.id || session.metadata?.bookingId !== payment.booking_id
    || session.client_reference_id !== payment.booking_id || session.currency !== payment.currency
    || session.amount_total !== payment.amount_minor) throw new Error("Stripe session does not match the stored payment.");
}

export function attachCheckoutSession(db: DatabaseSync, paymentId: string, session: Stripe.Checkout.Session) {
  const payment = db.prepare("SELECT * FROM payment_attempts WHERE id=?").get(paymentId) as Payment | undefined;
  if (!payment || payment.status !== "pending") throw new Error("Pending payment not found.");
  assertSession(payment, session);
  if (payment.stripe_checkout_session_id && payment.stripe_checkout_session_id !== session.id) throw new Error("Payment already has a checkout session.");
  const updated = db.prepare(`UPDATE payment_attempts SET stripe_checkout_session_id=?,updated_at=CURRENT_TIMESTAMP
    WHERE id=? AND status='pending' AND (stripe_checkout_session_id IS NULL OR stripe_checkout_session_id=?)`).run(session.id, paymentId, session.id);
  if (Number(updated.changes) !== 1) throw new Error("Payment changed while attaching checkout.");
}

/** Only call after verifying Stripe's raw-body signature. Entire event application is atomic. */
export function applyStripeEvent(db: DatabaseSync, event: Stripe.Event) {
  if (event.livemode) throw new Error("Live events are not enabled.");
  db.exec("BEGIN IMMEDIATE");
  try {
    if (db.prepare("SELECT 1 FROM stripe_webhook_events WHERE id=?").get(event.id)) {
      db.exec("COMMIT"); return { outcome: "duplicate" };
    }
    let paymentId: string | null = null;
    let outcome = "ignored";
    const supported = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"];
    if (supported.includes(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.integration === STRIPE_INTEGRATION) {
        const payment = db.prepare("SELECT * FROM payment_attempts WHERE id=?").get(session.metadata.paymentId || "") as Payment | undefined;
        if (payment) {
          assertSession(payment, session);
          if (payment.stripe_checkout_session_id !== session.id) throw new Error("Checkout session has not been bound to this payment.");
          paymentId = payment.id;
          let status = payment.status;
          if (session.payment_status === "paid" && ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
            const booking = db.prepare("SELECT status FROM booking_requests WHERE id=?").get(payment.booking_id);
            status = booking && ["confirmed", "checked_in", "completed"].includes(String(booking.status)) ? "paid" : "review_required";
          } else if (status === "pending" && event.type === "checkout.session.expired") status = "expired";
          else if (status === "pending" && event.type === "checkout.session.async_payment_failed") status = "failed";
          const intentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;
          db.prepare(`UPDATE payment_attempts SET status=?,stripe_payment_intent_id=COALESCE(?,stripe_payment_intent_id),updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(status, intentId, payment.id);
          if (status !== payment.status) db.prepare(`INSERT INTO audit_log(id,actor_id,entity_type,entity_id,action,before_json,after_json) VALUES(?,?,?,?,?,?,?)`)
            .run(randomUUID(), "stripe", "payment", payment.id, "status", JSON.stringify({ status: payment.status }), JSON.stringify({ status, bookingId: payment.booking_id, stripeEventId: event.id }));
          outcome = status === "review_required" ? "review_required" : "processed";
        }
      }
    }
    db.prepare("INSERT INTO stripe_webhook_events(id,event_type,payment_id,outcome) VALUES(?,?,?,?)").run(event.id, event.type, paymentId, outcome);
    db.exec("COMMIT");
    return { outcome };
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
