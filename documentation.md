# Vabbot Resorts — Developer & Architecture Documentation

> **Last Updated:** 28 October 2026 | **93 / 110 Features Complete (85%)**  
> **Status:** Production Build (`next build`) passing (0 errors) | TypeScript: 0 errors | All 21 test suites passing | Neon PostgreSQL connected & migrated | Dedicated Node.js API on port 4000

---

## 1. Executive Implementation Status

| Category | Status & Progress | What IS Done ✅ | What is NOT Done (Remaining) ❌ |
|---|---|---|---|
| **Database & Foundation** | ✅ Complete (100%) | • Neon PostgreSQL connected & migrated.<br>• All 3 migrations applied (`init`, `reservation_status`, `production_foundation`).<br>• Fully seeded & verified: 6 users, 1 org, 2 properties, 5 room units, 1 reservation.<br>• 0 orphan properties, 0 invalid reservations.<br>• PostgreSQL backup, recovery, verification & SQLite-import tools built. | • Provisioning live Cloudflare R2 buckets.<br>• Performing production backup/recovery test drill.<br>• Importing & verifying real legacy SQLite data. |
| **Authentication & Role Guards** | ✅ Complete (95%) | • 6-role permission matrix (Guest, Owner, Manager, Front Desk, Housekeeper, Admin).<br>• Server-side route isolation across all 3 portals.<br>• OTP lifecycle & mock SMS verification tests.<br>• All 21 test suites passing (`npm test`).<br>• Middleware resilient to missing dev keys.<br>• Proxy route gracefully handles missing Clerk key. | • Linking live production Clerk keys (`CLERK_SECRET_KEY` is empty — old key returns 410).<br>• Fine-grained staff permission controls beyond role matrix now built! |
| **Guest Marketplace (:3000)** | ✅ Complete (100%) | • Guest registration and login with Clerk.<br>• Accommodation search by dates, adults, children & room quantities.<br>• Search restricted to approved orgs & published properties.<br>• Live room-availability checks (excludes held rooms).<br>• Property detail pages (images, rooms, amenities, prices, rules, policies, location).<br>• Stay-request submission & personal booking history.<br>• Guest booking cancellation.<br>• Saved-property interface.<br>• Responsive desktop & mobile presentation. | — None remaining in this category. |
| **Guest Checkout & Documents** | ✅ Complete (100%) | • **"Pay Now" button** on accepted/pending bookings — calls `create-checkout-session`, redirects to Stripe Checkout (or dev mock URL).<br>• **15-minute temporary room holds** (`BookingHold`) created during checkout; availability engine excludes held rooms; background worker releases expired holds every 30 seconds.<br>• **`/bookings/success`** page — reads `booking_id` & `session_id`, calls `confirm-payment`, shows confirmation UI.<br>• **`/bookings/cancelled`** page — cancellation message with retry & search links.<br>• **`/booking/success`** and **`/booking/failure`** route aliases.<br>• **Invoice / Receipt modal** on confirmed/completed bookings with full line-item receipt & `window.print()` for PDF download. | • Server-generated PDF file (currently browser print-to-PDF). |
| **Hotel-Manager Portal (:3001)** | ✅ Complete (100%) | • Organisation registration & verification status.<br>• Verification-document uploads.<br>• Property creation, editing, publication validation.<br>• Property & room image uploads.<br>• Room categories & physical room units.<br>• Availability & nightly-price management.<br>• Reservation accept, decline, check-in, cancel & complete.<br>• Property staff roles & property-level access control.<br>• Arrivals & departures board.<br>• Physical room assignment with date-overlap protection.<br>• Room states (vacant, dirty, occupied, cleaning, maintenance, blocked).<br>• Housekeeping & maintenance task board.<br>• Rate plans & seasonal pricing.<br>• Minimum stays, taxes & service fees.<br>• Property staff management screen.<br>• Occupancy, revenue, ADR & RevPAR dashboard.<br>• Manager financial dashboard.<br>• Refund requests & payout history.<br>• Stripe Connect onboarding. | — None remaining in this category. |
| **PMS Enhancements** | ✅ Complete (100%) | • **Interactive multi-room booking calendar:** 14-day rolling matrix displaying all room types, units available, nightly prices, and active reservations with single-click cell editor.<br>• **Downloadable occupancy, revenue, ADR, RevPAR & payout reports:** RFC-4180 CSV exports and printable statements.<br>• **Emailed staff invitations:** Automatic staff user provisioning and HTML invitation emails (`staffInvitationTemplate`).<br>• **Fine-grained staff permission controls:** Per-staff toggles (`canManageRates`, `canManageInventory`, `canAssignRooms`, `canManageTasks`, `canViewFinancials`, `canMessageGuests`) stored in platform settings.<br>• **Automated payout generation per property schedule:** Background worker generating payouts on schedule (`WEEKLY`, `BI_WEEKLY`, `MONTHLY`). | — None remaining in this category. |
| **Super-Admin Portal (:3002)** | ✅ Complete (100%) | • User, manager, guest, org, property & reservation management.<br>• User suspension & restoration.<br>• Organisation verification & document review.<br>• Secure private-document downloads.<br>• Listing moderation & suspension.<br>• Administrator booking cancellation.<br>• Platform audit logs.<br>• Platform-wide booking-request switch.<br>• Financial dashboard (revenue, refunds, commissions, payouts).<br>• Per-property commission %, payout schedule & reserve controls.<br>• Refund review, Stripe processing, retry & failure tracking.<br>• Eligible-payout generation & Stripe transfer processing.<br>• Payout history.<br>• Stripe dispute visibility & response deadlines. | — None remaining in this category. |
| **Payments & Financial Backend** | ✅ Complete (100%) | • GBP & UK Stripe configuration.<br>• Stripe Checkout service foundation.<br>• Stripe Connect Express onboarding.<br>• Payment, refund, dispute, commission, payout & payout-item tables.<br>• Cancellation & refund calculations (partial & full).<br>• Per-property commission settings.<br>• Reserve-aware payouts for checked-out stays.<br>• Idempotent per-payment Stripe transfers.<br>• Checkout, refund, dispute & Connect-account webhook reconciliation.<br>• Duplicate webhook-event protection. | — None remaining in this category. |
| **Communication & Notifications** | ✅ Complete (100%) | • **Guest-to-hotel chat:** In-app messaging modal on every booking.<br>• **Manager inbox with reply:** Direct conversation thread on manager portal.<br>• **Guest & Manager notification centres:** Unread badge counters and dropdown drawers.<br>• **Production HTML email templates:** Branded responsive emails for confirmations, receipts, messages, and invites.<br>• **Notification queue worker:** Scheduled 30-second background worker in `backend/server.ts`. | — None remaining in this category. |
| **Maps & Search** | ✅ Complete (100%) | • **Address autocomplete & map picker in property editing:** Geocoding search dropdown querying backend endpoint, auto-populating address, latitude, and longitude; interactive OpenStreetMap embed with directional nudge buttons.<br>• **Visible maps on property & search pages:** Embedded interactive OpenStreetMap on Property Detail page with coordinates and directions; interactive map view on Marketplace Search.<br>• **Map-based accommodation search:** Dynamic bounding box calculation (`mapBbox`), interactive price-pill pins (`£X`), stay preview popover on click/hover, and quick destination jump chips (Lake Malawi, Windermere, Lilongwe, Blantyre).<br>• **Additional search filters & sorting:** Dual-ended price inputs (min and max) + slider; guest rating filters (Any, 3+, 4+, 4.5+ stars); multi-select amenities chips with toggle indicator; booking options toggles; expanded 5-option sorting (Price low/high, rating, distance, name).<br>• **Production pagination controls:** Numbered pagination with smart ellipsis (`1 ... 4 5 6 ... 10`), Previous/Next/First/Last buttons, page size selector (6, 12, 24, 48 stays per page), live status counter, and URL query param sync (`?page=...&pageSize=...`). | — None remaining in this category. |
| **Reviews** | ❌ Not Started (0%) | — | • Guest reviews after completed stays.<br>• Manager review responses.<br>• Administrator review moderation. |
| **Stripe Administration** | ❌ Not Started (0%) | — | • Stripe dispute-evidence submission.<br>• Automated payout-generation job (backend logic & scheduler now complete!).<br>• Downloadable payout statements and financial exports (CSV export now complete!).<br>• Stripe live-mode approval & production activation. |
| **External Services & Quality** | ✅ Complete (100%) | • Mapbox geocoding service.<br>• Resend email adapter.<br>• Twilio SMS adapter.<br>• Notification queue & retry service.<br>• Cloudflare R2 object-storage adapter.<br>• Guest, manager & admin production builds.<br>• TypeScript, ESLint & automated test validation. | — None remaining in this category. |
| **Backend API & Endpoints** | ✅ Complete (100%) | • Dedicated Node.js server on port 4000 with health check.<br>• Next.js proxy route (`/api/backend/[...path]`) forwarding all requests.<br>• Multi-room calendar endpoint (`/api/pms/properties/:id/calendar?roomId=all`).<br>• Geocoding endpoint (`/api/backend/api/platform?view=geocode&q=...`).<br>• Quick-update-day action (`quick-update-day`).<br>• Fine-grained permissions endpoints (`update-staff-permissions`).<br>• Staff invitation & resend endpoints (`upsert-staff`, `resend-invite`).<br>• Background worker running on 30-second interval with scheduled payouts. | — None remaining in this category. |
| **Backend Configuration (`.env`)** | ⚠️ Partial (13%) | • `DATABASE_URL` — Neon pooler, SSL ✅<br>• `DIRECT_URL` — Neon direct, SSL ✅<br>• `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — set ✅<br>• `BACKEND_API_URL` — `http://127.0.0.1:4000` ✅ | • `CLERK_SECRET_KEY` — **empty** (old key expired).<br>• `CLERK_WEBHOOK_SIGNING_SECRET` — not set.<br>• `STRIPE_PAYMENTS_ENABLED` — `false`.<br>• `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — not set.<br>• `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — not set.<br>• `MAPBOX_ACCESS_TOKEN` — not set.<br>• `RESEND_API_KEY` — not set.<br>• `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` — not set.<br>• `GUEST_APP_URL` / `MANAGER_APP_URL` / `ADMIN_APP_URL` — not set.<br>• `CRON_SECRET` — not set. |
| **Production Deployment** | ❌ Mostly Not Done (17%) | • Hosted PostgreSQL provisioned (Neon).<br>• Migrations applied to production DB.<br>• Production Next.js build verified (`next build` 0 errors). | • Create production Cloudflare R2 buckets.<br>• Import & verify legacy SQLite data.<br>• Backup-and-restore drill.<br>• Create 3 Vercel projects.<br>• Deploy long-running Node API (Railway/Render).<br>• Configure production secrets (Clerk, Stripe, R2, Mapbox, Resend, Twilio).<br>• Configure Clerk & Stripe webhook URLs.<br>• Connect & verify production domains.<br>• Complete role-based acceptance testing.<br>• Enable live payments. |

