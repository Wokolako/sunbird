import Stripe from "stripe";
import { commissionQuote } from "./policy";

function client() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  if (process.env.NODE_ENV === "production" && !key.startsWith("sk_live_"))
    throw new Error("Production requires a live Stripe secret key.");
  return new Stripe(key);
}

export async function paymentIntentCharge(paymentIntentId: string) {
  const intent = await client().paymentIntents.retrieve(paymentIntentId);
  const charge = typeof intent.latest_charge === "string"
    ? intent.latest_charge
    : intent.latest_charge?.id;
  if (!charge) throw new Error("The Stripe payment has no transferable charge.");
  return charge;
}

export async function createConnectedAccount(input: {
  email: string;
  country: string;
  organisationId: string;
}) {
  if (process.env.STRIPE_CONNECT_ENABLED !== "true")
    throw new Error("Stripe Connect is disabled.");
  return client().accounts.create(
    {
      type: "express",
      country: input.country.toUpperCase(),
      email: input.email,
      business_type: "company",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { organisationId: input.organisationId },
    },
    { idempotencyKey: `connect:${input.organisationId}` }
  );
}

export async function createAccountOnboardingLink(input: {
  accountId: string;
  organisationId: string;
}) {
  const managerUrl = process.env.MANAGER_APP_URL;
  if (!managerUrl) throw new Error("Manager application URL is not configured.");
  return client().accountLinks.create({
    account: input.accountId,
    type: "account_onboarding",
    refresh_url: `${managerUrl}/?connect=refresh&organisation=${input.organisationId}`,
    return_url: `${managerUrl}/?connect=complete&organisation=${input.organisationId}`,
  });
}

export async function createMarketplaceCheckout(input: {
  bookingId: string;
  propertyName: string;
  amountMinor: number;
  customerEmail: string;
}) {
  const guestUrl = process.env.GUEST_APP_URL;
  if (!guestUrl) throw new Error("Guest application URL is not configured.");
  const quote = commissionQuote(input.amountMinor);
  return client().checkout.sessions.create(
    {
      mode: "payment",
      customer_email: input.customerEmail,
      client_reference_id: input.bookingId,
      success_url: `${guestUrl}/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${guestUrl}/bookings?payment=cancelled`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: input.amountMinor,
            product_data: { name: `${input.propertyName} stay` },
          },
        },
      ],
      payment_intent_data: {
        transfer_group: `booking_${input.bookingId}`,
        metadata: {
          integration: "vabbot-resorts",
          bookingId: input.bookingId,
          commissionMinor: String(quote.commissionMinor),
        },
      },
      metadata: {
        integration: "vabbot-resorts",
        bookingId: input.bookingId,
        commissionMinor: String(quote.commissionMinor),
      },
    },
    { idempotencyKey: `checkout:${input.bookingId}:${input.amountMinor}` }
  );
}

export async function transferPropertyFunds(input: {
  bookingId: string;
  chargeId: string;
  connectedAccountId: string;
  grossMinor: number;
  netMinor?: number;
}) {
  const quote = commissionQuote(input.grossMinor);
  return client().transfers.create(
    {
      amount: input.netMinor ?? quote.netMinor,
      currency: "gbp",
      destination: input.connectedAccountId,
      transfer_group: `booking_${input.bookingId}`,
      source_transaction: input.chargeId,
      metadata: { bookingId: input.bookingId },
    },
    { idempotencyKey: `transfer:${input.bookingId}` }
  );
}

export async function createStripeRefund(input: {
  paymentIntentId: string;
  refundId: string;
  amountMinor: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}) {
  return client().refunds.create(
    {
      payment_intent: input.paymentIntentId,
      amount: input.amountMinor,
      reason: input.reason || "requested_by_customer",
      metadata: { refundId: input.refundId },
    },
    { idempotencyKey: `refund:${input.refundId}` }
  );
}
