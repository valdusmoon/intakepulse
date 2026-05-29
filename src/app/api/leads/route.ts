import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCompanyByClerkId } from "@/lib/db/queries/companies";
import { getLeadsByCompany, createLead, updateLead } from "@/lib/db/queries/leads";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";
import { runAiPhotoSummary } from "@/lib/leads/estimate";
import { createLeadPhoto } from "@/lib/db/queries/lead-photos";
import { hasActiveSubscription } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "25"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const leads = await getLeadsByCompany(company.id, { status, search, limit, offset });

  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { hasAccess, reason } = await hasActiveSubscription(userId);
  if (!hasAccess) return NextResponse.json({ error: reason ?? "Subscription required" }, { status: 403 });

  const company = await getCompanyByClerkId(userId);
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  const body = await req.json();
  const { homeownerName, homeownerPhone, homeownerEmail, address, serviceType, description, timeline, notes, photoUrls = [], generateSummary = false } = body;

  if (!homeownerName?.trim() || !homeownerPhone?.trim()) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const phoneResult = validateAndNormalizePhone(homeownerPhone);
  if (!phoneResult.isValid) {
    return NextResponse.json({ error: phoneResult.error }, { status: 422 });
  }

  // Email optional for manual leads but validate if provided
  let normalizedEmail: string | null = null;
  if (homeownerEmail?.trim()) {
    const emailResult = validateAndNormalizeEmail(homeownerEmail);
    if (!emailResult.isValid) {
      return NextResponse.json({ error: emailResult.error }, { status: 422 });
    }
    normalizedEmail = emailResult.normalized!;
  }

  const lead = await createLead({
    companyId: company.id,
    homeownerName: homeownerName.trim(),
    homeownerPhone: phoneResult.normalized!,
    homeownerEmail: normalizedEmail,
    address: address?.trim() || null,
    serviceType: serviceType || null,
    description: description?.trim() || null,
    preferredTimeline: timeline || null,
    notes: notes?.trim() || null,
  });

  // Save photo URLs and optionally generate AI photo summary
  if ((photoUrls as string[]).length > 0) {
    const cappedPhotos = (photoUrls as string[]).slice(0, 5);

    // Persist to lead_photos table
    await Promise.allSettled(
      cappedPhotos.map((url) => createLeadPhoto({ leadId: lead.id, photoUrl: url, photoType: "room" }))
    );

    if (generateSummary) {
      try {
        const result = await runAiPhotoSummary(
          description?.trim() || "",
          serviceType || undefined,
          cappedPhotos
        );
        if (result) {
          await updateLead(lead.id, { aiPhotoSummary: result.summary });
        }
      } catch (err) {
        console.error("AI photo summary failed for manual lead:", lead.id, err);
      }
    }
  }

  return NextResponse.json(lead, { status: 201 });
}
