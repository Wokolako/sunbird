import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import Stripe from "stripe";
import { NextRequest } from "next/server";
import { POST } from "../app/api/stripe/webhook/route";
import { initializePaymentSchema, createPendingPayment, attachCheckoutSession, applyStripeEvent } from "../lib/payments/store";
import { STRIPE_INTEGRATION, stripeConfiguration, verifyStripeEvent } from "../lib/payments/stripe";

async function main() {
  const previous = { ...process.env };
  const db = new DatabaseSync(":memory:");
  try {
    db.exec(`PRAGMA foreign_keys=ON;
      CREATE TABLE properties(id TEXT PRIMARY KEY,currency TEXT);
      CREATE TABLE booking_requests(id TEXT PRIMARY KEY,property_id TEXT,total_minor INTEGER,status TEXT);
      CREATE TABLE audit_log(id TEXT PRIMARY KEY,actor_id TEXT,entity_type TEXT,entity_id TEXT,action TEXT,before_json TEXT,after_json TEXT);`);
    initializePaymentSchema(db);
    initializePaymentSchema(db);
    db.exec(`INSERT INTO properties VALUES('hotel','GBP'),('legacy','MWK');
      INSERT INTO booking_requests VALUES('booking','hotel',25000,'confirmed'),('unaccepted','hotel',25000,'pending'),('foreign','legacy',25000,'confirmed');`);
    assert.equal(stripeConfiguration({ STRIPE_PAYMENTS_ENABLED: "false" }), null);
    assert.throws(() => stripeConfiguration({ STRIPE_PAYMENTS_ENABLED: "true", STRIPE_SECRET_KEY: "sk_live_example", STRIPE_WEBHOOK_SECRET: "whsec_example" }));
    assert.throws(() => createPendingPayment(db, "unaccepted"));
    assert.throws(() => createPendingPayment(db, "foreign"));
    const payment = createPendingPayment(db, "booking");
    assert.equal(payment.amount_minor, 25000);
    assert.equal(payment.currency, "gbp");
    assert.equal(createPendingPayment(db, "booking").id, payment.id);
    const session = {
      id: "cs_test_local", object: "checkout.session", mode: "payment", livemode: false,
      amount_total: 25000, currency: "gbp", payment_status: "unpaid", client_reference_id: "booking",
      payment_intent: "pi_local", metadata: { integration: STRIPE_INTEGRATION, paymentId: payment.id, bookingId: "booking" },
    } as unknown as Stripe.Checkout.Session;
    attachCheckoutSession(db, payment.id, session);
    assert.throws(() => attachCheckoutSession(db, payment.id, { ...session, id: "cs_test_other" }));
    const event = (id: string, type: string, overrides = {}) => ({
      id, object: "event", type, livemode: false, data: { object: { ...session, ...overrides } },
    }) as unknown as Stripe.Event;
    assert.throws(() => applyStripeEvent(db, event("evt_wrong_amount", "checkout.session.completed", { amount_total: 1, payment_status: "paid" })));
    assert.throws(() => applyStripeEvent(db, event("evt_wrong_currency", "checkout.session.completed", { currency: "usd", payment_status: "paid" })));
    assert.throws(() => applyStripeEvent(db, event("evt_wrong_session", "checkout.session.completed", { id: "cs_test_forged", payment_status: "paid" })));
    assert.equal(db.prepare("SELECT status FROM payment_attempts WHERE id=?").get(payment.id)?.status, "pending");
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM stripe_webhook_events").get()?.n, 0);
    applyStripeEvent(db, event("evt_unpaid", "checkout.session.completed"));
    assert.equal(db.prepare("SELECT status FROM payment_attempts WHERE id=?").get(payment.id)?.status, "pending");
    process.env.STRIPE_PAYMENTS_ENABLED = "true";
    process.env.STRIPE_SECRET_KEY = "sk_test_local_unit_test";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_local_unit_test";
    process.env.APP_PORTAL = "guest";
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = JSON.stringify(event("evt_paid", "checkout.session.completed", { payment_status: "paid" }));
    const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret: process.env.STRIPE_WEBHOOK_SECRET });
    assert.throws(() => verifyStripeEvent(body + " ", signature));
    const verified = verifyStripeEvent(body, signature);
    assert.equal(applyStripeEvent(db, verified).outcome, "processed");
    assert.equal(applyStripeEvent(db, verified).outcome, "duplicate");
    applyStripeEvent(db, event("evt_late_expiry", "checkout.session.expired"));
    applyStripeEvent(db, event("evt_late_failure", "checkout.session.async_payment_failed"));
    assert.equal(db.prepare("SELECT status FROM payment_attempts WHERE id=?").get(payment.id)?.status, "paid");
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM audit_log").get()?.n, 1);
    assert.equal(db.prepare("SELECT status FROM booking_requests WHERE id='booking'").get()?.status, "confirmed");
    assert.throws(() => createPendingPayment(db, "booking"));
    const live = JSON.stringify({ ...verified, livemode: true });
    assert.throws(() => verifyStripeEvent(live, stripe.webhooks.generateTestHeaderString({ payload: live, secret: process.env.STRIPE_WEBHOOK_SECRET! })));
    process.env.STRIPE_PAYMENTS_ENABLED = "false";
    assert.equal((await POST(new NextRequest("http://localhost:3000/api/stripe/webhook", { method: "POST" }))).status, 503);
    process.env.APP_PORTAL = "management";
    assert.equal((await POST(new NextRequest("http://localhost:3001/api/stripe/webhook", { method: "POST" }))).status, 404);
    process.env.APP_PORTAL = "guest";
    process.env.STRIPE_PAYMENTS_ENABLED = "true";
    assert.equal((await POST(new NextRequest("http://localhost:3000/api/stripe/webhook", { method: "POST", body: "{}", headers: { "stripe-signature": "forged" } }))).status, 400);
    db.exec("INSERT INTO booking_requests VALUES('late','hotel',1000,'confirmed'),('retry','hotel',1000,'confirmed')");
    const late = createPendingPayment(db, "late");
    const lateSession = { ...session, id: "cs_test_late", amount_total: 1000, client_reference_id: "late", payment_intent: "pi_late", metadata: { integration: STRIPE_INTEGRATION, paymentId: late.id, bookingId: "late" } };
    attachCheckoutSession(db, late.id, lateSession);
    db.exec("UPDATE booking_requests SET status='cancelled' WHERE id='late'");
    assert.equal(applyStripeEvent(db, { ...event("evt_late_payment", "checkout.session.completed"), data: { object: { ...lateSession, payment_status: "paid" } } } as Stripe.Event).outcome, "review_required");
    assert.throws(() => createPendingPayment(db, "late"));
    const retry = createPendingPayment(db, "retry");
    const retrySession = { ...lateSession, id: "cs_test_retry", payment_intent: "pi_retry", client_reference_id: "retry", metadata: { integration: STRIPE_INTEGRATION, paymentId: retry.id, bookingId: "retry" } };
    attachCheckoutSession(db, retry.id, retrySession);
    applyStripeEvent(db, { ...event("evt_expired", "checkout.session.expired"), data: { object: retrySession } } as Stripe.Event);
    assert.notEqual(createPendingPayment(db, "retry").id, retry.id);
    console.log("PASS: Stripe configuration, signed webhooks, GBP totals, session binding, replay safety, event ordering, cancellation review and portal isolation; no external charges");
  } finally {
    db.close();
    for (const key of ["STRIPE_PAYMENTS_ENABLED", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "APP_PORTAL"]) {
      if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
