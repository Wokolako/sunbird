---
name: Vabbot Resorts
description: Warm editorial accommodation discovery and practical property operations.
colors:
  primary: "#244f3c"
  primary-deep: "#173c2b"
  ink: "#243c34"
  muted: "#647169"
  background: "#fcfbf8"
  paper: "#ffffff"
  line: "#e4e7df"
  sand: "#f0eee7"
  soft-green: "#e4ebdf"
typography:
  display:
    fontFamily: "Georgia, Times New Roman, serif"
    fontWeight: 400
    fontSize: "clamp(38px, 4.4vw, 66px)"
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  hero:
    fontFamily: "Georgia, Times New Roman, serif"
    fontWeight: 400
    fontSize: "clamp(42px, 4.5vw, 68px)"
    lineHeight: 1.14
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Segoe UI, Arial, sans-serif"
    fontSize: "14px"
rounded:
  control: "6px"
  surface: "9px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
  section: "65px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
---

# Vabbot Resorts design system

## Overview

Accommodation discovery uses an editorial travel treatment: landscape photography, generous open space and restrained evergreen actions. Property operations use denser tables and explicit statuses. Both support travellers and staff working on phones in daylight.

## Colors

Evergreen identifies actions. Ivory is the primary background; white is reserved for search, forms and operational surfaces. Pale green and sand distinguish selected states, room statuses and notices. Text and dividers use the shared CSS variables in `app/globals.css`.

## Typography

Georgia gives page and section headings a calm editorial voice; Segoe UI carries controls and operational data. Listing headings use Georgia at 23px on desktop, 24px on phones and 20px beside the map. Tables use tabular numerals. Paragraphs use 1.7 line height; the hero paragraph uses 1.8. Property prose has a 70ch maximum width. The hero heading overrides the base display scale: 48px at 850px and below, then 39px with 1.15 line height at 620px and below.

## Layout

The shell is 1280px maximum with 50px gutters, reduced to 30px at 1100px and below and 18px at 620px and below. Listing cards use three columns, two at 850px and below, and one at 620px and below. A five-part search bar becomes a two-column form at 850px, with destination spanning both columns. Map mode uses two listing columns beside a sticky map; at 850px the map stacks below the results. The property booking panel stops being sticky and stacks below the content at 850px. At 620px, guest navigation opens through a menu button and manager navigation becomes a horizontally scrolling toolbar. Tables scroll within their containers. At 1450px and above the hero height increases from 560px to 605px and listing images increase from 250px to 275px.

## Elevation & Depth

Most surfaces use a single light border. Search and the guest selector use soft offset shadows. Photography receives a dark overlay to support white text. No decorative blur is used.

## Shapes

Controls use 5–6px corners. Photos and panels use 7–10px corners. Circular controls are reserved for save hearts and compact navigation actions.

## Components

Search maintains destination, dates, guests and rooms through property links. Filters and map/list views share the same result collection. Property booking has room, details, review and completion steps. Preview bookings and live onboarding have explicit data boundaries. Keyboard focus uses an ochre outline, and reduced-motion preference disables transitions and smooth scrolling.

Illustrative photographs are served locally from `public/assets`; companion `.jpg.json` files record their source URLs and sample-only usage. They are stock illustrations, not verified photographs of the synthetic properties. The active application uses `SiteShell`, `Marketplace`, `PropertyDetail`, `GuestBookings`, `Workspace`, `ManagerApp` and `AdminApp`; the unused Sunbird library remains reference material outside TypeScript's active include list.

## Do's and Don'ts

Keep sample prices, ratings, properties and operational data labelled. Use actual server-backed data only where the platform provides it. Preserve generous spacing between discovery sections and compact grouping within booking forms. Do not present a local booking preview as a paid or reserved stay.

### Three role-specific portals

Guest navigation contains discovery, saved stays, stay requests and account actions only. Hotel management has its own root sign-in and owner workspace. Super administration has a separate root sign-in and global platform controls. No portal links to another portal. Each uses the shared type, color and form tokens while keeping role-specific navigation. Manager and administrator tables scroll inside their containers on phones.
