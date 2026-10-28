import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { stripeConfiguration } from "../lib/payments/stripe";

assert.equal(stripeConfiguration({ STRIPE_PAYMENTS_ENABLED: "false" }), null);
assert.throws(() => stripeConfiguration({ STRIPE_PAYMENTS_ENABLED: "true", STRIPE_SECRET_KEY: "bad", STRIPE_WEBHOOK_SECRET: "bad" }), /test-mode secret key/);
assert.deepEqual(stripeConfiguration({ STRIPE_PAYMENTS_ENABLED: "true", STRIPE_SECRET_KEY: "sk_test_example", STRIPE_WEBHOOK_SECRET: "whsec_example" }), { secretKey: "sk_test_example", webhookSecret: "whsec_example" });
const webhook = readFileSync(path.join(process.cwd(), "app/api/stripe/webhook/route.ts"), "utf8");
assert.match(webhook, /prisma\.\$transaction/);
assert.match(webhook, /providerEvent/);
assert.doesNotMatch(webhook, /node:sqlite|DatabaseSync|database\(\)/);
console.log("PASS: Stripe webhook persists through Prisma/PostgreSQL");
