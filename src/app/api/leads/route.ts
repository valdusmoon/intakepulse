import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBusinessByClerkId } from "@/lib/db/queries/businesses";
import { createLead, getLeadsByBusiness } from "@/lib/db/queries/leads";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { getVerticalConfig } from "@/lib/db/queries/verticalConfigs";
import { scoreLeadFromAnswers, type ScoringResult } from "@/lib/leads/scoring";
import type { Answers } from "@/lib/verticals/filterAnswers";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const leadStatus = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 25), 100);
  const offset = Number(searchParams.get("offset") ?? 0);

  const leads = await getLeadsByBusiness(business.id, { leadStatus, search, limit, offset });
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await req.json();
  const { callerName, callerPhone, callerEmail, notes, source, intakeAnswers } = body;

  if (!callerPhone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

  const phoneResult = validateAndNormalizePhone(callerPhone);
  if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });

  const validSources = ["manual", "email", "website_widget", "direct_intake"] as const;
  const leadSource = validSources.includes(source) ? source : "manual";

  // A hand-entered lead is scored on the same engine as every other source, so it
  // ranks in the priority queue rather than sitting outside it. Scoring is skipped
  // when the person entering it didn't know the answers — an unscored lead is
  // still a lead, it just can't be ranked.
  const answers: Answers = intakeAnswers && typeof intakeAnswers === "object" ? intakeAnswers : {};
  const hasAnswers = Object.keys(answers).length > 0;

  let scores: ScoringResult | null = null;
  if (hasAnswers) {
    const config = await getVerticalConfig(business.vertical);
    if (config) {
      scores = scoreLeadFromAnswers(answers, config.scoringRules, config.questions, config.baseValueLow);
    }
  }

  const lead = await createLead({
    businessId: business.id,
    callerName: callerName?.trim() || null,
    callerPhone: phoneResult.normalized!,
    callerEmail: callerEmail?.trim() || null,
    source: leadSource,
    intakeAnswers: answers,
    // "completed" only when the vertical's questions were actually answered here;
    // contact-details-only entries stay 'not_started', which is what they are.
    intakeStatus: scores ? "completed" : "not_started",
    notes: notes?.trim() || null,
    ...(scores
      ? {
          urgencyScore: scores.urgencyScore,
          qualityScore: scores.qualityScore,
          priorityScore: scores.priorityScore,
          scoreTrace: scores.trace,
          estimatedValueLow: scores.estimatedValueLow,
          estimatedValueHigh: scores.estimatedValueHigh,
        }
      : {}),
  });

  return NextResponse.json(lead, { status: 201 });
}
