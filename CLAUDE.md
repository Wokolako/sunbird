# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Hotel & Lodge Marketplace with an integrated Property Management System (PMS).**
A dual-sided web platform:

- **Guests** search, book, pay for accommodation and manage their bookings.
- **Properties** (hotels/lodges) register, manage rooms, track occupancy, use a tape-chart calendar, and process reservations.
- **Platform Admins** approve properties, manage commissions, handle refunds/disputes/payouts, and monitor KPIs.

The original scope document should live at `PROJECT_SCOPE.md`. Treat it as the source of truth and re-read it when a requirement is unclear.

## Stack

- Next.js (App Router) + TypeScript (strict)
- PostgreSQL + Prisma (raw SQL migrations where Prisma cannot express a constraint)
- Tailwind CSS, shared UI component library in `components/ui`
- Zod for all input validation
- Auth.js (NextAuth) for authentication
- Vitest/Jest for unit tests, Playwright for end-to-end tests

> To change the stack, edit this section first, then proceed.

## Roles and route groups

| Role                                    | Area                         | Route group                                      |
| --------------------------------------- | ---------------------------- | ------------------------------------------------ |
| GUEST                                   | Public marketplace + account | `/`, `/search`, `/properties/[id]`, `/account/*` |
| OWNER, MANAGER, FRONT_DESK, HOUSEKEEPER | PMS                          | `/dashboard/*`                                   |
| ADMIN                                   | Platform admin               | `/admin/*`                                       |

Each group has its own layout. Route protection lives in middleware **and** is re-checked server-side in every action/handler. Never rely on UI hiding alone.

## Commands

Update this list if scripts change.

```bash
npm install
npm run dev            # start dev server
npm run build          # production build
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run test           # unit + integration tests
npm run test:e2e       # Playwright
npx prisma migrate dev # create/apply migrations
npx prisma db seed     # seed sample data
```

## Non-negotiable rules

