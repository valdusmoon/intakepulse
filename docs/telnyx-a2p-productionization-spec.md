# Telnyx Productionization + Multi-Tenant A2P Registration — Engineering Spec

> ⛔ **DEFERRED / SUPERSEDED (2026-07).** The product pivoted to a **voice-first AI overflow
> receptionist** with **no customer-facing SMS in V1**, which removes A2P 10DLC from scope entirely.
> The active plan of record is now **`docs/callverted-voice-first-implementation-plan.md`**.
> Keep this doc only for the day SMS/A2P returns as an optional registered module (spec §"Later features").

> Saved spec / agent prompt. Not yet executed. This is the plan of record for hardening the
> existing Telnyx runtime and building the foundation for multi-tenant A2P 10DLC registration.
>
> **Note on route paths:** this spec references `/api/telnyx/calls`, but the current repo route is
> `/api/telnyx/call` (singular). Confirm the actual path before wiring.

You are working inside the Callverted repository.

Callverted is a multi-tenant SaaS for high-ticket home-service businesses. It forwards inbound
calls to a trade's real phone number. When a call is genuinely missed, it creates a lead and sends
a service-related SMS to the caller.

## Current stack

- Next.js 15 App Router
- TypeScript
- Vercel
- Supabase Postgres
- Drizzle ORM
- Clerk
- Stripe
- Inngest
- Resend
- OpenAI
- Telnyx Voice and Messaging APIs

## Current Telnyx runtime

- One platform-wide `TELNYX_API_KEY`
- One Telnyx number assigned to each business
- `POST /v2/calls/{callControlId}/actions/transfer`
- `POST /v2/messages`
- Voice webhook at `/api/telnyx/calls`
- Messaging webhook at `/api/telnyx/sms`
- Business resolution is performed using the called Telnyx number
- Calls, leads, smsEvents, and followups already exist
- Phone-number provisioning and A2P registration are currently manual
- Webhook signature verification may currently be disabled
- SMS sending is protected by an `SMS_FEATURE_ENABLED` kill switch

## Goal

Audit and productionize the existing Telnyx architecture, then create the foundation for
multi-tenant A2P registration.

**Do not switch the project to Twilio. Do not replace working application patterns unnecessarily.
Follow the existing conventions in the repository.**

## Inspect first

Start by inspecting the entire relevant repository. Locate:

- Drizzle schemas and migrations
- Business onboarding
- Telnyx client utilities
- Voice and SMS webhook routes
- Call finalization logic
- Lead creation
- SMS sending
- Follow-up scheduling and cancellation
- Inngest functions
- Environment validation
- Existing tests
- Logging and error-handling utilities

## Audit (before changing code)

Create a concise audit that explains:

1. The current call lifecycle.
2. How Telnyx call legs and sessions are stored.
3. How the code currently determines answered versus missed.
4. Whether `call.answered` can incorrectly mark the transferred call as answered.
5. Whether voicemail pickup is treated as an answer.
6. Whether webhook processing is idempotent.
7. Whether webhook signatures are verified using the raw request body.
8. Whether outbound SMS is properly gated.
9. Whether STOP and other opt-out messages are suppressed globally.
10. Any data-isolation risks between tenants.

Then implement the following in safe, reviewable phases.

## PHASE 1 — Secure the existing runtime

- Re-enable Telnyx Ed25519 webhook signature verification for both voice and messaging webhooks.
- Verify signatures against the exact raw request body.
- Add timestamp freshness validation to reduce replay risk.
- Return a 2xx response quickly and perform non-trivial work asynchronously.
- Persist every provider event ID in a `providerWebhookEvents` table.
- Add a unique constraint on provider plus `providerEventId`.
- Ignore duplicate webhook deliveries safely.
- Never log secrets, full authorization headers, EINs, or complete message bodies in production logs.
- Preserve the `SMS_FEATURE_ENABLED` kill switch.

## PHASE 2 — Correct call-state determination

