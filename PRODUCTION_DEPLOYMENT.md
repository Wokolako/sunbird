# Vabbot Resorts production architecture

## Selected services

| Capability       | Service                           | Reason                                                                                                                                        |
| ---------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication   | Clerk                             | Already integrated across all three portals and the Node API.                                                                                 |
| Runtime database | Prisma Postgres                   | Managed PostgreSQL with pooled runtime connections and direct migration/backup connections. Prisma is the production data layer.              |
| Object storage   | Cloudflare R2                     | S3-compatible private storage, presigned downloads, public image delivery through a controlled media domain, and a separate backup bucket.    |
| Payments         | Stripe Checkout + Connect Express | The UK platform collects GBP payments and transfers the property share after the reserve period. Webhooks remain the payment source of truth. |
| Maps             | Mapbox Geocoding v6               | Forward/reverse geocoding and map-compatible stored coordinates. Permanent geocoding is used because property coordinates are retained.       |
| Email            | Resend                            | Transactional booking, verification, payment, refund, and operational email.                                                                  |
| SMS              | Twilio Messaging                  | Time-sensitive security and stay notifications.                                                                                               |
| Frontends        | Three Vercel projects             | Guest, manager, and administrator deployments remain isolated by `APP_PORTAL`.                                                                |
| Node API         | Dedicated Node service            | Deploy `backend/server.ts` to a long-running Node host and attach the API domain.                                                             |

