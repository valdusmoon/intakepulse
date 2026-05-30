import { NextRequest, NextResponse } from "next/server";
import { getCompanyById } from "@/lib/db/queries/companies";
import { createLead } from "@/lib/db/queries/leads";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";
import { isCompanySubscriptionActive } from "@/lib/subscription";

// ─── POST — create lead (partial or full) ─────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // Rate limiting replaced with Upstash Redis in Session 4
  void ip;

  try {
    const body = await req.json();
    const { companyId, contact, serviceType, description, timeline, smsConsent } = body;

    if (!companyId || !contact?.name || !contact?.phone || !contact?.email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate phone
    const phoneResult = validateAndNormalizePhone(contact.phone);
    if (!phoneResult.isValid) {
      return NextResponse.json({ error: phoneResult.error }, { status: 422 });
    }

    // Validate email
    const emailResult = validateAndNormalizeEmail(contact.email);
    if (!emailResult.isValid) {
      return NextResponse.json({ error: emailResult.error }, { status: 422 });
    }

    const company = await getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (!isCompanySubscriptionActive(company)) {
      return NextResponse.json({ error: "This quote form is temporarily unavailable." }, { status: 403 });
    }

    // Create lead
    const lead = await createLead({
      companyId,
      homeownerName: contact.name.trim(),
      homeownerEmail: emailResult.normalized!,
      homeownerPhone: phoneResult.normalized!,
      address: contact.address?.trim() || null,
      serviceType: serviceType ?? null,
      description: description?.trim() || null,
      preferredTimeline: timeline ?? null,
      smsConsent: smsConsent === true,
    });

return NextResponse.json({ leadId: lead.id });
  } catch (err) {
    console.error("Public lead submission error:", err);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
