import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse, after } from "next/server";
import { createBusiness, getBusinessByClerkId, updateBusiness } from "@/lib/db/queries/businesses";
import { createPricingRulesBulk } from "@/lib/db/queries/pricingRules";
import { sendSignupNotification, sendWelcomeEmail } from "@/lib/email/notifications";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";
import { SUPPORTED_TIMEZONES } from "@/lib/utils/datetime";
import { PRICING_TEMPLATES } from "@/lib/verticals/pricingTemplates";
import { logger } from "@/lib/logger";

const KNOWN_VERTICALS = Object.keys(PRICING_TEMPLATES);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  return NextResponse.json(business);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { businessName, ownerName, ownerEmail, ownerPhone, serviceArea, vertical, twilioPhoneNumber, subscriptionStatus, trialEndsAt } = body;

  if (!businessName || !ownerName) {
    return NextResponse.json({ error: "businessName and ownerName are required" }, { status: 400 });
  }

  const emailResult = validateAndNormalizeEmail(ownerEmail ?? "");
  if (ownerEmail && !emailResult.isValid) {
    return NextResponse.json({ error: emailResult.error }, { status: 422 });
  }

  let normalizedPhone: string | null = null;
  if (ownerPhone) {
    const phoneResult = validateAndNormalizePhone(ownerPhone);
    if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });
    normalizedPhone = phoneResult.normalized!;
  }

  let normalizedTwilioNumber: string | null = null;
  if (twilioPhoneNumber) {
    const phoneResult = validateAndNormalizePhone(twilioPhoneNumber);
    if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });
    normalizedTwilioNumber = phoneResult.normalized!;
  }

  // Onboarding submits the whole form in one shot at the very end (business
  // info + vertical + chosen number + trial state), so a business existing at
  // all is itself proof onboarding finished — this only hits the update branch
  // on a double-submit (e.g. a retried request after a network hiccup).
  const existing = await getBusinessByClerkId(userId);
  const resolvedVertical = KNOWN_VERTICALS.includes(vertical) ? vertical : existing?.vertical ?? "other";

  if (existing) {
    const updated = await updateBusiness(existing.id, {
      businessName,
      ownerName,
      ownerEmail: emailResult.normalized ?? existing.ownerEmail,
      ownerPhone: normalizedPhone ?? existing.ownerPhone ?? null,
      forwardingNumber: normalizedPhone ?? existing.forwardingNumber ?? null,
      serviceArea: serviceArea ?? null,
      vertical: resolvedVertical,
      twilioPhoneNumber: normalizedTwilioNumber ?? existing.twilioPhoneNumber ?? null,
      subscriptionStatus: subscriptionStatus ?? existing.subscriptionStatus ?? null,
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : existing.trialEndsAt ?? null,
    });
    return NextResponse.json(updated, { status: 200 });
  }

  const business = await createBusiness({
    clerkUserId: userId,
    businessName,
    ownerName,
    ownerEmail: emailResult.normalized ?? ownerEmail ?? "",
    ownerPhone: normalizedPhone,
    forwardingNumber: normalizedPhone,
    serviceArea: serviceArea ?? null,
    vertical: resolvedVertical,
    twilioPhoneNumber: normalizedTwilioNumber,
    subscriptionStatus: subscriptionStatus ?? null,
    trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
  });

  const starterRules = PRICING_TEMPLATES[resolvedVertical] ?? [];
  try {
    await createPricingRulesBulk(
      starterRules.map((rule) => ({
        businessId: business.id,
        vertical: resolvedVertical,
        serviceCategory: rule.serviceCategory,
        pricingType: rule.pricingType,
        minimumAmount: rule.minimumAmount ?? null,
        maximumAmount: rule.maximumAmount ?? null,
        fixedAmount: rule.fixedAmount ?? null,
        startingAmount: rule.startingAmount ?? null,
        approvedCustomerMessage: rule.approvedCustomerMessage,
        isActive: true,
      }))
    );
  } catch (error) {
    logger.error("Failed to create starter pricing rules for new business", {
      businessId: business.id,
      vertical: resolvedVertical,
      error: String(error),
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://callverted.com";
  const dashboardUrl = `${appUrl}/dashboard`;

  // Post-response via `after()` (not bare `void`, which Vercel freezes before it
  // runs) so the founder alert and the owner's welcome email actually send in prod.
  after(async () => {
    try {
      await sendSignupNotification({ businessName, ownerName, ownerEmail: ownerEmail ?? "", ownerPhone: normalizedPhone ?? "" });
    } catch (err) {
      logger.error("signup notification failed", { businessName, error: String(err) });
    }
    try {
      await sendWelcomeEmail({ ownerName, ownerEmail: ownerEmail ?? "", businessName, dashboardUrl });
    } catch (err) {
      logger.error("welcome email failed", { ownerEmail, error: String(err) });
    }
  });

  return NextResponse.json(business, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await req.json();

  if (body.ownerPhone) {
    const r = validateAndNormalizePhone(body.ownerPhone);
    if (!r.isValid) return NextResponse.json({ error: r.error }, { status: 422 });
    body.ownerPhone = r.normalized;
  }

  if (body.forwardingNumber) {
    const r = validateAndNormalizePhone(body.forwardingNumber);
    if (!r.isValid) return NextResponse.json({ error: r.error }, { status: 422 });
    body.forwardingNumber = r.normalized;
  }

  if (body.twilioPhoneNumber) {
    const r = validateAndNormalizePhone(body.twilioPhoneNumber);
    if (!r.isValid) return NextResponse.json({ error: r.error }, { status: 422 });
    body.twilioPhoneNumber = r.normalized;
  }

  if (body.urgentTransferNumber) {
    const r = validateAndNormalizePhone(body.urgentTransferNumber);
    if (!r.isValid) return NextResponse.json({ error: r.error }, { status: 422 });
    body.urgentTransferNumber = r.normalized;
  }

  // Timezone drives server-side date formatting + report bucketing (AT TIME ZONE),
  // so only accept known IANA zones — an arbitrary string would throw at format time.
  if (body.timezone && !SUPPORTED_TIMEZONES.some((t) => t.value === body.timezone)) {
    return NextResponse.json({ error: "Unsupported timezone" }, { status: 422 });
  }

  const allowed = [
    "businessName", "ownerName", "ownerPhone", "ownerEmail",
    "serviceArea", "timezone",
    "forwardingNumber", "notificationPreferences",
    "twilioPhoneNumber", "overflowMode", "recordingEnabled", "recordingDisclosure",
    "urgentTransferNumber", "greetingMessage", "aiInstructions", "voiceName", "callTimeoutSeconds",
    "isPaused", // pause/resume the live line (churn-deflection alternative to canceling)
    "numberPublished", // activation: owner confirms they published their Callverted number
  ] as const;
  const safeBody = Object.fromEntries(
    allowed.filter((k) => k in body).map((k) => [k, body[k]])
  );

  const updated = await updateBusiness(business.id, safeBody);
  return NextResponse.json(updated);
}