- Model the inbound caller leg and transferred destination leg separately.
- Correlate them using `call_session_id`, `call_leg_id`, and `call_control_id`.
- Do not consider an arbitrary `call.answered` event proof that the business answered.
- Prefer a correctly correlated destination answer plus `call.bridged` event as the successful connection signal.
- Store terminal hangup causes.
- Make missed-call finalization idempotent.
- Finalize a call through an Inngest job after terminal events have settled rather than creating a lead directly from the first hangup webhook.
- Ensure exactly one missed-call lead can be created for a call session.
- Document how voicemail pickup behaves.
- Add a configuration placeholder for answering-machine detection, but do not enable it globally without an explicit business setting.

## PHASE 3 — Normalize messaging compliance data

Do not put every provider object directly on the `businesses` table.

Add normalized tables or equivalent structures for:

### 1. messagingRegistrations
- id
- businessId
- provider
- registrationType
- status
- providerStatus
- failureCode
- failureReason
- submittedAt
- approvedAt
- rejectedAt
- suspendedAt
- createdAt
- updatedAt

### 2. messagingBrands
- id
- businessId
- registrationId
- providerBrandId
- tcrBrandId
- entityType
- legalName
- displayName
- einEncrypted (or a reference to securely stored EIN data)
- einIssuingCountry
- address fields
- website
- contact fields
- identityStatus
- vettingStatus
- vettingScore
- rawProviderStatus
- createdAt
- updatedAt

### 3. messagingCampaigns
- id
- businessId
- brandId
- providerCampaignId
- tcrCampaignId
- useCase
- description
- messageFlow
- sampleMessages
- optInKeywords
- optInMessage
- optOutKeywords
- optOutMessage
- helpKeywords
- helpMessage
- embeddedLinks
- embeddedPhoneNumbers
- privacyPolicyUrl
- termsUrl
- status
- failureCode
- failureReason
- createdAt
- updatedAt

### 4. businessPhoneNumbers
- id
- businessId
- provider
- phoneNumber
- providerNumberId
- messagingProfileId
- voiceConnectionId
- campaignId
- status
- purchasedAt
- assignedAt
- releasedAt
- createdAt
- updatedAt

### 5. smsConsents
- id
- businessId
- leadId
- campaignId
- phoneNumber
- consentType
- consentBasis
- consentText
- source
- capturedAt
- ipAddress
- userAgent
- revokedAt
- createdAt

### 6. smsSuppressions
- id
- businessId
- phoneNumber
- scope
- reason
- sourceMessageId
- suppressedAt
- releasedAt
- createdAt

Use encrypted or appropriately protected storage for EIN and sensitive identity data. Do not
expose EIN values through client-side APIs.

Add a denormalized `messagingRegistrationStatus` field to `businesses` only if useful for dashboard
queries.

## PHASE 4 — Registration state machine

Implement an explicit state machine. Do not infer the entire state from the presence of IDs.

Support at least:

- draft
- business_profile_complete
- brand_submitted
- brand_pending
- brand_verified
- brand_rejected
- campaign_draft
- campaign_submitted
- tcr_pending
- telnyx_review
- mno_pending
- mno_provisioned
- campaign_rejected
- appeal_pending
- number_ordered
- number_assignment_pending
- number_assignment_failed
- live
- suspended
- expired
- canceled

Make transitions idempotent and validated. Record transition history.

Do not mark a tenant `live` until:

- The Brand is verified.
- The Campaign has reached the provider-approved and MNO-provisioned state required by Telnyx.
- The phone number is assigned to the correct messaging profile and campaign.
- Webhook endpoints are configured.
- The business has an approved consent/message-flow configuration.
- `SMS_FEATURE_ENABLED` is enabled for the relevant environment and tenant.

## PHASE 5 — EIN and Sole Proprietor onboarding

Add an onboarding branch:

- **Business has an EIN or Tax ID:**
  - Register using the appropriate Standard or Low-Volume Standard path.
  - Collect exact legal name, EIN, issuing country, physical address, website, business phone, business email, vertical, and authorized representative.

