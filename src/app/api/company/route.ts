import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createCompany, getCompanyByClerkId, updateCompany } from "@/lib/db/queries/companies";
import { sendSignupNotification, sendWelcomeEmail } from "@/lib/email/notifications";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  return NextResponse.json(company);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { businessName, ownerName, ownerEmail, ownerPhone, serviceArea, defaultSqftRate } = body;

  if (!businessName || !ownerName || !ownerPhone) {
    return NextResponse.json({ error: "businessName, ownerName, and ownerPhone are required" }, { status: 400 });
  }

  const phoneResult = validateAndNormalizePhone(ownerPhone);
  if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });

  const emailResult = validateAndNormalizeEmail(ownerEmail ?? "");
  if (!emailResult.isValid) return NextResponse.json({ error: emailResult.error }, { status: 422 });

  // If company already exists for this user (e.g. double-submit), return it
  const existing = await getCompanyByClerkId(userId);
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const company = await createCompany({
    clerkUserId: userId,
    businessName,
    ownerName,
    ownerEmail: emailResult.normalized!,
    ownerPhone: phoneResult.normalized!,
    serviceArea: serviceArea ?? null,
    defaultSqftRate: defaultSqftRate ?? null,
    onboardingCompleted: true,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://intakepulse.com";
  const quoteUrl = `${appUrl}/intake/${company.id}`;

  sendSignupNotification({ businessName, ownerName, ownerEmail: ownerEmail ?? "", ownerPhone });
  sendWelcomeEmail({ ownerName, ownerEmail: ownerEmail ?? "", businessName, quoteUrl });

  return NextResponse.json(company, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const body = await req.json();

  if (body.ownerPhone) {
    const phoneResult = validateAndNormalizePhone(body.ownerPhone);
    if (!phoneResult.isValid) return NextResponse.json({ error: phoneResult.error }, { status: 422 });
    body.ownerPhone = phoneResult.normalized;
  }

  // Only allow known fields through — prevents overwriting billing/auth fields
  const allowed = [
    "businessName", "ownerName", "ownerPhone", "businessPhone", "businessEmail",
    "serviceArea", "websiteUrl", "googleReviewUrl", "defaultSqftRate", "paintTier", "notificationPreferences",
  ] as const;
  const safeBody = Object.fromEntries(
    allowed.filter((k) => k in body).map((k) => [k, body[k]])
  );

  const updated = await updateCompany(company.id, safeBody);
  return NextResponse.json(updated);
}
