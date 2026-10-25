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
| Hotel manager | http://localhost:3001 | Register an organisation, post and manage only its own listings, set room prices, manage availability and guest requests |
| Super admin | http://localhost:3002 | Review managers, see guest accounts and all listings/requests, suspend accounts, pause listings, inspect audit history and control new requests |

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Accounts and access

Guest accounts register at `/account` on the guest portal. Manager accounts register at the manager portal's root. An administrator must approve the organisation's submitted verification documents before its manager can publish a complete listing. No public super-admin registration exists.

Create the first super-admin account using the existing bootstrap script, with `ADMIN_EMAIL` and `ADMIN_PASSWORD` supplied through your private environment:

```sh
node scripts/create-admin.mjs
```

The password must have at least 12 characters. No default administrator password is included or created by the application.

Guest, manager and super-admin sessions use `vabbot_guest_session`, `vabbot_owner_session` and `vabbot_admin_session`. A cookie from one portal cannot authenticate another role. Suspending an account revokes its sessions; suspended managers' properties stop appearing in search. Managers cannot access other organisations' records. Super-admin account suspension is deliberately excluded from the public control panel to prevent administrative lockout.

## Current functionality

Published guest results come from the property database, not the retired sample catalogue. The manager must supply property details, five photos, a map location, house rules, a cancellation policy and at least one priced room type before publication. Organisation approval is required. Ratings are not invented: listings without real reviews show New.

Guests must sign in to save properties, view personal requests or submit a stay request. Requests are stored on the server and can be accepted or declined by the owning manager. Confirming a request checks every night's available units inside a SQLite write transaction. Check-in and completion actions update manager guest counts. Guest and manager request changes are recorded in the audit log.

Stay requests do not collect online payments. They are pending until accepted. Amounts are room-rate totals; guests must confirm any additional charges with the property. Payment-provider onboarding, paid checkout, automated refunds, notification delivery and full review submission remain future integrations.

The old sample PMS and preview booking components remain as unused reference code. `/workspace` is inaccessible in every portal. Archived dining/conference/offer pages are also inaccessible. The guest website has no posting, management or administration entry points.

## Build and run

```sh
npm run build
npm run build:manage
npm run build:admin
```

Start the built portals in three terminals with `npm start`, `npm run start:manage` and `npm run start:admin`. Generated outputs use `.next`, `.next-management` and `.next-admin` respectively.

## Vercel

Create three Vercel projects from this repository, using the directory containing this package.json as the root and `npm run build` as the build command. Set `APP_PORTAL` to `guest`, `management` or `admin` in the corresponding project. No public cross-portal URLs are required. Portal routes remain isolated rather than redirecting across projects.

Local data is shared via `data/finder.sqlite` (or `DATABASE_PATH`). Shared persistent production storage must replace this local SQLite implementation before using the three Vercel deployments with real customers. Separate deployments alone do not share Vercel filesystem data. No Vercel projects, hosted databases or public domains are provisioned by this source change.

## Verification

`scripts/test-isolated-portals.cjs` creates a separate temporary SQLite database and starts all three portals on ports 3100–3102 with isolated build directories. It checks account and route separation, organisation verification, listing publication, owner-only pricing, guest requests and admin controls, then captures desktop and mobile views. It uses Playwright from the adjacent fivemilli workspace; `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing Chrome executable. Test database files are ignored by Git.

## frontend_changes integration (25 October 2026)

The merged branch adds shared Tailwind components, a PostgreSQL/Prisma schema and migrations, auth adapters and prototype dashboard pages. The active local portals retain their existing SQLite accounts and request workflow while that production migration is unfinished. Prototype NextAuth, dashboard and shared sign-in routes are blocked by the portal allowlist. Do not seed Prisma expecting those accounts to sign into the active SQLite portals.

Run `npm run typecheck`, `npm run lint` and `npm test` before building. No payment or production database integration is claimed.
