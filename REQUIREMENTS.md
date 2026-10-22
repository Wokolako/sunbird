# Sun Bird marketplace requirements map

Source: Hotel & Lodge Finder — User Specification, 2 October 2026, 15 pages.

This file maps the supplied requirements to the current Sun Bird repository. It is an implementation guide, not a claim that a requirement has passed acceptance.

## Current state

Sun Bird is currently a Next.js marketing site with six hard-coded properties in `lib/data.ts`. The homepage, hotel and resort pages, and hero search display static data. Google sign-in uses a browser-side mock user. There is no property-manager application, database, inventory, verified organisation workflow, booking engine, payment integration, or review event history. Existing prices and ratings are sample content and must not be treated as live availability or computed guest reviews.

## Delivery order

1. Property Manager Layer and Admin back office: PM-1–PM-30, ROLE-1–ROLE-4, payment backend PAY-1–PAY-8, and calculation/dashboard REV-1–REV-7. Seed and verify property data before publishing guest search.
2. Guest Interface: GU-1–GU-26 and guest-side NFR-1–NFR-11. Search only verified, published properties with coordinates and available inventory.

## Decisions to confirm before payment and search architecture

| ID | Decision | Status |
| --- | --- | --- |
| D1 | Launch country and first city/region | Malawi, nationwide |
| D2 | Who holds guest money | Licensed-provider split payments; provider selection open |
| D3 | Instant booking or request to book | Per-property choice |
| D4 | Manual inventory, iCal sync, or channel manager | Manual calendar at launch |
| D5 | Commission, subscription, or listing fee | Commission per booking; percentage open |

Do not choose a payment provider, tax treatment, data region, payout schedule, or commission percentage without confirmation. The user confirmed the product choices above.

## Traceability

| Requirement group | What to build | Current gap | Acceptance evidence |
| --- | --- | --- | --- |
| ROLE-1–ROLE-4 | Server-enforced guest, owner, staff and admin permissions; per-property grants; audit trail; owner/admin 2FA | Mock browser auth only | Unauthorised API tests fail; every sensitive change has before/after audit entry |
| PM-1–PM-8 | Organisation application, document upload, admin verification, provider KYC, multi-property profiles and publication states | None | New organisation remains hidden until approved; incomplete pin/photo requirements block publication |
| PM-9–PM-18 | Room types, nightly inventory, date-range bulk edits, rate plans, taxes and fees | Static prices only | Phone calendar change in at most three clicks; concurrent last-unit checkout test allows one hold |
| PM-19–PM-26 | Unified inbox, request expiry, private messages, booking state actions, notifications, payment confirmation queue and payout statements | None | API booking reaches every permitted state; sandbox webhook drives payment status and statement |
| PM-27–PM-30, REV-1–REV-7 | Event-derived reviews and response metrics shared between manager and guest views | Hard-coded rating numbers | Dashboard and guest figures equal hand calculations from seeded events |
| GU-1–GU-11 | Geocoded place/near-me/map search, availability-fit results, radius expansion, list/map, filters, sort and complete cards | Decorative hero search and static cards | Correct available, verified results; list and map use same result set |
| GU-12–GU-15 | Property gallery, policies, available rooms and rates, reviews, enquiry | No property detail route | Selected dates show valid totals; enquiry starts response clock |
| GU-16–GU-26 | Four-screen checkout, verified guest contact, visible hold, confirmations, account, cancellation, receipts and eligible reviews | None | Instant and request bookings complete on a phone; cancellation and review rules enforced server-side |
| PAY-1–PAY-8 | Licensed provider integration, webhook verification, idempotency, holds/refunds, payouts, disputes and reconciliation | None | Browser return cannot mark payment paid; replayed requests do not double-charge |
| NFR-1–NFR-11 | Mobile, speed, bandwidth, uptime, security, privacy, localisation, accessibility, backups, monitoring and handover | No measured acceptance evidence | 500-property load test; WCAG 2.1 AA audit; restore drill; operational alerts |

## Implementation sequence

1. Confirm D1–D5 and identify the client's payment, maps, notification and hosting accounts.
2. Define the shared database and migration path for Organisation, User, Membership, Property, RoomType, Availability, RatePlan/Rate, Enquiry/Message, Booking, Payment, Payout and Review/Reply. Add event timestamps and an append-only audit log.
3. Implement server authentication and role checks. Build owner registration, documents, admin verification and publication gates.
4. Add room inventory, rates and the mobile manager calendar. Use transactional holds with a 15-minute expiry and a database constraint or lock to prevent overbooking.
5. Implement booking states, inbox, notifications, licensed payment-provider webhooks, refund/payout records and daily reconciliation.
6. Calculate reviews and responsiveness from logged events. Feed the same values to the manager and guest APIs.
7. Replace static guest content with verified API results, geocoding, map, property pages and the four-screen booking flow.
8. Run the specification's Delivery 1 and Delivery 2 acceptance tests, then launch only after the NFR checks pass.

