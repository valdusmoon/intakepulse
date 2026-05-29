# ReviewBoy - Development Plan & Roadmap

**Current Version:** 1.0 (Production Ready)
**Last Updated:** November 21, 2025
**Status:** 95% Complete - Ready for VA Training
**Target VA Training:** November 26, 2025
**Target Launch:** December 1, 2025

---

## Executive Summary

ReviewBoy is a **production-ready review collection and management platform** for service-based small businesses. The platform automates review requests, intelligently routes feedback, generates AI responses, and provides comprehensive analytics.

**Tech Stack:** Next.js 14, PostgreSQL, Drizzle ORM, Clerk, Stripe, Resend, Twilio, OpenAI, Inngest

**Key Metrics:**
- 15 Backend Services
- 40+ API Endpoints
- 5 Major Integrations
- 10 Database Tables
- 9 Dashboard Pages

---

# ✅ COMPLETED FEATURES

## 1. Core Platform Infrastructure

### Authentication & User Management
- ✅ Clerk integration for authentication
- ✅ Sign up, login, password reset flows
- ✅ Company-based data isolation
- ✅ Protected API routes and dashboard pages
- ✅ Automatic company provisioning on signup

### Onboarding System
- ✅ New user onboarding flow after signup
- ✅ Business information collection
- ✅ Google review URL validation and setup
- ✅ Timezone selection
- ✅ Default campaign creation
- ✅ Redirect to dashboard after completion

### Database Architecture
- ✅ PostgreSQL with Drizzle ORM
- ✅ 10 production tables with proper relationships
- ✅ Database connection pooling (max 10, idle timeout 20s)
- ✅ Transaction support for atomic operations
- ✅ Proper indexing on frequently queried fields

---

## 2. Customer Management System

### Customer CRUD Operations
- ✅ Add customers manually via form
- ✅ Edit customer information
- ✅ Delete customers with confirmation
- ✅ Customer search and filtering
- ✅ Pagination (50 per page)
- ✅ Customer status tracking: pending → in_campaign → clicked → reviewed → opted_out
- ✅ Phone number support (E.164 format normalization)
- ✅ Email validation and normalization
- ✅ Notes/custom fields per customer
- ✅ Last activity timestamp tracking

### CSV Bulk Import (Smart CSV 2.0)
- ✅ 3-step wizard: Upload → Map Columns → Results
- ✅ Intelligent column mapping with fuzzy matching
  - Auto-detects: "Email" = "email_address" = "customerEmail"
  - Manual mapping UI with dropdown selectors
- ✅ Preview table before import (first 3 rows)
- ✅ Duplicate detection (within CSV and against existing)
- ✅ Import summary with counts (imported, duplicates, errors)
- ✅ Field-level validation (email format, phone format)
- ✅ Error handling for missing required fields
- ✅ Max 10,000 rows per upload (configurable)
- ✅ Transaction-based import (all-or-nothing)

**API Endpoints:**
- `POST /api/customers` - Create customer
- `GET /api/customers` - List with search/filter
- `PATCH /api/customers/[id]` - Update
- `DELETE /api/customers/[id]` - Delete
- `POST /api/customers/upload` - Bulk import
- `POST /api/customers/upload/analyze` - Preview & mapping

---

## 3. Drip Campaign System

### Campaign Management
- ✅ Multi-attempt campaigns (1-10 attempts, configurable by tier)
- ✅ Campaign lifecycle: draft → active → paused → archived
- ✅ Per-campaign attempt configuration
- ✅ Customizable delays between attempts (e.g., 3 days, 7 days)
- ✅ Campaign-level settings and metadata
- ✅ Default campaign auto-creation on company setup
- ✅ Campaign deletion with validation (prevents deletion if customers assigned)

### Automated Email/SMS Sending
- ✅ Inngest-powered background job processing (no timeout issues)
- ✅ Scheduled sends: 2x daily (11 AM EST, 5 PM EST)
- ✅ Smart customer selection (eligible for next attempt)
- ✅ Rate limiting:
  - 100 emails per run
  - 300 emails per day per company
  - 1 email/second delivery rate
- ✅ Dual-channel support: Email + SMS
- ✅ Independent error handling (one channel can succeed if other fails)
- ✅ Request record creation before sending (prevents duplicates)
- ✅ Transaction-based status updates
- ✅ Comprehensive logging and error tracking

### Smart Review Routing
- ✅ Rating-based routing:
  - **4-5 stars**: Redirect to Google review page (1.5s delay)
  - **1-3 stars**: Show feedback form for company response
- ✅ Unique tracking links per request
- ✅ Click tracking with source attribution (email, SMS, QR)
- ✅ Customer status auto-update on click/review
- ✅ Feedback storage for all ratings (complete analytics)

