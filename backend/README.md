# Vabbot PMS Node backend

Run `npm run backend:dev` to start the dedicated API at `http://127.0.0.1:4000`.

Clerk owns login and session management. The frontend sends a Clerk session token as `Authorization: Bearer <token>` to PMS endpoints. The backend verifies it and resolves the Clerk user ID to the platform user record in PostgreSQL through Prisma.

The guest and management Next.js portals call `/api/backend/...`. That same-origin route obtains the current Clerk token and proxies the request to `BACKEND_API_URL`, so Clerk credentials never need to be managed by the browser application code.

Configure Clerk to send `user.created`, `user.updated`, and `user.deleted` to `POST /api/webhooks/clerk`. Every webhook is signature-verified and deduplicated before it updates the local user record.

- `GET /health`
- `GET /api/platform?view=search` searches published accommodation. Optional `checkIn`, `checkOut`, `adults`, `children`, and `rooms` filters are supported.
- `GET /api/platform?view=session` returns the signed-in user's local role and profile.
- `GET /api/platform?view=bookings` returns the signed-in guest's stay requests.
- `GET /api/platform?view=mine` returns the signed-in owner's or assigned staff member's accessible properties, rooms, bookings, finance data, documents, and organisation.
- `GET /api/platform/properties/:propertyId` returns a published property for the guest detail page.
- `POST /api/platform` handles guest stay requests and cancellations, manager onboarding, listings, images/documents, rates, availability, publication, booking status changes, manager refund requests, and Stripe Connect onboarding.
- The same endpoint handles administrator account suspension, organisation verification, listing moderation, booking cancellation, commissions, refund processing, payout generation/transfers, and the platform-wide request switch. `view=admin` returns the control-centre and financial data; `view=document&id=...` securely downloads verification documents.
- `GET /api/pms/properties/:propertyId/dashboard`
- `GET /api/pms/properties/:propertyId/calendar?roomId=&start=&end=`
- `POST /api/pms/actions` for room types, availability, physical room assignment, room status, rate plans/rules, operations tasks, staff, and quotes.
- `POST /api/pms/properties` creates a hotel/listing draft.
- `PATCH /api/pms/properties/:propertyId` updates listing details and its image URLs.
- `POST /api/pms/uploads/images` stores a JPEG, PNG, or WebP image supplied as base64 and returns its `/uploads/...` URL.
- `POST /api/pms/properties/:propertyId/publish` runs publication checks.

## Local startup

Copy `.env.example` to `.env.local`, supply the Clerk publishable and secret keys, then run these in separate terminals:

```powershell
npm run backend:dev
npm run dev:guest
npm run dev:manage
npm run dev:admin
```

Create or promote the first platform administrator using the same email as their Clerk account:

```powershell
$env:ADMIN_EMAIL="admin@example.com"
npm run admin:create
```

On the administrator's first Clerk sign-in, the backend links the Clerk user ID to that existing administrator record by email.

The portals use `http://localhost:3000`, `http://localhost:3001`, and `http://localhost:3002`; the Node API uses `http://127.0.0.1:4000`.

The server requires `DATABASE_URL` and uses Prisma/PostgreSQL for every runtime read and write. `DIRECT_URL` is used for migrations, imports, verification, backups, and recovery. SQLite is accepted only as the source of the one-time `db:import:sqlite` migration command.

## Financial actions

Manager actions on `POST /api/platform`:

- `request-refund` creates a policy-calculated refund request for a reservation the manager can access.
- `connect-onboarding` creates or resumes Stripe Connect Express onboarding for the owning organisation.

Administrator actions:

- `commission-setting` saves a property's percentage, payout schedule, and reserve period.
- `request-refund` creates a platform-initiated refund request.
- `process-refund` issues the approved amount through Stripe and records failures for retry.
- `generate-payouts` groups eligible checked-out stays after their reserve period.
- `process-payout` transfers each payout item to the organisation's ready Stripe account.

`POST /api/stripe/webhook` verifies and deduplicates Checkout, refund, dispute, and connected-account events. Configure this webhook on the deployed guest project because the route is hosted by that Next.js application.
