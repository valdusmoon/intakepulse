import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createBusiness, getBusinessByClerkId, updateBusiness } from "@/lib/db/queries/businesses";
import { sendSignupNotification, sendWelcomeEmail } from "@/lib/email/notifications";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";

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
  const {
    businessName, ownerName, ownerEmail, ownerPhone,
    serviceArea, forwardingNumber, callTimeoutSeconds,
  } = body;

  if (!businessName || !ownerName || !ownerPhone) {
    return NextResponse.json(
      { error: "businessName, ownerName, and ownerPhone are required" },
      { status: 400 }
    );
  }

  const phoneResult = validateAndNormalizePhone(ownerPhone);
  if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });

  const emailResult = validateAndNormalizeEmail(ownerEmail ?? "");
  if (ownerEmail && !emailResult.isValid) {
    return NextResponse.json({ error: emailResult.error }, { status: 422 });
  }

  const existing = await getBusinessByClerkId(userId);

  if (existing) {
    // Onboarding re-submit or update — upsert with real data
    const updated = await updateBusiness(existing.id, {
      businessName,
      ownerName,
      ownerEmail: emailResult.normalized ?? existing.ownerEmail,
      ownerPhone: phoneResult.normalized!,
      serviceArea: serviceArea ?? null,
      forwardingNumber: forwardingNumber ?? null,
      callTimeoutSeconds: callTimeoutSeconds ?? 20,
      onboardingCompleted: true,
    });
    return NextResponse.json(updated, { status: 200 });
  }

  const business = await createBusiness({
    clerkUserId: userId,
    businessName,
    ownerName,
    ownerEmail: emailResult.normalized ?? ownerEmail ?? "",
    ownerPhone: phoneResult.normalized!,
    serviceArea: serviceArea ?? null,
    forwardingNumber: forwardingNumber ?? null,
    callTimeoutSeconds: callTimeoutSeconds ?? 20,
    onboardingCompleted: true,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://intakepulse.com";
  const dashboardUrl = `${appUrl}/dashboard`;

  void sendSignupNotification({ businessName, ownerName, ownerEmail: ownerEmail ?? "", ownerPhone });
  void sendWelcomeEmail({ ownerName, ownerEmail: ownerEmail ?? "", businessName, dashboardUrl });

  return NextResponse.json(business, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const business = await getBusinessByClerkId(userId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const body = await req.json();

  if (body.ownerPhone) {
    const phoneResult = validateAndNormalizePhone(body.ownerPhone);
    if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });
    body.ownerPhone = phoneResult.normalized;
  }

  if (body.forwardingNumber) {
    const phoneResult = validateAndNormalizePhone(body.forwardingNumber);
    if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });
    body.forwardingNumber = phoneResult.normalized;
  }

  const allowed = [
    "businessName", "ownerName", "ownerPhone", "ownerEmail",
    "serviceArea", "websiteUrl", "timezone",
    "telnyxPhoneNumber", "forwardingNumber", "callTimeoutSeconds",
    "missedCallSmsTemplate", "notificationPreferences",
  ] as const;
  const safeBody = Object.fromEntries(
    allowed.filter((k) => k in body).map((k) => [k, body[k]])
  );

  const updated = await updateBusiness(business.id, safeBody);
  return NextResponse.json(updated);
}
