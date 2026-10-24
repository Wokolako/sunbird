# Sunbird — Hotel & Lodge Marketplace with Integrated PMS

A modern, production-ready full-stack application built with **Next.js (App Router)**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, **Tailwind CSS**, **Zod**, and **NextAuth.js**.

The platform unifies **public marketplace discovery** for guests with a **full-featured Property Management System (PMS)** for lodge/hotel operators and an **administrative back-office console** for platform superintendents.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router with segregated Route Groups)
- **Language**: TypeScript (strict mode, zero-error typing)
- **Database**: PostgreSQL (relational schema with enums & foreign constraints)
- **ORM**: Prisma Client v6
- **Styling**: Tailwind CSS with custom hospitality tokens (Evergreen `#244f3c`, warm gold accent)
- **Component Library**: Shared UI component system (`Button`, `Badge`, `Card`, `Input`, `Select`, `Dialog`, `Tabs`, `Table`, `Avatar`)
- **Authentication**: NextAuth.js (Auth.js) with JWT session tokens and role claims
- **Validation**: Zod schema validation for environment and auth/property models
- **Code Quality**: ESLint (`next/core-web-vitals`) and Prettier (`prettier-plugin-tailwindcss`)

---

## 🏛️ Architecture & Three User Roles

The platform enforces strict role separation across **three dedicated route groups**, each possessing its own independent layout, navigation, and visual theme:

```
app/
├── (guest)/                   # 1. GUEST PORTAL (Public Marketplace + Account)
│   ├── layout.tsx             # Marketplace header (search, explore, currency, auth) & footer
│   ├── page.tsx               # Curated marketplace homepage & featured lodges
│   └── account/
│       └── page.tsx           # Guest account: my stays, folios, saved lodges, settings
│
├── (dashboard)/               # 2. PROPERTY PORTAL (/dashboard)
│   ├── layout.tsx             # PMS sidebar (property switcher, staff role badge, actions)
│   └── dashboard/
│       ├── page.tsx           # Front desk overview, live occupancy, arrivals & departures
│       ├── reservations/      # Booking folios list & check-in management
│       ├── calendar/          # 14-day PMS availability & rate matrix
│       └── rooms/             # Housekeeping status board (Clean / Dirty / Maintenance)
│
├── (admin)/                   # 3. ADMIN BACK-OFFICE (/admin)
│   ├── layout.tsx             # Command console layout (dark theme, system status indicator)
│   └── admin/
│       ├── page.tsx           # Platform analytics (GMV, active lodges, commission)
│       ├── properties/        # Organization verification & KYC queue
│       ├── users/             # User accounts & role boundary assignments
│       └── audit/             # Append-only audit security log
│
└── (auth)/                    # AUTHENTICATION & ACCESS CONTROL
    ├── layout.tsx             # Centered luxury auth layout
    └── auth/
        ├── signin/page.tsx    # Sign-in portal with 1-click test credentials
        └── unauthorized/page.tsx # 403 Forbidden Access Restricted page
```

---

## 🛡️ Role-Based Route Protection (`middleware.ts`)

Edge-compatible Next.js middleware inspects JWT session tokens on every navigation:

| Route Path                         | Allowed Roles                                            | Behavior if Unauthorized                                      |
| ---------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------- |
| `/admin/*`                         | `ADMIN`                                                  | Redirects to `/auth/unauthorized?requiredRole=ADMIN`          |
| `/dashboard/*`                     | `ADMIN`, `OWNER`, `MANAGER`, `FRONT_DESK`, `HOUSEKEEPER` | Redirects to `/auth/unauthorized?requiredRole=Property Staff` |
| `/account/*`                       | Any authenticated user (`GUEST`, `ADMIN`, etc.)          | Redirects to `/auth/signin?callbackUrl=/account`              |
| Public (`/`, `/hotels`, `/search`) | All visitors (unauthenticated & authenticated)           | Open access                                                   |

---

## 🔐 Seed Script & Demo Test Credentials

A seed script (`prisma/seed.ts`) populates the database with verified organizations, a flagship resort property (_Windermere Lakeside Retreat & Lodge_ in the Lake District), physical rooms, room types, and test accounts for each role.