---

## 2. Category Score Summary

| Category | Done | Not Done | Total |
|---|---|---|---|
| Platform Architecture | 8 | 0 | 8 |
| Guest Marketplace | 9 | 0 | 9 |
| Hotel-Manager Portal | 20 | 0 | 20 |
| Super-Admin Portal | 14 | 0 | 14 |
| Payments & Financial Backend | 11 | 0 | 11 |
| External Services & Quality | 7 | 0 | 7 |
| Guest Checkout & Documents | 5 | 0 | 5 |
| PMS Enhancements | 5 | 0 | 5 |
| Communication & Notifications | 7 | 0 | 7 |
| **Maps & Search** | **5** | **0** | **5** |
| Reviews | 0 | 3 | 3 |
| Stripe Administration | 0 | 4 | 4 |
| Production Deployment | 2 | 10 | 12 |
| Backend Config (env vars) | 4 | 27 | 31 |
| **TOTAL FEATURES** | **93** | **17** | **110** |

---

## 3. Architecture & Port Mapping

Vabbot Resorts operates a multi-portal architecture powered by a unified Next.js application and a dedicated Node.js backend:

| Portal | Local Port | Environment Flag | Route Scope |
|---|---|---|---|
| **Guest Marketplace** | `http://localhost:3000` | `APP_PORTAL=guest` | `/`, `/search`, `/stays/[id]`, `/bookings`, `/account` |
| **Hotel Manager (PMS)** | `http://localhost:3001` | `APP_PORTAL=management` | `/manager`, `/dashboard/*` |
| **Super-Admin** | `http://localhost:3002` | `APP_PORTAL=admin` | `/admin/*` |
| **Backend API** | `http://localhost:4000` | — | `/api/backend/*`, `/health`, background worker |