**API Endpoints:**
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns` - List campaigns
- `GET /api/campaigns/[id]` - Get details
- `PATCH /api/campaigns/[id]` - Update
- `POST /api/campaigns/[id]/activate` - Activate
- `POST /api/campaigns/[id]/pause` - Pause
- `DELETE /api/campaigns/[id]` - Delete

---

## 4. Email Infrastructure

### Email Template System
- ✅ Per-campaign, per-attempt templates
- ✅ Separate templates for email and SMS
- ✅ Dynamic variable support:
  - `{{customer_name}}` - Customer first name
  - `{{business_name}}` - Company name
  - `{{owner_name}}` - Owner name
  - `{{owner_photo}}` - Owner photo (renders as `<img>` tag)
  - `{{review_link}}` - Unique tracking link
- ✅ Variable validation (prevents invalid variables)
- ✅ Template preview with sample data
- ✅ Template copy between attempts
- ✅ Default templates for new campaigns
- ✅ Auto-append unsubscribe footer (CAN-SPAM compliance)

### Email Sending via Resend
- ✅ Bulk email sending
- ✅ HTML email rendering with proper formatting
- ✅ Rate limiting (1 email/second)
- ✅ Per-company daily limits (300/day production)
- ✅ Email limit warning display (80% and 100% thresholds)
- ✅ From address: `noreply@reviewboy.com`
- ✅ Test email endpoint for verification
- ✅ Variable substitution in templates
- ✅ Owner photo embedding in HTML

**API Endpoints:**
- `GET /api/templates` - List templates
- `POST /api/templates` - Create
- `PATCH /api/templates/[id]` - Update
- `DELETE /api/templates/[id]` - Delete
- `POST /api/email/test` - Send test email
- `GET /api/emails/daily-count` - Get usage

---

## 5. SMS Integration (Twilio)

### SMS Capabilities
- ✅ Twilio integration for SMS sending
- ✅ Phone number validation and E.164 normalization
- ✅ SMS opt-out handling (TCPA/CAN-SPAM compliant)
- ✅ STOP keyword auto-unsubscribe
- ✅ SMS message logging and tracking
- ✅ Cost tracking per SMS ($0.0079/message, tracked in cents)
- ✅ Independent error handling (SMS succeeds even if email fails)
- ✅ SMS in drip campaigns (dual-channel: SMS+Email if phone provided)
- ✅ SMS feedback response delivery
- ✅ Feature flag: `TWILIO_ENABLED=true|false`
- ✅ SMS status tracking: queued, sent, failed

### SMS Templates
- ✅ SMS-specific templates (160 char awareness)
- ✅ Character count validation
- ✅ Auto-append unsubscribe link
- ✅ Variable support (same as email)

**API Endpoints:**
- `POST /api/sms/test` - Send test SMS
- `PATCH /api/company/sms-settings` - Configure SMS

---

## 6. Feedback Management System

### Feedback Collection
- ✅ Public feedback submission page
- ✅ Star rating selector (1-5 stars)
- ✅ Feedback text input
- ✅ Source tracking: email, SMS, QR code
- ✅ Sentiment classification: positive (4-5), neutral (3), negative (1-2)
- ✅ Optional customer name/email capture
- ✅ Anonymous submission support

### Feedback Portal (Dashboard)
- ✅ Unified feedback view for companies
- ✅ Display all customer feedback with context
- ✅ Rating display with star visualization
- ✅ Sentiment badges (positive, neutral, negative)
- ✅ Source indicators (email, SMS, QR)
- ✅ Customer name and email display
- ✅ Multi-filter interface:
  - Search by customer name, email, or feedback text
  - Filter by sentiment
  - Filter by source
  - Filter by resolution status
- ✅ Client-side filtering (instant, no API calls)
- ✅ Expandable rows for AI responses
- ✅ Send/edit/skip response actions
- ✅ Response status indicators (sent, auto-sent, skipped)
- ✅ Resolution status tracking and toggle

**API Endpoints:**
- `GET /api/feedback` - List feedback
- `PATCH /api/feedback/[id]` - Update
- `POST /api/feedback/[id]/send` - Send response
- `POST /api/reviews/qr-feedback` - QR submission

---

## 7. AI Response Generation (OpenAI)

### AI Response Features
- ✅ Automatic generation for negative/neutral feedback (1-3 stars)
- ✅ GPT-4o-mini model (~$0.01-0.02 per generation)
- ✅ Context-aware responses using:
  - Business name, industry, services
  - Brand voice (professional, friendly, casual)
  - Unique selling points
  - Target audience
  - Owner name and context
- ✅ Personalized, warm, professional tone
- ✅ 2-3 sentence responses with proper sign-off
- ✅ Separate prompts for positive vs. negative
- ✅ Fallback to template if OpenAI fails
- ✅ Error logging for failed generations
- ✅ Model and timestamp tracking

### Auto-Send Response System
- ✅ Company setting: `autoSendResponsesEnabled`
- ✅ Scheduled auto-sending 2x daily (11 AM EST, 5 PM EST)
- ✅ Inngest cron integration
- ✅ Dual-channel sending (email + SMS fallback)
- ✅ Transaction-based updates
- ✅ Auto-marks as sent with `approved_by: 'auto'`
- ✅ Auto-resolves feedback when sent
- ✅ Per-company processing with error isolation
- ✅ Comprehensive logging

**API Endpoints:**
- `POST /api/feedback/[id]/send` - Manual send
- Auto-send via Inngest: `lib/inngest/functions/auto-send-responses.ts`

---

## 8. QR Code Review Collection

### QR Code Features
- ✅ Unique QR code generation per company
- ✅ Short URL: `/r/[companyId]` for QR destination
- ✅ QR code display in settings page
- ✅ Download options:
  - PNG (data URL for display)
  - PDF (for printing)
- ✅ Printable templates:
  - Business card (3.5" × 2")
  - Counter tent (4" × 6")
  - Sticker (2" × 2")
  - Poster (8.5" × 11")
- ✅ Configurable QR dimensions and error correction
- ✅ Source tracking: `source: 'qr'` in feedback
- ✅ Review form accessible at `/r/[companyId]`
- ✅ Business name and branding on review page

**Use Cases:**
- HVAC/Plumbing: Leave on invoice, stick on equipment
- Auto Repair: Display at checkout, include in paperwork
- Restaurants: Table tents, receipts
- Retail: Point-of-sale, packaging inserts
- Cleaning: Leave-behind cards
- Medical/Dental: Reception desk

**API Endpoints:**
- `POST /api/qr-code/generate` - Generate QR (data URL)
- `GET /api/qr-code/download` - Download (PNG/PDF)
- `POST /api/reviews/qr-track` - Track QR scans

---

## 9. Review Widgets (Embeddable)

### Widget Infrastructure
- ✅ Public API endpoint: `/api/widgets/[companyId]/reviews`
- ✅ API key authentication (unique per company)
- ✅ CORS-enabled for cross-domain embedding
- ✅ Returns positive reviews (4-5 stars) with feedback text
- ✅ Limited to 20 most recent reviews
- ✅ Includes: rating, feedback, customer name, creation date
- ✅ Widget toggle per company
- ✅ Auto-generated widget API key
- ✅ Widget preview component in settings

### Widget Security
- ✅ API key required for access
- ✅ Rate limiting on widget endpoint
- ✅ Company ownership validation
- ✅ Widget toggle (can disable anytime)

**API Response Format:**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "feedbackText": "Great service!",
      "customerName": "John D.",
      "createdAt": "2024-11-21T..."
    }
  ],
  "count": 15
}
```

**API Endpoints:**
- `GET /api/widgets/[companyId]/reviews` - Public widget API

---

## 10. Analytics & Reporting

### Funnel Metrics
- ✅ Total customers
- ✅ Requests sent
- ✅ Link clicks
- ✅ Reviews completed
- ✅ Click-through rate (CTR)
- ✅ Conversion rate
- ✅ Average star rating
- ✅ Positive/neutral/negative breakdown
- ✅ Positive review percentage

### Time Series Data
- ✅ Requests sent per day (last 30 days)
- ✅ Reviews completed per day
- ✅ Trend visualization (table format)
- ✅ Real-time calculations

### Source Analytics
- ✅ Breakdown by source (email vs SMS vs QR)
- ✅ Source-specific conversion rates

**Dashboard Page:**
- `/dashboard/analytics` - 9-card KPI display + time series

**API Endpoints:**
- `GET /api/analytics/funnel` - Funnel metrics
- `GET /api/analytics/timeseries` - Time series

---

## 11. Subscription & Billing

### Stripe Integration
- ✅ 14-day free trial (card required upfront)
- ✅ $49/month subscription (early bird pricing)
- ✅ Subscription status tracking: trialing, active, past_due, canceled
- ✅ Trial countdown display
- ✅ Stripe customer portal link
- ✅ Subscription status banner on dashboard
- ✅ Payment failure handling
- ✅ Auto-renewal setup
- ✅ Tier-based feature limits

### Webhook Handling
- ✅ `checkout.session.completed` - Subscription created
- ✅ `customer.subscription.updated` - Status changes
- ✅ `customer.subscription.deleted` - Cancellation
- ✅ `invoice.payment_succeeded` - Billing success
- ✅ `invoice.payment_failed` - Billing failure
- ✅ Transaction-based updates (atomic state changes)

