import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLead } from "@/lib/db/queries/leads";
import { getCompanyById } from "@/lib/db/queries/companies";
import { createLeadPhoto } from "@/lib/db/queries/lead-photos";
import { validateAndNormalizePhone } from "@/lib/utils/phone-validation";
import { validateAndNormalizeEmail } from "@/lib/utils/email-validation";
import { checkRateLimit, runAiPhotoSummary } from "@/lib/leads/estimate";
import { sendNewLeadNotification, sendHomeownerConfirmation } from "@/lib/email/notifications";
import { sendSms, smsNewLead } from "@/lib/sms";

// GET — fetch contact info for pre-filling the quote form
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const { leadId } = await params;
  const lead = await getLeadById(leadId);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return only what the form needs — no sensitive internal fields
  return NextResponse.json({
    name: lead.homeownerName,
    phone: lead.homeownerPhone,
    email: lead.homeownerEmail ?? "",
    address: lead.address ?? "",
  });
}

// PATCH — update contact info and/or project details
// Called in two scenarios:
//   1. Homeowner edits contact info (back button) — contact fields only, no runEstimate
//   2. Project form submitted — project fields + runEstimate: true

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const { leadId } = await params;

  try {
    const body = await req.json();
    const { name, phone, email, address, serviceType, description, timeline, photoUrls = [], generateSummary = false, finalize = false, estimateLow, estimateHigh, estimateConfidence, estimateAssumptions } = body;

    const lead = await getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Build update payload — only include fields present in body
    const updates: Parameters<typeof updateLead>[1] = {};

    if (name !== undefined) updates.homeownerName = name.trim();
    if (address !== undefined) updates.address = address?.trim() || null;
    if (serviceType !== undefined) updates.serviceType = serviceType;
    if (description !== undefined) updates.description = description?.trim() || null;
    if (timeline !== undefined) updates.preferredTimeline = timeline;

    if (phone !== undefined) {
      const phoneResult = validateAndNormalizePhone(phone);
      if (!phoneResult.isValid) {
        return NextResponse.json({ error: phoneResult.error }, { status: 422 });
      }
      updates.homeownerPhone = phoneResult.normalized!;
    }

    if (email !== undefined) {
      const emailResult = validateAndNormalizeEmail(email);
      if (!emailResult.isValid) {
        return NextResponse.json({ error: emailResult.error }, { status: 422 });
      }
      updates.homeownerEmail = emailResult.normalized!;
    }

    await updateLead(leadId, updates);

    // Finalize without AI (homeowner skipped the estimate)
    if (finalize) {
      if (!lead.confirmationSentAt) {
        const company = await getCompanyById(lead.companyId);
        if (company) {
          await updateLead(leadId, { confirmationSentAt: new Date() });
          const effectiveEmail = email ?? lead.homeownerEmail;
          const effectiveName = name?.trim() ?? lead.homeownerName;
          const effectiveAddress = address?.trim() || lead.address || undefined;
          const effectiveServiceType = serviceType || lead.serviceType || undefined;
          await Promise.allSettled([
            company.notificationPreferences?.newLead !== false
              ? sendNewLeadNotification({
                  painterEmail: company.ownerEmail,
                  painterName: company.ownerName,
                  businessName: company.businessName,
                  lead: {
                    id: leadId,
                    homeownerName: effectiveName,
                    homeownerPhone: updates.homeownerPhone ?? lead.homeownerPhone,
                    homeownerEmail: effectiveEmail ?? null,
                    address: effectiveAddress ?? null,
                    serviceType: effectiveServiceType ?? null,
                    description: description?.trim() || lead.description || null,
                    preferredTimeline: timeline ?? lead.preferredTimeline ?? null,
                    estimateLow: estimateLow ?? null,
                    estimateHigh: estimateHigh ?? null,
                    estimateConfidence: estimateConfidence ?? null,
                    estimateAssumptions: estimateAssumptions ?? [],
                  },
                })
              : Promise.resolve(),
            effectiveEmail
              ? sendHomeownerConfirmation({
                  homeownerEmail: effectiveEmail,
                  homeownerName: effectiveName,
                  businessName: company.businessName,
                  businessPhone: company.businessPhone ?? null,
                  estimate: estimateLow && estimateHigh ? { low: estimateLow, high: estimateHigh, assumptions: estimateAssumptions ?? [] } : null,
                })
              : Promise.resolve(),
            company.notificationPreferences?.smsNewLead !== false
              ? sendSms(company.ownerPhone, smsNewLead(effectiveName, updates.homeownerPhone ?? lead.homeownerPhone))
              : Promise.resolve(),
          ]);
        }
      }
      return NextResponse.json({ leadId, estimate: null });
    }

    // Generate AI photo summary if requested (photos → GPT writes condition notes for painter)
    if (generateSummary && (photoUrls as string[]).length > 0) {
      const cappedPhotos: string[] = (photoUrls as string[]).slice(0, 5);

      // Persist photo URLs to lead_photos table
      await Promise.allSettled(
        cappedPhotos.map((url) => createLeadPhoto({ leadId, photoUrl: url, photoType: "room" }))
      );

      const effectiveDescription = description?.trim() || lead.description || "";
      const effectiveServiceType = serviceType || lead.serviceType || undefined;
      const effectiveEmail = email ?? lead.homeownerEmail;
      const effectiveName = name?.trim() ?? lead.homeownerName;
      const effectiveAddress = address?.trim() || lead.address || undefined;

      try {
        const summaryResult = await runAiPhotoSummary(effectiveDescription, effectiveServiceType, cappedPhotos);
        if (summaryResult) {
          await updateLead(leadId, { aiPhotoSummary: summaryResult.summary });
        }
      } catch (aiErr) {
        console.error("AI photo summary failed for lead:", leadId, aiErr);
      }

      // Send notifications if not already sent
      if (!lead.confirmationSentAt) {
        const company = await getCompanyById(lead.companyId);
        if (company) {
          await updateLead(leadId, { confirmationSentAt: new Date() });
          await Promise.allSettled([
            company.notificationPreferences?.newLead !== false
              ? sendNewLeadNotification({
                  painterEmail: company.ownerEmail,
                  painterName: company.ownerName,
                  businessName: company.businessName,
                  lead: {
                    id: leadId,
                    homeownerName: effectiveName,
                    homeownerPhone: updates.homeownerPhone ?? lead.homeownerPhone,
                    homeownerEmail: effectiveEmail ?? null,
                    address: effectiveAddress ?? null,
                    serviceType: effectiveServiceType ?? null,
                    description: effectiveDescription || null,
                    preferredTimeline: timeline ?? lead.preferredTimeline ?? null,
                    estimateLow: estimateLow ?? null,
                    estimateHigh: estimateHigh ?? null,
                    estimateConfidence: estimateConfidence ?? null,
                    estimateAssumptions: estimateAssumptions ?? [],
                  },
                })
              : Promise.resolve(),
            effectiveEmail
              ? sendHomeownerConfirmation({
                  homeownerEmail: effectiveEmail,
                  homeownerName: effectiveName,
                  businessName: company.businessName,
                  businessPhone: company.businessPhone ?? null,
                  estimate: estimateLow && estimateHigh ? { low: estimateLow, high: estimateHigh, assumptions: estimateAssumptions ?? [] } : null,
                })
              : Promise.resolve(),
            company.notificationPreferences?.smsNewLead !== false
              ? sendSms(company.ownerPhone, smsNewLead(effectiveName, updates.homeownerPhone ?? lead.homeownerPhone))
              : Promise.resolve(),
          ]);
        }
      }

      return NextResponse.json({ leadId });
    }

    return NextResponse.json({ leadId });
  } catch (err) {
    console.error("Lead PATCH error:", err);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
