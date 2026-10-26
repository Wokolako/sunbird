# Vabbot Resorts frontend status

This document describes what the website interface does today. It separates the active Vabbot portals from prototype pages that were merged from `frontend_changes` but are not available in the active deployments.

## Portal addresses

| User | Local address | Purpose |
| --- | --- | --- |
| Guest | `http://localhost:3000` | Find and request accommodation. |
| Hotel manager | `http://localhost:3001` | Register an organisation and manage hotel listings. |
| Super admin | `http://localhost:3002` | Verify managers and control the platform. |

Each portal has its own allowed pages and navigation. Guests are not shown management controls, managers are not shown admin controls, and the sites do not link users into another portal.

## Guest website

The guest frontend provides a travel marketplace for hotels, lodges, guesthouses, and short-term lets.

### Available now

- Guest account registration and sign-in through the current local portal flow.
- Search by destination, dates, adults, children, and room count.
- Search results limited to approved, published properties with location and matching room availability.
- Filters for property type, price, amenities, instant booking, accessibility, and cancellation.
- Property pages with gallery, amenities, room types, rates, policies, and stay-request controls.
- Saved properties and guest booking history.
- Request-to-book stays and guest cancellation of pending or confirmed requests.

### Still being connected

- Clerk sign-in and account recovery.
- Live Stripe Checkout, deposits, receipts, refunds, and payment status.
- Map/geocoding provider, distance search, and real map interaction.
- Guest OTP verification, notifications, completed-stay reviews, and downloadable invoices.

## Hotel manager website

The manager frontend is the active operating workspace for accommodation owners.

### Available now

- Organisation registration with business details.
- Upload verification documents: business registration, proof of address, owner ID, and accommodation licence.
- View approval status and the administrator’s verification note.
- Create a hotel, lodge, guesthouse, or short-term-let draft.
- Edit property description, address, latitude/longitude, amenities, check-in/out times, house rules, cancellation policy, booking mode, and images.
- Add room types with capacity, beds, unit quantity, size, and GBP base nightly price.
- Update room availability for a date range and close dates when required.
- Publish, pause, or return a property to draft after it meets verification and content checks.
- View booking requests; accept, decline, check in, check out, or cancel where permitted.
- View basic operational numbers: listings, published listings, current guests, and pending requests.

### Next manager frontend work

- Replace the image-URL text box with image upload, preview, reorder, and remove controls.
- Add an operations dashboard for arrivals, departures, physical room units, check-in assignment, room status, housekeeping, and maintenance.
- Add a visual calendar for availability, seasonal price rules, minimum stays, taxes, and fees.
- Add staff management for manager, front desk, and housekeeper roles.
- Add reports for occupancy, revenue, ADR, and RevPAR.
- Add inbox replies, notifications, payout status, payment confirmations, and statements.

## Super-admin website

The administrator frontend is the active global-control workspace.

### Available now

- View manager accounts, guest accounts, organisations, properties, stay requests, documents, platform settings, and recent audit events.
- Approve, reject, or request more organisation documents.
- Download submitted verification documents.
- Suspend and restore manager and guest accounts.
- Pause property listings or return them to draft.
- Cancel pending or confirmed stay requests.
- Pause or reopen new stay requests across the marketplace.

### Next admin frontend work

- Add a dedicated review queue for listing quality, fraud, and support cases.
- Add organisation/user role management and staff-per-property visibility.
- Add PMS reports across all properties: revenue, occupancy, ADR, RevPAR, cancellations, and response times.
- Add Stripe finance controls: commissions, refunds, disputes, payouts, and reconciliation.
- Add notification templates, support workflows, privacy requests, audit export, and monitoring views.

## Dedicated Node.js backend connection

The repository now contains a separate Node.js backend in `backend/`.

It currently provides:

- Clerk session-token verification for protected PMS endpoints.
- Signed Clerk webhooks that synchronise user records to SQLite.
- Property/hotel draft creation, property updates, local image uploads, and publication validation.
- Physical room units, room status changes, staff memberships, rate plans, quotes, operational data, and PMS reports.

The active frontend still calls `/api/platform`. The next integration step is a small portal API client that obtains a Clerk token, calls the Node backend, and replaces the corresponding manager screens one section at a time.

## Prototype pages from `frontend_changes`

The repository also contains routes such as `/dashboard`, `/api/owner/*`, and `/api/admin/*`. They are prototype frontend pages from the merged branch. They use a separate Prisma/NextAuth model and are currently blocked by the three-portal routing rules.

They are useful design references but should not be connected to the live portal until their data model and authentication are replaced with the dedicated Node backend and Clerk.

## Production requirements before launch

- Add the Clerk keys, Clerk webhook signing secret, and Clerk token settings to each deployment.
- Replace local SQLite with a shared hosted database and move images/documents to object storage.
- Deploy the Node backend as its own service and configure portal API URLs.
- Complete Stripe Checkout, Connect payouts, refund/dispute workflows, and reconciliation.
- Run accessibility, mobile, security, backup/restore, and load acceptance checks.