**Dashboard Page:**
- `/dashboard/billing` - Billing status, trial countdown, portal link

**API Endpoints:**
- `POST /api/stripe/checkout` - Start checkout
- `GET /api/stripe/portal` - Customer portal link
- `POST /api/stripe/webhook` - Webhook handler
- `GET /api/subscription/status` - Check status

---

## 12. Company Settings & Configuration

### Business Profile
- ✅ Business name and owner name
- ✅ Owner photo URL (for email inclusion)
- ✅ Google review URL (validated, required)
- ✅ Timezone selection
- ✅ Industry classification
- ✅ Services offered description
- ✅ Company description

### AI Context Fields
- ✅ Brand voice (professional, friendly, casual)
- ✅ Unique selling points
- ✅ Target audience description
- ✅ Used for contextual AI response generation

### Integration Settings
- ✅ SMS phone number configuration
- ✅ SMS enable/disable toggle
- ✅ Auto-send responses toggle
- ✅ Widget API key display and regeneration
- ✅ QR code display and download
- ✅ Feature toggles

**Dashboard Page:**
- `/dashboard/settings` - Comprehensive settings interface

**API Endpoints:**
- `GET /api/company` - Get company data
- `PATCH /api/company` - Update company
- `POST /api/company/onboarding` - Complete onboarding
- `PATCH /api/company/auto-send-settings` - Toggle auto-send
- `PATCH /api/company/sms-settings` - Configure SMS

---

## 13. Compliance & Security

### Email Compliance (CAN-SPAM)
- ✅ Auto-appended unsubscribe footer on all emails
- ✅ One-click unsubscribe
- ✅ Public unsubscribe page (no auth required)
- ✅ Marks customer as opted out
- ✅ Prevents further emails to opted-out customers
- ✅ Unsubscribe token validation

### SMS Compliance (TCPA)
- ✅ STOP keyword handling
- ✅ Auto-unsubscribe on STOP reply
- ✅ SMS opt-out tracking
- ✅ Compliance footer in SMS messages

### Data Protection
- ✅ PostgreSQL encryption at rest
- ✅ HTTPS/TLS in transit
- ✅ Stripe PCI compliance
- ✅ API key validation for widgets
- ✅ Per-company data isolation
- ✅ Protected API routes

### Legal Documents
- ✅ Privacy Policy (comprehensive, GDPR/CCPA ready)
- ✅ Terms of Service (subscription terms, refund policy)
- ✅ Cookie Policy
- ✅ All documents accessible in footer

**Public Pages:**
- `/unsubscribe/[customerId]` - Unsubscribe confirmation
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy
- `/cookies` - Cookie Policy

**API Endpoints:**
- `POST /api/unsubscribe/[customerId]` - Unsubscribe

---

## 14. Data Integrity & Transactions

### Input Validation
- ✅ Phone number validation with E.164 normalization (libphonenumber-js)
- ✅ Email validation with typo detection (gmail.con → gmail.com)
- ✅ Google URL validation (permissive regex)
- ✅ CSV field-level validation with error reporting
- ✅ Zod schemas on all API endpoints

### Database Transactions (13 Operations)
All multi-step operations wrapped in atomic transactions:

**CRITICAL (6 operations):**
- ✅ QR feedback submission (customer + feedback creation)
- ✅ Drip campaign send (request + customer status update)
- ✅ Review submission (request + customer + feedback)
- ✅ Stripe webhook: checkout.session.completed
- ✅ Stripe webhook: subscription.updated
- ✅ Stripe webhook: subscription.deleted

**HIGH (5 operations):**
- ✅ Feedback creation with company stats
- ✅ Manual review request send
- ✅ Review click recording
- ✅ AI response send (manual)
- ✅ Auto-send AI response

**MEDIUM (2 operations):**
- ✅ Campaign setup with attempts
- ✅ Campaign deletion

**Benefits:**
- All-or-nothing updates (prevents partial state)
- Automatic rollback on failure
- Safe to retry on errors
- Idempotent operations

---

## 15. Background Job Processing (Inngest)

### Scheduled Jobs
- ✅ Drip campaign sending: 2x daily (11 AM EST, 5 PM EST)
- ✅ Auto-send AI responses: 2x daily (11 AM EST, 5 PM EST)
- ✅ No timeout issues (Vercel cron limitation solved)
- ✅ Scales to 10,000+ emails/day
- ✅ Better error handling and retries
- ✅ Free tier: 500k steps/month

### Inngest Features
- ✅ Automatic function discovery via `/api/inngest`
- ✅ Built-in logging and execution history
- ✅ Concurrency control
- ✅ Error isolation per company
- ✅ Manual trigger support

**Inngest Functions:**
- `lib/inngest/functions/drip-campaigns.ts` - Email/SMS sending
- `lib/inngest/functions/auto-send-responses.ts` - AI response delivery

---

## 16. Landing Page & Marketing

### Landing Page Sections
- ✅ Hero section with compelling headline
- ✅ Features section (6 core features)
- ✅ Testimonials (3 realistic customer reviews)
- ✅ Video placeholder (ready for demo video)
- ✅ Pricing section ($49/mo, 14-day trial)
- ✅ FAQ section (6 common questions)
- ✅ Footer with legal links and support

### Branding
- ✅ ReviewBoy branding throughout
- ✅ Clean, professional UI
- ✅ Dark/light mode support
- ✅ Mobile responsive
- ✅ Fast page load times

**Public Pages:**
- `/` - Landing page
- `/login` - Login (Clerk, branded)
- `/signup` - Signup (Clerk, branded)

---

## 17. Multi-Location Support (Partial)

### Current Implementation
- ✅ Database schema for locations
- ✅ Location assignment in campaigns
- ✅ Location-specific feedback tracking
- ✅ Location service with ownership validation
- ✅ API endpoints for location CRUD

### Pending UI Work
- ⏳ Location management page
- ⏳ Location selector in campaign creation
- ⏳ Location-scoped analytics views
- ⏳ Location switcher in dashboard

**API Endpoints:**
- `GET /api/locations` - List locations
- `POST /api/locations` - Create
- `PATCH /api/locations/[id]` - Update

---

# 🔴 REMAINING PRE-LAUNCH TASKS

## Critical (Must Do Before Nov 26)

### 0. **BLOCKER: Campaign Queue Scalability** (2-4 hours)
**Problem:** Current drip campaign processing has a hardcoded 1000 customer limit per run. If a company has 5000 customers in a campaign, 4000 will never receive emails.

**Current Code:**
```typescript
const customers = await customerRepository.list({
  companyId,
  campaignId: campaign.id,
  limit: 1000, // ❌ HARD LIMIT - customers beyond this are ignored
})
```

**Critical Issues:**
- [ ] Only first 1000 customers get processed, rest are ignored
- [ ] No pagination/batching through remaining customers
- [ ] No priority queue (new customers can cut in line ahead of mid-drip customers)
- [ ] Exhausted customers stay in "in_campaign" status forever (should be "campaign_completed")