1. **Zero double-bookings.** Overlap prevention is enforced at the database level with a PostgreSQL exclusion constraint (`btree_gist`, range on `room_unit_id` + stay range) covering non-cancelled reservations and date blocks. Application logic (transactions, row/advisory locks, short-lived payment holds) is an additional layer, never a replacement. Any code that writes reservations or blocks must go through the availability service.
2. **Authorization on every route and server action.** Check role _and_ property membership (a staff member may only touch their own property's data).
3. **Validate all input with Zod** at every boundary (forms, API routes, webhooks).
4. **Itemized pricing everywhere.** Guests always see base price + taxes + service fees. All price math lives in one module; never compute prices in UI components.
5. **Money** is stored as integer minor units with a currency code. Never use floats for money.
6. **Dates/times** are stored in UTC; display in the property's timezone. Stay ranges are half-open `[check-in, check-out)`.
7. **Payments** go through a `PaymentProvider` interface (one real provider + a mock for dev). Webhooks must verify signatures and be idempotent.
8. **External services are abstracted** behind interfaces with dev mocks: SMS/OTP, email, file storage, payments.
9. **Never commit secrets.** Use `.env` (git-ignored) and keep `.env.example` current.
10. **Protect PII.** Do not log guest personal data, ID details, or payment info.

## Architecture conventions

- Business logic lives in `src/server/services/*` (framework-agnostic, unit-testable). Route handlers and server actions stay thin.
- Availability and booking logic is a standalone module: `src/server/services/availability`.
- Data access through Prisma in `src/server/db`; use raw SQL only for the exclusion constraint and complex reporting queries.
- Shared types and Zod schemas in `src/lib/schemas`.
- UI: server components by default; client components only for interactivity. Every data view needs loading, empty, and error states.
- Responsive, accessible (keyboard navigation, labels, contrast) by default.
- Prefer small, focused commits with clear messages.

## Domain reference

**Statuses**

- Property: `PENDING | APPROVED | SUSPENDED` (only `APPROVED` appears publicly)
- Reservation: `UPCOMING | CHECKED_IN | CHECKED_OUT | CANCELLED`; source: `ONLINE | WALK_IN | PHONE`
- Room unit: `VACANT_CLEAN | VACANT_DIRTY | OCCUPIED | MAINTENANCE`

**Core entities:** User, GuestProfile, Property, PropertyStaff, Amenity, PropertyAmenity, PropertyPhoto, RoomCategory, RoomUnit, Reservation, ReservationAddOn, Payment, Invoice/Receipt, RateRule, DateBlock, Review, Message, CommissionSetting, Payout.

**Workflow rules**

- Check-out sets the room to `VACANT_DIRTY`.
- Check-in requires an assigned, clean room.
- Reviews are allowed only for `CHECKED_OUT` reservations.
- Cancellation/modification refunds are computed from the property's cancellation policy, and the refund amount is shown before confirmation.

**KPIs**

- Occupancy Rate = occupied room-nights / available room-nights
- ADR = room revenue / occupied room-nights
- RevPAR = room revenue / available room-nights (= Occupancy x ADR)

## Success criteria

1. Zero double-bookings: concurrency tests prove exactly one of N simultaneous bookings succeeds.
2. Daily check-in/check-out and move-out review take 3 clicks or fewer.
3. Guests see an itemized cost breakdown for every past and future booking.

## Roadmap and task list

Work through tasks **in order**. Finish and verify one before starting the next. Check items off as they are completed.

### Phase 1: MVP

- [ ] **0. Setup:** Next.js app, folder structure, ESLint/Prettier, `.env.example`, seed script skeleton, role-based middleware, shared UI library, README with run instructions. No features yet.
- [ ] **1. Database schema:** full Prisma schema for all entities above, initial migration, exclusion constraint for no-overlap (reservations + date blocks), indexes for search and availability, seed data with sample properties, rooms, and a user for every role.
- [ ] **2. Auth and profiles:** email+password, phone OTP (pluggable SMS provider + mock), Google/Facebook login; separate guest and property-owner registration; guest profile page (info, contacts, payment preferences, stay history placeholder); RBAC and sessions; tests for auth and role guards.
- [ ] **3. Property onboarding:** business details + tax ID form (creates `PENDING` property); profile builder (photos via storage abstraction, policies, amenities); room categories and physical units; staff invites with Manager/Front Desk/Housekeeper permissions enforced server-side; tests for permissions.
- [ ] **4. Availability engine (no UI):** `getAvailability`, itemized price calculation (base + weekday/weekend + seasonal + taxes + fees), min-stay/restriction/date-block rules, `createReservation` with transaction + locking + ~10 min payment hold; unit tests plus a concurrency test.
- [ ] **5. Guest search and property pages:** search (location, dates, guests), filters (price, room type, amenities, stars, Hotel vs Lodge), sorting, only approved properties with real availability, property page (gallery, amenities, map, policies, reviews, room types with live prices); SSR, pagination, image optimization.
- [ ] **6. Booking flow and payments:** room -> guest info -> add-ons -> itemized total -> payment; `PaymentProvider` (card, mobile money, wallets; deposit or full); idempotent signed webhooks; on success confirm, reference code, PDF receipt, queued confirmation email; on failure/expiry release the hold; tests for webhooks and state transitions.
- [ ] **7. Guest "My Bookings":** active/upcoming cards (address, map link, dates, check-in instructions); cancel/modify per policy with refund preview; history with itemized costs and PDF invoices; post-checkout reviews; per-booking messaging (polling).
- [ ] **8. PMS dashboard and room status board:** summary cards (total rooms, occupied/vacant tonight, arrivals, departures, out-of-service, occupancy %); daily movement feed; per-unit status board with permitted status changes; near-real-time updates (SSE or short polling).
- [ ] **9. Tape chart calendar:** rooms x dates grid (day/week/month), reservation bars, drag-and-drop reassign, drag-resize extend/shorten with optimistic UI and rollback on server rejection, click-to-create walk-in/phone booking, date blocking; performant for 100+ rooms.
- [ ] **10. Reservation management:** master table (search/filter/sort/paginate by status), detail panel (contact, payment breakdown, requests, ID verification), one-click check-in/out (3 clicks or fewer), guest profiles with stay ledger and notes.
- [ ] **11. Rates and financial reports:** weekday/weekend and seasonal rates, min-stay/restrictions, date blocks feeding the pricing engine; revenue, payouts, pending collections; Occupancy/ADR/RevPAR with date filters; CSV/PDF export; occupancy, revenue, and check-in/out reports; unit tests for KPI formulas.
- [ ] **12. Platform admin:** approval queue with reasons; listing enable/suspend/audit with audit log; global bookings; commission config and calculation; refunds and disputes; payout schedules; analytics (GBV, active properties, aggregate occupancy, guest accounts); taxonomy settings (amenities, destination categories, payment config).
- [ ] **13. Hardening and MVP release check:** verify the three success criteria; end-to-end tests for search -> book -> pay -> confirm -> check-in -> check-out -> review; security review (authz on every route, rate limiting, validation, PII handling); accessibility pass; error monitoring; deployment guide; report what is done and what remains.

### Phase 2: Post-MVP (only after the MVP is stable)

- [ ] **14. Housekeeping module:** auto-create cleaning tasks on check-out, manager assignment view, mobile-friendly housekeeper task list that sets rooms to `VACANT_CLEAN`.
- [ ] **15. Channel manager:** iCal import/export per room first, then an OTA API adapter interface; imported bookings block availability and pass through the same overbooking guard.
- [ ] **16. Advanced pricing:** demand-based surge rules, promo codes, package rates, integrated with existing price calculation and fully itemized.
- [ ] **17. Live chat and loyalty:** real-time guest/front-desk chat (WebSockets/SSE), loyalty points earned per stay and redeemable at booking, expanded reviews.

## Working agreement

- Before starting a task, restate the plan briefly and note any assumptions.
- If a task is too large for one session, split it into smaller steps and commit after each.
- After each task: run `npm run lint`, `npm run typecheck`, and `npm run test`; fix failures; then summarize what was built and anything left undone.
- Do not start features from a later task early. If a dependency is missing, say so and propose how to proceed.
- When a requirement is ambiguous, check `PROJECT_SCOPE.md`, then make a reasonable assumption and document it in the summary rather than blocking.
- Keep this file updated: tick completed tasks and record new commands or conventions.