Reference documentation: [Prisma pooled and direct connections](https://www.prisma.io/docs/postgres/database/connecting-to-your-database), [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [Mapbox Geocoding v6](https://docs.mapbox.com/api/search/geocoding/), and [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Commercial policy selected for launch

- Platform commission: **12%** of the accommodation charge.
- Property payout schedule: **weekly**, after a **7-day reserve** following the eligible completed stay/payment event.
- Guest cancellation at least 48 hours before check-in: **100% refund**.
- Guest cancellation from 24 to 48 hours before check-in: **50% refund**.
- Guest cancellation less than 24 hours before check-in or no-show: **no automatic refund**.
- Property or platform cancellation: **100% refund**.
- Refunds, disputes, and late payments enter an administrator review queue before a payout is released.

These values are controlled by environment variables. Changing commercial or legal terms does not require a code deployment, but the public terms and property agreements must be updated at the same time.

## Proposed production domains

These DNS names become final only after the business owns and verifies `vabbotresorts.com`:

| Service                | Domain                             |
| ---------------------- | ---------------------------------- |
| Guest marketplace      | `https://www.vabbotresorts.com`    |
| Hotel manager          | `https://manage.vabbotresorts.com` |
| Super administrator    | `https://admin.vabbotresorts.com`  |
| Node API               | `https://api.vabbotresorts.com`    |
| Public property images | `https://media.vabbotresorts.com`  |

The root domain should redirect to `www`. Verification documents and database backups must never use the public media domain.

## Vercel projects

Create three Vercel projects from the same repository and package root.

### Shared server variables

Set these in all three projects where the server proxy needs them:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
BACKEND_API_URL=https://api.vabbotresorts.com
```

### Guest project

```text
APP_PORTAL=guest
GUEST_APP_URL=https://www.vabbotresorts.com
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
```

### Manager project

```text
APP_PORTAL=management
MANAGER_APP_URL=https://manage.vabbotresorts.com
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
```

### Administrator project

```text
APP_PORTAL=admin
ADMIN_APP_URL=https://admin.vabbotresorts.com
```

Vercel applies environment-variable changes only to new deployments. Redeploy each project after changing a value.

## Node API environment

Use the complete `.env.example` as the deployment checklist. The API receives the pooled `DATABASE_URL`; migration, import, backup, and restore commands receive `DIRECT_URL`.

Never expose these variables through a `NEXT_PUBLIC_` prefix:

- Database URLs
- Clerk secret and webhook keys
- Stripe secret and webhook keys
- R2 credentials
- Resend key
- Twilio credentials
- `CRON_SECRET`

Stripe Connect also requires:

```text
STRIPE_CONNECT_ENABLED=true
STRIPE_ACCOUNT_COUNTRY=GB
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
GUEST_APP_URL=https://www.vabbotresorts.com
MANAGER_APP_URL=https://manage.vabbotresorts.com
```

Register `https://www.vabbotresorts.com/api/stripe/webhook` in Stripe. Subscribe to Checkout session completion, asynchronous success/failure and expiry; refund creation/update; charge dispute changes; and connected-account updates. The handler verifies signatures, deduplicates event IDs, and reconciles PostgreSQL records.

## PostgreSQL cutover

1. Create Prisma Postgres and copy both pooled and direct connection strings.
2. Create private `vabbot-uploads` and `vabbot-backups` R2 buckets. Connect only the uploads bucket to `media.vabbotresorts.com`; verification objects remain private.
3. Set `DATABASE_URL`, `DIRECT_URL`, and R2 credentials in a private maintenance environment.
4. Apply the schema:

   ```powershell
   npm run db:generate
   npm run db:deploy
   ```

5. Stop writes to the SQLite deployment and create a protected copy of `data/finder.sqlite`.
6. Import core records and document blobs:

   ```powershell
   $env:SQLITE_SOURCE_PATH="C:\secure\finder.sqlite"
   $env:MIGRATE_BLOBS="true"
   npm run db:import:sqlite
   ```

7. Verify relational integrity and row totals:

   ```powershell
   npm run db:verify
   ```

8. Test search, a disposable booking, manager operations, administrator controls, image delivery, and private document download before routing production traffic.
9. Test Connect onboarding with a Stripe test account, issue and retry a test refund, generate an eligible checked-out-stay payout, and verify the transfer and webhook records.
10. Retain the source SQLite copy read-only through the rollback window.

The importer uses upserts and can be safely rerun after correcting a failed row. It never deletes PostgreSQL data.

## Migrations and indexes

- Commit every Prisma migration under `prisma/migrations`.
- Run `prisma migrate deploy` during the API deployment before accepting traffic.
- Application traffic uses the pooled URL; migrations, `pg_dump`, `pg_restore`, and administrative tools use the direct URL.
- Cursor pagination defaults to 25 records and is capped at 100.
- Compound indexes cover user status, organisation review queues, property publication, reservations, payments, messages, notifications, refunds, disputes, payouts, reviews, and audit history.
- PostgreSQL `btree_gist` prevents overlapping active reservations for the same physical room.
- Inventory and booking-hold writes must run in serializable transactions and lock the room-category inventory rows before decrementing availability.

## Object storage

- Property images: public R2 objects served through the media domain.
- Verification documents: private R2 objects exposed only with short-lived signed download URLs.
- Invoices: private objects.
- Database backups: separate private bucket and credentials.
- Maximum current upload size: 5 MB for images and verification documents.
- Configure an R2 lifecycle rule to delete daily database dumps after 35 days. Retain one separately copied month-end backup for 12 months if required by the business retention policy.

## Backups and recovery

The GitHub Actions workflow `.github/workflows/postgres-backup.yml` runs a daily `pg_dump` and uploads the custom-format dump to the private backup bucket. Store its database and R2 credentials as GitHub Actions secrets.

Local/manual backup:

```powershell
npm run db:backup
```

Restore into a newly created recovery database first:

```powershell
$env:DIRECT_URL="postgresql://recovery-database"
$env:BACKUP_FILE="C:\secure\vabbot.dump"
$env:RESTORE_APPROVED="true"
npm run db:restore
npm run db:verify
```

Perform a recovery test every month. A backup is not considered valid until `pg_restore` and `db:verify` succeed in an isolated database.

## Notification operations

Invoke `POST /api/jobs/notifications` on the Node API every five minutes with `Authorization: Bearer <CRON_SECRET>`. Failed deliveries retry with exponential delay and stop after five attempts. Monitor the `NotificationDelivery` queue for permanent failures.

## Release gate

Production payments remain disabled until all of the following are true:

- Stripe has approved the platform and the intended connected-account countries.
- Connect onboarding reports both charges and payouts ready.
- The Stripe webhook is configured on the API domain.
- Refund and dispute administrator screens have been acceptance-tested.
- A manager Connect account has completed onboarding and reports payouts ready.
- Test-mode refund and payout transfers reconcile through signed webhooks.
- Cancellation and commission terms have been approved and published.
- A successful backup/restore drill has been recorded.