On the `/auth/signin` page, you can either enter credentials manually or **click the 1-click test account buttons**:

| Role                 | Email                     | Password         | Default Redirect |
| -------------------- | ------------------------- | ---------------- | ---------------- |
| **Super Admin**      | `admin@sunbird.com`       | `Admin123456!`   | `/admin`         |
| **Property Owner**   | `owner@lakehaven.com`     | `Owner123456!`   | `/dashboard`     |
| **Property Manager** | `manager@lakehaven.com`   | `Manager123456!` | `/dashboard`     |
| **Front Desk Staff** | `reception@lakehaven.com` | `Staff123456!`   | `/dashboard`     |
| **Housekeeper**      | `cleaner@lakehaven.com`   | `Staff123456!`   | `/dashboard`     |
| **Guest Customer**   | `guest@example.com`       | `Guest123456!`   | `/account`       |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v20.x or newer (recommended: Node 22+)
- **PostgreSQL**: Local or hosted instance (e.g. Supabase, Neon, or local Postgres service)

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure your database connection string and secret:

```bash
cp .env.example .env
```

Key variables in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sunbird_db?schema=public"
NEXTAUTH_SECRET="development-secret-change-me-in-production-at-least-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup & Seeding

Generate Prisma Client and push schema to your PostgreSQL database:

```bash
# Generate the Prisma Client
npm run db:generate

# Push schema directly to PostgreSQL
npm run db:push

# (Or generate migrations)
npm run db:migrate

# Seed demo users, organizations, rooms, and bookings
npm run db:seed
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application:

- **Guest Marketplace**: `http://localhost:3000`
- **Guest Account**: `http://localhost:3000/account`
- **Property PMS**: `http://localhost:3000/dashboard`
- **Super Admin**: `http://localhost:3000/admin`
- **Sign In Demo**: `http://localhost:3000/auth/signin`

---

## 🧪 Available Scripts

| Command                | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | Starts Next.js development server at port 3000                 |
| `npm run build`        | Produces an optimized production build                         |
| `npm run start`        | Starts Next.js production server                               |
| `npm run lint`         | Runs ESLint (`next/core-web-vitals`)                           |
| `npm run format`       | Automatically formats codebase with Prettier & Tailwind plugin |
| `npm run format:check` | Verifies code formatting compliance                            |
| `npm run db:generate`  | Generates `@prisma/client` types from `prisma/schema.prisma`   |
| `npm run db:push`      | Synchronizes Prisma schema with PostgreSQL database            |
| `npm run db:seed`      | Runs `prisma/seed.ts` via `tsx`                                |

---

## 📦 Shared UI Component Library

Accessible, customizable UI components located in `components/ui/`:

- [`button.tsx`](file:///d:/Users/Drastic/HMS/sunbird/components/ui/button.tsx) — Variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`, `accent`.
- [`badge.tsx`](file:///d:/Users/Drastic/HMS/sunbird/components/ui/badge.tsx) — Variants: `default`, `secondary`, `destructive`, `success`, `warning`, `info`, `outline`.
- [`card.tsx`](file:///d:/Users/Drastic/HMS/sunbird/components/ui/card.tsx) — `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- [`input.tsx`](file:///d:/Users/Drastic/HMS/sunbird/components/ui/input.tsx) — Text input with error messaging and focus ring styling.
- [`select.tsx`](file:///d:/Users/Drastic/HMS/sunbird/components/ui/select.tsx) — Native styled select with custom variants.
- [`dialog.tsx`](file:///d:/Users/Drastic/HMS/sunbird/components/ui/dialog.tsx) — Accessible modal dialog with backdrop and escape key handling.
- [`tabs.tsx`](file:///d:/Users/Drastic/HMS/sunbird/components/ui/tabs.tsx) — Controlled and uncontrolled tab switcher.
- [`table.tsx`](file:///d:/Users/Drastic/HMS/sunbird/components/ui/table.tsx) — Styled data table component family.
- [`avatar.tsx`](file:///d:/Users/Drastic/HMS/sunbird/components/ui/avatar.tsx) — User avatar with image fallback initials.
