# Vabbot Resorts implementation status

Updated: 28 October 2026

## Completed

### Platform architecture

- Separate guest, hotel-manager and super-admin portals.
- Separate localhost ports and isolated Vercel build modes.
- Dedicated Node.js backend with routes, controllers, authentication and services.
- Clerk authentication with server-side role enforcement.
- Prisma and PostgreSQL as the active runtime database.
- Production database migrations and indexes.
- PostgreSQL backup, recovery, verification and SQLite-import tools.
- Cloudflare R2 support for public property images and private documents.

### Guest marketplace

- Guest registration and login with Clerk.
- Accommodation search by dates, adults, children and room quantities.
- Search restricted to approved organisations and published properties.
- Live room-availability checks.
- Property detail pages with images, rooms, amenities, prices, rules, policies and location.
- Stay-request submission and personal booking history.
- Guest booking cancellation.
- Saved-property interface.
- Responsive desktop and mobile presentation.

### Hotel-manager portal

- Organisation registration and verification status.
- Verification-document uploads.
- Property creation and editing.
- Property and room image uploads.
- Room categories and physical room units.
- Availability and nightly-price management.
- Property publication validation.
- Reservation acceptance, decline, check-in, cancellation and completion.
- Property staff roles and property-level access control.
- Arrivals and departures board.
- Physical room assignment with date-overlap protection.
- Vacant, dirty, occupied, cleaning, maintenance and blocked room states.
- Housekeeping and maintenance task board.
- Rate plans and seasonal pricing.
- Minimum stays, taxes and service fees.
- Property staff management screen.
- Occupancy, revenue, ADR and RevPAR dashboard.
- Manager financial dashboard.
- Refund requests and payout history.
- Stripe Connect onboarding.

### Super-admin portal

- User, manager, guest, organisation, property and reservation management.
- User suspension and restoration.
- Organisation verification and document review.
- Secure private-document downloads.
- Listing moderation and suspension.
- Administrator booking cancellation.
- Platform audit logs.
- Platform-wide booking-request switch.
- Financial dashboard for revenue, refunds, commissions and payouts.
- Per-property commission percentage, payout schedule and reserve controls.
- Refund review, Stripe processing, retry and failure tracking.
- Eligible-payout generation and Stripe transfer processing.
- Payout history.
- Stripe dispute visibility and response deadlines.

### Payments and financial backend

- GBP and UK Stripe configuration.
- Stripe Checkout service foundation.
- Stripe Connect Express onboarding.
- Payment, refund, dispute, commission, payout and payout-item tables.
- Cancellation and refund calculations.
- Partial and full refund support.
- Per-property commission settings.
- Reserve-aware payouts for checked-out stays.
- Idempotent per-payment Stripe transfers.
- Checkout, refund, dispute and Connect-account webhook reconciliation.
- Duplicate webhook-event protection.

### External services and quality

- Mapbox geocoding service.
- Resend email adapter.
- Twilio SMS adapter.
- Notification queue and retry service.
- Cloudflare R2 object-storage adapter.
- Guest, manager and administrator production builds.
- TypeScript, ESLint and automated test validation.

## Remaining

### Guest checkout and documents

- Connect accepted stay requests to the Stripe Checkout interface.
- Create temporary inventory holds while checkout is open.
- Add payment-success and payment-failure screens.
- Generate invoices, receipts and booking-confirmation documents.

### PMS enhancements

- Build an interactive multi-room booking calendar.
- Add downloadable occupancy, revenue, ADR, RevPAR and payout reports.
- Add emailed staff invitations.
- Add fine-grained staff permission controls.
- Automate payout generation according to each property's schedule.

### Communication and notifications

- Guest-to-property conversations.
- Complete manager messaging screens.
- Guest and manager notification centres.
- Production email and SMS templates.
- Generate notifications from booking, payment, refund, verification and payout events.
- Deploy and schedule the notification worker.

### Reviews

- Guest reviews after completed stays.
- Manager review responses.
- Administrator review moderation.

### Maps and search

- Address autocomplete and a map picker in property editing.
- Visible maps on property and search pages.
- Map-based accommodation search.
- Additional search filters and sorting.
- Production pagination controls.

### Stripe administration

- Stripe dispute-evidence submission.
- Automated payout-generation job.
- Downloadable payout statements and financial exports.
- Stripe live-mode approval and production activation.

### Production deployment

- Provision the hosted PostgreSQL database.
- Create production Cloudflare R2 upload and backup buckets.
- Apply migrations to the production database.
- Import and verify the real legacy SQLite data.
- Perform and record a backup-and-restore drill.
- Create the three Vercel projects.
- Deploy the long-running Node API.
- Configure production Clerk, Stripe, R2, Mapbox, Resend and Twilio secrets.
- Configure Clerk and Stripe webhook URLs.
- Connect and verify production domains.
- Complete role-based acceptance testing using provider test accounts.
- Enable live payments after every release gate passes.

## Related documentation

- [Feature details](FEATURES.md)
- [Finance and PMS guide](FINANCE_AND_PMS.md)
- [Production deployment](PRODUCTION_DEPLOYMENT.md)
- [Backend API](backend/README.md)
