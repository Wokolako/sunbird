# Vabbot Resorts

Three separate role-specific web portals use one platform data store. There are no navigation links or redirects between portals. Each portal rejects the other roles' pages and API operations and reads its own session cookie.

## Local development

Use Node.js 22.13 or newer. Install with `npm install`, then run these in separate terminals from the project directory:

```sh
npm run dev:guest
npm run dev:manage
npm run dev:admin
```

| Portal | Address | Purpose |
| --- | --- | --- |
| Guest | http://localhost:3000 | Create a guest account, find hotels/lodges/houses, save stays and manage personal stay requests |
| Hotel manager | http://localhost:3001 | Manage assigned properties, rooms, rates, operations, staff, reservations, reports, refunds and payouts |
| Super admin | http://localhost:3002 | Control users and listings, verify organisations, configure commissions, process refunds and payouts, and monitor platform finances |

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Accounts and access

Guest accounts register at `/account` on the guest portal. Manager accounts register at the manager portal's root. An administrator must approve the organisation's submitted verification documents before its manager can publish a complete listing. No public super-admin registration exists.

Create the first super-admin record with the same email used by its Clerk account:

```sh
$env:ADMIN_EMAIL="admin@example.com"
npm run admin:create
```

The backend links the Clerk identity by verified email on first sign-in. No local administrator password or public administrator registration is created.

Clerk owns sign-in and session management. The Node API resolves each Clerk identity to a server-side platform role. A portal cannot use that session to perform another role's protected operations. Suspended users remain suspended when Clerk synchronizes their profile, managers cannot access other organisations' records, and the public control panel cannot suspend super-admin accounts.

## Current functionality

Published guest results come from the property database, not the retired sample catalogue. The manager must supply property details, five photos, a map location, house rules, a cancellation policy and at least one priced room type before publication. Organisation approval is required. Ratings are not invented: listings without real reviews show New.

Guests must sign in to save properties, view personal requests or submit a stay request. Requests are stored on the server and can be accepted or declined by the owning manager. Confirmation checks every night's available units inside a serializable PostgreSQL transaction. Check-in and completion actions update manager guest counts. Guest and manager request changes are recorded in the audit log.

Stay requests currently remain request-only in the guest interface. The payment backend includes Stripe Checkout and Connect services, cancellation calculations, refund processing, commissions, reserve-aware payouts, per-payment transfers, dispute records, and idempotent webhook reconciliation. Manager and administrator finance screens are complete. Keep live payments disabled until guest Checkout is connected, Stripe approves the platform, connected-account countries are confirmed, and the release gates in `PRODUCTION_DEPLOYMENT.md` pass.

The manager PMS includes arrivals and departures, physical room assignment with overlap protection, room cleaning and maintenance states, operational tasks, property staff roles, rate plans, seasonal pricing, minimum stays, taxes, service fees, and 30-day occupancy, revenue, ADR and RevPAR reports. Assigned staff only receive the properties granted to their account.

See [documentation.md](documentation.md) for the complete implementation status. [FINANCE_AND_PMS.md](FINANCE_AND_PMS.md) explains workflows, role permissions, API actions and provider setup, while [FEATURES.md](FEATURES.md) provides the detailed feature record.

The old sample PMS and preview booking components remain as unused reference code. `/workspace` is inaccessible in every portal. Archived dining/conference/offer pages are also inaccessible. The guest website has no posting, management or administration entry points.

## Build and run

```sh
npm run build
npm run build:manage
npm run build:admin
```

Start the built portals in three terminals with `npm start`, `npm run start:manage` and `npm run start:admin`. Generated outputs use `.next`, `.next-management` and `.next-admin` respectively.

## Vercel

Create three Vercel projects from this repository, using the directory containing this package.json as the root and `npm run build` as the build command. Set `APP_PORTAL` to `guest`, `management` or `admin` in the corresponding project. Portal routes remain isolated rather than redirecting across projects.

Local development and production both require PostgreSQL through Prisma. SQLite is supported only as the read-only source for the one-time migration importer. Follow [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) to provision credentials, import legacy records and blobs, verify the target, and switch traffic.

## Verification

The automated suite checks authentication guards, inventory and PMS calculations, production policies, Stripe persistence, and that runtime code cannot reintroduce SQLite. Run it with `npm test`.

## frontend_changes integration (25 October 2026)

The merged branch supplied the first Prisma model and prototype dashboards. The production schema now includes organisations, memberships, inventory, holds, payments, payouts, refunds, disputes, conversations, notifications, reviews, storage metadata, pagination indexes, and physical-room overlap protection. Prototype NextAuth and dashboard routes remain blocked; Clerk is the active authentication provider.

Run `npm run typecheck`, `npm run lint` and `npm test` before building. A real PostgreSQL cutover and external provider activation require the private credentials listed in `.env.example`.
