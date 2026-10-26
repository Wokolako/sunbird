import Stripe from "stripe";

export const PAYMENT_CURRENCY = "gbp";
export const STRIPE_INTEGRATION = "vabbot-resorts";

type StripeEnvironment = {
  STRIPE_PAYMENTS_ENABLED?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
};

export function stripeConfiguration(env: StripeEnvironment = process.env as unknown as StripeEnvironment) {
  if (env.STRIPE_PAYMENTS_ENABLED !== "true") return null;
  if (!env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    throw new Error("Stripe Step 1 requires a test-mode secret key.");
  }
  if (!env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")) {
    throw new Error("Configure the Stripe webhook signing secret.");
  }
  return { secretKey: env.STRIPE_SECRET_KEY, webhookSecret: env.STRIPE_WEBHOOK_SECRET };
}

export function stripeClient(configuration: NonNullable<ReturnType<typeof stripeConfiguration>>) {
  return new Stripe(configuration.secretKey, { maxNetworkRetries: 2, timeout: 10000 });
}

export function verifyStripeEvent(payload: string, signature: string) {
  const configuration = stripeConfiguration();
  if (!configuration) throw new Error("Stripe payments are disabled.");
  const event = stripeClient(configuration).webhooks.constructEvent(payload, signature, configuration.webhookSecret);
  if (event.livemode) throw new Error("Live payment events are not enabled in this integration step.");
  return event;
}
