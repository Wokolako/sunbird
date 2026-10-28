# Vabbot Resorts feature status

Updated: 28 October 2026

## Product structure

### Done

- Separate guest, hotel-manager, and super-admin portals.
- Separate local ports and isolated Vercel build modes.
- Dedicated Node.js API used by the three portals.
- Clerk authentication and server-side role enforcement.
- PostgreSQL is the only runtime database through Prisma.
- SQLite is limited to the read-only legacy-data importer.
- Shared frontend proxy securely forwards Clerk session tokens to the Node API.

### Remaining

- Provision the real hosting projects and production API service.
- Add production secrets and connect the final domains.
- Run complete production acceptance testing for all three roles.

## Guest marketplace

### Done

- Guest account creation and sign-in with Clerk.
- Accommodation search with dates, guests, children, and room quantities.
- Search only returns approved organisations and published properties.
- Availability checks account for physical room inventory and existing reservations.
- Property detail pages with images, amenities, rooms, prices, rules, policies, and location.
- Stay-request submission.
- Personal booking list.
- Guest booking cancellation.
- Saved-property interface.
- Responsive desktop and mobile presentation.

### Remaining

- Connect stay requests to Stripe Checkout.
- Add temporary booking holds while checkout is open.
- Add successful-payment and failed-payment screens.
- Generate booking confirmations, invoices, and receipts.
- Add map-based search and map markers.
- Add more search filters, sorting, and cursor pagination controls.
- Add guest-to-property conversations.
- Add guest reviews after completed stays.
- Add a guest notification centre.
- Connect booking events to email and SMS notifications.

## Hotel-manager portal

### Done

- Manager account onboarding.
- Organisation registration and verification status.
- Verification-document uploads to private object storage.
- Property creation and editing.
- Hotel image upload support.
- Room-category creation.
- Physical room-unit creation.
- Nightly price updates.
- Availability updates by date range.
- Property publication validation.
- Booking request acceptance, decline, check-in, cancellation, and completion.
- Manager workspace with properties, rooms, bookings, guests, messages, and documents.
- Property-level staff roles in PostgreSQL.
- Seasonal rate plans and rate rules in the Node backend.
- Minimum-stay, tax, and service-fee fields in rate plans.
- Housekeeping and maintenance task storage and endpoints.
- Physical room status management.
- Arrivals, departures, occupancy, revenue, ADR, and RevPAR calculations.
- PostgreSQL protection against overlapping active reservations for one physical room.
- Arrivals and departures board.
- Physical room assignment with overlap validation.
- Housekeeping and maintenance work board.
- Room cleaning, occupancy, maintenance, and blocked-status controls.
- Rate-plan and seasonal-pricing editors with minimum stays, taxes, and fees.
- Property staff role-management screen.
- Occupancy, revenue, ADR, and RevPAR dashboard.
- Stripe Connect onboarding and manager financial dashboard.
- Manager payment, commission, refund-request, payout, and dispute visibility.

### Remaining

- Build a richer interactive booking calendar.
- Add emailed staff invitations and fine-grained permission editing.
- Add downloadable PMS and finance report exports.
- Add manager messaging screens.
- Add manager review responses.

## Super-admin portal

### Done

- Super-admin access enforced through Clerk and PostgreSQL roles.
- User, manager, organisation, property, booking, document, and audit-log views.
- User suspension and reactivation.
- Organisation approval, rejection, and requests for more documents.
- Secure verification-document downloads through signed R2 URLs.
- Property moderation and suspension.
- Administrator booking cancellation.
- Platform-wide booking-request switch.
- Protection against suspending a super-admin from the standard control screen.
- Financial dashboard for gross revenue, refunds, commission, net revenue, and payouts.
- Per-property commission percentage, schedule, and reserve controls.
- Refund review, Stripe processing, retry, and failure tracking.
- Eligible-payout generation, Stripe transfer processing, and payout history.
- Stripe dispute visibility with evidence deadlines.

### Remaining

- Add Stripe dispute evidence submission tools.
- Add provider-webhook monitoring.
- Add notification-delivery monitoring and retry controls.
- Add review moderation.
- Add downloadable operational and financial reports.

## Node.js backend and PostgreSQL

### Done

