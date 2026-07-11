import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { createEmailCapture } from "@/lib/db/queries/emailCaptures";
import { sendMissedCallBreakdownEmail } from "@/lib/email/notifications";
import { logger } from "@/lib/logger";

// Basic email shape check — the real gate is that a confirmation email has to
// actually land, so we keep validation lightweight and let Resend be the judge.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_SOURCES = ["roi_calculator", "lead_magnet"] as const;
type Source = (typeof VALID_SOURCES)[number];

// Same limiter shape as the public intake route: Upstash sliding window when
// configured, otherwise a no-op that lets requests through (dev/preview).
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
      prefix: "capture",
    });
    const { success } = await limiter.limit(ip);
    return success;
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));
  const { email, source, context } = body as {
    email?: string;
    source?: string;
    context?: Record<string, unknown>;
  };

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const captureSource: Source = VALID_SOURCES.includes(source as Source)
    ? (source as Source)
    : "lead_magnet";

  const cleanContext =
    context && typeof context === "object" && !Array.isArray(context) ? context : null;

  await createEmailCapture({
    email: normalizedEmail,
    source: captureSource,
    context: cleanContext,
  });

  // Confirmation email is fire-and-forget — a send failure must never fail the
  // capture. We only echo ROI numbers when they're present and numeric.
  const toNum = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  void sendMissedCallBreakdownEmail({
    toEmail: normalizedEmail,
    missedCalls: toNum(cleanContext?.missedCalls),
    jobValue: toNum(cleanContext?.jobValue),
    closeRate: toNum(cleanContext?.closeRate),
    atRisk: toNum(cleanContext?.atRisk),
  }).catch((err) => {
    logger.error("capture confirmation email failed", { email: normalizedEmail, error: String(err) });
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
