import { NextResponse } from "next/server";
import { suppressEmail } from "@/lib/db/queries/emailSuppressions";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * Public CAN-SPAM unsubscribe endpoint.
 *
 * GET  — the link in a marketing footer. Verifies the signed token, suppresses
 *        the address, and returns a small confirmation page.
 * POST — RFC 8058 one-click (List-Unsubscribe-Post). Mail providers POST here
 *        directly; suppress and return 200 with no body.
 *
 * Public route (see middleware allow-list): no auth, the signed token is the
 * authorization. Suppression is idempotent, so replays are harmless.
 */

function page(title: string, message: string, status: number) {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
</head>
<body style="margin:0;background:#eef1f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:440px;margin:64px auto;background:#fff;border-radius:14px;padding:32px 28px;box-shadow:0 4px 24px rgba(16,24,40,.08);text-align:center;">
    <div style="font-size:16px;font-weight:800;color:#2454d8;letter-spacing:-0.2px;margin-bottom:16px;">Callverted</div>
    <h1 style="font-size:19px;color:#111827;margin:0 0 8px;">${title}</h1>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0;">${message}</p>
  </div>
</body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const email = token ? verifyUnsubscribeToken(token) : null;

  if (!email) {
    return page(
      "Link not valid",
      "This unsubscribe link is invalid or has expired. If you keep receiving emails you did not sign up for, reply to any message and we will remove you.",
      400
    );
  }

  try {
    await suppressEmail(email, "unsubscribe_link");
  } catch (error) {
    logger.error("Unsubscribe failed to record suppression", { error: String(error) });
    return page(
      "Something went wrong",
      "We could not process your request right now. Please try again in a moment, or reply to any email and we will remove you.",
      500
    );
  }

  logger.info("Email unsubscribed via link");
  return page(
    "You are unsubscribed",
    "You will no longer receive marketing emails from Callverted. Account and billing notices may still be sent while you have an active account.",
    200
  );
}

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const email = token ? verifyUnsubscribeToken(token) : null;

  if (!email) {
    return new NextResponse("Invalid token", { status: 400 });
  }

  try {
    await suppressEmail(email, "one_click");
  } catch (error) {
    logger.error("One-click unsubscribe failed to record suppression", { error: String(error) });
    return new NextResponse("Error", { status: 500 });
  }

  logger.info("Email unsubscribed via one-click");
  return new NextResponse(null, { status: 200 });
}
