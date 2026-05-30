import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getBusinessById } from "@/lib/db/queries/businesses";
import {
  getLeadById,
  getLeadByPhoneAndBusiness,
  createLead,
  updateLead,
} from "@/lib/db/queries/leads";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { inngest } from "@/lib/inngest/client";

async function checkRateLimit(ip: string): Promise<boolean> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return true; // skip in local dev
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
    return true; // don't block on Upstash errors
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;

  // Rate limit by IP
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

  // Parse body
  const body = await req.json();
  const { leadId, callerName, callerPhone, smsConsent, answers } = body;

  if (!callerName?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!callerPhone) {
    return NextResponse.json(
      { error: "Phone number is required." },
      { status: 400 }
    );
  }
  if (!smsConsent) {
    return NextResponse.json(
      { error: "SMS consent is required." },
      { status: 400 }
    );
  }

  const phoneResult = validateAndNormalizePhone(callerPhone);
  if (!phoneResult.isValid) {
    return NextResponse.json({ error: phoneResult.error }, { status: 422 });
  }
  const normalizedPhone = phoneResult.normalized!;

  // Verify business exists
  const business = await getBusinessById(businessId);
  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  // Find or create the lead
  let lead = leadId ? await getLeadById(leadId) : null;

  // If leadId given but not found (e.g. stale link), fall back to phone lookup
  if (!lead) {
    lead = await getLeadByPhoneAndBusiness(normalizedPhone, businessId);
  }

  const intakePayload = {
    callerName: callerName.trim(),
    callerPhone: normalizedPhone,
    smsConsent: true,
    intakeAnswers: answers ?? {},
    status: "intake_completed" as const,
  };

  if (lead) {
    lead = await updateLead(lead.id, intakePayload);
  } else {
    lead = await createLead({
      businessId,
      source: "embed",
      ...intakePayload,
    });
  }

  // Fire Inngest event — picked up by scoring + AI assessment in Session 5/6
  await inngest.send({
    name: "intake/completed",
    data: {
      leadId: lead!.id,
      businessId,
    },
  });

  return NextResponse.json({ leadId: lead!.id }, { status: 200 });
}