**Required Fixes Before Launch:**
- [ ] **Batch Processing:** Process ALL customers in chunks, not just first 1000
  - Option A: Paginate through all customers (multiple DB queries)
  - Option B: Stream/cursor approach for large datasets
  - Option C: Queue-based system (Redis/Bull for true queue)
- [ ] **Priority Queue:** Sort by `currentAttempt DESC, createdAt ASC` so mid-drip customers finish before new signups start
- [ ] **Status Cleanup:** Mark customers as "campaign_completed" 24-48hrs after final attempt if no response
- [ ] **Attempt Tracking:** Ensure status updates (skipped/exhausted) don't count against daily email limits

**Impact if Not Fixed:**
- Companies with >1000 customers will have inconsistent/broken drip campaigns
- Some customers never receive any emails (terrible UX)
- Analytics will be completely wrong
- **Cannot onboard clients until resolved** ❌

---

### 1. Final Testing (2-3 hours)
- [ ] **Subscription/Billing Flow** (15 min)
  - [ ] View billing page in different states (trial, active, past_due)
  - [ ] Test "Manage Subscription" portal link
  - [ ] Verify subscription status displays correctly
  - [ ] Test trial countdown accuracy
  - [ ] Verify trial → paid transition

- [ ] **Email Compliance** (15 min)
  - [ ] Send test email to yourself
  - [ ] Verify unsubscribe link is in footer
  - [ ] Test unsubscribe flow works
  - [ ] Check email formatting on Gmail/Outlook
  - [ ] Verify mobile email rendering

- [ ] **End-to-End Manual Test** (1 hour)
  - [ ] Sign up as new user
  - [ ] Complete onboarding
  - [ ] Upload CSV with customers
  - [ ] Send test campaign (manual trigger)
  - [ ] Click review link from email
  - [ ] Submit 5-star review → verify Google redirect
  - [ ] Submit 1-star review → verify feedback form
  - [ ] Check AI response generation
  - [ ] Send AI response to customer
  - [ ] Verify analytics update correctly