## UI guardrails during transition

- Label any static catalogue as a preview. Never call sample room counts or prices “live”.
- Do not show a “Verified” badge, review count, response time, tax-inclusive total, or payment state unless the backend can prove it.
- Do not expose checkout until transactional holds, verified payment webhooks and policy-based refunds are working.
- Do not treat the current mock Google profile as production authentication.

## Vabbot Resorts frontend delivery — 22 October 2026

Both supplied documents were applied: the Marketplace & PMS project scope, and the numbered Hotel & Lodge Finder specification. Where the two differ, the detailed numbered specification remains the guide for future production behavior. This delivery implements frontend screens and explicitly labelled sample interactions; it does not establish backend acceptance.

| Surface | Delivered frontend | Production dependency |
| --- | --- | --- |
| Discovery (GU-1–11) | Destination autocomplete; date inputs; adults, children, ages and rooms; device-location permission; price/type/rating/amenity/cancellation/instant/accessibility filters; sorting; sample list/map parity | Geocoding, live map SDK, availability search, geospatial radius expansion |
| Property (GU-12–15) | Gallery, room choices, capacity, rate plans, amenities, rules, cancellation policy, review categories, responsiveness and enquiry preview | Verified catalogue, actual reviews and live message delivery |
| Booking (GU-16–20) | Four steps, guest details validation, sample rate and tax breakdown, 15-minute preview timer, instant/request confirmation previews | OTP, transactional inventory hold, licensed payments, verified webhooks and notifications |
| Guest account (GU-21–26) | Local upcoming/past/cancelled previews, policy cancellation preview, text receipt download, saved stays, local data deletion | Authenticated account, server cancellation/refund enforcement, PDF invoices, completed-stay review eligibility |
| Manager operations (PM-9–30 and scope B) | Sample occupancy, arrivals/departures, room status board, date cells, bulk date closure, accept/decline and check-in/out, inbox reply preview, payment confirmation queue, sample CSV, rate settings and review reply preview | Shared reservations/room units, durable rates, staff roles, actual payouts and computed review metrics |
| Organisation & Admin (PM-1–8) | Existing live registration, verification documents, property/room configuration, availability and protected admin verification retained and rebranded | Provider KYC, production storage and final publication checks |

The frontend catalogue is isolated in `lib/stays.ts`. It contains synthetic properties with illustrative stock photography. It is not automatically published into the existing property database. The sample manager workspace at `/workspace` is separate from protected live onboarding at `/manager`.

Not implemented in this frontend pass: drag-and-drop room reassignment, live paid checkout, guest OTP/auth, PDF statements, authenticated guest reviews, actual staff access controls, real map dragging/radius expansion, live notifications, commission/dispute/reconciliation tools. These remain requirements for the corresponding integration phase.

## Portal separation — 22 October 2026

The application supports two independently deployed Vercel projects from one source tree: guest (`APP_PORTAL=guest`, local port 3000), management (`APP_PORTAL=management`, local port 3001). Owners sign in at the management root; platform admins use its `/admin` page. Server role checks remain required and the existing API checks remain in place. Public portal URLs are configurable with `NEXT_PUBLIC_GUEST_URL` and `NEXT_PUBLIC_MANAGEMENT_URL`. This change prepares source routing and local servers, and does not provision Vercel projects, domains or persistent production storage.

## Three isolated role portals — 22 October 2026

This section supersedes the earlier two-portal navigation design. The guest portal is port 3000, the hotel-manager portal is port 3001, and the super-admin portal is port 3002. They have separate session cookies, allowlisted routes and server API permissions, with no navigation links or cross-portal redirects. Platform records are necessarily shared so managers can serve guests and the super admin can oversee the system.

Guest registration and login are now real, server-backed actions. Guest saved-property keys are scoped to their user ID. Guest search and detail pages read verified, published database properties. Stay requests are owned by their guest, visible only to the corresponding manager and super admin, and cannot be submitted by an anonymous visitor. The retired illustrative catalogue and sample booking workflow are no longer the guest data source.

Managers can publish complete properties after organisation verification, see only their own listing and guest-request counts, edit nightly rates, pause listings and act on guest requests. Acceptance checks inventory per night in a write transaction. These requests collect no online payment, so licensed-provider payout onboarding is no longer a gate for publishing a request-only listing. Paid checkout remains outside the implemented flow.

Super admins can inspect all managers, guest accounts, organisations, properties and stay requests; verify applications; suspend or restore manager/guest accounts; pause listings; cancel pending/confirmed requests; review recent audit history; and pause or reopen new requests platform-wide. Admin signup is not public. Existing admin bootstrap remains required to provision the first account.

Three independent Vercel projects are supported via APP_PORTAL. The local shared SQLite store must be migrated to an appropriate shared persistent production database before live deployment. This change does not claim payment, notification, geocoding, production storage or automated refund integration.
