# CraftCapture — V1 Feedback & Recommendations

> Consolidated review. Focused on what to fix/tighten before adding any new features.

---

## Priority 1 — Fix Before Selling

These are things that will cause confusion, bad data, or dead ends for paying users.

### 1. Auto-sync lead status on document events

**Problem:** Lead status (new → contacted → quoted → scheduled → won → lost) and document statuses (quote: draft/sent/accepted/declined, contract: draft/sent/signed/void) are completely independent. Painters have to manually click the status pill after every action. Most won't. Your KPI cards (conversion rate, revenue won) will be wrong for every painter who forgets.

**Fix:** Wire up automatic status transitions on key events:

| Event | Lead status auto-advances to |
|---|---|
| Quote sent | `quoted` |
| Quote accepted | `quoted` (no change, but confirm it's at least here) |
| Contract sent | `quoted` (no change) |
| Contract signed | `won` |
| Quote declined | `lost` (only if no other active quote — future-proofs multi-quote) |

**Rules:**
- Only advance forward, never backward (sending a quote shouldn't regress a "scheduled" lead back to "quoted")
- Painter can always override manually via status pills — the auto-sync is a sensible default, not a lock
- Log status changes with a timestamp so you have an audit trail (even a simple `status_changed_at` field helps for now)

**Why this is P1:** Without this, your dashboard metrics are fiction. A painter who closes 10 jobs but never clicks "won" shows 0% conversion and $0 revenue. That's the number they see every time they open the app.

---

### 2. Make email required on the lead form (or make the missing-email state impossible to miss)

**Problem:** Email is optional on the lead form, but the entire downstream flow — quote delivery, contract delivery, signed PDF receipt — requires it. A painter who builds a 20-minute quote and clicks "Send" gets a 422. They won't understand why.

**Recommended fix:** Make email required on the lead form. Yes, this adds friction. But your product *is* the email-delivered workflow. A lead without an email is a lead your product can't help with — they're better off in the painter's phone contacts.

**Alternative if you keep it optional:** On the lead detail page, show a persistent, non-dismissable banner at the top when email is missing:

```
⚠️ No email on file — you won't be able to send quotes or contracts.
[Email field] [Save]
```

Place this above the status pills so it's the first thing they see. Also: disable the "Quote" and "Contract" action buttons entirely (with a tooltip: "Add homeowner email first") rather than letting the painter build a document they can't send.

**Why this is P1:** This is a dead-end that makes the painter feel like the product is broken. They did everything right and hit a wall. That's a churn moment.

---

### 3. Resolve the `quoted_amount` split-brain

**Problem:** Revenue data lives in two places — `leads.quoted_amount` (legacy manual field) and `quotes.total_cents` (the real quote). If your KPIs read from leads, they're stale for quote-builder users. If they read from quotes, they're empty for painters who skip quoting.

**Fix:** Use `leads.quoted_amount` as the single source of truth for revenue reporting. Backfill it automatically:

| Event | Write to `leads.quoted_amount` |
|---|---|
| Quote sent | Copy `quotes.total_cents` → `leads.quoted_amount` |
| Quote updated and re-sent | Overwrite with new `total_cents` |
| Painter manually marks won (no quote) | Prompt for amount, write directly |

Then your KPI query is always: `SELECT SUM(quoted_amount) FROM leads WHERE status = 'won'`. One table, one field, always populated.

**Why this is P1:** Revenue Won is the number that justifies $79/month. If it's wrong or empty, the painter doesn't see their ROI.

---

### 4. Server-side price validation on quotes

**Problem:** Quote totals (subtotal, discount, tax, total) are passed from the client and written directly to the database. A modified request could set `total_cents` to anything. More realistically, a frontend rounding bug could produce a total that doesn't match the line items.

**Fix:** On `POST /api/quotes` and `PATCH /api/quotes/[id]`, recalculate all totals server-side from line items:
- Sum line item totals → `subtotal_cents`
- Apply discount → `discount_cents`
- Apply tax rate → `tax_cents`  
- Compute final → `total_cents`

Ignore client-sent totals. Use them only as a sanity check (log a warning if client and server totals differ by more than $1, which would indicate a frontend bug).

**Why this is P1:** Not a security emergency today (painters are the only authenticated users), but it's the kind of bug that silently produces wrong quotes. A homeowner who accepts a quote for $3,200 and gets invoiced for $3,800 later is a legal problem.

---

## Priority 2 — Fix Before It Hurts

These won't block launch but will cause pain within the first few weeks of real usage.

### 5. Soft deletes everywhere

**Problem:** Leads, quotes, and contracts all use hard DELETE. A painter who accidentally deletes a lead loses the associated quote and contract with no recovery.

**Fix:** Add `deleted_at` (nullable timestamp) to leads, quotes, and contracts. On DELETE, set `deleted_at = now()` instead of removing the row. Filter `WHERE deleted_at IS NULL` in all list/detail queries.

Don't build an "undo" UI yet — just preserve the data. If a painter contacts support, you can restore it with a single SQL update. If you want a quick win, show a toast after deletion: "Lead deleted" with an "Undo" button that clears `deleted_at` within 10 seconds.

---

### 6. Quote expiration cron

**Problem:** Quote expiration is only checked when the homeowner opens the public link (returns 410 if past `valid_until`). The painter's dashboard shows stale "sent" statuses indefinitely for quotes that expired weeks ago.

**Fix:** Daily cron job (or Vercel cron / pg_cron):
```sql
UPDATE quotes 
SET status = 'expired' 
WHERE status = 'sent' 
  AND valid_until < CURRENT_DATE;
```

This keeps the leads list and KPIs accurate without the painter doing anything.

---

### 7. Void and re-quote flow

**Problem:** If a homeowner says "can you take $200 off," the painter has no path. They can't edit a sent quote, can't create a second quote (one-per-lead V1 constraint), and there's no void action.

**Fix (minimal, stays within V1 scope):**
1. Add a "Void Quote" button on the quote detail page (visible when status = `sent` or `accepted`)
2. Voiding sets `quotes.status = 'voided'` and regresses `leads.status` back to `contacted` (exception to the "only advance forward" rule — voiding is an explicit undo)
3. Once voided, the "Quote" button on the lead detail page works again (since the existing quote is no longer active)
4. Painter creates a new quote for the same lead — this means relaxing the one-quote-per-lead constraint slightly: allow multiple quotes, but only one non-voided quote at a time

This avoids building a full revision system while unblocking the most common real-world scenario.

---

## Priority 3 — UI Tightening

### 8. Make skip-ability obvious

Your data model supports skipping steps (nullable FKs, independent status pills). The UI just needs to communicate it.

**Changes:**
- On lead detail, add a quick-action: **"Mark as won"** — opens a small inline form: "Job amount (optional)" + "Save." Writes `quoted_amount` and sets status to `won` in one click. This is the path for painters who agree on price over the phone and don't need a formal quote.
- On lead detail, allow "Contract" button to work even if no quote exists. The contract template already fills from lead data — it doesn't actually need a quote.
- Don't label the flow as steps 1-2-3. The quote and contract buttons should feel like tools available at any time, not a checklist.

### 9. Keep the lead detail page from bloating

The lead detail page is already the densest screen (status, job details, AI estimate, photo assessment, photos, notes, sidebar contact + documents). Before adding scheduling, payments, or invoicing to it:

**Consider a two-segment layout:**
- **Overview** (default): Status pills, contact sidebar, job details, AI estimate, notes — the "who is this and where are we" view
- **Documents**: Quotes, contracts, and eventually invoices as a vertical timeline with status badges

Don't build a tab system for this. A simple segmented control (two buttons at the top) is enough. Only introduce it when the page actually needs relief — maybe when you add the deposit/invoice step.

---

## Deferred (V1.5+) — Noted for Later

You mentioned these and they're all real. Capturing them here so they don't get lost, but none should block V1.

| Feature | Notes |
|---|---|
| **SMS notifications (A2P)** | High impact. Apply for 10DLC now, build the feature when approved. Email-first is fine for V1. |
| **Follow-up automations** | At least 1 follow-up per step (quote sent but not viewed after 48h, contract sent but not signed after 72h). Simple time-delayed emails via a cron or queue. Don't build a drip engine — just one nudge per step. |
| **Back-out / cancel at any step** | The void flow (P2 #7 above) partially covers this. Full cancel would mean: painter voids contract → voids quote → lead goes back to "contacted" or "lost." Think of it as unwinding the status chain. Each document type gets a "Void" action that reverses its status effect on the lead. |
| **Revision / restart flow** | Handled by void + re-create for V1 (P2 #7). True revision history (version numbers, diff view, "resend revised quote" email template) is V2. |
| **Multiple quotes per lead** | Partially addressed by the void flow. Full multi-quote (compare options, A/B pricing) is V2. |
| **Embeddable widget** | JS snippet for painter's own site. High distribution value, low complexity. Good V1.5 candidate. |
| **Google review request** | Post-job email with direct Google Business link. Very simple Resend email. Good quick win after V1 stabilizes. |

---

## Data Model Changes Summary

Minimal schema changes implied by the above:

| Table | Change | Reason |
|---|---|---|
| `leads` | Add `deleted_at` (timestamp, nullable) | Soft delete |
| `leads` | Add `status_changed_at` (timestamp) | Audit trail |
| `quotes` | Add `deleted_at` (timestamp, nullable) | Soft delete |
| `quotes` | Add `voided` status to allowed values | Void/re-quote flow |
| `contracts` | Add `deleted_at` (timestamp, nullable) | Soft delete |

No new tables. No new relationships. Everything above works within the existing schema with minor additions.

---

## One Sentence Summary

The product flow is right — lead → quote → contract → job is the correct sequence for painters. The work is making the pieces auto-sync (status, amounts), making each piece independently skippable (mark won without quoting, contract without quote), and closing the email gap so the happy path doesn't silently break. All tightening, no new scope.
