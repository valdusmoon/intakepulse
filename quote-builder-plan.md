# Quote Builder — Plan

**Written:** April 6, 2026
**Status:** Planning → Building UI

---

## What We're Building

A quote builder that lets painters create professional, itemized quotes from a lead and send them to homeowners as a PDF + email with a public view link. Homeowner can accept or decline. No lump sum, no per-room — scope-based flexible line items that match how real painters actually price jobs.

---

## Quote Structure

### Quote Types
- **Interior** — walls, ceilings, trim inside
- **Exterior** — siding, fascia, shutters, trim outside
- **Interior + Exterior** — full home
- **Custom** — anything else (deck, cabinet, fence, etc.)

### Line Items (Scope-Based)
Each line item has: **Name**, **Description** (optional), **Qty**, **Unit** (sqft, lf, hr, flat), **Unit Price**, **Total** (auto-calculated).

Default templates by type:
- **Interior:** Walls, Ceilings, Trim, Prep Work, Materials (paint + primer)
- **Exterior:** Siding, Fascia & Soffits, Trim, Shutters, Prep & Power Washing, Materials
- **Interior + Exterior:** combines both
- **Custom:** starts empty

Painter can add/remove/reorder line items freely. Templates are just starting defaults.

### Quote Fields
- **Quote number:** sequential per company, format `CC-0001`
- **Issue date:** auto-set to today, editable
- **Valid until:** issue date + 30 days, editable
- **Subtotal:** sum of line items
- **Discount:** optional, flat dollar or percent
- **Tax:** optional, percentage
- **Total:** calculated
- **Notes:** painter-facing internal notes (not on PDF)
- **Message to homeowner:** shown on PDF and public view ("Thank you for the opportunity...")
- **Deposit:** optional field (e.g. "50% deposit required to schedule")

---

## Data Model

### `quotes` table
```
id                  uuid, pk
company_id          uuid, fk → companies
lead_id             uuid, fk → leads, nullable (can be standalone)
quote_number        text (CC-0001 format, unique per company)
quote_type          text (interior | exterior | both | custom)
status              text (draft | sent | accepted | declined | expired)
issue_date          date
valid_until         date
subtotal_cents      integer
discount_type       text (flat | percent | null)
discount_value      integer (cents if flat, basis points if percent)
tax_rate_bps        integer (basis points, e.g. 875 = 8.75%)
total_cents         integer
homeowner_message   text, nullable
deposit_note        text, nullable
sent_at             timestamp, nullable
viewed_at           timestamp, nullable
accepted_at         timestamp, nullable
declined_at         timestamp, nullable
pdf_url             text, nullable
public_token        text (random, for /q/[token] public view)
created_at, updated_at
```

### `quote_line_items` table
```
id              uuid, pk
quote_id        uuid, fk → quotes
sort_order      integer
name            text
description     text, nullable
quantity        numeric (e.g. 1200.5)
unit            text (sqft | lf | hr | flat | ea)
unit_price_cents integer
total_cents     integer (qty × unit_price, stored for audit)
created_at
```

> **Decision:** Using proper columns (not JSON) for line items. Querying and PDF generation are simpler with real columns. JSON deferred as unnecessary complexity.

---

## Ship Order

1. **UI — quote builder page** (no DB) — pure React state, build and validate UX
2. **DB** — run migrations, wire up save/load
3. **PDF generation** — `pdf-lib` or `@react-pdf/renderer`, branded output
4. **Email send** — Resend, homeowner gets PDF attachment + public link
5. **Public view** — `/q/[token]` — homeowner sees quote, can accept/decline
6. **Accept/Decline** — updates `status`, sends painter notification

---

## UI Layout

### Route
`/dashboard/leads/[id]/quote` — accessible from lead detail page
Feature-flagged: hidden unless `NEXT_PUBLIC_FEATURE_QUOTES=true`

### Layout: Two-Panel
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Lead  |  Quote CC-0001  |  [Save Draft]  [Send] │
├───────────────────────────┬─────────────────────────────┤
│  LEFT: Editor             │  RIGHT: Live Preview        │
│                           │                             │
│  Quote type selector      │  Looks like the PDF /       │
│  ─────────────────        │  public view the homeowner  │
│  Line items table         │  will see. Updates live.    │
│  + Add line item          │                             │
│  ─────────────────        │  Company name + logo        │
│  Discount / Tax           │  Homeowner info             │
│  ─────────────────        │  Line items table           │
│  Message to homeowner     │  Subtotal / Discount / Tax  │
│  ─────────────────        │  Total                      │
│  Validity / Deposit       │  Message                    │
│  ─────────────────        │  Valid until / Deposit      │
│  Internal notes           │  Accept / Decline buttons   │
│                           │                             │
└───────────────────────────┴─────────────────────────────┘
```

### Pre-population from Lead
- Homeowner name, email, address pulled from lead
- Service type → pre-selects quote type (interior/exterior/both)
- Painter's `default_sqft_rate` used as unit price default for wall line items
- Estimate range shown as reference (not editable, just FYI)

### Line Item Interactions
- Editable inline table (name, qty, unit dropdown, unit price)
- Total auto-calculates on qty/price change
- Drag handle for reorder (optional, low priority)
- Delete row button
- "+ Add line item" appends blank row, auto-focuses name

---

## PDF Design

- Company name + business phone (top left)
- Quote number + issue date + valid until (top right)
- "QUOTE" heading
- Homeowner name + address
- Line items table: Name | Description | Qty | Unit | Unit Price | Total
- Subtotal / Discount / Tax / **Total** (bold, large)
- Homeowner message / deposit note
- Footer: "Questions? Call [phone] or email [email]"
- Branded with painter's colors (default: orange) — v1 just uses a clean B&W template

---

## Public View `/q/[token]`

- No auth required
- Shows quote PDF-style layout
- Two buttons: **Accept Quote** | **Decline**
- Accept: sets status=accepted, records timestamp, sends painter notification
- Decline: optional "tell us why" text, sets status=declined, sends painter notification
- Expired state if past valid_until

---

## Email to Homeowner

Subject: `Quote from [Business Name] — CC-0001`

- Brief intro: "Here's your quote for interior painting at [address]"
- Inline summary: total, valid until
- Button: "View & Accept Quote →" → `/q/[token]`
- PDF attached

---

## Feature Flag

Hidden in nav and lead detail unless `NEXT_PUBLIC_FEATURE_QUOTES=true`.
Vercel production: set to `false` until ready to ship.

---

## Out of Scope for V1 Quote Builder

- Quote templates (painter saves a template for reuse) — nice to have, not core
- Multiple revisions / version history
- Digital signature (e-sign) — V2
- Payment collection (deposit via Stripe Connect) — V2
- Contract terms / legal language — V2
- Change orders — V2