- [ ] **Transaction Rollback Tests** (30 min)
  - [ ] Simulate database failure during review submission
  - [ ] Simulate email send failure during campaign
  - [ ] Verify rollback behavior (no partial updates)
  - [ ] Test idempotency (retry doesn't duplicate)

### 2. Production Deployment (1-2 hours)
- [ ] **Environment Variables Review**
  - [ ] Verify all production keys in Vercel
  - [ ] Ensure no test mode keys in production
  - [ ] Check `NEXT_PUBLIC_APP_URL` is correct
  - [ ] Verify `RESEND_FROM_EMAIL` domain

- [ ] **Stripe Live Mode**
  - [ ] Switch from test to live mode keys
  - [ ] Update `STRIPE_SECRET_KEY` to live key
  - [ ] Update `STRIPE_WEBHOOK_SECRET` to live endpoint secret
  - [ ] Test $1 charge to verify live mode works
  - [ ] Set up Stripe webhook endpoint in live mode

- [ ] **Email/SMS Production Limits**
  - [ ] Restore production limits in `constants.ts`:
    - Daily email limit: 300 (currently 3 for testing)
    - Per-run limit: 100 (currently 2 for testing)
    - Max CSV rows: 10,000 (currently 3 for testing)
  - [ ] Verify Resend account limits (current tier)
  - [ ] Have backup plan if hitting limits

- [ ] **Inngest Production Setup**
  - [ ] Sign up for Inngest account at inngest.com
  - [ ] Get production event key and signing key
  - [ ] Add keys to Vercel environment variables
  - [ ] Deploy and verify Inngest discovers functions
  - [ ] Test manual trigger in Inngest dashboard

- [ ] **Domain & DNS**
  - [ ] Configure custom domain (if ready)
  - [ ] Verify SSL certificate is active
  - [ ] Update `NEXT_PUBLIC_APP_URL` to production domain

- [ ] **Final Smoke Tests**
  - [ ] Test signup flow
  - [ ] Test payment flow
  - [ ] Test email sending
  - [ ] Test SMS sending (if A2P approved)
  - [ ] Verify cron jobs running on schedule
  - [ ] Check error logs in Vercel

### 3. Demo & VA Prep (2-3 hours)
- [ ] **Seed Demo Data**
  - [ ] Create demo company account
  - [ ] Seed 20-30 realistic customers with varied statuses
  - [ ] Seed 5-10 feedback items (mix of ratings)
  - [ ] Ensure analytics look "healthy" (25-35% response rate)
  - [ ] Add realistic feedback text

- [ ] **VA Training Materials**
  - [ ] Product overview doc (what ReviewBoy does, 2 paragraphs)
  - [ ] Key features bullet list
  - [ ] Target customers (HVAC, cleaning, auto, contractors)
  - [ ] Pricing: $49/mo, 14-day trial
  - [ ] Demo walkthrough script (numbered steps with screenshots)
  - [ ] FAQ for VAs (common objections + responses)
  - [ ] When to escalate to you

- [ ] **Demo Video** (Optional, can defer to post-launch)
  - [ ] Record 2-3 minute walkthrough
  - [ ] Show: Customer upload → Campaign → Feedback → Analytics
  - [ ] Add to landing page video section

---

# 🚀 POST-LAUNCH ROADMAP

## Tier 1: High Impact, Low Effort (6-12 hours)

### 1.1 Chart Visualization for Analytics (2-3 hours)
**Priority:** ⭐⭐⭐⭐⭐
**Impact:** Professional appearance, easier data interpretation
**Effort:** Low

**Implementation Steps:**
1. Install chart library: `npm install recharts` (2 min)
2. Create `BarChart` component for time series (30 min)
   - Accept data prop: `{ date: string, count: number }[]`
   - Configure axes, tooltips, responsive sizing
   - Add to `/dashboard/analytics` page
3. Create `PieChart` component for sentiment breakdown (30 min)
   - Accept data: `{ sentiment: string, count: number }[]`
   - Color-coded segments (green, yellow, red)
   - Add to analytics page
4. Create `LineChart` component for trend visualization (30 min)
   - Show requests vs reviews over time
   - Dual-axis if needed
5. Test responsiveness on mobile/tablet (30 min)
6. Add loading states and empty states (15 min)

**Files to Modify:**
- `app/(app)/dashboard/analytics/page.tsx`
- Create: `components/charts/bar-chart.tsx`
- Create: `components/charts/pie-chart.tsx`
- Create: `components/charts/line-chart.tsx`

---

### 1.2 Widget HTML Templates (3-4 hours)
**Priority:** ⭐⭐⭐⭐⭐
**Impact:** Complete widget feature, competitive differentiator
**Effort:** Low-Medium

**Implementation Steps:**
1. Create `/dashboard/widgets` page (30 min)
   - Widget selection (Grid, Carousel, Pop-up)
   - Preview panel
   - Embed code display with copy button
   - Customization options (colors, size)

2. Create Grid Widget template (1 hour)
   - HTML/CSS/JS in single `<script>` tag
   - Fetch reviews from API
   - Display in responsive grid (3 columns desktop, 1 mobile)
   - Star rating display
   - Customer name + feedback text
   - Pagination controls

3. Create Carousel Widget template (1 hour)
   - Auto-scroll every 5 seconds
   - Manual navigation (prev/next arrows)
   - Pause on hover
   - Smooth transitions
   - Responsive design

4. Create Pop-up Widget template (1 hour)
   - Bottom-right notification
   - Shows recent review every 5-8 seconds
   - Dismissible
   - Rotation through reviews
   - Configurable display frequency

5. Create embed code generator service (30 min)
   - Generate unique `<script>` tag per widget type
   - Include API key in script
   - Minified JavaScript for performance

**Files to Create:**
- `app/(app)/dashboard/widgets/page.tsx`
- `lib/services/widget-generator-service.ts`
- `public/widgets/grid.js` (template)
- `public/widgets/carousel.js` (template)
- `public/widgets/popup.js` (template)

**API Changes:**
- None needed (API already exists)

---

### 1.3 Stripe Webhook Reconciliation Safety Net (2-3 hours)
**Priority:** ⭐⭐⭐⭐
**Impact:** Prevents "paid but no access" edge cases from webhook failures
**Effort:** Low-Medium

**Problem:** If Stripe webhook fails (network error, database down, bug), user payment processes but database isn't updated. User is charged but locked out of features.

**Implementation Steps:**
1. Add subscription verification helper to `subscription-service.ts` (30 min)
   - `verifySubscriptionWithStripe(companyId)` - fetches actual Stripe status
   - Compares database vs Stripe reality
   - Returns discrepancies
2. Add reconciliation middleware for critical features (45 min)
   - Before CSV upload, verify subscription with Stripe API
   - Before sending campaigns, verify subscription
   - Cache result for 5 minutes to avoid excessive API calls
3. Create admin reconciliation dashboard (1 hour)
   - List companies with mismatched subscription status
   - "Sync from Stripe" button to fix manually
   - Display last webhook received timestamp
4. Add daily cron job for auto-reconciliation (30 min)
   - Run nightly to sync all active subscriptions
   - Alert on discrepancies found
   - Auto-fix if safe (paid in Stripe but not in DB)

**Files to Create/Modify:**
- `lib/services/subscription-service.ts` - add verification methods
- `app/api/admin/reconcile-subscriptions/route.ts` - admin endpoint
- `app/(authenticated)/admin/subscriptions/page.tsx` - admin UI
- `lib/middleware/verify-subscription.ts` - reusable middleware

**Note:** Deferred until post-launch - not critical for initial customers, but important safety net once volume increases.

---

### 1.4 Company Branding & Logo Upload (2 hours)
**Priority:** ⭐⭐⭐⭐⭐
**Impact:** Increases trust, higher review completion rates
**Effort:** Low

**Implementation Steps:**
1. Install Supabase client (if not already): `npm install @supabase/supabase-js` (2 min)
2. Set up Supabase Storage bucket `company-logos` (10 min)
   - Configure public read access
   - Set max file size (2MB)
   - Allowed types: PNG, JPG, SVG
3. Add logo upload to settings page (1 hour)
   - File input with drag-and-drop
   - Image preview before upload
   - Upload to Supabase
   - Store URL in `companies.logo_url`
   - Fallback to URL input (existing owner_photo_url pattern)
4. Add brand color picker (15 min)
   - Store in `companies.brand_color` (new field)
   - Use in review page header
5. Update review page to show logo (15 min)
   - Display logo at top of `/track/[id]` page
   - Use brand color for buttons/headers
6. Update email templates to include logo (15 min)
   - Add `{{company_logo}}` variable
   - Render as `<img>` tag in email HTML

**Database Migration:**
```sql
ALTER TABLE companies ADD COLUMN logo_url TEXT;
ALTER TABLE companies ADD COLUMN brand_color VARCHAR(7) DEFAULT '#3b82f6';
```

**Files to Modify:**
- `app/(app)/dashboard/settings/page.tsx`
- `app/(public)/track/[id]/page.tsx`
- `lib/email/email-html-builder.ts`
- `db/schema/companies.ts`

---

### 1.4 Customer Limit UI Indicators (1-2 hours)
**Priority:** ⭐⭐⭐
**Impact:** Better UX, prevents confusion when hitting limits
**Effort:** Very Low

**Current State:** API enforces limits (5,000 per CSV, 10,000 total) but UI has no indicators. Users only see error toast when limit is hit.

**Implementation Steps:**
1. Add customer count badge to customers page header (30 min)
   - Display: "9,500 / 10,000 customers"
   - Color-coded: green (<80%), yellow (80-95%), red (>95%)
   - Shows on customers list page

2. Disable "Add Customer" button when at limit (15 min)
   - Check customer count on page load
   - Disable button with tooltip: "Customer limit reached (10,000/10,000)"
   - Show upgrade prompt in tooltip

3. Update CSV upload dialog with limit info (20 min)
   - Show "You can upload X more customers" before upload
   - Calculate: `10,000 - currentCount`
   - Prevent upload if it would exceed limit (client-side check)

4. Add "reviewed" customer delete protection (30 min)
   - Check if customer has `status === "reviewed"` before delete
   - API: Return 400 error "Cannot delete customers who have left reviews"
   - UI: Hide/disable delete button for reviewed customers
   - Tooltip: "Cannot delete - customer has reviewed"

**Files to Modify:**
- `app/(authenticated)/dashboard/(pages)/customers/page.tsx` - add count badge
- `components/forms/customer-form.tsx` - disable add button logic
- `upload-csv-dialog.tsx` - add remaining count display
- `app/api/customers/[id]/route.ts` - add delete protection
- `lib/services/customer-service.ts` - add delete protection check

**API Changes:**
```typescript
// In customer-service.ts delete()
if (customer.status === "reviewed") {
  throw new ValidationError("Cannot delete customers who have left reviews")
}
```

**Note:** Not critical for launch - API already enforces limits. This just improves UX.

---

### 1.5 Customer Tags/Segments (2 hours)
**Priority:** ⭐⭐⭐⭐
**Impact:** Better organization, professional appearance
**Effort:** Low

**Implementation Steps:**
1. Add tags to database schema (10 min)
   - `customers.tags` - Array of strings (JSON or PostgreSQL array)
   - Indexable for fast filtering
2. Create tag management UI in customer table (45 min)
   - Tag input field (multi-select with autocomplete)
   - Display tags as badges on customer row
   - Bulk tag assignment (select multiple → add tag)
3. Add tag filter to customer list (30 min)
   - Dropdown with all unique tags
   - Filter customers by selected tag
   - Combine with existing search/status filters
4. Predefined tag suggestions (15 min)
   - "High-Value", "Follow-up Needed", "Manual Only", "VIP"
   - Custom tags allowed
5. Tag display in customer detail view (15 min)
6. API support for tag filtering (15 min)

**Database Migration:**
```sql
ALTER TABLE customers ADD COLUMN tags TEXT[] DEFAULT '{}';
CREATE INDEX idx_customers_tags ON customers USING GIN(tags);
```

**Files to Modify:**
- `app/(app)/dashboard/customers/page.tsx`
- `lib/repositories/customer-repository.ts`
- `db/schema/customers.ts`
- API: `GET /api/customers` (add tag filter)

---

## Tier 2: Medium Impact, Strong ROI (12-18 hours)

### 2.1 Drip Campaign Editor (4 hours)
**Priority:** ⭐⭐⭐⭐⭐
**Impact:** HUGE - customers love control without complexity
**Effort:** Medium

**Implementation Steps:**
1. Create `/dashboard/campaigns/[id]/edit` page (1 hour)
   - Campaign name editor
   - Max attempts selector (1-10)
   - Attempt list with drag-to-reorder
   - Per-attempt configuration:
     - Delay days input
     - Enable/disable toggle
     - Template assignment (email + SMS)
2. Add campaign timeline preview (1 hour)
   - Visual timeline showing when emails will be sent
   - Example: "Day 0: Attempt 1 → Day 3: Attempt 2 → Day 10: Attempt 3"
   - Show current progress for active campaigns
3. API support for campaign updates (1 hour)
   - `PATCH /api/campaigns/[id]` - Update campaign config
   - `PATCH /api/campaign-attempts/[id]` - Update individual attempt
   - Validation: prevent reducing max_attempts below current progress
4. Default templates on attempt creation (30 min)
   - Copy from previous attempt as starting point
   - Allow customization per attempt
5. Test campaign editor with various scenarios (30 min)

**Database Schema:**
- Already supports this (no changes needed)

**Files to Create:**
- `app/(app)/dashboard/campaigns/[id]/edit/page.tsx`
- `components/campaigns/timeline-preview.tsx`

**Files to Modify:**
- API: `PATCH /api/campaigns/[id]`
- API: `PATCH /api/campaign-attempts/[id]`

---

### 2.2 Multi-Location UI Completion (4 hours)
**Priority:** ⭐⭐⭐⭐
**Impact:** Many SMBs have 2-3 locations
**Effort:** Medium

**Implementation Steps:**
1. Create `/dashboard/locations` page (1.5 hours)
   - List all locations
   - Add location dialog (name, address, timezone)
   - Edit/delete actions
   - Location selector for campaigns
2. Add location filter to analytics (1 hour)
   - Dropdown to filter by location
   - Location-scoped funnel metrics
   - Location comparison view
3. Add location assignment in customer upload (30 min)
   - Optional location column in CSV
   - Manual location assignment in customer form
4. Add location display in feedback portal (30 min)
   - Show which location feedback is for
   - Filter feedback by location
5. Update campaign creation to support location (30 min)
   - Optional location assignment
   - If assigned, only customers at that location receive emails

**Database Schema:**
- Already supports this (no changes needed)

**Files to Create:**
- `app/(app)/dashboard/locations/page.tsx`

**Files to Modify:**
- `app/(app)/dashboard/analytics/page.tsx`
- `app/(app)/dashboard/customers/page.tsx`
- `app/(app)/dashboard/feedback/page.tsx`
- API: Already exists, just need UI

---

### 2.3 Review Goal Gamification (2 hours)
**Priority:** ⭐⭐⭐
**Impact:** Encourages uploading more customers, sticky feature
**Effort:** Low-Medium

**Implementation Steps:**
1. Add goal setting in settings (30 min)
   - Monthly review goal (e.g., 50 reviews/month)
   - Store in `companies.monthly_review_goal`
2. Create goal progress component (1 hour)
   - Display on dashboard home page
   - Progress bar showing completion %
   - "23/50 reviews this month (46%)"
   - Color-coded: green (on track), yellow (behind), red (far behind)
3. Add achievement badges (30 min)
   - "First 10 Reviews", "50 Reviews in a Month", "100% Response Rate"
   - Store in `companies.achievements` (JSON array)
   - Display on settings page or dashboard

**Database Migration:**
```sql
ALTER TABLE companies ADD COLUMN monthly_review_goal INTEGER DEFAULT 50;
ALTER TABLE companies ADD COLUMN achievements JSONB DEFAULT '[]';
```

**Files to Modify:**
- `app/(app)/dashboard/page.tsx` (dashboard home)
- `app/(app)/dashboard/settings/page.tsx`
- Create: `components/goals/progress-widget.tsx`

---

### 2.4 Advanced Review Funnel Page (3 hours)
**Priority:** ⭐⭐⭐⭐⭐
**Impact:** Makes demos look amazing, boosts conversions
**Effort:** Medium

**Implementation Steps:**
1. Redesign `/track/[id]` page (2 hours)
   - Show company logo prominently (if uploaded)
   - Owner intro text: "We care about your experience"
   - Star rating with micro-animations (hover effects)
   - Clean feedback form design (better spacing, typography)
   - Custom thank-you page after submission
   - "What happens next" section (for negative reviews: "We'll reach out within 24 hours")
2. Add business intro customization (30 min)
   - Setting: `companies.review_page_intro_text`
   - Default: "Your feedback helps us improve!"
   - Editable in settings page
3. Add custom thank-you message (30 min)
   - Setting: `companies.thank_you_message`
   - Default: "Thank you for your feedback!"
   - Display after review submission

**Database Migration:**
```sql
ALTER TABLE companies ADD COLUMN review_page_intro_text TEXT DEFAULT 'Your feedback helps us improve!';
ALTER TABLE companies ADD COLUMN thank_you_message TEXT DEFAULT 'Thank you for your feedback!';
```

**Files to Modify:**
- `app/(public)/track/[id]/page.tsx`
- `app/(app)/dashboard/settings/page.tsx`

---

## Tier 3: Strategic Integrations (14-24 hours per integration)

### 3.1 Jobber OAuth Integration (10-14 hours)
**Priority:** ⭐⭐⭐⭐
**Impact:** Most requested integration for HVAC/plumbing/cleaning SMBs
**Effort:** High

**Why Jobber:**
- Most popular for target market (HVAC, plumbing, cleaning)
- Strong API documentation
- OAuth 2.0 support
- Customer data includes email, phone, address

**Implementation Steps:**
1. **Jobber OAuth Setup** (2 hours)
   - Register app in Jobber Developer Portal
   - Get client ID and secret
   - Configure redirect URI: `https://reviewboy.com/api/integrations/jobber/callback`
   - Store credentials in environment variables

2. **OAuth Flow Implementation** (3 hours)
   - Create `/api/integrations/jobber/authorize` endpoint
   - Redirect to Jobber OAuth page
   - Handle callback at `/api/integrations/jobber/callback`
   - Exchange code for access token
   - Store token in `companies.jobber_access_token` (encrypted)
   - Store refresh token in `companies.jobber_refresh_token`
   - Token expiry handling

3. **Customer Sync Service** (4 hours)
   - Create `lib/services/jobber-sync-service.ts`
   - Fetch customers from Jobber API (paginated)
   - Map Jobber fields to ReviewBoy customer schema:
     - `client.firstName + lastName` → `name`
     - `client.email` → `email`
     - `client.phoneNumber` → `phone`
     - `client.address` → `notes` or separate address field
   - Duplicate detection (by email)
   - Bulk import with transaction
   - Incremental sync (only new customers since last sync)

4. **Token Refresh Logic** (1 hour)
   - Automatic token refresh when expired
   - Error handling for revoked tokens
   - Notification to user if re-authorization needed

5. **UI Integration** (2 hours)
   - Add "Connect Jobber" button in settings
   - Show connection status (connected/disconnected)
   - Display last sync timestamp
   - Manual "Sync Now" button
   - Sync history log (successful/failed)
   - Disconnect button

6. **Scheduled Sync** (1 hour)
   - Inngest cron job: daily sync at 2 AM EST
   - Only sync companies with Jobber connected
   - Error handling and logging

7. **Testing** (1 hour)
   - Test OAuth flow
   - Test customer sync with sample Jobber account
   - Test token refresh
   - Test disconnect flow

**Database Migration:**
```sql
ALTER TABLE companies ADD COLUMN jobber_access_token TEXT;
ALTER TABLE companies ADD COLUMN jobber_refresh_token TEXT;
ALTER TABLE companies ADD COLUMN jobber_token_expires_at TIMESTAMP;
ALTER TABLE companies ADD COLUMN jobber_last_sync_at TIMESTAMP;

CREATE TABLE jobber_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  synced_at TIMESTAMP DEFAULT NOW(),
  customers_added INTEGER DEFAULT 0,
  customers_updated INTEGER DEFAULT 0,
  errors TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Files to Create:**
- `app/api/integrations/jobber/authorize/route.ts`
- `app/api/integrations/jobber/callback/route.ts`
- `lib/services/jobber-sync-service.ts`
- `lib/inngest/functions/jobber-sync.ts`

**Files to Modify:**
- `app/(app)/dashboard/settings/page.tsx`

---

### 3.2 Facebook Auto-Posting (4-5 hours)
**Priority:** ⭐⭐⭐⭐
**Impact:** Amplifies positive reviews, social proof
**Effort:** Medium

**Implementation Steps:**
1. **Facebook App Setup** (1 hour)
   - Create Facebook App in Meta Developer Console
   - Request `pages_manage_posts` permission
   - Configure OAuth redirect URI
   - Get App ID and secret

2. **OAuth Flow** (1.5 hours)
   - Create `/api/integrations/facebook/authorize` endpoint
   - Redirect to Facebook OAuth
   - Handle callback at `/api/integrations/facebook/callback`
   - Exchange code for page access token
   - Store token in `companies.facebook_page_token` (encrypted)
   - Store page ID in `companies.facebook_page_id`

3. **Auto-Posting Logic** (1.5 hours)
   - Trigger on new 5-star review submission
   - Format post: "[Customer Name] left us a 5-star review: [Review Text]"
   - Include star emoji (⭐⭐⭐⭐⭐)
   - Truncate if exceeds character limit
   - Post to Facebook page (not personal profile)
   - Handle errors (log, don't block review submission)

4. **UI & Settings** (1 hour)
   - "Connect Facebook" button in settings
   - Show connection status
   - Toggle auto-posting on/off
   - Manual post button for existing reviews
   - Post history log

**Database Migration:**
```sql
ALTER TABLE companies ADD COLUMN facebook_page_token TEXT;
ALTER TABLE companies ADD COLUMN facebook_page_id VARCHAR(255);
ALTER TABLE companies ADD COLUMN facebook_auto_post_enabled BOOLEAN DEFAULT false;

CREATE TABLE facebook_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  feedback_id UUID REFERENCES customer_feedback(id),
  facebook_post_id VARCHAR(255),
  posted_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT
);
```

**Files to Create:**
- `app/api/integrations/facebook/authorize/route.ts`
- `app/api/integrations/facebook/callback/route.ts`
- `lib/services/facebook-posting-service.ts`

---

## Tier 4: Nice to Have (6-10 hours)

### 4.1 Review Request Scheduler (2 hours)
**Priority:** ⭐⭐⭐
**Impact:** Sends at optimal times (e.g., 6pm local time)
**Effort:** Low-Medium

**Implementation Steps:**
1. Add scheduling settings (1 hour)
   - Setting: `companies.send_time_preference` (e.g., "18:00")
   - Setting: `companies.send_days` (e.g., "Mon-Fri")
   - UI in settings page with time picker and day selector
2. Update drip campaign service (1 hour)
   - Check customer timezone (fallback to company timezone)
   - Calculate optimal send time
   - Schedule emails for specific time window
   - Skip weekends if configured

**Database Migration:**
```sql
ALTER TABLE companies ADD COLUMN send_time_preference VARCHAR(5) DEFAULT '18:00';
ALTER TABLE companies ADD COLUMN send_days VARCHAR(20) DEFAULT 'Mon-Fri';
```

---

### 4.2 AI Subject Line Optimizer (1-2 hours)
**Priority:** ⭐⭐
**Impact:** A/B test suggestions, learn from open rates
**Effort:** Low

**Implementation Steps:**
1. Create subject line generator (1 hour)
   - OpenAI prompt: "Generate 3 subject line options for review request email"
   - Consider: business type, customer name, brand voice
   - Store suggestions in `templates.subject_line_options` (JSON array)
2. Add UI in template editor (30 min)
   - "Generate Subject Lines" button
   - Display 3 options
   - Select one to use
3. Track open rates (optional, 30 min)
   - Requires email tracking pixel (Resend may support)
   - Store open rate per template
   - Show in template editor

---

### 4.3 Owner Photo Upload to Supabase (2 hours)
**Priority:** ⭐⭐
**Impact:** Better UX than URL input
**Effort:** Low

**Implementation Steps:**
1. Use same approach as company logo upload (1.5 hours)
   - Supabase Storage bucket `owner-photos`
   - File upload in settings page
   - Store URL in `companies.owner_photo_url`
   - Keep URL input as fallback
2. Image optimization (30 min)
   - Resize to max 400x400
   - Convert to WebP for smaller file size
   - Generate thumbnail for email (200x200)

---

# 💰 UPSELL & PRICING STRATEGY

## Current Pricing
- **Standard Plan:** $49/month
  - 14-day free trial
  - Unlimited customers
  - 3 drip campaign attempts
  - Email + SMS
  - AI responses
  - QR codes
  - Basic analytics
  - 300 emails/day

## Potential Pricing Tiers (Post-Launch)

### Tier 1: Starter - $49/month (Current)
- Everything listed above
- Single location
- 3 campaign attempts
- 300 emails/day
- Basic support (email)

### Tier 2: Professional - $79/month
**Add-ons:**
- ✅ Multi-location support (up to 3 locations)
- ✅ 10 campaign attempts (more follow-ups)
- ✅ 1,000 emails/day
- ✅ Advanced analytics with charts
- ✅ Priority support (24-hour response)
- ✅ Custom branding (logo, colors)
- ✅ Facebook auto-posting

### Tier 3: Enterprise - $149/month
**Add-ons:**
- ✅ Unlimited locations
- ✅ Unlimited campaign attempts
- ✅ 5,000 emails/day
- ✅ Jobber/QuickBooks/ServiceTitan integration
- ✅ White-label option
- ✅ Dedicated account manager
- ✅ Phone support

## À La Carte Add-Ons

### SMS Package - $20/month
- Currently included in all plans
- Could separate to reduce base price to $39/month
- SMS costs ~$0.01/message (high margin)

### Extra Locations - $15/month per location
- Beyond the 3 included in Professional tier
- Useful for franchise businesses

### Advanced Analytics - $10/month
- Chart visualizations
- Export to CSV/PDF
- Custom date ranges
- Location comparison

### Review Widgets - $15/month
- All 3 widget types
- Unlimited embeds
- Customization options

### Native Integrations - $25/month each
- Jobber, QuickBooks, ServiceTitan, etc.
- Auto-sync customers daily
- Two-way data sync

## Revenue Projections (100 Customers)

**Scenario 1: All on Standard ($49/mo)**
- MRR: $4,900
- ARR: $58,800

**Scenario 2: Mix of Tiers (50% Standard, 30% Professional, 20% Enterprise)**
- Standard: 50 × $49 = $2,450
- Professional: 30 × $79 = $2,370
- Enterprise: 20 × $149 = $2,980
- **MRR: $7,800**
- **ARR: $93,600**

**Scenario 3: Add-Ons (25% take SMS, 20% take extra locations)**
- Base MRR from Scenario 2: $7,800
- SMS add-ons: 25 × $20 = $500
- Extra locations: 20 × $15 = $300
- **MRR: $8,600**
- **ARR: $103,200**

---

# 🎯 LAUNCH READINESS CHECKLIST

## Technical Readiness
- [x] All core features complete
- [x] Data integrity (validation + transactions)
- [x] Background jobs (Inngest)
- [x] Email infrastructure (Resend)
- [x] SMS infrastructure (Twilio, pending A2P)
- [x] AI responses (OpenAI)
- [x] Billing (Stripe)
- [x] Analytics
- [ ] Final testing (2-3 hours)
- [ ] Production deployment (1-2 hours)

## Content Readiness
- [x] Landing page complete
- [x] Legal documents (Privacy, Terms, Cookies)
- [ ] Demo video (optional, can defer)
- [ ] VA training materials (2 hours)
- [ ] Seed demo data (1 hour)

## Business Readiness
- [ ] Stripe live mode enabled
- [ ] Twilio A2P approval (pending)
- [ ] Support email configured
- [ ] Monitoring and alerts set up
- [ ] Backup plan for email limits

## Marketing Readiness
- [x] Value proposition clear
- [x] Pricing strategy defined
- [x] Target market identified (HVAC, plumbing, cleaning, auto)
- [ ] VA cold calling scripts
- [ ] Customer onboarding email sequence (optional)

---

# 📊 SUCCESS METRICS

## Week 1 Targets (Dec 1-7)
- 5-10 trial signups
- 2-3 paid conversions
- <5% error rate in logs
- 100% uptime

## Month 1 Targets (December)
- 25-50 trial signups
- 10-20 paid customers
- $500-1,000 MRR
- 5+ positive customer testimonials

## Month 3 Targets (Feb 2026)
- 100+ trial signups
- 50+ paid customers
- $2,500-5,000 MRR
- Identify top integration request (build first)

---

# 🛠️ FUTURE FEATURE IDEAS

## Phase 2 (Q1 2026)
- Chart visualization (Tier 1.1)
- Widget templates (Tier 1.2)
- Company branding (Tier 1.3)
- Customer tags (Tier 1.4)
- Drip campaign editor (Tier 2.1)
- Multi-location UI (Tier 2.2)

## Phase 3 (Q2 2026)
- Jobber integration (Tier 3.1)
- Facebook auto-posting (Tier 3.2)
- QuickBooks integration
- Advanced analytics
- Review scheduler

## Phase 4 (Q3 2026)
- White-label option (for agencies)
- API for third-party developers
- Mobile app (iOS/Android)
- Advanced reporting (custom dashboards)
- Sentiment analysis trends

## Phase 5 (Q4 2026)
- Instagram auto-posting
- TikTok integration
- Video review requests
- AI voice responses (phone calls)
- Competitor review monitoring

---

# 📝 NOTES

## Design Decisions
- **Permissive Google URL validation** - Won't block unusual but valid URLs
- **Dual-channel approach** - SMS+Email for maximum reach
- **AI response opt-in** - Manual review before sending (builds trust)
- **Transaction-based updates** - All multi-step operations are atomic
- **Feature flags** - Easy to toggle SMS, widgets, auto-send

## Technical Debt
- Email HTML formatting logic duplicated (consolidate post-launch)
- Chart library not yet added (tables only)
- Widget templates architecture ready but HTML not implemented
- **Scheduled Jobs Table Refactor** - Replace on-the-fly campaign processing with a `scheduled_jobs` table:
  - When customer is added, create rows for all scheduled emails (e.g., Day 0, Day 3, Day 10)
  - Inngest cron polls table every 5-15 min for `scheduled_at <= now() AND status = 'pending'`
  - Check subscription status at execution time (not creation)
  - Benefits: easier debugging, visibility into what's scheduled, simple cancellation/pause logic

## Known Limitations
- Twilio A2P approval pending (SMS works in development)
- No native CRM integrations yet (CSV + Zapier workaround)
- Analytics charts use table format (chart library pending)
- No saved filter views in feedback portal

## Sales Tools (Build When Needed)
- **Admin Panel for Custom Deals** - Currently using manual Stripe dashboard override for custom pricing/trials (e.g., $30/mo + 30-day trial instead of $49/14 days). Works for solo sales but need admin panel when onboarding sales reps who can't access Stripe. Panel should let you:
  - Enter customer email (optional)
  - Set custom price ($30-49 range)
  - Set custom trial days (14-30 range)
  - Generate one-time checkout link to send to customer
  - Track which deals were given discounts

- **Dynamic Billing Page Pricing** (~15 min) - Billing page currently shows hardcoded "$49/month". Should display actual subscription price for customers on custom deals. Fix:
  - Add `stripe_price_amount` (integer, cents) to companies schema
  - Update webhook to extract `unit_amount` from subscription items on create/update
  - Update billing page to show `${priceAmount / 100}/month` instead of hardcoded "$49"

---

*Last Updated: November 21, 2025*
*Status: Production Ready - Awaiting Final Testing & Deployment*
*Next Milestone: VA Training on November 26, 2025*