- Dedicated Node.js routes, controllers, authentication, and service modules.
- Asynchronous Prisma repositories for guest, manager, PMS, property, and admin operations.
- Prisma transactions for multi-record writes.
- Serializable reservation creation with live inventory validation.
- Clerk token verification.
- Verified and deduplicated Clerk webhooks.
- Prisma-based administrator bootstrap command.
- PostgreSQL schema and production migration.
- Models for users, organisations, memberships, properties, room categories, physical rooms, inventory, reservations, rate plans, operational tasks, and platform settings.
- Models for payments, refunds, disputes, payouts, commissions, messages, conversations, reviews, notifications, provider events, booking holds, and stored objects.
- Production indexes and cursor-pagination utilities.
- Resumable SQLite-to-PostgreSQL importer.
- Import support for users, organisations, properties, rooms, physical units, inventory, bookings, staff, rates, tasks, settings, payments, and documents.
- PostgreSQL integrity verification command.
- Automated backup workflow and protected restore command.
- Runtime regression test preventing SQLite from being reintroduced.

### Remaining

- Provision the hosted PostgreSQL database.
- Apply the migration to the real database.
- Import the real legacy SQLite data.
- Run `db:verify` against the imported production database.
- Perform and record a real backup-and-restore drill.
- Load-test search, booking inventory, and manager reporting at expected production volume.

## Images and documents

### Done

- Cloudflare R2 adapter for public property images and private documents.
- Image type and size validation.
- PostgreSQL metadata records for R2 property images.
- Private verification-document records with original filenames.
- Short-lived signed administrator download URLs.
- Legacy document migration from SQLite blobs to R2.

### Remaining

- Create the production upload and backup buckets.
- Connect the public media domain.
- Configure bucket lifecycle and retention rules.
- Add private invoice and review-attachment upload flows.

## Payments and commercial operations

### Done

- GBP payment configuration.
- Stripe Checkout and Connect Express service foundation.
- Prisma payment, refund, dispute, payout, payout-item, and commission models.
- Stripe webhook signature verification and PostgreSQL event deduplication.
- Successful Checkout events update payment and reservation records.
- Failed and expired Checkout events update payment state.
- Configurable commission, payout, and cancellation policies.
- Launch defaults: 12% commission, weekly payouts, and a seven-day reserve.
- Configurable full, partial, and no-refund cancellation windows.
- Manager Stripe Connect onboarding.
- Refund requests from booking cancellation and the manager finance screen.
- Administrator Stripe refund processing with webhook reconciliation.
- Configurable commission management per property.
- Reserve-aware payout generation for completed stays.
- Stripe Connect transfers with idempotent per-payment transfer records.
- Account-readiness, refund, and dispute webhook reconciliation.
- Manager and administrator financial dashboards.

### Remaining

- Create Checkout sessions from accepted guest bookings.
- Persist Checkout session details before redirecting the guest.
- Schedule automatic payout generation after the manual workflow is accepted.
- Add Stripe dispute evidence submission and resolution actions.
- Generate invoices and receipts.
- Add downloadable finance exports and payout statements.
- Complete Stripe production approval and live-mode configuration.

## Maps, email, SMS, and notifications

### Done

- Mapbox permanent-geocoding service and protected Node endpoint.
- Resend email adapter.
- Twilio SMS adapter.
- PostgreSQL notification and delivery-attempt models.
- Notification queue, retry handling, and protected worker endpoint.

### Remaining

- Add address autocomplete and a map picker to property editing.
- Add maps to property pages and search results.
- Create production email templates.
- Create production SMS templates.
- Generate notifications from booking, payment, refund, verification, and payout events.
- Schedule the notification worker on the deployed API.
- Configure verified email domains and production SMS sender details.

## Deployment and operations

### Done

- Environment-variable template for every selected provider.
- Proposed guest, manager, admin, API, and media domains.
- Three isolated Vercel build commands.
- PostgreSQL deployment, import, verification, backup, and recovery runbook.
- Guest, manager, and admin production builds pass.
- Prisma validation, TypeScript, ESLint, and automated tests pass.

### Remaining

- Create the three Vercel projects.
- Deploy the long-running Node API.
- Add production environment variables and secrets.
- Configure Clerk and Stripe webhook URLs.
- Configure the notification scheduler.
- Connect and verify production domains.
- Run role-based acceptance testing with real provider test accounts.
- Run the database cutover and retain the legacy snapshot during the rollback period.
- Enable live payments only after every release gate in `PRODUCTION_DEPLOYMENT.md` passes.

## Recommended next order

1. Provision PostgreSQL and R2, deploy migrations, import the real data, and verify it.
2. Complete Stripe Checkout for guests and Stripe Connect onboarding for managers.
3. Add the richer interactive PMS calendar and downloadable operational and finance reports.
4. Add automated payout scheduling and Stripe dispute-evidence controls.
5. Add event-driven email, SMS, and in-app notifications.
6. Add maps, messaging, reviews, and production pagination.
7. Deploy all projects, connect domains, and complete acceptance and recovery testing.