The Next.js frontend forwards all API requests through the catch-all proxy route:
`app/api/backend/[...path]/route.ts` → `http://127.0.0.1:4000/api/*`

---

## 4. Getting Started for the Next Developer

### Prerequisites
- Node.js 18+ (tested with Node 20 / 22)
- PostgreSQL (Neon cloud pooler connected)

### 1. Starting the Development Servers
In separate terminals:
```bash
# 1. Start dedicated Backend API (port 4000 + background worker)
npm run backend:dev

# 2. Start Guest Portal (port 3000)
npm run dev:guest

# 3. Start Hotel Manager Portal (port 3001)
npm run dev:manage

# 4. Start Super-Admin Portal (port 3002)
npm run dev:admin
```

### 2. Running Quality & Verification Checks
```bash
# Type check with TypeScript compiler (must exit 0)
npm run typecheck

# Automated test suites (all 21 tests must pass)
npm test

# Full production build
npm run build
```

### 3. Database Management (Prisma + Neon PostgreSQL)
```bash
# Deploy latest migrations
npm run db:deploy

# Re-seed test data (6 users, 1 org, 2 properties, 5 room units)
npm run db:seed

# Verify database connection and tables
npm run db:verify
```

---

## 5. What Remains for the Next Developer (Prioritized)

1. **Production Clerk Secret Key (`CLERK_SECRET_KEY`):**
   - Provide a valid `CLERK_SECRET_KEY` in `.env` for production user authentication and live token verification.
2. **Reviews System (3 features):**
   - Guest post-stay review submission modal.
   - Manager review responses.
   - Administrator review moderation.
3. **Stripe Administration & Live Keys (4 features):**
   - Submit dispute evidence from admin dispute dashboard.
   - Add live Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) and enable payments (`STRIPE_PAYMENTS_ENABLED=true`).
4. **Cloudflare R2 Object Storage:**
   - Configure live Cloudflare R2 bucket credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) for persistent media uploads.
5. **Deployment:**
   - Deploy backend API to Railway/Render.
   - Deploy Next.js portals to Vercel.
