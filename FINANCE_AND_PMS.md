# Vabbot Resorts finance and PMS guide

Updated: 28 October 2026

## Roles and property boundaries

The manager portal supports organisation owners and property staff. Owners can access every property in their organisation. Managers, front-desk staff and housekeepers receive only properties represented by active `PropertyStaff` records. Every PMS write checks the property and permitted role again in the Node backend.

The super administrator can see platform-wide financial information and is the only role allowed to change commissions, process refunds, generate payouts or release Stripe transfers.

## Manager PMS

| Section | Functions |
| --- | --- |
| Operations | Today's arrivals and departures, physical room assignment, room state, housekeeping and maintenance tasks |
| Rates | Rate plans, minimum stay, tax, service fee and date-based seasonal room prices |
| Team | Property staff assignment with manager, front-desk and housekeeper roles |
| Reports | 30-day bookings, occupied room nights, gross reservation revenue, occupancy, ADR and RevPAR |
| Finance | Payments, platform commission, refundable balances, refund requests, payout history and Stripe Connect onboarding |

Physical room assignment verifies that the room belongs to the reservation's room category and rejects overlapping active reservations. The database also contains a PostgreSQL exclusion constraint as a final concurrency safeguard.

Operational room states are vacant clean, vacant dirty, occupied, cleaning, maintenance and blocked. Tasks can be created for housekeeping or maintenance and attached to a physical room or the whole property.

## Financial lifecycle

1. Stripe Checkout creates a `Payment` record tied to a reservation.
2. A signed Checkout webhook marks the payment completed and confirms the reservation.
3. Cancellation or a manager/admin action creates a policy-calculated `Refund` request.
4. An administrator processes the request through Stripe. Webhooks reconcile pending, successful and failed states.
5. After checkout and the property's reserve period, an administrator generates a payout. Each eligible payment can belong to only one payout item.
6. Once the organisation's Stripe Connect account reports payouts ready, the administrator releases the payout. Every payment transfer stores its Stripe transfer ID so retries cannot transfer the same item twice.
7. Stripe disputes are recorded with their status and response deadline for administrator visibility.

Default commercial settings are 12% commission, weekly payouts and a seven-day reserve. The administrator can override all three values per property. Only checked-out reservations are eligible for payout generation.

## Cancellation and refunds

The current policy defaults are:

- Guest cancellation at least 48 hours before arrival: full refund.
- Guest cancellation 24-48 hours before arrival: 50% refund.
- Guest cancellation less than 24 hours before arrival or no-show: no automatic refund.
- Property or platform cancellation: full refund.

The refund service subtracts successful earlier refunds before calculating the new request. Stripe processing records the provider refund ID, updates a payment to partially or fully refunded, and preserves failure details for an administrator retry.

## Stripe Connect

Set `STRIPE_CONNECT_ENABLED=true`, `STRIPE_ACCOUNT_COUNTRY=GB`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GUEST_APP_URL` and `MANAGER_APP_URL`. The manager starts Express onboarding from the Finance section. The `account.updated` webhook controls `stripeChargesReady` and `stripePayoutsReady`; payout release is refused until payouts are ready.

The webhook endpoint is `/api/stripe/webhook` on the guest deployment. It must receive Checkout session, refund, charge dispute and connected-account events.

## Administrator finance dashboard

The Finance section shows gross completed payments, successful refunds, commission, property net revenue, paid payouts and pending payouts. It also provides:

- Per-property commission, payout schedule and reserve settings.
- Refund approval, Stripe processing and failed-refund retry.
- Payout generation for eligible stays.
- Stripe transfer processing and payout history.
- Dispute amount, reason, status and response deadline.

## Production checklist

1. Deploy the PostgreSQL migration and run `npm run db:verify`.
2. Configure Stripe test keys, Connect, application URLs and the signed webhook.
3. Complete manager Connect onboarding and verify both readiness flags.
4. Complete a test payment and mark its reservation checked out.
5. Generate a payout after using a zero-day reserve in the test property policy.
6. Process the payout and confirm every payout item has a provider transfer ID.
7. Issue both partial and full refunds and confirm webhook reconciliation.
8. Test a dispute event and its deadline in the administrator dashboard.
9. Restore the real reserve and commission policy before enabling live mode.

## Remaining enhancements

- Connect guest stay acceptance to Stripe Checkout and temporary inventory holds.
- Add an interactive multi-room PMS calendar.
- Automate payout generation on the selected schedule after the manual workflow is accepted.
- Add dispute evidence submission and downloadable finance/PMS reports.