- **True individual with no EIN:**
  - Use the Sole Proprietor path.
  - Collect the owner's verified mobile number.
  - Support Telnyx SMS OTP trigger and OTP verification.
  - Enforce provider limitations such as one campaign and one number where applicable.

Do not classify a sole proprietor with an EIN as a Sole Proprietor Brand.

Validate:

- Legal name is not a DBA unless the provider explicitly permits it.
- Website is public and reachable.
- Website identifies the business.
- Privacy Policy and Terms pages are public.
- Opt-in URLs do not require authentication.
- Required phone numbers use E.164.
- US addresses use normalized state and postal-code formats.

## PHASE 6 — Telnyx provider layer

Create a typed Telnyx provider module rather than scattering fetch calls throughout route handlers.

It should support:

- Creating and retrieving Brands
- Triggering and verifying Sole Proprietor OTP
- Creating and retrieving Campaigns
- Appealing or resubmitting rejected Campaigns where supported
- Searching available numbers
- Ordering a number
- Creating or assigning a messaging profile
- Assigning a phone number to a Campaign
- Sending SMS
- Transferring calls
- Verifying webhooks

Use idempotency keys or stable reference IDs wherever Telnyx supports them.

Do not assume that Callverted needs a direct TCR CSP account. Make the integration configurable for:

- Telnyx-native Brand and Campaign registration
- Telnyx partner/shared Campaign registration

Add documentation noting that Telnyx must confirm which architecture and campaign use case are
enabled for the Callverted account before production registration is automated.

## PHASE 7 — Consent and opt-out enforcement

Do not assume that placing a voice call automatically grants permission for recurring SMS.

Support explicit consent strategies:

- disclosed_single_message
- ivr_opt_in
- web_form_opt_in
- sms_keyword_opt_in
- verbal_recorded_opt_in

Store the exact consent basis.

Before sending any SMS:

1. Check tenant SMS enablement.
2. Check campaign and number status.
3. Check global and tenant-level suppression.
4. Check whether the message type requires consent.
5. Check that the consent scope covers the business, campaign, phone number, and message type.

The delayed follow-up must require an eligible consent record.

When an inbound message expresses opt-out intent:

- Cancel all pending follow-ups.
- Create or update the suppression record.
- Mark consent revoked.
- Prevent future sends.
- Allow only the legally and operationally appropriate opt-out confirmation.
- Support STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT, and obvious natural-language requests.

Implement HELP handling and log provider-generated auto-responses when available.

## PHASE 8 — Tests

Add tests for:

- Duplicate voice webhooks
- Duplicate SMS webhooks
- Invalid webhook signatures
- Stale webhook timestamps
- Destination leg answered and bridged
- Caller hangs up before destination answers
- Transfer timeout
- Busy destination
- Voicemail or machine-answer behavior
- Out-of-order answered, bridged, and hangup events
- Exactly one lead per missed call
- Exactly one immediate recovery SMS
- Follow-up cancellation on inbound reply
- Follow-up blocked without consent
- STOP suppression
- Natural-language opt-out
- Cross-tenant phone-number isolation
- Rejected Brand and Campaign transitions
- Number assignment failure
- Sole Proprietor OTP success and failure

Use existing testing tools and repository patterns. Do not introduce a large new framework without
necessity.

## PHASE 9 — Deliverables

At completion, provide:

- Audit findings
- Files changed
- Database migration summary
- New environment variables
- State-machine diagram
- Updated call lifecycle diagram
- Consent enforcement explanation
- Telnyx account-level questions that still require confirmation
- Tests added and their results
- Remaining risks
- Manual production-launch checklist

## Important constraints

- Maintain strict tenant isolation.
- Prefer small, typed modules.
- Use transactions where multiple database records must remain consistent.
- Do not perform destructive migrations.
- Do not expose provider secrets or sensitive business identity information.
- Do not claim that a messaging workflow is legally compliant merely because it passes provider validation.
- Clearly mark decisions requiring telecommunications counsel or Telnyx compliance approval.
- When repository details are ambiguous, make the safest reasonable assumption, implement only reversible changes, and document the assumption rather than stopping unnecessarily.
