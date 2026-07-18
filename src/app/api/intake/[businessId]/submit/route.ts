import { NextRequest, NextResponse, after } from "next/server";
import { headers } from "next/headers";
import { getBusinessById } from "@/lib/db/queries/businesses";
import {
  getLeadById,
  getLeadByPhoneAndBusiness,
  createLead,
  updateLead,
} from "@/lib/db/queries/leads";
import { cancelFollowupsForLead } from "@/lib/db/queries/followups";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { scoreLeadFromAnswers } from "@/lib/leads/scoring";
import { assessLead } from "@/lib/leads/assess";
import { sendLeadPacketEmail } from "@/lib/email/notifications";
import { sendLeadPushNotification } from "@/lib/push/send";
import { buildLeadPushPayload } from "@/lib/push/payload";
import { logger } from "@/lib/logger";
import type { Answers } from "@/lib/verticals/filterAnswers";

async function checkRateLimit(ip: string): Promise<boolean> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return true;
  }
  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "intake",
    });
    const { success } = await limiter.limit(ip);
    return success;
  } catch {
    return true;
  }
}

async function assessAndNotify(
  leadId: string,
  businessId: string,
  answers: Answers
) {
  try {
    const business = await getBusinessById(businessId);
    if (!business) return;

    const config = await getVerticalConfig(business.vertical);
    if (!config) return;

    const scores = scoreLeadFromAnswers(answers, config.scoringRules, config.questions, config.baseValueLow);
    const reasoning = await assessLead(leadId, answers, scores, config.aiPromptTemplate);

    const lead = await getLeadById(leadId);
    if (!lead) return;

    if (business.notificationPreferences?.qualifiedLead === false) return;

    // Email and push are independent channels — a failure in one must not skip
    // the other (push is the primary, more-reliable alert), so the email gets its
    // own try/catch rather than sharing the outer one.
    try {
      await sendLeadPacketEmail({
        ownerEmail: business.ownerEmail,
        ownerName: business.ownerName,
        businessName: business.businessName,
        leadId,
        callerName: lead.callerName,
        callerPhone: lead.callerPhone,
        urgencyScore: scores.urgencyScore,
        qualityScore: scores.qualityScore,
        estimatedValueLow: scores.estimatedValueLow,
        estimatedValueHigh: scores.estimatedValueHigh,
        urgencyReasoning: reasoning.urgencyReasoning,
        qualityReasoning: reasoning.qualityReasoning,
        recommendedActions: reasoning.recommendedActions,
        intakeAnswers: answers,
        questions: config.questions,
      });
    } catch (err) {
      logger.error("lead packet email failed", { leadId, error: String(err) });
    }

    // Push-primary operator alert (PWA/browser). Fire alongside the email; never
    // throws, prunes dead subscriptions itself. Default-on unless turned off.
    if (business.notificationPreferences?.pushNewLead !== false) {
      await sendLeadPushNotification(
        businessId,
        buildLeadPushPayload({
          leadId,
          callerName: lead.callerName,
          urgencyScore: scores.urgencyScore,
          estimatedValueLow: scores.estimatedValueLow,
          estimatedValueHigh: scores.estimatedValueHigh,
        }),
      );
    }
  } catch (err) {
    logger.error("assessAndNotify failed", { leadId, error: String(err) });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { leadId, callerName, callerPhone, callerEmail, answers, source, serviceRequested } = body;

  if (!callerName?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!callerPhone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }

  const phoneResult = validateAndNormalizePhone(callerPhone);
  if (!phoneResult.isValid) {
    return NextResponse.json({ error: phoneResult.error }, { status: 422 });
  }
  const normalizedPhone = phoneResult.normalized!;

  const business = await getBusinessById(businessId);
  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  let lead = leadId ? await getLeadById(leadId) : null;
  if (!lead) {
    lead = await getLeadByPhoneAndBusiness(normalizedPhone, businessId);
  }

  const intakePayload = {
    callerName: callerName.trim(),
    callerPhone: normalizedPhone,
    callerEmail: callerEmail?.trim() || null,
    smsConsent: true,
    intakeAnswers: answers ?? {},
    // The caller's own words for their service — set by the form's "Other" option
    // when they request something not on the configured list (off-list, no quote).
    serviceRequested:
      typeof serviceRequested === "string" && serviceRequested.trim() ? serviceRequested.trim() : null,
    // leadStatus is deliberately NOT set here — re-submitting intake for an
    // existing lead must never regress sales progress the business already made.
    intakeStatus: "completed" as const,
  };

  if (lead) {
    lead = await updateLead(lead.id, intakePayload);
    // Cancel any pending follow-up — they engaged, no need to nudge
    after(() =>
      cancelFollowupsForLead(lead!.id, "intake_completed").catch((err) =>
        logger.error("cancelFollowupsForLead failed", { leadId: lead!.id, error: String(err) })
      )
    );
  } else {
    const validSources = ["voice_overflow", "website_widget", "direct_intake", "email", "manual"] as const;
    const leadSource = validSources.includes(source) ? source : "direct_intake";
    lead = await createLead({
      businessId,
      source: leadSource,
      ...intakePayload,
    });
  }

  // Score + AI assess + email/push the owner. Runs after the response so the
  // form still returns instantly, but via `after()` (not bare `void`) so Vercel
  // keeps the function alive until it finishes — otherwise the lead alert, the
  // core product promise, silently never fires in prod. assessAndNotify catches
  // its own errors internally.
  after(() => assessAndNotify(lead!.id, businessId, answers ?? {}));

  return NextResponse.json({ leadId: lead!.id }, { status: 200 });
}
