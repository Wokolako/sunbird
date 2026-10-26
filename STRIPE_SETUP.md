# Stripe implementation: Step 1

Confirmed decisions: Stripe account country United Kingdom; checkout currency GBP.

This step adds the official Stripe server SDK, a local payment ledger and a signed webhook endpoint. Payments are disabled by default, and only test-mode keys/events are accepted. There is no checkout button or session-creation endpoint yet, and this step cannot initiate a charge. No keys were created or added to the repository.

## Private configuration

Set these in your private environment on the guest portal. Do not paste keys into chat or commit them:

```dotenv
STRIPE_PAYMENTS_ENABLED=true
STRIPE_SECRET_KEY=sk_test_REPLACE_PRIVATELY
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_PRIVATELY
```

The webhook URL is `POST /api/stripe/webhook` on the guest portal only. For local testing, forward Stripe CLI events to `localhost:3000/api/stripe/webhook` and use the signing secret printed by that listener. Restart the local guest server after changing its environment. A publishable key is not needed in this backend step.

The endpoint checks the raw-body signature before accessing the database. Invalid signatures return 400, disabled/incomplete setup returns 503, and unreconciled events return 500 for retry. Other portals reject the route. Signature-verified irrelevant events are acknowledged without changing a payment.

Payment attempts derive their amount from an accepted booking, reject non-GBP records rather than relabelling or converting them, and bind the exact Stripe session, booking, amount, currency and integration metadata. Payment status is separate from booking status. The webhook never changes booking acceptance or inventory. Replayed event IDs have no repeated effect. Late expiry/failure events cannot downgrade a paid payment. A payment arriving after cancellation is flagged for review. No raw card details or full webhook payloads are stored.

## Next steps, in order

1. Add hosted Checkout for accepted bookings, authenticated guest ownership checks, server-side idempotency keys and consistent GBP pricing throughout the UI. Preserve the current stored currencies; do not silently convert historic amounts. Define checkout retry/expiry and cancellation coordination before exposing payment buttons.
2. Add full/deposit options, balance tracking and server-calculated itemized pricing. Do not invent VAT rates or a deposit percentage.
3. Add confirmation notifications, payment history and receipts.
4. Add policy-based refunds and dispute handling with provider reconciliation.
5. Choose and implement the Stripe Connect money flow, hotel onboarding, commission rules and payouts. The charge owner and connected-account countries must be confirmed before enabling real marketplace payments.
6. Complete shared production database/storage migration, provider integration tests and live-mode activation checks.

Cards and supported wallets can be enabled in the subsequent Checkout integration. Mobile money is not claimed as implemented or available for every Stripe account/market.

Run `npm test` for the local signature and ledger tests. They use an in-memory database and synthetic signed events and never contact Stripe to create charges. Actual Stripe sandbox Checkout and webhook delivery require private test credentials and are not verified by these unit tests.
