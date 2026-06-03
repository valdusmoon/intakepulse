import { NextRequest, NextResponse } from "next/server";
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

    const scores = scoreLeadFromAnswers(answers, config.scoringRules, config.questions);
    const reasoning = await assessLead(leadId, answers, scores, config.aiPromptTemplate);

    const lead = await getLeadById(leadId);
    if (!lead) return;

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
  const { leadId, callerName, callerPhone, callerEmail, smsConsent, answers, source } = body;

  if (!callerName?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!callerPhone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }
  if (!smsConsent) {
    return NextResponse.json({ error: "SMS consent is required." }, { status: 400 });
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
    status: "intake_completed" as const,
  };

  if (lead) {
    lead = await updateLead(lead.id, intakePayload);
    // Cancel any pending follow-up — they engaged, no need to nudge
    void cancelFollowupsForLead(lead!.id, "intake_completed");
  } else {
    const validSources = ["missed_call", "embed", "email", "manual"] as const;
    const leadSource = validSources.includes(source) ? source : "embed";
    lead = await createLead({
      businessId,
      source: leadSource,
      ...intakePayload,
    });
  }

  // Score + AI assess + email owner — fire and forget, form responds instantly
  void assessAndNotify(lead!.id, businessId, answers ?? {});

  return NextResponse.json({ leadId: lead!.id }, { status: 200 });
}
