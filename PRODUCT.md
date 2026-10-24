# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Accommodation organisation owners and property staff in the United Kingdom, managing hotels, lodges, guesthouses and registered short-term lets.
- Local and international travellers searching for and booking rooms in the United Kingdom.
- Platform administrators verifying organisations and resolving operational issues.

## Product Purpose

Vabbot Resorts is a two-sided accommodation marketplace. Verified properties publish rooms, rates and availability; travellers search an area or nearby location, compare available stays, book and pay in one flow. The property manager and admin layer is delivered first, followed by the guest interface.

## Operating Context

The launch market is the United Kingdom nationwide. Property staff need to change availability from a phone. Guests need a responsive web experience. Native apps are outside this phase.

## Capabilities and Constraints

- Per-property choice of instant booking or request-to-book.
- Manual inventory calendar at launch.
- Commission per booking. The commission percentage is open.
- Licensed payment provider with split payments to property accounts. Provider selection and credentials are open; local methods and international cards must be supported.
- Organisation verification precedes publication. Search can return only verified, published properties with coordinates and available inventory.
- Server-side role enforcement, audit logs, transactional inventory holds, webhook-driven payment status and policy-based refunds are required.
- The supplied specification defines PM-1â€“PM-30, GU-1â€“GU-26, PAY-1â€“PAY-8, REV-1â€“REV-7, ROLE-1â€“ROLE-4 and NFR-1â€“NFR-11. See REQUIREMENTS.md for the implementation map.

## Brand Commitments

Replace the existing Sun Bird identity with Vabbot Resorts. The existing Sunbird logo, name, imagery and catalogue are not product assets for the new marketplace.

## Evidence on Hand

- The user supplied the 15-page â€œVabbot Resorts â€” User Specificationâ€ dated 2 October 2026.
- The current repository is a Next.js marketplace frontend with labelled sample discovery and booking previews, plus an interactive sample PMS. Existing server-backed organisation onboarding and admin verification remain available. Production guest booking and payment integrations are not connected.
- No licensed provider account, real property records, verified reviews, fee percentage or legal copy has been supplied. These must not be fabricated.

## Product Principles

1. Property data is verified before guests can find it.
2. Availability, prices and booking state come from the shared system of record.
3. Payments are handled by a licensed provider and trusted only through verified server callbacks.
4. A guest can find and book a suitable stay quickly on a phone.
5. Property staff can keep inventory current with few actions on a phone.

## Accessibility & Inclusion

The guest interface must meet WCAG 2.1 AA and work on low-bandwidth mobile connections. Currency, date and distance formatting must follow locale.
